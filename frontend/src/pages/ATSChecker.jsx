import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── ADVANCED SCORING ENGINE ──
function analyzeResume(resumeText, jobDescription = "") {
  const t = resumeText.toLowerCase();
  const jd = jobDescription.toLowerCase();
  const hasJD = jd.trim().length > 50;
  let score = 0;
  const issues = [];
  const suggestions = [];
  const breakdown = [];

  // ── 1. CONTACT INFO (10 pts) ──
  let contactScore = 0;
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(resumeText);
  const hasLocation = /(city|state|india|usa|uk|mumbai|delhi|bangalore|ahmedabad|pune|hyderabad|chennai|kolkata|london|new york|remote|\b[A-Z][a-z]+,\s*[A-Z]{2,}\b)/i.test(resumeText);
  const hasLinkedIn = /linkedin\.com|linkedin/i.test(resumeText);
  const hasGithub = /github\.com|github/i.test(resumeText);
  if (hasEmail) contactScore += 4; else issues.push({ type: "critical", text: "Email address is missing — ATS requires this to contact you" });
  if (hasPhone) contactScore += 3; else issues.push({ type: "critical", text: "Phone number is missing" });
  if (hasLocation) contactScore += 2; else issues.push({ type: "warning", text: "Location/city not found — many ATS filter by location" });
  if (hasLinkedIn || hasGithub) contactScore += 1; else issues.push({ type: "warning", text: "No LinkedIn or GitHub profile URL found" });
  score += contactScore;
  breakdown.push({ label: "Contact Info", score: contactScore, max: 10, icon: "📇" });

  // ── 2. PROFESSIONAL SUMMARY (10 pts) ──
  let summaryScore = 0;
  const summaryMatch = resumeText.match(/(?:summary|profile|objective|about me|career objective|professional summary)[:\s\n]+([\s\S]{20,}?)(?:\n{2,}|\n(?:experience|education|skills|work|employment|projects))/i);
  const summaryText = summaryMatch ? summaryMatch[1] : "";
  const summaryWords = summaryText.trim().split(/\s+/).filter(w => w.length > 1).length;
  const totalWords = resumeText.trim().split(/\s+/).filter(w => w.length > 2).length;

  if (summaryWords >= 50) { summaryScore = 10; }
  else if (summaryWords >= 25) { summaryScore = 7; issues.push({ type: "warning", text: `Summary is ${summaryWords} words — expand to 50-150 words for best ATS results` }); }
  else if (summaryWords >= 1) { summaryScore = 4; issues.push({ type: "warning", text: "Summary is too short — write 50-150 words highlighting key achievements" }); }
  else if (totalWords >= 300) {
    // Large doc with no labeled summary — partial credit
    summaryScore = 3;
    issues.push({ type: "warning", text: "No labeled 'Summary' or 'Profile' section found — add one for better ATS parsing" });
  } else {
    issues.push({ type: "critical", text: "Professional summary is missing — this is the first thing ATS and recruiters read" });
  }
  score += summaryScore;
  breakdown.push({ label: "Summary", score: summaryScore, max: 10, icon: "📝" });

  // ── 3. WORK EXPERIENCE (25 pts) ──
  let expScore = 0;
  const datePattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|(?:20\d{2})\s*[-–—]\s*(?:20\d{2}|present|current|now)/gi;
  const dateMatches = resumeText.match(datePattern) || [];
  const estimatedJobs = Math.min(Math.ceil(dateMatches.length / 2), 6);

  if (estimatedJobs >= 3) expScore += 15;
  else if (estimatedJobs >= 2) expScore += 13;
  else if (estimatedJobs >= 1) { expScore += 8; issues.push({ type: "warning", text: "Only 1 work experience detected — add more positions if applicable" }); }
  else { issues.push({ type: "critical", text: "Work experience section missing or dates not detected" }); }

  const actionVerbs = ["led","managed","achieved","developed","created","launched","improved","built","designed","implemented","increased","reduced","delivered","collaborated","coordinated","utilized","analyzed","maintained","deployed","integrated","spearheaded","negotiated","optimized","automated","mentored","trained","generated","saved","drove","established","executed"];
  const foundVerbs = actionVerbs.filter(v => t.includes(v));
  if (foundVerbs.length >= 4) expScore += 5;
  else if (foundVerbs.length >= 2) { expScore += 3; issues.push({ type: "warning", text: `Only ${foundVerbs.length} action verbs found — use more: Led, Developed, Achieved, Optimized` }); }
  else { issues.push({ type: "warning", text: "Missing action verbs — start bullet points with: Led, Built, Achieved, Implemented" }); }

  const quantPattern = /\d+\s*(%|percent|users|customers|million|billion|thousand|\bk\b|projects|members|years|months|days|hours|revenue|sales|leads|accounts|teams|people|employees|clients|sites|servers|requests|transactions)/i;
  if (quantPattern.test(resumeText)) expScore += 5;
  else { issues.push({ type: "warning", text: "No quantifiable results found — add metrics like 'Increased sales by 35%' or 'Managed 12-person team'" }); suggestions.push({ text: "Quantify achievements: '↑ Revenue by 40%', 'Reduced costs by $50K', 'Led team of 8'" }); }

  score += expScore;
  breakdown.push({ label: "Work Experience", score: expScore, max: 25, icon: "💼" });

  // ── 4. EDUCATION (15 pts) ──
  let eduScore = 0;
  const hasEduKeyword = /(?:bachelor|master|b\.?tech|m\.?tech|b\.?e|m\.?e|bsc|msc|phd|doctorate|12th|diploma|degree|university|college|institute|cgpa|gpa|grade)/i.test(resumeText);
  const hasEduYear = /(?:20\d{2}|19\d{2})\s*[-–]?\s*(?:20\d{2}|19\d{2}|present)?/.test(resumeText);
  const hasGPA = /(?:cgpa|gpa|grade|score|percentage|%)\s*:?\s*[\d.]+/i.test(resumeText);
  if (hasEduKeyword && hasEduYear) { eduScore = hasGPA ? 15 : 12; }
  else if (hasEduKeyword) { eduScore = 8; issues.push({ type: "warning", text: "Education found but graduation year is missing — add start/end years" }); }
  else { issues.push({ type: "critical", text: "Education section is missing or not recognized" }); }
  score += eduScore;
  breakdown.push({ label: "Education", score: eduScore, max: 15, icon: "🎓" });

  // ── 5. SKILLS (20 pts) ──
  let skillScore = 0;
  const techSkills = ["python","java","javascript","typescript","react","angular","vue","node","express","django","flask","spring","sql","mysql","postgresql","mongodb","redis","aws","azure","gcp","docker","kubernetes","git","linux","html","css","sass","rest","graphql","tensorflow","pytorch","sklearn","pandas","numpy","tableau","power bi","excel","word","powerpoint","figma","photoshop","autocad","matlab","r","scala","kotlin","swift","c++","c#","php","ruby","rust","go","terraform","jenkins","ci/cd","agile","scrum","jira"];
  const softSkills = ["communication","leadership","teamwork","problem solving","analytical","critical thinking","time management","project management","collaboration","presentation","negotiation","adaptability","creativity","attention to detail"];
  const foundTech = techSkills.filter(s => t.includes(s));
  const foundSoft = softSkills.filter(s => t.includes(s));
  const totalSkills = foundTech.length + foundSoft.length;

  if (totalSkills >= 10) skillScore = 20;
  else if (totalSkills >= 7) { skillScore = 17; issues.push({ type: "warning", text: `${totalSkills} skills detected — aim for 10+ for better ATS ranking` }); }
  else if (totalSkills >= 4) { skillScore = 12; issues.push({ type: "warning", text: `Only ${totalSkills} skills detected — add more technical and soft skills` }); }
  else if (totalSkills >= 1) { skillScore = 6; issues.push({ type: "critical", text: "Very few skills listed — ATS heavily filters on skills" }); }
  else { issues.push({ type: "critical", text: "Skills section missing — this is critical for ATS filtering" }); }

  if (foundTech.length < 3) suggestions.push({ text: "Add technical skills: programming languages, tools, frameworks, databases" });
  if (foundSoft.length < 2) suggestions.push({ text: "Add soft skills: Leadership, Communication, Problem Solving, Team Collaboration" });

  score += skillScore;
  breakdown.push({ label: "Skills", score: skillScore, max: 20, icon: "⚡" });

  // ── 6. JOB DESCRIPTION MATCH (20 pts if JD provided, else 10 pts keywords) ──
  if (hasJD) {
    let jdScore = 0;

    // Extract meaningful keywords from JD (nouns, tech terms, skills)
    const stopWords = new Set(["the","and","or","for","with","this","that","are","was","were","have","has","will","can","you","our","your","their","from","into","about","which","when","also","such","other","more","some","any","all","not","but","its","be","to","of","a","an","in","on","at","by","as","is","it","if","we","he","she","they","up","do","did","may","must","been","being","had","having","would","could","should","shall","than","then","there","here","where","what","who","how","why","so","yet","nor","both","either","neither","each","every","most","many","much"]);

    const jdWords = jd.replace(/[^a-z0-9\s+#.]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    // Get unique meaningful JD keywords
    const jdKeywords = [...new Set(jdWords)].slice(0, 80);

    // Check how many JD keywords appear in resume
    const matchedKeywords = jdKeywords.filter(kw => t.includes(kw));
    const matchPct = jdKeywords.length > 0 ? matchedKeywords.length / jdKeywords.length : 0;

    if (matchPct >= 0.5) jdScore = 20;
    else if (matchPct >= 0.35) { jdScore = 15; }
    else if (matchPct >= 0.2) { jdScore = 10; }
    else if (matchPct >= 0.1) { jdScore = 5; }

    // Find missing important JD keywords
    const missingKeywords = jdKeywords
      .filter(kw => !t.includes(kw) && kw.length > 4)
      .slice(0, 8);

    if (missingKeywords.length > 0) {
      issues.push({ type: missingKeywords.length > 4 ? "critical" : "warning", text: `Missing job keywords: ${missingKeywords.slice(0, 6).join(", ")}` });
      suggestions.push({ text: `Add these JD keywords naturally: ${missingKeywords.slice(0, 5).join(", ")}` });
    }

    const matchPercent = Math.round(matchPct * 100);
    score += jdScore;
    breakdown.push({ label: "JD Match", score: jdScore, max: 20, icon: "🎯", note: `${matchPercent}% keyword match` });

    // Adjust max score display
    

  } else {
    // No JD — use generic keyword check (10 pts)
    let keywordScore = 0;
    const keywordGroups = [
      { terms: ["project","projects","delivered"], label: "projects" },
      { terms: ["team","teamwork","collaborative","cross-functional"], label: "teamwork" },
      { terms: ["management","manage","managed"], label: "management" },
      { terms: ["develop","development","developer"], label: "development" },
      { terms: ["analys","analysis","analytical","analytics"], label: "analysis" },
    ];
    const foundKw = keywordGroups.filter(g => g.terms.some(term => t.includes(term)));
    keywordScore = Math.min(foundKw.length * 2, 10);
    if (keywordScore < 6) {
      const missing = keywordGroups.filter(g => !g.terms.some(t2 => t.includes(t2))).map(g => g.label);
      issues.push({ type: "warning", text: `Missing common ATS keywords: ${missing.join(", ")}` });
      suggestions.push({ text: "💡 Add a Job Description above for a much more accurate score!" });
    }
    score += keywordScore;
    breakdown.push({ label: "Keywords", score: keywordScore, max: 10, icon: "🔑" });
  }

  // ── 7. FORMATTING (10 pts) ──
  let formatScore = 0;
  const hasSections = (resumeText.match(/\b(?:EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROFILE|PROJECTS|CERTIF|OBJECTIVE|EMPLOYMENT|WORK HISTORY|AWARDS|PUBLICATIONS|VOLUNTEER)\b/gi) || []).length;
  const hasProperLength = totalWords >= 200 && totalWords <= 900;
  const hasBullets = /[•\-\*]/.test(resumeText) || resumeText.includes("•");
  const notTooLong = totalWords <= 900;

  if (hasSections >= 4) formatScore += 4; else if (hasSections >= 2) formatScore += 2;
  if (hasProperLength) formatScore += 3; else if (notTooLong) { formatScore += 1; issues.push({ type: "warning", text: totalWords < 200 ? "Resume seems too short — add more detail" : "Resume may be too long — keep it under 1 page for <5 years experience" }); }
  if (hasBullets) formatScore += 2; else issues.push({ type: "warning", text: "No bullet points detected — use bullets for experience descriptions" });
  formatScore += 1; // bonus for using a proper resume tool

  score += formatScore;
  breakdown.push({ label: "Formatting", score: formatScore, max: 10, icon: "📄" });

  // ── CALCULATE FINAL SCORE ──
  // Adjust max based on whether JD was provided
  const maxScore = hasJD ? 110 : 100; // JD adds 20pts but removes 10pt keywords = +10
  const normalizedScore = Math.min(Math.round((score / maxScore) * 100), 100);

  // ── GRADE ──
  let grade, gradeColor, gradeMsg;
  if (normalizedScore >= 90) { grade = "A+"; gradeColor = "#059669"; gradeMsg = "Excellent — ATS Optimized! 🎉"; }
  else if (normalizedScore >= 80) { grade = "A"; gradeColor = "#10b981"; gradeMsg = "Great — Minor improvements possible"; }
  else if (normalizedScore >= 70) { grade = "B"; gradeColor = "#3b82f6"; gradeMsg = "Good — Some optimization needed"; }
  else if (normalizedScore >= 60) { grade = "C"; gradeColor = "#f59e0b"; gradeMsg = "Fair — Significant improvements required"; }
  else if (normalizedScore >= 50) { grade = "D"; gradeColor = "#f97316"; gradeMsg = "Needs Work — Major gaps found"; }
  else { grade = "F"; gradeColor = "#ef4444"; gradeMsg = "Poor — Comprehensive revision needed"; }

  // General suggestions
  if (!hasLinkedIn) suggestions.push({ text: "Add LinkedIn profile URL — recruiters verify candidates this way" });
  if (!hasGithub && (foundTech.length > 2)) suggestions.push({ text: "Add GitHub profile — important for tech roles" });
  suggestions.push({ text: "Tailor your resume for each job by mirroring the job description language" });

  return {
    score: normalizedScore,
    rawScore: score,
    grade, gradeColor, gradeMsg,
    issues, suggestions, breakdown,
    hasJD,
    skillsFound: foundTech,
  };
}

function getScoreColor(pct) {
  if (pct >= 80) return "#059669";
  if (pct >= 70) return "#3b82f6";
  if (pct >= 60) return "#f59e0b";
  return "#ef4444";
}

async function extractTextFromPDF(arrayBuffer) {
  if (!window.pdfjsLib) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let text = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent({ normalizeWhitespace: true });
    const items = content.items.filter(item => item.str && item.str.trim());
    if (items.length > 0) {
      const sorted = [...items].sort((a, b) => {
        const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
        return Math.abs(yDiff) > 3 ? yDiff : a.transform[4] - b.transform[4];
      });
      text += sorted.map(item => item.str.trim()).join(" ") + " ";
    }
    // Also grab annotation text (links etc.)
    const annotations = await page.getAnnotations();
    annotations.forEach(ann => {
      if (ann.contents) text += ann.contents + " ";
      if (ann.alternativeText) text += ann.alternativeText + " ";
    });
  }
  return text.replace(/\s+/g, " ").trim();
}

export default function ATSChecker() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inputMode, setInputMode] = useState("pdf");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [showJDTip, setShowJDTip] = useState(true);

  const resumeTextRef = useRef("");
  const fileRef = useRef();

  const processText = (text, label) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length < 50) {
      alert("Not enough text to analyze. Please ensure your resume has content.");
      return;
    }
    resumeTextRef.current = clean;
    setFileName(label);
    setResult(analyzeResume(clean, jobDescription));
    setAiSuggestions(null);
  };

  const processPDF = async (file) => {
    setLoading(true);
    setResult(null);
    setAiSuggestions(null);
    resumeTextRef.current = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = await extractTextFromPDF(arrayBuffer);
      console.log("📄 PDF text length:", text.length);
      if (text.length < 50) {
        setLoading(false);
        setInputMode("paste");
        alert("⚠️ Could not extract text from this PDF (image-based PDF).\n\nPlease use:\n• 'Paste Text' tab — copy text from your PDF\n• 'My Resumes' tab — analyze directly from builder");
        return;
      }
      processText(text, file.name);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Could not read the PDF. Please try 'Paste Text' or 'My Resumes' tab.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") processPDF(file);
    else alert("Please upload a PDF file.");
  }, [jobDescription]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processPDF(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) { alert("Please paste your resume text."); return; }
    processText(pasteText, "Pasted Resume");
  };

  const loadMyResumes = async () => {
    setResumesLoading(true);
    try {
      const res = await api.get("/resume/");
      setResumes(Array.isArray(res.data) ? res.data : []);
    } catch { alert("Failed to load resumes."); }
    finally { setResumesLoading(false); }
  };

  const handleCheckMyResume = async () => {
    if (!selectedResumeId) { alert("Please select a resume."); return; }
    setLoading(true);
    setResult(null);
    setAiSuggestions(null);
    try {
      const [rRes, expRes, eduRes, skillRes, projRes, certRes] = await Promise.all([
        api.get(`/resume/${selectedResumeId}`),
        api.get(`/experience/${selectedResumeId}`),
        api.get(`/education/${selectedResumeId}`),
        api.get(`/skills/${selectedResumeId}`),
        api.get(`/projects/${selectedResumeId}`),
        api.get(`/certifications/${selectedResumeId}`),
      ]);
      const r = rRes.data?.resume || rRes.data;
      const exps = expRes.data || [];
      const edus = eduRes.data || [];
      const skills = skillRes.data || [];
      const projs = projRes.data || [];
      const certs = certRes.data || [];

      let text = [
        r.full_name, r.professional_title, r.email, r.phone, r.location, r.linkedin,
        "SUMMARY", r.summary,
        "EXPERIENCE", ...exps.map(e => `${e.role} ${e.company} ${e.start_date} ${e.end_date || "Present"} ${e.description || ""}`),
        "EDUCATION", ...edus.map(e => `${e.degree} ${e.institution} ${e.start_year} ${e.end_year} ${e.score || ""}`),
        "SKILLS", ...skills.map(s => `${s.name || s.skill_name} ${s.level || ""}`),
        "PROJECTS", ...projs.map(p => `${p.title || p.project_title} ${p.description || ""} ${p.tech_stack || ""}`),
        "CERTIFICATIONS", ...certs.map(c => `${c.name || c.title} ${c.issuer || c.organization} ${c.issue_date || c.issue_year || ""}`),
      ].filter(Boolean).join(" ");

      const resume = resumes.find(r2 => r2.id === parseInt(selectedResumeId));
      processText(text, resume?.title || "My Resume");
    } catch (err) {
      console.error(err);
      alert("Failed to load resume data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAISuggestions = async () => {
    const text = resumeTextRef.current;
    if (!text || text.length < 50) { alert("No resume text found."); return; }
    setAiLoading(true);
    try {
      const response = await api.post("/ai/analyze-resume", {
        resume_text: text.slice(0, 2500),
        job_description: jobDescription.slice(0, 1000),
      });
      const data = response.data;
      if (data?.improvements) setAiSuggestions(data);
      else setAiSuggestions({ improvements: [{ title: "Analysis Complete", detail: data?.message || "Try again.", impact: "medium" }], summary: "" });
    } catch (err) {
      console.error("AI error:", err);
      alert("AI analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const impactColor = { high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" };
  const impactBg = { high: "#fef2f2", medium: "#fffbeb", low: "#eff6ff" };

  const tabStyle = (active) => ({
    flex: 1, padding: "10px 6px", border: "none", borderRadius: 10,
    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    background: active ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
    color: active ? "#fff" : "#64748b", transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .ats-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; animation: fadeUp 0.4s ease; }
        .drop-zone { border: 2px dashed #c7d2fe; border-radius: 14px; background: #f8faff; text-align: center; padding: 28px 20px; cursor: pointer; transition: all 0.2s ease; }
        .drop-zone:hover, .drop-zone.drag { border-color: #6366f1; background: #eef2ff; }
        .issue-chip { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: 10px; margin-bottom: 8px; font-size: 13px; line-height: 1.4; }
        .suggestion-chip { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: 10px; margin-bottom: 8px; font-size: 13px; line-height: 1.4; background: #f0fdf4; border: 1px solid #bbf7d0; }
        .score-bar { height: 8px; border-radius: 4px; background: #e2e8f0; overflow: hidden; }
        .score-bar-fill { height: 100%; border-radius: 4px; transition: width 1.2s ease; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; border-radius: 10px; padding: 12px 20px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; font-family: inherit; transition: all 0.2s; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .jd-textarea { width: 100%; min-height: 120px; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; font-size: 13px; font-family: inherit; resize: vertical; outline: none; background: #f8fafc; line-height: 1.6; transition: all 0.2s; }
        .jd-textarea:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .paste-area { width: 100%; min-height: 160px; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; font-size: 13px; font-family: inherit; resize: vertical; outline: none; background: #f8fafc; line-height: 1.6; transition: all 0.2s; }
        .paste-area:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .resume-select { width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-family: inherit; background: #f8fafc; outline: none; cursor: pointer; }
        .resume-select:focus { border-color: #6366f1; }
        .jd-badge { display: inline-flex; align-items: center; gap: 4px; background: linear-gradient(135deg, #059669, #10b981); color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        @media (max-width: 768px) {
          .ats-body { padding: 12px !important; }
          .ats-card { padding: 14px !important; border-radius: 12px !important; }
          .breakdown-grid { grid-template-columns: 1fr 1fr !important; }
          .score-circle-wrap { flex-direction: column !important; align-items: center !important; text-align: center; }
          .score-circle-wrap > div:last-child { text-align: center !important; }
        }
        @media (max-width: 480px) {
          .breakdown-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>ATS <span style={{ color: "#6366f1" }}>Score Checker</span></span>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", background: "#f1f5f9", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>Free · Unlimited</div>
      </div>

      <div className="ats-body" style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* ── JOB DESCRIPTION BOX (always visible before results) ── */}
        {!result && (
          <div className="ats-card" style={{ border: "1.5px solid #c7d2fe", background: "linear-gradient(135deg, #fafbff, #f5f3ff)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🎯</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                    Job Description <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}>(Highly Recommended)</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: "#6366f1", fontWeight: 600 }}>Adds 20 bonus points — makes score 3x more accurate</p>
                </div>
              </div>
              {jobDescription.trim().length > 50 && (
                <span className="jd-badge">✓ JD Added</span>
              )}
            </div>
            <textarea
              className="jd-textarea"
              placeholder="Paste the job description here...&#10;&#10;Example:&#10;We are looking for a Data Analyst with 2+ years experience in Python, SQL, Tableau. Must have strong analytical skills and experience with data visualization..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              style={{ minHeight: 100 }}
            />
            {jobDescription.trim().length > 0 && jobDescription.trim().length < 50 && (
              <p style={{ fontSize: 11, color: "#f59e0b", margin: "6px 0 0", fontWeight: 600 }}>⚠️ Add more text for better matching (min 50 characters)</p>
            )}
            {jobDescription.trim().length >= 50 && (
              <p style={{ fontSize: 11, color: "#059669", margin: "6px 0 0", fontWeight: 600 }}>✅ Job description added — your score will include a 20-point JD match section</p>
            )}
          </div>
        )}

        {/* ── INPUT TABS ── */}
        {!result && (
          <div className="ats-card">
            <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 18 }}>
              <button style={tabStyle(inputMode === "pdf")} onClick={() => setInputMode("pdf")}>📄 Upload PDF</button>
              <button style={tabStyle(inputMode === "paste")} onClick={() => setInputMode("paste")}>📋 Paste Text</button>
              <button style={tabStyle(inputMode === "resume")} onClick={() => { setInputMode("resume"); loadMyResumes(); }}>🗂️ My Resumes</button>
            </div>

            {/* PDF Tab */}
            {inputMode === "pdf" && (
              <div>
                <div className={`drop-zone ${dragging ? "drag" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current.click()}>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={onFileChange} />
                  {loading ? (
                    <div>
                      <div style={{ width: 36, height: 36, border: "4px solid #e0e7ff", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                      <p style={{ color: "#6366f1", fontWeight: 600, margin: 0 }}>Analyzing your resume...</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Drag & Drop Resume PDF</p>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px" }}>or click to browse</p>
                      <button className="btn-primary" style={{ width: "auto", padding: "9px 22px" }} onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>
                        📂 Choose File
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#92400e" }}>
                  💡 If PDF fails (browser-print PDFs), use <strong>Paste Text</strong> or <strong>My Resumes</strong> tab
                </div>
              </div>
            )}

            {/* Paste Tab */}
            {inputMode === "paste" && (
              <div>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 10px" }}>Open PDF → <strong>Ctrl+A</strong> → <strong>Ctrl+C</strong> → paste below:</p>
                <textarea className="paste-area" placeholder="Paste your resume text here..." value={pasteText} onChange={e => setPasteText(e.target.value)} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{pasteText.split(/\s+/).filter(Boolean).length} words</span>
                  {pasteText && <button onClick={() => setPasteText("")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>Clear</button>}
                </div>
                <button className="btn-primary" onClick={handlePasteSubmit} disabled={pasteText.trim().length < 50}>📊 Analyze Resume</button>
              </div>
            )}

            {/* My Resumes Tab */}
            {inputMode === "resume" && (
              <div>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 10px" }}>Analyze directly from your saved resumes — most accurate method:</p>
                {resumesLoading ? (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <div style={{ width: 28, height: 28, border: "3px solid #e0e7ff", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                  </div>
                ) : resumes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 14 }}>
                    No resumes found. <button onClick={() => navigate("/dashboard")} style={{ color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Create one →</button>
                  </div>
                ) : (
                  <div>
                    <select className="resume-select" value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}>
                      <option value="">— Select a resume —</option>
                      {resumes.map(r => <option key={r.id} value={r.id}>{r.title || "Untitled Resume"}</option>)}
                    </select>
                    <button className="btn-primary" style={{ marginTop: 12 }} onClick={handleCheckMyResume} disabled={!selectedResumeId || loading}>
                      {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Analyzing...</span> : "📊 Analyze This Resume"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div>
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>📄 <strong>{fileName}</strong></span>
                {result.hasJD && <span className="jd-badge">🎯 JD Matched</span>}
              </div>
              <button style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b", fontFamily: "inherit" }}
                onClick={() => { setResult(null); setAiSuggestions(null); setFileName(""); resumeTextRef.current = ""; setPasteText(""); setSelectedResumeId(""); }}>
                ↩ Check Another
              </button>
            </div>

            {/* Score card */}
            <div className="ats-card">
              <div className="score-circle-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
                <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                  <svg width="130" height="130" viewBox="0 0 130 130">
                    <circle cx="65" cy="65" r="55" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle cx="65" cy="65" r="55" fill="none" stroke={result.gradeColor} strokeWidth="10"
                      strokeDasharray="346" strokeDashoffset={346 - (346 * result.score / 100)}
                      strokeLinecap="round" transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: result.gradeColor, lineHeight: 1 }}>{result.score}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>/ 100</span>
                  </div>
                </div>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: result.gradeColor + "18", borderRadius: 20, padding: "6px 16px", marginBottom: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: result.gradeColor }}>{result.grade}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: result.gradeColor }}>{result.grade === "A+" ? "Excellent" : result.grade === "A" ? "Great" : result.grade === "B" ? "Good" : result.grade === "C" ? "Fair" : result.grade === "D" ? "Needs Work" : "Poor"}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#334155", margin: "0 0 10px", fontWeight: 500 }}>{result.gradeMsg}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>🔴 {result.issues.filter(i => i.type === "critical").length} Critical</span>
                    <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>🟡 {result.issues.filter(i => i.type === "warning").length} Warnings</span>
                    {!result.hasJD && <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, cursor: "pointer" }} onClick={() => setResult(null)}>➕ Add JD for better score</span>}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "14px 0 0", textAlign: "center", fontStyle: "italic" }}>
                {result.hasJD ? "Score includes job description keyword matching" : "⚡ Add a job description above for a more accurate score with keyword matching"}
              </p>
            </div>

            {/* Breakdown */}
            <div className="ats-card">
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 14px" }}>📊 Score Breakdown</h3>
              <div className="breakdown-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {result.breakdown.map((item, i) => (
                  <div key={i} style={{ background: item.label === "JD Match" ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "#f8fafc", borderRadius: 10, padding: "12px", border: item.label === "JD Match" ? "1px solid #86efac" : "none" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2, fontWeight: 600 }}>{item.label}</div>
                    {item.note && <div style={{ fontSize: 10, color: "#059669", fontWeight: 700, marginBottom: 2 }}>{item.note}</div>}
                    <div style={{ fontSize: 16, fontWeight: 800, color: getScoreColor(item.score / item.max * 100), marginBottom: 6 }}>
                      {item.score}<span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>/{item.max}</span>
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill" style={{ width: `${Math.min(item.score / item.max * 100, 100)}%`, background: getScoreColor(item.score / item.max * 100) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="ats-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 14px" }}>🚨 Issues Found</h3>
                {result.issues.map((issue, i) => (
                  <div key={i} className="issue-chip" style={{ background: issue.type === "critical" ? "#fef2f2" : "#fffbeb", border: `1px solid ${issue.type === "critical" ? "#fecaca" : "#fde68a"}` }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{issue.type === "critical" ? "🔴" : "🟡"}</span>
                    <span style={{ color: issue.type === "critical" ? "#dc2626" : "#92400e", fontSize: 13 }}>{issue.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="ats-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 14px" }}>💡 Improvement Tips</h3>
                {result.suggestions.map((s, i) => (
                  <div key={i} className="suggestion-chip">
                    <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                    <span style={{ color: "#166534", fontSize: 13 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Skills found */}
            {result.skillsFound?.length > 0 && (
              <div className="ats-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>✅ Skills Detected</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.skillsFound.map((skill, i) => (
                    <span key={i} style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            <div className="ats-card" style={{ background: "linear-gradient(135deg, #eef2ff, #f5f3ff)", border: "1px solid #c7d2fe" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>✨</span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>AI Deep Analysis</h3>
                  <p style={{ fontSize: 12, color: "#6366f1", margin: 0, fontWeight: 600 }}>Personalized suggestions powered by AI</p>
                </div>
              </div>
              {!aiSuggestions ? (
                <button className="btn-primary" onClick={getAISuggestions} disabled={aiLoading}>
                  {aiLoading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Analyzing with AI...</span> : "✨ Get AI Suggestions"}
                </button>
              ) : (
                <div>
                  {aiSuggestions.summary && <p style={{ fontSize: 13, color: "#334155", background: "#fff", borderRadius: 10, padding: 12, marginBottom: 12, lineHeight: 1.6 }}>{aiSuggestions.summary}</p>}
                  {aiSuggestions.improvements?.map((imp, i) => (
                    <div key={i} style={{ background: impactBg[imp.impact] || "#f8fafc", border: `1px solid ${imp.impact === "high" ? "#fecaca" : imp.impact === "medium" ? "#fde68a" : "#bfdbfe"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{imp.title}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: impactColor[imp.impact] || "#64748b", borderRadius: 20, padding: "2px 8px", background: impactBg[imp.impact] || "#f8fafc", border: `1px solid ${(impactColor[imp.impact] || "#64748b")}30` }}>{(imp.impact || "").toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#475569", margin: 0, lineHeight: 1.5 }}>{imp.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="ats-card">
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>🚀 Fix Issues in Our Builder</h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>Our ATS-optimized templates auto-score 10/10 on formatting. Fix all issues directly in the builder.</p>
              <button className="btn-primary" onClick={() => navigate("/dashboard")}>Build / Edit Resume →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}