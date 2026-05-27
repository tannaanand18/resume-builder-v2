import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../services/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../services/api";
import ShareButton from "../components/ShareButton";

const TABS = ["Personal", "Experience", "Education", "Skills", "Projects", "Certifications"];

const TEMPLATE_OPTIONS = [
  {
    group: "Simple", items: [
      { name: "Classic", style: "classic" },
      { name: "Harvard", style: "minimal" },
      { name: "Banking", style: "finance" },
      { name: "Quiet Blue", style: "quiet_blue" },
      { name: "Anna Field", style: "annafield" },
    ]
  },
  {
    group: "Modern", items: [
      { name: "Modern", style: "sidebar" },
      { name: "Simply Blue", style: "simplyblue_modern" },
      { name: "Hunter Green", style: "hunter_green" },
      { name: "Silver", style: "silver" },
      { name: "Slate Dawn", style: "slate_dawn" },
    ]
  },
  {
    group: "Creative", items: [
      { name: "Creative", style: "creative" },
      { name: "Black Pattern", style: "black_pattern" },
      { name: "Atlantic Blue", style: "atlantic_blue" },
      { name: "Green Accent", style: "green_accent" },
      { name: "Rosewood", style: "rosewood" },
      { name: "Blue Accent", style: "blue_accent" },
    ]
  },
];

// ── 12 UNIQUE ATS-FRIENDLY TEMPLATE RENDERERS ──

export function TemplateCorporate({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  return (
    <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#111", lineHeight: 1.6, padding: "32px 36px", background: "#fff", minHeight: "100%" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{full_name || <span style={{ color: "#ccc" }}>Your Name</span>}</h1>
        {professional_title && <div style={{ fontSize: 12, color: "#555", marginBottom: 6, fontStyle: "italic" }}>{professional_title}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, fontSize: 10, color: "#555" }}>
          {email && <span>✉ {email}</span>}{phone && <span>📱 {phone}</span>}{location && <span>📍 {location}</span>}{linkedin && <span>🔗 {linkedin}</span>}
        </div>
      </div>
      {summary && <Section title="Professional Summary"><p style={{ margin: 0, fontSize: 10.5, color: "#444", lineHeight: 1.7 }}>{summary}</p></Section>}
      {experiences.length > 0 && <Section title="Work Experience">{experiences.map((exp, i) => <ExpItem key={i} exp={exp} />)}</Section>}
      {educations.length > 0 && <Section title="Education">{educations.map((edu, i) => <EduItem key={i} edu={edu} />)}</Section>}
      {skills.length > 0 && <Section title="Skills"><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.map((s, i) => <span key={i} style={{ background: "#f3f4f6", border: "1px solid #ddd", borderRadius: 3, padding: "2px 8px", fontSize: 10 }}>{s.name}{s.level ? ` · ${s.level}` : ""}</span>)}</div></Section>}
      {projects.length > 0 && <Section title="Projects">{projects.map((p, i) => <ProjItem key={i} p={p} />)}</Section>}
      {certs.length > 0 && <Section title="Certifications">{certs.map((c, i) => <CertItem key={i} c={c} />)}</Section>}
      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateModern({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const accent = "#0f172a";

  return (
    // GOLDILOCKS SQUEEZE: Tightened padding, lowered line-height to 1.45
    <div style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 10.5, color: "#111", lineHeight: 1.45, background: "#fff", minHeight: "100%", display: "flex", boxSizing: "border-box" }}>

      {/* LEFT SIDEBAR */}
      <div style={{ width: 180, background: accent, padding: "24px 16px", color: "#fff", flexShrink: 0 }}>
        <div style={{ marginBottom: 18, pageBreakInside: "avoid", breakInside: "avoid" }}>
          <h1 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: "#fff", lineHeight: 1.2 }}>
            {full_name || <span style={{ opacity: 0.4 }}>Your Name</span>}
          </h1>
          {professional_title && (
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>
              {professional_title}
            </div>
          )}
        </div>

        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", marginBottom: 16 }}>
          <SideSection title="Contact" color="#fff">
            {email && <div style={{ fontSize: 8.5, opacity: 0.8, marginBottom: 3 }}>✉ <EmailLink email={email} /></div>}
            {phone && <div style={{ fontSize: 8.5, opacity: 0.8, marginBottom: 3 }}>📱 <PhoneLink phone={phone} /></div>}
            {location && <div style={{ fontSize: 8.5, opacity: 0.8, marginBottom: 3 }}>📍 <LocationLink location={location} /></div>}
            {linkedin && <div style={{ fontSize: 8.5, opacity: 0.8, marginBottom: 3 }}>🔗 <LinkedInLink linkedin={linkedin} /></div>}
          </SideSection>
        </div>

        {skills.length > 0 && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid", marginBottom: 16 }}>
            <SideSection title="Skills" color="#fff">
              {skills.map((s, i) => (
                <div key={i} style={{ fontSize: 8.5, opacity: 0.85, marginBottom: 3 }}>
                  • {s.name}{s.level ? ` (${s.level})` : ""}
                </div>
              ))}
            </SideSection>
          </div>
        )}

        {certs.length > 0 && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <SideSection title="Certifications" color="#fff">
              {certs.map((c, i) => (
                <div key={i} style={{ fontSize: 8.5, opacity: 0.85, marginBottom: 3 }}>
                  • {c.name}
                </div>
              ))}
            </SideSection>
          </div>
        )}
      </div>

      {/* RIGHT CONTENT AREA */}
      <div style={{ flex: 1, padding: "24px 20px" }}>
        {summary && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
            <ModSection title="Profile" accent={accent}>
              <p style={{ margin: 0, fontSize: 10, color: "#444", lineHeight: 1.5 }}>{summary}</p>
            </ModSection>
          </div>
        )}

        {experiences.length > 0 && (
          <ModSection title="Experience" accent={accent}>
            {experiences.map((exp, i) => <ExpItem key={i} exp={exp} />)}
          </ModSection>
        )}

        {educations.length > 0 && (
          <ModSection title="Education" accent={accent}>
            {educations.map((edu, i) => <EduItem key={i} edu={edu} />)}
          </ModSection>
        )}

        {projects.length > 0 && (
          <ModSection title="Projects" accent={accent}>
            {projects.map((p, i) => <ProjItem key={i} p={p} />)}
          </ModSection>
        )}

        <EmptyState resume={resume} experiences={experiences} educations={educations} />
      </div>
    </div>
  );
}

