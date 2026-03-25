# SAARATHI

## Current State

Invoice state in `BusinessSuitePage` is loaded from localStorage once on mount into React `useState`. The `ChatArea.tsx` "Send Now" button correctly writes a new invoice to `saarathi_business_docs` in localStorage, but this never triggers a re-render in `BusinessSuitePage` because the React state is stale. Similarly, `MoneySnapshot` reads localStorage only on mount. The "Edit" button navigates to Business and writes `saarathi_prefill_invoice`, but the `useEffect` that reads it only shows a toast — it never opens the invoice form.

## Requested Changes (Diff)

### Add
- Custom event `saarathi:docs-updated` dispatched from `ChatArea.tsx` after "Send Now" writes to localStorage
- `useEffect` in `BusinessSuitePage` listening for `saarathi:docs-updated` to reload `docs` from `saarathi_business_docs` and `clients` from `saarathi_clients` into React state
- Same listener in `MoneySnapshot` to recompute the snapshot when the event fires
- `useEffect` in `BusinessSuitePage` that reads `saarathi_prefill_invoice` must open the invoice form (`setShowForm(true)`) pre-filled with the client and amount from the prefill key

### Modify
- `ChatArea.tsx` "Send Now" handler: after `localStorage.setItem('saarathi_business_docs', ...)`, dispatch `window.dispatchEvent(new CustomEvent('saarathi:docs-updated'))`
- `BusinessSuitePage` prefill `useEffect`: after reading `saarathi_prefill_invoice`, open the invoice form with the pre-filled client and amount (set `editDoc` to a new blank invoice with client name resolved, and call `setShowForm(true)`)
- `MoneySnapshot` `useEffect`: wrap calculation in a reusable function; add `window.addEventListener('saarathi:docs-updated', recalculate)` with cleanup

### Remove
- Nothing removed

## Implementation Plan

1. In `ChatArea.tsx`, after the `localStorage.setItem('saarathi_business_docs', ...)` call in the "Send Now" handler, add: `window.dispatchEvent(new CustomEvent('saarathi:docs-updated'))`
2. In `BusinessSuitePage`, add a `useEffect` that adds an event listener for `saarathi:docs-updated`; on fire, re-read `saarathi_business_docs` and `saarathi_clients` from localStorage and call `setDocs` and `setClients` to update React state
3. In `MoneySnapshot`, extract the calculation into a `recalculate` function, call it on mount and on `saarathi:docs-updated` event
4. In `BusinessSuitePage` prefill `useEffect`: after reading and removing `saarathi_prefill_invoice`, resolve the client (find existing or create placeholder), build a blank `BusinessDoc` of type `invoice` with the pre-filled amount and client, set it as `editDoc`, and call `setShowForm(true)` to open the form
