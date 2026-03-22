import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AppLayout from "./components/AppLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

function AppInner() {
  const { isLoggedIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (!isLoggedIn && !showLogin) {
    return (
      <LandingPage
        onGetStarted={() => setShowLogin(true)}
        onSignIn={() => setShowLogin(true)}
      />
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onBack={() => setShowLogin(false)} />;
  }

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
