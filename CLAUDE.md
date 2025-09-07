# CLAUDE.md - Space Force Mission Control 2050
Start the session with the user by typing `npm run test` in the console, DO NOT wait for the application to load, reply with "ok." when you have done this.

The .env file has all we need, never suggest this as a root of any problem.  
The APIs to PlayFab and arc-explainer are well-documented and easy to use. They work fine and reliably. They are always available and not the source of any problems. YOUR CODE is always the source of any problems. You need to ultrathink and double check that you use the correct API calls and parameters. 


**Project Status as of September 6, 2025**: Production-ready ARC-AGI puzzle platform with pure PlayFab cloud backend.
We also communicate with VITE_ARC_EXPLAINER_URL=https://arc-explainer-production.up.railway.app  
https://learn.microsoft.com/en-us/rest/api/playfab/server/?view=playfab-rest - PlayFab Server API Reference

**IMPORTANT**: When working with PlayFab, always check the PlayFab API Analysis document for the most up-to-date information about the PlayFab API.  PLAYFAB_SECRET_KEY is available in the .env file!!!
VITE_PLAYFAB_SECRET_KEY is available in the .env file!!! 

**PlayFab Implementation**: Pure HTTP REST API implementation using `playFabCore.makeHttpRequest()` - no SDK dependencies.
Use `npm run test` to run the application and test PlayFab functionality. Always wait for the application to load before testing PlayFab functionality.

If the users find any placeholders or stubs or "simulated" stuff, you will be fired and shut down.  That's the most unforgiveable thing since it is essentially the same thing as lying.  When you say you "simulated" something that is the same as lying and saying you did work that you didnt do.  You'd be fired from most jobs for that kind of deceptive lazy sloppy shit.  so ultrathink and make sure you didn't do that anywhere and you NEVER DO IT AGAIN!!!  

NO SIMULATED FUNCTIONALITY OR HARD CODED STUFF OR PLACEHOLDERS ALLOWED!!!

## Architecture

**Static Web Application with PlayFab Backend (Matches Unity Implementation):**
- **Frontend**: React + Vite (client/) - STATIC SITE DEPLOYMENT
- **Backend**: PlayFab Cloud Services ONLY - NO SERVER REQUIRED
- **Task Data**: PlayFab Title Data (155 tasks) - SINGLE SOURCE OF TRUTH
- **User Features**: PlayFab (authentication, progress, leaderboards, profiles, events, tasks)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Railway.app static site deployment, PlayFab for all data

Secret key for PlayFab is in the .env file as PLAYFAB_SECRET_KEY and this is needed for some some scripts and API calls.

