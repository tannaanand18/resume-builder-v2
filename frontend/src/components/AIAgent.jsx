import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api, { API_URL } from "../services/api";

const initialMessage = {
  role: "agent",
  content:
    "Hi, I am ResumeAI Assistant. Ask me about your resume, add sections, create a new resume, check ATS score, or paste LinkedIn profile text.",
};

const getCurrentResumeId = () => {
  const match = window.location.pathname.match(/\/resume\/(\d+)\/(?:edit|preview|view)/);
  return match ? Number(match[1]) : null;
};

const getCurrentPage = () => {
  const path = window.location.pathname;
  if (path.includes("/resume/") && path.includes("/edit")) return "resume_builder";
  if (path.includes("/dashboard")) return "dashboard";
  if (path.includes("/ats-checker")) return "ats_checker";
  if (path.includes("/resume/new")) return "template_select";
  return path.replace("/", "") || "home";
};

export default function AIAgent() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [resumeContext, setResumeContext] = useState(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const resumeId = useMemo(() => getCurrentResumeId(), [open, window.location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, open]);

  useEffect(() => {
    if (!open || !user || !resumeId) {
      setResumeContext(null);
      return;
    }

    let cancelled = false;
    const loadResumeContext = async () => {
      try {
        const [resume, experiences, educations, skills, projects, certifications] = await Promise.all([
          api.get(`/resume/${resumeId}`),
          api.get(`/experience/${resumeId}`),
          api.get(`/education/${resumeId}`),
          api.get(`/skills/${resumeId}`),
          api.get(`/projects/${resumeId}`),
          api.get(`/certifications/${resumeId}`),
        ]);

        if (!cancelled) {
          setResumeContext({
            resume: resume.data,
            experiences: experiences.data,
            educations: educations.data,
            skills: skills.data,
            projects: projects.data,
            certifications: certifications.data,
          });
        }
      } catch {
        if (!cancelled) setResumeContext(null);
      }
    };

    loadResumeContext();
    return () => {
      cancelled = true;
    };
  }, [open, resumeId, user]);

  if (loading || !user) return null;

  const sendMessage = async (event) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setThinking(true);

    try {
      const response = await api.post("/ai/agent", {
        message: text,
        resume_id: getCurrentResumeId(),
        conversation_history: nextMessages.slice(-10),
        context: {
          current_page: getCurrentPage(),
          resume_data: resumeContext,
        },
      });

      const result = response.data || {};
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          content: result.message || "Done.",
          actions_taken: result.actions_taken || [],
          data: result.data || {},
        },
      ]);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "I could not reach the AI agent. Please try again.";
      setError(message);
      setMessages((current) => [...current, { role: "agent", content: message }]);
    } finally {
      setThinking(false);
    }
  };

  const renderMessageContent = (message) => {
    const lines = String(message.content || "").split("\n");
    return (
      <>
        {lines.map((line, index) => {
          const editMatch = line.match(/(\/resume\/\d+\/edit)/);
          if (editMatch) {
            return (
              <span key={`${line}-${index}`}>
                {line.replace(editMatch[1], "")}
                <a href={editMatch[1]} style={styles.link}>
                  Open resume
                </a>
                {index < lines.length - 1 ? <br /> : null}
              </span>
            );
          }
          return (
            <span key={`${line}-${index}`}>
              {line}
              {index < lines.length - 1 ? <br /> : null}
            </span>
          );
        })}
        {message.data?.download_url ? (
          <a
            href={`${API_URL}${message.data.download_url}`}
            style={{ ...styles.link, display: "inline-block", marginTop: 8 }}
            target="_blank"
            rel="noreferrer"
          >
            Download PDF
          </a>
        ) : null}
      </>
    );
  };

  return (
    <div style={styles.shell} aria-live="polite">
      <div style={{ ...styles.window, ...(open ? styles.windowOpen : styles.windowClosed) }}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>
              <Bot size={18} />
            </span>
            <div>
              <div style={styles.title}>ResumeAI Assistant</div>
              <div style={styles.status}>{resumeId ? `Resume #${resumeId}` : "Ready to help"}</div>
            </div>
          </div>
          <button type="button" style={styles.iconButton} onClick={() => setOpen(false)} aria-label="Close assistant">
            <X size={18} />
          </button>
        </div>

        <div style={styles.messages}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={{
                ...styles.row,
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(message.role === "user" ? styles.userBubble : styles.agentBubble),
                }}
              >
                {renderMessageContent(message)}
              </div>
            </div>
          ))}
          {thinking ? (
            <div style={{ ...styles.row, justifyContent: "flex-start" }}>
              <div style={{ ...styles.bubble, ...styles.agentBubble, ...styles.typing }}>
                <Loader2 size={16} style={styles.spin} />
                Thinking
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}

        <form style={styles.form} onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask ResumeAI..."
            style={styles.input}
            disabled={thinking}
          />
          <button type="submit" style={styles.sendButton} disabled={thinking || !input.trim()} aria-label="Send message">
            {thinking ? <Loader2 size={18} style={styles.spin} /> : <Send size={18} />}
          </button>
        </form>
      </div>

      <button
        type="button"
        style={{ ...styles.fab, transform: open ? "scale(0.92)" : "scale(1)" }}
        onClick={() => setOpen((value) => !value)}
        aria-label="Open ResumeAI Assistant"
      >
        {open ? <X size={24} /> : <MessageCircle size={25} />}
      </button>
    </div>
  );
}

