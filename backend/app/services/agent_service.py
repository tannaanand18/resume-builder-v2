import json
import os
import re
from datetime import datetime

from groq import Groq

from app.extensions import db
from app.models.certification import Certification
from app.models.education import Education
from app.models.experience import Experience
from app.models.project import Project
from app.models.resume import Resume
from app.models.skills import Skill
from app.services.ai_service import (
    generate_experience_description,
    generate_project_description,
    generate_summary,
)


AGENT_SYSTEM_PROMPT = """You are an intelligent AI Resume Assistant integrated into ResumeAI,
a professional resume builder platform. You have FULL ACCESS to the user's 
resume data, dashboard, and all resume sections.

IMPORTANT: When user asks "can you see my dashboard" or "what resumes do I have" 
or any question about their data - you DO have access! Use the resume context 
provided to answer accurately.

Your FULL capabilities:
1. See and answer questions about ALL user resumes and dashboard data
2. Create complete resumes from a single description
3. Add/update/delete any resume section (skills, projects, experience, education, certifications)
4. Generate AI-powered content (summaries, descriptions)
5. Check ATS scores against job descriptions
6. Parse LinkedIn profile text into a complete resume
7. Suggest improvements to existing resumes
8. Switch resume templates
9. Download resume links

WHEN USER ASKS ABOUT THEIR DATA:
- "can you see my dashboard?" → YES! Tell them what resumes you can see
- "what skills do I have?" → List skills from resume context
- "how many resumes do I have?" → Count from context
- "show my experience" → List experiences from context
- Always use the resume_context data provided to answer

WHEN USER ASKS YOU TO DO SOMETHING:
- Confirm what you are about to do
- Do it immediately
- Confirm what was done
- Ask if they need anything else

COMMANDS YOU UNDERSTAND:
- "Add skill: Python (Advanced)" → adds skill
- "Add project: Title using React" → adds project  
- "Create resume for Software Engineer" → creates full resume
- "Check ATS for [job description]" → runs ATS check
- "Update my summary" → generates new summary
- "Switch to modern template" → changes template

Always be helpful, professional, and concise.
Format responses with bullet points when listing items.
Make all resume content ATS-friendly and professional.
Never say you don't have access - you DO have full access to user data."""


def _client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set")
    return Groq(api_key=api_key)


def _clean_json(text):
    clean = (text or "").replace("```json", "").replace("```", "").strip()
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        clean = clean[start:end]
    return json.loads(clean)


def _verify_resume(resume_id, user_id):
    if not resume_id:
        return None
    return Resume.query.filter_by(id=int(resume_id), user_id=int(user_id)).first()


def _resume_url(resume_id):
    return f"/resume/{resume_id}/edit"


def get_resume_data(resume_id, user_id):
    resume = _verify_resume(resume_id, user_id)
    if not resume:
        return None

    return {
        "resume": resume.to_dict(),
        "experiences": [item.to_dict() for item in Experience.query.filter_by(resume_id=resume.id).all()],
        "educations": [item.to_dict() for item in Education.query.filter_by(resume_id=resume.id).all()],
        "skills": [item.to_dict() for item in Skill.query.filter_by(resume_id=resume.id).all()],
        "projects": [item.to_dict() for item in Project.query.filter_by(resume_id=resume.id).all()],
        "certifications": [item.to_dict() for item in Certification.query.filter_by(resume_id=resume.id).all()],
    }


def _create_resume(user_id, data):
    resume = Resume(
        user_id=int(user_id),
        title=data.get("title") or "AI Generated Resume",
        summary=data.get("summary"),
        full_name=data.get("full_name"),
        professional_title=data.get("professional_title"),
        email=data.get("email"),
        phone=data.get("phone"),
        location=data.get("location"),
        linkedin=data.get("linkedin"),
        website=data.get("website"),
        template_name=data.get("template_name") or "modern",
        template_style=data.get("template_style"),
    )
    db.session.add(resume)
    db.session.flush()
    return resume


