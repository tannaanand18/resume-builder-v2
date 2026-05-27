import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resumeService } from "../services/resumeService";
import api from "../services/api";
import toast from "react-hot-toast";
import emailjs from "@emailjs/browser";

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── Undo Delete ──
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteProgress, setDeleteProgress] = useState(100);
  const deleteIntervalRef = useRef(null);

  // ── Duplicate Animation ──
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState(null);

  // ── Share Modal ──
  const [shareModal, setShareModal] = useState(null); // { id, title }
  const [shareLoadingId, setShareLoadingId] = useState(null); // "resumeId-action"

  // ── Email Modal ──
  const [emailModal, setEmailModal] = useState(null); // resumeId
  const [emailForm, setEmailForm] = useState({ recipientEmail: "", recipientName: "", customMessage: "" });
  const [emailSending, setEmailSending] = useState(false);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%)" }}>
        <div style={{ width: 48, height: 48, border: "4px solid #e0e7ff", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const fetchResumes = async () => {
    try {
      const data = await resumeService.getAll();
      setResumes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading === false && user) {
      setLoading(true);
      fetchResumes();
    }
  }, [authLoading, user]);

  useEffect(() => {
    return () => {
      if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
      if (pendingDelete?.timeoutId) clearTimeout(pendingDelete.timeoutId);
    };
  }, []);

  const createResume = () => navigate("/resume/new");

  // ── DUPLICATE ──
  const duplicateResume = async (e, resume) => {
    e.stopPropagation();
    setDuplicatingId(resume.id);
    try {
      await resumeService.create({
        title: `${resume.title} (Copy)`,
        summary: resume.summary,
        full_name: resume.full_name,
        email: resume.email,
        phone: resume.phone,
        linkedin: resume.linkedin,
      });
      setDuplicatingId(null);
      setDuplicateSuccess(resume.id);
      await fetchResumes();
      setTimeout(() => setDuplicateSuccess(null), 2000);
    } catch (err) {
      setDuplicatingId(null);
      toast.error("Failed to duplicate");
    }
  };

  // ── DELETE with 10s undo ──
  const deleteResume = (e, id, title) => {
    e.stopPropagation();
    if (pendingDelete && pendingDelete.id !== id) {
      clearTimeout(pendingDelete.timeoutId);
      clearInterval(deleteIntervalRef.current);
      resumeService.delete(pendingDelete.id).catch(() => { });
      setResumes(prev => prev.filter(r => r.id !== pendingDelete.id));
    }
    setResumes(prev => prev.filter(r => r.id !== id));
    setDeleteProgress(100);
    let progress = 100;
    deleteIntervalRef.current = setInterval(() => {
      progress -= 1;
      setDeleteProgress(progress);
      if (progress <= 0) clearInterval(deleteIntervalRef.current);
    }, 100);
    const timeoutId = setTimeout(async () => {
      clearInterval(deleteIntervalRef.current);
      try { await resumeService.delete(id); } catch { fetchResumes(); }
      setPendingDelete(null);
      setDeleteProgress(100);
    }, 10000);
    setPendingDelete({ id, title, timeoutId });
  };

  const undoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timeoutId);
    clearInterval(deleteIntervalRef.current);
    setPendingDelete(null);
    setDeleteProgress(100);
    fetchResumes();
  };

  // ── SHARE ACTIONS ──
  const isShareLoading = (resumeId, action) => shareLoadingId === `${resumeId}-${action}`;

  const handleCopyLink = async (e, resumeId) => {
    e.stopPropagation();
    setShareLoadingId(`${resumeId}-copy`);
    try {
      const res = await api.post(`/share/generate-link/${resumeId}`, {});
      if (res.data?.share_link) {
        await navigator.clipboard.writeText(res.data.share_link);
        toast.success("🔗 Link copied to clipboard!");
        setShareModal(null);
      }
    } catch { toast.error("Failed to generate link"); }
    finally { setShareLoadingId(null); }
  };

  const handleWhatsApp = async (e, resumeId) => {
    e.stopPropagation();
    setShareLoadingId(`${resumeId}-whatsapp`);
    try {
      const res = await api.get(`/share/whatsapp-link/${resumeId}`);
      if (res.data?.whatsapp_link) {
        window.open(res.data.whatsapp_link, "_blank");
        toast.success("💬 Opening WhatsApp...");
        setShareModal(null);
      }
    } catch { toast.error("Failed to generate WhatsApp link"); }
    finally { setShareLoadingId(null); }
  };

  const handleLinkedIn = async (e, resumeId) => {
    e.stopPropagation();
    setShareLoadingId(`${resumeId}-linkedin`);
    try {
      const res = await api.get(`/share/linkedin-link/${resumeId}`);
      if (res.data?.linkedin_link) {
        window.open(res.data.linkedin_link, "_blank");
        toast.success("💼 Opening LinkedIn...");
        setShareModal(null);
      }
    } catch { toast.error("Failed to generate LinkedIn link"); }
    finally { setShareLoadingId(null); }
  };

  const openEmailModal = (e, resumeId) => {
    e.stopPropagation();
    setEmailModal(resumeId);
    setShareModal(null);
  };

  const handleEmailSend = async (e) => {
    e.preventDefault();
    if (!emailForm.recipientEmail.trim()) return;
    setEmailSending(true);
    try {
      // Step 1: Get share link from backend
      const res = await api.post("/share/email", {
        resume_id: emailModal,
        recipient_email: emailForm.recipientEmail.trim(),
        recipient_name: emailForm.recipientName.trim() || "Friend",
        message: emailForm.customMessage.trim(),
      });

      const { share_link, sender_name, resume_title } = res.data;

      // Step 2: Send email via EmailJS
      await emailjs.send(
        "service_v6fih3c",
        "template_uio18xg", // ← your share template ID
        {
          to_email: emailForm.recipientEmail.trim(),
          to_name: emailForm.recipientName.trim() || "Friend",
          from_name: sender_name || user?.email?.split("@")[0] || "Someone",
          resume_title: resume_title || "Resume",
          share_link: share_link,
          custom_message: emailForm.customMessage.trim() || "",
        },
        "BubKxvVvR_jCZyxPm"
      );

      toast.success(`✉️ Resume shared with ${emailForm.recipientEmail}!`);
      setEmailModal(null);
      setEmailForm({ recipientEmail: "", recipientName: "", customMessage: "" });
    } catch (err) {
      console.error("Email send error:", err);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  // ✅ SHOW NOTHING WHILE LOADING - Prevents premature rendering
  if (authLoading) return null;
  if (!user) return null;

  // ── Share options config ──
  const getShareOptions = (resumeId) => [
    {
      id: "email", label: "Email", color: "#ef4444", bg: "#fef2f2",
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      onClick: (e) => openEmailModal(e, resumeId),
    },
    {
      id: "whatsapp", label: "WhatsApp", color: "#22c55e", bg: "#f0fdf4",
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: (e) => handleWhatsApp(e, resumeId),
    },
    {
      id: "linkedin", label: "LinkedIn", color: "#0a66c2", bg: "#eff6ff",
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      onClick: (e) => handleLinkedIn(e, resumeId),
    },
    {
      id: "copy", label: "Copy Link", color: "#f59e0b", bg: "#fffbeb",
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      onClick: (e) => handleCopyLink(e, resumeId),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes dash-fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dash-spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes checkDraw { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
        @keyframes cardDuplicate { 0%{transform:scale(1)} 30%{transform:scale(0.97) rotate(-0.5deg)} 60%{transform:scale(1.02) rotate(0.5deg)} 100%{transform:scale(1)} }
        @keyframes shareDropIn { from { opacity: 0; transform: translateY(-8px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes modalBg { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes shareModalIn { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .dash-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); position: relative; }
        .dash-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -12px rgba(99,102,241,0.15); border-color: #a5b4fc !important; }
        .dash-card:hover .dash-icon { background: linear-gradient(135deg,#6366f1,#8b5cf6) !important; }
        .dash-card:hover .dash-icon svg path { stroke: white !important; }
        .dash-card.duplicating { animation: cardDuplicate 0.5s ease; }
        .dash-btn-new { transition: all 0.3s ease; }
        .dash-btn-new:hover { transform: translateY(-1px); box-shadow: 0 8px 24px -6px rgba(99,102,241,0.4); }
        .action-btn { padding: 7px; border-radius: 8px; background: transparent; border: none; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
        .action-btn:hover { transform: scale(1.12); }
        .action-btn.share:hover, .action-btn.share.open { background: #eef2ff; color: #6366f1; }
        .action-btn.dup:hover { background: #f0fdf4; color: #22c55e; }
        .action-btn.del:hover { background: #fef2f2; color: #ef4444; }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .share-opt { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: none; background: transparent; cursor: pointer; border-radius: 8px; transition: all 0.15s ease; font-size: 13px; font-weight: 600; font-family: inherit; text-align: left; }
        .share-opt:hover { transform: translateX(3px); }
        .share-opt:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .em-input { width: 100%; padding: 10px 13px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; font-family: inherit; color: #111827; background: #f9fafb; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; }
        .em-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); background: #fff; }
        textarea.em-input { resize: vertical; }
        .dash-grid { overflow: visible !important; }
        .dash-card { overflow: visible !important; }
        @media (max-width: 768px) {
  /* ── Header: single row, no wrapping ── */
  .dash-header {
    padding: 0 12px !important;
    height: 56px !important;
    flex-direction: row !important;
    gap: 8px !important;
    flex-wrap: nowrap !important;
  }
  .dash-header-left { flex-shrink: 0; }
  .dash-header-right {
    flex-wrap: nowrap !important;
    gap: 6px !important;
    justify-content: flex-end !important;
    overflow: hidden;
  }
  /* Hide username text on mobile, keep avatar only */
  .dash-user-name { display: none !important; }
  /* Make all header buttons compact */
  .dash-header-right > div {
    padding: 5px 8px !important;
  }
  .dash-header-right button {
    padding: 6px 10px !important;
    font-size: 12px !important;
    gap: 4px !important;
  }
  /* Hide ATS Score text in header on mobile, keep emoji */
  .dash-ats-header-text { display: none !important; }

  /* ── Main padding ── */
  .dash-main { padding: 16px 12px !important; }

  /* ── Title row: compact ── */
  .dash-title-row {
    flex-direction: column !important;
    gap: 10px !important;
    align-items: flex-start !important;
    margin-bottom: 20px !important;
  }
  .dash-title-row h1 { font-size: 22px !important; }
  .dash-title-row p { font-size: 13px !important; margin-top: 2px !important; }

  /* ── Action buttons row: side by side full width ── */
  .dash-action-row {
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
  }
  .dash-action-row button {
    flex: 1 !important;
    justify-content: center !important;
    padding: 10px 8px !important;
    font-size: 13px !important;
  }

  /* ── Resume grid: single column ── */
  .dash-grid { grid-template-columns: 1fr !important; }

  /* ── Resume cards: tighter ── */
  .dash-card { padding: 14px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(226,232,240,0.6)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="dash-header" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="dash-header-left" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px -2px rgba(99,102,241,0.4)" }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 8h10M7 12h6M7 16h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Resume<span style={{ color: "#6366f1" }}>AI</span></span>
          </div>
          <div className="dash-header-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "#f1f5f9", borderRadius: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {(user?.email || "U")[0].toUpperCase()}
              </div>
              <span className="dash-user-name" style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{user?.email ? user.email.split("@")[0] : "User"}</span>
            </div>
            {user?.role === "admin" && (
              <button onClick={() => navigate("/admin")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #6366f1)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                🛡️ Admin
              </button>
            )}
            <button onClick={() => navigate("/ats-checker")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              📊 <span className="dash-ats-header-text">ATS Score</span>
            </button>
            <button onClick={handleLogout}
              style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fecaca"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="dash-main" style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <div className="dash-title-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, animation: "dash-fade-in 0.5s ease" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>My Resumes</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Create and manage your AI-powered resumes</p>
          </div>
          <div className="dash-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/ats-checker")} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", color: "#059669", border: "1.5px solid #059669", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f0fdf4"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
              📊 Check ATS Score
            </button>
            <button className="dash-btn-new dash-btn-new-mobile" onClick={createResume} style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
              New Resume
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e0e7ff", borderTopColor: "#6366f1", borderRadius: "50%", animation: "dash-spin 0.7s linear infinite" }} />
          </div>
        ) : resumes.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", animation: "dash-fade-in 0.5s ease" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #eef2ff, #f5f3ff)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM12 8v8M8 12h8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>No resumes yet</h3>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, textAlign: "center", maxWidth: 360 }}>Build your first AI-powered professional resume in minutes!</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="dash-btn-new" onClick={createResume} style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
                Create Your First Resume
              </button>
              <button onClick={() => navigate("/ats-checker")} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", color: "#059669", border: "1.5px solid #059669", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📊 Check ATS Score
              </button>
            </div>
          </div>
        ) : (
          <div className="dash-grid" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
            {resumes.map((resume, i) => (
              <div
                key={resume.id}
                className={`dash-card ${duplicatingId === resume.id ? 'duplicating' : ''}`}
                onClick={() => navigate(`/resume/${resume.id}/edit`)}
                style={{ background: "#fff", borderRadius: 14, border: duplicateSuccess === resume.id ? "1.5px solid #22c55e" : "1px solid #e2e8f0", padding: 20, cursor: "pointer", animation: `dash-fade-in 0.4s ease ${i * 0.05}s both`, transition: "border-color 0.3s ease", overflow: "visible" }}
              >
                <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: 14 }}>
                  {/* Resume icon */}
                  <div className="dash-icon" style={{ width: 44, height: 44, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}>
                    {duplicateSuccess === resume.id ? (
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{ animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                        <circle cx="12" cy="12" r="10" fill="#dcfce7" />
                        <path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 40, strokeDashoffset: 0, animation: "checkDraw 0.4s ease 0.1s both" }} />
                      </svg>
                    ) : (
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M7 8h10M7 12h6M7 16h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" /></svg>
                    )}
                  </div>

                  {/* ── Action buttons ── */}
                  <div style={{ display: "flex", gap: 2 }}>

                    {/* ── SHARE button ── */}
                    <button
                      className={`action-btn share ${shareModal?.id === resume.id ? 'open' : ''}`}
                      title="Share resume"
                      onClick={(e) => { e.stopPropagation(); setShareModal({ id: resume.id, title: resume.title || "Untitled Resume" }); }}
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                        <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
                        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>

                    {/* DUPLICATE */}
                    <button className="action-btn dup" title="Duplicate" disabled={duplicatingId === resume.id} onClick={(e) => duplicateResume(e, resume)}>
                      {duplicatingId === resume.id ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: "dash-spin 0.7s linear infinite" }}>
                          <circle cx="12" cy="12" r="9" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="28 56" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      )}
                    </button>

                    {/* DELETE */}
                    <button className="action-btn del" title="Delete" onClick={(e) => deleteResume(e, resume.id, resume.title || "Untitled Resume")}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {resume.title || "Untitled Resume"}
                  {duplicateSuccess === resume.id && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", marginLeft: 8, background: "#dcfce7", padding: "2px 8px", borderRadius: 20, animation: "popIn 0.3s ease" }}>
                      Duplicated!
                    </span>
                  )}
                </h3>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                  Updated: {new Date(resume.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ══════════════════════════════
          UNDO DELETE TOAST
      ══════════════════════════════ */}
      {pendingDelete && (
        <div style={{ position: "fixed", bottom: 32, left: 32, zIndex: 10000, background: "#1e293b", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08)", animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)", minWidth: 320, maxWidth: 380 }}>
          <div style={{ height: 3, background: "rgba(255,255,255,0.1)" }}>
            <div style={{ height: "100%", width: `${deleteProgress}%`, background: "linear-gradient(90deg, #6366f1, #a855f7)", transition: "width 0.1s linear", borderRadius: 2 }} />
          </div>
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Resume deleted</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{pendingDelete.title}"</p>
            </div>
            <button onClick={undoDelete}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.3)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(99,102,241,0.15)"}>
              ↩ Undo
            </button>
            <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                <circle cx="14" cy="14" r="11" fill="none" stroke="#6366f1" strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - deleteProgress / 100)}`}
                  strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.1s linear" }} />
              </svg>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>
                {Math.ceil(deleteProgress / 10)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          SHARE MODAL
      ══════════════════════════════ */}
      {shareModal && (
        <div
          onClick={() => setShareModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "modalBg 0.2s ease" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", width: "100%", maxWidth: 360, animation: "shareModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}
          >
            {/* Modal header */}
            <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Share Resume</p>
                <h3 style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{shareModal.title}</h3>
              </div>
              <button
                onClick={() => setShareModal(null)}
                style={{ background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* Share options as large tappable rows */}
            <div style={{ padding: "16px 12px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
              {getShareOptions(shareModal.id).map((opt) => (
                <button
                  key={opt.id}
                  disabled={isShareLoading(shareModal.id, opt.id)}
                  onClick={opt.onClick}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 12px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", transition: "all 0.15s ease", width: "100%", textAlign: "left", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = opt.bg; e.currentTarget.style.transform = "translateX(4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "translateX(0)"; }}
                >
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: opt.bg, border: `1.5px solid ${opt.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isShareLoading(shareModal.id, opt.id) ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "dash-spin 0.7s linear infinite" }}>
                        <circle cx="12" cy="12" r="9" stroke={opt.color} strokeWidth="2.5" strokeDasharray="28 56" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <span style={{ color: opt.color, display: "flex" }}>
                        {opt.icon}
                      </span>
                    )}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: opt.color }}>{isShareLoading(shareModal.id, opt.id) ? "Loading..." : opt.label}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>
                      {opt.id === "email" && "Send directly to inbox"}
                      {opt.id === "whatsapp" && "Open WhatsApp chat"}
                      {opt.id === "linkedin" && "Post to your profile"}
                      {opt.id === "copy" && "Copy link to clipboard"}
                    </p>
                  </div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ marginLeft: "auto", color: "#cbd5e1", flexShrink: 0 }}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          EMAIL MODAL
      ══════════════════════════════ */}
      {emailModal && (
        <div onClick={() => { if (!emailSending) setEmailModal(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "modalBg 0.2s ease" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: 440, animation: "modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Share via Email</h3>
              </div>
              <button onClick={() => setEmailModal(null)} disabled={emailSending}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, borderRadius: 6, display: "flex", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#374151"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9ca3af"; }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSend} style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Recipient Email <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="em-input" type="email" placeholder="example@email.com" required autoFocus
                  value={emailForm.recipientEmail} onChange={e => setEmailForm(f => ({ ...f, recipientEmail: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Recipient Name <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
                <input className="em-input" type="text" placeholder="Friend"
                  value={emailForm.recipientName} onChange={e => setEmailForm(f => ({ ...f, recipientName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Personal Message <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
                <textarea className="em-input" placeholder="Add a note..." rows={3}
                  value={emailForm.customMessage} onChange={e => setEmailForm(f => ({ ...f, customMessage: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setEmailModal(null)} disabled={emailSending}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  Cancel
                </button>
                <button type="submit" disabled={emailSending || !emailForm.recipientEmail.trim()}
                  style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: emailSending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: (emailSending || !emailForm.recipientEmail.trim()) ? 0.6 : 1, fontFamily: "inherit", transition: "opacity 0.2s" }}>
                  {emailSending ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "dash-spin 0.7s linear infinite" }}>
                        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" strokeDasharray="28 56" strokeLinecap="round" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}