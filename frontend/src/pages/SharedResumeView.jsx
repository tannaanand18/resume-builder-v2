import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../services/api";
import ResumePreviewPublic from "../components/ResumePreviewPublic";

export default function SharedResumeView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const publicUrl = window.location.href;

  useEffect(() => {
    if (!token) { setError("Missing share token."); setLoading(false); return; }
    axios.get(`${API_URL}/api/share/${id}/public?token=${token}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.error || "Invalid or expired link.");
        setLoading(false);
      });
  }, [id, token]);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const handleShare = (platform) => {
    const name = data?.resume?.full_name || "My Resume";
    const text = `${name} has shared their professional resume with you`;
    const encodedUrl = encodeURIComponent(publicUrl);
    const encodedText = encodeURIComponent(text);
    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
    window.open(urls[platform], "_blank");
    setShowShareMenu(false);
  };

  const handleDownloadPDF = () => {
    setShowShareMenu(false);
    window.print();
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "4px solid #e0e7ff", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#64748b", fontSize: 14, fontFamily: "Inter, sans-serif" }}>Loading resume...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Link Unavailable</h2>
      <p style={{ color: "#64748b", marginBottom: 24 }}>{error}</p>
      <button onClick={() => navigate("/")} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Go Home</button>
    </div>
  );

  if (!data) return null;

  const { resume, experiences, educations, skills, projects, certs } = data;
  const activeTemplate = resume.template_style || resume.template_name || "simplyblue_modern";

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .share-opt:hover { background: #f1f5f9 !important; }
        @media (max-width: 600px) { .btn-label { display: none; } }
        @media print {
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          html, body { height: auto !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>

      {/* ── Top Bar ── */}
      <div className="no-print" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 8h10M7 12h6M7 16h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Resume<span style={{ color: "#6366f1" }}>AI</span></span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Share dropdown */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowShareMenu(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="btn-label">Share</span>
            </button>

            {showShareMenu && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 220, zIndex: 200, overflow: "hidden", animation: "fadeIn 0.15s ease" }}>
                <div style={{ padding: "10px 14px 6px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Share Resume</div>

                <div className="share-opt" onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: copyDone ? "#dcfce7" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {copyDone ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#475569" strokeWidth="2" strokeLinecap="round"/></svg>}
                  </div>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{copyDone ? "Copied!" : "Copy Link"}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Share the public URL</div></div>
                </div>

                <div style={{ height: 1, background: "#f1f5f9", margin: "0 14px" }} />

                <div className="share-opt" onClick={() => handleShare("whatsapp")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2C6.495 2 2.05 6.445 2.05 12c0 1.822.49 3.524 1.338 4.99L2 22l5.15-1.348A9.902 9.902 0 0012.05 22c5.555 0 10-4.445 10-10S17.605 2 12.05 2z"/></svg>
                  </div>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>WhatsApp</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Send via WhatsApp</div></div>
                </div>

                <div className="share-opt" onClick={() => handleShare("linkedin")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d4ed8"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                  </div>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>LinkedIn</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Post on LinkedIn</div></div>
                </div>

                <div style={{ height: 1, background: "#f1f5f9", margin: "0 14px" }} />

                <div className="share-opt" onClick={handleDownloadPDF} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px 12px", cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Save as PDF</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Print resume to PDF</div></div>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleDownloadPDF} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="btn-label">Save PDF</span>
          </button>

          <button onClick={() => navigate("/")} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <span className="btn-label">Create Your Own →</span>
          </button>
        </div>
      </div>

      {showShareMenu && <div onClick={() => setShowShareMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />}

      {/* ── Resume rendered with actual template ── */}
      <div style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px 64px" }}>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <ResumePreviewPublic
            resume={resume}
            experiences={experiences}
            educations={educations}
            skills={skills}
            projects={projects}
            certs={certs}
            templateStyle={activeTemplate}
          />
        </div>
        <div className="no-print" style={{ textAlign: "center", marginTop: 24, color: "#94a3b8", fontSize: 13 }}>
          Made with <span style={{ color: "#6366f1", fontWeight: 600 }}>ResumeAI</span> ·{" "}
          <span onClick={() => navigate("/")} style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>Create your own →</span>
        </div>
      </div>
    </div>
  );
}