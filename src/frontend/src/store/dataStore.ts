// Shared localStorage-backed data store for cross-module data sharing
// Phase 3: Activities and Business Suite data moved to backend canister.
// Only Messenger-related helpers remain here.

import type { LocalGroup, LocalUser } from "../pages/messenger/types";

// ─── Keys ────────────────────────────────────────────────────────────────────
const KEYS = {
  MESSENGER_GROUPS: "saarathi_groups",
  MESSENGER_USERS: "saarathi_messenger_users",
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const dataStore = {
  // Messenger
  getGroups: (fallback: LocalGroup[] = []): LocalGroup[] =>
    get(KEYS.MESSENGER_GROUPS, fallback),
  setGroups: (groups: LocalGroup[]): void => set(KEYS.MESSENGER_GROUPS, groups),
  getUsers: (fallback: LocalUser[] = []): LocalUser[] =>
    get(KEYS.MESSENGER_USERS, fallback),
  setUsers: (users: LocalUser[]): void => set(KEYS.MESSENGER_USERS, users),
};
