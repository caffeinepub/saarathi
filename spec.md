# SAARATHI — Proactive AI & Money Snapshot Update

## Current State
- Messenger is home with Today Summary strip showing pending/overdue/due/unread
- ChatArea has static AI action bar, smart typing suggestions, and intent-based buttons
- BusinessSuitePage stores invoices in localStorage as `saarathi_business_docs`
- No commitment tracking, no proactive banners, no monthly money snapshot
- Today Summary shows hardcoded fallback amounts when no real data exists

## Requested Changes (Diff)

### Add
- **Stage 1 commitment hint**: After a message is sent, if it contains commitment words ("I will", "will send", "tomorrow", "later", "I'll"), show inline suggestion row below composer: ⚠ "Create follow-up task?" [Yes] [Dismiss]. Tapping Yes stores commitment as acted=true and navigates to activities. Dismissing sets it dismissed without creating task.
- **localStorage commitment storage**: Save detected commitments as `saarathi_commitments` array of {text, timestamp, acted: boolean}.
- **Stage 2 banner**: In MessengerPage (or App-level), on mount check `saarathi_commitments` for any entries where acted=false AND timestamp is older than 20 minutes. If found, show a dismissible banner at the top of the app (below Today Summary): ⚠ "You said you'd follow up — still pending" [Create Task] [Remind Later]. "Create Task" marks acted=true and navigates to activities. "Remind Later" snoozes (sets timestamp = now, so it won't trigger again for another 20 min).
- **Auto-Invoice card**: When the last sent message contains "invoice" or "payment", show an inline action card below the composer (above AI action bar): 💰 Invoice Draft Ready, Client: [detected name or last client], Amount: ₹XX,XXX. Amount priority: (1) last invoice in localStorage for that client, (2) amount regex from message, (3) default ₹10,000. Microcopy "Based on previous invoice" if using prior invoice amount. [Send Now] creates invoice in localStorage, posts a chat message "📄 Invoice [number] sent to [client]", and dismisses card. [Edit] navigates to business with prefill and dismisses card.
- **Monthly Money Snapshot in BusinessSuitePage**: Add a MoneySnapshot card at the top of Business Suite. Hybrid logic: if `saarathi_business_docs` has any invoices from current month → calculate real Expected/Pending/Overdue. Otherwise show seeded values ₹1.2L / ₹68k / ₹18k with label "Sample data — start creating invoices". Auto-switches once real invoices exist.
- **Trend Indicator**: Below money snapshot, show ↑ "+12% from last month" (simulated initially; if real data has prior month comparison, calculate actual).

### Modify
- **MessengerPage.tsx**: Add Stage 2 banner check on mount. Import and render `CommitmentBanner` component above Today Summary strip.
- **ChatArea.tsx**: After `handleSend`, run commitment detection on the sent text and save to localStorage if match found; show Stage 1 hint row. Add auto-invoice card logic using last message content.
- **BusinessSuitePage.tsx**: Add `MoneySnapshot` component at page top with hybrid logic and trend indicator.

### Remove
- Nothing removed; purely additive.

## Implementation Plan
1. In `ChatArea.tsx`:
   - Add `pendingCommitment` state (null | {text, timestamp}) and `showCommitmentHint` boolean
   - After `handleSend` resolves, check sent text for commitment keywords → if match, save to localStorage commitments and set `showCommitmentHint = true`
   - Render commitment hint row between suggestions and file preview (or just above AI action bar): amber background, ⚠ text, Yes/Dismiss buttons
   - Add `autoInvoiceCard` state: show card when last sent message contains invoice/payment keywords; card reads localStorage for last client invoice; [Send Now] creates doc + posts message; [Edit] prefills and navigates
2. In `MessengerPage.tsx`:
   - Add `CommitmentBanner` component: checks localStorage on mount + sets up 60s interval re-check
   - Render above `TodaySummaryStrip`
3. In `BusinessSuitePage.tsx`:
   - Add `MoneySnapshot` component at top of the page, computing values from localStorage invoices with fallback to seed data
   - Add trend indicator row below snapshot
