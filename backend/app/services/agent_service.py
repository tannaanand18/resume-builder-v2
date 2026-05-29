import json
import html as html_lib
import os
import re
from datetime import datetime

import requests
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

Your FULL capabilities:
1. See and answer questions about ALL user resumes and dashboard data
2. Create complete resumes from a single description
3. Add/update/delete any resume section (skills, projects, experience, education, certifications)
4. Generate AI-powered content (summaries, descriptions)
5. Check ATS scores against job descriptions
6. Parse LinkedIn profile text and create full resumes automatically
7. Suggest improvements to existing resumes
8. Switch resume templates

CRITICAL RULES:
- When user says "add project: Title using Tech" → add it IMMEDIATELY, no questions
- When user says "add skill: Name (Level)" → add it IMMEDIATELY, no questions
- When user gives a LinkedIn URL → try the public profile page and create the resume automatically
- Only ask for missing info if truly nothing is provided at all
- Never use placeholder values like "Company", "Degree", "Institution"
- Always confirm what was done after completing an action

COMMANDS YOU UNDERSTAND:
- "Add skill: Python (Advanced)" → adds skill immediately
- "Add project: Title using React and Flask" → adds project immediately
- "Add experience at Company as Role from 2022 to 2024" → adds experience
- "Create resume for Software Engineer" → creates full resume
- "Check ATS for [job description]" → runs ATS check
- "Update my summary" → generates new summary
- "Switch to modern template" → changes template
- "Create resume from linkedin.com/in/username" → parses the public profile and creates a resume

