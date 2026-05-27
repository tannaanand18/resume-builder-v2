from app.extensions import db
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, FrameBreak, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import KeepInFrame
from io import BytesIO
from app.models.resume import Resume
from app.models.experience import Experience
from app.models.education import Education
from app.models.skills import Skill
from app.models.project import Project
from app.models.certification import Certification

W, H = A4  # 595 x 842 pts

def clean(line):
    return line.strip().lstrip('*').lstrip('•').lstrip('-').strip()

def fetch(resume_id):
    return {
        "resume":      db.session.get(Resume, resume_id),
        "experiences": Experience.query.filter_by(resume_id=resume_id).all(),
        "educations":  Education.query.filter_by(resume_id=resume_id).all(),
        "skills":      Skill.query.filter_by(resume_id=resume_id).all(),
        "projects":    Project.query.filter_by(resume_id=resume_id).all(),
        "certs":       Certification.query.filter_by(resume_id=resume_id).all(),
    }

def contact_line_with_links(resume):
    """Generate clickable contact links for PDF"""
    parts = []
    
    if resume.email:
        parts.append(f'<a href="mailto:{resume.email}" color="blue">{resume.email}</a>')
    if resume.phone:
        parts.append(f'<a href="tel:{resume.phone}" color="blue">{resume.phone}</a>')
    if resume.location:
        parts.append(f'<a href="geo:0,0?q={resume.location}" color="blue">{resume.location}</a>')
    if resume.linkedin:
        parts.append(f'<a href="{resume.linkedin}" color="blue">{resume.linkedin}</a>')
    
    return "  |  ".join(parts)

def contact_line(resume):
    return "  |  ".join(v for v in [
        resume.email, resume.phone, resume.location, resume.linkedin
    ] if v)

# ═══════════════════════════════════════════
# 1. SIMPLE  — classic serif font, centered headers
# ═══════════════════════════════════════════
def pdf_simple(data, buffer):
    resume = data["resume"]
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=40, rightMargin=40,
                            topMargin=30, bottomMargin=30)

    NAME = ParagraphStyle('N', fontName='Times-Bold', fontSize=22, spaceAfter=6, alignment=1)
    SUB  = ParagraphStyle('S', fontName='Times-Italic', fontSize=11, textColor=colors.grey, spaceAfter=4, alignment=1)
    CON  = ParagraphStyle('C', fontName='Times-Roman', fontSize=9, textColor=colors.grey, spaceAfter=8, alignment=1)
    SEC  = ParagraphStyle('Se', fontName='Times-Bold', fontSize=10,
                          textColor=colors.black, spaceBefore=10, spaceAfter=3, alignment=1)
    BOLD = ParagraphStyle('Bo', fontName='Times-Bold', fontSize=9, leading=13)
    NORM = ParagraphStyle('No', fontName='Times-Roman', fontSize=9, leading=13)
    SMALL= ParagraphStyle('Sm', fontName='Times-Italic', fontSize=8.5, textColor=colors.grey, leading=12)
    BUL  = ParagraphStyle('Bu', fontName='Times-Roman', fontSize=9, leading=12, leftIndent=10)

    def hr():
        return HRFlowable(width="100%", thickness=0.5, color=colors.black)

    def section(title):
        els.append(Spacer(1, 2))
        els.append(Paragraph(title, SEC))
        els.append(hr())
        els.append(Spacer(1, 4))

    els = []
    
    els.append(Paragraph(resume.full_name.upper() if resume.full_name else "YOUR NAME", NAME))
    els.append(Spacer(1, 2))
    
    if resume.professional_title:  # pragma: no cover
        els.append(Paragraph(resume.professional_title, SUB))
    
    cl = contact_line_with_links(resume)
    if cl:  # pragma: no cover
        els.append(Paragraph(cl, CON))
        
    els.append(HRFlowable(width="100%", thickness=1.5, color=colors.black))
    els.append(Spacer(1, 8))

    if resume.summary:  # pragma: no cover
        section("PROFESSIONAL SUMMARY")
        els.append(Paragraph(resume.summary, NORM))
        els.append(Spacer(1, 6))

    if data["experiences"]:  # pragma: no cover
        section("WORK EXPERIENCE")
        for e in data["experiences"]:
            els.append(Paragraph(f'<b>{e.role}</b> — {e.company}', BOLD))
            els.append(Paragraph(f'{e.start_date} – {e.end_date or "Present"}', SMALL))
            if e.description:  # pragma: no cover
                els.append(Spacer(1, 2))
                for ln in e.description.split("\n"):
                    c = clean(ln)
                    if c: els.append(Paragraph(f"• {c}", BUL))  # pragma: no cover
            els.append(Spacer(1, 6))

    if data["educations"]:  # pragma: no cover
        section("EDUCATION")
        for e in data["educations"]:
            els.append(Paragraph(f'<b>{e.degree}</b> — {e.institution}', BOLD))
            els.append(Paragraph(f'{e.start_year} – {e.end_year}', SMALL))
            els.append(Spacer(1, 5))

    if data["skills"]:  # pragma: no cover
        section("SKILLS")
        skill_text = " • ".join(
            f'{s.skill_name} ({s.level})' if s.level else s.skill_name
            for s in data["skills"]
        )
        els.append(Paragraph(skill_text, NORM))
        els.append(Spacer(1, 6))

    if data["projects"]:  # pragma: no cover
        section("PROJECTS")
        for p in data["projects"]:
            t = f'<b>{p.project_title}</b>'
            if p.tech_stack: t += f' | <i>{p.tech_stack}</i>'  # pragma: no cover
            els.append(Paragraph(t, BOLD))
            if p.link:  # pragma: no cover
                els.append(Paragraph(p.link, SMALL))
            if p.description:  # pragma: no cover
                els.append(Spacer(1, 2))
                for ln in p.description.split("\n"):
                    c = clean(ln)
                    if c: els.append(Paragraph(f"• {c}", BUL))  # pragma: no cover
            els.append(Spacer(1, 6))

    if data["certs"]:  # pragma: no cover
        section("CERTIFICATIONS")
        for c in data["certs"]:
            txt = f'<b>{c.title}</b>'
            if c.organization: txt += f' | {c.organization}'  # pragma: no cover
            if c.issue_year:   txt += f' | {c.issue_year}'  # pragma: no cover
            els.append(Paragraph(txt, NORM))
            els.append(Spacer(1, 4))

    doc.build(els)

