# Simple Feature Parity Plan - React to Match Unity

**STATUS: UPDATED - See [2SeptPlayfabTasks.md](./2SeptPlayfabTasks.md) for current implementation plan**

## What Unity Currently Does (Keep It Simple)

### Task Loading
- Unity: Downloads tasks from server API, caches locally
- **React needs**: Same behavior - fetch from PlayFab, cache if needed

### User Features  
- Unity: Anonymous login via PlayFab (`LoginWithCustomID`)
- Unity: Leaderboard display (`GetLeaderboard`)
- Unity: Score submission (`UpdatePlayerStatistics`) 
- Unity: Event logging (`WritePlayerEvent`)
- **React needs**: Exact same PlayFab calls

## REVISED Implementation Order (Sept 2, 2025)

**Critical Insight**: Task migration must come FIRST to avoid breaking React's PlayFab service.

### Phase 1: Task Migration (DO FIRST) ✅ IN PROGRESS
- Build migration script to upload all server tasks to PlayFab Title Data  
- Validate all 155+ tasks are properly stored and retrievable
- Ensure PlayFab becomes single source of truth

### Phase 2: Update React (DO SECOND) ✅ IN PROGRESS  
- Switch React from `/api/tasks` to PlayFab service (already implemented)
- Update FIQTest and other task-consuming pages
- Test all React functionality with PlayFab data

### Phase 3: Update Unity (DO THIRD)
- Replace `https://sfmc.up.railway.app/api/tasks` with PlayFab `GetTitleData()`
- Keep all other PlayFab functionality (auth, leaderboards, events)
- Test Unity with PlayFab task data

### Phase 4: Remove Railway Dependency (DO LAST)
- Both platforms use PlayFab
- Server API eliminated

## Result: Feature Parity
- Both Unity and React do exactly the same thing
- Both use PlayFab for everything
- Your task editing workflow preserved
- No more server maintenance