# SAARATHI

## Current State

The app has mock/demo data scattered across multiple files:

- **Messenger** (`sampleData.ts`): `SAMPLE_USERS`, `makeSampleGroups()`, `makeSampleMessages()` — demo groups (Sales Team, North Zone, Operations, Finance & GST) and DM conversations with Priya, Rajesh, Ravi, Meena, Ankit, Sunita.
- **Activities** (`ActivitiesPage.tsx`): `_INITIAL_ACTIVITIES` — 4 hardcoded demo activities (GST Filing, Monthly Sales Review, Client Site Visit, Vendor Reconciliation), all with `isDemo: true`.
- **Business Suite** (`BusinessSuitePage.tsx`): `_INITIAL_CLIENTS` (3 clients), `_INITIAL_PRODUCTS` (4 products), `_INITIAL_DOCS` (3 docs: 1 invoice + 1 estimate + 1 proposal).
- **Settings** (`SettingsPage.tsx`): `DEMO_CONTACT_IDS` for 4 demo contacts.

The onboarding flow is a 4-step tooltip/modal walkthrough shown on first login.

## Requested Changes (Diff)

### Add
- Fresh, coherent mock data set for first-time user welcome training — all data should tell a consistent story about a single Indian small business (e.g. "Tattva Traders", a small trading/consulting firm in Maharashtra), making it feel realistic and immediately useful for training.
- New mock data should be clearly labeled `isDemo: true` and seeded only when `saarathi_demo_cleared` is NOT set.
- Onboarding flow should reference the new mock data scenario so the training context is clear.

### Modify
- Replace ALL existing mock data in `sampleData.ts` (SAMPLE_USERS, makeSampleGroups, makeSampleMessages) with new, richer, contextually coherent data.
- Replace `_INITIAL_ACTIVITIES` in `ActivitiesPage.tsx` with fresh activities aligned to the new business scenario.
- Replace `_INITIAL_CLIENTS`, `_INITIAL_PRODUCTS`, `_INITIAL_DOCS` in `BusinessSuitePage.tsx` with fresh business data aligned to the new scenario.
- Replace `DEMO_CONTACT_IDS` in `SettingsPage.tsx` to match new demo contacts.
- Update onboarding step descriptions to reflect the new demo scenario.

### Remove
- Old mock data: old clients (Innovate Solutions, Green Valley, Patel Enterprises), old products (Software Consulting, Office Furniture, Printed Stationery, AMC), old invoices (INV-001/EST-001/PRO-001 with old clients), old activities (a1/a2/a3/a4), old demo users (priya/rajesh/meena/ankit/sunita/ravi), old groups (Sales Team/North Zone/Operations/Finance & GST), old demo messages.

## Implementation Plan

### New Demo Scenario: "Tattva Traders" — a small import/export & consulting firm in Pune, Maharashtra

Demo users:
- Kavya Nair (kavya.nair) — Sales Manager
- Suresh Mehta (suresh.mehta) — Accounts
- Deepika Joshi (deepika.joshi) — Operations
- Arjun Singh (arjun.singh) — Field Executive

Demo groups:
- "Tattva Traders Team" (main group, all members)
- "Accounts & GST" (subgroup of main, Suresh + current user)
- "Client Projects" (top-level, Kavya + Arjun + current user)

Demo DMs: Kavya, Suresh, Arjun

Demo messages tell a coherent story: follow-up on a new client proposal, GST filing reminder, payment collection, field visit coordination.

Demo activities:
1. GST Return Filing — Q4 (due in 3 days, pending) — linked to Accounts & GST
2. Follow-up Call — Verma Industries (due tomorrow, pending) — linked to Kavya DM
3. Send Revised Proposal — Kapoor Exports (accepted, in progress)
4. Collect Advance Payment — New Client (pending)

Demo clients:
1. Verma Industries — Nagpur, Maharashtra
2. Kapoor Exports — Surat, Gujarat
3. Bharat Tech Solutions — Pune, Maharashtra

Demo products:
1. Export Consulting (service) — ₹3,500/hr — 18% GST
2. Import Documentation — ₹8,000/set — 18% GST
3. Business Registration — ₹12,000/set — 18% GST
4. Annual Compliance Package — ₹45,000/yr — 18% GST

Demo docs:
1. INV-001 — Verma Industries — ₹35,000 — sent, due in 10 days
2. EST-001 — Kapoor Exports — ₹96,000 estimate — draft
3. PRO-001 — Bharat Tech Solutions — Annual Compliance — proposal

Onboarding text updated to reference "See how Tattva Traders uses SAARATHI" to ground the user in the demo scenario.
