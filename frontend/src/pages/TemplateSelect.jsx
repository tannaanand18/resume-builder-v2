import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../services/api";

/* ================================
   TEMPLATE CONFIGURATION
================================ */

const TEMPLATES = [
  // ───── SIMPLE CATEGORY ─────
   {
    id: "simple",  // ✅ Changed from "classic"
    name: "Classic",
    description: "Professional structured layout",
    tag: "Simple",
    style: "classic",
  },
  {
    id: "simple",  // ✅ Changed from "harvard"
    name: "Harvard",
    description: "Academic clean black & white",
    tag: "Simple",
    style: "minimal"
  },
  {
    id: "simple",  // ✅ Changed from "banking"
    name: "Banking",
    description: "Corporate finance layout",
    tag: "Simple",
    style: "finance",
  },
  {
    id: "simple",  // ✅ Changed from "quietblue"
    name: "Quiet Blue",
    description: "Soft blue modern clean",
    tag: "Simple",
    style: "quiet_blue",
  },
  {
    id: "simple",  // ✅ Changed from "lara"
    name: "Anna Field",
    description: "Creative minimal designer",
    tag: "Simple",
    style: "annafield",
  },

  // ───── MODERN CATEGORY ─────
  {
    id: "modern",
    name: "Modern",
    description: "Sidebar professional layout",
    tag: "Modern",
    style: "sidebar",
  },

  {
    id: "modern",  // ✅ NEW
    name: "Simply Blue",
    description: "Clean blue sections",
    tag: "Modern",
    style: "simplyblue_modern",  // New style we'll create
  },
  {
    id: "modern",  // ✅ NEW
    name: "Hunter Green",
    description: "Green sidebar elegant",
    tag: "Modern",
    style: "hunter_green",  // New style we'll create
  },
  {
    id: "modern",  // ✅ NEW
    name: "Silver",
    description: "Minimal gray clean",
    tag: "Modern",
    style: "silver",  // New style we'll create
  },
  {
    id: "modern",  // ✅ NEW
    name: "Slate Dawn",
    description: "Two column modern",
    tag: "Modern",
    style: "slate_dawn",  // New style we'll create
  },


  // ───── CREATIVE CATEGORY ─────
  {
    id: "creative",
    name: "Creative",
    description: "Banner stylish layout",
    tag: "Creative",
    style: "creative",
  },

  {
    id: "creative",  // ✅ NEW
    name: "Black Pattern",
    description: "Dark pattern header",
    tag: "Creative",
    style: "black_pattern",
  },
  {
    id: "creative",  // ✅ NEW
    name: "Atlantic Blue",
    description: "Navy sidebar with red accents",
    tag: "Creative",
    style: "atlantic_blue",
  },
  {
    id: "creative",  // ✅ NEW
    name: "Green Accent",
    description: "Teal accent modern",
    tag: "Creative",
    style: "green_accent",
  },
  {
    id: "creative",  // ✅ NEW
    name: "Rosewood",
    description: "Pink border elegant",
    tag: "Creative",
    style: "rosewood",
  },
  {
    id: "creative",  // ✅ NEW
    name: "Blue Accent",
    description: "Purple accent clean",
    tag: "Creative",
    style: "blue_accent",
  },
];

const FILTERS = ["All Templates", "Simple", "Modern", "Creative"];

/* ================================
   MINI RESUME PREVIEW COMPONENT
================================ */


function MiniResume({ template }) {
  const { style } = template;

  // ════════════════════════════════════════════
  // SIMPLE CATEGORY (5 templates)
  // ════════════════════════════════════════════

  // ── CLASSIC ──
  if (style === "classic") {
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "Georgia, 'Times New Roman', serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header - Centered */}
        <div style={{ padding: "12px 10px 4px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#111", letterSpacing: "0.02em" }}>Andrew O'Sullivan</div>
          <div style={{ fontSize: 5, fontStyle: "italic", color: "#333", marginTop: 2, marginBottom: 5 }}>Product Manager</div>
          
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4, fontSize: 3.5, color: "#111", fontWeight: 600 }}>
            <span>📍 Berlin</span>
            <span>✉ andrew@sulli.com</span>
            <span>📞 +01 111111</span>
          </div>
        </div>
        
        {/* Body Content */}
        <div style={{ padding: "4px 10px" }}>
          {[
            { 
              title: "PROFILE", 
              content: <div style={{ fontSize: 3.8, color: "#222", lineHeight: 1.4, textAlign: "justify" }}>Experienced Product Manager with a proven track record in the development and management of products throughout their lifecycle.</div> 
            },
            { 
              title: "PROFESSIONAL EXPERIENCE", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#111", fontWeight: 900 }}>Product Manager</div>
                  <div style={{ fontSize: 3.5, color: "#444" }}>08/2018 – 07/2023</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <div style={{ fontSize: 4, color: "#333", fontStyle: "italic" }}>Technite GmbH</div>
                  <div style={{ fontSize: 3.5, color: "#444" }}>Berlin, Germany</div>
                </div>
                <div style={{ fontSize: 3.5, color: "#222", lineHeight: 1.3 }}>• Led a cross-functional team of 10 people.</div>
              </> 
            },
            { 
              title: "EDUCATION", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#111", fontWeight: 900 }}>Master of Business Admin</div>
                  <div style={{ fontSize: 3.5, color: "#444" }}>08/2013 – 07/2015</div>
                </div>
                <div style={{ fontSize: 4, color: "#333", fontStyle: "italic" }}>University</div>
              </> 
            }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {/* Bold Title with Full Black Underline */}
              <div style={{ fontSize: 5, fontWeight: 900, color: "#111", borderBottom: "1.5px solid #111", paddingBottom: 1.5, marginBottom: 3, letterSpacing: "0.02em" }}>
                {sec.title}
              </div>
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

// ── HARVARD / MINIMAL ──
  if (style === "minimal" || style === "harvard") {
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "'Times New Roman', Times, serif", boxSizing: "border-box", padding: "10px 12px" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 9.5, fontWeight: "bold", color: "#000" }}>Lee Wang</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, fontSize: 3.5, color: "#000", marginTop: 2 }}>
            <span>✉ lee@wang.com</span>
            <span>📞 555-555-5555</span>
          </div>
        </div>
        
        {/* Body Content */}
        <div>
          {/* Education Section */}
          <div style={{ marginBottom: 5 }}>
            <div style={{ fontSize: 5, fontWeight: "bold", color: "#000", borderBottom: "1px solid #000", paddingBottom: 1, marginBottom: 2 }}>
              Education
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 4.5, fontWeight: "bold", color: "#000" }}>Harvard University</div>
              <div style={{ fontSize: 3.5, color: "#000" }}>May 2018</div>
            </div>
            <div style={{ fontSize: 4, fontStyle: "italic", color: "#000" }}>Master of Liberal Arts</div>
            <div style={{ fontSize: 3.5, color: "#000", marginTop: 1 }}>• Class Marshall Award</div>
          </div>

          {/* Technical Skills Section */}
          <div style={{ marginBottom: 5 }}>
            <div style={{ fontSize: 5, fontWeight: "bold", color: "#000", borderBottom: "1px solid #000", paddingBottom: 1, marginBottom: 2 }}>
              Technical Skills
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, fontSize: 3.5, color: "#000" }}>
              <span>• Machine Learning</span><span>• Java/C#</span>
              <span>• Python/Scikit-learn</span><span>• SQL Server</span>
            </div>
          </div>

          {/* Experience Section */}
          <div style={{ marginBottom: 5 }}>
            <div style={{ fontSize: 5, fontWeight: "bold", color: "#000", borderBottom: "1px solid #000", paddingBottom: 1, marginBottom: 2 }}>
              Professional Experience
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 4.5, fontWeight: "bold", color: "#000" }}>Rande Corporate</div>
              <div style={{ fontSize: 3.5, color: "#000" }}>Sep 2013 – present</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 4, fontStyle: "italic", color: "#000" }}>Associate</div>
              <div style={{ fontSize: 3.5, color: "#000" }}>Detroit, MI</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

