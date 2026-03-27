# SAARATHI

## Current State
Version 38 — all features built with localStorage-based auth and chat. Login/register stores users in browser localStorage, so users cannot be found from other devices and sessions are lost on browser clear.

## Requested Changes (Diff)

### Add
- `src/frontend/src/utils/identityUtils.ts` — derives deterministic Ed25519 identity from username+password using SHA-256; same credentials on any device produce the same ICP principal
- `src/frontend/src/utils/backendExtensions.ts` — typed bridge exposing group/message canister methods not in auto-generated bindings

### Modify
- `AuthContext.tsx` — stores derived identity alongside profile; provides it to consumers
- `useQueries.ts` — `useLoginMutation` and `useRegisterMutation` now call backend canister with derived identity instead of localStorage
- `useActor.ts` — uses credential-derived identity (from AuthContext) when available, falls back to anonymous
- `declarations/backend.did.js` + `backend.did.d.ts` + `backend.d.ts` — extended with Group, Message, DM types and all canister methods
- `LoginPage.tsx` — passes identity to `login()` context call
- `MessengerPage.tsx` — loads real groups from `listMyGroups()` on mount; sends messages to backend for non-demo chats; polls every 5s for new messages; creates groups/subgroups in canister
- `SettingsPage.tsx` — "Find Users" now uses `getAllPublicUsers()` (public query) instead of admin-only `getAllUsersByUsername()`

### Remove
- localStorage-only user storage (`saarathi_users` key) — credentials now verified by canister

## Implementation Plan
1. Identity derivation utility (SHA-256 seed → Ed25519KeyIdentity)
2. Auth mutations to call canister registerUser/login/getCallerUserProfile
3. AuthContext updated to hold derived identity
4. useActor updated to use credential identity
5. Backend bindings extended with full group/message types
6. MessengerPage hybrid: demo groups from localStorage, real groups from canister
7. Message sending: real groups/DMs fire-and-forget to canister
8. 5-second polling for incoming messages in active non-demo chats
9. Settings Find Users fixed to public query
