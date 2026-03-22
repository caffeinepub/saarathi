import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AppLayout from "./components/AppLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

function AppInner() {
  const { isLoggedIn } = useAuth();
  const [showLanding, setShowLanding] = useState(false);

  if (!isLoggedIn && showLanding) {
    return (
      <LandingPage
        onBack={() => setShowLanding(false)}
        onGetStarted={() => setShowLanding(false)}
      />
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onShowLanding={() => setShowLanding(true)} />;
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
