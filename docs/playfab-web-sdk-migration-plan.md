# PlayFab Web SDK Migration Plan

*Date: September 3, 2025*  
*Author: Claude Code Analysis*  
*Status: In Progress*

## Executive Summary

**Current Issue**: Application fails with "Cannot read properties of undefined (reading 'LoginWithCustomID')" because we're mixing CDN script loading with undefined object references.

**Solution**: Migrate to proper `playfab-web-sdk` npm package usage (already installed: v1.198.250815).

## Root Cause Analysis

### Current (Broken) Implementation
```javascript
// Loading via CDN script
script.src = 'https://download.playfab.com/PlayFabClientApi.js'

// Trying to use undefined objects
PlayFab.Client.LoginWithCustomID  // ❌ PlayFab.Client is undefined
```

### Architecture Mismatch
1. **CDN Script Approach**: Creates `PlayFabClientSDK` global object
2. **NPM Package Approach**: Provides `PlayFab` and `PlayFabClient` imports  
3. **Our Code**: Tries to use `PlayFab.Client` (doesn't exist in either approach)

## Correct Implementation Pattern

### Web SDK Import Structure
```javascript
import { PlayFab, PlayFabClient } from 'playfab-web-sdk'

// Configuration
PlayFab.settings.titleId = "19FACB"

// API Calls
PlayFabClient.LoginWithCustomID({
  TitleId: PlayFab.settings.titleId,
  CustomId: "device_unique_id",
  CreateAccount: true
}, LoginCallback)

PlayFabClient.GetUserData({
  TitleId: PlayFab.settings.titleId
}, GetUserDataCallback)
```

### Request Structure Requirements
- **TitleId**: Must be included in EVERY request object
- **Callbacks**: Standard Node.js pattern `(error, result) => {}`
- **Settings**: `PlayFab.settings.titleId` for global configuration

## Migration Steps

### Phase 1: Core Service Rewrite
**File**: `client/src/services/playfab/core.ts`

**Remove**:
- CDN script loading (`loadPlayFabSDK` method)
- Window object checks (`getPlayFab`, `getPlayFabClientSDK`)
- Promise wrapper complexity

**Add**:
- Import: `import { PlayFab, PlayFabClient } from 'playfab-web-sdk'`
- Simple initialization: `PlayFab.settings.titleId = titleId`
- Callback-to-promise wrapper for each API method

### Phase 2: Service File Updates
**Files**: `auth.ts`, `userData.ts`, `events.ts`, `leaderboards.ts`, `tasks.ts`, `validation.ts`, `profiles.ts`

**Pattern**:
```javascript
// Before (broken)
const result = await playFabCore.promisifyPlayFabCall(
  PlayFab.Client.LoginWithCustomID,
  request
)

// After (correct) 
const result = await playFabCore.promisifyPlayFabCall(
  PlayFabClient.LoginWithCustomID,
  { ...request, TitleId: PlayFab.settings.titleId }
)
```

### Phase 3: Request Structure Fix
**Add TitleId to all requests**:
- LoginWithCustomID: `{ TitleId, CustomId, CreateAccount }`
- GetUserData: `{ TitleId, Keys? }`  
- UpdateUserData: `{ TitleId, Data }`
- All other APIs: Include `TitleId` field

### Phase 4: Configuration Cleanup
**File**: `vite.config.ts`
- Remove `playfab-web-sdk` from externals (we want it bundled)

## Implementation Details

### Authentication Flow
```javascript
// Anonymous device ID login
const customId = localStorage.getItem('device_id') || generateDeviceId()

PlayFabClient.LoginWithCustomID({
  TitleId: PlayFab.settings.titleId,
  CustomId: customId,
  CreateAccount: true,
  InfoRequestParameters: {
    GetPlayerProfile: true
  }
}, (error, result) => {
  if (error) {
    console.error('Login failed:', error)
    return
  }
  
  // Success - result.data contains PlayFabId, etc.
  console.log('Login successful:', result.data.PlayFabId)
})
```

### User Data Operations
```javascript
// Get user data
PlayFabClient.GetUserData({
  TitleId: PlayFab.settings.titleId,
  Keys: ['rank', 'totalPoints', 'completedMissions']
}, callback)

// Update user data  
PlayFabClient.UpdateUserData({
  TitleId: PlayFab.settings.titleId,
  Data: {
    rank: 'Corporal',
    totalPoints: '1500'
  }
}, callback)
```

## Testing Criteria

### Success Indicators
- ✅ No "undefined" errors on page load
- ✅ Anonymous login completes successfully
- ✅ GetUserData returns player progress
- ✅ UpdateUserData saves changes
- ✅ Environment variables load correctly

### Test Sequence
1. Load app at `http://localhost:5176`
2. Check console for successful PlayFab initialization
3. Verify anonymous login creates/loads player
4. Confirm task data loads from Title Data
5. Test user data read/write operations

## Files Requiring Changes

| File | Change Type | Priority |
|------|-------------|----------|
| `core.ts` | Complete rewrite | 🔴 Critical |
| `auth.ts` | Import + API calls | 🟡 High |
| `userData.ts` | Import + API calls | 🟡 High |
| `events.ts` | Import + API calls | 🟠 Medium |
| `leaderboards.ts` | Import + API calls | 🟠 Medium |
| `tasks.ts` | Import + API calls | 🟠 Medium |
| `validation.ts` | Import + API calls | 🟠 Medium |
| `profiles.ts` | Import + API calls | 🟠 Medium |
| `vite.config.ts` | Remove external | 🟢 Low |

## Risk Mitigation

### Backup Strategy
- Current working state committed before changes
- Incremental testing after each file update
- Environment variables secured in project root

### Rollback Plan
- Git branch for migration work
- Ability to revert to CDN approach if needed
- Staged deployment approach

## Expected Outcomes

### Immediate Benefits
- Proper error handling instead of undefined references
- Type safety from npm package TypeScript definitions
- Consistent API call patterns across all services

### Long-term Benefits
- Easier maintenance and updates
- Better IDE support and autocomplete
- Alignment with PlayFab best practices

## Next Steps

1. **Document Review**: Validate this plan against existing codebase
2. **Implementation**: Follow migration steps systematically  
3. **Testing**: Verify each component works before proceeding
4. **Documentation**: Update changelog and commit messages
5. **Deployment**: Test in development environment

---

**Status**: Ready for implementation  
**Estimated Time**: 2-3 hours  
**Risk Level**: Medium (well-documented approach with rollback capability)