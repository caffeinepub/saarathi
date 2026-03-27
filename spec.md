# SAARATHI — Phase 3: Activities & Business Suite Backend Migration

## Current State
- User auth, groups, and chat (Phase 1 & 2) are on the backend canister
- Activities (tasks), Business Docs (invoices/estimates/proposals), Clients, and Products remain in localStorage via `dataStore`
- `dataStore.ts` wraps all reads/writes to localStorage keys: `saarathi_activities`, `saarathi_business_docs`, `saarathi_clients`, `saarathi_products`

## Requested Changes (Diff)

### Add
- Motoko types: `Activity`, `Client`, `Product`, `BusinessDoc`, `LineItem`, `ActivityAttachment`
- Motoko CRUD functions for each:
  - Activities: `createActivity`, `updateActivity`, `deleteActivity`, `listMyActivities`
  - Clients: `createClient`, `updateClient`, `deleteClient`, `listMyClients`
  - Products: `createProduct`, `updateProduct`, `deleteProduct`, `listMyProducts`
  - Business Docs: `createDoc`, `updateDoc`, `deleteDoc`, `listMyDocs`
- Frontend: async backend calls replacing all `dataStore.getActivities/setActivities`, `dataStore.getDocs/setDocs`, `dataStore.getClients/setClients`, `dataStore.getProducts/setProducts`
- Loading states in ActivitiesPage and BusinessSuitePage while fetching from canister
- 5-second polling for activities and business docs (same as chat)

### Modify
- `ActivitiesPage.tsx` — replace localStorage reads/writes with canister calls
- `BusinessSuitePage.tsx` — replace localStorage reads/writes with canister calls
- `dataStore.ts` — keep messenger-related helpers, remove or stub activity/business helpers (frontend now calls canister directly)
- `main.mo` — add Phase 3 types and functions

### Remove
- localStorage usage for activities, clients, products, business docs
- Demo seed data that was auto-loaded into localStorage for these modules (keep demo data for messenger groups only)

## Implementation Plan
1. Extend `main.mo` with Activity, Client, Product, BusinessDoc CRUD
2. Regenerate backend bindings
3. Update `ActivitiesPage.tsx` to use canister
4. Update `BusinessSuitePage.tsx` to use canister
5. Update `dataStore.ts` to remove activity/business helpers
6. Validate build