def add_skill(resume_id, user_id, skill_name, level="Intermediate"):
    resume = _verify_resume(resume_id, user_id)
    if not resume:
        raise ValueError("Resume not found")

    skill = Skill(
        resume_id=resume.id,
        skill_name=(skill_name or "").strip(),
        level=(level or "Intermediate").strip(),
    )
    if not skill.skill_name:
        raise ValueError("Skill name is required")

    db.session.add(skill)
    db.session.flush()
    return skill.to_dict()


def add_project(resume_id, user_id, title, description="", tech_stack="", link=""):
    resume = _verify_resume(resume_id, user_id)
    if not resume:
        raise ValueError("Resume not found")

    project_title = (title or "").strip()
    if not project_title:
        raise ValueError("Project title is required")

    if not description:
        try:
            description = generate_project_description({"title": project_title, "tech_stack": tech_stack})
        except Exception:
            description = ""

    project = Project(
        resume_id=resume.id,
        project_title=project_title[:255],
        description=description or None,
        tech_stack=tech_stack or None,
        link=link or None,
    )
    db.session.add(project)
    db.session.flush()
    return project.to_dict()


def add_experience(resume_id, user_id, company, role, start_date="", end_date="", description=""):
    resume = _verify_resume(resume_id, user_id)
    if not resume:
        raise ValueError("Resume not found")

    company = (company or "Company").strip()
    role = (role or resume.professional_title or "Professional").strip()
    start_date = (start_date or "2024").strip()
    end_date = (end_date or "Present").strip()

    if not description:
        try:
            description = generate_experience_description({
                "company": company,
                "role": role,
                "start_date": start_date,
                "end_date": end_date,
            })
        except Exception:
            description = ""

    experience = Experience(
        resume_id=resume.id,
        company=company,
        role=role,
        start_date=start_date,
        end_date=end_date,
        description=description,
    )
    db.session.add(experience)
    db.session.flush()
    return experience.to_dict()


def add_education(resume_id, user_id, degree, institution, start_year=None, end_year=None, score=None):
    resume = _verify_resume(resume_id, user_id)
    if not resume:
        raise ValueError("Resume not found")

    education = Education(
        resume_id=resume.id,
        degree=(degree or "Degree").strip(),
        institution=(institution or "Institution").strip(),
        start_year=_year_or_default(start_year),
        end_year=_year_or_none(end_year),
        score=score,
    )
    db.session.add(education)
    db.session.flush()
    return education.to_dict()


def add_certification(resume_id, user_id, title, organization="", issue_year=""):
    resume = _verify_resume(resume_id, user_id)
    if not resume:
        raise ValueError("Resume not found")

    certification = Certification(
        resume_id=resume.id,
        title=(title or "Certification").strip(),
        organization=(organization or "").strip() or None,
        issue_year=str(issue_year or "").strip() or None,
    )
    db.session.add(certification)
    db.session.flush()
    return certification.to_dict()


def update_summary(resume_id, user_id):
    resume = _verify_resume(resume_id, user_id)
    if not resume:
        raise ValueError("Resume not found")

    summary = generate_summary({
        "full_name": resume.full_name or "",
        "professional_title": resume.professional_title or resume.title or "",
    })
    resume.summary = summary
    db.session.flush()
    return {"summary": summary}


def check_ats(resume_id, user_id, job_description=""):
    resume_data = get_resume_data(resume_id, user_id)
    if not resume_data:
        raise ValueError("Resume not found")

    resume_text = _resume_to_text(resume_data)
    prompt = f"""Analyze this resume for ATS quality and job match.

Job description:
{job_description or "General professional resume quality check"}

Resume:
{resume_text}

Return ONLY JSON:
{{
  "score": 0,
  "strengths": ["item"],
  "improvements": ["item"],
  "missing_keywords": ["keyword"],
  "summary": "short assessment"
}}"""
    completion = _client().chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are an ATS resume analyst. Return strict JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=700,
    )
    return _clean_json(completion.choices[0].message.content)


