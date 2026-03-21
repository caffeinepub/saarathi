import { Toaster } from "@/components/ui/sonner";
import AppLayout from "./components/AppLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";

function AppInner() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <LoginPage />;
  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
