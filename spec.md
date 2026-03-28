# SAARATHI

## Current State
Full-stack app (React + Motoko) with Messenger, Activities, Business Suite, Settings, and AI panel. All core data (users, groups, messages, activities, clients, products, invoices) is persisted in the backend canister. Demo data is seeded in localStorage for onboarding.

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
1. **config.ts `createActorWithConfig`**: The `actorOptions` spreads `...resolvedOptions` which includes `agentOptions`, then also sets `agent: agent`. This means both `agentOptions` and `agent` are passed to `createActor`, causing the "Detected both agent and agentOptions" warning repeatedly. Fix: destructure `agentOptions` out of `resolvedOptions` before building `actorOptions`, so `agentOptions` is never included in actorOptions.

2. **Modals.tsx `NewDMModal`**: Currently hardcoded to show only `SAMPLE_USERS`. Fix: Add `allUsers: LocalUser[]` prop to the component interface and use it instead of `SAMPLE_USERS`. Remove `SAMPLE_USERS` import usage in this component.

3. **MessengerPage.tsx**: Does not pass real contacts to `NewDMModal`. Fix: Load contacts from `saarathi_contacts` localStorage key, merge them with `dmContacts` (from backend), and pass the combined list as `allUsers` to `NewDMModal`. Contacts from Settings (name+phone) should be mapped to LocalUser format with id=`c_${contact.id}`, displayName=contact.name, username=contact.phone.

4. **MessengerPage.tsx `allUsers` array**: Currently built from `[currentUser, ...SAMPLE_USERS]`. Should also include contacts from `saarathi_contacts` so they appear throughout the app (chat group member pickers, etc.).

### Remove
- Nothing to remove

## Implementation Plan
1. Fix `config.ts`: destructure `{ agentOptions: _agentOpts, ...restOptions }` from `resolvedOptions` and use `restOptions` in `actorOptions` spread
2. Fix `Modals.tsx` NewDMModal: add `allUsers: LocalUser[]` prop, replace `SAMPLE_USERS` usage with it
3. Fix `MessengerPage.tsx`: 
   a. Load `saarathi_contacts` from localStorage and convert to LocalUser format
   b. Build a combined user list merging sample users + real contacts from Settings + dmContacts from backend
   c. Pass this as `allUsers` to `NewDMModal`
   d. Include real contacts in `allUsers` array used throughout the page
