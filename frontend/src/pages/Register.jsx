// ============ IMPORTS ============
// useState — React hook to create state variables inside components
import { useState } from "react";
// useNavigate — hook to redirect user to other pages programmatically
import { useNavigate } from "react-router-dom";
// registerUser — API call function that sends name/email/password to backend
import { registerUser } from "../services/authService";
import LoadingScreen from "../components/LoadingScreen";
import toast from "react-hot-toast";

// ============ REGISTER COMPONENT ============
function Register() {
  // navigate — function to redirect user (e.g., navigate("/login"))
  const navigate = useNavigate();

  // form — object holding name, email, and password values from the inputs
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  // showPassword — toggles password field between hidden (dots) and visible (text)
  const [showPassword, setShowPassword] = useState(false);
  // loading — shows/hides the loading screen during registration
  const [loading, setLoading] = useState(false);

  // handleChange — updates form state whenever user types in an input
  // e.target.name = "name", "email", or "password", e.target.value = what they typed
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handleSubmit — runs when user clicks "Create Account" button
  const handleSubmit = async (e) => {
    // prevent page refresh (default form behavior)
    e.preventDefault();
    setLoading(true);
    try {
      // send name/email/password to backend API
      await registerUser(form);
      // show success toast
      toast.success("Registration successful!");
      // redirect to login page after successful registration
      navigate("/login");
    } catch (error) {
      // log error and show failure toast
      console.error(error);
      toast.error(error.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============ JSX (what gets rendered on screen) ============
  return (
    <div className="reg-page">
      <LoadingScreen visible={loading} message="Creating account..." />

      {/* ============ CSS STYLES ============ */}
      <style>{`
        /* fade-in animation — slides content up while fading in */
        @keyframes reg-fade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* full page background container */
        .reg-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #faf5ff 100%);
          padding: 16px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* logo row — icon + "ResumeAI" text */
        .reg-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          animation: reg-fade 0.5s ease;
        }

        /* purple square behind the document icon */
        .reg-logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px -2px rgba(99,102,241,0.4);
        }

        /* "ResumeAI" brand text */
        .reg-logo-text {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        /* purple highlight on "AI" */
        .reg-logo-highlight {
          color: #6366f1;
        }

        /* white card that holds the form */
        .reg-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 20px 60px -12px rgba(99,102,241,0.12), 0 0 0 1px rgba(226,232,240,0.6);
          width: 100%;
          max-width: 420px;
          padding: 36px;
          animation: reg-fade 0.6s ease 0.1s both;
        }

        /* "Create account" heading */
        .reg-title {
          font-size: 24px;
          font-weight: 800;
          text-align: center;
          color: #0f172a;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        /* subtitle under heading */
        .reg-subtitle {
          font-size: 14px;
          text-align: center;
          color: #64748b;
          margin: 0 0 28px;
        }

        /* form layout — vertical stack with 18px gap */
        .reg-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* label text above each input */
        .reg-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        /* text input fields (name, email, password) */
        .reg-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          background: #f8fafc;
          box-sizing: border-box;
        }

        /* input focus state — purple border + glow */
        .reg-input:focus {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        /* password input needs right padding so text doesn't go under the eye icon */
        .reg-input-password {
          padding-right: 44px;
        }

        /* wrapper for password input + eye button (relative positioning) */
        .reg-password-wrapper {
          position: relative;
        }

        /* eye toggle button — sits inside the password input on the right */
        .reg-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          color: #94a3b8;
        }

        /* submit button — purple gradient */
        .reg-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
        }
        .reg-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -6px rgba(99,102,241,0.4);
        }
        .reg-btn:disabled {
          opacity: 0.6;
          transform: none;
          cursor: not-allowed;
        }

        /* bottom text — "Already have an account?" */
        .reg-footer {
          font-size: 14px;
          margin-top: 24px;
          text-align: center;
          color: #64748b;
        }

        /* "Sign in" clickable text */
        .reg-signin {
          color: #6366f1;
          cursor: pointer;
          font-weight: 600;
        }
        .reg-signin:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* ============ LOGO SECTION ============ */}
      {/* displays the app icon and brand name at the top */}
      <div className="reg-logo">
        {/* purple square with document icon inside */}
        <div className="reg-logo-icon">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M7 8h10M7 12h6M7 16h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        {/* brand name — "Resume" in black, "AI" in purple */}
        <span className="reg-logo-text">Resume<span className="reg-logo-highlight">AI</span></span>
      </div>

      {/* ============ REGISTER CARD ============ */}
      {/* white card container holding the form */}
      <div className="reg-card">
        {/* heading */}
        <h2 className="reg-title">Create account</h2>
        {/* subtitle */}
        <p className="reg-subtitle">Get started with AI-powered resumes</p>

        {/* ============ REGISTER FORM ============ */}
        {/* onSubmit calls handleSubmit when user presses Enter or clicks button */}
        <form onSubmit={handleSubmit} className="reg-form">

          {/* ---- NAME FIELD ---- */}
          <div>
            {/* label above the name input */}
            <label className="reg-label">Full Name</label>
            {/* name input — onChange fires handleChange which updates the state */}
            <input
              type="text"
              name="name"
              onChange={handleChange}
              className="reg-input"
              required
              data-testid="name-input"
            />
          </div>

          {/* ---- EMAIL FIELD ---- */}
          <div>
            {/* label above the email input */}
            <label className="reg-label">Email</label>
            {/* email input — value updates form.email state */}
            <input
              type="email"
              name="email"
              onChange={handleChange}
              className="reg-input"
              required
              data-testid="email-input"
            />
          </div>

          {/* ---- PASSWORD FIELD ---- */}
          <div>
            {/* label above the password input */}
            <label className="reg-label">Password</label>
            {/* wrapper div — position:relative so the eye button can sit inside */}
            <div className="reg-password-wrapper">
              {/* password input — type switches between "password" and "text" */}
              {/* when showPassword is true → type="text" (visible) */}
              {/* when showPassword is false → type="password" (hidden dots) */}
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleChange}
                className="reg-input reg-input-password"
                required
                data-testid="password-input"
              />
              {/* eye toggle button — clicking flips showPassword true/false */}
              {/* type="button" prevents it from submitting the form */}
              <button
                type="button"
                className="reg-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                data-testid="toggle-password"
              >
                {/* show eye-off icon when password is visible (click to hide) */}
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  /* show eye-open icon when password is hidden (click to show) */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ---- SUBMIT BUTTON ---- */}
          {/* clicking submits the form and triggers handleSubmit */}
          <button type="submit" disabled={loading} className="reg-btn" data-testid="submit-button">Create Account</button>
        </form>

        {/* ============ FOOTER ============ */}
        {/* link to login page for existing users */}
        <p className="reg-footer">
          Already have an account?{" "}
          {/* clicking "Sign in" navigates to /login */}
          <span className="reg-signin" data-testid="signin-text" onClick={() => navigate("/login")}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;