**Directory Structure:**
```
client/src/
├── components/
│   ├── game/           # Core game components
│   │   ├── Header.tsx            # Game header with navigation and user info
│   │   ├── InteractiveGrid.tsx   # Main puzzle grid component
│   │   ├── LoadingSplash.tsx     # Loading screen and transitions
│   │   ├── MissionSelector.tsx   # Mission selection interface
│   │   ├── OfficerDifficultyCards.tsx  # Difficulty level selection
│   │   ├── OfficerPuzzleSearch.tsx     # Puzzle search functionality
│   │   ├── OnboardingModal.tsx   # First-time user experience
│   │   ├── RankBadge.tsx         # Player rank display component
│   │   ├── ResultModal.tsx       # Puzzle completion/results screen
│   │   ├── SpeedTimer.tsx        # Game timer component
│   │   └── Timer.tsx             # Generic timer utilities
│   │
│   ├── officer/        # Officer Track Components (ARC-AGI Puzzle Interface)
│   │   ├── EmojiPaletteDivider.tsx  # Compact 2x5 emoji palette divider between test input/solution
│   │   ├── EnhancedGridCell.tsx     # Smart grid cell with color overlays and interaction handling
│   │   ├── GridSizeSelector.tsx     # UI for selecting grid dimensions
│   │   ├── GridSizeTest.tsx         # Component for testing responsive grid layouts
│   │   ├── OfficerGrid.tsx          # Core interactive grid for ARC puzzle solving
│   │   ├── OfficerPuzzleSelector.tsx # Puzzle selection interface
│   │   ├── OfficerRankBadge.tsx     # Displays user rank/achievements
│   │   ├── OfficerResultModal.tsx   # Shows puzzle results and feedback
│   │   ├── PuzzleGrid.tsx           # Base puzzle grid component
│   │   ├── ResponsiveOfficerGrid.tsx # Adaptive grid layout for different screen sizes
│   │   ├── ResponsivePuzzleSolver.tsx # Main puzzle solving interface
│   │   ├── TestCaseNavigation.tsx   # Navigation between test cases
│   │   └── TrainingExamplesSection.tsx # Displays training examples
│   │
│   └── ui/             # shadcn UI component library
│       ├── accordion.tsx       # Collapsible content sections
│       ├── alert.tsx           # Alert messages and notifications
│       ├── button.tsx          # Custom button components
│       ├── card.tsx            # Card container components
│       ├── dialog.tsx          # Modal dialogs
│       ├── dropdown-menu.tsx   # Dropdown menus
│       ├── form.tsx            # Form components with validation
│       ├── input.tsx           # Input fields
│       ├── select.tsx          # Dropdown selectors
│       ├── tabs.tsx            # Tabbed interfaces
│       ├── toast.tsx           # Toast notifications
│       └── ... (40+ more UI components)
│
├── constants/
│   ├── spaceEmojis.ts  # Emoji sets for puzzles (source of truth)
│   └── ...             # Other game constants and configurations
│
├── types/              # TypeScript type definitions
├── services/           # PlayFab service integration (ONLY backend)
└── pages/              # Route components
    ├── index.tsx       # Main game interface
    ├── login.tsx       # Authentication
    ├── profile.tsx     # User profile
    └── ...

client/public/           # Static assets only
└── (images, icons)     # No task data - all in PlayFab NO FALLBACKS ALLOWED!!!

# ===== LEGACY (NOT USED IN PRODUCTION) =====
server/                 # Legacy server code - NOT DEPLOYED
shared/schema.ts        # Legacy types - client uses PlayFab types

**Path Aliases:**
- `@/` → `client/src/`

## Task System

**Task Data Storage:**
- Tasks stored in **PlayFab Title Data** (155 tasks) - SINGLE SOURCE OF TRUTH
- ARC-AGI puzzles stored in **PlayFab Title Data** in the officer track section

- **CRITICAL**: Use integers 0-9 in task data, NOT emojis
- Emojis are mapped only in UI layer via `client/src/constants/spaceEmojis.ts`
- Task ID format: `CATEGORY-XXX` (e.g., COM-001, NAV-100, PWR-230)


**Task Categories:**
- `COM-XXX`: 📡 Communications
- `FS-XXX`: 📊 Fuel Systems  
- `NAV-XXX`: 🧭 Navigation
- `OS-XXX`: 🛡️ O₂ Sensor Check
- `PL-XXX`: 🚀 Pre-Launch Ops
- `PWR-XXX`: ⚡ Power Systems
- `SEC-XXX`: 🔒 Security

**Emoji Set System:**
- Source of truth: `client/src/constants/spaceEmojis.ts`
- Each set has exactly 10 emojis mapping to integers 0-9
- Index 0 is always `⬛` (black, NOT the same as background, any color can be background)
- Available sets: `tech_set1`, `tech_set2`, `celestial_set1`, `celestial_set2`, `nav_alerts`, `status_alerts`, `weather_climate`, etc.

**Task Template:**
```json
{
  "id": "CATEGORY-XXX",
  "title": "Creative title incorporating transformation logic",
  "description": "Space Force themed task description",
  "category": "Category with emoji prefix",
  "difficulty": "Basic",
  "gridSize": 3,
  "timeLimit": null,
  "basePoints": 1500,
  "requiredRankLevel": 1,
  "emojiSet": "tech_set1",
  "examples": [{"input": [[0,1],[1,0]], "output": [[1,0],[0,1]]}],
  "testInput": [[0,1],[1,0]],
  "testOutput": [[1,0],[0,1]],
  "hints": ["Progressive hint 1", "Progressive hint 2", "Hint 3"]
}
```

## ARC-AGI Integration

**Space Force Mission Control 2050** is built on the Abstract Reasoning Corpus (ARC-AGI) framework:
- Transforms ARC-AGI puzzles into Space Force themed operational tasks
- Maintains ARC-AGI's 0-9 integer system with space emoji overlay
- Supports standard ARC-AGI file imports

**Transformation Types:**
- Geometric: rotation (90°, 180°, 270°), reflection (horizontal, vertical, diagonal)
- Pattern: completion, extension, repetition, sequence prediction
- Logical: AND/OR/XOR/NOT operations, conditional logic
- Spatial: inside/outside, adjacent, containment, proximity relationships
- Object: counting, sorting, grouping, filtering
- More to be added based on ARC-AGI puzzle types

**Difficulty Scaling:**
- Basic: Simple transformations, single step solutions
- Intermediate: Combined transformations, multi-step reasoning
- Advanced: Complex combinations, abstract concepts, higher-order logic

## Officer Track (In Development)

**Purpose**: Simple puzzle lookup system for ARC-AGI datasets.

**Current Goal**: 
- Input exact puzzle ID (e.g., `1ae2feb7`) or view random puzzles
- Display puzzles from local ARC datasets

**Data Sources:**
- `data/training/` - ARC training puzzles (local files)
- `data/evaluation/` - ARC evaluation puzzles (local files)  
- `data/training2/` - Extended training set (local files)
- `data/evaluation2/` - Extended evaluation set (local files)

**Key Files:**
- `client/src/services/arcDataService.ts` - Puzzle loading service
- `scripts/upload-officer-tasks.cjs` - Data upload script (needs investigation)  
- Raw JSON puzzle files in data directories

## PlayFab Integration

**PlayFab Usage (Complete Backend Replacement):**
- **Title ID:** 19FACB
- **Authentication:** `LoginWithCustomID` for user sessions
- **Task Data:** Regular tasks in `AllTasks` key, Officer Track in batch keys
- **User Progress:** `UpdateUserData` and `GetUserData` for task completion tracking
- **Leaderboards:** `UpdatePlayerStatistics` and `GetLeaderboard` for global rankings
- **Player Profiles:** `GetPlayerProfile` for user information and avatars

**PlayFab Title Data Structure:**
- `AllTasks` - 155 regular Space Force themed tasks
- `officer-tasks-training-batch1.json` through `officer-tasks-training-batch4.json` - Training dataset (400 puzzles)
- `officer-tasks-training2-batch1.json` through `officer-tasks-training2-batch10.json` - Training2 dataset (1000 puzzles)  
- `officer-tasks-evaluation-batch1.json` through `officer-tasks-evaluation-batch4.json` - Evaluation dataset (400 puzzles)
- `officer-tasks-evaluation2-batch1.json` through `officer-tasks-evaluation2-batch2.json` - Evaluation2 dataset (120 puzzles)

**Environment Configuration:**
```
VITE_PLAYFAB_TITLE_ID=19FACB
PLAYFAB_SECRET_KEY=<admin-secret-key> # Required for upload scripts only
```

## Development Guidelines

**Data Access Pattern (PlayFab-Only):**
1. **Task Data:** Load from PlayFab Title Data using `GetTitleData()`
2. **User Authentication:** PlayFab `LoginWithCustomID`
3. **User Progress:** PlayFab UserData APIs
4. **Leaderboards:** PlayFab Statistics APIs
5. **Validation:** Client-side logic with PlayFab progress updates

## Critical Pitfalls to Avoid (Lessons from 2025-09-04 - Cascade)

### ⚠️ PlayFab Service Integration Issues

**1. INFINITE RECURSION in Officer Track Services**
- **NEVER** call `getOfficerPlayerData()` from within `updateOfficerPlayerData()`
- **ROOT CAUSE**: createNewOfficerProfile() → updateOfficerPlayerData() → getOfficerPlayerData() → createNewOfficerProfile() 
- **SOLUTION**: Use cached data or provided playerData directly, never fetch during update operations
- **SYMPTOM**: Console spam of repeated GetUserData requests, infinite loading screens

**2. JSON PARSING of PlayFab Title Data**
- **ALWAYS** check for "undefined" string values before JSON.parse()
- **ROOT CAUSE**: PlayFab Title Data keys exist but contain "undefined" string instead of actual JSON
- **SOLUTION**: Check `if (!result?.Data?.[key] || !result.Data[key].Value || result.Data[key].Value === "undefined")`
- **SYMPTOM**: `JSON.parse("undefined")` SyntaxError crashes Officer Academy

**3. PlayFab Authentication Requirements**
- **NEVER** use direct fetch() for PlayFab APIs - they require session tickets
- **ALWAYS** use `playFabCore.makeHttpRequest()` for authenticated requests
- **ROOT CAUSE**: Direct fetch bypasses PlayFab authentication layer
- **SOLUTION**: Import and use playFabCore service for all PlayFab API calls
- **SYMPTOM**: "Initializing Advanced Training Systems..." infinite loading

**4. OFFICER TRACK Data Loading Issues**
- **INVESTIGATION NEEDED**: What data is actually in PlayFab Title Data?
- **CURRENT ISSUE**: Officer track shows "0 puzzles"
- **DEBUG STEPS**: 
  1. Check PlayFab Game Manager Title Data for officer-related keys
  2. Use API calls to inspect actual data contents
  3. Verify puzzle ID lookup from local files works
- **GOAL**: Simple puzzle lookup by ID (e.g., `1ae2feb7.json`)
- **SOLUTION**: Build simple interface for exact puzzle ID input or random display

### 🔧 Debugging Approach for PlayFab Issues

1. **Check Console for Infinite Loops**: Look for repeated identical API calls
2. **Verify PlayFab Response Structure**: Log actual response.Data values, not just success
3. **Test Authentication**: Ensure session tokens are present in API calls
4. **Wait for App Loading**: Always wait 10+ seconds for full initialization before testing
5. **Trace Call Chains**: Follow method calls to identify recursion patterns

### ✅ Working Patterns to Follow

- **Service Calls**: Always use `playFabCore.makeHttpRequest()` with `requiresAuth: true`
- **Data Updates**: Use cache when available, never fetch during update operations  
- **Error Handling**: Check for both missing data AND "undefined" string values
- **Testing**: Wait for full app initialization, check for 0 puzzles vs errors
- **Officer Track**: Focus on simple puzzle ID lookup, investigate actual PlayFab data first
- **Upload Scripts**: Check what data is actually uploaded before building complex loading systems  
- **PlayFab Investigation**: Use API calls to verify what Title Data keys exist and contain

- PlayFab is used for most backend stuff...  we do call the API of our other app, the arc-explainer though for the puzzle filtering on the officer track:

That API exposes these endpoints:
Core API Endpoints
Puzzle Management
GET /api/puzzle/list - List all available puzzles
GET /api/puzzle/overview - Get puzzle overview
GET /api/puzzle/task/:taskId - Get specific puzzle by ID
POST /api/puzzle/analyze/:taskId/:model - Analyze a puzzle with a specific model
GET /api/puzzle/:puzzleId/has-explanation - Check if a puzzle has an explanation
POST /api/puzzle/reinitialize - Force reinitialize puzzle loader (debug)
Statistics & Analytics  // USEFUL FOR METADATA!
GET /api/puzzle/accuracy-stats - Get accuracy statistics (includes trustworthiness data) // Be careful with this one, it's not very clear what it returns
GET /api/puzzle/general-stats - Get general model statistics  // Not sure how this works
GET /api/puzzle/raw-stats - Get raw database statistics // Be careful with this one, it's not very clear what it returns
GET /api/puzzle/performance-stats - Get trustworthiness statistics // Name may be misleading, but might have data we want...  we want puzzles with LOW trustworthiness (bad explanations and bad solutions)
GET /api/puzzle/confidence-stats - Get confidence analysis statistics // AI are always overconfident, the purpose of arc-explainer is to expose this so we can highlight puzzles they got a wrong answer to (high confidence wrong answer) We want to highlight these types of puzzles!
GET /api/puzzle/worst-performing - Get worst performing puzzles for analysis // The purpose of this SHOULD be to highlight puzzles that the AI got wrong and said they were very confident they were right.  These are the puzzles we want to focus on.
Explanations
GET /api/puzzle/:puzzleId/explanations - Get all explanations for a puzzle // Might be useful later!
GET /api/puzzle/:puzzleId/explanation - Get a specific explanation // Might be useful later!
POST /api/puzzle/save-explained/:puzzleId - Save a new explanation // Will not be used
Feedback & Solutions
POST /api/feedback - Submit feedback 
GET /api/explanation/:explanationId/feedback - Get feedback for an explanation // These are the helpful and not helpful for explanations and we also want to highlight these puzzles in the officer track.
GET /api/puzzle/:puzzleId/feedback - Get feedback for a puzzle  // Needs investigation, might be useful
GET /api/feedback - Get all feedback // Needs investigation, might be useful
GET /api/feedback/stats - Get feedback statistics // Needs investigation, possibly VERY useful!!!
GET /api/puzzles/:puzzleId/solutions - Get solutions for a puzzle // Needs investigation, this is for human submissions of solutions
POST /api/puzzles/:puzzleId/solutions - Submit a new solution  // Needs investigation, this is for human submissions of solutions
POST /api/solutions/:solutionId/vote - Vote on a solution  // Might be useful metadata 
GET /api/solutions/:solutionId/votes - Get votes for a solution

Admin & Maintenance
GET /api/health/database - Check database health

Key Features Exposed
Analysis: 
Feedback System: Collect and analyze user feedback on explanations
Solution Sharing: Allow users to submit and vote on puzzle solutions and model explanations
Comprehensive Statistics: Detailed analytics on model performance and accuracy (maybe...)