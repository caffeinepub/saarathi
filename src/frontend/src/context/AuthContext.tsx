import type { Ed25519KeyIdentity } from "@dfinity/identity";
import type { Identity } from "@icp-sdk/core/agent";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import type { UserProfile } from "../backend";
import {
  clearIdentity,
  loadIdentity,
  saveIdentity,
} from "../utils/identityUtils";

interface AuthState {
  isLoggedIn: boolean;
  profile: UserProfile | null;
  identity: Identity | null;
  login: (profile: UserProfile, identity: Ed25519KeyIdentity) => void;
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

  const [identity, setIdentity] = useState<Identity | null>(() => {
    return loadIdentity();
  });

  const login = useCallback((p: UserProfile, id: Ed25519KeyIdentity) => {
    setProfile(p);
    setIdentity(id);
    localStorage.setItem("saarathi_profile", JSON.stringify(p));
    saveIdentity(id);
  }, []);

  const logout = useCallback(() => {
    setProfile(null);
    setIdentity(null);
    localStorage.removeItem("saarathi_profile");
    clearIdentity();
  }, []);

  const updateProfile = useCallback((p: UserProfile) => {
    setProfile(p);
    localStorage.setItem("saarathi_profile", JSON.stringify(p));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!profile,
        profile,
        identity,
        login,
        logout,
        updateProfile,
      }}
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