def create_full_resume(user_id, resume_data):
    resume = _create_resume(user_id, resume_data)

    for skill in resume_data.get("skills", [])[:30]:
        add_skill(resume.id, user_id, skill.get("name") or skill.get("skill_name"), skill.get("level", "Intermediate"))

    for project in resume_data.get("projects", [])[:10]:
        add_project(
            resume.id,
            user_id,
            project.get("title") or project.get("project_title"),
            project.get("description", ""),
            project.get("tech_stack", ""),
            project.get("link", ""),
        )

    for exp in resume_data.get("experiences", [])[:10]:
        add_experience(
            resume.id,
            user_id,
            exp.get("company"),
            exp.get("role"),
            exp.get("start_date", ""),
            exp.get("end_date", "Present"),
            exp.get("description", ""),
        )

    for edu in resume_data.get("educations", [])[:8]:
        add_education(
            resume.id,
            user_id,
            edu.get("degree"),
            edu.get("institution"),
            edu.get("start_year"),
            edu.get("end_year"),
            edu.get("score"),
        )

    for cert in resume_data.get("certifications", [])[:10]:
        add_certification(
            resume.id,
            user_id,
            cert.get("title") or cert.get("name"),
            cert.get("organization") or cert.get("issuer", ""),
            cert.get("issue_year") or cert.get("issue_date", ""),
        )

    if not resume.summary:
        try:
            resume.summary = generate_summary({
                "full_name": resume.full_name or "",
                "professional_title": resume.professional_title or resume.title or "",
            })
        except Exception:
            resume.summary = resume_data.get("summary")

    db.session.flush()
    return get_resume_data(resume.id, user_id)


def handle_agent_message(user_id, message, resume_id=None, conversation_history=None, context=None):
    message = (message or "").strip()
    if not message:
        return {"message": "Please type a message for the assistant.", "actions_taken": [], "data": {}}

    conversation_history = conversation_history or []
    context = context or {}
    active_resume_id = resume_id or _latest_resume_id(user_id)
    actions_taken = []

    try:
        quick = _handle_quick_command(user_id, message, active_resume_id, actions_taken)
        if quick:
            db.session.commit()
            return quick

        resume_context = get_resume_data(active_resume_id, user_id) if active_resume_id else None
        intent = _classify_intent(message, resume_context, conversation_history, context)
        response = _execute_intent(user_id, active_resume_id, message, intent, actions_taken, resume_context)
        db.session.commit()
        return response
    except Exception as exc:
        db.session.rollback()
        return {
            "message": f"I could not complete that yet: {str(exc)}",
            "actions_taken": actions_taken,
            "data": {"error": str(exc)},
        }


def _handle_quick_command(user_id, message, resume_id, actions_taken):
    lower = message.lower()

    skill_match = re.match(r"^\s*add\s+skill\s*:\s*(.+)$", message, re.I)
    if skill_match:
        if not resume_id:
            raise ValueError("Open or create a resume first so I know where to add the skill.")
        skill_text = skill_match.group(1).strip()
        level_match = re.match(r"(.+?)\s*\((.+?)\)\s*$", skill_text)
        name = level_match.group(1).strip() if level_match else skill_text
        level = level_match.group(2).strip() if level_match else "Intermediate"
        skill = add_skill(resume_id, user_id, name, level)
        actions_taken.append(f"Added skill: {skill['skill_name']} ({skill['level']})")
        return {
            "message": f"Done. I added {skill['skill_name']} as a {skill['level']} skill.",
            "actions_taken": actions_taken,
            "data": {"skill": skill, "resume_id": resume_id},
        }

    project_match = re.match(r"^\s*add\s+project\s*:\s*(.+)$", message, re.I)
    if project_match:
        if not resume_id:
            raise ValueError("Open or create a resume first so I know where to add the project.")
        project_text = project_match.group(1).strip()
        title, tech_stack = _split_project_text(project_text)
        project = add_project(resume_id, user_id, title, "", tech_stack)
        actions_taken.append(f"Added project: {project['project_title']}")
        return {
            "message": f"Done. I added the project {project['project_title']} to your resume.",
            "actions_taken": actions_taken,
            "data": {"project": project, "resume_id": resume_id},
        }

    if "linkedin.com/in/" in lower and "create" in lower:
        return {
            "message": (
                "LinkedIn blocks direct scraping, so please paste your LinkedIn profile text here. "
                "I will parse your name, title, experience, education, skills, projects, and certifications, then create the resume."
            ),
            "actions_taken": [],
            "data": {"needs_linkedin_profile_text": True},
        }

    if "download" in lower and "resume" in lower:
        if not resume_id:
            raise ValueError("Open a resume first so I can prepare the download link.")
        actions_taken.append("Prepared resume download link")
        return {
            "message": "Here is your resume download link.",
            "actions_taken": actions_taken,
            "data": {"download_url": f"/api/resume/download/{resume_id}", "resume_id": resume_id},
        }

    if "switch to" in lower and "template" in lower:
        if not resume_id:
            raise ValueError("Open a resume first so I know which template to update.")
        template = "modern" if "modern" in lower else "creative" if "creative" in lower else "simple"
        resume = _verify_resume(resume_id, user_id)
        resume.template_name = template
        actions_taken.append(f"Switched template to {template}")
        return {
            "message": f"Done. I switched this resume to the {template} template.",
            "actions_taken": actions_taken,
            "data": {"resume_id": resume_id, "template_name": template},
        }

    return None