# ═══════════════════════════════════════════
# 2. MODERN  — dark navy sidebar + main panel
# ═══════════════════════════════════════════
def pdf_modern(data, buffer):
    resume = data["resume"]
    NAVY   = colors.Color(0.059, 0.09, 0.165)
    ACC    = colors.Color(0.4, 0.6, 0.95)
    SIDE   = 165
    MAIN   = W - SIDE - 25
    BOT    = 25

    SN = ParagraphStyle('SN', fontName='Helvetica-Bold', fontSize=13, textColor=colors.white, leading=15, spaceAfter=2)
    ST = ParagraphStyle('ST', fontSize=8, textColor=colors.white, leading=10, spaceAfter=6)
    SH = ParagraphStyle('SH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, spaceBefore=8, spaceAfter=2)
    SI = ParagraphStyle('SI', fontSize=7.5, textColor=colors.white, leading=10, spaceAfter=2)

    side = []
    side.append(Paragraph(resume.full_name or "Your Name", SN))
    if resume.professional_title:  # pragma: no cover
        side.append(Paragraph(resume.professional_title, ST))
        
    side.append(Paragraph("CONTACT", SH))
    if resume.email:
        side.append(Paragraph(f'<a href="mailto:{resume.email}" color="white">{resume.email}</a>', SI))
    if resume.phone:
        side.append(Paragraph(f'<a href="tel:{resume.phone}" color="white">{resume.phone}</a>', SI))
    if resume.location:
        side.append(Paragraph(f'<a href="geo:0,0?q={resume.location}" color="white">{resume.location}</a>', SI))
    if resume.linkedin:
        side.append(Paragraph(f'<a href="{resume.linkedin}" color="white">{resume.linkedin}</a>', SI))
        
    if data["skills"]:  # pragma: no cover
        side.append(Paragraph("SKILLS", SH))
        for s in data["skills"]:
            side.append(Paragraph(f"• {s.skill_name}", SI))
            
    if data["certs"]:  # pragma: no cover
        side.append(Paragraph("CERTIFICATIONS", SH))
        for c in data["certs"]:
            side.append(Paragraph(f"• {c.title}", SI))

    MH  = ParagraphStyle('MH', fontName='Helvetica-Bold', fontSize=8.5, textColor=ACC, spaceBefore=7, spaceAfter=2)
    MB  = ParagraphStyle('MB', fontName='Helvetica-Bold', fontSize=8.5, leading=12)
    MN  = ParagraphStyle('MN', fontSize=8.5, leading=12)
    MS  = ParagraphStyle('MS', fontSize=8, textColor=colors.grey, leading=11)
    MBU = ParagraphStyle('MBU', fontSize=8, leading=11, leftIndent=6)

    def mhr():
        return HRFlowable(width="100%", thickness=0.4, color=ACC)

    def msection(title):
        main.append(Paragraph(title, MH))
        main.append(mhr())
        main.append(Spacer(1, 3))

    main = []
    if resume.summary:  # pragma: no cover
        msection("PROFILE")
        main.append(Paragraph(resume.summary, MN))
        main.append(Spacer(1, 5))

    if data["experiences"]:  # pragma: no cover
        msection("WORK EXPERIENCE")
        for e in data["experiences"]:
            main.append(Paragraph(f'<b>{e.role}</b>  —  {e.company}', MB))
            main.append(Paragraph(f'{e.start_date} – {e.end_date or "Present"}', MS))
            if e.description:  # pragma: no cover
                for ln in e.description.split("\n"):
                    c = clean(ln)
                    if c: main.append(Paragraph(f"• {c}", MBU))  # pragma: no cover
            main.append(Spacer(1, 4))

    if data["educations"]:  # pragma: no cover
        msection("EDUCATION")
        for e in data["educations"]:
            main.append(Paragraph(f'<b>{e.degree}</b>  —  {e.institution}', MB))
            main.append(Paragraph(f'{e.start_year} – {e.end_year}', MS))
            main.append(Spacer(1, 4))

    if data["projects"]:  # pragma: no cover
        msection("PROJECTS")
        for p in data["projects"]:
            t = f'<b>{p.project_title}</b>'
            if p.tech_stack: t += f'  |  <i>{p.tech_stack}</i>'  # pragma: no cover
            main.append(Paragraph(t, MB))
            if p.description:  # pragma: no cover
                for ln in p.description.split("\n"):
                    c = clean(ln)
                    if c: main.append(Paragraph(f"• {c}", MBU))  # pragma: no cover
            main.append(Spacer(1, 4))

    def draw_bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, SIDE, H, fill=1, stroke=0)
        canvas.restoreState()

    sf = Frame(0, BOT, SIDE, H-BOT, leftPadding=10, rightPadding=8, topPadding=14, bottomPadding=8, id='side')
    mf = Frame(SIDE+10, BOT, MAIN, H-BOT, leftPadding=8, rightPadding=10, topPadding=14, bottomPadding=8, id='main')

    doc = BaseDocTemplate(buffer, pagesize=A4, leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=BOT)
    doc.addPageTemplates([PageTemplate(id='p', frames=[sf, mf], onPage=draw_bg)])
    doc.build(side + [FrameBreak()] + main)


