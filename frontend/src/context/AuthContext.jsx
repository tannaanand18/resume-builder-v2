import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';

const AuthContext = createContext();

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PUBLIC_PATHS = ['/forgot-password', '/reset-password', '/login', '/register'];

const isPublicPath = (pathname) =>
  PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.includes('/preview');

// ── Single ping with configurable timeout ──
async function pingServer(timeoutMs = 8000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${BACKEND_URL}/`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// ── Wake server: retry every 5s for up to 2 minutes ──
async function wakeUpServer(onWaking, onReady) {
  const awake = await pingServer(5000);
  if (awake) return true;

  onWaking(); // server sleeping — show wake screen

  for (let i = 0; i < 24; i++) { // 24 × 5s = 2 minutes max
    await new Promise(r => setTimeout(r, 5000));
    const isUp = await pingServer(8000);
    if (isUp) { onReady(); return true; }
  }

  onReady(); // give up after 2 min
  return false;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);
  const [wakeSeconds, setWakeSeconds] = useState(0);

  useEffect(() => {
    const pathname = window.location.pathname;

    // ✅ Public pages — skip EVERYTHING: no ping, no wake screen, no auth check
    if (isPublicPath(pathname)) {
      setLoading(false);
      setServerWaking(false);
      return;
    }

    // Load cached user immediately so UI isn't blank
    const cachedUser = localStorage.getItem('cachedUser');
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); }
      catch { localStorage.removeItem('cachedUser'); }
    }

    startAuthFlow();
  }, []);

  // Live timer on wake screen
  useEffect(() => {
    if (!serverWaking) { setWakeSeconds(0); return; }
    setWakeSeconds(0);
    const interval = setInterval(() => setWakeSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [serverWaking]);

  const startAuthFlow = async () => {
    await wakeUpServer(
      () => setServerWaking(true),
      () => setServerWaking(false),
    );
    await checkAuth();
  };

  const checkAuth = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
      localStorage.setItem('cachedUser', JSON.stringify(data));
    } catch {
      const cachedUser = localStorage.getItem('cachedUser');
      if (!cachedUser) setUser(null);
      sessionStorage.clear();
    } finally {
      setLoading(false);
      setServerWaking(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('cachedUser', JSON.stringify(userData));
    if (userData.access_token) localStorage.setItem('access_token', userData.access_token);
  };

  const logout = async () => {
    try { await logoutUser(); } catch { }
    setUser(null);
    localStorage.removeItem('cachedUser');
    localStorage.removeItem('access_token');
    sessionStorage.clear();
    try {
      document.cookie.split(';').forEach((c) => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    } catch { }
  };

  // ── Wake screen — only shown on protected routes ──
  if (serverWaking) {
    const minutes = Math.floor(wakeSeconds / 60);
    const seconds = wakeSeconds % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    const progressPct = Math.min((wakeSeconds / 90) * 100, 95);

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #faf5ff 100%)',
        fontFamily: "'Inter', system-ui, sans-serif", padding: 24, textAlign: 'center',
      }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
          @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        `}</style>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40, animation:'fadeIn 0.5s ease' }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M7 8h10M7 12h6M7 16h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize:26, fontWeight:800, color:'#0f172a' }}>
            Resume<span style={{ color:'#6366f1' }}>AI</span>
          </span>
        </div>

        {/* Spinner */}
        <div style={{ width:56, height:56, border:'5px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.9s linear infinite', marginBottom:28 }} />

        <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', margin:'0 0 10px' }}>
          Starting up the server...
        </h2>
        <p style={{ fontSize:14, color:'#64748b', maxWidth:340, lineHeight:1.7, margin:'0 0 12px' }}>
          Our free server takes <strong>~30–90 seconds</strong> to wake up after being idle.
          This only happens once — thank you for your patience! ☕
        </p>

        {/* Live timer badge */}
        <div style={{ fontSize:13, color:'#8b5cf6', fontWeight:700, background:'rgba(139,92,246,0.08)', padding:'5px 18px', borderRadius:20, marginBottom:20, border:'1px solid rgba(139,92,246,0.15)' }}>
          ⏱ Waiting: {timeStr}
        </div>

        {/* Progress bar (driven by actual elapsed seconds) */}
        <div style={{ width:280, height:6, background:'#e0e7ff', borderRadius:6, overflow:'hidden', marginBottom:20 }}>
          <div style={{ height:'100%', borderRadius:6, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', width:`${progressPct}%`, transition:'width 1s linear' }} />
        </div>

        {/* Dots */}
        <div style={{ display:'flex', gap:8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'#6366f1', animation:`pulse 1.2s ease-in-out ${i*0.3}s infinite` }} />
          ))}
        </div>

        <p style={{ fontSize:12, color:'#94a3b8', marginTop:28 }}>Free tier hosted on Render.com</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};