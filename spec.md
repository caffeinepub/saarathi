# SAARATHI — Targeted Bug Fix (v37)

## Current State
App has several critical bugs: login fails on revisit due to localStorage key collision, demo data reappears after clearing, task/invoice lifecycle is incomplete, and chat sync for paid invoices posts to wrong chat.

## Requested Changes (Diff)

### Add
- `isDemo: true` flag to all INITIAL_ACTIVITIES items in ActivitiesPage.tsx
- Subtitle text update in AIAssistantPage.tsx: "Use chat for daily actions. Use this for advanced queries."

### Modify

1. **dataStore.ts** — `KEYS.MESSENGER_USERS` must change from `"saarathi_users"` to `"saarathi_messenger_users"`. This is the root cause of the login bug: MessengerPage calls `dataStore.setUsers([...LocalUser[]])` which overwrites the auth dictionary stored under the same `saarathi_users` key, so the next login call reads an array instead of a dict and fails with "Username not found".

2. **MessengerPage.tsx** — Change message init to NOT always re-merge `makeSampleMessages()` base into stored data. Current logic: `const merged = { ...base }; // then merge stored on top`. This means demo messages always come back on page load even after clearing. Fix: if stored data exists, use it directly without merging base:
   ```ts
   if (stored) { return JSON.parse(stored); }
   return makeSampleMessages(...);
   ```

3. **ActivitiesPage.tsx** — Change loading logic so INITIAL_ACTIVITIES (now marked isDemo:true) are only used as fallback when nothing is stored. Current: always merges INITIAL_ACTIVITIES back. Fix: if stored data exists, return parsed directly:
   ```ts
   if (stored && parsed.length >= 0) { return parsed; }
   return INITIAL_ACTIVITIES;
   ```
   Also add `isDemo: true` to all 4 INITIAL_ACTIVITIES.

4. **SettingsPage.tsx — clearDemoData** — Improve cleanup:
   - After removing demo keys from `saarathi_messages` object, also remove ALL `saarathi_messages_*` individual keys that match any demo chat key (already partially done but needs to be comprehensive including DM keys)
   - Do NOT remove `saarathi_onboarded` flag
   - Show toast: "Demo data removed — now using real workspace"

5. **BusinessSuitePage.tsx — handleMarkAsPaid** — The chat message currently posts to hardcoded `group_g1`. Fix: use `doc.linkedChatId` if available, else fall back to `group_g1`. This ensures the message goes to the correct chat.

6. **ActivitiesPage.tsx — handleMarkDone** — Ensure it posts chat system message `"✅ Task completed: [title]"` (already implemented) and dispatches `saarathi_messages_updated` event (already implemented). Verify it works correctly.

7. **MessengerPage.tsx — saarathi_onboarded** — Already sets `localStorage.setItem("saarathi_onboarded", "true")` on onboarding complete/skip. Verify this is not cleared by demo data function.

### Remove
- Nothing removed

## Implementation Plan

1. Fix `dataStore.ts` MESSENGER_USERS key (1 line change)
2. Fix `MessengerPage.tsx` message init logic (replace merge-with-base pattern with direct stored use)
3. Fix `ActivitiesPage.tsx` INITIAL_ACTIVITIES: add isDemo:true + fix loading to not re-merge
4. Fix `SettingsPage.tsx` clearDemoData: ensure comprehensive key cleanup
5. Fix `BusinessSuitePage.tsx` Mark as Paid: use doc.linkedChatId
6. Validate build passes
