# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
This should use the repo at https://github.com/Big-Happy-Holding-Company/sfmc-app as a source of truth for how things should work. Especially regarding the specific implementation of PlayFab!!!

## Architecture

**Full-Stack TypeScript Application:**
- **Frontend**: React + Vite (client/)
- **Backend**: Express.js (server/)  Converting to PlayFab now!!
- **Database**: None currently? Moving to PlayFab.
- **Styling**: Tailwind CSS + shadcn/ui components
- **PlayFab SDK**: playfab-sdk (installed via npm already)
- **PlayFab Web SDK**: playfab-web-sdk (installed via npm already)
- **Deployment**: Railway.app using existing account, deploys from main branch

**Directory Structure:**
```
client/src/
├── components/game/     # Core game components
├── components/ui/       # shadcn UI components
├── constants/           # Emoji sets and game constants
├── types/              # TypeScript type definitions
└── pages/              # Route components
THIS IS NOW DEPRECATED BECAUSE IT IS IN PlayFab!
server/
├── data/tasks/         # Individual JSON task files (CORE SYSTEM)
├── templates/          # Task generation templates
├── tools/              # Task/story generation utilities
├── services/           # Business logic services
├── cli/                # CLI tools for task generation
├── index.ts            # Server entry point
├── routes.ts           # API route handlers
└── storage.ts          # Data storage interface

shared/
└── schema.ts           # Database schema and types  THIS IS NOW DEPRECATED BECAUSE IT IS IN PlayFab!
```

**Path Aliases:**
- `@/` → `client/src/`
- `@shared/` → `shared/`

## Task System

**Task File Structure:**
- Tasks stored as individual JSON files in `server/data/tasks/`
- **CRITICAL**: Use integers 0-9 in task data files, NOT emojis
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

## Development Guidelines
We are moving to PlayFab for data storage.  The PlayFab instance is already configured and the user can log in with their Microsoft account and provide you with their PlayFab ID or any other identifier you need to access their account.

Use https://learn.microsoft.com/en-us/gaming/playfab/sdks/nodejs/ to find any information you need about the PlayFab SDK for Node.js.  