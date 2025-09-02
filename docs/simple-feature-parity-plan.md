# Simple Feature Parity Plan - React to Match Unity

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

### Data Migration (One Time)
- Move all 155+ tasks from `d:\1Projects\sfmc\data\tasks\` to PlayFab
- Unity switches from server API to PlayFab  
- React fetches from PlayFab
- Done.

## Implementation Steps

### 1. One-Time Task Migration
- Build sync script to upload all JSON files to PlayFab Title Data
- Test that PlayFab returns all tasks correctly

### 2. Update Unity 
- Replace `https://sfmc.up.railway.app/api/tasks` with PlayFab `GetTitleData()`
- Keep everything else exactly the same

### 3. Update React
- Add same PlayFab calls Unity uses:
  - `LoginWithCustomID` for auth
  - `GetTitleData()` for tasks  
  - `UpdatePlayerStatistics` for scores
  - `GetLeaderboard` for rankings
  - `WritePlayerEvent` for tracking

### 4. Remove Railway Dependency
- Both platforms use PlayFab
- Server eliminated

## Result: Feature Parity
- Both Unity and React do exactly the same thing
- Both use PlayFab for everything
- Your task editing workflow preserved
- No more server maintenance