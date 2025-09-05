# CORRECTED Officer Track AI-Curated Plan

## CRITICAL ARCHITECTURE REMINDER

**SFMC IS A STATIC-ONLY APPLICATION - NO BACKEND ALLOWED!**

- ✅ **SFMC**: Pure static React app deployed as static site
- ✅ **PlayFab**: ONLY backend - contains 2,020 puzzles in Title Data  
- ✅ **arc-explainer**: External HTTP API called from browser
- ❌ **NO SERVER CODE** - no database connections, no backend services
- ❌ **NO MOCK DATA** - use real API endpoints only

## Current Confirmed State

### PlayFab Data (September 4, 2025)
- ✅ 2,020 ARC puzzles successfully uploaded across 20 batches
- ✅ Puzzle IDs: `ARC-TR-007bbfb7`, `ARC-EV-1ae2feb7`, etc.
- ✅ arcDataService.ts loading works (Client API format fixed)
- ✅ Batch structure: `officer-tasks-training-batch1.json` etc.

### arc-explainer API Available
- ✅ Running server with `/api/puzzle/worst-performing` endpoint
- ✅ Database contains AI performance data with `prediction_accuracy_score`
- ✅ "Trustworthiness" data - puzzles AI cannot solve reliably
- ✅ Real performance metrics: accuracy, confidence, feedback

## Implementation Tasks

### Task 2: Create HTTP API Client
- [x] Create `client/src/services/arcExplainerAPI.ts`
- [x] Implement browser fetch() calls to arc-explainer endpoints
- [x] Handle CORS and authentication if needed
- [x] Add proper error handling and caching

### Task 3: Create React Hook
- [x] Create `client/src/hooks/useWorstPerformingPuzzles.ts`
- [x] Copy exact hook structure from arc-explainer project
- [x] Point API calls to external arc-explainer server
- [x] Return same data structure for compatibility

### Task 3.5: FIX UI DISPLAY
- [ ] Fix `client/src/pages/OfficerTrack.tsx` to display data correctly, check for hardcoded mobile layout, placeholders and simulated data or UI.  
- [ ] makes sure you are calling our other app at arc-explainer.railway.internal for all the API calls that arent PlayFab calls.
- [x] It should be using real data from the API and from PlayFab.

### Task 3.5.1: FIX Layout!
- [x] Stop using mobile layout use full width instead
- [x] Fix puzzle grid display so they do not overlap!!!
- [x] Improve the Example 1, Example 2 etc display - make it easier to compare them side by side, without overlapping the puzzle grid.
- [x] Make sure the puzzle ID is stripped of the ARC-TR- or ARC-EV- prefix and correctly displaying a badge showing if it is a training or evaluation puzzle.  Like the arc-explainer project does.
- [x] Allow users to switch between emoji sets and number/color display for the puzzle grid. export const EMOJI_SET_INFO is what it is in the constants file spaceEmojis.ts.  Check the arc-explainer project for the implementation along with the alien meaning display if you need to.
- [x] Add support for multiple test cases (1-3) with tabbed interface
- [x] Implement dynamic grid sizing that adapts to puzzle dimensions (3x3=large, 30x30=tiny)  

### Task 3.6: Improve Puzzle Grid User Experience
- [ ] Improve user input possibilities in the puzzle grid.
- [ ] Allow users to copy from the input grid to the output grid easily.
- [ ] Allow users to fast select from a display of the emojis in the puzzle, rather than making then cycle.
- [ ] Allow users to click and drag to select multiple cells at once.
- [ ] Allow users to right click to clear a cell.

### Task 4: Investigate Solution Validation With PlayFab
- [ ] Investigate how to validate a solution with PlayFab.
- [ ] Determine why we get this.officerTrack.validateARCSolution is not a function
- [ ] Ultrathink and find out if it already exists somewhere in the project.  I am missing something obvious and I am sure it does.  I thought we even had local validation before so users can't spam the server with invalid solutions.  Check the old code.
- [ ] We might just need to add it to PlayFab correctly.

### Task 5: Create AI Difficulty Cards
- [ ] Create `client/src/components/game/OfficerDifficultyCards.tsx`
- [ ] Show stats: Impossible (0%), Extremely Hard (0-25%), etc.
- [ ] Use shadcn/ui Card components (existing pattern)
- [ ] Display trustworthiness data from API

### Task 5: Enhanced Puzzle Search
- [ ] Create `client/src/components/game/OfficerPuzzleSearch.tsx`
- [ ] Input field for exact puzzle ID lookup
- [ ] AI difficulty filter dropdown
- [ ] "Show Random Hard Puzzle" button
- [ ] Cross-reference PlayFab IDs with API data

### Task 6: Puzzle Display with AI Context
- [ ] Create `client/src/components/game/OfficerPuzzleCard.tsx`
- [ ] Show puzzle info + AI performance badges
- [ ] Display trustworthiness score prominently
- [ ] Use existing InteractiveGrid for puzzle display

### Task 7: Full Puzzle Viewer
- [ ] Create `client/src/components/game/OfficerPuzzleViewer.tsx`
- [ ] Show complete puzzle with train/test examples
- [ ] Panel showing "Why this is hard for AI"
- [ ] Link to full arc-explainer analysis if available

### Task 8: Update Officer Track Page
- [ ] Update `client/src/pages/OfficerTrack.tsx`
- [ ] Replace current interface with new components
- [ ] Integrate PlayFab puzzle data with AI poorest performance data
- [ ] Test cross-referencing between systems

### Task 9: Testing and Polish
- [ ] Test with real arc-explainer API endpoints  seems working so far!
- [ ] Verify puzzle ID matching between systems
- [ ] Add loading states and error handling
- [ ] Test "impossible" puzzle filtering

### Task 10: Documentation and Deployment
- [ ] Update README with new officer track features
- [ ] Document API integration approach
- [ ] Test static site deployment compatibility
- [ ] Push final implementation

## Data Integration Pattern

```typescript
// CORRECT APPROACH - Client-side HTTP calls
const response = await fetch('https://your-arc-explainer.com/api/puzzle/worst-performing?limit=20');
const aiData = await response.json();

// Cross-reference with PlayFab data
const playFabPuzzles = await arcDataService.loadARCPuzzles({datasets: ['training']});
const combinedData = matchPuzzlesByID(playFabPuzzles, aiData.puzzles);
```

## Key Success Metrics

1. **No Server Code**: Zero database connections or backend services
2. **Real API Integration**: Actual calls to arc-explainer endpoints
3. **PlayFab Integration**: Use existing 2,020 puzzle data
4. **Trustworthiness Focus**: Highlight puzzles AI cannot solve
5. **Static Deployment**: Works as pure static site

## Critical Reminders

- **NEVER CREATE BACKEND CODE** - this is a static-only application
- **USE REAL DATA ONLY** - no mocks, placeholders, or simulated data
- **PlayFab IS THE BACKEND** - all persistent data comes from PlayFab
- **arc-explainer IS EXTERNAL** - call it via HTTP from browser
- **Respect existing patterns** - use SFMC's component architecture

This plan ensures the officer track enhances SFMC with AI difficulty curation while maintaining the pure static architecture and leveraging real data from both systems.