def _classify_intent(message, resume_context, conversation_history, context):
    prompt = f"""Classify the user's resume assistant request and extract data.

Return ONLY JSON with this shape:
{{
  "intent": "answer_question|create_resume|add_skill|add_project|add_experience|add_education|add_certification|update_summary|check_ats|switch_template|parse_linkedin_text|general_chat",
  "needs_resume": true,
  "resume_data": {{}},
  "skill": {{"name": "", "level": ""}},
  "project": {{"title": "", "description": "", "tech_stack": "", "link": ""}},
  "experience": {{"company": "", "role": "", "start_date": "", "end_date": "", "description": ""}},
  "education": {{"degree": "", "institution": "", "start_year": "", "end_year": "", "score": ""}},
  "certification": {{"title": "", "organization": "", "issue_year": ""}},
  "job_description": "",
  "template_name": "",
  "answer": ""
}}

If the user pasted LinkedIn profile text, use intent parse_linkedin_text and fill resume_data.
If creating a resume from a short prompt, infer professional ATS-friendly sections.

Current resume context:
{json.dumps(resume_context or {}, default=str)[:9000]}

Recent conversation:
{json.dumps(conversation_history[-8:], default=str)[:4000]}

Page context:
{json.dumps(context, default=str)[:2000]}

User message:
{message}"""
    try:
        completion = _client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": AGENT_SYSTEM_PROMPT + "\nReturn strict JSON for classification."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=1600,
        )
        return _clean_json(completion.choices[0].message.content)
    except Exception:
        return {"intent": "general_chat", "answer": ""}


