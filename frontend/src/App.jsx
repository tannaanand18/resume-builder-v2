import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes";
import AIAgent from "./components/AIAgent";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <AIAgent />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
