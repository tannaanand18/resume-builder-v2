import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder"; 
import { useAuth } from "./context/AuthContext";
import TemplateSelect from "./pages/TemplateSelect";
import AdminPanel from "./pages/AdminPanel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ShareButton from "./components/ShareButton";
import SharedResumeView from "./pages/SharedResumeView";
import ATSChecker from "./pages/ATSChecker";



function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // ✅ While auth is being checked, show nothing (prevents redirect race condition)
  if (loading) {
    return null;  // Return null, not a spinner - auth check is usually <100ms
  }

  // ✅ After loading completes, redirect if not authenticated
  return user ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/resume/:id/edit" element={<PrivateRoute><ResumeBuilder /></PrivateRoute>} />
        <Route path="/resume/new" element={<PrivateRoute><TemplateSelect /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} /> 
        <Route path="/resume/:id/preview" element={<SharedResumeView />} />
        <Route path="/ats-checker" element={<PrivateRoute><ATSChecker /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}