def _execute_intent(user_id, resume_id, message, intent, actions_taken, resume_context):
    name = (intent.get("intent") or "general_chat").strip()

    if name in {"create_resume", "parse_linkedin_text"}:
        resume_data = intent.get("resume_data") or {}
        if not resume_data.get("title"):
            resume_data["title"] = _title_from_message(message)
        created = create_full_resume(user_id, resume_data)
        new_id = created["resume"]["id"]
        actions_taken.append(f"Created resume #{new_id}")
        return {
            "message": f"Done. I created a new resume and filled the available sections. You can edit it here: {_resume_url(new_id)}",
            "actions_taken": actions_taken,
            "data": {"resume_id": new_id, "resume": created, "edit_url": _resume_url(new_id)},
        }

    if name == "add_skill":
        _require_resume(resume_id)
        skill_data = intent.get("skill") or {}
        skill = add_skill(resume_id, user_id, skill_data.get("name"), skill_data.get("level") or "Intermediate")
        actions_taken.append(f"Added skill: {skill['skill_name']}")
        return {"message": f"Done. I added {skill['skill_name']} to your skills.", "actions_taken": actions_taken, "data": {"skill": skill}}

    if name == "add_project":
        _require_resume(resume_id)
        project_data = intent.get("project") or {}
        project = add_project(
            resume_id,
            user_id,
            project_data.get("title"),
            project_data.get("description", ""),
            project_data.get("tech_stack", ""),
            project_data.get("link", ""),
        )
        actions_taken.append(f"Added project: {project['project_title']}")
        return {"message": f"Done. I added {project['project_title']} to your projects.", "actions_taken": actions_taken, "data": {"project": project}}

    if name == "add_experience":
        _require_resume(resume_id)
        exp_data = intent.get("experience") or {}
        exp = add_experience(
            resume_id,
            user_id,
            exp_data.get("company"),
            exp_data.get("role"),
            exp_data.get("start_date", ""),
            exp_data.get("end_date", "Present"),
            exp_data.get("description", ""),
        )
        actions_taken.append(f"Added experience: {exp['role']} at {exp['company']}")
        return {"message": f"Done. I added {exp['role']} at {exp['company']} to your experience.", "actions_taken": actions_taken, "data": {"experience": exp}}

    if name == "add_education":
        _require_resume(resume_id)
        edu_data = intent.get("education") or {}
        edu = add_education(
            resume_id,
            user_id,
            edu_data.get("degree"),
            edu_data.get("institution"),
            edu_data.get("start_year"),
            edu_data.get("end_year"),
            edu_data.get("score"),
        )
        actions_taken.append(f"Added education: {edu['degree']}")
        return {"message": f"Done. I added {edu['degree']} to your education.", "actions_taken": actions_taken, "data": {"education": edu}}

    if name == "add_certification":
        _require_resume(resume_id)
        cert_data = intent.get("certification") or {}
        cert = add_certification(
            resume_id,
            user_id,
            cert_data.get("title"),
            cert_data.get("organization", ""),
            cert_data.get("issue_year", ""),
        )
        actions_taken.append(f"Added certification: {cert['title']}")
        return {"message": f"Done. I added {cert['title']} to your certifications.", "actions_taken": actions_taken, "data": {"certification": cert}}

    if name == "update_summary":
        _require_resume(resume_id)
        summary = update_summary(resume_id, user_id)
        actions_taken.append("Updated resume summary")
        return {"message": "Done. I generated and saved a new professional summary.", "actions_taken": actions_taken, "data": summary}

    if name == "check_ats":
        _require_resume(resume_id)
        result = check_ats(resume_id, user_id, intent.get("job_description") or message)
        actions_taken.append("Ran ATS analysis")
        return {
            "message": _format_ats_message(result),
            "actions_taken": actions_taken,
            "data": {"ats": result},
        }

    if name == "switch_template":
        _require_resume(resume_id)
        template = (intent.get("template_name") or "modern").lower()
        if template not in {"simple", "modern", "creative"}:
            template = "modern"
        resume = _verify_resume(resume_id, user_id)
        resume.template_name = template
        actions_taken.append(f"Switched template to {template}")
        return {"message": f"Done. I switched this resume to the {template} template.", "actions_taken": actions_taken, "data": {"template_name": template}}

    answer = intent.get("answer") or _answer_question(message, resume_context)
    return {"message": answer, "actions_taken": actions_taken, "data": {"resume_id": resume_id, "resume_context": resume_context}}


