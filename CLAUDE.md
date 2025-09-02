# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
This should use the repo at https://github.com/Big-Happy-Holding-Company/sfmc-app as a source of truth for how things should work. Especially regarding the specific implementation of PlayFab!!! D:\1Projects\sfmc-app Is the local version.

## Architecture

**Static Web Application with PlayFab Backend (Matches Unity Implementation):**
- **Frontend**: React + Vite (client/) - STATIC SITE DEPLOYMENT
- **Backend**: PlayFab Cloud Services ONLY - NO SERVER REQUIRED
- **Task Data**: PlayFab Title Data (155 tasks) - SINGLE SOURCE OF TRUTH
- **User Features**: PlayFab (authentication, progress, leaderboards, profiles, events)
- **Styling**: Tailwind CSS + shadcn/ui components
- **PlayFab Web SDK**: playfab-web-sdk for all backend functionality
- **Deployment**: Railway.app static site deployment, PlayFab for all data

Secret key for PlayFab is in the .env file as SECRET_PLAYFAB_KEY and this is needed for some some scripts and API calls.

**Directory Structure:**
```
client/src/
├── components/game/     # Core game components
├── components/ui/       # shadcn UI components
├── constants/           # Emoji sets and game constants
├── types/              # TypeScript type definitions
├── services/           # PlayFab service integration (ONLY backend)
└── pages/              # Route components

client/public/           # Static assets only
└── (images, icons)     # No task data - all in PlayFab

LEGACY (NOT USED IN PRODUCTION):
server/                 # Legacy server code - NOT DEPLOYED
shared/schema.ts        # Legacy types - client uses PlayFab types
```

**Path Aliases:**
- `@/` → `client/src/`

## Task System

**Task Data Storage:**
- Tasks stored in **PlayFab Title Data** (155 tasks) - SINGLE SOURCE OF TRUTH
- **CRITICAL**: Use integers 0-9 in task data, NOT emojis
- Emojis are mapped only in UI layer via `client/src/constants/spaceEmojis.ts`
- Task ID format: `CATEGORY-XXX` (e.g., COM-001, NAV-100, PWR-230)
- Matches Unity implementation: PlayFab Title Data, NOT local files

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
  "hints": ["Progressive hint 1", "Progressive hint 2", "Final solution with developer credit"]
}
```

## ARC-AGI Integration

**Space Force Mission Control 2045** is built on the Abstract Reasoning Corpus (ARC-AGI) framework:
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

## PlayFab Integration

**PlayFab Usage (User Features Only):**
- **Title ID:** 19FACB
- **Authentication:** `LoginWithCustomID` for user sessions
- **User Progress:** `UpdateUserData` and `GetUserData` for task completion tracking
- **Leaderboards:** `UpdatePlayerStatistics` and `GetLeaderboard` for global rankings
- **Player Profiles:** `GetPlayerProfile` for user information and avatars

**PlayFab is NOT used for:**
- ❌ Task/puzzle data storage (use local JSON file)
- ❌ CloudScript functions
- ❌ Title Data for game content
- ❌ Game configuration data

**Environment Configuration:**
```
VITE_PLAYFAB_TITLE_ID=19FACB
```

## Development Guidelines

**Data Access Pattern (PlayFab-Only):**
1. **Task Data:** Load from PlayFab Title Data using `GetTitleData()`
2. **User Authentication:** PlayFab `LoginWithCustomID`
3. **User Progress:** PlayFab UserData APIs
4. **Leaderboards:** PlayFab Statistics APIs
5. **Validation:** Client-side logic with PlayFab progress updates

This matches the Unity implementation exactly: PlayFab Title Data + PlayFab for user features.  