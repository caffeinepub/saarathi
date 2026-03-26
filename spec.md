# SAARATHI

## Current State
ChatArea.tsx has a floating AI panel (AIChatPanel in AppLayout) and an AI action bar at the bottom of chat with static/dynamic buttons. Creating a task navigates away to ActivitiesPage. Creating an invoice shows an inline card but the Edit button is small/hidden. There is no docked AI panel inside the chat screen itself.

## Requested Changes (Diff)

### Add
- A collapsible docked AI panel on the RIGHT side of the chat screen (toggleable via a `✨ AI` button in the chat header). When open, shows last 5 message context and a text input for AI commands (e.g. "create invoice for Girish ₹35,000").
- Inline editable task confirm card: when user clicks "Create Task" from the AI action bar OR types a task command, show an editable card IN the composer area (not navigate away). Card has: WHO (text), WHAT (text), WHEN (date/text), WHERE (text), WHY (text) — all pre-filled from chat context. Buttons: [Create Task] [Cancel].
- Inline editable invoice confirm card: same pattern — when invoice intent is detected or AI panel command is used, show editable card with Client, Amount, GST, Date, Description. Buttons: [Send Invoice] [Cancel].
- Inline editable proposal confirm card: when user types "create proposal" in AI panel, show card with Client, Title, Amount. Buttons: [Send Proposal] [Cancel].
- The docked AI panel processes natural language commands ("create task for Priya: submit report by tomorrow", "create invoice for Girish ₹35,000") and populates the inline confirm card.

### Modify
- `handleCreateTaskFromChat`: Instead of calling `onNavigate("activities")`, show the inline task confirm card pre-filled from chat context.
- `handleCreateInvoiceFromChat`: Instead of calling `onNavigate("business")`, show the inline invoice confirm card (same as auto-invoice edit mode but cleaner).
- Chat header: add a `✨ AI` toggle button that opens/closes the docked right panel.
- Layout when AI panel is open: chat messages + composer shrink to make room for the ~280px right panel.

### Remove
- Nothing removed. The floating AIChatPanel (AppLayout) remains as the "Advanced AI" panel.

## Implementation Plan
1. Add `showAIPanel` state to ChatArea.
2. Wrap the chat area content in a flex row: left=chat (flex-1), right=collapsible AI panel (w-72 when open).
3. Add docked AI panel component inline in ChatArea with: context summary of last 5 messages, a command input, proactive suggestions, and command processing logic.
4. Add `showInlineTaskCard` + `inlineTaskFields` state; replace navigation in handleCreateTaskFromChat.
5. Add inline task confirm card to renderComposer() above the composer input.
6. Ensure invoice inline edit card is always shown when `showAutoInvoice && invoiceEditMode` — make the Edit button immediately expand the form.
7. Add proposal inline card state and handling.
8. AI panel command parser: detect "create invoice", "create task", "create proposal" patterns and trigger respective inline cards.
