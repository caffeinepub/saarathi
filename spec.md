# SAARATHI

## Current State
Full-stack app with Motoko backend. Phase 3 migration moved all business data (clients, products, invoices/docs, activities) to the backend canister. However, `ChatArea.tsx` still reads from **localStorage** (`saarathi_business_docs`, `saarathi_clients`, `saarathi_products`) which are now empty — causing the AI invoice card to always default to ₹10,000 regardless of what is typed in chat.

`MessengerPage.tsx` fetches groups and DM contacts from backend but does NOT fetch or pass clients/docs/products to `ChatArea`.

## Requested Changes (Diff)

### Add
- `cachedClients: CanisterClient[]`, `cachedDocs: CanisterBusinessDoc[]`, `cachedProducts: CanisterProduct[]` state in `MessengerPage` — fetched from backend on actor ready
- Callbacks `onSaveDoc`, `onSaveClient`, `onSaveProduct` passed from `MessengerPage` to `ChatArea` for all inline create/save operations
- Amount detection in `computeAutoInvoice` to also scan the full chat context (last 10 messages), not just one message
- Regex to detect amounts like `35000`, `35,000`, `35k`, `₹35000` from recent chat messages

### Modify
- `MessengerPage.tsx`: after actor loads, also call `ext.listMyClients()`, `ext.listMyDocs()`, `ext.listMyProducts()` and store in state; pass all three as props to `<ChatArea>`
- `ChatArea.tsx` Props interface: add `cachedClients`, `cachedDocs`, `cachedProducts`, `onSaveDoc`, `onSaveClient`, `onSaveProduct`
- `DocPickerPanel` (lines ~100–120): use `cachedDocs` and `cachedClients` props instead of localStorage reads
- `computeAutoInvoice`: use `cachedClients` and `cachedDocs` props for client/invoice lookup; use full chat context (last 10 messages) for amount detection; improve amount regex
- All inline doc/client/product SAVE operations in `ChatArea` (lines ~2592–3366): call `onSaveDoc`, `onSaveClient`, `onSaveProduct` callbacks instead of writing directly to localStorage
- `MessengerPage` Today Summary Strip: fetch unpaid invoice total from `cachedDocs` instead of localStorage

### Remove
- All direct `localStorage.getItem('saarathi_business_docs')` / `localStorage.setItem('saarathi_business_docs')` calls in `ChatArea.tsx`
- All direct `localStorage.getItem('saarathi_clients')` / `localStorage.setItem('saarathi_clients')` calls in `ChatArea.tsx`
- All direct `localStorage.getItem('saarathi_products')` / `localStorage.setItem('saarathi_products')` calls in `ChatArea.tsx`

## Implementation Plan
1. `MessengerPage.tsx`:
   - Add `cachedClients`, `cachedDocs`, `cachedProducts` state
   - In the existing `loadBackendData` useEffect, also fetch `ext.listMyClients()`, `ext.listMyDocs()`, `ext.listMyProducts()` in the same `Promise.all`
   - Add callbacks: `handleSaveDoc` (calls `ext.createDoc` or `ext.updateDoc`), `handleSaveClient` (calls `ext.createClient`), `handleSaveProduct` (calls `ext.createProduct`)
   - Pass all to `<ChatArea>` as props
   - Fix the Today Summary amount calculation to use `cachedDocs` instead of localStorage

2. `ChatArea.tsx`:
   - Extend the `Props` interface with `cachedClients`, `cachedDocs`, `cachedProducts`, `onSaveDoc`, `onSaveClient`, `onSaveProduct`
   - In `DocPickerPanel`: use `cachedDocs` / `cachedClients` props
   - In `computeAutoInvoice(msgText)`: use `cachedClients` to find client by name; use `cachedDocs` to find last invoice for client; improve amount regex to scan `messages.slice(-10)` joined text; detect `₹35000`, `35000`, `35k`, `35,000 rs` patterns
   - In all inline doc-creation blocks (~3 places in ChatArea): replace `localStorage.getItem/setItem('saarathi_business_docs')` with `onSaveDoc(...)` callback; similarly for clients/products
   - Keep localStorage only for commitments (saarathi_commitments) which is UI-local state