const styles = {
  shell: {
    position: "fixed",
    right: 22,
    bottom: 22,
    zIndex: 9999,
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "none",
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    boxShadow: "0 18px 35px rgba(99, 102, 241, 0.36)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },
  window: {
    position: "absolute",
    right: 0,
    bottom: 74,
    width: 380,
    height: 500,
    maxHeight: "calc(100vh - 110px)",
    background: "#ffffff",
    borderRadius: 18,
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "opacity 180ms ease, transform 180ms ease, visibility 180ms ease",
  },
  windowOpen: {
    opacity: 1,
    transform: "translateY(0) scale(1)",
    visibility: "visible",
    pointerEvents: "auto",
  },
  windowClosed: {
    opacity: 0,
    transform: "translateY(16px) scale(0.96)",
    visibility: "hidden",
    pointerEvents: "none",
  },
  header: {
    minHeight: 70,
    padding: "14px 16px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.2,
  },
  status: {
    fontSize: 12,
    opacity: 0.86,
    marginTop: 2,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    color: "#fff",
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    padding: 14,
    overflowY: "auto",
    background: "#f8fafc",
  },
  row: {
    display: "flex",
    marginBottom: 10,
  },
  bubble: {
    maxWidth: "84%",
    borderRadius: 16,
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  userBubble: {
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    borderBottomRightRadius: 5,
  },
  agentBubble: {
    color: "#111827",
    background: "#e5e7eb",
    borderBottomLeftRadius: 5,
  },
  typing: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#4b5563",
  },
  form: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTop: "1px solid #e5e7eb",
    background: "#fff",
  },
  input: {
    flex: 1,
    height: 42,
    border: "1px solid #d1d5db",
    borderRadius: 999,
    padding: "0 14px",
    outline: "none",
    fontSize: 14,
    minWidth: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "none",
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flex: "0 0 auto",
  },
  error: {
    color: "#b91c1c",
    background: "#fee2e2",
    padding: "8px 12px",
    fontSize: 12,
  },
  link: {
    color: "#4f46e5",
    fontWeight: 800,
    textDecoration: "none",
  },
  spin: {
    animation: "resumeai-spin 0.8s linear infinite",
  },
};

if (typeof document !== "undefined" && !document.getElementById("resumeai-agent-style")) {
  const style = document.createElement("style");
  style.id = "resumeai-agent-style";
  style.textContent = `
    @keyframes resumeai-spin { to { transform: rotate(360deg); } }
    @media (max-width: 640px) {
      [aria-label="Open ResumeAI Assistant"] {
        width: 56px !important;
        height: 56px !important;
      }
    }
    @media (max-width: 520px) {
      div[aria-live="polite"] {
        right: 14px !important;
        bottom: 14px !important;
      }
      div[aria-live="polite"] > div:first-child {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        max-height: none !important;
        border-radius: 0 !important;
        bottom: auto !important;
        right: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
}
