import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import type { UserProfile } from "../backend";

interface AuthState {
  isLoggedIn: boolean;
  profile: UserProfile | null;
  login: (profile: UserProfile) => void;
  logout: () => void;
  updateProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("saarathi_profile");
      return saved ? (JSON.parse(saved) as UserProfile) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((p: UserProfile) => {
    setProfile(p);
    localStorage.setItem("saarathi_profile", JSON.stringify(p));
  }, []);

  const logout = useCallback(() => {
    setProfile(null);
    localStorage.removeItem("saarathi_profile");
  }, []);

  const updateProfile = useCallback((p: UserProfile) => {
    setProfile(p);
    localStorage.setItem("saarathi_profile", JSON.stringify(p));
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn: !!profile, profile, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
