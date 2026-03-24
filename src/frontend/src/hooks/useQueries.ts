import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type UserProfile, UserRole } from "../backend";

// ---------------------------------------------------------------------------
// Local-storage based auth helpers (no canister dependency)
// ---------------------------------------------------------------------------

const USERS_KEY = "saarathi_users";

function getUsers(): Record<
  string,
  { password: string; profile: UserProfile }
> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsers(
  users: Record<string, { password: string; profile: UserProfile }>,
) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function localLogin(username: string, password: string): UserProfile {
  const users = getUsers();
  const entry = users[username.toLowerCase()];
  if (!entry) throw new Error("Username not found. Please create an account.");
  if (entry.password !== password) throw new Error("Incorrect password.");
  return entry.profile;
}

function localRegister(
  username: string,
  password: string,
  displayName: string,
  businessName: string,
): UserProfile {
  const users = getUsers();
  const key = username.toLowerCase();
  if (users[key])
    throw new Error("Username already taken. Please choose another.");
  const profile: UserProfile = {
    username,
    displayName,
    businessName,
    password: "", // not stored in profile object itself
    role: UserRole.user,
  };
  users[key] = { password, profile };
  saveUsers(users);
  return profile;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: { username: string; password: string }) => {
      return localLogin(username, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      username: string;
      password: string;
      displayName: string;
      businessName: string;
    }) => {
      return localRegister(
        data.username,
        data.password,
        data.displayName,
        data.businessName,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      const users = getUsers();
      const key = profile.username.toLowerCase();
      if (users[key]) {
        users[key].profile = profile;
        saveUsers(users);
      }
      localStorage.setItem("saarathi_profile", JSON.stringify(profile));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