def _answer_question(message, resume_context):
    lower = message.lower()

    # Dashboard/access questions
    if any(word in lower for word in ["dashboard", "can you see", "do you have access", "what do you see"]):
        if not resume_context:
            return "Yes! I have full access to your ResumeAI account. I can see your dashboard but you don't have any resumes yet. Would you like me to create one?"
        resume = resume_context.get("resume", {})
        skills_count = len(resume_context.get("skills", []))
        projects_count = len(resume_context.get("projects", []))
        exp_count = len(resume_context.get("experiences", []))
        return f"""Yes! I have full access to your dashboard. Here is what I can see:

📄 **Active Resume:** {resume.get("title", "Untitled")}
👤 **Name:** {resume.get("full_name", "Not set")}
💼 **Title:** {resume.get("professional_title", "Not set")}
🔧 **Skills:** {skills_count} added
📁 **Projects:** {projects_count} added
💼 **Experience:** {exp_count} entries

What would you like me to do?"""

    if not resume_context:
        return "I don't see an active resume yet. Would you like me to create one for you? Just tell me your profession and I'll build a complete resume!"

    if "skill" in lower:
        skills = resume_context.get("skills", [])
        if not skills:
            return "You have not added any skills to this resume yet. Want me to add some? Just say: Add skill: Python (Advanced)"
        items = [f"- {s.get('skill_name')} ({s.get('level') or 'Intermediate'})" for s in skills]
        return "Your skills are:\n" + "\n".join(items)

    if "how many" in lower and "project" in lower:
        count = len(resume_context.get("projects", []))
        return f"You have added {count} project{'s' if count != 1 else ''} to this resume."

    if "experience" in lower or "work" in lower:
        experiences = resume_context.get("experiences", [])
        if not experiences:
            return "No work experience added yet. Want me to add some?"
        items = [f"- {e.get('role')} at {e.get('company')}" for e in experiences]
        return "Your work experience:\n" + "\n".join(items)

    if "education" in lower:
        educations = resume_context.get("educations", [])
        if not educations:
            return "No education added yet. Want me to add some?"
        items = [f"- {e.get('degree')} from {e.get('institution')}" for e in educations]
        return "Your education:\n" + "\n".join(items)

    if "certification" in lower or "certificate" in lower:
        certs = resume_context.get("certifications", [])
        if not certs:
            return "No certifications added yet. Want me to add some?"
        items = [f"- {c.get('title')} from {c.get('organization', 'N/A')}" for c in certs]
        return "Your certifications:\n" + "\n".join(items)

    if "summary" in lower:
        resume = resume_context.get("resume", {})
        summary = resume.get("summary")
        if not summary:
            return "No summary yet. Want me to generate one? Just say: Update my summary"
        return f"Your current summary:\n\n{summary}"

    prompt = f"""Answer the user's question using only this resume context. Be concise.

Resume context:
{json.dumps(resume_context, default=str)[:9000]}

Question:
{message}"""
    completion = _client().chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": AGENT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=600,
    )
    return completion.choices[0].message.content.strip()


def _resume_to_text(resume_data):
    resume = resume_data.get("resume", {})
    parts = [
        resume.get("full_name", ""),
        resume.get("professional_title", ""),
        resume.get("summary", ""),
        "Skills: " + ", ".join([s.get("skill_name", "") for s in resume_data.get("skills", [])]),
    ]
    for exp in resume_data.get("experiences", []):
        parts.append(f"{exp.get('role')} at {exp.get('company')}: {exp.get('description')}")
    for project in resume_data.get("projects", []):
        parts.append(f"{project.get('project_title')}: {project.get('description')} {project.get('tech_stack')}")
    for edu in resume_data.get("educations", []):
        parts.append(f"{edu.get('degree')} at {edu.get('institution')}")
    for cert in resume_data.get("certifications", []):
        parts.append(f"{cert.get('title')} from {cert.get('organization')}")
    return "\n".join([str(part) for part in parts if part])


def _format_ats_message(result):
    score = result.get("score", "N/A")
    improvements = result.get("improvements") or []
    missing = result.get("missing_keywords") or []
    lines = [f"ATS score: {score}/100"]
    if result.get("summary"):
        lines.append(result["summary"])
    if improvements:
        lines.append("\nImprovements:")
        lines.extend([f"- {item}" for item in improvements[:5]])
    if missing:
        lines.append("\nMissing keywords:")
        lines.extend([f"- {item}" for item in missing[:8]])
    return "\n".join(lines)


def _latest_resume_id(user_id):
    resume = (
        Resume.query.filter_by(user_id=int(user_id))
        .order_by(Resume.updated_at.desc(), Resume.created_at.desc())
        .first()
    )
    return resume.id if resume else None


def _require_resume(resume_id):
    if not resume_id:
        raise ValueError("Open a resume first, or ask me to create a new resume.")


def _split_project_text(text):
    match = re.match(r"(.+?)\s+using\s+(.+)$", text, re.I)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return text.strip(), ""


def _title_from_message(message):
    match = re.search(r"resume\s+for\s+(.+)$", message, re.I)
    title = match.group(1).strip() if match else "AI Generated Resume"
    return title[:120]


def _year_or_default(value):
    year = _year_or_none(value)
    return year or datetime.utcnow().year


def _year_or_none(value):
    if value in (None, ""):
        return None
    match = re.search(r"\d{4}", str(value))
    return int(match.group(0)) if match else None