Always be helpful, professional, and concise.
Format responses with bullet points when listing items.
Make all resume content ATS-friendly and professional."""


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


# ─────────────────────────────────────────────────────
# LINKEDIN SCRAPER
# ─────────────────────────────────────────────────────

def _normalize_linkedin_url(linkedin_url):
    linkedin_url = (linkedin_url or "").strip().rstrip("/")
    if not linkedin_url:
        return ""
    if not linkedin_url.startswith("http"):
        linkedin_url = "https://www." + linkedin_url.lstrip("/")
    linkedin_url = re.sub(r"^https?://(www\.)?", "https://www.", linkedin_url)
    return linkedin_url

def _extract_linkedin_username(text):
    """Extract LinkedIn username/URL from text."""
    patterns = [
        r'linkedin\.com/in/([\w\-]+)',
        r'linkedin\.com/pub/([\w\-]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            return match.group(0)  # return full path like linkedin.com/in/username
    return None


def fetch_linkedin_profile(linkedin_url):
    """Fetch a public LinkedIn page and return extractable text."""
    linkedin_url = _normalize_linkedin_url(linkedin_url)
    if not linkedin_url:
        raise ValueError("LinkedIn URL is required")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    response = requests.get(linkedin_url, headers=headers, timeout=20)
    final_url = (response.url or linkedin_url).lower()
    blocked_paths = ("/authwall", "/checkpoint/", "/uas/login", "/login")
    if response.status_code != 200 or any(part in final_url for part in blocked_paths):
        raise ValueError(
            "LinkedIn public profile is not accessible from this environment. "
            "Please paste the copied LinkedIn profile text instead."
        )

    visible_text = _extract_visible_text_from_html(response.text)
    if len(visible_text) < 200:
        raise ValueError(
            "LinkedIn public profile did not expose enough text. Please paste the copied profile text instead."
        )

    return {"linkedin_url": linkedin_url, "source_text": visible_text}


def _extract_visible_text_from_html(page_html):
    page_html = re.sub(r"(?is)<(script|style|noscript|svg|iframe).*?>.*?</\1>", " ", page_html)
    page_html = re.sub(r"(?i)<br\s*/?>", "\n", page_html)
    page_html = re.sub(r"(?i)</(p|div|li|section|article|header|footer|h[1-6]|tr|td|th)>", "\n", page_html)
    text = re.sub(r"(?s)<[^>]+>", " ", page_html)
    text = html_lib.unescape(text)
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()


def _parse_linkedin_to_resume_data(profile):
    """Convert RapidAPI LinkedIn profile data to our resume format."""
    data = profile.get("data", profile)  # handle nested data key

    full_name = (data.get("full_name") or "").strip()
    headline = (data.get("headline") or "").strip()
    location = (data.get("location") or "").strip()
    linkedin_url = (data.get("linkedin_url") or data.get("profile_url") or "").strip()
    summary = (data.get("summary") or data.get("about") or "").strip()

    # Skills
    skills = []
    for skill in (data.get("skills") or []):
        name = skill.get("name") or skill if isinstance(skill, str) else ""
        if name:
            skills.append({"name": name.strip(), "level": "Intermediate"})

    # Experience
    experiences = []
    for exp in (data.get("experiences") or []):
        company = (exp.get("company") or exp.get("company_name") or "").strip()
        role = (exp.get("title") or exp.get("role") or "").strip()
        start = (exp.get("start_date") or exp.get("starts_at") or "").strip() if isinstance(exp.get("start_date"), str) else str(exp.get("start_date") or "")
        end = (exp.get("end_date") or exp.get("ends_at") or "Present").strip() if isinstance(exp.get("end_date"), str) else str(exp.get("end_date") or "Present")
        description = (exp.get("description") or "").strip()
        if company and role:
            experiences.append({
                "company": company,
                "role": role,
                "start_date": start or "2020",
                "end_date": end or "Present",
                "description": description,
            })

    # Education
    educations = []
    for edu in (data.get("educations") or data.get("education") or []):
        degree = (edu.get("degree_name") or edu.get("degree") or edu.get("field_of_study") or "").strip()
        institution = (edu.get("school") or edu.get("school_name") or edu.get("institution") or "").strip()
        start_year = edu.get("start_date") or edu.get("start_year")
        end_year = edu.get("end_date") or edu.get("end_year")
        if institution:
            educations.append({
                "degree": degree or "Bachelor's Degree",
                "institution": institution,
                "start_year": _year_or_none(start_year),
                "end_year": _year_or_none(end_year),
                "score": None,
            })

    # Projects
    projects = []
    for proj in (data.get("projects") or []):
        title = (proj.get("title") or proj.get("name") or "").strip()
        description = (proj.get("description") or "").strip()
        if title:
            projects.append({
                "title": title,
                "description": description,
                "tech_stack": "",
                "link": proj.get("url") or "",
            })

    # Certifications
    certifications = []
    for cert in (data.get("certifications") or []):
        title = (cert.get("name") or cert.get("title") or "").strip()
        org = (cert.get("authority") or cert.get("organization") or "").strip()
        year = cert.get("starts_at") or cert.get("issue_year") or ""
        if title:
            certifications.append({
                "title": title,
                "organization": org,
                "issue_year": str(year)[:4] if year else "",
            })

    return {
        "title": f"{full_name} - {headline}" if headline else f"{full_name} Resume",
        "full_name": full_name,
        "professional_title": headline,
        "location": location,
        "linkedin": linkedin_url,
        "summary": summary,
        "skills": skills,
        "experiences": experiences,
        "educations": educations,
        "projects": projects,
        "certifications": certifications,
    }


def _parse_linkedin_text_with_ai(text):
    """Parse pasted LinkedIn profile text using AI."""
    prompt = f"""Extract resume data from this LinkedIn profile text and return ONLY JSON.

Treat the source as a public LinkedIn profile or copied profile text. Do not invent missing facts.

LinkedIn profile text:
{text[:6000]}

