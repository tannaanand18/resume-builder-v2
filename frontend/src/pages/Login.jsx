import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import LoadingScreen from "../components/LoadingScreen";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(form);
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      login(data);

      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #faf5ff 100%)", padding: "16px", fontFamily: "'Inter', system-ui, sans-serif" }}>

      <LoadingScreen visible={loading} message="Signing in..." />

      <style>{`
        @keyframes login-fade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .login-input { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s ease; background: #f8fafc; box-sizing: border-box; }
        .login-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .login-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
        .login-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px -6px rgba(99,102,241,0.4); }
        .login-btn:disabled { opacity: 0.6; transform: none; box-shadow: none; cursor: not-allowed; }
      `}</style>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, animation: "login-fade 0.5s ease" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px -2px rgba(99,102,241,0.4)" }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 8h10M7 12h6M7 16h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
        </div>
        <span style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Resume<span style={{ color: "#6366f1" }}>AI</span></span>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px -12px rgba(99,102,241,0.12), 0 0 0 1px rgba(226,232,240,0.6)", width: "100%", maxWidth: 420, padding: 36, animation: "login-fade 0.6s ease 0.1s both" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center", color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Welcome back</h2>
        <p style={{ fontSize: 14, textAlign: "center", color: "#64748b", margin: "0 0 28px" }}>Sign in to manage your resumes</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Email</label>
            <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className="login-input" required />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Password</label>
            </div>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={form.password} onChange={handleChange} className="login-input" style={{ paddingRight: 44 }} required />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "#94a3b8" }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            <Link to="/forgot-password" style={{ fontSize: 13, color: "#6366f1", textDecoration: "none", fontWeight: 500, display: "inline-block", marginTop: 6 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            Sign In
          </button>
        </form>

        <p style={{ fontSize: 14, marginTop: 24, textAlign: "center", color: "#64748b" }}>
          Don{"'"}t have an account?{" "}
          <span onClick={() => navigate("/register")} style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}