function TemplateClassic({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;

  // Goldilocks section header - balanced margins
  const ClassicSection = ({ title }) => (
    <div style={{ marginBottom: 8, marginTop: 14 }}>
      <h2 style={{
        fontSize: 13.5,
        fontWeight: 900,
        color: "#111",
        margin: 0,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: "1.5px solid #111",
        paddingBottom: 3
      }}>
        {title}
      </h2>
    </div>
  );

  return (
    // MIDDLE GROUND: 11 base font, 1.45 line height, balanced 24px 40px padding
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 11, color: "#222", lineHeight: 1.45, padding: "24px 40px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* HEADER SECTION */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 4px", color: "#111", letterSpacing: "0.02em" }}>
          {full_name || <span style={{ opacity: 0.5 }}>Andrew O'Sullivan</span>}
        </h1>
        {professional_title && <div style={{ fontSize: 15, color: "#444", fontStyle: "italic", marginBottom: 10 }}>{professional_title}</div>}

        {/* Contact Info Row */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 18px", fontSize: 11, color: "#111", fontWeight: 600 }}>
          {location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📍 <LocationLink location={location} /></span>}
          {email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>✉ <EmailLink email={email} /></span>}
          {phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📞 <PhoneLink phone={phone} /></span>}
          {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>in <LinkedInLink linkedin={linkedin} /></span>}
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <ClassicSection title="Profile" />
          <p style={{ margin: 0, color: "#222", lineHeight: 1.5, textAlign: "justify" }}>{summary}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {experiences.length > 0 && (
        <div>
          <ClassicSection title="Professional Experience" />
          {experiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12.5, color: "#111", fontWeight: 900 }}>
                  {exp.role}
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>
                  {exp.start_date} – {exp.end_date || "Present"}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                <div style={{ fontSize: 11.5, color: "#444", fontStyle: "italic" }}>
                  {exp.company}
                </div>
                {exp.location && <div style={{ fontSize: 11, color: "#555" }}>{exp.location}</div>}
              </div>
              {exp.description && (
                <div style={{ color: "#222", lineHeight: 1.45, marginTop: 3, paddingLeft: 8 }}>
                  • {exp.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EDUCATION */}
      {educations.length > 0 && (
        <div>
          <ClassicSection title="Education" />
          {educations.map((edu, i) => (
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12.5, color: "#111", fontWeight: 900 }}>
                  {edu.degree}
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>
                  {edu.start_year} – {edu.end_year}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11.5, color: "#444", fontStyle: "italic" }}>
                  {edu.institution}
                </div>
                {edu.location && <div style={{ fontSize: 11, color: "#555" }}>{edu.location}</div>}
              </div>
              {edu.score && <div style={{ fontSize: 10.5, color: "#555", marginTop: 2, fontWeight: 600 }}>{edu.score}</div>}
            </div>
          ))}
        </div>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <ClassicSection title="Skills" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", paddingLeft: 8 }}>
            {skills.map((s, i) => (
              <div key={i} style={{ display: "flex", fontSize: 11, color: "#222" }}>
                <span style={{ marginRight: 6, fontWeight: 900 }}>•</span>
                <span>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  {s.level && <span style={{ color: "#555" }}> - {s.level}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <div>
          <ClassicSection title="Projects" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 900, fontSize: 12, color: "#111" }}>{p.title}</span>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#111" }}>View Link</a>}
              </div>
              {p.tech_stack && <div style={{ fontSize: 11, color: "#444", fontStyle: "italic", marginBottom: 2 }}>{p.tech_stack}</div>}
              {p.description && <div style={{ fontSize: 11, color: "#222", lineHeight: 1.45, paddingLeft: 8 }}>• {p.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* CERTIFICATIONS / AWARDS */}
      {certs.length > 0 && (
        <div>
          <ClassicSection title="Awards & Certifications" />
          {certs.map((c, i) => (
            <div key={i} style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ fontWeight: 900, fontSize: 11.5, color: "#111" }}>{c.name}</div>
              <div style={{ color: "#444", fontSize: 11, fontStyle: "italic" }}>
                {c.issuer} {c.issue_date && `— ${c.issue_date}`}
              </div>
            </div>
          ))}
        </div>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateBanking({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const grayBg = "#e5e7eb";

  // Goldilocks Section Header (Tightened margins)
  const BankSection = ({ title }) => (
    <div style={{ background: grayBg, padding: "4px 0", marginBottom: 10, marginTop: 14, pageBreakInside: "avoid", breakInside: "avoid" }}>
      <h2 style={{ fontSize: 12.5, fontWeight: 800, color: "#111", margin: 0, textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {title}
      </h2>
    </div>
  );

  return (
    // MAX COMPRESSION / GOLDILOCKS: 10.5 base font, 1.4 line-height, balanced 20px 36px padding
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, padding: "20px 36px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* HEADER SECTION - Left Aligned */}
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px", color: "#000", letterSpacing: "-0.01em" }}>
          {full_name || <span style={{ opacity: 0.5 }}>Andrew Kim</span>}
        </h1>
        {professional_title && <div style={{ fontSize: 13.5, color: "#333", marginBottom: 8 }}>{professional_title}</div>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontSize: 10.5, color: "#333", fontWeight: 600 }}>
          {email && <span>✉ <EmailLink email={email} style={{ color: "#333" }} /></span>}
          {email && phone && <span style={{ margin: "0 6px" }}>•</span>}
          {phone && <span>📞 <PhoneLink phone={phone} style={{ color: "#333" }} /></span>}
          {phone && location && <span style={{ margin: "0 6px" }}>•</span>}
          {location && <span>📍 <LocationLink location={location} style={{ color: "#333" }} /></span>}
          {location && linkedin && <span style={{ margin: "0 6px" }}>•</span>}
          {linkedin && <span>🔗 <LinkedInLink linkedin={linkedin} style={{ color: "#333" }} /></span>}
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <BankSection title="Profile" />
          <p style={{ margin: 0, color: "#222", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
        </div>
      )}

      {/* EXPERIENCE - 2 Column Split */}
      {experiences.length > 0 && (
        <div>
          <BankSection title="Work Experience" />
          {experiences.map((exp, i) => (
            // PDF FIX: Protective wrapper around the flex layout
            <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", gap: 20 }}>
                {/* Left Column: Dates & Location */}
                <div style={{ width: "20%", flexShrink: 0, fontSize: 10.5, color: "#444" }}>
                  <div style={{ fontWeight: 600 }}>{exp.start_date} – {exp.end_date || "Present"}</div>
                  {exp.location && <div style={{ marginTop: 2 }}>{exp.location}</div>}
                </div>
                {/* Right Column: Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#000" }}>{exp.role}</div>
                  <div style={{ fontSize: 10.5, fontStyle: "italic", color: "#333", marginBottom: 3 }}>{exp.company}</div>
                  {exp.description && <div style={{ color: "#222", lineHeight: 1.4 }}>• {exp.description}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDUCATION - 2 Column Split */}
      {educations.length > 0 && (
        <div>
          <BankSection title="Education" />
          {educations.map((edu, i) => (
            // PDF FIX: Protective wrapper around the flex layout
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", gap: 20 }}>
                {/* Left Column: Dates & Location */}
                <div style={{ width: "20%", flexShrink: 0, fontSize: 10.5, color: "#444" }}>
                  <div style={{ fontWeight: 600 }}>{edu.start_year} – {edu.end_year}</div>
                  {edu.location && <div style={{ marginTop: 2 }}>{edu.location}</div>}
                </div>
                {/* Right Column: Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#000" }}>{edu.degree}</div>
                  <div style={{ fontSize: 10.5, fontStyle: "italic", color: "#333" }}>{edu.institution}</div>
                  {edu.score && <div style={{ fontSize: 10.5, color: "#555", marginTop: 2, fontWeight: 600 }}>{edu.score}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SKILLS - 2x2 Grid */}
      {skills.length > 0 && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <BankSection title="Skills" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
            {skills.map((s, i) => (
              <div key={i}>
                <div style={{ fontWeight: 800, fontSize: 10.5, color: "#000" }}>{s.name}</div>
                {s.level && <div style={{ fontSize: 10, fontStyle: "italic", color: "#444", marginTop: 1 }}>{s.level}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CERTIFICATES / PROJECTS - 2x2 Grid */}
      {(certs.length > 0 || projects.length > 0) && (
        <div>
          <BankSection title={certs.length > 0 ? "Certificates & Projects" : "Projects"} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>

            {certs.map((c, i) => (
              <div key={`c${i}`} style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: "#000" }}>{c.name}</div>
                <div style={{ fontSize: 10, fontStyle: "italic", color: "#444", marginTop: 2 }}>
                  {c.issuer} {c.issue_date && `| ${c.issue_date}`}
                </div>
              </div>
            ))}

            {projects.map((p, i) => (
              <div key={`p${i}`} style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                {/* PROJECT LINK ADDED HERE */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontWeight: 800, fontSize: 11, color: "#000" }}>{p.title}</div>
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#000", fontWeight: 700 }}>View Link</a>}
                </div>
                {p.tech_stack && <div style={{ fontSize: 10, fontStyle: "italic", color: "#444", marginTop: 2 }}>{p.tech_stack}</div>}
                {p.description && <div style={{ fontSize: 10.5, color: "#222", marginTop: 3, lineHeight: 1.4 }}>• {p.description}</div>}
              </div>
            ))}

          </div>
        </div>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateQuietBlue({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const borderBlue = "#bce3ff"; // Light sky blue for borders
  const iconBlue = "#8ab4f8"; // Blue for the small icons

  // Double-bordered centered section header (Tightened margins)
  const QuietSection = ({ title }) => (
    <div style={{
      textAlign: "center",
      borderTop: `2px solid ${borderBlue}`,
      borderBottom: `2px solid ${borderBlue}`,
      padding: "4px 0",
      margin: "12px 0 10px 0",
      pageBreakInside: "avoid",
      breakInside: "avoid"
    }}>
      <span style={{ fontSize: "12.5px", fontWeight: "bold", color: "#000", letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</span>
    </div>
  );

  return (
    // MAX COMPRESSION / GOLDILOCKS: 10.5 font, 1.4 line-height, balanced 20px 36px padding
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, padding: "20px 36px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* EXACT LEFT-ALIGNED HEADER */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 28, fontWeight: "bold", color: "#000", margin: 0 }}>
            {full_name || "Rohan Sharma"}
          </h1>
          {professional_title && (
            <span style={{ fontSize: 15, color: "#555", fontStyle: "italic" }}>
              {professional_title}
            </span>
          )}
        </div>

        {/* Contact Info */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", fontSize: 10.5, color: "#555", marginTop: 6 }}>
          {email && <span style={{ display: "flex", alignItems: "center" }}><span style={{ color: iconBlue, marginRight: 4, fontSize: 13 }}>✉</span><EmailLink email={email} /></span>}
          {phone && <span style={{ display: "flex", alignItems: "center" }}><span style={{ color: iconBlue, marginRight: 4, fontSize: 13 }}>📞</span><PhoneLink phone={phone} /></span>}
          {location && <span style={{ display: "flex", alignItems: "center" }}><span style={{ color: iconBlue, marginRight: 4, fontSize: 13 }}>📍</span><LocationLink location={location} /></span>}
          {linkedin && <span style={{ display: "flex", alignItems: "center" }}><span style={{ color: iconBlue, marginRight: 4, fontSize: 13 }}>in</span><LinkedInLink linkedin={linkedin} /></span>}
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <QuietSection title="Summary" />
          <p style={{ margin: 0, color: "#222", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {experiences.length > 0 && (
        <div>
          <QuietSection title="Professional Experience" />
          {experiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12, color: "#000", fontWeight: "bold" }}>{exp.role}</div>
                <div style={{ fontSize: 10.5, color: "#555" }}>
                  {exp.start_date} – {exp.end_date || "Present"} {exp.location && `| ${exp.location}`}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#333", fontStyle: "italic", marginBottom: 3 }}>{exp.company}</div>

              {/* Preserves line breaks for Role: and bullet points */}
              {exp.description && (
                <div style={{ color: "#222", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                  {exp.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EDUCATION */}
      {educations.length > 0 && (
        <div>
          <QuietSection title="Education" />
          {educations.map((edu, i) => (
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12, color: "#000", fontWeight: "bold" }}>{edu.degree}</div>
                <div style={{ fontSize: 10.5, color: "#555" }}>{edu.end_year || edu.start_year}</div>
              </div>
              <div style={{ fontSize: 11, color: "#333", fontStyle: "italic" }}>{edu.institution}</div>
              {edu.score && <div style={{ fontSize: 10, color: "#555", marginTop: 2, fontWeight: 600 }}>{edu.score}</div>}
            </div>
          ))}
        </div>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <div>
          <QuietSection title="Projects" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12, color: "#000", fontWeight: "bold" }}>{p.title}</div>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: iconBlue, textDecoration: "none", fontWeight: 700 }}>View Link</a>}
              </div>
              {p.tech_stack && <div style={{ fontSize: 11, color: "#333", fontStyle: "italic", marginBottom: 2 }}>{p.tech_stack}</div>}
              {p.description && <div style={{ color: "#222", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{p.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <QuietSection title="Skills" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
            {skills.map((s, i) => (
              <div key={i} style={{ fontSize: 10.5, color: "#222" }}>
                <span style={{ fontWeight: "bold" }}>{s.name}</span>
                {s.level && <span style={{ color: "#555" }}> — {s.level}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CERTIFICATIONS */}
      {certs.length > 0 && (
        <div>
          <QuietSection title="Certifications" />
          {certs.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, pageBreakInside: "avoid", breakInside: "avoid", width: "100%" }}>
              <div style={{ fontWeight: "bold", fontSize: 11, color: "#000" }}>{c.name}</div>
              <div style={{ color: "#444", fontSize: 10.5 }}>
                {c.issuer && `${c.issuer} `}
                {c.issue_date && `| ${c.issue_date}`}
              </div>
            </div>
          ))}
        </div>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateHunterGreen({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const hunter = "#385243"; // Deep olive / hunter green

  // Goldilocks Section Header (Tightened margins)
  const HunterSection = ({ title, isDark }) => (
    <div style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid" }}>
      <h2 style={{
        fontSize: 13,
        fontWeight: 800,
        color: isDark ? "#fff" : "#111",
        margin: 0,
        letterSpacing: "0.02em",
        borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.4)" : "#333"}`,
        paddingBottom: 3,
        marginBottom: 10
      }}>
        {title}
      </h2>
    </div>
  );

  return (
    // MAX COMPRESSION / GOLDILOCKS: 10.5 font, 1.4 line-height, balanced padding
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10.5, lineHeight: 1.4, background: "#fff", minHeight: "100%", display: "flex", boxSizing: "border-box" }}>

      {/* LEFT COLUMN - HUNTER GREEN (Tightened padding to 24px 24px) */}
      <div style={{ width: "35%", background: hunter, padding: "24px 24px", color: "#fff", flexShrink: 0 }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px", color: "#fff", lineHeight: 1.1 }}>
            {full_name || "Brian T. Wayne"}
          </h1>
          {professional_title && <div style={{ fontSize: 13.5, fontStyle: "italic", color: "#e2e8f0", marginBottom: 16 }}>{professional_title}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 10.5, color: "#cbd5e1" }}>
            {email && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span>✉</span> <EmailLink email={email} /></div>}
            {phone && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span>📞</span> <PhoneLink phone={phone} /></div>}
            {location && <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><span>📍</span> <LocationLink location={location} /></div>}
            {linkedin && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span>🔗</span> <LinkedInLink linkedin={linkedin} /></div>}
          </div>
        </div>

        {summary && (
          <div style={{ marginBottom: 24, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
            <HunterSection title="Profile" isDark={true} />
            <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
          </div>
        )}

        {educations.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <HunterSection title="Education" isDark={true} />
            {educations.map((edu, i) => (
              <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: "#fff", marginBottom: 2 }}>{edu.degree}</div>
                <div style={{ color: "#e2e8f0", fontStyle: "italic", marginBottom: 2, fontSize: 10.5 }}>{edu.institution}</div>
                <div style={{ color: "#cbd5e1", fontSize: 10 }}>{edu.start_year} – {edu.end_year}</div>
                {edu.score && <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 2, fontWeight: 600 }}>{edu.score}</div>}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* RIGHT COLUMN - WHITE (Tightened padding to 24px 28px) */}
      <div style={{ flex: 1, padding: "24px 28px" }}>

        {experiences.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <HunterSection title="Professional Experience" isDark={false} />
            {experiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: 14, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: "#111" }}>{exp.role}</div>
                <div style={{ color: "#555", fontSize: 10.5, fontStyle: "italic", marginBottom: 3 }}>
                  {exp.company} | {exp.start_date} – {exp.end_date || "Present"}
                </div>
                {exp.description && <div style={{ color: "#333", lineHeight: 1.4, marginTop: 4 }}>• {exp.description}</div>}
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <HunterSection title="Projects" isDark={false} />
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 800, fontSize: 11.5, color: "#111" }}>{p.title}</span>
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: hunter, fontWeight: 700, textDecoration: "none" }}>View Link</a>}
                </div>
                {p.tech_stack && <div style={{ color: "#555", fontSize: 10, fontStyle: "italic", marginBottom: 2 }}>{p.tech_stack}</div>}
                {p.description && <div style={{ color: "#333", lineHeight: 1.4, marginTop: 3 }}>• {p.description}</div>}
              </div>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <HunterSection title="Skills" isDark={false} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", color: "#333", fontSize: 10.5, pageBreakInside: "avoid", breakInside: "avoid" }}>
              {skills.map((s, i) => (
                <div key={i}>
                  • <span style={{ fontWeight: 600 }}>{s.name}</span> {s.level ? `(${s.level})` : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {certs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <HunterSection title="Awards & Certifications" isDark={false} />
            {certs.map((c, i) => (
              <div key={i} style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: "#111", marginBottom: 1 }}>{c.name}</div>
                <div style={{ color: "#555", fontSize: 10, fontStyle: "italic" }}>
                  {c.issuer} {c.issue_date && `| ${c.issue_date}`}
                </div>
              </div>
            ))}
          </div>
        )}

        <EmptyState resume={resume} experiences={experiences} educations={educations} />
      </div>

    </div>
  );
}

function TemplateSilver({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const grayBg = "#f3f4f6";

  // Goldilocks Section Header (Tightened margins)
  const SilverSection = ({ title }) => (
    <div style={{
      background: grayBg,
      padding: "4px 0",
      marginBottom: 10,
      marginTop: 14,
      pageBreakInside: "avoid",
      breakInside: "avoid"
    }}>
      <h2 style={{ fontSize: 12.5, fontWeight: 800, color: "#111", margin: 0, textAlign: "center", letterSpacing: "0.02em", textTransform: "uppercase" }}>
        {title}
      </h2>
    </div>
  );

  return (
    // MAX COMPRESSION / GOLDILOCKS: 10.5 base font, 1.4 line-height, balanced 20px 36px padding
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, padding: "20px 36px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* HEADER SECTION */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", color: "#111", letterSpacing: "0.02em" }}>
          {full_name || <span style={{ opacity: 0.5 }}>David Chen</span>}
        </h1>
        {professional_title && <div style={{ fontSize: 14, color: "#333", marginBottom: 10 }}>{professional_title}</div>}

        {/* Contact Info - Split left and right */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#111", fontWeight: 600 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {location && <span style={{ display: "flex", alignItems: "center", gap: 6 }}>📍 {location}</span>}
            {phone && <span style={{ display: "flex", alignItems: "center", gap: 6 }}>📞 {phone}</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, textAlign: "right", alignItems: "flex-end" }}>
            {email && <span style={{ display: "flex", alignItems: "center", gap: 6 }}>✉ <EmailLink email={email} /></span>}
            {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 6 }}>🔗 <LinkedInLink linkedin={linkedin} /></span>}
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <SilverSection title="Profile" />
          <p style={{ margin: 0, color: "#333", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {experiences.length > 0 && (
        <div>
          <SilverSection title="Work Experience" />
          {experiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 11.5, color: "#111" }}>
                  <span style={{ fontWeight: 800 }}>{exp.role}</span>
                  {exp.company && <span>, {exp.company}</span>}
                </div>
                <div style={{ fontSize: 10, color: "#333", textAlign: "right", lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 600 }}>{exp.start_date} – {exp.end_date || "Present"}</div>
                  {exp.location && <div>{exp.location}</div>}
                </div>
              </div>
              {exp.description && <div style={{ marginTop: 3, color: "#333", lineHeight: 1.4 }}>• {exp.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* EDUCATION */}
      {educations.length > 0 && (
        <div>
          <SilverSection title="Education" />
          {educations.map((edu, i) => (
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 11.5, color: "#111" }}>
                  <span style={{ fontWeight: 800 }}>{edu.degree}</span>
                  {edu.institution && <span>, {edu.institution}</span>}
                </div>
                <div style={{ fontSize: 10, color: "#333", textAlign: "right", lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 600 }}>{edu.start_year} – {edu.end_year}</div>
                  {edu.location && <div>{edu.location}</div>}
                </div>
              </div>
              {edu.score && <div style={{ fontSize: 10, color: "#555", marginTop: 2, fontWeight: 600 }}>{edu.score}</div>}
            </div>
          ))}
        </div>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <div>
          <SilverSection title="Projects" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 11.5, color: "#111" }}>
                  <span style={{ fontWeight: 800 }}>{p.title}</span>
                  {p.tech_stack && <span style={{ fontStyle: "italic", color: "#555" }}> | {p.tech_stack}</span>}
                </div>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#111", fontWeight: 700 }}>View Link</a>}
              </div>
              {p.description && <div style={{ marginTop: 3, color: "#333", lineHeight: 1.4 }}>• {p.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* SKILLS - 2 Column Layout */}
      {skills.length > 0 && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <SilverSection title="Skills" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
            {skills.map((s, i) => (
              <div key={i} style={{ display: "flex", fontSize: 10.5, color: "#222" }}>
                <span style={{ marginRight: 6 }}>•</span>
                <span>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  {s.level && <span style={{ color: "#555" }}> - {s.level}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CERTIFICATIONS */}
      {certs.length > 0 && (
        <div>
          <SilverSection title="Certifications" />
          {certs.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, pageBreakInside: "avoid", breakInside: "avoid", width: "100%" }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: "#111" }}>{c.name}</div>
              <div style={{ color: "#444", fontSize: 10.5 }}>
                {c.issuer && `${c.issuer} `}
                {c.issue_date && `| ${c.issue_date}`}
              </div>
            </div>
          ))}
        </div>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateSlateDawn({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const navy = "#1e3a8a";
  const slateBg = "#eef2f6"; // Light slate blue matching the header

  // Goldilocks Section Header (Tightened margins)
  const SlateSection = ({ title }) => (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{
        fontSize: 12.5,
        fontWeight: 800,
        color: navy,
        textTransform: "uppercase",
        borderBottom: `2px solid ${navy}`,
        paddingBottom: 3,
        marginBottom: 8,
        letterSpacing: "0.05em"
      }}>
        {title}
      </h2>
    </div>
  );

  return (
    // MAX COMPRESSION / GOLDILOCKS: 10.5 base font, 1.4 line-height
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* HEADER SECTION (Light Slate Blue) - Tightened padding */}
      <div style={{ background: slateBg, padding: "24px 36px 18px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px", color: navy, letterSpacing: "0.02em" }}>
          {full_name || <span style={{ opacity: 0.6 }}>Alessandro Ricci</span>}
          {professional_title && <span style={{ fontSize: 16, fontWeight: 400, color: navy, marginLeft: 8 }}>{professional_title}</span>}
        </h1>

        {/* Contact Info Row separated by | */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontSize: 10.5, color: "#444" }}>
          {email && <span><EmailLink email={email} style={{ color: "#444" }} /></span>}
          {email && phone && <span style={{ margin: "0 4px", color: "#999" }}>|</span>}
          {phone && <span><PhoneLink phone={phone} style={{ color: "#444" }} /></span>}
          {phone && location && <span style={{ margin: "0 4px", color: "#999" }}>|</span>}
          {location && <span><LocationLink location={location} style={{ color: "#444" }} /></span>}
          {location && linkedin && <span style={{ margin: "0 4px", color: "#999" }}>|</span>}
          {linkedin && <span><LinkedInLink linkedin={linkedin} style={{ color: "#444" }} /></span>}
        </div>
      </div>

      {/* TWO COLUMN BODY SECTION - Tightened padding */}
      <div style={{ padding: "20px 36px", display: "flex", gap: 32 }}>

        {/* LEFT COLUMN */}
        <div style={{ flex: 1 }}>

          {/* Summary / Profile */}
          {summary && (
            <div style={{ marginBottom: 20, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <SlateSection title="Profile" />
              <p style={{ margin: 0, color: "#333", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
            </div>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SlateSection title="Education" />
              {educations.map((edu, i) => (
                <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                  <div style={{ fontWeight: 800, fontSize: 11.5, color: "#111" }}>{edu.degree}</div>
                  <div style={{ color: "#333", fontSize: 10.5 }}>{edu.institution}</div>
                  {edu.score && <div style={{ fontSize: 10, color: "#555", marginTop: 2, fontWeight: 600 }}>{edu.score}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Projects (Maps to "Academic Research" visually in the template) */}
          {projects.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SlateSection title="Academic Research" />
              {projects.map((p, i) => (
                <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontWeight: 800, fontSize: 11.5, color: "#111" }}>{p.title}</div>
                    {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: navy, fontWeight: 700, textDecoration: "none" }}>Link</a>}
                  </div>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 2, fontStyle: "italic" }}>{p.tech_stack}</div>
                  {p.description && <div style={{ color: "#444", lineHeight: 1.4, marginTop: 2 }}>• {p.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1 }}>

          {/* Professional Experience */}
          {experiences.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SlateSection title="Professional Experience" />
              {experiences.map((exp, i) => (
                <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                  <div style={{ fontWeight: 800, fontSize: 11.5, color: "#111" }}>{exp.role}</div>
                  <div style={{ color: "#444", fontSize: 10.5 }}>{exp.company}</div>
                  <div style={{ fontSize: 10, color: "#666", marginBottom: 3, fontStyle: "italic" }}>{exp.start_date} – {exp.end_date || "Present"}</div>
                  {exp.description && <div style={{ color: "#444", lineHeight: 1.4, marginTop: 2 }}>• {exp.description}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications (Maps to "Licensure & Certification") */}
          {certs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SlateSection title="Licensure & Certification" />
              {certs.map((c, i) => (
                <div key={i} style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                  <span style={{ fontWeight: 800, fontSize: 11, color: "#111" }}>{c.name}</span>
                  <div style={{ color: "#555", fontSize: 10, fontStyle: "italic" }}>{c.issuer || "Passed"} | {c.issue_date}</div>
                </div>
              ))}
            </div>
          )}

          {/* Skills (Maps to "Languages" visually in the template) */}
          {skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SlateSection title="Skills & Languages" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, pageBreakInside: "avoid", breakInside: "avoid" }}>
                {skills.map((s, i) => (
                  <div key={i} style={{ fontSize: 10.5, color: "#222" }}>
                    <span style={{ fontWeight: 800 }}>{s.name}</span>
                    {s.level && <span style={{ color: "#555" }}>: {s.level}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateRosewood({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const pink = "#d4669e";

  // Special section header for Rosewood with emojis
  const RoseSection = ({ title, icon, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, background: "#f3f4f6", padding: "6px 12px", textAlign: "center", marginBottom: 12, letterSpacing: "0.05em", color: "#111", borderRadius: 4 }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 11, color: "#222", lineHeight: 1.6, padding: "36px 40px", background: "#fff", minHeight: "100%", border: `12px solid ${pink}`, boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px", color: "#111", letterSpacing: "0.02em" }}>{full_name || <span style={{ color: "#ccc" }}>Your Name</span>}</h1>
        {professional_title && <div style={{ fontSize: 14, color: "#555", fontStyle: "italic", marginBottom: 10 }}>{professional_title}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, fontSize: 11, color: "#666" }}>
          {email && <span><EmailLink email={email} style={{ color: "#666" }} /></span>}
          {phone && <span><PhoneLink phone={phone} style={{ color: "#666" }} /></span>}
          {location && <span><LocationLink location={location} style={{ color: "#666" }} /></span>}
          {linkedin && <span><LinkedInLink linkedin={linkedin} style={{ color: "#666" }} /></span>}
        </div>
      </div>

      {summary && <RoseSection title="PROFILE" icon="🎓"><p style={{ margin: 0, fontSize: 11, lineHeight: 1.7 }}>{summary}</p></RoseSection>}
      {experiences.length > 0 && <RoseSection title="EXPERIENCE" icon="💼">{experiences.map((exp, i) => <ExpItem key={i} exp={exp} />)}</RoseSection>}
      {educations.length > 0 && <RoseSection title="EDUCATION" icon="📚">{educations.map((edu, i) => <EduItem key={i} edu={edu} />)}</RoseSection>}
      {skills.length > 0 && <RoseSection title="SKILLS" icon="⚡"><div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>{skills.map((s, i) => <span key={i} style={{ background: "#fff", border: `1px solid ${pink}50`, color: "#111", borderRadius: 20, padding: "3px 12px", fontSize: 10.5 }}>{s.name}{s.level ? ` (${s.level})` : ""}</span>)}</div></RoseSection>}
      {projects.length > 0 && <RoseSection title="PROJECTS" icon="🚀">{projects.map((p, i) => <ProjItem key={i} p={p} />)}</RoseSection>}
      {certs.length > 0 && <RoseSection title="CERTIFICATIONS" icon="🏆">{certs.map((c, i) => <CertItem key={i} c={c} />)}</RoseSection>}
      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateHarvard({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;

  // Custom Harvard-style section header (bold, standard case, full black underline)
  const HarvardSection = ({ title }) => (
    <div style={{ marginBottom: 10, marginTop: 16 }}>
      <h2 style={{
        fontSize: 14,
        fontWeight: "bold",
        color: "#000",
        margin: 0,
        borderBottom: "1.5px solid #000",
        paddingBottom: 2
      }}>
        {title}
      </h2>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 11.5, color: "#000", lineHeight: 1.5, padding: "40px 48px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* HEADER SECTION - Centered */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: "bold", margin: "0 0 4px", color: "#000" }}>
          {full_name || <span style={{ opacity: 0.5 }}>Lee Wang</span>}
        </h1>
        {professional_title && <div style={{ fontSize: 14, color: "#333", marginBottom: 6 }}>{professional_title}</div>}

        {/* Contact Info */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", fontSize: 11 }}>
          {email && <span>✉ <EmailLink email={email} /></span>}
          {phone && <span>📱 <a href={`tel:${phone}`} style={{ textDecoration: "none", color: "inherit" }}>{phone}</a></span>}
          {location && <span>📍 <a href={`https://maps.google.com/?q=${encodeURIComponent(location)}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>{location}</a></span>}
          {linkedin && <span>🔗 <LinkedInLink linkedin={linkedin} /></span>}
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div>
          <HarvardSection title="Professional Summary" />
          <p style={{ margin: 0, color: "#000", lineHeight: 1.5, textAlign: "justify" }}>{summary}</p>
        </div>
      )}

      {/* EDUCATION */}
      {educations.length > 0 && (
        <div>
          <HarvardSection title="Education" />
          {educations.map((edu, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{edu.institution}</div>
                <div style={{ fontSize: 11 }}>{edu.start_year} – {edu.end_year}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11.5, fontStyle: "italic" }}>{edu.degree}</div>
                {edu.location && <div style={{ fontSize: 11 }}>{edu.location}</div>}
              </div>
              {edu.score && <div style={{ fontSize: 10.5, color: "#555", marginTop: 2, fontWeight: 600 }}>{edu.score}</div>}
            </div>
          ))}
        </div>
      )}

      {/* TECHNICAL SKILLS - 4 Column Grid */}
      {skills.length > 0 && (
        <div>
          <HarvardSection title="Technical Skills" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px 12px", marginTop: 6 }}>
            {skills.map((s, i) => (
              <div key={i} style={{ fontSize: 11, color: "#000" }}>
                • {s.name} {s.level ? `(${s.level})` : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFESSIONAL EXPERIENCE */}
      {experiences.length > 0 && (
        <div>
          <HarvardSection title="Professional Experience" />
          {experiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{exp.company}</div>
                <div style={{ fontSize: 11 }}>{exp.start_date} – {exp.end_date || "present"}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 11.5, fontStyle: "italic" }}>{exp.role}</div>
                {exp.location && <div style={{ fontSize: 11 }}>{exp.location}</div>}
              </div>
              {exp.description && (
                <div style={{ color: "#000", lineHeight: 1.5, paddingLeft: 12, textIndent: -12 }}>
                  • {exp.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <div>
          <HarvardSection title="Academic & Personal Projects" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{p.title}</div>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#000" }}>View Project</a>}
              </div>
              {p.tech_stack && <div style={{ fontSize: 11, fontStyle: "italic", marginBottom: 2 }}>{p.tech_stack}</div>}
              {p.description && (
                <div style={{ color: "#000", lineHeight: 1.5, paddingLeft: 12, textIndent: -12 }}>
                  • {p.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CERTIFICATIONS */}
      {certs.length > 0 && (
        <div>
          <HarvardSection title="Certifications" />
          {certs.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontWeight: "bold", fontSize: 11.5 }}>{c.name}</div>
              <div style={{ fontSize: 11 }}>
                {c.issuer} {c.issue_date && `| ${c.issue_date}`}
              </div>
            </div>
          ))}
        </div>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateCreative({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const purple = "#8b5cf6"; // Vivid purple

  // Custom section header with tightened margins
  const CreativeSection = ({ title, children }) => (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{
        fontSize: 13,
        fontWeight: 800,
        color: purple,
        textTransform: "uppercase",
        borderBottom: `2px solid ${purple}`,
        paddingBottom: 3,
        marginBottom: 8,
        letterSpacing: "0.05em"
      }}>
        {title}
      </h2>
      {children}
    </div>
  );

  return (
    // THE GOLDILOCKS: 10.5 font, 1.4 line-height, balanced 20px 36px outer padding.
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* HEADER SECTION - Tightened padding */}
      <div style={{ background: purple, padding: "24px 36px", color: "#fff" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", letterSpacing: "0.02em" }}>
          {full_name || <span style={{ opacity: 0.6 }}>Mateo Vargas</span>}
        </h1>
        {professional_title && <div style={{ fontSize: 15, opacity: 0.9, marginBottom: 10 }}>{professional_title}</div>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", fontSize: 10.5, color: "#f1f5f9" }}>
          {email && <span>✉ <EmailLink email={email} /></span>}
          {phone && <span>📱 <a href={`tel:${phone}`} style={{ textDecoration: "none", color: "inherit" }}>{phone}</a></span>}
          {location && <span>📍 <LocationLink location={location} /></span>}
          {linkedin && <span>🔗 <LinkedInLink linkedin={linkedin} /></span>}
        </div>
      </div>

      {/* BODY SECTION - Tightened padding */}
      <div style={{ padding: "18px 36px" }}>

        {/* Summary */}
        {summary && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
            <CreativeSection title="Profile">
              <p style={{ margin: 0, color: "#333", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
            </CreativeSection>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div>
            <CreativeSection title="Experience">
              {experiences.map((exp, i) => (
                <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: "#111" }}>{exp.role}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>{exp.start_date} – {exp.end_date || "Present"}</div>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#444", fontStyle: "italic", marginBottom: 2 }}>{exp.company}</div>
                  {exp.description && <div style={{ color: "#333", lineHeight: 1.4 }}>• {exp.description}</div>}
                </div>
              ))}
            </CreativeSection>
          </div>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <div>
            <CreativeSection title="Education">
              {educations.map((edu, i) => (
                <div key={i} style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#111" }}>{edu.degree}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>{edu.start_year} – {edu.end_year}</div>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#444" }}>{edu.institution} {edu.score && `| Score: ${edu.score}`}</div>
                </div>
              ))}
            </CreativeSection>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <CreativeSection title="Projects">
              {projects.map((p, i) => (
                <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: "#111" }}>{p.title}</div>
                    {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: purple, fontWeight: 700, textDecoration: "none" }}>View Link</a>}
                  </div>
                  {p.tech_stack && <div style={{ fontSize: 10.5, color: "#555", fontStyle: "italic", marginBottom: 2 }}>{p.tech_stack}</div>}
                  {p.description && <div style={{ color: "#333", lineHeight: 1.4 }}>• {p.description}</div>}
                </div>
              ))}
            </CreativeSection>
          </div>
        )}

        {/* Skills - VERTICAL CENTERING FIX */}
        {skills.length > 0 && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
            <CreativeSection title="Skills">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((s, i) => (
                  <div key={i} style={{
                    background: "#f3f4f6",
                    color: "#333",
                    border: "1px solid #e5e7eb",
                    padding: "0 10px",
                    height: "22px",           /* Strict height */
                    lineHeight: "22px",       /* Centering trick */
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    display: "inline-block"   /* Prevents flex bugs */
                  }}>
                    {s.name} {s.level ? `(${s.level})` : ""}
                  </div>
                ))}
              </div>
            </CreativeSection>
          </div>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <div>
            <CreativeSection title="Certifications">
              {certs.map((c, i) => (
                <div key={i} style={{ marginBottom: 6, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                  <span style={{ fontWeight: 800, fontSize: 11, color: "#111" }}>{c.name}</span>
                  <span style={{ color: "#555", fontSize: 10.5 }}>
                    {c.issuer && ` · ${c.issuer}`} {c.issue_date && ` · ${c.issue_date}`}
                  </span>
                </div>
              ))}
            </CreativeSection>
          </div>
        )}

        <EmptyState resume={resume} experiences={experiences} educations={educations} />
      </div>
    </div>
  );
}

function TemplateBlackPattern({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;

  // PDF-SAFE STRIPES
  const darkPattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231e293b' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;

  // Goldilocks section header
  const PatternSection = ({ title, children }) => (
    <div style={{ marginBottom: 10 }}>
      <h2 style={{
        display: "inline-block",
        fontSize: 13,
        fontWeight: 900,
        color: "#111",
        borderBottom: "2px solid #111",
        paddingBottom: 2,
        marginBottom: 6,
        letterSpacing: "0.02em"
      }}>
        {title}
      </h2>
      {children}
    </div>
  );

  return (
    // THE TRUE GOLDILOCKS: 10.5 font, 1.4 line-height, balanced outer padding.
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, background: "#fff", minHeight: "100%", boxSizing: "border-box", overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        backgroundColor: "#0f172a",
        backgroundImage: darkPattern,
        padding: "20px 36px",
        boxSizing: "border-box",
        color: "#fff",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact"
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", position: "relative", letterSpacing: "0.02em" }}>
          {full_name || <span style={{ opacity: 0.5 }}>Catherine Bale</span>}
        </h1>
        {professional_title && <div style={{ fontSize: 13.5, fontStyle: "italic", color: "#cbd5e1", marginBottom: 10 }}>{professional_title}</div>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>
          {location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📍 <LocationLink location={location} style={{ color: "#94a3b8" }} /></span>}
          {phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📞 <PhoneLink phone={phone} style={{ color: "#94a3b8" }} /></span>}
          {email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>✉ <EmailLink email={email} style={{ color: "#94a3b8" }} /></span>}
          {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>🔗 <LinkedInLink linkedin={linkedin} style={{ color: "#94a3b8" }} /></span>}
        </div>
      </div>

      {/* Body Content */}
      <div style={{ padding: "16px 36px" }}>

        {/* Summary */}
        {summary && (
          <PatternSection title="Profile">
            <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <p style={{ margin: 0, color: "#333", lineHeight: 1.4, textAlign: "justify" }}>{summary}</p>
            </div>
          </PatternSection>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <PatternSection title="Professional Experience">
            {experiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 11.5, color: "#111" }}>
                    <span style={{ fontWeight: 800 }}>{exp.company}</span>
                    {exp.role && <span style={{ fontStyle: "italic" }}>, {exp.role}</span>}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#555" }}>
                    {exp.start_date} – {exp.end_date || "Present"}
                  </div>
                </div>
                {exp.description && <div style={{ marginTop: 2, color: "#333", lineHeight: 1.4 }}>{exp.description}</div>}
              </div>
            ))}
          </PatternSection>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <PatternSection title="Education">
            {educations.map((edu, i) => (
              <div key={i} style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 11.5, color: "#111" }}>
                    <span style={{ fontWeight: 800 }}>{edu.degree}</span>
                    {edu.institution && <span style={{ fontStyle: "italic" }}>, {edu.institution}</span>}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#555" }}>
                    {edu.start_year} – {edu.end_year}
                  </div>
                </div>
                {edu.score && <div style={{ fontSize: 10, color: "#555", marginTop: 2, fontWeight: 600 }}>{edu.score}</div>}
              </div>
            ))}
          </PatternSection>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <PatternSection title="Projects">
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 11.5, color: "#111" }}>
                    <span style={{ fontWeight: 800 }}>{p.title}</span>
                    {p.tech_stack && <span style={{ fontStyle: "italic", color: "#555" }}> | {p.tech_stack}</span>}
                  </div>
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: "#111" }}>View Project</a>}
                </div>
                {p.description && <div style={{ marginTop: 2, color: "#333", lineHeight: 1.4 }}>{p.description}</div>}
              </div>
            ))}
          </PatternSection>
        )}

        {/* Certifications - THE BULLETPROOF ALIGNMENT FIX */}
        {certs.length > 0 && (
          <PatternSection title="Certificates">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, pageBreakInside: "avoid", breakInside: "avoid", width: "100%" }}>
              {certs.map((c, i) => (
                <div key={i} style={{
                  background: "#111",
                  color: "#fff",
                  padding: "0 10px",          /* Removed vertical padding completely */
                  height: "22px",             /* Explicit height */
                  lineHeight: "22px",         /* Line-height matching height perfectly centers text */
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  display: "inline-block"
                }}>
                  {c.name} {c.issue_date && `(${c.issue_date})`}
                </div>
              ))}
            </div>
          </PatternSection>
        )}

        {/* Skills - 2 Column Layout with Progress bars */}
        {skills.length > 0 && (
          <PatternSection title="Skills">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", pageBreakInside: "avoid", breakInside: "avoid", width: "100%" }}>
              {skills.map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 10.5, color: "#111" }}>{s.name}</span>
                    <div style={{ width: "40%", height: 3, background: "#e2e8f0", borderRadius: 2 }}>
                      <div style={{ width: s.level === "Expert" ? "100%" : s.level === "Advanced" ? "80%" : s.level === "Intermediate" ? "60%" : "40%", height: "100%", background: "#111", borderRadius: 2 }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PatternSection>
        )}

        <EmptyState resume={resume} experiences={experiences} educations={educations} />
      </div>
    </div>
  );
}

function TemplateAtlantic({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const navy = "#313c4e";
  const coral = "#eb636b";

  // Goldilocks Section Header (Tightened margins)
  const AtlanticSection = ({ title, icon, isDark }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <h2 style={{ fontSize: 12.5, fontWeight: 800, color: isDark ? "#fff" : navy, margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {title}
        </h2>
      </div>
      {/* Coral Dotted Underline representing the zig-zag */}
      <div style={{ borderBottom: `2px dotted ${coral}`, width: "100%", marginBottom: 8 }}></div>
    </div>
  );

  return (
    // MAX COMPRESSION / GOLDILOCKS: 10.5 font, 1.4 line-height
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10.5, lineHeight: 1.4, background: "#fff", minHeight: "100%", display: "flex", boxSizing: "border-box" }}>

      {/* LEFT COLUMN - NAVY (Tightened padding to 20px 24px) */}
      <div style={{ width: "35%", background: navy, padding: "20px 24px", color: "#fff", flexShrink: 0 }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "#fff", lineHeight: 1.1 }}>
            {full_name || "Brian T. Wayne"}
          </h1>
          {professional_title && <div style={{ fontSize: 13.5, color: "#ccc", marginBottom: 14 }}>{professional_title}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 10.5, color: "#ddd" }}>
            {email && <div style={{ display: "flex", alignItems: "center" }}><span style={{ color: coral, marginRight: 6 }}>✉</span><EmailLink email={email} style={{ color: "#ddd" }} /></div>}
            {phone && <div style={{ display: "flex", alignItems: "center" }}><span style={{ color: coral, marginRight: 6 }}>📞</span><PhoneLink phone={phone} style={{ color: "#ddd" }} /></div>}
            {location && <div style={{ display: "flex", alignItems: "center" }}><span style={{ color: coral, marginRight: 6 }}>📍</span><LocationLink location={location} style={{ color: "#ddd" }} /></div>}
            {linkedin && <div style={{ display: "flex", alignItems: "center" }}><span style={{ color: coral, marginRight: 6 }}>🔗</span><LinkedInLink linkedin={linkedin} style={{ color: "#ddd" }} /></div>}
          </div>
        </div>

        {summary && (
          <div style={{ marginBottom: 20, pageBreakInside: "avoid", breakInside: "avoid" }}>
            <AtlanticSection title="Profile" icon="👤" isDark={true} />
            <p style={{ margin: 0, color: "#ccc", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
          </div>
        )}

        {educations.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <AtlanticSection title="Education" icon="🎓" isDark={true} />
            {educations.map((edu, i) => (
              <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid" }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: "#fff" }}>{edu.degree}</div>
                <div style={{ color: "#ccc", fontSize: 10.5 }}>{edu.institution}</div>
                {edu.score && <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{edu.score}</div>}
              </div>
            ))}
          </div>
        )}

        {certs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <AtlanticSection title="Certifications" icon="🏆" isDark={true} />
            {certs.map((c, i) => (
              <div key={i} style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid" }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: "#fff" }}>{c.name}</div>
                <div style={{ color: "#ccc", fontSize: 10 }}>{c.issuer} {c.issue_date && `| ${c.issue_date}`}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN - WHITE (Tightened padding to 20px 28px) */}
      <div style={{ flex: 1, padding: "20px 28px" }}>

        {experiences.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <AtlanticSection title="Professional Experience" icon="💼" isDark={false} />
            {experiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: navy }}>{exp.company}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{exp.start_date} – {exp.end_date || "Present"}</div>
                </div>
                <div style={{ color: "#555", fontSize: 11, marginBottom: 2, fontStyle: "italic" }}>
                  {exp.role}
                </div>
                {exp.description && <div style={{ color: "#333", lineHeight: 1.4, marginTop: 3 }}>• {exp.description}</div>}
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <AtlanticSection title="Projects" icon="🚀" isDark={false} />
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                {/* FLEX BOX ADDED HERE to push Link to the right side! */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: navy }}>{p.title}</div>
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: coral, fontWeight: 700, textDecoration: "none" }}>View Link</a>}
                </div>
                <div style={{ color: "#555", fontSize: 10.5, fontStyle: "italic", marginBottom: 2 }}>{p.tech_stack}</div>
                {p.description && <div style={{ color: "#333", lineHeight: 1.4, marginTop: 2 }}>• {p.description}</div>}
              </div>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <AtlanticSection title="Skills" icon="⚡" isDark={false} />
            {/* WRAPPING ROW: Changed from column to wrap, added bulletproof PDF alignment */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, pageBreakInside: "avoid", breakInside: "avoid", width: "100%" }}>
              {skills.map((s, i) => (
                <div key={i} style={{
                  background: coral,
                  color: "#fff",
                  padding: "0 10px",
                  height: "22px",           /* Strict height */
                  lineHeight: "22px",       /* Matches height to perfectly center text */
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: "inline-block"   /* Prevents html2canvas flex bugs */
                }}>
                  {s.name} {s.level ? `— ${s.level}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        <EmptyState resume={resume} experiences={experiences} educations={educations} />
      </div>

    </div>
  );
}

function TemplateBlueAccent({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const accent = "#4f39a3"; // The specific purple/blue accent color

  // Custom section header with Goldilocks spacing
  const AccentSection = ({ title, icon, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0, letterSpacing: "0.02em" }}>{title}</h2>
      </div>
      {/* The short thick underline */}
      <div style={{ width: 32, height: 3.5, background: accent, borderRadius: 2, marginBottom: 10 }}></div>
      {children}
    </div>
  );

  return (
    // THE GOLDILOCKS: 10.5 font, 1.4 line-height, balanced 20px 40px outer padding
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, padding: "20px 40px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* Header - Tightened margins */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: accent, letterSpacing: "0.02em" }}>
          {full_name || <span style={{ opacity: 0.5 }}>Your Name</span>}
        </h1>
        {professional_title && <div style={{ fontSize: 13.5, color: "#555", fontStyle: "italic", marginBottom: 8 }}>{professional_title}</div>}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 16px", fontSize: 10.5, color: "#444", fontWeight: 600 }}>
          {location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📍 <LocationLink location={location} /></span>}
          {email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>✉ <EmailLink email={email} /></span>}
          {phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📞 <PhoneLink phone={phone} /></span>}
          {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>🔗 <LinkedInLink linkedin={linkedin} /></span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <AccentSection title="Profile" icon="📇">
            <p style={{ margin: 0, color: "#444", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
          </AccentSection>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div>
          <AccentSection title="Professional Experience" icon="💼">
            {experiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 800, fontSize: 11.5, color: "#111" }}>{exp.company}</span>
                  <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>{exp.start_date} – {exp.end_date || "Present"}</span>
                </div>
                <div style={{ fontSize: 10.5, fontStyle: "italic", color: "#555", marginBottom: 3 }}>{exp.role}</div>
                {exp.description && <div style={{ color: "#444", marginTop: 2, lineHeight: 1.4 }}>• {exp.description}</div>}
              </div>
            ))}
          </AccentSection>
        </div>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <div>
          <AccentSection title="Education" icon="🎓">
            {educations.map((edu, i) => (
              <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 800, fontSize: 11.5, color: "#111" }}>{edu.degree}</span>
                  <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>{edu.start_year} – {edu.end_year}</span>
                </div>
                <div style={{ fontSize: 10.5, fontStyle: "italic", color: "#555" }}>
                  {edu.institution}{edu.score && ` · Score: ${edu.score}`}
                </div>
              </div>
            ))}
          </AccentSection>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <AccentSection title="Projects" icon="🚀">
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 800, fontSize: 11.5, color: "#111" }}>{p.title}</span>
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: accent, fontWeight: 700, textDecoration: "none" }}>View Link</a>}
                </div>
                {p.tech_stack && <div style={{ fontSize: 10, fontStyle: "italic", color: "#666", marginBottom: 2 }}>{p.tech_stack}</div>}
                {p.description && <div style={{ color: "#444", lineHeight: 1.4 }}>• {p.description}</div>}
              </div>
            ))}
          </AccentSection>
        </div>
      )}

      {/* Skills - VERTICAL CENTERING FIX */}
      {skills.length > 0 && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <AccentSection title="Skills" icon="⚡">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.map((s, i) => (
                <div key={i} style={{
                  border: "1.5px solid #444",
                  borderRadius: 4,
                  padding: "0 10px",          /* Removed vertical padding */
                  height: "22px",             /* Strict height */
                  lineHeight: "22px",         /* Centering trick */
                  fontSize: 10,
                  color: "#222",
                  fontWeight: 600,
                  display: "inline-block"
                }}>
                  {s.name} {s.level ? `(${s.level})` : ""}
                </div>
              ))}
            </div>
          </AccentSection>
        </div>
      )}

      {/* Certifications */}
      {certs.length > 0 && (
        <div>
          <AccentSection title="Certifications" icon="🏆">
            {certs.map((c, i) => (
              <div key={i} style={{ marginBottom: 6, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
                <span style={{ fontWeight: 800, fontSize: 11, color: "#111" }}>{c.name}</span>
                <span style={{ color: "#555", fontSize: 10.5 }}>
                  {c.issuer && ` · ${c.issuer}`} {c.issue_date && ` · ${c.issue_date}`}
                </span>
              </div>
            ))}
          </AccentSection>
        </div>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateGreenAccent({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const teal = "#0d9488"; // Deep green/teal accent color

  // Custom section header with tightened margins
  const GreenSection = ({ title, children }) => (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: teal, borderBottom: `1.5px solid ${teal}`, paddingBottom: 3, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </h2>
      {children}
    </div>
  );

  // Custom layout: Date on the left (in teal), content on the right
  const SplitItem = ({ dates, title, subtitle, locationText, description, link }) => (
    <div style={{ display: "flex", marginBottom: 10, gap: 16, pageBreakInside: "avoid", breakInside: "avoid", width: "100%" }}>
      <div style={{ width: 100, flexShrink: 0, color: teal, fontSize: 10, fontWeight: 700 }}>
        {dates}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 11.5, color: "#111" }}>
            <span style={{ fontWeight: 800 }}>{title}</span>
            {subtitle && <span style={{ fontStyle: "italic", fontWeight: 400 }}>, {subtitle}</span>}
          </div>
          {/* Enhanced Right Side (Link or Location) */}
          {link ? (
            <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: teal, fontWeight: 700, textDecoration: "none" }}>View Link</a>
          ) : locationText && (
            <span style={{ fontSize: 10.5, color: "#333" }}>{locationText}</span>
          )}
        </div>
        {description && <div style={{ marginTop: 2, color: "#333", fontSize: 10.5, lineHeight: 1.4 }}>• {description}</div>}
      </div>
    </div>
  );

  return (
    // THE GOLDILOCKS: 10.5 font, 1.4 line-height, balanced 20px 36px outer padding.
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, padding: "20px 36px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 600,
          margin: "0 0 4px",
          color: teal,
          fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive, Georgia, serif"
        }}>
          {full_name || <span style={{ opacity: 0.5 }}>Your Name</span>}
        </h1>
        {professional_title && <div style={{ fontSize: 13.5, color: "#555", marginBottom: 8 }}>{professional_title}</div>}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: 10.5, color: "#333", fontWeight: 600 }}>
          {location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📍 <LocationLink location={location} /></span>}
          {email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>✉ <EmailLink email={email} /></span>}
          {phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📞 <PhoneLink phone={phone} /></span>}
          {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>🔗 <LinkedInLink linkedin={linkedin} /></span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <GreenSection title="Profile">
            <p style={{ margin: 0, color: "#333", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
          </GreenSection>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <GreenSection title="Work Experience">
          {experiences.map((exp, i) => (
            <SplitItem
              key={i}
              dates={`${exp.start_date} – ${exp.end_date || "Present"}`}
              title={exp.role}
              subtitle={exp.company}
              description={exp.description}
            />
          ))}
        </GreenSection>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <GreenSection title="Education">
          {educations.map((edu, i) => (
            <SplitItem
              key={i}
              dates={`${edu.start_year} – ${edu.end_year}`}
              title={edu.degree}
              subtitle={edu.institution}
              locationText={edu.score}
            />
          ))}
        </GreenSection>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <GreenSection title="Projects">
          {projects.map((p, i) => (
            <SplitItem
              key={i}
              dates={p.tech_stack || "Project"}
              title={p.title}
              link={p.link}
              description={p.description}
            />
          ))}
        </GreenSection>
      )}

      {/* Skills - VERTICAL CENTERING FIX */}
      {skills.length > 0 && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <GreenSection title="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.map((s, i) => (
                <div key={i} style={{
                  border: "1.5px solid #444",
                  borderRadius: 4,
                  padding: "0 10px",          /* Removed vertical padding */
                  height: "22px",             /* Strict height */
                  lineHeight: "22px",         /* Line-height matching height perfectly centers text */
                  fontSize: 10,
                  color: "#222",
                  fontWeight: 600,
                  display: "inline-block"
                }}>
                  {s.name} {s.level ? `(${s.level})` : ""}
                </div>
              ))}
            </div>
          </GreenSection>
        </div>
      )}

      {/* Certifications */}
      {certs.length > 0 && (
        <GreenSection title="Certifications">
          {certs.map((c, i) => (
            <SplitItem
              key={i}
              dates={c.issue_date || "Certified"}
              title={c.name}
              subtitle={c.issuer}
            />
          ))}
        </GreenSection>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}
function TemplateSimplyBlue({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const blue = "#2a3b8f"; // Deep vibrant blue
  const lightBg = "#f0f4f8"; // Light grey-blue for section headers

  // Custom section header with light background (Margins tightened)
  const SimplyBlueSection = ({ title }) => (
    <div style={{ background: lightBg, padding: "4px 0", marginBottom: 10, marginTop: 14, pageBreakInside: "avoid", breakInside: "avoid" }}>
      <h2 style={{ fontSize: 12.5, fontWeight: 800, color: blue, margin: 0, textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {title}
      </h2>
    </div>
  );

  return (
    // MAX COMPRESSION / GOLDILOCKS: 10.5 base font, 1.4 line-height, balanced 20px 36px padding
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10.5, color: "#222", lineHeight: 1.4, padding: "20px 36px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      {/* HEADER SECTION */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: blue, letterSpacing: "0.02em" }}>
            {full_name || <span style={{ opacity: 0.5 }}>Anna Field</span>}
          </h1>
          {professional_title && (
            <span style={{ fontSize: 15, color: blue, marginLeft: 10, fontWeight: 500 }}>
              {professional_title}
            </span>
          )}
        </div>

        {/* Contact Info Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", fontSize: 10.5, color: "#111", fontWeight: 600 }}>
          {location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📍 <LocationLink location={location} /></span>}
          {email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>✉ <EmailLink email={email} /></span>}
          {phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📞 <PhoneLink phone={phone} /></span>}
          {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>🔗 <LinkedInLink linkedin={linkedin} /></span>}
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <SimplyBlueSection title="Profile" />
          <p style={{ margin: 0, color: "#333", lineHeight: 1.45, textAlign: "justify" }}>{summary}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {experiences.length > 0 && (
        <div>
          <SimplyBlueSection title="Work Experience" />
          {experiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11.5, color: "#111", fontWeight: 800 }}>{exp.role}</div>
                <div style={{ fontSize: 10.5, color: "#333" }}>{exp.start_date} – {exp.end_date || "Present"}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                <div style={{ fontSize: 11, color: "#333", fontStyle: "italic" }}>{exp.company}</div>
                {exp.location && <div style={{ fontSize: 10.5, color: "#333" }}>{exp.location}</div>}
              </div>
              {exp.description && <div style={{ color: "#333", lineHeight: 1.4, marginTop: 2 }}>• {exp.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* EDUCATION */}
      {educations.length > 0 && (
        <div>
          <SimplyBlueSection title="Education" />
          {educations.map((edu, i) => (
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11.5, color: "#111", fontWeight: 800 }}>{edu.degree}</div>
                <div style={{ fontSize: 10.5, color: "#333" }}>{edu.start_year} – {edu.end_year}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11, color: "#333", fontStyle: "italic" }}>{edu.institution}</div>
                {edu.location && <div style={{ fontSize: 10.5, color: "#333" }}>{edu.location}</div>}
              </div>
              {edu.score && <div style={{ fontSize: 10.5, color: "#555", marginTop: 2 }}>{edu.score}</div>}
            </div>
          ))}
        </div>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <div>
          <SimplyBlueSection title="Projects" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11.5, color: "#111", fontWeight: 800 }}>{p.title}</div>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: blue, fontWeight: 700 }}>View Link</a>}
              </div>
              {p.tech_stack && <div style={{ fontSize: 10.5, color: "#555", fontStyle: "italic", marginBottom: 2 }}>{p.tech_stack}</div>}
              {p.description && <div style={{ color: "#333", lineHeight: 1.4, marginTop: 2 }}>• {p.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <SimplyBlueSection title="Skills" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
            {skills.map((s, i) => (
              <div key={i} style={{ fontSize: 10.5, color: "#222" }}>
                <span style={{ marginRight: 6, color: blue }}>•</span>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                {s.level && <span style={{ color: "#555" }}> — {s.level}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CERTIFICATIONS */}
      {certs.length > 0 && (
        <div>
          <SimplyBlueSection title="Certifications" />
          {certs.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid", width: "100%" }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: "#111" }}>{c.name}</div>
              <div style={{ color: "#444", fontSize: 10.5 }}>
                {c.issuer && `${c.issuer} `}
                {c.issue_date && `| ${c.issue_date}`}
              </div>
            </div>
          ))}
        </div>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateAnnaField({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;

  return (
    // GOLDILOCKS SQUEEZE: Tightened padding to 20px 36px, lowered line-height to 1.45, base font 10.5
    <div style={{ fontFamily: "Georgia, serif", fontSize: 10.5, color: "#1a1a1a", lineHeight: 1.45, padding: "20px 36px", background: "#fff", minHeight: "100%", boxSizing: "border-box" }}>

      <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px" }}>{full_name || <span style={{ color: "#ccc" }}>Your Name</span>}</h1>
        {professional_title && <div style={{ fontSize: 13.5, color: "#555", marginBottom: 8, fontStyle: "italic" }}>{professional_title}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 10.5, color: "#777" }}>
          {email && <span>✉ <EmailLink email={email} /></span>}
          {phone && <span>📱 <PhoneLink phone={phone} /></span>}
          {location && <span>📍 <LocationLink location={location} /></span>}
          {linkedin && <span>🔗 <LinkedInLink linkedin={linkedin} /></span>}
        </div>
      </div>

      {summary && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <AnnaSection title="Profile">
            <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.5 }}>{summary}</p>
          </AnnaSection>
        </div>
      )}

      {experiences.length > 0 && (
        <div>
          <AnnaSection title="Work Experience">
            {experiences.map((exp, i) => <ExpItem key={i} exp={exp} />)}
          </AnnaSection>
        </div>
      )}

      {educations.length > 0 && (
        <div>
          <AnnaSection title="Education">
            {educations.map((edu, i) => <EduItem key={i} edu={edu} />)}
          </AnnaSection>
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", display: "inline-block", width: "100%" }}>
          <AnnaSection title="Skills">
            <div style={{ columns: 2, gap: 12 }}>
              {skills.map((s, i) => (
                <div key={i} style={{ fontSize: 10.5, marginBottom: 4 }}>
                  • {s.name}{s.level ? ` (${s.level})` : ""}
                </div>
              ))}
            </div>
          </AnnaSection>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <AnnaSection title="Projects">
            {projects.map((p, i) => <ProjItem key={i} p={p} />)}
          </AnnaSection>
        </div>
      )}

      {certs.length > 0 && (
        <div>
          <AnnaSection title="Certifications">
            {certs.map((c, i) => <CertItem key={i} c={c} />)}
          </AnnaSection>
        </div>
      )}

      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplatePrecisionLine({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  return (
    <div style={{ fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: 11, color: "#111", lineHeight: 1.6, padding: "28px 32px", background: "#fff", minHeight: "100%" }}>
      <div style={{ borderBottom: "2px solid #111", paddingBottom: 10, marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{full_name || <span style={{ color: "#ccc" }}>Your Name</span>}</h1>
        {professional_title && <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", marginBottom: 6 }}>{professional_title}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 10, color: "#555" }}>
          {email && <span>{email}</span>}{phone && <span>{phone}</span>}{location && <span>{location}</span>}{linkedin && <span>{linkedin}</span>}
        </div>
      </div>
      {summary && <PrecisionSection title="Professional Summary"><p style={{ margin: 0, fontSize: 10.5 }}>{summary}</p></PrecisionSection>}
      {experiences.length > 0 && <PrecisionSection title="Work Experience">{experiences.map((exp, i) => <ExpItem key={i} exp={exp} />)}</PrecisionSection>}
      {educations.length > 0 && <PrecisionSection title="Education">{educations.map((edu, i) => <EduItem key={i} edu={edu} />)}</PrecisionSection>}
      {skills.length > 0 && <PrecisionSection title="Technical Skills"><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{skills.map((s, i) => <span key={i} style={{ fontSize: 10, background: "#f3f4f6", padding: "2px 8px", borderRadius: 2, border: "1px solid #e5e7eb" }}>{s.name}</span>)}</div></PrecisionSection>}
      {projects.length > 0 && <PrecisionSection title="Projects">{projects.map((p, i) => <ProjItem key={i} p={p} />)}</PrecisionSection>}
      {certs.length > 0 && <PrecisionSection title="Certifications">{certs.map((c, i) => <CertItem key={i} c={c} />)}</PrecisionSection>}
      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}

function TemplateObsidian({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  const accent = "#1f2937";
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 11, color: "#111", lineHeight: 1.6, background: "#fff", minHeight: "100%" }}>
      <div style={{ background: accent, padding: "28px 32px", color: "#fff" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: "#fff" }}>{full_name || <span style={{ opacity: 0.4 }}>Your Name</span>}</h1>
        {professional_title && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>{professional_title}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
          {email && <span>✉ {email}</span>}{phone && <span>📱 {phone}</span>}{location && <span>📍 {location}</span>}{linkedin && <span>🔗 {linkedin}</span>}
        </div>
      </div>
      <div style={{ padding: "24px 32px" }}>
        {summary && <ColorSection title="Profile" accent={accent}><p style={{ margin: 0, fontSize: 10.5, color: "#444", lineHeight: 1.7 }}>{summary}</p></ColorSection>}
        {experiences.length > 0 && <ColorSection title="Experience" accent={accent}>{experiences.map((exp, i) => <ExpItem key={i} exp={exp} />)}</ColorSection>}
        {educations.length > 0 && <ColorSection title="Education" accent={accent}>{educations.map((edu, i) => <EduItem key={i} edu={edu} />)}</ColorSection>}
        {skills.length > 0 && <ColorSection title="Skills" accent={accent}><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.map((s, i) => <span key={i} style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}30`, borderRadius: 4, padding: "2px 8px", fontSize: 10 }}>{s.name}</span>)}</div></ColorSection>}
        {projects.length > 0 && <ColorSection title="Projects" accent={accent}>{projects.map((p, i) => <ProjItem key={i} p={p} />)}</ColorSection>}
        {certs.length > 0 && <ColorSection title="Certifications" accent={accent}>{certs.map((c, i) => <CertItem key={i} c={c} />)}</ColorSection>}
        <EmptyState resume={resume} experiences={experiences} educations={educations} />
      </div>
    </div>
  );
}

function TemplateMercury({ resume, experiences, educations, skills, projects, certs }) {
  const { full_name, professional_title, email, phone, location, linkedin, summary } = resume;
  return (
    <div style={{ fontFamily: "Verdana, sans-serif", fontSize: 10.5, color: "#222", lineHeight: 1.6, padding: "30px 34px", background: "#fff", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "3px double #111", paddingBottom: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 3px", letterSpacing: "0.02em" }}>{full_name || <span style={{ color: "#ccc" }}>Your Name</span>}</h1>
          {professional_title && <div style={{ fontSize: 11, color: "#666" }}>{professional_title}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: 9.5, color: "#666", lineHeight: 1.8 }}>
          {email && <div><EmailLink email={email} /></div>}{phone && <div><PhoneLink phone={phone} /></div>}{location && <div><LocationLink location={location} /></div>}
        </div>
      </div>
      {summary && <MercurySection title="Summary"><p style={{ margin: 0 }}>{summary}</p></MercurySection>}
      {experiences.length > 0 && <MercurySection title="Experience">{experiences.map((exp, i) => <ExpItem key={i} exp={exp} />)}</MercurySection>}
      {educations.length > 0 && <MercurySection title="Education">{educations.map((edu, i) => <EduItem key={i} edu={edu} />)}</MercurySection>}
      {skills.length > 0 && <MercurySection title="Skills"><div style={{ columns: 3, gap: 10 }}>{skills.map((s, i) => <div key={i} style={{ fontSize: 10, marginBottom: 3 }}>◆ {s.name}</div>)}</div></MercurySection>}
      {projects.length > 0 && <MercurySection title="Projects">{projects.map((p, i) => <ProjItem key={i} p={p} />)}</MercurySection>}
      {certs.length > 0 && <MercurySection title="Certifications">{certs.map((c, i) => <CertItem key={i} c={c} />)}</MercurySection>}
      <EmptyState resume={resume} experiences={experiences} educations={educations} />
    </div>
  );
}


// ── SHARED SECTION COMPONENTS ──
function Section({ title, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1.5px solid #111", paddingBottom: 3, marginBottom: 8 }}>{title}</div>{children}</div>;
}
function ModSection({ title, accent, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 3, marginBottom: 8 }}>{title}</div>{children}</div>;
}
// c8 ignore start
function ClassicSection({ title, children }) {
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 700, color: "#111", borderBottom: "1px solid #999", paddingBottom: 3, marginBottom: 8, letterSpacing: "0.04em" }}>{title}</div>{children}</div>;
}
// c8 ignore stop
function ColorSection({ title, accent, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: accent, paddingBottom: 4, marginBottom: 8, borderBottom: `2px solid ${accent}` }}>{title}</div>{children}</div>;
}
// c8 ignore start
function HarvardSection({ title, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 6 }}>{title}</div>{children}</div>;
}
// c8 ignore stop
function AnnaSection({ title, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, background: "#f3f4f6", padding: "3px 8px", marginBottom: 8, textAlign: "center", letterSpacing: "0.06em", color: "#374151" }}>{title}</div>{children}</div>;
}
function PrecisionSection({ title, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #111", paddingBottom: 2, marginBottom: 8 }}>{title}</div>{children}</div>;
}
function MercurySection({ title, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "3px double #111", paddingBottom: 3, marginBottom: 8 }}>{title}</div>{children}</div>;
}
// c8 ignore start
function FinanceSection({ title, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1.5px solid #374151", paddingBottom: 3, marginBottom: 8, color: "#374151" }}>{title}</div>{children}</div>;
}
// c8 ignore stop
function SideSection({ title, color, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid rgba(255,255,255,0.3)`, paddingBottom: 3, marginBottom: 6, color }}>{title}</div>{children}</div>;
}

// ── SHARED ITEM COMPONENTS ──
function ExpItem({ exp }) {
  return (
    <div style={{ marginBottom: 10, pageBreakInside: "avoid", breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 11 }}>{exp.role}</span>
        <span style={{ fontSize: 10, color: "#777" }}>{exp.start_date} – {exp.end_date || "Present"}</span>
      </div>
      <div style={{ fontSize: 10, color: "#555", fontStyle: "italic" }}>{exp.company}</div>
      {exp.description && <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>• {exp.description}</div>}
    </div>
  );
}
function EduItem({ edu }) {
  return (
    <div style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 11 }}>{edu.degree}</span>
        <span style={{ fontSize: 10, color: "#777" }}>{edu.start_year} – {edu.end_year}</span>
      </div>
      <div style={{ fontSize: 10, color: "#555" }}>
        {edu.institution}{edu.score ? ` · Score: ${edu.score}` : ""}
      </div>
    </div>
  );
}
function ProjItem({ p }) {
  return (
    <div style={{ marginBottom: 8, pageBreakInside: "avoid", breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 11 }}>{p.title}</span>
        {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#2563eb" }}>Link</a>}
      </div>
      {p.tech_stack && <div style={{ fontSize: 10, color: "#555", fontStyle: "italic" }}>{p.tech_stack}</div>}
      {p.description && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>• {p.description}</div>}
    </div>
  );
}
function CertItem({ c }) {
  return (
    <div style={{ marginBottom: 6, pageBreakInside: "avoid", breakInside: "avoid" }}>
      <span style={{ fontWeight: 700, fontSize: 11 }}>{c.name}</span>
      {c.issuer && <span style={{ fontSize: 10, color: "#666" }}> · {c.issuer}</span>}
      {c.issue_date && <span style={{ fontSize: 10, color: "#888" }}> · {c.issue_date}</span>}
    </div>
  );
}
function EmptyState({ resume, experiences, educations }) {
  if (resume.full_name || resume.summary || experiences.length > 0 || educations.length > 0) return null;
  return <div style={{ textAlign: "center", color: "#ccc", marginTop: 60, fontSize: 13 }}>Start filling in your details to see the preview here →</div>;
}

// ── CLICKABLE CONTACT HELPERS ──
function PhoneLink({ phone, style }) {
  if (!phone) return null;
  return <a href={"tel:" + phone} style={{ textDecoration: "none", color: "inherit", ...style }}>{phone}</a>;
}
function LocationLink({ location, style }) {
  if (!location) return null;
  return <a href={"https://maps.google.com/?q=" + encodeURIComponent(location)} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", ...style }}>{location}</a>;
}
function LinkedInLink({ linkedin, style }) {
  if (!linkedin) return null;
  const url = linkedin.startsWith("http") ? linkedin : "https://" + linkedin;
  return <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", ...style }}>{linkedin}</a>;
}
function EmailLink({ email, style }) {
  if (!email) return null;
  return <a href={"mailto:" + email} style={{ textDecoration: "none", color: "inherit", ...style }}>{email}</a>;
}

// ── TEMPLATE MAP ──
export const TEMPLATE_MAP = {
  corporate: TemplateCorporate,
  modern: TemplateModern,
  classic: TemplateClassic,
  harvard: TemplateHarvard,
  atlantic: TemplateAtlantic,
  simplyblue: TemplateSimplyBlue,
  annafield: TemplateAnnaField,
  meghana: TemplatePrecisionLine,
  obsidian: TemplateObsidian,
  mercury: TemplateMercury,
  finance: TemplateBanking,

  minimal: TemplateHarvard,
  sidebar: TemplateModern,
  banking: TemplateBanking,
  quiet_blue: TemplateQuietBlue,
  simplyblue_modern: TemplateSimplyBlue,
  hunter_green: TemplateHunterGreen,
  silver: TemplateSilver,
  slate_dawn: TemplateSlateDawn,
  creative: TemplateCreative,
  black_pattern: TemplateBlackPattern,
  atlantic_blue: TemplateAtlantic,
  green_accent: TemplateGreenAccent,
  rosewood: TemplateRosewood,
  blue_accent: TemplateBlueAccent
};

function ResumePreview({ resume, experiences, educations, skills, projects, certs, templateStyle }) {
  // 1. Get the style passed from state, fallback to template_name, fallback to corporate
  // c8 ignore start
  const activeKey = templateStyle || resume.template_name || "corporate";
  // c8 ignore stop

  // 2. Pick the correct component from the updated map!
  const TemplateComponent = TEMPLATE_MAP[activeKey] || TemplateCorporate;

  return (
    <TemplateComponent
      resume={resume}
      experiences={experiences}
      educations={educations}
      skills={skills}
      projects={projects}
      certs={certs}
    />
  );
}

// ── MAIN BUILDER ──
export default function ResumeBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const componentRef = useRef(null);
  const innerRef = useRef(null);

  // ✅ All state MUST be declared at top, before any conditional returns
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mobileView, setMobileView] = useState("edit");

  const [resume, setResume] = useState({
    title: "", summary: "", full_name: "", professional_title: "",
    email: "", phone: "", location: "", linkedin: "", website: "",
    nationality: "", date_of_birth: "", template_name: "simple",
  });

  const [templateStyle, setTemplateStyle] = useState("classic");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [expForm, setExpForm] = useState({ company: "", role: "", start_date: "", end_date: "", description: "" });

  const [educations, setEducations] = useState([]);
  const [eduForm, setEduForm] = useState({ degree: "", institution: "", start_year: "", end_year: "", gpa: "" });

  const [skills, setSkills] = useState([]);
  const [skillForm, setSkillForm] = useState({ name: "", level: "Intermediate" });

  const [projects, setProjects] = useState([]);
  const [projForm, setProjForm] = useState({ title: "", description: "", tech_stack: "", link: "" });

  const [certs, setCerts] = useState([]);
  const [certForm, setCertForm] = useState({ name: "", issuer: "", issue_date: "", expiry_date: "" });

  // ✅ All Hooks (useState, useEffect, useLayoutEffect) MUST come first, BEFORE functions
  // Auto-scale resume content to fit exactly one A4 page
  // c8 ignore start
  useLayoutEffect(() => { }, []);
  // c8 ignore stop

  // ✅ Fetch resume data when component mounts or id changes
  useEffect(() => {
    if (!authLoading && user && id) {
      fetchAll();
    }
  }, [id, user, authLoading]);

  // ✅ Helper functions come AFTER all Hooks
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchAll = async () => {
    try {
      const resResume = await api.get(`/resume/${id}`);
      const data = resResume.data;
      const resumeData = data.resume || data;

      if (resumeData) {
        setResume(resumeData);
        if (resumeData.template_style) {
          setTemplateStyle(resumeData.template_style);
          console.log("✅ Applied saved style:", resumeData.template_style);
        } else {
          const fallbackMap = { 'simple': 'classic', 'modern': 'sidebar', 'creative': 'creative' };
          const fallback = fallbackMap[resumeData.template_name] || 'classic';
          setTemplateStyle(fallback);
          console.log("⚠️ No style found, using fallback:", fallback);
        }
      }

      const [resExp, resEdu, resSkills, resProj, resCerts] = await Promise.all([
        api.get(`/experience/${id}`),
        api.get(`/education/${id}`),
        api.get(`/skills/${id}`),
        api.get(`/projects/${id}`),
        api.get(`/certifications/${id}`)
      ]);

      setExperiences(resExp.data || []);
      setEducations(resEdu.data || []);
      setSkills(resSkills.data || []);
      setProjects(resProj.data || []);
      setCerts(resCerts.data || []);
      console.log("✅ Resume data loaded successfully");
    } catch (err) {
      console.error("❌ Error in fetchAll:", err);
      showToast("❌ Failed to load resume data");
    }
  };

  const saveResume = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/resume/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        credentials: "include",
        body: JSON.stringify(resume)
      });
      if (res.ok) showToast("✅ Resume saved successfully!");
      else showToast("❌ Failed to save");
    } catch { showToast("❌ Failed to save"); }
    finally { setSaving(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  // ✅ Replace with this:
  const token = localStorage.getItem('access_token');
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
  const headers = { "Content-Type": "application/json", ...authHeader };
  const fetchOpts = { headers, credentials: "include" };

  const addItem = async (url, body, resetFn, type) => {
    try {
      const res = await fetch(url, { method: "POST", ...fetchOpts, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { console.error("Backend error:", data); alert(data.error || "Failed to add"); return; }
      resetFn();
      if (type === "experience") setExperiences(prev => [...prev, { ...body, id: data.id }]);
      if (type === "education") setEducations(prev => [...prev, { ...body, id: data.id }]);
      if (type === "skills") setSkills(prev => [...prev, { ...body, id: data.id }]);
      if (type === "projects") setProjects(prev => [...prev, { ...body, id: data.id }]);
      if (type === "certs") setCerts(prev => [...prev, { ...body, id: data.id }]);
    } catch { alert("Failed to add"); }
  };

  const deleteItem = async (url, type, index) => {
    try {
      await fetch(url, { method: "DELETE", ...fetchOpts });
      if (type === "experience") setExperiences(prev => prev.filter((_, i) => i !== index));
      if (type === "education") setEducations(prev => prev.filter((_, i) => i !== index));
      if (type === "skills") setSkills(prev => prev.filter((_, i) => i !== index));
      if (type === "projects") setProjects(prev => prev.filter((_, i) => i !== index));
      if (type === "certs") setCerts(prev => prev.filter((_, i) => i !== index));
    } catch { alert("Failed to delete"); }
  };

  const updateItem = async (url, data, type, index) => {
    try {
      const res = await fetch(url, { method: "PUT", ...fetchOpts, body: JSON.stringify(data) });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed to update"); return; }
      if (type === "experience") setExperiences(prev => prev.map((item, i) => i === index ? { ...item, ...data } : item));
      if (type === "education") setEducations(prev => prev.map((item, i) => i === index ? { ...item, ...data } : item));
      if (type === "skills") setSkills(prev => prev.map((item, i) => i === index ? { ...item, ...data } : item));
      if (type === "projects") setProjects(prev => prev.map((item, i) => i === index ? { ...item, ...data } : item));
      if (type === "certs") setCerts(prev => prev.map((item, i) => i === index ? { ...item, ...data } : item));
      setEditingItem(null);
      showToast("✅ Updated successfully!");
    } catch { alert("Failed to update"); }
  };

  const inp = { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, outline: "none", background: "#f8fafc", boxSizing: "border-box", transition: "all 0.2s ease", fontFamily: "inherit", color: "#1e293b" };
  const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, letterSpacing: "0.01em" };
  const fld = { marginBottom: 20 };
  const btn = { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" };
  const card = { background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start", transition: "all 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
  const delBtn = { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 6, transition: "all 0.15s ease" };
  const editBtn = { background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 6, transition: "all 0.15s ease" };
  const aiBtn = { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.2)" };

  // ✅ SHOW NOTHING WHILE LOADING - Prevents premature rendering or redirects
  if (authLoading) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .rb-tab { flex: 1; padding: 8px 2px; border-radius: 8px; border: none; font-size: 11.5px; font-weight: 600; cursor: pointer; transition: all 0.25s ease; font-family: inherit; }
        .rb-tab:hover { background: rgba(99,102,241,0.06); }
        .rb-card:hover { border-color: #c7d2fe; box-shadow: 0 4px 12px rgba(99,102,241,0.08); }
        .rb-inp:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,0.12); background: #fff; }
        .rb-edit-modal { animation: slideIn 0.25s ease; }
        
        /* Mobile responsive */
        @media (max-width: 1024px) {
  .rb-main-container { grid-template-columns: 1fr !important; height: auto !important; }
  .rb-left-panel { border-right: none !important; border-bottom: none !important; }
  .rb-right-panel { display: none !important; }
}

@media (max-width: 768px) {
  /* Header */
  .rb-header { padding: 0 8px !important; height: 50px !important; }
  .rb-title-input { width: 90px !important; font-size: 13px !important; }
  .rb-header-right { gap: 3px !important; flex-wrap: nowrap !important; }
  .rb-header-right > * { flex-shrink: 0; }
  .rb-template-btn-text { display: none !important; }
  .rb-template-btn-arrow { display: none !important; }
  .rb-save-pdf-text { display: none !important; }
  .rb-save-btn-text { display: none !important; }
  .rb-header-right button { padding: 6px 8px !important; font-size: 12px !important; min-width: 32px; justify-content: center; }
  .rb-save-pdf { padding: 6px 8px !important; }
  .rb-save-pdf svg { width: 14px !important; height: 14px !important; }
  /* Tabs */
  .rb-tab { font-size: 9.5px !important; padding: 5px 1px !important; }
  /* Left panel */
  .rb-left-panel { padding: 12px 10px !important; height: auto !important; }
  /* Right panel when shown on mobile preview tab */
  .rb-right-panel-mobile { 
    display: flex !important; 
    background: #e2e8f0 !important;
    padding: 16px 12px !important;
    justify-content: center !important;
    overflow: hidden !important;
    width: 100% !important;
  }
  /* Share button */
  .share-button-wrapper { bottom: 70px !important; right: 14px !important; z-index: 999 !important; }
}
        @media print {
 .rb-left-panel,
header,
.share-button-wrapper,
.rb-mobile-toggle,
.no-print { 
  display: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

/* Hide toast notification during print */
div[style*="position: fixed"][style*="top: 16px"],
div[style*="position:fixed"][style*="top:16px"] {
  display: none !important;
}

  /* ── Remove all top spacing ── */
body, html {
  margin: 0 !important;
  padding: 0 !important;
}

.rb-main-container {
  display: block !important;
  height: auto !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

#root > div {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
  
  .rb-right-panel {
    display: block !important;
    padding: 0 !important;
    background: white !important;
  }
  
  /* ── KEY FIX: Force background colors and images to print ── */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  body { margin: 0 !important; background: white !important; }
  @page { margin: 0; size: A4; }
}  
      `}</style>

      <header className="rb-header" style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(226,232,240,0.7)", padding: "0 20px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/dashboard")} style={{
            background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 12px",
            cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s ease", fontFamily: "inherit"
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />
          <input className="rb-title-input" value={resume.title} onChange={e => setResume({ ...resume, title: e.target.value })} placeholder="Resume Title"
            style={{ border: "none", outline: "none", fontSize: 15, fontWeight: 700, color: "#0f172a", background: "transparent", width: 220, fontFamily: "inherit" }} />
        </div>
        <div className="rb-header-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Template Selector */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowTemplateDropdown(!showTemplateDropdown)} style={{
              background: "linear-gradient(135deg, #eef2ff, #f5f3ff)", border: "1.5px solid #c7d2fe", borderRadius: 10, padding: "7px 14px",
              cursor: "pointer", color: "#4f46e5", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s ease", fontFamily: "inherit"
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
              <span className="rb-template-btn-text">{TEMPLATE_OPTIONS.flatMap(g => g.items).find(t => t.style === templateStyle)?.name || "Template"}</span>
              <svg className="rb-template-btn-arrow" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showTemplateDropdown && (
              <>
                <div onClick={() => setShowTemplateDropdown(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 98 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 99,
                  background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)", padding: "8px 0",
                  width: 220, maxHeight: 400, overflowY: "auto",
                  animation: "slideIn 0.2s ease"
                }}>
                  {TEMPLATE_OPTIONS.map(group => (
                    <div key={group.group}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px 16px 4px", margin: 0 }}>{group.group}</p>
                      {group.items.map(t => (
                        <button key={t.style} onClick={() => { setTemplateStyle(t.style); setShowTemplateDropdown(false); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 16px",
                            border: "none", background: templateStyle === t.style ? "linear-gradient(135deg, #eef2ff, #f5f3ff)" : "transparent",
                            cursor: "pointer", fontSize: 13, fontWeight: templateStyle === t.style ? 700 : 500,
                            color: templateStyle === t.style ? "#4f46e5" : "#334155", transition: "all 0.15s ease", fontFamily: "inherit", textAlign: "left"
                          }}>
                          {templateStyle === t.style && <span style={{ fontSize: 11, color: "#6366f1" }}>✓</span>}
                          {t.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="rb-save-pdf" onClick={async () => {
            // Save first so PDF shows current template
            await saveResume();
            showToast("📄 Preparing PDF...");
            setTimeout(() => {
              setToast(""); // Clear toast before printing
              setTimeout(() => window.print(), 100);
            }, 800);
          }}
            style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(5,150,105,0.25)", transition: "all 0.2s ease", fontFamily: "inherit" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="rb-save-pdf-text">Download PDF</span>
          </button>
          <button onClick={saveResume} disabled={saving} style={{ ...btn, padding: "8px 18px", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M5 13l4 4L19 7" /></svg>
            <span className="rb-save-btn-text">{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </header>

      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 24, zIndex: 999,
          background: toast.startsWith("✅") ? "linear-gradient(135deg, #059669, #10b981)" : toast.startsWith("✨") || toast.startsWith("📄") ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "linear-gradient(135deg, #dc2626, #ef4444)",
          color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", animation: "fadeIn 0.3s ease",
          display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)"
        }}>
          {toast}
        </div>
      )}

      {/* Edit Modal Overlay */}
      {editingItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setEditingItem(null)}>
          <div className="rb-edit-modal" onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520,
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", margin: 0 }}>
                Edit {editingItem.type === "certs" ? "Certification" : editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)}
              </h3>
              <button onClick={() => setEditingItem(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {editingItem.type === "experience" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Company", "company"], ["Role", "role"], ["Start Date", "start_date"], ["End Date", "end_date"]].map(([l, k]) => (
                  <div key={k}><label style={lbl}>{l}</label><input className="rb-inp" style={inp} value={editingItem.data[k] || ""} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, [k]: e.target.value } })} /></div>
                ))}
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Description</label><textarea className="rb-inp" style={{ ...inp, resize: "none" }} rows={3} value={editingItem.data.description || ""} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })} /></div>
              </div>
            )}
            {editingItem.type === "education" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Degree", "degree"], ["Institution", "institution"], ["Start Year", "start_year"], ["End Year", "end_year"], ["Grade / Score", "score"]].map(([l, k]) => (
                  <div key={k}><label style={lbl}>{l}</label><input className="rb-inp" style={inp} value={editingItem.data[k] || ""} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, [k]: e.target.value } })} /></div>
                ))}
              </div>
            )}
            {editingItem.type === "skills" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Skill Name</label><input className="rb-inp" style={inp} value={editingItem.data.name || ""} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} /></div>
                <div><label style={lbl}>Level</label>
                  <select className="rb-inp" style={inp} value={editingItem.data.level || "Intermediate"} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, level: e.target.value } })}>
                    {["Beginner", "Intermediate", "Advanced", "Expert"].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            )}
            {editingItem.type === "projects" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Title", "title"], ["Tech Stack", "tech_stack"], ["Link", "link"]].map(([l, k]) => (
                  <div key={k}><label style={lbl}>{l}</label><input className="rb-inp" style={inp} value={editingItem.data[k] || ""} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, [k]: e.target.value } })} /></div>
                ))}
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Description</label><textarea className="rb-inp" style={{ ...inp, resize: "none" }} rows={3} value={editingItem.data.description || ""} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })} /></div>
              </div>
            )}
            {editingItem.type === "certs" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Name", "name"], ["Issuer", "issuer"], ["Issue Date", "issue_date"], ["Expiry Date", "expiry_date"]].map(([l, k]) => (
                  <div key={k}><label style={lbl}>{l}</label><input className="rb-inp" style={inp} value={editingItem.data[k] || ""} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, [k]: e.target.value } })} /></div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingItem(null)} style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={() => {
                const urlMap = {
                  experience: `${API_URL}/api/experience/${editingItem.data.id}`,
                  education: `${API_URL}/api/education/${editingItem.data.id}`,
                  skills: `${API_URL}/api/skills/${editingItem.data.id}`,
                  projects: `${API_URL}/api/projects/${editingItem.data.id}`,
                  certs: `${API_URL}/api/certifications/${editingItem.data.id}`
                };
                updateItem(urlMap[editingItem.type], editingItem.data, editingItem.type, editingItem.index);
              }} style={{ ...btn, fontFamily: "inherit" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Edit/Preview Toggle */}
      <div style={{ display: "none" }} className="rb-mobile-toggle no-print">
        <style>{`
    @media (max-width: 1024px) {
      .rb-mobile-toggle { 
        display: flex !important; 
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 12px;
        gap: 8px;
        position: sticky;
        top: 50px;
        z-index: 40;
      }
    }
  `}</style>
        <button
          onClick={() => setMobileView("edit")}
          style={{
            flex: 1, padding: "9px", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            background: mobileView === "edit" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#f1f5f9",
            color: mobileView === "edit" ? "#fff" : "#64748b",
          }}
        >
          ✏️ Edit Resume
        </button>
        <button
          onClick={() => setMobileView("preview")}
          style={{
            flex: 1, padding: "9px", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            background: mobileView === "preview" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#f1f5f9",
            color: mobileView === "preview" ? "#fff" : "#64748b",
          }}
        >
          👁️ Preview
        </button>
      </div>

      <div className="rb-main-container" style={{ display: "grid", gridTemplateColumns: "480px 1fr", height: "calc(100vh - 56px)" }}>
        {/* LEFT */}
        <div className="rb-left-panel" style={{ overflowY: "auto", padding: "24px 22px", borderRight: "1px solid #e2e8f0", background: "#fff", display: mobileView === "preview" ? "none" : "block" }}>
          <div style={{ display: "flex", gap: 3, backgroundColor: "#f1f5f9", borderRadius: 10, padding: 3, marginBottom: 24 }}>
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)} className="rb-tab"
                style={{ backgroundColor: activeTab === i ? "#fff" : "transparent", color: activeTab === i ? "#6366f1" : "#64748b", boxShadow: activeTab === i ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ backgroundColor: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: 26, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>

            {/* PERSONAL */}
            {activeTab === 0 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: "#0f172a" }}>Personal Details</h2>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>This information appears at the top of your resume.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  {[["Full Name", "full_name", "e.g. Anna Field"], ["Professional Title", "professional_title", "Target position or current role"], ["Email", "email", "Enter email"], ["Phone", "phone", "Enter Phone"]].map(([label, key, ph]) => (
                    <div key={key} style={fld}><label style={lbl}>{label}</label><input className="rb-inp" style={inp} placeholder={ph} value={resume[key]} onChange={e => setResume({ ...resume, [key]: e.target.value })} /></div>
                  ))}
                  <div style={{ ...fld, gridColumn: "1/-1" }}><label style={lbl}>Location</label><input className="rb-inp" style={inp} placeholder="City, Country" value={resume.location} onChange={e => setResume({ ...resume, location: e.target.value })} /></div>
                </div>
                <div style={{ borderTop: "1.5px solid #f1f5f9", paddingTop: 20, marginBottom: 20, marginTop: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#334155" }}>Additional Details</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {["LinkedIn", "Website", "Nationality", "Date of Birth"].map(label => (
                      <button key={label} onClick={() => setShowExtra(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 14px", border: "1.5px solid #e2e8f0", borderRadius: 20, background: "#f8fafc", fontSize: 12, cursor: "pointer", color: "#475569", fontWeight: 500, transition: "all 0.2s", fontFamily: "inherit" }}>+ {label}</button>
                    ))}
                  </div>
                  {showExtra && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 16 }}>
                      {[["LinkedIn", "linkedin", "linkedin.com/in/yourname"], ["Website", "website", "yourwebsite.com"], ["Nationality", "nationality", "e.g. Indian"], ["Date of Birth", "date_of_birth", "DD/MM/YYYY"]].map(([label, key, ph]) => (
                        <div key={key} style={fld}><label style={lbl}>{label}</label><input className="rb-inp" style={inp} placeholder={ph} value={resume[key]} onChange={e => setResume({ ...resume, [key]: e.target.value })} /></div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={fld}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={lbl}>Professional Summary</label>
                    <button
                      onClick={async () => {
                        if (!resume.full_name && !resume.professional_title) {
                          showToast("❌ Please fill in Full Name and Professional Title first!");
                          return;
                        }
                        await fetch(`${API_URL}/api/resume/${id}`, { method: "PUT", ...fetchOpts, body: JSON.stringify(resume) });  // ✅ Added /api
                        showToast("✨ Generating summary...");
                        try {
                          const res = await fetch(`${API_URL}/api/ai/generate-summary/${id}`, fetchOpts);  // ✅ Added /api
                          const data = await res.json();
                          if (data.ai_generated_summary) {
                            setResume(prev => ({ ...prev, summary: data.ai_generated_summary }));
                            showToast("✅ Summary generated!");
                          } else {
                            showToast("❌ Failed to generate");
                          }
                        } catch {
                          showToast("❌ Failed to generate");
                        }
                      }}
                      style={aiBtn}>
                      ✨ Generate with AI
                    </button>
                  </div>
                  <textarea className="rb-inp" style={{ ...inp, resize: "none" }} rows={4} placeholder="Write a brief professional summary or click ✨ Generate with AI..." value={resume.summary} onChange={e => setResume({ ...resume, summary: e.target.value })} />
                </div>
                <button onClick={saveResume} disabled={saving} style={{ ...btn, width: "100%", padding: "12px", fontSize: 14, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", marginTop: 8, fontFamily: "inherit" }}>{saving ? "Saving..." : "✓ Save Personal Info"}</button>
              </div>
            )}

            {/* EXPERIENCE */}
            {activeTab === 1 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: "#0f172a" }}>Work Experience</h2>
                {experiences.map((exp, i) => (
                  <div key={i} style={card} className="rb-card">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0, color: "#0f172a" }}>{exp.role} <span style={{ color: "#94a3b8", fontWeight: 400 }}>at</span> {exp.company}</p>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: "3px 0 0" }}>{exp.start_date} – {exp.end_date || "Present"}</p>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={editBtn} onClick={() => setEditingItem({ type: "experience", index: i, data: { ...exp } })}>✏️ Edit</button>
                      <button style={delBtn} onClick={() => deleteItem(`${API_URL}/api/experience/${exp.id}`, "experience", i)}>🗑️</button>
                    </div>
                  </div>
                ))}
                {experiences.length > 0 && <div style={{ borderTop: "1.5px dashed #e2e8f0", margin: "18px 0 16px", position: "relative" }}><span style={{ position: "absolute", top: -10, left: 16, background: "#fff", padding: "0 8px", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Add New</span></div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {[["Company", "company", "e.g. Google"], ["Role", "role", "e.g. Software Engineer"], ["Start Date", "start_date", "Jan 2022"], ["End Date", "end_date", "Present"]].map(([label, key, ph]) => (
                    <div key={key}><label style={lbl}>{label}</label><input className="rb-inp" style={inp} placeholder={ph} value={expForm[key]} onChange={e => setExpForm({ ...expForm, [key]: e.target.value })} /></div>
                  ))}
                </div>
                <div style={fld}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={lbl}>Description</label>
                    <button
                      onClick={async () => {
                        if (!expForm.role || !expForm.company) {
                          showToast("❌ Please fill in Company and Role first!");
                          return;
                        }
                        showToast("✨ Generating description...");
                        try {
                          const res = await fetch(`${API_URL}/api/ai/generate-experience`, {
                            method: "POST",
                            ...fetchOpts,
                            body: JSON.stringify({
                              role: expForm.role,
                              company: expForm.company,
                              start_date: expForm.start_date,
                              end_date: expForm.end_date
                            })
                          });
                          const data = await res.json();
                          if (data.description) {
                            setExpForm(prev => ({ ...prev, description: data.description }));
                            showToast("✅ Description generated!");
                          } else {
                            showToast("❌ Failed to generate");
                          }
                        } catch {
                          showToast("❌ Failed to generate");
                        }
                      }}
                      style={aiBtn}>
                      ✨ Generate with AI
                    </button>
                  </div>
                  <textarea className="rb-inp" style={{ ...inp, resize: "none" }} rows={3}
                    placeholder="Describe responsibilities or click ✨ Generate with AI..."
                    value={expForm.description}
                    onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
                </div>
                <button style={{ ...btn, fontFamily: "inherit", marginTop: 8 }} onClick={() => addItem(`${API_URL}/api/experience/`, { ...expForm, resume_id: parseInt(id) }, () => setExpForm({ company: "", role: "", start_date: "", end_date: "", description: "" }), "experience")}>+ Add Experience</button>
              </div>
            )}

            {/* EDUCATION */}
            {activeTab === 2 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: "#0f172a" }}>Education</h2>
                {educations.map((edu, i) => (
                  <div key={i} style={card} className="rb-card">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0, color: "#0f172a" }}>{edu.degree} — {edu.institution}</p>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: "3px 0 0" }}>{edu.start_year} – {edu.end_year}{edu.score ? ` · ${edu.score}` : ""}</p>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={editBtn} onClick={() => setEditingItem({ type: "education", index: i, data: { ...edu } })}>✏️ Edit</button>
                      <button style={delBtn} onClick={() => deleteItem(`${API_URL}/api/education/${edu.id}`, "education", i)}>🗑️</button>
                    </div>
                  </div>
                ))}
                {educations.length > 0 && <div style={{ borderTop: "1.5px dashed #e2e8f0", margin: "18px 0 16px", position: "relative" }}><span style={{ position: "absolute", top: -10, left: 16, background: "#fff", padding: "0 8px", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Add New</span></div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {[["Degree", "degree", "e.g. B.Tech"], ["Institution", "institution", "e.g. IIT Bombay"], ["Start Year", "start_year", "2018"], ["End Year", "end_year", "2022"], ["Grade / Score", "score", "e.g. 79% or 9.08 CGPA"]].map(([label, key, ph]) => (
                    <div key={key}><label style={lbl}>{label}</label><input className="rb-inp" style={inp} placeholder={ph} value={eduForm[key]} onChange={e => setEduForm({ ...eduForm, [key]: e.target.value })} /></div>
                  ))}
                </div>
                <button style={{ ...btn, fontFamily: "inherit", marginTop: 8 }} onClick={() => addItem(`${API_URL}/api/education/`, { ...eduForm, resume_id: parseInt(id) }, () => setEduForm({ degree: "", institution: "", start_year: "", end_year: "", gpa: "" }), "education")}>+ Add Education</button>
              </div>
            )}

            {/* SKILLS */}
            {activeTab === 3 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: "#0f172a" }}>Skills</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
                  {skills.map((s, i) => (
                    <span key={i} style={{ background: "linear-gradient(135deg, #eef2ff, #f5f3ff)", color: "#4f46e5", border: "1.5px solid #c7d2fe", borderRadius: 20, padding: "5px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                      {s.name} <span style={{ fontSize: 10, color: "#818cf8", fontWeight: 600 }}>· {s.level}</span>
                      <button onClick={() => setEditingItem({ type: "skills", index: i, data: { ...s } })} style={{ ...editBtn, fontSize: 10, padding: 0 }}>✏️</button>
                      <button onClick={() => deleteItem(`${API_URL}/api/skills/${s.id}`, "skills", i)} style={{ ...delBtn, fontSize: 10, padding: 0 }}>✕</button>
                    </span>
                  ))}
                </div>
                {skills.length > 0 && <div style={{ borderTop: "1.5px dashed #e2e8f0", margin: "4px 0 16px", position: "relative" }}><span style={{ position: "absolute", top: -10, left: 16, background: "#fff", padding: "0 8px", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Add New</span></div>}
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}><label style={lbl}>Skill</label><input className="rb-inp" style={inp} placeholder="e.g. React" value={skillForm.name} onChange={e => setSkillForm({ ...skillForm, name: e.target.value })} /></div>
                  <div style={{ width: 140 }}><label style={lbl}>Level</label>
                    <select className="rb-inp" style={inp} value={skillForm.level} onChange={e => setSkillForm({ ...skillForm, level: e.target.value })}>
                      {["Beginner", "Intermediate", "Advanced", "Expert"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <button style={{ ...btn, fontFamily: "inherit" }} onClick={() => addItem(`${API_URL}/api/skills/`, { ...skillForm, resume_id: parseInt(id) }, () => setSkillForm({ name: "", level: "Intermediate" }), "skills")}>+ Add</button>
                </div>
              </div>
            )}

            {/* PROJECTS */}
            {activeTab === 4 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: "#0f172a" }}>Projects</h2>
                {projects.map((p, i) => (
                  <div key={i} style={card} className="rb-card">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0, color: "#0f172a" }}>{p.title}</p>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: "3px 0 0" }}>{p.tech_stack}</p>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={editBtn} onClick={() => setEditingItem({ type: "projects", index: i, data: { ...p } })}>✏️ Edit</button>
                      <button style={delBtn} onClick={() => deleteItem(`${API_URL}/api/projects/${p.id}`, "projects", i)}>🗑️</button>
                    </div>
                  </div>
                ))}
                {projects.length > 0 && <div style={{ borderTop: "1.5px dashed #e2e8f0", margin: "18px 0 16px", position: "relative" }}><span style={{ position: "absolute", top: -10, left: 16, background: "#fff", padding: "0 8px", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Add New</span></div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {[["Title", "title", "e.g. AI Resume Builder"], ["Tech Stack", "tech_stack", "React, Flask"], ["Link", "link", "https://github.com/..."]].map(([label, key, ph]) => (
                    <div key={key}><label style={lbl}>{label}</label><input className="rb-inp" style={inp} placeholder={ph} value={projForm[key]} onChange={e => setProjForm({ ...projForm, [key]: e.target.value })} /></div>
                  ))}
                </div>
                <div style={fld}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={lbl}>Description</label>
                    <button
                      onClick={async () => {
                        if (!projForm.title) {
                          showToast("❌ Please fill in Project Title first!");
                          return;
                        }
                        showToast("✨ Generating description...");
                        try {
                          const res = await fetch(`${API_URL}/api/ai/generate-project`, {
                            method: "POST",
                            ...fetchOpts,
                            body: JSON.stringify({
                              title: projForm.title,
                              tech_stack: projForm.tech_stack
                            })
                          });
                          const data = await res.json();
                          if (data.description) {
                            setProjForm(prev => ({ ...prev, description: data.description }));
                            showToast("✅ Description generated!");
                          } else {
                            showToast("❌ Failed to generate");
                          }
                        } catch {
                          showToast("❌ Failed to generate");
                        }
                      }}
                      style={aiBtn}>
                      ✨ Generate with AI
                    </button>
                  </div>
                  <textarea className="rb-inp" style={{ ...inp, resize: "none" }} rows={3}
                    placeholder="Describe the project or click ✨ Generate with AI..."
                    value={projForm.description}
                    onChange={e => setProjForm({ ...projForm, description: e.target.value })} />
                </div>
                <button style={{ ...btn, fontFamily: "inherit", marginTop: 8 }} onClick={() => addItem(`${API_URL}/api/projects/`, { ...projForm, resume_id: parseInt(id) }, () => setProjForm({ title: "", description: "", tech_stack: "", link: "" }), "projects")}>+ Add Project</button>
              </div>
            )}

            {/* CERTIFICATIONS */}
            {activeTab === 5 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: "#0f172a" }}>Certifications</h2>
                {certs.map((c, i) => (
                  <div key={i} style={card} className="rb-card">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0, color: "#0f172a" }}>{c.name}</p>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: "3px 0 0" }}>{c.issuer}{c.issue_date ? ` · ${c.issue_date}` : ""}</p>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={editBtn} onClick={() => setEditingItem({ type: "certs", index: i, data: { ...c } })}>✏️ Edit</button>
                      <button style={delBtn} onClick={() => deleteItem(`${API_URL}/api/certifications/${c.id}`, "certs", i)}>🗑️</button>
                    </div>
                  </div>
                ))}
                {certs.length > 0 && <div style={{ borderTop: "1.5px dashed #e2e8f0", margin: "18px 0 16px", position: "relative" }}><span style={{ position: "absolute", top: -10, left: 16, background: "#fff", padding: "0 8px", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Add New</span></div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {[["Name", "name", "AWS Solutions Architect"], ["Issuer", "issuer", "Amazon"], ["Issue Date", "issue_date", "Jan 2023"], ["Expiry Date", "expiry_date", "Jan 2026"]].map(([label, key, ph]) => (
                    <div key={key}><label style={lbl}>{label}</label><input className="rb-inp" style={inp} placeholder={ph} value={certForm[key]} onChange={e => setCertForm({ ...certForm, [key]: e.target.value })} /></div>
                  ))}
                </div>
                <button style={{ ...btn, fontFamily: "inherit", marginTop: 8 }} onClick={() => addItem(`${API_URL}/api/certifications/`, { ...certForm, resume_id: parseInt(id) }, () => setCertForm({ name: "", issuer: "", issue_date: "", expiry_date: "" }), "certs")}>+ Add Certification</button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Live Preview */}
        <div
          className={mobileView === "preview" ? "rb-right-panel rb-right-panel-mobile" : "rb-right-panel"}
          style={{
            overflowY: "auto",
            background: "linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)",
            padding: "24px 0",
            display: "flex",
            justifyContent: "center"
          }}
        >

          {/* ✅ The A4 Canvas Wrapper */}
          <div
            ref={componentRef}
            style={{
              background: "#fff",
              width: "210mm",
              minHeight: "297mm",  // ← minHeight instead of height
              overflow: "visible", // ← visible instead of hidden
              boxSizing: "border-box",
              position: "relative",
              boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
              ...(window.innerWidth <= 768 ? {
                transform: `scale(${(window.innerWidth - 24) / 794})`,
                transformOrigin: "top center",
                marginBottom: `-${297 * (1 - (window.innerWidth - 24) / 794)}mm`,
              } : {})
            }}
          >
            <div ref={innerRef} style={{ display: "flex", flexDirection: "column" }}>
              <ResumePreview
                resume={resume}
                experiences={experiences}
                educations={educations}
                skills={skills}
                projects={projects}
                certs={certs}
                templateStyle={templateStyle}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Share Button - Floating Action Button */}
      <ShareButton resumeId={id} resumeData={resume} />
    </div>
  );
}