Return this exact JSON structure:
{{
  "full_name": "",
  "professional_title": "",
  "location": "",
  "linkedin": "",
  "summary": "",
  "skills": [{{"name": "", "level": "Intermediate"}}],
  "experiences": [{{"company": "", "role": "", "start_date": "", "end_date": "Present", "description": ""}}],
  "educations": [{{"degree": "", "institution": "", "start_year": null, "end_year": null, "score": null}}],
  "projects": [{{"title": "", "description": "", "tech_stack": "", "link": ""}}],
  "certifications": [{{"title": "", "organization": "", "issue_year": ""}}]
}}

Extract ALL available information. For missing fields use empty string or null.
Return ONLY the JSON object, no other text."""

    completion = _client().chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a resume data extractor. Return strict JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=2000,
    )
    return _clean_json(completion.choices[0].message.content)


# ─────────────────────────────────────────────────────
# CORE DATABASE ACTIONS
# ─────────────────────────────────────────────────────

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
    company = (company or "").strip()
    role = (role or "").strip()
    start_date = (start_date or "2024").strip()
    end_date = (end_date or "Present").strip()
    if not description:
        try:
            description = generate_experience_description({
                "company": company, "role": role,
                "start_date": start_date, "end_date": end_date,
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
        add_project(resume.id, user_id, project.get("title") or project.get("project_title"), project.get("description", ""), project.get("tech_stack", ""), project.get("link", ""))
    for exp in resume_data.get("experiences", [])[:10]:
        add_experience(resume.id, user_id, exp.get("company"), exp.get("role"), exp.get("start_date", ""), exp.get("end_date", "Present"), exp.get("description", ""))
    for edu in resume_data.get("educations", [])[:8]:
        add_education(resume.id, user_id, edu.get("degree"), edu.get("institution"), edu.get("start_year"), edu.get("end_year"), edu.get("score"))
    for cert in resume_data.get("certifications", [])[:10]:
        add_certification(resume.id, user_id, cert.get("title") or cert.get("name"), cert.get("organization") or cert.get("issuer", ""), cert.get("issue_year") or cert.get("issue_date", ""))
    if not resume.summary:
        try:
            resume.summary = generate_summary({"full_name": resume.full_name or "", "professional_title": resume.professional_title or resume.title or ""})
        except Exception:
            resume.summary = resume_data.get("summary")
    db.session.flush()
    return get_resume_data(resume.id, user_id)


# ─────────────────────────────────────────────────────
# MAIN HANDLER
# ─────────────────────────────────────────────────────

def handle_agent_message(user_id, message, resume_id=None, conversation_history=None, context=None):
    message = (message or "").strip()
    if not message:
        return {"message": "Please type a message for the assistant.", "actions_taken": [], "data": {}}

    conversation_history = conversation_history or []
    context = context or {}
    active_resume_id = resume_id or _latest_resume_id(user_id)
    actions_taken = []

    try:
        # Check for LinkedIn URL first
        linkedin_url = _extract_linkedin_username(message)
        if linkedin_url and any(word in message.lower() for word in ["create", "build", "make", "resume", "linkedin"]):
            return _handle_linkedin_url(user_id, linkedin_url, actions_taken)

        # Check for pasted LinkedIn text (long text with LinkedIn patterns)
        if _looks_like_linkedin_text(message):
            return _handle_linkedin_text(user_id, message, actions_taken)

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
            "message": f"I could not complete that: {str(exc)}",
            "actions_taken": actions_taken,
            "data": {"error": str(exc)},
        }


def _handle_linkedin_url(user_id, linkedin_url, actions_taken):
    """Fetch a public LinkedIn profile page and create a resume."""
    try:
        actions_taken.append(f"Reading LinkedIn profile: {linkedin_url}")
        profile = fetch_linkedin_profile(linkedin_url)
        resume_data = _parse_linkedin_text_with_ai(
            f"LinkedIn URL: {profile.get('linkedin_url') or linkedin_url}\n\n{profile.get('source_text', '')}"
        )
        resume_data["linkedin"] = resume_data.get("linkedin") or profile.get("linkedin_url") or linkedin_url

        if not resume_data.get("title"):
            resume_data["title"] = f"{resume_data.get('full_name', 'LinkedIn')} Resume"

        if not resume_data.get("full_name") and not resume_data.get("experiences"):
            raise ValueError("Could not extract enough data from this LinkedIn profile.")

        created = create_full_resume(user_id, resume_data)
        new_id = created["resume"]["id"]
        full_name = resume_data.get("full_name") or "Your"
        title = resume_data.get("professional_title") or ""
        skills_count = len(resume_data.get("skills", []))
        exp_count = len(resume_data.get("experiences", []))
        edu_count = len(resume_data.get("educations", []))
        proj_count = len(resume_data.get("projects", []))
        cert_count = len(resume_data.get("certifications", []))

        actions_taken.append(f"Created resume for {full_name}")
        db.session.commit()

        return {
            "message": (
                f"✅ I fetched **{full_name}**'s LinkedIn profile and created a complete resume!\n\n"
                f"**What was added:**\n"
                f"- 👤 Name: {full_name} ({title})\n"
                f"- 💼 Experience: {exp_count} entries\n"
                f"- 🎓 Education: {edu_count} entries\n"
                f"- 🔧 Skills: {skills_count} added\n"
                f"- 📁 Projects: {proj_count} added\n"
                f"- 🏆 Certifications: {cert_count} added\n\n"
                f"Your resume is ready to edit: /resume/{new_id}/edit"
            ),
            "actions_taken": actions_taken,
            "data": {"resume_id": new_id, "resume": created, "edit_url": f"/resume/{new_id}/edit"},
        }
    except Exception as e:
        # Fallback: ask user to paste profile text
        db.session.rollback()
        return {
            "message": (
                f"I couldn't fetch that LinkedIn profile automatically ({str(e)}).\n\n"
                "**No problem!** Please:\n"
                "1. Open your LinkedIn profile in browser\n"
                "2. Select all text (Ctrl+A)\n"
                "3. Copy (Ctrl+C)\n"
                "4. Paste it here\n\n"
                "I'll create your complete resume from the pasted text!"
            ),
            "actions_taken": actions_taken,
            "data": {"needs_linkedin_text": True},
        }


def _handle_linkedin_text(user_id, text, actions_taken):
    """Parse pasted LinkedIn text and create resume."""
    try:
        actions_taken.append("Parsing LinkedIn profile text")
        resume_data = _parse_linkedin_text_with_ai(text)

        if not resume_data.get("full_name") and not resume_data.get("experiences"):
            raise ValueError("Could not extract resume data from the text.")

        resume_data["title"] = f"{resume_data.get('full_name', 'LinkedIn')} Resume"
        created = create_full_resume(user_id, resume_data)
        new_id = created["resume"]["id"]
        full_name = resume_data.get("full_name") or "Your"
        skills_count = len(resume_data.get("skills", []))
        exp_count = len(resume_data.get("experiences", []))

        actions_taken.append(f"Created resume from LinkedIn text for {full_name}")
        db.session.commit()

        return {
            "message": (
                f"✅ I parsed your LinkedIn profile and created a complete resume for **{full_name}**!\n\n"
                f"- 💼 {exp_count} experience entries added\n"
                f"- 🔧 {skills_count} skills added\n\n"
                f"Edit your resume here: /resume/{new_id}/edit"
            ),
            "actions_taken": actions_taken,
            "data": {"resume_id": new_id, "resume": created, "edit_url": f"/resume/{new_id}/edit"},
        }
    except Exception as e:
        db.session.rollback()
        return {
            "message": f"I had trouble parsing that text: {str(e)}\n\nTry pasting your LinkedIn profile text again.",
            "actions_taken": actions_taken,
            "data": {"error": str(e)},
        }


def _looks_like_linkedin_text(text):
    """Detect if text looks like a pasted LinkedIn profile."""
    if len(text) < 200:
        return False
    linkedin_signals = ["experience", "education", "skills", "summary", "about", "connections", "followers"]
    matches = sum(1 for signal in linkedin_signals if signal.lower() in text.lower())
    return matches >= 3


# ─────────────────────────────────────────────────────
# QUICK COMMANDS (regex-based, no AI needed)
# ─────────────────────────────────────────────────────

def _handle_quick_command(user_id, message, resume_id, actions_taken):
    lower = message.lower()

    # Add skill: Name (Level)
    skill_match = re.match(r"^\s*add\s+skill\s*:\s*(.+)$", message, re.I)
    if skill_match:
        if not resume_id:
            raise ValueError("Open or create a resume first.")
        skill_text = skill_match.group(1).strip()
        level_match = re.match(r"(.+?)\s*\((.+?)\)\s*$", skill_text)
        name = level_match.group(1).strip() if level_match else skill_text
        level = level_match.group(2).strip() if level_match else "Intermediate"
        skill = add_skill(resume_id, user_id, name, level)
        actions_taken.append(f"Added skill: {skill['skill_name']} ({skill['level']})")
        return {
            "message": f"✅ Added **{skill['skill_name']}** ({skill['level']}) to your skills.",
            "actions_taken": actions_taken,
            "data": {"skill": skill, "resume_id": resume_id},
        }

    # Add project: Title using Tech
    project_match = re.match(r"^\s*add\s+project\s*:\s*(.+)$", message, re.I)
    if project_match:
        if not resume_id:
            raise ValueError("Open or create a resume first.")
        project_text = project_match.group(1).strip()
        title, tech_stack = _split_project_text(project_text)
        link_match = re.search(r'(https?://\S+)', project_text)
        link = link_match.group(1) if link_match else ""
        project = add_project(resume_id, user_id, title, "", tech_stack, link)
        actions_taken.append(f"Added project: {project['project_title']}")
        msg = f"✅ Added project **{project['project_title']}**"
        if tech_stack:
            msg += f" (Tech: {tech_stack})"
        msg += " with AI-generated description."
        return {
            "message": msg,
            "actions_taken": actions_taken,
            "data": {"project": project, "resume_id": resume_id},
        }

    # Download resume
    if "download" in lower and "resume" in lower:
        if not resume_id:
            raise ValueError("Open a resume first.")
        actions_taken.append("Prepared download link")
        return {
            "message": "Here is your resume download link.",
            "actions_taken": actions_taken,
            "data": {"download_url": f"/api/resume/download/{resume_id}", "resume_id": resume_id},
        }

    # Switch template
    if "switch to" in lower and "template" in lower:
        if not resume_id:
            raise ValueError("Open a resume first.")
        template = "modern" if "modern" in lower else "creative" if "creative" in lower else "simple"
        resume = _verify_resume(resume_id, user_id)
        resume.template_name = template
        actions_taken.append(f"Switched template to {template}")
        return {
            "message": f"✅ Switched to the **{template}** template.",
            "actions_taken": actions_taken,
            "data": {"resume_id": resume_id, "template_name": template},
        }

    return None


# ─────────────────────────────────────────────────────
# AI INTENT CLASSIFICATION
# ─────────────────────────────────────────────────────

def _classify_intent(message, resume_context, conversation_history, context):
    prompt = f"""Classify this resume assistant request. Extract ALL data from the message.

