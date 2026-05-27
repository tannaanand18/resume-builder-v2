import React from "react";

export default function LoadingScreen({ visible, message = "Loading..." }) {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "fadeIn 0.2s ease"
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 24,
        padding: "40px 48px",
        textAlign: "center",
        boxShadow: "0 24px 64px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        border: "1px solid rgba(255,255,255,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        maxWidth: 300,
        animation: "slideUp 0.25s ease"
      }}>
        {/* Spinner */}
        <div style={{
          width: 48, height: 48,
          border: "4px solid #e0e7ff",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />

        {/* Message */}
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            {message}
          </p>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "#94a3b8" }}>
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}