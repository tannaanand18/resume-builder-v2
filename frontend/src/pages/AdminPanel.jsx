import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const TABS = ["Dashboard", "Users", "Resumes"];

export default function AdminPanel() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchStats = async () => {
    try { const res = await api.get("/admin/stats"); setStats(res.data); }
    catch { showToast("❌ Failed to load stats"); }
  };
  const fetchUsers = async () => {
    try { const res = await api.get("/admin/users"); setUsers(res.data); }
    catch { showToast("❌ Failed to load users"); }
  };
  const fetchResumes = async () => {
    try { const res = await api.get("/admin/resumes"); setResumes(res.data); }
    catch { showToast("❌ Failed to load resumes"); }
  };

  useEffect(() => {
    if (authLoading === false && (!user || user.role !== "admin")) navigate("/dashboard");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (authLoading === false && user?.role === "admin") {
      setLoading(true);
      Promise.all([fetchStats(), fetchUsers(), fetchResumes()]).finally(() => setLoading(false));
    }
  }, [authLoading, user]);

  if (authLoading) return null;

  const deleteUser = async (userId) => {
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      showToast("✅ " + res.data.message);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setResumes(prev => prev.filter(r => r.user_id !== userId));
      setConfirmDelete(null); setSelectedUser(null); fetchStats();
    } catch (err) { showToast("❌ " + (err.response?.data?.error || "Failed to delete user")); }
  };

  const changeRole = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      showToast("✅ " + res.data.message);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      fetchStats();
    } catch (err) { showToast("❌ " + (err.response?.data?.error || "Failed to change role")); }
  };

  const deleteResume = async (resumeId) => {
    try {
      await api.delete(`/admin/resumes/${resumeId}`);
      showToast("✅ Resume deleted");
      setResumes(prev => prev.filter(r => r.id !== resumeId));
      setConfirmDelete(null); fetchStats();
    } catch { showToast("❌ Failed to delete resume"); }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredResumes = resumes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.user_name.toLowerCase().includes(search.toLowerCase()) ||
    r.user_email.toLowerCase().includes(search.toLowerCase())
  );
  const getToggledRole = (role) => (role === "admin" ? "user" : "admin");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f1f5f9 0%, #eef2ff 50%, #f5f3ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 52, height: 52, border: "4px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
          <p style={{ color: "#6366f1", fontSize: 15, fontWeight: 600, animation: "pulse 1.5s ease infinite" }}>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f1f5f9 0%, #eef2ff 60%, #f5f3ff 100%)", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        .admin-page { animation: fadeInUp 0.4s ease; }

        /* Glassmorphism card */
        .glass-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 4px 24px rgba(99,102,241,0.06), 0 1px 2px rgba(0,0,0,0.04);
          border-radius: 20px;
          transition: box-shadow 0.25s ease, transform 0.2s ease;
        }
        .glass-card:hover {
          box-shadow: 0 8px 32px rgba(99,102,241,0.12), 0 2px 4px rgba(0,0,0,0.06);
        }

        /* Stat card hover */
        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
          animation: fadeInUp 0.5s ease both;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(99,102,241,0.15) !important;
        }

        /* Table row hover */
        .admin-row {
          transition: background 0.15s ease;
        }
        .admin-row:hover {
          background: rgba(99,102,241,0.04) !important;
        }

        /* Button hover effects */
        .btn-role:hover { background: #e0e7ff !important; transform: scale(1.04); }
        .btn-danger:hover { background: #fecaca !important; transform: scale(1.04); }
        .btn-back:hover { color: #4f46e5 !important; }
        .btn-primary:hover { opacity: 0.9; transform: scale(1.02); }

        /* Tab button */
        .admin-tab {
          padding: 9px 22px;
          border-radius: 12px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s ease;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }
        .admin-tab:hover { transform: translateY(-1px); }
        .admin-tab.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }
        .admin-tab.inactive {
          background: transparent;
          color: #64748b;
        }
        .admin-tab.inactive:hover {
          background: rgba(99,102,241,0.07);
          color: #6366f1;
        }

        /* Search input */
        .admin-search:focus {
          border-color: #818cf8 !important;
          box-shadow: 0 0 0 3px rgba(129,140,248,0.15) !important;
          background: #fff !important;
          outline: none;
        }

        /* Orbs background */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          pointer-events: none;
          z-index: 0;
          animation: float 8s ease-in-out infinite;
        }

        /* Badge */
        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        /* Modal animation */
        .modal-inner { animation: scaleIn 0.25s ease; }

        @media (max-width: 768px) {
          .admin-header { padding: 10px 14px !important; min-height: 52px !important; }
          .admin-header-title { font-size: 16px !important; }
          .admin-header-email { display: none !important; }
          .admin-header-right button { padding: 6px 12px !important; font-size: 12px !important; }
          .admin-body { padding: 14px 10px !important; }
          .admin-tabs-wrap { width: 100% !important; }
          .admin-tab { flex: 1; text-align: center; padding: 8px 8px !important; font-size: 12px !important; }
          .admin-stat-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .admin-recent-grid { grid-template-columns: 1fr !important; }
          .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .admin-table { min-width: 520px; }
          .admin-user-detail-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-actions { flex-wrap: wrap; gap: 4px; }
          .admin-actions button { padding: 4px 8px !important; font-size: 11px !important; }
          .orb { display: none; }
        }

        @media (max-width: 480px) {
          .admin-stat-grid { grid-template-columns: 1fr !important; }
          .admin-user-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Background orbs */}
      <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, #6366f1, transparent)", top: -100, right: -100, animationDelay: "0s" }} />
      <div className="orb" style={{ width: 400, height: 400, background: "radial-gradient(circle, #8b5cf6, transparent)", bottom: 100, left: -80, animationDelay: "3s" }} />
      <div className="orb" style={{ width: 300, height: 300, background: "radial-gradient(circle, #06b6d4, transparent)", top: "40%", left: "40%", animationDelay: "5s" }} />

      {/* ─── HEADER ─── */}
      <header className="admin-header" style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        padding: "0 24px",
        height: 62,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        animation: "fadeInDown 0.4s ease",
      }}>
        <div className="admin-header-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 4px 12px rgba(99,102,241,0.35)"
          }}>🛡️</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>Admin Panel</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Resume Builder</div>
          </div>
        </div>
        <div className="admin-header-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="admin-header-email" style={{ fontSize: 13, color: "#64748b", fontWeight: 500, background: "rgba(99,102,241,0.07)", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(99,102,241,0.12)" }}>
            {user?.email}
          </span>
          <button onClick={() => navigate("/dashboard")} style={{
            background: "rgba(241,245,249,0.9)", color: "#64748b", border: "1px solid #e2e8f0",
            borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s ease", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(241,245,249,0.9)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </button>
          <button onClick={() => { logout(); navigate("/login"); }} style={{
            background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none",
            borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s ease", fontFamily: "inherit",
            boxShadow: "0 2px 8px rgba(239,68,68,0.3)"
          }}>
            Logout
          </button>
        </div>
      </header>

      {/* ─── TOAST ─── */}
      {toast && (
        <div style={{
          position: "fixed", top: 76, right: 20, zIndex: 999,
          background: toast.startsWith("✅")
            ? "linear-gradient(135deg, #059669, #10b981)"
            : "linear-gradient(135deg, #dc2626, #ef4444)",
          color: "#fff", padding: "13px 20px", borderRadius: 14, fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
          animation: "toastIn 0.3s ease",
          backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 8
        }}>
          {toast}
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ─── */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 100, padding: 16
        }} onClick={() => setConfirmDelete(null)}>
          <div className="modal-inner" onClick={e => e.stopPropagation()} style={{
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)",
            borderRadius: 24, padding: 32, width: "100%", maxWidth: 440,
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.9)"
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #fee2e2, #fecaca)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Confirm Delete</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, margin: "0 0 28px" }}>
              {confirmDelete.type === "user"
                ? `This will permanently delete user "${confirmDelete.name}" and ALL their resumes and data.`
                : `This will permanently delete resume "${confirmDelete.name}" and all its data.`}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0",
                borderRadius: 12, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
              }}>Cancel</button>
              <button onClick={() => confirmDelete.type === "user" ? deleteUser(confirmDelete.id) : deleteResume(confirmDelete.id)}
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none",
                  borderRadius: 12, padding: "10px 22px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(239,68,68,0.3)"
                }}>
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BODY ─── */}
      <div className="admin-body admin-page" style={{ maxWidth: 1260, margin: "0 auto", padding: "28px 20px", position: "relative", zIndex: 1 }}>

        {/* Tabs */}
        <div className="admin-tabs-wrap" style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: 16, padding: 5, marginBottom: 28, width: "fit-content", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 12px rgba(99,102,241,0.08)" }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => { setActiveTab(i); setSearch(""); setSelectedUser(null); }}
              className={`admin-tab ${activeTab === i ? "active" : "inactive"}`}>
              {i === 0 ? "📊 " : i === 1 ? "👥 " : "📄 "}{tab}
            </button>
          ))}
        </div>

        {/* ════════ DASHBOARD TAB ════════ */}
        {activeTab === 0 && stats && (
          <div style={{ animation: "fadeInUp 0.4s ease" }}>
            {/* Stat Cards */}
            <div className="admin-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 28 }}>
              {[
                { label: "Total Users", value: stats.total_users, icon: "👥", color: "#6366f1", bg: "linear-gradient(135deg, #eef2ff, #e0e7ff)", delay: "0s" },
                { label: "Total Resumes", value: stats.total_resumes, icon: "📄", color: "#059669", bg: "linear-gradient(135deg, #ecfdf5, #d1fae5)", delay: "0.08s" },
                { label: "Admin Users", value: stats.total_admins, icon: "🛡️", color: "#8b5cf6", bg: "linear-gradient(135deg, #f5f3ff, #ede9fe)", delay: "0.16s" },
              ].map(({ label, value, icon, color, bg, delay }) => (
                <div key={label} className="stat-card glass-card" style={{ padding: "26px 24px", animationDelay: delay }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 38, fontWeight: 900, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, fontWeight: 500 }}>{label}</div>
                    </div>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `1px solid ${color}20` }}>{icon}</div>
                  </div>
                  <div style={{ marginTop: 18, height: 4, borderRadius: 4, background: `${color}20` }}>
                    <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}99)`, width: "70%" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Users & Resumes */}
            <div className="admin-recent-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {[
                { title: "Recent Users", cols: ["Name", "Email", "Joined"], rows: stats.recent_users, renderRow: u => [<span style={{ fontWeight: 700 }}>{u.name}</span>, u.email, formatDate(u.created_at)] },
                { title: "Recent Resumes", cols: ["Title", "Template", "Created"], rows: stats.recent_resumes, renderRow: r => [<span style={{ fontWeight: 700 }}>{r.title}</span>, r.template_name, formatDate(r.created_at)] },
              ].map(({ title, cols, rows, renderRow }) => (
                <div key={title} className="glass-card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(226,232,240,0.6)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</span>
                  </div>
                  <div className="admin-table-wrap">
                    <table style={{ width: "100%", borderCollapse: "collapse" }} className="admin-table">
                      <thead>
                        <tr style={{ background: "rgba(248,250,252,0.8)" }}>
                          {cols.map(c => <th key={c} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(226,232,240,0.5)" }}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i} className="admin-row">
                            {renderRow(row).map((cell, j) => (
                              <td key={j} style={{ padding: "12px 16px", fontSize: 13, color: "#334155", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ USERS TAB ════════ */}
        {activeTab === 1 && !selectedUser && (
          <div className="glass-card" style={{ overflow: "hidden", animation: "fadeInUp 0.4s ease" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(226,232,240,0.6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>All Users</span>
                <span style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", color: "#6366f1", fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>{filteredUsers.length}</span>
              </div>
              <input className="admin-search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search by name or email..."
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "9px 14px", fontSize: 13, background: "rgba(248,250,252,0.8)", width: "100%", maxWidth: 300, fontFamily: "inherit", transition: "all 0.2s" }}
              />
            </div>
            {filteredUsers.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                No users found
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse" }} className="admin-table">
                  <thead>
                    <tr style={{ background: "rgba(248,250,252,0.8)" }}>
                      {["ID", "Name", "Email", "Role", "Resumes", "Joined", "Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(226,232,240,0.5)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="admin-row" style={{ cursor: "pointer" }} onClick={() => setSelectedUser(u)}>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#94a3b8", borderBottom: "1px solid rgba(241,245,249,0.8)", fontWeight: 600 }}>{u.id}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#0f172a", borderBottom: "1px solid rgba(241,245,249,0.8)", fontWeight: 700 }}>{u.name}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748b", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{u.email}</td>
                        <td style={{ padding: "13px 16px", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>
                          <span className="role-badge" style={{
                            background: u.role === "admin" ? "linear-gradient(135deg, #eef2ff, #e0e7ff)" : "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                            color: u.role === "admin" ? "#6366f1" : "#059669",
                            border: `1px solid ${u.role === "admin" ? "#c7d2fe" : "#a7f3d0"}`
                          }}>
                            {u.role === "admin" ? "🛡️" : "👤"} {u.role}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#334155", borderBottom: "1px solid rgba(241,245,249,0.8)", fontWeight: 600 }}>{u.resume_count}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748b", borderBottom: "1px solid rgba(241,245,249,0.8)", whiteSpace: "nowrap" }}>{formatDate(u.created_at)}</td>
                        <td style={{ padding: "13px 16px", borderBottom: "1px solid rgba(241,245,249,0.8)" }} onClick={e => e.stopPropagation()}>
                          <div className="admin-actions" style={{ display: "flex", gap: 6 }}>
                            <button className="btn-role" onClick={() => changeRole(u.id, getToggledRole(u.role))} style={{
                              background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", color: "#6366f1",
                              border: "1px solid #c7d2fe", borderRadius: 8, padding: "5px 11px",
                              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s ease"
                            }}>
                              {u.role === "admin" ? "→ User" : "→ Admin"}
                            </button>
                            <button className="btn-danger" onClick={() => setConfirmDelete({ type: "user", id: u.id, name: u.name })} style={{
                              background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#dc2626",
                              border: "1px solid #fca5a5", borderRadius: 8, padding: "5px 11px",
                              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s ease"
                            }}>
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════ USER DETAIL VIEW ════════ */}
        {activeTab === 1 && selectedUser && (
          <div style={{ animation: "fadeInUp 0.35s ease" }}>
            <button className="btn-back" onClick={() => setSelectedUser(null)} style={{
              background: "rgba(255,255,255,0.7)", color: "#6366f1", border: "1.5px solid #c7d2fe",
              borderRadius: 10, padding: "7px 16px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", marginBottom: 16, display: "flex", alignItems: "center", gap: 6,
              backdropFilter: "blur(8px)", transition: "all 0.2s"
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Users
            </button>
            <div className="glass-card" style={{ overflow: "hidden" }}>
              {/* User header */}
              <div style={{ padding: "28px 28px 24px", background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))", borderBottom: "1px solid rgba(226,232,240,0.6)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>
                      {selectedUser.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{selectedUser.name}</h2>
                      <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>{selectedUser.email}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="role-badge" style={{
                      background: selectedUser.role === "admin" ? "linear-gradient(135deg, #eef2ff, #e0e7ff)" : "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                      color: selectedUser.role === "admin" ? "#6366f1" : "#059669",
                      border: `1px solid ${selectedUser.role === "admin" ? "#c7d2fe" : "#a7f3d0"}`,
                      fontSize: 13, padding: "6px 14px"
                    }}>
                      {selectedUser.role === "admin" ? "🛡️ Admin" : "👤 User"}
                    </span>
                    <button className="btn-role" onClick={() => { changeRole(selectedUser.id, getToggledRole(selectedUser.role)); setSelectedUser(prev => ({ ...prev, role: getToggledRole(prev.role) })); }}
                      style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", color: "#6366f1", border: "1.5px solid #c7d2fe", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}>
                      {selectedUser.role === "admin" ? "Demote to User" : "Promote to Admin"}
                    </button>
                    <button className="btn-danger" onClick={() => setConfirmDelete({ type: "user", id: selectedUser.id, name: selectedUser.name })}
                      style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#dc2626", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}>
                      🗑️ Delete User
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="admin-user-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderBottom: "1px solid rgba(226,232,240,0.6)" }}>
                {[
                  { label: "User ID", value: `#${selectedUser.id}`, icon: "🆔" },
                  { label: "Total Resumes", value: selectedUser.resume_count, icon: "📄" },
                  { label: "Member Since", value: formatDate(selectedUser.created_at), icon: "📅" },
                ].map(({ label, value, icon }, i) => (
                  <div key={label} style={{ padding: "20px 24px", borderRight: i < 2 ? "1px solid rgba(226,232,240,0.6)" : "none", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{value}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Resumes table */}
              <div style={{ padding: "20px 24px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>Resumes by this user</h3>
                </div>
              </div>
              {resumes.filter(r => r.user_id === selectedUser.id).length === 0 ? (
                <div style={{ padding: "28px 24px 32px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                  No resumes yet
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse" }} className="admin-table">
                    <thead>
                      <tr style={{ background: "rgba(248,250,252,0.8)" }}>
                        {["ID", "Title", "Template", "Style", "Created", "Actions"].map(h => (
                          <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderTop: "1px solid rgba(226,232,240,0.5)", borderBottom: "1px solid rgba(226,232,240,0.5)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resumes.filter(r => r.user_id === selectedUser.id).map(r => (
                        <tr key={r.id} className="admin-row">
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{r.id}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{r.title}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{r.template_name}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{r.template_style || "—"}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b", borderBottom: "1px solid rgba(241,245,249,0.8)", whiteSpace: "nowrap" }}>{formatDate(r.created_at)}</td>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>
                            <button className="btn-danger" onClick={() => setConfirmDelete({ type: "resume", id: r.id, name: r.title })}
                              style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}>
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ height: 8 }} />
            </div>
          </div>
        )}

        {/* ════════ RESUMES TAB ════════ */}
        {activeTab === 2 && (
          <div className="glass-card" style={{ overflow: "hidden", animation: "fadeInUp 0.4s ease" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(226,232,240,0.6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>All Resumes</span>
                <span style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", color: "#6366f1", fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>{filteredResumes.length}</span>
              </div>
              <input className="admin-search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search by title, name or email..."
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "9px 14px", fontSize: 13, background: "rgba(248,250,252,0.8)", width: "100%", maxWidth: 340, fontFamily: "inherit", transition: "all 0.2s" }}
              />
            </div>
            {filteredResumes.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                No resumes found
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse" }} className="admin-table">
                  <thead>
                    <tr style={{ background: "rgba(248,250,252,0.8)" }}>
                      {["ID", "Title", "Owner", "Template", "Style", "Created", "Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(226,232,240,0.5)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResumes.map(r => (
                      <tr key={r.id} className="admin-row">
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{r.id}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{r.title}</td>
                        <td style={{ padding: "13px 16px", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{r.user_name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{r.user_email}</div>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748b", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>
                          <span style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.template_name}</span>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748b", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>{r.template_style || "—"}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748b", borderBottom: "1px solid rgba(241,245,249,0.8)", whiteSpace: "nowrap" }}>{formatDate(r.created_at)}</td>
                        <td style={{ padding: "13px 16px", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>
                          <button className="btn-danger" onClick={() => setConfirmDelete({ type: "resume", id: r.id, name: r.title })}
                            style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}>
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}