// ── BANKING ──
  if (style === "banking" || style === "finance") {
    const grayBg = "#e5e7eb";
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "Arial, sans-serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header - Left Aligned */}
        <div style={{ padding: "12px 10px 6px", textAlign: "left" }}>
          <div style={{ fontSize: 9.5, fontWeight: 900, color: "#111", letterSpacing: "0.02em" }}>Andrew Kim</div>
          <div style={{ fontSize: 3.5, color: "#444", marginTop: 4, fontWeight: 600 }}>
            andrew.kim@gmail.com • +1 415 555 • NYC, USA
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: "2px 10px" }}>
          {[
            {
              title: "Profile",
              content: <div style={{ fontSize: 3.5, color: "#333", lineHeight: 1.4 }}>Experienced finance professional with a successful track record in M&A, valuation and financial modelling.</div>
            },
            {
              title: "Work Experience",
              content: <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <div style={{ width: 35, fontSize: 3.5, color: "#555", flexShrink: 0 }}>2015 Oct – 2017<br/>NYC, USA</div>
                <div>
                  <div style={{ fontSize: 4.5, fontWeight: 800, color: "#111" }}>Financial Analyst</div>
                  <div style={{ fontSize: 3.5, fontStyle: "italic", color: "#444", marginBottom: 1 }}>UBS</div>
                  <div style={{ fontSize: 3.5, color: "#333", lineHeight: 1.3 }}>• Prepared presentations for earnings calls.</div>
                </div>
              </div>
            },
            {
              title: "Education",
              content: <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <div style={{ width: 35, fontSize: 3.5, color: "#555", flexShrink: 0 }}>2013 Sep – 2014</div>
                <div>
                  <div style={{ fontSize: 4.5, fontWeight: 800, color: "#111" }}>MSc Finance</div>
                  <div style={{ fontSize: 3.5, fontStyle: "italic", color: "#444" }}>Harvard Business School</div>
                </div>
              </div>
            }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {/* Light Gray Centered Header */}
              <div style={{ background: grayBg, fontSize: 4.5, fontWeight: 800, color: "#111", textAlign: "center", padding: "2px 0", marginBottom: 3 }}>
                {sec.title}
              </div>
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

// ── QUIET BLUE ──
  if (style === "quiet_blue") {
    const borderBlue = "#bce3ff"; // Light sky blue for section borders
    const iconBlue = "#8ab4f8";
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "Arial, sans-serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Left-Aligned Header */}
        <div style={{ padding: "12px 10px 6px", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 10.5, fontWeight: 800, color: "#000" }}>Rohan Sharma</span>
            <span style={{ fontSize: 6, fontStyle: "italic", color: "#555" }}>IT System Architect</span>
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, fontSize: 3.5, color: "#666", marginTop: 4 }}>
            <span><span style={{color: iconBlue}}>✉</span> rohan@email.com</span>
            <span><span style={{color: iconBlue}}>📞</span> +358 50 123</span>
            <span><span style={{color: iconBlue}}>📍</span> Espoo, Finland</span>
          </div>
        </div>
        
        {/* Body Content */}
        <div style={{ padding: "2px 10px" }}>
          {[
            { 
              title: "Summary", 
              content: <div style={{ fontSize: 3.8, color: "#222", lineHeight: 1.4, textAlign: "justify" }}>IT System Architect with over 15 years of international experience specializing in enterprise-scale endpoint management.</div> 
            },
            { 
              title: "Professional Experience", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#000", fontWeight: 700 }}>Principal Systems Engineer</div>
                  <div style={{ fontSize: 3.5, color: "#444" }}>Nov 2017 – Pres</div>
                </div>
                <div style={{ fontSize: 4, color: "#333", fontStyle: "italic", marginBottom: 2 }}>Nordic Financial Group</div>
                <div style={{ fontSize: 3.8, color: "#222", lineHeight: 1.3 }}>Role: Spearheading modern workplace...<br/>- Designed and deployed Intune.</div>
              </> 
            },
            { 
              title: "Education", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#000", fontWeight: 700 }}>MBA in Information Systems</div>
                  <div style={{ fontSize: 3.5, color: "#444" }}>2014</div>
                </div>
                <div style={{ fontSize: 4, color: "#333", fontStyle: "italic" }}>Delhi Technical University</div>
              </> 
            }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {/* Centered title with light blue top and bottom borders */}
              <div style={{ 
                borderTop: `1.5px solid ${borderBlue}`, 
                borderBottom: `1.5px solid ${borderBlue}`, 
                fontSize: 4.5, 
                fontWeight: 700, 
                color: "#000", 
                textAlign: "center", 
                padding: "2px 0", 
                marginBottom: 3 
              }}>
                {sec.title}
              </div>
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }
  // ── LARA MILLER (ANNAFIELD) ──
  if (style === "annafield") {
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "serif" }}>
        <div style={{ padding: "10px 10px 6px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#111" }}>Anna Field</div>
          <div style={{ fontSize: 6.5, color: "#555", marginTop: 1 }}>Junior Project Manager</div>
          <div style={{ fontSize: 4.5, color: "#777", marginTop: 3, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span>📍 Paris</span><span>✉ anna@field.com</span>
          </div>
        </div>
        <div style={{ padding: "7px 10px" }}>
          {["Profile", "Work Experience", "Education", "Skills"].map((sec, si) => (
            <div key={si} style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 6.5, fontWeight: 700, background: "#f3f4f6", padding: "1px 5px", color: "#374151", marginBottom: 3, textAlign: "center", letterSpacing: "0.02em" }}>{sec}</div>
              {si === 0 && <div style={{ fontSize: 4.5, color: "#555", lineHeight: 1.6 }}>Passionate Project Manager committed to results.</div>}
              {si === 1 && <><div style={{ fontSize: 5, fontWeight: 700 }}>Junior PM</div><div style={{ fontSize: 4, color: "#666" }}>ABC Corp • 2021–present</div></>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // MODERN CATEGORY (5 templates)
  // ════════════════════════════════════════════

  // ── MODERN SIDEBAR ──
  if (style === "sidebar" || style === "atlantic") {
    // c8 ignore start
    const sideColor = style === "atlantic" ? "#1e3a5f" : "#1f2937";
    // c8 ignore stop
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", display: "flex", fontFamily: "sans-serif" }}>
        <div style={{ width: 55, background: sideColor, padding: "10px 6px", color: "#fff" }}>
          <div style={{ fontSize: 5.5, fontWeight: 700, textAlign: "center", marginBottom: 6, lineHeight: 1.2 }}>BRIAN T. WAYNE</div>
          <div style={{ fontSize: 4.5, opacity: 0.8, marginBottom: 8, lineHeight: 1.2 }}>Business Dev</div>
          <div style={{ fontSize: 5, fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 2, marginBottom: 4 }}>Contact</div>
          {["brian@wayne.com", "+1-541-754", "wayne.com"].map((t, i) => (
            <div key={i} style={{ fontSize: 3.8, opacity: 0.8, marginBottom: 2, lineHeight: 1.3 }}>• {t}</div>
          ))}
          <div style={{ fontSize: 5, fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 2, marginBottom: 4, marginTop: 6 }}>Skills</div>
          {["Strategy", "Leadership"].map((s, i) => (
            <div key={i} style={{ fontSize: 3.8, opacity: 0.8, marginBottom: 2, lineHeight: 1.3 }}>• {s}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: "8px 7px" }}>
          {[["Profile", true], ["Experience", false]].map(([sec, isProfile], si) => (
            <div key={si} style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 6, fontWeight: 800, textTransform: "uppercase", color: sideColor, borderBottom: `1px solid ${sideColor}`, paddingBottom: 1, marginBottom: 3 }}>{sec}</div>
              {isProfile ? <div style={{ fontSize: 4.5, color: "#555", lineHeight: 1.6 }}>Passionate consultant.</div> : (
                <>
                  <div style={{ fontSize: 5, fontWeight: 700, color: "#222", lineHeight: 1.2 }}>Senior Consultant</div>
                  <div style={{ fontSize: 4, color: "#888", lineHeight: 1.2 }}>Appleseed 2022–present</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

 // ── SIMPLY BLUE ──
  if (style === "simplyblue" || style === "simplyblue_modern") {
    const blue = "#2a3b8f"; // Deep vibrant blue matching the screenshot
    const lightBg = "#f0f4f8"; // Light grey-blue for section headers

    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "sans-serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header */}
        <div style={{ padding: "10px 10px 6px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: blue }}>Anna Field</span>
            <span style={{ fontSize: 6, color: blue, fontWeight: 500 }}>Junior Project Manager</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 3.5, color: "#111", marginTop: 4, fontWeight: 600 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span><span style={{color: blue}}>📍</span> Paris, France</span>
              <span><span style={{color: blue}}>✉</span> anna@field.com</span>
            </div>
          </div>
        </div>
        
        {/* Body Content */}
        <div style={{ padding: "2px 10px" }}>
          {[
            { 
              title: "Profile", 
              content: <div style={{ fontSize: 3.8, color: "#333", lineHeight: 1.4 }}>Passionate and driven Junior Project Manager with a track record of delivering successful projects on time and within budget.</div> 
            },
            { 
              title: "Work Experience", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#111", fontWeight: 800 }}>Junior Project Manager</div>
                  <div style={{ fontSize: 3.5, color: "#444" }}>08/2021 – present</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <div style={{ fontSize: 3.8, color: "#111", fontStyle: "italic" }}>ABC Corporation</div>
                  <div style={{ fontSize: 3.5, color: "#444" }}>Paris, France</div>
                </div>
                <div style={{ fontSize: 3.5, color: "#333", lineHeight: 1.3 }}>• Successfully managed multiple projects.</div>
              </> 
            },
            { 
              title: "Education", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#111", fontWeight: 800 }}>Bachelor of Science</div>
                  <div style={{ fontSize: 3.5, color: "#444" }}>09/2018 – 2022</div>
                </div>
              </> 
            }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {/* Light Blue/Grey Centered Header */}
              <div style={{ background: lightBg, fontSize: 4.5, fontWeight: 800, color: blue, textAlign: "center", padding: "2px 0", marginBottom: 3, borderRadius: 1 }}>
                {sec.title}
              </div>
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // ── HUNTER GREEN ──
  if (style === "hunter_green") {
    const hunter = "#385243"; // Deep olive / hunter green
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", display: "flex", fontFamily: "Georgia, serif", boxSizing: "border-box" }}>
        
        {/* Left Sidebar (Hunter Green) */}
        <div style={{ width: 65, background: hunter, padding: "10px 8px", color: "#fff", flexShrink: 0 }}>
          <div style={{ fontSize: 7, fontWeight: 700, marginBottom: 2, lineHeight: 1.1 }}>Brian T. Wayne</div>
          <div style={{ fontSize: 4.5, fontStyle: "italic", marginBottom: 6, lineHeight: 1.2, color: "#e2e8f0" }}>Business Development Consultant</div>
          
          <div style={{ fontSize: 3.5, color: "#cbd5e1", marginBottom: 6, lineHeight: 1.4 }}>
            <span>✉ brian@wayne.com</span><br/>
            <span>📞 +1-541-754</span><br/>
            <span>📍 Malibu, CA</span>
          </div>
          
          <div style={{ fontSize: 5, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.4)", paddingBottom: 2, marginBottom: 3 }}>Profile</div>
          <div style={{ fontSize: 3.5, color: "#cbd5e1", lineHeight: 1.3, marginBottom: 6, textAlign: "justify" }}>I'm Brian Thomas Wayne, a business development consultant with a passion for helping companies achieve growth.</div>
          
          <div style={{ fontSize: 5, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.4)", paddingBottom: 2, marginBottom: 3 }}>Education</div>
          <div style={{ fontSize: 4, fontWeight: 700 }}>MBA</div>
          <div style={{ fontSize: 3.5, color: "#cbd5e1", lineHeight: 1.2 }}>Harvard<br/>2016 – 2018</div>
        </div>
        
        {/* Right Column (White) */}
        <div style={{ flex: 1, padding: "10px 8px" }}>
          
          <div style={{ fontSize: 5, fontWeight: 800, color: "#111", borderBottom: "1.5px solid #111", paddingBottom: 2, marginBottom: 4 }}>
            Professional Experience
          </div>
          
          <div style={{ marginBottom: 5 }}>
            <div style={{ fontSize: 4.5, fontWeight: 800, color: "#111" }}>Business Dev Consultant</div>
            <div style={{ fontSize: 3.5, color: "#555", fontStyle: "italic", marginBottom: 1 }}>Appleseed Inc. | 2022–Pres</div>
            <div style={{ fontSize: 3.5, color: "#444", lineHeight: 1.3 }}>• Developed strategic plans resulting in a 30% increase.<br/>• Collaborated with teams.</div>
          </div>
          
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 4.5, fontWeight: 800, color: "#111" }}>Business Development</div>
            <div style={{ fontSize: 3.5, color: "#555", fontStyle: "italic" }}>Aexus | 2018–2022</div>
          </div>
          
          <div style={{ fontSize: 5, fontWeight: 800, color: "#111", borderBottom: "1.5px solid #111", paddingBottom: 2, marginBottom: 4 }}>
            Skills
          </div>
          
          <div style={{ fontSize: 3.5, color: "#444", lineHeight: 1.4 }}>
            • Strategic thinking<br/>• Relationship building<br/>• Creative innovation
          </div>
          
        </div>
      </div>
    );
  }

  // ── SILVER ──
  if (style === "silver") {
    const grayBg = "#f3f4f6";
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "Georgia, serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header */}
        <div style={{ padding: "12px 12px 6px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#111", letterSpacing: "0.02em" }}>David Chen</div>
          <div style={{ fontSize: 5.5, color: "#333", marginTop: 2, marginBottom: 6 }}>Senior Project Manager</div>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 3.5, color: "#444" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span>📍 New York, NY</span>
              <span>📞 +1 234-567</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "right" }}>
              <span>✉ david@chen.com</span>
              <span>🔗 linkedin.com/in/david</span>
            </div>
          </div>
        </div>
        
        {/* Body Content */}
        <div style={{ padding: "4px 12px" }}>
          {[
            { 
              title: "Profile", 
              content: <div style={{ fontSize: 3.8, color: "#333", lineHeight: 1.4, textAlign: "justify" }}>Passionate and driven Senior Project Manager with a track record of delivering successful projects on time and within budget.</div> 
            },
            { 
              title: "Work Experience", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#111" }}><span style={{ fontWeight: 800 }}>Senior Project Manager</span>, ABC Corp</div>
                  <div style={{ fontSize: 3.5, color: "#555", textAlign: "right" }}>2021 – Pres<br/>New York, NY</div>
                </div>
              </> 
            },
            { 
              title: "Education", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#111", fontWeight: 800 }}>B.S. Business Admin</div>
                  <div style={{ fontSize: 3.5, color: "#555" }}>2018 – 2022</div>
                </div>
              </> 
            }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {/* Light Gray Centered Header */}
              <div style={{ background: grayBg, fontSize: 4.5, fontWeight: 800, color: "#111", textAlign: "center", padding: "2px 0", marginBottom: 3 }}>
                {sec.title}
              </div>
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── SLATE DAWN ──
  if (style === "slate_dawn") {
    const navy = "#1e3a8a";
    const slateBg = "#eef2f6";
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "Georgia, serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header - Light Slate Blue */}
        <div style={{ background: slateBg, padding: "12px 10px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: navy }}>
            Alessandro Ricci <span style={{ fontSize: 6, fontWeight: 400, color: navy }}>MD</span>
          </div>
          <div style={{ fontSize: 3.5, color: "#444", marginTop: 4 }}>
            alessandro@email.com | +39 3381 | Bologna, Italy
          </div>
        </div>
        
        {/* Body - Two Columns */}
        <div style={{ padding: "8px 10px", display: "flex", gap: 8 }}>
          
          {/* Left Column */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 4.5, fontWeight: 800, color: navy, borderBottom: `1.5px solid ${navy}`, paddingBottom: 1, marginBottom: 4 }}>EDUCATION</div>
            <div style={{ fontSize: 4, fontWeight: 800, color: "#111" }}>Doctor of Medicine</div>
            <div style={{ fontSize: 3.5, color: "#444" }}>Univ. of Bologna</div>
            <div style={{ fontSize: 3.5, color: "#666", marginBottom: 6 }}>09.2017 – 06.2023</div>

            <div style={{ fontSize: 4.5, fontWeight: 800, color: navy, borderBottom: `1.5px solid ${navy}`, paddingBottom: 1, marginBottom: 4 }}>RESEARCH</div>
            <div style={{ fontSize: 4, fontWeight: 800, color: "#111" }}>Research Assistant</div>
            <div style={{ fontSize: 3.5, color: "#666" }}>01.2023 – 03.2023</div>
          </div>
          
          {/* Right Column */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 4.5, fontWeight: 800, color: navy, borderBottom: `1.5px solid ${navy}`, paddingBottom: 1, marginBottom: 4 }}>EXPERIENCE</div>
            <div style={{ fontSize: 4, fontWeight: 800, color: "#111" }}>Externship</div>
            <div style={{ fontSize: 3.5, color: "#444" }}>Sant'Orsola Clinic</div>
            <div style={{ fontSize: 3.5, color: "#666", marginBottom: 6 }}>11.2024 – 05.2025</div>

            <div style={{ fontSize: 4.5, fontWeight: 800, color: navy, borderBottom: `1.5px solid ${navy}`, paddingBottom: 1, marginBottom: 4 }}>CERTIFICATIONS</div>
            <div style={{ fontSize: 4, fontWeight: 800, color: "#111" }}>USMLE Step 1</div>
            <div style={{ fontSize: 3.5, color: "#666" }}>Passed | 07/2024</div>
          </div>
          
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // CREATIVE CATEGORY (6 templates)
  // ════════════════════════════════════════════

  // ── CREATIVE PURPLE ──
  // ── CREATIVE ──
  if (style === "creative") {
    const purple = "#8b5cf6"; // Vivid purple matching the screenshot
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "sans-serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header - Purple Block */}
        <div style={{ background: purple, padding: "12px 10px 10px", color: "#fff" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.02em" }}>Mateo Vargas</div>
          <div style={{ fontSize: 5, marginTop: 2, opacity: 0.9 }}>Senior Software Engineer</div>
          <div style={{ fontSize: 4, color: "#e2e8f0", marginTop: 4 }}>mateo@dev.com</div>
        </div>
        
        {/* Content Body */}
        <div style={{ padding: "8px 10px" }}>
          {[
            { 
              title: "PROFILE", 
              content: <div style={{ fontSize: 3.8, color: "#444", lineHeight: 1.4 }}>Senior engineer with 8 years experience.</div> 
            },
            { 
              title: "EXPERIENCE", 
              content: <>
                <div style={{ fontSize: 4.5, fontWeight: 800, color: "#111" }}>Senior SWE</div>
                <div style={{ fontSize: 3.5, color: "#666" }}>BuildRight • 2022–Present</div>
              </> 
            },
            { title: "EDUCATION", content: null },
            { title: "SKILLS", content: null }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {/* Purple Title with full underline */}
              <div style={{ fontSize: 5, fontWeight: 800, color: purple, borderBottom: `1.2px solid ${purple}`, paddingBottom: 1, marginBottom: 3 }}>
                {sec.title}
              </div>
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── BLACK PATTERN ──
  if (style === "black_pattern") {
    // Creating a subtle diagonal stripe pattern for the header
    const darkPattern = "repeating-linear-gradient(-45deg, #0f172a, #0f172a 8px, #1e293b 8px, #1e293b 16px)";
    
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "sans-serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header - Dark Pattern */}
        <div style={{ background: darkPattern, padding: "12px 10px 10px", color: "#fff" }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.02em" }}>Catherine Bale</div>
          <div style={{ fontSize: 5, fontStyle: "italic", opacity: 0.9, marginTop: 1, marginBottom: 4 }}>Marketing Assistant</div>
          <div style={{ fontSize: 3.5, color: "#cbd5e1", display: "flex", gap: 3, flexWrap: "wrap", lineHeight: 1.4 }}>
            <span>📍 Malibu, CA</span>
            <span>📞 +1-541-754</span>
            <span>✉ c.bale@bale.com</span>
          </div>
        </div>
        
        {/* Content Body */}
        <div style={{ padding: "6px 10px" }}>
          {[
            { 
              title: "Profile", 
              content: <div style={{ fontSize: 3.8, color: "#333", lineHeight: 1.4 }}>To obtain a challenging marketing position with a reputable company where I can utilize my skills.</div> 
            },
            { 
              title: "Professional Experience", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#111" }}><span style={{ fontWeight: 800 }}>Acme Corp</span>, <span style={{ fontStyle: "italic" }}>Marketing Manager</span></div>
                  <div style={{ fontSize: 3.5, color: "#555" }}>2019 – pres</div>
                </div>
                <div style={{ fontSize: 3.8, color: "#444", marginTop: 1, lineHeight: 1.3 }}>Developed and executed marketing strategies.</div>
              </> 
            },
            { 
              title: "Education", 
              content: <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 4.5, color: "#111" }}><span style={{ fontWeight: 800 }}>Business Marketing</span>, <span style={{ fontStyle: "italic" }}>Univ. of Wisconsin</span></div>
                  <div style={{ fontSize: 3.5, color: "#555" }}>2014 – 2017</div>
                </div>
              </> 
            },
            { 
              title: "Certificates", 
              content: <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
                {["Google Analytics", "HubSpot Inbound"].map((c, i) => (
                  <span key={i} style={{ fontSize: 3.5, background: "#111", color: "#fff", padding: "2px 4px", borderRadius: 2, fontWeight: 600 }}>{c}</span>
                ))}
              </div> 
            }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {/* Thick black underline matching the image */}
              <div style={{ display: "inline-block", fontSize: 5, fontWeight: 800, color: "#111", borderBottom: "1.5px solid #111", paddingBottom: 1, marginBottom: 3 }}>
                {sec.title}
              </div>
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── ATLANTIC BLUE ──
  if (style === "atlantic_blue") {
    const navy = "#313c4e";
    const coral = "#eb636b";
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", display: "flex", fontFamily: "sans-serif", boxSizing: "border-box" }}>
        
        {/* Left Sidebar (Navy) */}
        <div style={{ width: 65, background: navy, padding: "10px 8px", color: "#fff", flexShrink: 0 }}>
          <div style={{ fontSize: 7.5, fontWeight: 700, marginBottom: 1, lineHeight: 1.1 }}>Brian T. Wayne</div>
          <div style={{ fontSize: 4.5, marginBottom: 6, lineHeight: 1.2, color: "#ccc" }}>Business Development<br/>Consultant</div>
          
          <div style={{ fontSize: 3.5, color: "#aaa", marginBottom: 6, lineHeight: 1.4 }}>
            <span style={{color: coral}}>✉</span> brian@wayne.com<br/>
            <span style={{color: coral}}>📞</span> +1-541-754<br/>
            <span style={{color: coral}}>📍</span> Malibu, CA
          </div>
          
          <div style={{ fontSize: 5, fontWeight: 700, borderBottom: `1.5px dotted ${coral}`, paddingBottom: 2, marginBottom: 3 }}>👤 PROFILE</div>
          <div style={{ fontSize: 3.5, color: "#ccc", lineHeight: 1.3, marginBottom: 6 }}>Experienced consultant with a passion for helping companies achieve growth.</div>
          
          <div style={{ fontSize: 5, fontWeight: 700, borderBottom: `1.5px dotted ${coral}`, paddingBottom: 2, marginBottom: 3 }}>🎓 EDUCATION</div>
          <div style={{ fontSize: 4, fontWeight: 700 }}>MBA</div>
          <div style={{ fontSize: 3.5, color: "#ccc", lineHeight: 1.2 }}>Harvard<br/>2016 – 2018</div>
        </div>
        
        {/* Right Column (White) */}
        <div style={{ flex: 1, padding: "10px 8px" }}>
          
          <div style={{ fontSize: 5, fontWeight: 800, color: navy, borderBottom: `1.5px dotted ${coral}`, paddingBottom: 2, marginBottom: 4 }}>
            💼 EXPERIENCE
          </div>
          
          <div style={{ marginBottom: 5 }}>
            <div style={{ fontSize: 4.5, fontWeight: 800, color: navy }}>Appleseed Inc.</div>
            <div style={{ fontSize: 4, color: "#666" }}>Consultant | 2022–Pres</div>
            <div style={{ fontSize: 3.5, color: "#555", lineHeight: 1.3, marginTop: 1 }}>• Developed strategic plans.<br/>• Collaborated with teams.</div>
          </div>
          
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 4.5, fontWeight: 800, color: navy }}>Aexus</div>
            <div style={{ fontSize: 4, color: "#666" }}>Business Dev | 2018–2022</div>
          </div>
          
          <div style={{ fontSize: 5, fontWeight: 800, color: navy, borderBottom: `1.5px dotted ${coral}`, paddingBottom: 2, marginBottom: 4 }}>
            ⚡ SKILLS
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 3.5, background: coral, color: "#fff", padding: "2px 4px", borderRadius: 2, fontWeight: 600, width: "fit-content" }}>Strategic thinking</div>
            <div style={{ fontSize: 3.5, background: coral, color: "#fff", padding: "2px 4px", borderRadius: 2, fontWeight: 600, width: "fit-content" }}>Relationship building</div>
          </div>
          
        </div>
      </div>
    );
  }

  // ── GREEN ACCENT ──
  if (style === "green_accent") {
    const teal = "#0d9488";
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "sans-serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header - Script Name & Centered Contact */}
        <div style={{ padding: "12px 10px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: teal, fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive, serif" }}>
            Meghana Hegde
          </div>
          <div style={{ fontSize: 3.8, color: "#555", marginTop: 3, display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap", fontWeight: 600 }}>
            <span>📍 Urbana, IL</span>
            <span>✉ meghana@email.com</span>
            <span>📞 +1 312-555</span>
          </div>
        </div>
        
        {/* Content Body */}
        <div style={{ padding: "2px 10px" }}>
          {[
            { 
              title: "Profile", 
              content: <div style={{ fontSize: 4, color: "#333", lineHeight: 1.5 }}>Data Scientist with 3+ years experience in ML models and generative AI using AWS, Spark, and Kafka.</div> 
            },
            { 
              title: "Work Experience", 
              content: <>
                <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                  <div style={{ width: 35, fontSize: 3.8, color: teal, fontWeight: 600, flexShrink: 0 }}>06/2025 – Pres</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 4.5, color: "#111" }}><span style={{ fontWeight: 700 }}>ML Intern</span>, <span style={{ fontStyle: "italic" }}>Nexus AI</span></div>
                    <div style={{ fontSize: 3.8, color: "#444", marginTop: 1, lineHeight: 1.3 }}>• Built scalability testing agent using REST APIs and LLMs.</div>
                  </div>
                </div>
              </> 
            },
            { 
              title: "Education", 
              content: <>
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 35, fontSize: 3.8, color: teal, fontWeight: 600, flexShrink: 0 }}>08/2023 – 05/2025</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 4.5, color: "#111" }}><span style={{ fontWeight: 700 }}>MS Data Science</span>, <span style={{ fontStyle: "italic" }}>Univ. of Illinois</span></div>
                  </div>
                </div>
              </> 
            },
            { 
              title: "Skills", 
              content: <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
              {["Python", "SQL", "XGBoost", "Spark", "Kafka"].map((s, i) => (
                <span key={i} style={{ fontSize: 3.8, border: "0.5px solid #888", color: "#333", padding: "1px 4px", borderRadius: 3 }}>{s}</span>
              ))}
            </div> 
            }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 5.5, fontWeight: 800, color: teal, borderBottom: `1px solid ${teal}`, paddingBottom: 1, marginBottom: 2 }}>{sec.title}</div>
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── ROSEWOOD ──
  if (style === "rosewood") {
    const pink = "#d4669e";
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "sans-serif", border: `4px solid ${pink}`, boxSizing: "border-box" }}>
        
        {/* Header */}
        <div style={{ padding: "8px 10px 4px", textAlign: "center", borderBottom: `1px solid ${pink}30`, marginBottom: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#111", lineHeight: 1.2 }}>Meghana Hegde</div>
          <div style={{ fontSize: 5, fontStyle: "italic", color: "#555", marginTop: 1 }}>Data Scientist & AI Specialist</div>
          <div style={{ fontSize: 3.8, color: "#777", marginTop: 3 }}>meghana@email.com • +1 312-555-0139</div>
          <div style={{ fontSize: 3.8, color: "#777", marginTop: 1 }}>Urbana, Illinois</div>
        </div>

        {/* Content */}
        <div style={{ padding: "4px 8px 8px" }}>
          {["🎓 SUMMARY", "💼 EXPERIENCE", "📚 EDUCATION", "⚡ SKILLS", "🚀 PROJECTS", "🏆 CERTIFICATES"].map((sec, si) => (
            <div key={si} style={{ marginBottom: 4 }}>
              
              {/* Emoji Section Header */}
              <div style={{ fontSize: 4.5, fontWeight: 700, background: "#f3f4f6", padding: "1.5px 6px", textAlign: "center", marginBottom: 2, borderRadius: 3, color: "#333", letterSpacing: "0.02em" }}>
                {sec}
              </div>

              {/* Summary */}
              {si === 0 && <div style={{ fontSize: 4, color: "#555", lineHeight: 1.4, textAlign: "center" }}>Data Scientist with 3+ years experience in ML models and generative AI solutions.</div>}
              
              {/* Experience */}
              {si === 1 && <>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 4.5, fontWeight: 700 }}>Nexus AI, ML Intern</span><span style={{ fontSize: 4, color: "#888" }}>06/2025–Pres</span></div>
                <div style={{ fontSize: 3.8, color: "#777", marginTop: 0.5 }}>• Built scalable testing agent with LLMs.</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span style={{ fontSize: 4.5, fontWeight: 700 }}>Univ. of Illinois, RA</span><span style={{ fontSize: 4, color: "#888" }}>01/2025–05/2025</span></div>
                <div style={{ fontSize: 3.8, color: "#777", marginTop: 0.5 }}>• Python pipeline for time-series data.</div>
              </>}
              
              {/* Education */}
              {si === 2 && <>
                <div style={{ fontSize: 4.5, fontWeight: 700, textAlign: "center" }}>MS Data Science • Univ. of Illinois</div>
                <div style={{ fontSize: 4, color: "#777", textAlign: "center" }}>08/2023–05/2025 • Urbana, US</div>
              </>}
              
              {/* Skills */}
              {si === 3 && <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", marginTop: 2 }}>
                {["Python", "SQL", "AWS", "XGBoost", "Spark", "CNN"].map((s, i) => (
                  <span key={i} style={{ fontSize: 3.8, border: `0.5px solid ${pink}60`, padding: "1px 4px", borderRadius: 6, color: "#333" }}>{s}</span>
                ))}
              </div>}
              
              {/* Projects */}
              {si === 4 && <>
                <div style={{ fontSize: 4.5, fontWeight: 700, color: "#222", textAlign: "center" }}>Mistral-7B Fine-Tuning</div>
                <div style={{ fontSize: 3.8, color: "#777", textAlign: "center" }}>• Automated ML pipeline (ROUGE-L 0.79).</div>
              </>}
              
              {/* Certifications */}
              {si === 5 && <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", marginTop: 2 }}>
                {["Azure AI", "Deep Learning", "Snowflake"].map((c, i) => (
                  <span key={i} style={{ fontSize: 3.8, background: "#f3f4f6", padding: "1.5px 4px", borderRadius: 2, color: "#444" }}>{c}</span>
                ))}
              </div>}
              
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── BLUE ACCENT ──
  // c8 ignore start
  if (style === "blue_accent") {
    const purple = "#4f39a3"; // Matching the deep purple/blue from your image
    return (
      <div style={{ width: 165, background: "#fff", borderRadius: 4, boxShadow: "0 2px 16px rgba(0,0,0,0.13)", overflow: "hidden", fontFamily: "sans-serif", boxSizing: "border-box", paddingBottom: 10 }}>
        
        {/* Header - Centered with Purple Name */}
        <div style={{ padding: "12px 10px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: purple, letterSpacing: "0.02em" }}>Meghana Hegde</div>
          <div style={{ fontSize: 4, color: "#555", marginTop: 4, display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
            <span>📍 Urbana, IL</span>
            <span>✉ meghana@email.com</span>
            <span>📞 +1 312-555</span>
          </div>
        </div>
        
        {/* Content Body */}
        <div style={{ padding: "2px 10px" }}>
          {[
            { 
              icon: "👤", 
              title: "Profile", 
              content: <div style={{ fontSize: 4, color: "#444", lineHeight: 1.6 }}>Data Scientist with 3+ years experience in ML models, real-time analytics, and generative AI solutions using AWS, GCP, Spark, and Kafka.</div> 
            },
            { 
              icon: "💼", 
              title: "Professional Experience", 
              content: <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 4.5, fontWeight: 700, color: "#111" }}>Nexus AI</span>
                <span style={{ fontSize: 3.5, color: "#777" }}>06/2025–Present</span>
              </div>
              <div style={{ fontSize: 4, fontStyle: "italic", color: "#555", marginBottom: 1 }}>ML Engineer Intern</div>
              <div style={{ fontSize: 3.8, color: "#666", lineHeight: 1.4 }}>• Built scalability testing agent using REST APIs and LLMs.</div>
            </> 
            },
            { 
              icon: "🎓", 
              title: "Education", 
              content: <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 4.5, fontWeight: 700, color: "#111" }}>MS Data Science</span>
                <span style={{ fontSize: 3.5, color: "#777" }}>08/2023–05/2025</span>
              </div>
              <div style={{ fontSize: 4, fontStyle: "italic", color: "#555" }}>Univ. of Illinois</div>
            </> 
            },
            { 
              icon: "⚡", 
              title: "Skills", 
              content: <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
              {["Python", "SQL", "XGBoost", "Spark", "Kafka", "AWS"].map((s, i) => (
                <span key={i} style={{ fontSize: 3.8, border: "0.5px solid #aaa", color: "#333", padding: "1.5px 4px", borderRadius: 2 }}>{s}</span>
              ))}
            </div> 
            }
          ].map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              {/* Icon + Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>
                <span style={{ fontSize: 5 }}>{sec.icon}</span>
                <span style={{ fontSize: 5.5, fontWeight: 800, color: "#111", letterSpacing: "0.02em" }}>{sec.title}</span>
              </div>
              {/* Short thick purple underline (Key visual from your screenshot!) */}
              <div style={{ width: 14, height: 1.5, background: purple, marginBottom: 3 }}></div>
              {/* Content */}
              {sec.content}
            </div>
          ))}
        </div>
      </div>
    );
  }
  // c8 ignore stop
  // c8 ignore start
  return null;
  // c8 ignore stop
}

/* ================================
   MAIN COMPONENT
================================ */

const CATEGORY_INFO = {
  Simple: { icon: "📄", color: "#059669", desc: "Clean, traditional layouts perfect for corporate roles" },
  Modern: { icon: "✨", color: "#2563eb", desc: "Contemporary designs with sidebars and columns" },
  Creative: { icon: "🎨", color: "#9333ea", desc: "Bold, eye-catching templates that stand out" },
};

export default function TemplateSelect() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All Templates");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  // ✅ AUTH CHECK: Wait for auth to load, then check if user exists
  useEffect(() => {
    if (authLoading === false && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  // ✅ SHOW NOTHING WHILE LOADING - Prevents premature redirects
  if (authLoading) {
    return null;
  }

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchFilter = activeFilter === "All Templates" || t.tag === activeFilter;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.tag.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {  
    "All Templates": TEMPLATES.length,
    Simple: TEMPLATES.filter(t => t.tag === "Simple").length,
    Modern: TEMPLATES.filter(t => t.tag === "Modern").length,
    Creative: TEMPLATES.filter(t => t.tag === "Creative").length,
  };

  const createWithTemplate = async (templateId, templateStyle) => {
    try {
      // ✅ Grab the token for iOS devices
      const token = localStorage.getItem('access_token'); 

      const res = await fetch(`${API_URL}/api/resume/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ✅ Inject the Bearer token into the headers if it exists
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({
          title: "Untitled Resume",
          template_name: templateId,
          template_style: templateStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create resume");
      navigate(`/resume/${data.resume_id}/edit`);
    } catch (err) {
      console.error("Create resume error:", err);
      alert("Failed to create resume.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)" }}>
      {/* Injected CSS animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .ts-card {
          cursor: pointer;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid transparent;
          background: #fff;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
          position: relative;
        }
        .ts-card:hover {
          border-color: #818cf8;
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 20px 48px rgba(99,102,241,0.15), 0 8px 24px rgba(0,0,0,0.08);
        }
        .ts-card .ts-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          transition: background 0.3s ease;
          z-index: 2;
        }
        .ts-card:hover .ts-overlay {
          background: rgba(99,102,241,0.08);
        }
        .ts-card .ts-use-btn {
          opacity: 0;
          transform: translateY(8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ts-card:hover .ts-use-btn {
          opacity: 1;
          transform: translateY(0);
        }
        .ts-filter-btn {
          padding: 10px 22px;
          border-radius: 50px;
          border: 1.5px solid #e5e7eb;
          cursor: pointer;
          font-weight: 600;
          font-size: 13.5px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
          outline: none;
        }
        .ts-filter-btn:hover {
          border-color: #a5b4fc;
          background: #eef2ff !important;
          color: #4338ca !important;
        }
        .ts-search-input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
          color: #1f2937;
        }
        .ts-search-input::placeholder { color: #9ca3af; }
        .ts-search-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(129,140,248,0.12);
          background: #fff;
        }
        .ts-back-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 9px 20px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          color: #374151;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          font-family: inherit;
        }
        .ts-back-btn:hover {
          background: #f9fafb;
          border-color: #818cf8;
          color: #4f46e5;
        }
        .ts-back-btn:hover .btn-arrow { transform: translateX(-4px); }
      `}</style>

      {/* Header */}
      <header style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(229,231,235,0.6)",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        animation: "slideDown 0.5s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)"
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <path d="M7 8h10M7 12h6M7 16h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#111827", letterSpacing: "-0.03em" }}>ResumeAI</span>
        </div>
        <button className="ts-back-btn" onClick={() => navigate("/dashboard")}>
          <div className="btn-arrow" style={{ transition: "transform 0.3s ease", display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
          <span>Back to Dashboard</span>
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Hero */}
        <div style={{
          textAlign: "center", marginBottom: 48,
          animation: loaded ? "fadeUp 0.6s ease both" : "none"
        }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 50,
            background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
            color: "#6366f1", fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: "0.04em"
          }}>
            {TEMPLATES.length} PROFESSIONAL TEMPLATES
          </div>
          <h1 style={{
            fontSize: 40, fontWeight: 800, color: "#111827", margin: "0 0 12px",
            letterSpacing: "-0.03em", lineHeight: 1.15
          }}>
            Choose Your Perfect Template
          </h1>
          <p style={{ color: "#6b7280", fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Pick a design that matches your style. Every template is fully customizable.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{
          maxWidth: 480, margin: "0 auto 36px", position: "relative",
          animation: loaded ? "fadeUp 0.6s ease 0.1s both" : "none"
        }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2"
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            className="ts-search-input"
            type="text"
            placeholder="Search templates by name, style, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "#f3f4f6", border: "none", borderRadius: "50%", width: 24, height: 24,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              color: "#6b7280", fontSize: 14, fontWeight: 700
            }}>✕</button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{
          display: "flex", gap: 10, justifyContent: "center", marginBottom: 44, flexWrap: "wrap",
          animation: loaded ? "fadeUp 0.6s ease 0.2s both" : "none"
        }}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            return (
              <button key={f} className="ts-filter-btn" onClick={() => setActiveFilter(f)}
                style={{
                  backgroundColor: isActive ? "#4f46e5" : "#fff",
                  color: isActive ? "#fff" : "#374151",
                  borderColor: isActive ? "#4f46e5" : "#e5e7eb",
                  boxShadow: isActive ? "0 4px 14px rgba(79,70,229,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                {f !== "All Templates" && <span>{CATEGORY_INFO[f]?.icon}</span>}
                <span>{f}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: isActive ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                  color: isActive ? "#fff" : "#9ca3af"
                }}>{counts[f]}</span>
              </button>
            );
          })}
        </div>

        {/* Category description */}
        {activeFilter !== "All Templates" && CATEGORY_INFO[activeFilter] && (
          <div style={{
            textAlign: "center", marginBottom: 32, animation: "fadeIn 0.3s ease",
            color: CATEGORY_INFO[activeFilter].color, fontSize: 14, fontWeight: 600
          }}>
            {CATEGORY_INFO[activeFilter].desc}
          </div>
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px", animation: "fadeIn 0.3s ease"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No templates found</div>
            <div style={{ fontSize: 14, color: "#9ca3af" }}>Try a different search term or filter.</div>
          </div>
        )}

        {/* Template Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 28 }}>
          {filteredTemplates.map((t, index) => (
            <div
              key={`${t.style}-${index}`}
              className="ts-card"
              onClick={() => createWithTemplate(t.id, t.style)}
              style={{
                animation: loaded ? `fadeUp 0.5s ease ${0.08 * index}s both` : "none",
              }}
            >
              {/* Preview Area */}
              <div style={{
                height: 310, background: "linear-gradient(180deg, #fafafe 0%, #f3f4f8 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden"
              }}>
                <div style={{ transform: "scale(1.15)", transition: "transform 0.4s ease" }}>
                  <MiniResume template={t} />
                </div>
                <div className="ts-overlay">
                  <div className="ts-use-btn" style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff", padding: "12px 28px", borderRadius: 12,
                    fontWeight: 700, fontSize: 14, letterSpacing: "0.02em",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                    display: "flex", alignItems: "center", gap: 8
                  }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Use Template
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{
                padding: "14px 18px 16px",
                borderTop: "1px solid #f0f1f5"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", letterSpacing: "0.01em" }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                      {t.description}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, flexShrink: 0,
                    background: activeFilter !== "All Templates"
                      ? `${CATEGORY_INFO[t.tag]?.color}12`
                      : "#f3f4f6",
                    color: activeFilter !== "All Templates"
                      ? CATEGORY_INFO[t.tag]?.color
                      : "#6b7280",
                  }}>
                    {t.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}