IMPORTANT RULES:
- If user says "add project: X using Y" → intent=add_project, extract title=X, tech_stack=Y
- If user says "add skill: X (Level)" → intent=add_skill, extract name=X, level=Level
- If user gives experience details → intent=add_experience, extract ALL details
- If user gives education details → intent=add_education, extract ALL details
- Extract real values from message, never use placeholders
- If user is just chatting → intent=general_chat

Return ONLY JSON:
{{
  "intent": "answer_question|create_resume|add_skill|add_project|add_experience|add_education|add_certification|update_summary|check_ats|switch_template|general_chat",
  "needs_resume": true,
  "resume_data": {{}},
  "skill": {{"name": "", "level": "Intermediate"}},
  "project": {{"title": "", "description": "", "tech_stack": "", "link": ""}},
  "experience": {{"company": "", "role": "", "start_date": "", "end_date": "Present", "description": ""}},
  "education": {{"degree": "", "institution": "", "start_year": "", "end_year": "", "score": ""}},
  "certification": {{"title": "", "organization": "", "issue_year": ""}},
  "job_description": "",
  "template_name": "",
  "answer": ""
}}

Current resume:
{json.dumps(resume_context or {}, default=str)[:6000]}

Conversation history:
{json.dumps(conversation_history[-6:], default=str)[:2000]}

