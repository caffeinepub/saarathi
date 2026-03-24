# SAARATHI — Messenger-First Restructure

## Current State
- App opens on Dashboard (AppLayout default page = "dashboard")
- Messenger is one of 6 nav tabs: Dashboard, Messenger, 5W Activities, Business Suite, AI Assistant, Settings
- ChatArea has static AI action bar with fixed buttons: Reply, Create Task, Create Invoice
- ActivitiesPage shows tasks without urgency visuals or "From Conversations" section
- Business invoices lack Mark as Paid, Send Reminder, due countdown
- Nudge button sends a basic reminder message with no tone options
- AI Assistant is a prominent top-level nav item
- Subgroup chats show context header but no workspace tabs (Chat/Tasks/Files/Payments)
- No Today Summary strip at top of Messenger

## Requested Changes (Diff)

### Add
- Today Summary strip at top of MessengerPage (above sidebar+chat layout): shows 🔴 Pending Actions count, ⚠️ Overdue count, 💰 ₹ Due total, 💬 Unread count — each clickable to navigate
- Subgroup workspace tabs inside ChatArea when a group is selected: Chat | Tasks | Files | Payments (default: Chat); Tasks tab filters activities by groupId; Payments tab shows invoices linked to group
- Dynamic AI action bar: analyze last message content, show context-aware button (Schedule Meeting if "meet"/"call", Create Task if "send"/"review", Create Invoice if "invoice"/"payment"), always keep AI Reply
- Smart inline typing suggestions: chip row above input showing "Reply politely" / "Ask for payment" / "Schedule meeting" based on typed text; click to fill draft
- Urgency visual system in ActivitiesPage: overdue items get red border + pulse animation + "Overdue by N days" label; today items get amber highlight + "Due today" label
- "From Conversations" section in ActivitiesPage below existing tasks list, showing chat-linked tasks grouped by subgroup
- Nudge modal with tone options: Gentle / Urgent / Custom before sending reminder into chat
- Mark as Paid button on invoices in BusinessSuitePage
- Send Reminder button on invoices → posts message into linked chat
- Due countdown label on invoices: "Due in N days" or "Overdue by N days"
- Empty state guidance improvements: Chat empty state, Activities empty state, Business empty state
- Persistent context strip on subgroup chat: shows breadcrumb path (📂 School / Class 3) + 👥 N members · N pending actions · ₹N pending

### Modify
- AppLayout: change default activePage from "dashboard" to "messenger"
- AppLayout NAV_ITEMS: de-emphasize AI Assistant (move to bottom, smaller style, or mark as secondary)
- MessengerPage: add Today Summary strip at top spanning full width above the sidebar+chat area
- ChatArea: make AI action bar dynamic based on last message content; add typing suggestion chips; add workspace tabs for group chats
- ActivitiesPage: add urgency visuals + labels + "From Conversations" section
- BusinessSuitePage: add Mark as Paid, Send Reminder, due countdown to invoice list items

### Remove
- Nothing removed — only behavior enhancement and additions

## Implementation Plan
1. AppLayout.tsx: set default page to "messenger"; move AI nav item to bottom/de-emphasize it visually
2. MessengerPage.tsx: add TodaySummaryStrip component above the flex row (sidebar+chat), reading from localStorage for counts
3. ChatArea.tsx: 
   a. Add workspace tabs (Chat/Tasks/Files/Payments) when currentChat.type === "group"
   b. Make AI action bar dynamic — scan last message content for keywords
   c. Add typing suggestion chips above input
   d. Enhance subgroup context strip with breadcrumb + stats
4. ActivitiesPage.tsx: add urgency CSS (red pulse for overdue, amber for today), due labels, "From Conversations" section
5. BusinessSuitePage.tsx: add Mark as Paid toggle, Send Reminder button, due countdown badge on invoice rows
6. NudgeModal: add tone selector (Gentle/Urgent/Custom) before sending nudge message
