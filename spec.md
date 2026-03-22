# SAARATHI

## Current State
- AIChatPanel creates tasks by writing to `saarathi_activities` in localStorage but ActivitiesPage never reads from localStorage on mount — it only uses hardcoded INITIAL_ACTIVITIES
- AIChatPanel sends messages by writing to `saarathi_messages` in localStorage but MessengerPage never reads from localStorage — it uses in-memory React state seeded from sample data only
- ActivitiesPage "Send to Messenger" writes to `saarathi_pending_task_message` but MessengerPage never reads that key
- AIChatPanel ParsedConfirmCard is read-only — user cannot edit WHO/WHAT/WHEN/WHERE/WHY before confirming
- AIChatPanel `confirmTask` ignores the parsed `when` string and always hardcodes tomorrow's date
- AIChatPanel "Send to Messenger" chat picker only shows groups, no DM option
- New DM button is at bottom-left instead of bottom-right

## Requested Changes (Diff)

### Add
- Editable fields in the AI ParsedConfirmCard so user can modify WHO, WHAT, WHEN, WHERE, WHY before confirming
- DM contacts as options in the AI "Send to Messenger" chat picker (beside groups)
- DM option in messenger sidebar as a separate quick-action (already exists, ensure bottom-right)

### Modify
- ActivitiesPage: initialize activities state from localStorage (`saarathi_activities`) on mount, falling back to INITIAL_ACTIVITIES. Merge so both sample + AI-created tasks appear
- MessengerPage: initialize messages state from localStorage (`saarathi_messages`) on mount (merge with sample). Save messages back to localStorage on every update. On mount, check `saarathi_pending_task_message` and inject into the right chat then clear the key
- AIChatPanel `confirmTask`: correctly parse the `when` field into an ISO dateTime string rather than always using tomorrow
- AIChatPanel `getAvailableChats()`: include DM contacts (`saarathi_contacts` + `saarathi_users`) in the picker list alongside groups
- New DM FAB: ensure it is positioned at bottom-right (not bottom-left)

### Remove
- Nothing removed

## Implementation Plan
1. Fix ActivitiesPage to read `saarathi_activities` from localStorage on mount and merge with existing state
2. Fix MessengerPage to read/write `saarathi_messages` from localStorage; poll/check `saarathi_pending_task_message` on mount and inject
3. Fix AIChatPanel ParsedConfirmCard to render editable input fields for each 5W field that user can change before clicking confirm
4. Fix AIChatPanel `confirmTask` to parse the `when` string into a proper ISO dateTime
5. Fix AIChatPanel `getAvailableChats()` to include DM contacts as `dm_*` entries
6. Move New DM FAB to bottom-right in MessengerPage
