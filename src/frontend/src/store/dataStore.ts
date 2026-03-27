// Shared localStorage-backed data store for cross-module data sharing

import type { LocalGroup, LocalUser } from "../pages/messenger/types";

// ─── Keys ────────────────────────────────────────────────────────────────────
const KEYS = {
  MESSENGER_GROUPS: "saarathi_groups",
  MESSENGER_USERS: "saarathi_messenger_users",
  ACTIVITIES: "saarathi_activities",
  BUSINESS_DOCS: "saarathi_business_docs",
  CLIENTS: "saarathi_clients",
  PRODUCTS: "saarathi_products",
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

  // Activities - generic since Activity type is defined in ActivitiesPage
  getActivities: <T>(fallback: T[] = []): T[] => get(KEYS.ACTIVITIES, fallback),
  setActivities: <T>(activities: T[]): void => set(KEYS.ACTIVITIES, activities),

  // Business Suite - generic
  getDocs: <T>(fallback: T[] = []): T[] => get(KEYS.BUSINESS_DOCS, fallback),
  setDocs: <T>(docs: T[]): void => set(KEYS.BUSINESS_DOCS, docs),
  getClients: <T>(fallback: T[] = []): T[] => get(KEYS.CLIENTS, fallback),
  setClients: <T>(clients: T[]): void => set(KEYS.CLIENTS, clients),
  getProducts: <T>(fallback: T[] = []): T[] => get(KEYS.PRODUCTS, fallback),
  setProducts: <T>(products: T[]): void => set(KEYS.PRODUCTS, products),
};
