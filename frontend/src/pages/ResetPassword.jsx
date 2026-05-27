import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;
      if (status === 400 && msg === "Token expired") {
        toast.error("This reset link has expired. Please request a new one.");
      } else if (status === 400 && msg === "Invalid token") {
        toast.error("Invalid reset link. Please request a new one.");
      } else {
        toast.error(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #faf5ff 100%)", padding: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes rp-fade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rp-spin { to { transform: rotate(360deg); } }
        @keyframes rp-check { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        .rp-input { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s ease; background: #f8fafc; box-sizing: border-box; font-family: inherit; }
        .rp-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .rp-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .rp-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; }
        .rp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px -6px rgba(99,102,241,0.4); }
        .rp-btn:disabled { opacity: 0.6; transform: none; box-shadow: none; cursor: not-allowed; }
      `}</style>

      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px -12px rgba(99,102,241,0.12), 0 0 0 1px rgba(226,232,240,0.6)", width: "100%", maxWidth: 420, padding: 36, animation: "rp-fade 0.6s ease" }}>

        {done ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #dcfce7, #bbf7d0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "rp-check 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Password Updated!</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 4px" }}>Your password has been reset successfully.</p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>Redirecting to login...</p>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #eef2ff, #f5f3ff)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Reset Password</h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Enter your new password below</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  className="rp-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                  data-testid="password-input"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  className="rp-input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={loading}
                  data-testid="confirm-input"
                />
                {confirm && password !== confirm && (
                  <p style={{ fontSize: 12, color: "#ef4444", margin: "6px 0 0" }}>Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="rp-btn"
                style={{ marginTop: 4 }}
                data-testid="submit-button"
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "rp-spin 0.7s linear infinite" }}>
                      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" strokeDasharray="28 56" strokeLinecap="round"/>
                    </svg>
                    Resetting...
                  </>
                ) : "Reset Password"}
              </button>
            </form>

            <p style={{ fontSize: 14, marginTop: 20, textAlign: "center", color: "#64748b" }}>
              Remember your password?{" "}
              <Link to="/login" style={{ color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}