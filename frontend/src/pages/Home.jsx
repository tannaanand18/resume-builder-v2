import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import {
  FileText,
  Sparkles,
  Shield,
  Download,
  ArrowRight,
  Zap,
  Layout,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "AI Suggestions",
      desc: "Generate summaries, improve wording, and get skill recommendations powered by AI.",
    },
    {
      icon: Layout,
      title: "Multiple Templates",
      desc: "Choose from Modern, Classic, and Minimal templates. Switch anytime.",
    },
    {
      icon: Download,
      title: "PDF Download",
      desc: "Download your resume as a professionally styled PDF ready for applications.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      desc: "Your data is encrypted and protected with enterprise-grade security.",
    },
    {
      icon: Zap,
      title: "ATS Optimized",
      desc: "Resumes are optimized to pass Applicant Tracking Systems used by employers.",
    },
    {
      icon: FileText,
      title: "Full Control",
      desc: "Create, edit, duplicate, and manage multiple resumes from your dashboard.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" }}>

      <style>{`
        @keyframes home-fade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .home-feature { transition: all 0.3s ease; border: 1px solid #e2e8f0; }
        .home-feature:hover { transform: translateY(-4px); box-shadow: 0 16px 40px -12px rgba(99,102,241,0.12); border-color: #c7d2fe; }
        .home-cta { transition: all 0.3s ease; }
        .home-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 32px -8px rgba(99,102,241,0.4); }
      `}</style>

      {/* NAVBAR */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(226,232,240,0.6)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText style={{ width: 16, height: 16, color: "#fff" }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>Resume<span style={{ color: "#6366f1" }}>AI</span></span>
          </div>

          <button className="home-cta" onClick={() => navigate(user ? "/dashboard" : "/login")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {user ? "Dashboard" : "Get Started"} <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center", animation: "home-fade 0.6s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          <Sparkles style={{ width: 16, height: 16 }} />
          AI-Powered Resume Builder
        </div>

        <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
          Build{" "}
          <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ATS-Friendly
          </span>{" "}
          Resumes in Minutes
        </h1>

        <p style={{ fontSize: 18, color: "#64748b", maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Create professional resumes with AI-powered suggestions, multiple templates, and instant PDF downloads.
        </p>

        <button className="home-cta" onClick={() => navigate(user ? "/dashboard" : "/login")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          Start Building <ArrowRight style={{ width: 18, height: 18 }} />
        </button>
      </section>

      {/* FEATURES */}
      <section style={{ borderTop: "1px solid #e2e8f0", background: "#fff", padding: "72px 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, textAlign: "center", marginBottom: 48, letterSpacing: "-0.02em" }}>Everything You Need</h2>

          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="home-feature"
                style={{ borderRadius: 14, background: "#fafbfc", padding: 24, animation: `home-fade 0.5s ease ${i * 0.08}s both` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon style={{ width: 20, height: 20, color: "#6366f1" }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "32px 0", background: "linear-gradient(135deg, #f8fafc, #eef2ff)" }}>
        <div style={{ textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
          &copy; {new Date().getFullYear()} ResumeAI. Build professional resumes with AI.
        </div>
      </footer>
    </div>
  );
}