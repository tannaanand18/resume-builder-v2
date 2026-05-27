import { useState } from "react";
import { Share2, Mail, MessageCircle, Linkedin, Link2, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import emailjs from "@emailjs/browser";
import api from "../services/api";
import "../styles/ShareButton.css";

const EMAILJS_SERVICE_ID  = "service_v6fih3c";
const EMAILJS_TEMPLATE_ID = "template_uio18xg";
const EMAILJS_PUBLIC_KEY  = "BubKxvVvR_jCZyxPm";

const ShareButton = ({ resumeId, resumeData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: "",
    recipientName: "",
    customMessage: "",
  });

  const isLoading = (id) => loadingId === id;
  const startLoad = (id) => setLoadingId(id);
  const stopLoad = () => setLoadingId(null);

  const openEmailModal = () => {
    setIsOpen(false);
    setEmailModal(true);
  };

  /* ── Email via EmailJS ── */
  const handleEmailShare = async (e) => {
    e.preventDefault();
    const { recipientEmail, recipientName, customMessage } = emailForm;
    if (!recipientEmail.trim()) {
      toast.error("Please enter a recipient email.");
      return;
    }

    startLoad("email");
    try {
      // Step 1: Get share link from backend
      const response = await api.post("/share/email", {
        resume_id: resumeId,
        recipient_email: recipientEmail.trim(),
        recipient_name: recipientName.trim() || "Friend",
        message: customMessage.trim(),
      });

      const shareLink = response.data?.share_link;
      const senderName = response.data?.sender_name || resumeData?.full_name || "Someone";
      const resumeTitle = response.data?.resume_title || "Resume";

      if (!shareLink) {
        toast.error("Could not generate share link.");
        return;
      }

      // Step 2: Send email via EmailJS (no SMTP needed)
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: recipientEmail,
          to_name: recipientName.trim() || "Friend",
          from_name: senderName,
          resume_title: resumeTitle,
          share_link: shareLink,       
          custom_message: customMessage.trim() || "",
          app_name: "ResumeAI",
        },
        EMAILJS_PUBLIC_KEY
      );

      toast.success(`✉️ Resume shared with ${recipientEmail}!`);
      setEmailModal(false);
      setEmailForm({ recipientEmail: "", recipientName: "", customMessage: "" });
    } catch (error) {
      const msg = error?.response?.data?.error || error?.text || "Failed to send email. Please try again.";
      toast.error(msg);
      console.error("Email share error:", error);
    } finally {
      stopLoad();
    }
  };

  /* ── WhatsApp ── */
  const handleWhatsAppShare = async () => {
    startLoad("whatsapp");
    try {
      const response = await api.get(`/share/whatsapp-link/${resumeId}`);
      if (response.data?.whatsapp_link) {
        window.open(response.data.whatsapp_link, "_blank");
        toast.success("💬 Opening WhatsApp...");
        setIsOpen(false);
      } else {
        toast.error("Could not generate WhatsApp link.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to generate WhatsApp link.");
    } finally {
      stopLoad();
    }
  };

  /* ── LinkedIn ── */
  const handleLinkedInShare = async () => {
    startLoad("linkedin");
    try {
      const response = await api.get(`/share/linkedin-link/${resumeId}`);
      if (response.data?.linkedin_link) {
        window.open(response.data.linkedin_link, "_blank");
        toast.success("💼 Opening LinkedIn...");
        setIsOpen(false);
      } else {
        toast.error("Could not generate LinkedIn link.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to generate LinkedIn link.");
    } finally {
      stopLoad();
    }
  };

  /* ── Copy Link ── */
  const handleCopyLink = async () => {
    startLoad("copy");
    try {
      const response = await api.post(`/share/generate-link/${resumeId}`, {});
      if (response.data?.share_link) {
        await navigator.clipboard.writeText(response.data.share_link);
        toast.success("🎉 Link copied to clipboard!");
        setIsOpen(false);
      } else {
        toast.error("Could not generate share link.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to generate share link.");
    } finally {
      stopLoad();
    }
  };

  const shareOptions = [
    { id: "email",    name: "Email",     icon: Mail,          color: "#ef4444", onClick: openEmailModal },
    { id: "whatsapp", name: "WhatsApp",  icon: MessageCircle, color: "#22c55e", onClick: handleWhatsAppShare },
    { id: "linkedin", name: "LinkedIn",  icon: Linkedin,      color: "#0a66c2", onClick: handleLinkedInShare },
    { id: "copy",     name: "Copy Link", icon: Link2,         color: "#f59e0b", onClick: handleCopyLink },
  ];

  return (
    <>
      <div className="share-button-wrapper">
        {isOpen && <div className="share-overlay" onClick={() => setIsOpen(false)} />}

        {isOpen && (
          <div className="share-menu-dropdown">
            {shareOptions.map((option) => {
              const IconComponent = option.icon;
              const loading = isLoading(option.id);
              return (
                <button
                  key={option.id}
                  className="share-menu-item"
                  style={{ "--color": option.color }}
                  onClick={option.onClick}
                  disabled={loadingId !== null}
                  title={option.name}
                >
                  {loading ? (
                    <Loader2 size={20} className="share-spinner" />
                  ) : (
                    <IconComponent size={20} />
                  )}
                  <span>{loading ? "Please wait..." : option.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <button
          className="share-button-main"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={loadingId !== null}
          title="Share Resume"
        >
          <Share2 size={28} />
        </button>
      </div>

      {/* ── Email Modal ── */}
      {emailModal && (
        <div className="email-modal-overlay" onClick={() => setEmailModal(false)}>
          <div className="email-modal" onClick={(e) => e.stopPropagation()}>
            <div className="email-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail size={18} color="#ef4444" />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#6366f1" }}>Share via Email</h3>
              </div>
              <button className="email-modal-close" onClick={() => setEmailModal(false)} disabled={isLoading("email")}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEmailShare} className="email-modal-form">
              <div className="email-field">
                <label htmlFor="recipientEmail">
                  Recipient Email <span className="required">*</span>
                </label>
                <input
                  id="recipientEmail"
                  type="email"
                  placeholder="example@email.com"
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="email-field">
                <label htmlFor="recipientName">
                  Recipient Name <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="recipientName"
                  type="text"
                  placeholder="Friend"
                  value={emailForm.recipientName}
                  onChange={(e) => setEmailForm((f) => ({ ...f, recipientName: e.target.value }))}
                />
              </div>

              <div className="email-field">
                <label htmlFor="customMessage">
                  Personal Message <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  id="customMessage"
                  placeholder="Add a personal note... (optional)"
                  value={emailForm.customMessage}
                  onChange={(e) => setEmailForm((f) => ({ ...f, customMessage: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="email-modal-actions">
                <button
                  type="button"
                  className="email-btn-cancel"
                  onClick={() => setEmailModal(false)}
                  disabled={isLoading("email")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="email-btn-send"
                  disabled={isLoading("email") || !emailForm.recipientEmail.trim()}
                >
                  {isLoading("email") ? (
                    <><Loader2 size={16} className="share-spinner" /> Sending...</>
                  ) : (
                    <><Mail size={16} /> Send Email</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;