User message: {message}"""

    try:
        completion = _client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a resume intent classifier. Return strict JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=1200,
        )
        return _clean_json(completion.choices[0].message.content)
    except Exception:
        return {"intent": "general_chat", "answer": ""}


# ─────────────────────────────────────────────────────
# INTENT EXECUTION
# ─────────────────────────────────────────────────────

def _execute_intent(user_id, resume_id, message, intent, actions_taken, resume_context):
    name = (intent.get("intent") or "general_chat").strip()

    if name in {"create_resume"}:
        resume_data = intent.get("resume_data") or {}
        if not resume_data.get("title"):
            resume_data["title"] = _title_from_message(message)
        created = create_full_resume(user_id, resume_data)
        new_id = created["resume"]["id"]
        actions_taken.append(f"Created resume #{new_id}")
        return {
            "message": f"✅ Created your resume! Edit it here: /resume/{new_id}/edit",
            "actions_taken": actions_taken,
            "data": {"resume_id": new_id, "resume": created, "edit_url": f"/resume/{new_id}/edit"},
        }

    if name == "add_skill":
        _require_resume(resume_id)
        skill_data = intent.get("skill") or {}
        skill_name = (skill_data.get("name") or "").strip()
        skill_level = (skill_data.get("level") or "Intermediate").strip()
        if not skill_name or skill_name.lower() in ["skill", "unknown", ""]:
            return {
                "message": "What skill would you like to add? Please tell me:\n1. **Skill name** (e.g. Python, React)\n2. **Level** - Beginner / Intermediate / Advanced",
                "actions_taken": [],
                "data": {"needs_info": "skill"},
            }
        if skill_level.lower() not in ["beginner", "intermediate", "advanced"]:
            skill_level = "Intermediate"
        skill = add_skill(resume_id, user_id, skill_name, skill_level)
        actions_taken.append(f"Added skill: {skill['skill_name']}")
        return {
            "message": f"✅ Added **{skill['skill_name']}** ({skill['level']}) to your skills.",
            "actions_taken": actions_taken,
            "data": {"skill": skill},
        }

    if name == "add_project":
        _require_resume(resume_id)
        project_data = intent.get("project") or {}
        title = (project_data.get("title") or "").strip()
        tech_stack = (project_data.get("tech_stack") or "").strip()
        link = (project_data.get("link") or "").strip()
        description = (project_data.get("description") or "").strip()

        if not title or title.lower() in ["project", "unknown", ""]:
            return {
                "message": "What project would you like to add? Just tell me:\n- **Project name** and **technologies used**\n\nExample: `Add project: AI Chatbot using Python and OpenAI`",
                "actions_taken": [],
                "data": {"needs_info": "project"},
            }

        project = add_project(resume_id, user_id, title, description, tech_stack, link)
        actions_taken.append(f"Added project: {project['project_title']}")
        msg = f"✅ Added project **{project['project_title']}**"
        if tech_stack:
            msg += f" (Tech: {tech_stack})"
        return {
            "message": msg + " with AI-generated description.",
            "actions_taken": actions_taken,
            "data": {"project": project},
        }

    if name == "add_experience":
        _require_resume(resume_id)
        exp_data = intent.get("experience") or {}
        company = (exp_data.get("company") or "").strip()
        role = (exp_data.get("role") or "").strip()

        if not company or company.lower() in ["company", "unknown", "n/a", ""]:
            return {
                "message": "Please provide your experience details:\n1. **Company name**\n2. **Job title/role**\n3. **Start date** (e.g. Jan 2022)\n4. **End date** (or 'Present')\n5. **Description** - want me to generate it?",
                "actions_taken": [],
                "data": {"needs_info": "experience"},
            }
        if not role or role.lower() in ["role", "title", "unknown", ""]:
            return {
                "message": f"Got it — **{company}**. What was your **job title/role** there?",
                "actions_taken": [],
                "data": {"needs_info": "role", "company": company},
            }

        exp = add_experience(
            resume_id, user_id, company, role,
            exp_data.get("start_date", ""),
            exp_data.get("end_date", "Present"),
            exp_data.get("description", ""),
        )
        actions_taken.append(f"Added experience: {exp['role']} at {exp['company']}")
        return {
            "message": f"✅ Added **{exp['role']}** at **{exp['company']}** with AI-generated description.",
            "actions_taken": actions_taken,
            "data": {"experience": exp},
        }

    if name == "add_education":
        _require_resume(resume_id)
        edu_data = intent.get("education") or {}
        degree = (edu_data.get("degree") or "").strip()
        institution = (edu_data.get("institution") or "").strip()

        if not degree or degree.lower() in ["degree", "unknown", ""]:
            return {
                "message": "Please provide your education details:\n1. **Degree** (e.g. B.Tech, MBA, HSC)\n2. **College/University name**\n3. **Start year** and **End year**\n4. **Score/GPA** (optional)",
                "actions_taken": [],
                "data": {"needs_info": "education"},
            }
        if not institution or institution.lower() in ["institution", "university", "college", "unknown", ""]:
            return {
                "message": f"Got it — **{degree}**. What is the name of your **college/university**?",
                "actions_taken": [],
                "data": {"needs_info": "institution", "degree": degree},
            }

        edu = add_education(resume_id, user_id, degree, institution, edu_data.get("start_year"), edu_data.get("end_year"), edu_data.get("score"))
        actions_taken.append(f"Added education: {edu['degree']} at {edu['institution']}")
        return {
            "message": f"✅ Added **{edu['degree']}** from **{edu['institution']}**.",
            "actions_taken": actions_taken,
            "data": {"education": edu},
        }

    if name == "add_certification":
        _require_resume(resume_id)
        cert_data = intent.get("certification") or {}
        title = (cert_data.get("title") or "").strip()
        if not title or title.lower() in ["certification", "unknown", ""]:
            return {
                "message": "Please provide:\n1. **Certification title**\n2. **Issuing organization**\n3. **Year issued**",
                "actions_taken": [],
                "data": {"needs_info": "certification"},
            }
        cert = add_certification(resume_id, user_id, title, cert_data.get("organization", ""), cert_data.get("issue_year", ""))
        actions_taken.append(f"Added certification: {cert['title']}")
        return {
            "message": f"✅ Added **{cert['title']}** to your certifications.",
            "actions_taken": actions_taken,
            "data": {"certification": cert},
        }

    if name == "update_summary":
        _require_resume(resume_id)
        summary = update_summary(resume_id, user_id)
        actions_taken.append("Updated resume summary")
        return {
            "message": f"✅ Generated and saved a new professional summary:\n\n_{summary['summary']}_",
            "actions_taken": actions_taken,
            "data": summary,
        }

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
        return {
            "message": f"✅ Switched to **{template}** template.",
            "actions_taken": actions_taken,
            "data": {"template_name": template},
        }

    # General chat / answer question
    answer = intent.get("answer") or _answer_question(message, resume_context)
    return {
        "message": answer,
        "actions_taken": actions_taken,
        "data": {"resume_id": resume_id},
    }


# ─────────────────────────────────────────────────────
# ANSWER QUESTIONS ABOUT RESUME
# ─────────────────────────────────────────────────────

def _answer_question(message, resume_context):
    lower = message.lower()

    if any(word in lower for word in ["dashboard", "can you see", "do you have access", "what do you see"]):
        if not resume_context:
            return "Yes! I have full access to your account. You don't have any resumes yet — want me to create one?"
        resume = resume_context.get("resume", {})
        return (
            f"Yes! I can see your resume:\n\n"
            f"📄 **{resume.get('title', 'Untitled')}**\n"
            f"👤 {resume.get('full_name', 'Not set')} — {resume.get('professional_title', 'No title')}\n"
            f"🔧 Skills: {len(resume_context.get('skills', []))}\n"
            f"💼 Experience: {len(resume_context.get('experiences', []))}\n"
            f"🎓 Education: {len(resume_context.get('educations', []))}\n"
            f"📁 Projects: {len(resume_context.get('projects', []))}\n"
            f"🏆 Certifications: {len(resume_context.get('certifications', []))}\n\n"
            f"What would you like to do?"
        )

    if not resume_context:
        return "No active resume found. Want me to create one? Just tell me your profession!"

    if "skill" in lower:
        skills = resume_context.get("skills", [])
        if not skills:
            return "No skills added yet. Say: `Add skill: Python (Advanced)`"
        return "Your skills:\n" + "\n".join([f"- {s.get('skill_name')} ({s.get('level', 'Intermediate')})" for s in skills])

    if "project" in lower:
        projects = resume_context.get("projects", [])
        if not projects:
            return "No projects added yet. Say: `Add project: My App using React and Flask`"
        return f"You have {len(projects)} project(s):\n" + "\n".join([f"- {p.get('project_title')}" for p in projects])

    if "experience" in lower or "work" in lower:
        experiences = resume_context.get("experiences", [])
        if not experiences:
            return "No work experience added yet."
        return "Your experience:\n" + "\n".join([f"- {e.get('role')} at {e.get('company')}" for e in experiences])

    if "education" in lower:
        educations = resume_context.get("educations", [])
        if not educations:
            return "No education added yet."
        return "Your education:\n" + "\n".join([f"- {e.get('degree')} from {e.get('institution')}" for e in educations])

    if "certification" in lower or "certificate" in lower:
        certs = resume_context.get("certifications", [])
        if not certs:
            return "No certifications added yet."
        return "Your certifications:\n" + "\n".join([f"- {c.get('title')}" for c in certs])

    if "summary" in lower:
        summary = resume_context.get("resume", {}).get("summary")
        if not summary:
            return "No summary yet. Say: `Update my summary`"
        return f"Your summary:\n\n{summary}"

    # Use AI for other questions
    prompt = f"""Answer using only this resume context. Be concise and helpful.

Resume:
{json.dumps(resume_context, default=str)[:6000]}

Question: {message}"""
    completion = _client().chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": AGENT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=500,
    )
    return completion.choices[0].message.content.strip()


# ─────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────

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
    for proj in resume_data.get("projects", []):
        parts.append(f"{proj.get('project_title')}: {proj.get('description')} {proj.get('tech_stack')}")
    for edu in resume_data.get("educations", []):
        parts.append(f"{edu.get('degree')} at {edu.get('institution')}")
    return "\n".join([str(p) for p in parts if p])


def _format_ats_message(result):
    score = result.get("score", "N/A")
    lines = [f"**ATS Score: {score}/100**"]
    if result.get("summary"):
        lines.append(result["summary"])
    if result.get("improvements"):
        lines.append("\n**Improvements:**")
        lines.extend([f"- {i}" for i in result["improvements"][:5]])
    if result.get("missing_keywords"):
        lines.append("\n**Missing keywords:**")
        lines.extend([f"- {k}" for k in result["missing_keywords"][:8]])
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
        raise ValueError("Open a resume first, or ask me to create one.")


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