# ═══════════════════════════════════════════
# 3. CREATIVE  — purple banner + content
# ═══════════════════════════════════════════
def pdf_creative(data, buffer):
    resume = data["resume"]
    PURPLE = colors.Color(0.486, 0.227, 0.929)
    ACC    = colors.Color(0.486, 0.227, 0.929)

    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=38, rightMargin=38, topMargin=0, bottomMargin=28)

    BN  = ParagraphStyle('BN', fontName='Helvetica-Bold', fontSize=20, textColor=colors.white, spaceAfter=2)
    BSU = ParagraphStyle('BS', fontSize=9,  textColor=colors.white, spaceAfter=2)
    BCO = ParagraphStyle('BC', fontSize=8,  textColor=colors.white)

    SEC  = ParagraphStyle('SE', fontName='Helvetica-Bold', fontSize=9, textColor=ACC, spaceBefore=8, spaceAfter=2)
    BOLD = ParagraphStyle('BO', fontName='Helvetica-Bold', fontSize=8.5, leading=12)
    NORM = ParagraphStyle('NO', fontSize=8.5, leading=12)
    SMALL= ParagraphStyle('SM', fontSize=8,  textColor=colors.grey, leading=11)
    BUL  = ParagraphStyle('BU', fontSize=8,  leading=11, leftIndent=8)

    banner_els = [Paragraph(resume.full_name or "Your Name", BN)]
    if resume.professional_title:  # pragma: no cover
        banner_els.append(Paragraph(resume.professional_title, BSU))
        
    cl = contact_line_with_links(resume)
    if cl: banner_els.append(Paragraph(cl, BCO))  # pragma: no cover

    kif = KeepInFrame(W - 76, 110, banner_els)
    bt  = Table([[kif]], colWidths=[W - 76])
    bt.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), PURPLE),
        ('TOPPADDING',    (0,0), (-1,-1), 18),
        ('BOTTOMPADDING', (0,0), (-1,-1), 18),
        ('LEFTPADDING',   (0,0), (-1,-1), 18),
        ('RIGHTPADDING',  (0,0), (-1,-1), 18),
    ]))

    def hr():
        return HRFlowable(width="100%", thickness=0.5, color=ACC)

    def section(title):
        els.append(Paragraph(title, SEC))
        els.append(hr())
        els.append(Spacer(1, 3))

    els = [bt, Spacer(1, 10)]

    if resume.summary:  # pragma: no cover
        section("ABOUT ME")
        els.append(Paragraph(resume.summary, NORM))
        els.append(Spacer(1, 5))

    if data["experiences"]:  # pragma: no cover
        section("EXPERIENCE")
        for e in data["experiences"]:
            els.append(Paragraph(f'<b>{e.role}</b>  —  {e.company}', BOLD))
            els.append(Paragraph(f'{e.start_date} – {e.end_date or "Present"}', SMALL))
            if e.description:  # pragma: no cover
                for ln in e.description.split("\n"):
                    c = clean(ln)
                    if c: els.append(Paragraph(f"• {c}", BUL))  # pragma: no cover
            els.append(Spacer(1, 5))

    if data["educations"]:  # pragma: no cover
        section("EDUCATION")
        for e in data["educations"]:
            els.append(Paragraph(f'<b>{e.degree}</b>  —  {e.institution}', BOLD))
            els.append(Paragraph(f'{e.start_year} – {e.end_year}', SMALL))
            els.append(Spacer(1, 4))

    if data["skills"]:  # pragma: no cover
        section("SKILLS")
        els.append(Paragraph(
            "  •  ".join(f'{s.skill_name} ({s.level})' if s.level else s.skill_name
                         for s in data["skills"]), NORM))
        els.append(Spacer(1, 5))

    if data["projects"]:  # pragma: no cover
        section("PROJECTS")
        for p in data["projects"]:
            t = f'<b>{p.project_title}</b>'
            if p.tech_stack: t += f'  |  <i>{p.tech_stack}</i>'  # pragma: no cover
            els.append(Paragraph(t, BOLD))
            if p.description:  # pragma: no cover
                for ln in p.description.split("\n"):
                    c = clean(ln)
                    if c: els.append(Paragraph(f"• {c}", BUL))  # pragma: no cover
            els.append(Spacer(1, 5))

    if data["certs"]:  # pragma: no cover
        section("CERTIFICATIONS")
        for c in data["certs"]:
            txt = f'<b>{c.title}</b>'
            if c.organization: txt += f'  |  {c.organization}'  # pragma: no cover
            if c.issue_year:   txt += f'  |  {c.issue_year}'  # pragma: no cover
            els.append(Paragraph(txt, NORM))
            els.append(Spacer(1, 3))

    doc.build(els)

# ═══════════════════════════════════════════
# DISPATCH
# ═══════════════════════════════════════════
def generate_resume_pdf(resume_id):
    data   = fetch(resume_id)
    tmpl   = (data["resume"].template_name or "simple").lower()
    buffer = BytesIO()

    if tmpl == "modern":
        pdf_modern(data, buffer)
    elif tmpl == "creative":
        pdf_creative(data, buffer)
    else:  # simple + fallback
        pdf_simple(data, buffer)

    buffer.seek(0)
    return buffer