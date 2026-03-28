# SAARATHI

## Current State
Version 57. Issues: chat scroll broken (missing min-h-0), DM send race condition (message dropped if principal not yet resolved), DM sender shows raw principal string, Activities and Business Suite pages don't scroll.

## Requested Changes (Diff)

### Add
- Pending DM send queue for race condition fix

### Modify
- ChatArea.tsx: add min-h-0 to both scrollRef divs; fix msgCount stale trigger
- MessengerPage.tsx: queue DM sends when principal not yet resolved; fix DM sender display name lookup
- ActivitiesPage.tsx: fix outermost container to h-full overflow-y-auto
- BusinessSuitePage.tsx: same fix

### Remove
- Nothing

## Implementation Plan
1. Fix ChatArea scroll containers and trigger
2. Fix MessengerPage DM send race + sender name
3. Fix page scroll containers
