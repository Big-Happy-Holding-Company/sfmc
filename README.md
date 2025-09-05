# Space Force Mission Control 2050

A Space Force-themed puzzle platform featuring two distinct training systems: **Enlisted Track** with 155 curated operational tasks, and **Officer Track** with 1,920+ ARC-AGI puzzles for advanced training. Built on the Abstract Reasoning Corpus (ARC) framework while maintaining accessibility for all players.

## About

- **Purpose**: Develop human reasoning skills through space operations-themed puzzles
- **Dual Track System**: Enlisted (themed tasks) + Officer (raw ARC-AGI datasets)  
- **Inspiration**: Based on the ARC-AGI benchmark for measuring AI and human intelligence
- **Platform**: Static web application with PlayFab cloud backend
- **Accessibility**: Colorblind-friendly emoji sets and clear visual feedback

https://learn.microsoft.com/en-us/rest/api/playfab/server/?view=playfab-rest - PlayFab Server API Reference

**Architecture**: Pure static site deployment with PlayFab-only backend. No server infrastructure required!

## Key Features

### Enlisted Track (155 Tasks)
- **Themed Categories**: O₂ Systems, Navigation, Power, Communications, Fuel Systems, Pre-Launch, Security
- **Rank Progression**: Advance through Space Force enlisted ranks (E1-E9)
- **Curated Content**: Space Force themed transformations with storylines

### Officer Track (2,020 Puzzles) ✅ OPERATIONAL  
- **ARC-AGI Datasets**: Complete training, training2, evaluation, evaluation2 datasets
- **AI-Curated Difficulty**: Integration with arc-explainer API for AI trustworthiness data
- **Enhanced Search**: Exact puzzle ID lookup and random selection by AI difficulty  
- **Performance Analytics**: Real AI accuracy scores (40.9%, 36.3%, 18.5% etc.) and performance metrics
- **Batch Architecture**: Efficient loading of large puzzle collections from PlayFab
- **Officer Ranks**: LIEUTENANT → CAPTAIN → MAJOR → COLONEL progression

### Accessibility & Design
- **Colorblind Friendly**: Multiple emoji sets with clear visual distinctions
- **Responsive UI**: Works on desktop, tablet, and mobile devices
- **Real-time Feedback**: Immediate validation and hints system

## Technical Stack

### Core Technologies
- **Frontend**: React + TypeScript with Vite (Static Site)
- **Backend**: PlayFab Cloud Services (No Server Required) 
- **AI Analytics**: arc-explainer API for AI performance data
- **UI Components**: Tailwind CSS + shadcn/ui
- **Data Storage**: PlayFab Title Data & User Data
- **Authentication**: PlayFab Anonymous Login

### Architecture Overview

This is a **pure static web application** with all backend functionality handled by PlayFab cloud services.

```
PlayFab Cloud Backend (Single Source of Truth)          arc-explainer API
├── Title Data:                                          ├── AI Performance Data
│   ├── AllTasks (155 enlisted tasks)                   │   ├── Accuracy scores (40.9%, 36.3%, etc.)
│   ├── officer-tasks-training-batch1-4.json (400)     │   ├── Composite difficulty scores  
│   ├── officer-tasks-training2-batch1-10.json (1000)  │   ├── Wrong count & explanation metrics
│   ├── officer-tasks-evaluation-batch1-4.json (400)   │   └── AI trustworthiness data
│   └── officer-tasks-evaluation2-batch1-2.json (120)  └── Puzzle ID cross-referencing
├── User Data: Player progress & officer track stats              ↓
├── Statistics: Global leaderboards & rankings                    ↓
└── Events: Game analytics & logging                              ↓
    ↓                                                              ↓
Static React App (client/) ←------ HTTP API Calls ----------------┘
├── components/    # Game UI + AI difficulty cards
├── constants/     # Emoji sets and game constants  
├── services/      # Pure HTTP integrations
│   ├── playfab/   # Core PlayFab services
│   ├── arcDataService.ts     # Officer track batch loading
│   └── arcExplainerAPI.ts    # AI performance data integration
└── pages/         # Route components with AI-curated filtering

### Data Flow
1. **Enlisted Tasks**: Loaded from `AllTasks` PlayFab Title Data key
2. **Officer Tasks**: Batch-loaded from multiple Title Data keys per dataset  
3. **AI Performance**: Real-time HTTP calls to arc-explainer API for difficulty curation
4. **Authentication**: Anonymous PlayFab login with persistent device ID
5. **Progress**: Stored separately for enlisted vs officer tracks in User Data
6. **Validation**: Client-side logic with PlayFab progress updates
7. **Leaderboards**: Separate leaderboards for enlisted and officer tracks
8. **AI Filtering**: Cross-reference PlayFab puzzle IDs with arc-explainer performance data
9. **Deployment**: Static files served from CDN (Railway)



## Task System

### Task Structure

Tasks are defined in JSON format with the following structure:

```json
{
  "id": "OS-001",
  "title": "Oxygen Sensor Calibration",
  "description": "Task description for context",
  "category": "🛡️ O₂ Sensor Check",
  "difficulty": "Basic",
  "gridSize": 2,
  "timeLimit": null,
  "basePoints": 3,
  "requiredRankLevel": 1,
  "emojiSet": "status_main",
  "examples": [{"input": [[0,1],[1,0]], "output": [[1,0],[0,1]]}],
  "testInput": [[0,1],[1,0]],
  "testOutput": [[1,0],[0,1]],
  "hints": ["Hint 1", "Hint 2", "Solution"]
}
```

### Emoji Sets

Tasks use emoji sets to represent different game elements. The mapping from numbers to emojis is handled automatically by the frontend.

## Officer Track ✅ FULLY OPERATIONAL

### AI-Curated Puzzle System
Advanced ARC-AGI puzzle platform enhanced with real AI performance analytics:

#### 🎯 **Enhanced Puzzle Search**
- **Exact ID Lookup**: Search by puzzle ID (e.g., `1ae2feb7`, `007bbfb7`)  
- **AI Difficulty Filtering**: "Impossible" (0%), "Extremely Hard" (0-25%), "Very Hard" (25-50%), "Challenging" (50-75%)
- **Random Selection**: Get random puzzles filtered by AI difficulty
- **Cross-Referencing**: Seamless mapping between PlayFab (`ARC-TR-007bbfb7`) and ARC Explainer (`007bbfb7`) IDs

#### 📊 **AI Performance Analytics** 
- **Real Accuracy Scores**: Live data showing actual AI success rates (e.g., 40.9%, 36.3%, 18.5%)
- **Performance Metrics**: Wrong count, explanation attempts, composite difficulty scores
- **Trustworthiness Data**: Highlight puzzles that consistently stump AI systems
- **Difficulty Cards**: Dynamic statistics showing puzzle distribution across AI difficulty categories

#### 🏗️ **Technical Implementation**
- **Data Source**: 2,020 puzzles stored in PlayFab Title Data across 20 batches
- **API Integration**: Real-time HTTP calls to `arc-explainer-production.up.railway.app`
- **Batch Loading**: Efficient pagination system for large puzzle collections
- **Performance Optimized**: Only essential metrics transferred, not full puzzle arrays

### Usage Examples
```typescript
// Search for specific puzzle
await handlePuzzleSearch("1ae2feb7");

// Get random "impossible" puzzle (0% AI accuracy)  
await handleRandomPuzzle("impossible");

// Filter by AI performance
const hardPuzzles = puzzles.filter(p => 
  arcExplainerAPI.getDifficultyCategory(p.avgAccuracy) === "extremely_hard"
);
```

## Development


## Gameplay

### Rank Progression

Players advance through Space Force enlisted ranks by earning points from solving puzzles. Each rank requires more points to achieve than the previous one.

### Task Categories

- **🛡️ O₂ Sensor Check**: Oxygen system diagnostics
- **🚀 Pre-Launch Ops**: Launch preparation tasks
- **📊 Fuel Systems**: Fuel flow and mixture analysis
- **🧭 Navigation**: Directional calibration
- **📡 Communications**: Communication systems
- **⚡ Power Systems**: Power distribution
- **🔒 Security**: Security systems

## Development

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables: Copy `.env` and configure:
   ```bash
   VITE_PLAYFAB_TITLE_ID="19FACB"
   VITE_ARC_EXPLAINER_URL="https://arc-explainer-production.up.railway.app"
   ```
4. Start development server: `npm run test` (builds + runs dev server)

### Officer Track Setup
The Officer Track with AI-curated difficulty requires:
- **PlayFab Title Data**: 2,020 puzzles across 20 batch keys (already configured)
- **arc-explainer API**: External service providing AI performance analytics
- **Environment**: `VITE_ARC_EXPLAINER_URL` must point to your arc-explainer instance

#### Arc-Explainer API Integration
The Officer Track uses the arc-explainer API for AI difficulty analysis:

**Key Endpoint**: `/api/puzzle/worst-performing`
- **Parameters**: `limit` (max 50), `sortBy`, `minAccuracy`, `maxAccuracy`, `zeroAccuracyOnly`
- **Response**: Puzzle performance data with `avgAccuracy`, `compositeScore`, etc.
- **ID Format**: Uses raw puzzle IDs (e.g., `007bbfb7`) vs PlayFab format (`ARC-TR-007bbfb7`)

**Data Flow**:
1. PlayFab stores puzzle content (authoritative source)
2. Arc-explainer provides AI performance metadata  
3. ID conversion: `ARC-TR-007bbfb7` ↔ `007bbfb7`
4. Merged data enables difficulty-based filtering

**Available Filters**:
- `zeroAccuracyOnly=true` - Puzzles with 0% AI success rate (impossible category)
- `minAccuracy`/`maxAccuracy` - Accuracy range filtering
- `sortBy=composite` - Sort by composite difficulty score

### Documentation

📚 **See [docs/](./docs/)** for comprehensive documentation:
- **[PlayFab API Analysis](./docs/playfab-api-analysis.md)** - Complete API reference and security audit
- **[Migration Plan](./docs/2SeptPlayfabTasks.md)** - PlayFab implementation phases

⚠️ **Security Notice**: Current task validation is client-side only. See API Analysis for production security recommendations.

### Adding New Tasks

Tasks are now managed in **PlayFab Title Data**. To add new tasks:

1. Use the PlayFab dashboard to update Title Data
2. Follow the task structure shown above
3. Use numbers 0-9 in input/output arrays (emojis are mapped in the UI)
4. Tasks are loaded automatically on app refresh
5. No server restart required - it's a static site!

### Deployment

```bash
# Build static site
npm run build

# Preview production build locally  
npm start
```

Static files are deployed to Railway and served from CDN.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [ARC-AGI](https://arcprize.org/arc-agi) for the puzzle framework
- PlayFab for backend services
    "⬛ <background clarification>"
  ]
}
```

# ARC-AGI Transformation Types will involve one or more of these:

## Geometric Transformations
- Rotation (90°, 180°, 270°)
- Reflection (horizontal, vertical, diagonal)
- Translation (moving objects)
- Scaling (resize objects)

## Pattern Operations
- Pattern completion
- Pattern extension
- Pattern repetition
- Sequence prediction

## Logical Operations
- AND operations
- OR operations
- XOR operations
- NOT operations
- Conditional logic

## Grid Operations
- Grid splitting (horizontal, vertical, quadrant)
- Grid merging
- Grid overlay
- Grid subtraction

## Object Manipulation
- Object counting
- Object sorting
- Object grouping
- Object filtering

## Spatial Relationships
- Inside/outside relationships
- Adjacent/touching relationships
- Containment relationships
- Proximity relationships

## Color Operations
- Color mapping
- Color replacement
- Color pattern matching
- Color logic operations

## Shape Operations
- Shape detection
- Shape transformation
- Shape combination
- Shape decomposition

## Rule Inference
- Single rule application
- Multiple rule application
- Rule interaction
- Rule generalization

## Abstract Reasoning
- Symbol interpretation
- Semantic relationships
- Conceptual mapping
- Abstract pattern recognition

### UI Components
- Game components in `client/src/components/game/`
- Use existing shadcn components for consistency
- Follow space theme with dark backgrounds and cyan accents

## PlayFab Integration

### Task Management
- **GetTitleData**: Loads all 155 tasks from PlayFab Title Data
- **Client Validation**: Solution validation happens in browser
- **Progress Tracking**: Results stored in PlayFab User Data

### User Features  
- **Anonymous Authentication**: Automatic device-based login
- **Statistics**: Global leaderboards via PlayFab Statistics API
- **Event Logging**: Game analytics via PlayFab Events API



## Narrative Story Wrapper System  //  BEING REMOVED WITH PLAYFAB!

### Purpose
Adds a light-hearted Space-Force-2050 story layer to mundane training tasks without touching core puzzle data.

### How It Works
1. `server/data/problems.json` – Holds every narrative template.  Keys are transformation types; each array contains one template per task **category** (O₂ Sensor Check, Pre-Launch Ops, Fuel Systems, Navigation, Communications, Power Systems, Security).
2. `server/data/antagonists.json` – List of mischievous characters (e.g. "Rick the Intern") that caused the mishap.
3. `server/data/components.json` – List of ship components the antagonist fiddled with.
4. `server/templates/storyTemplates.ts` – Loader that reads `problems.json` at runtime and exposes templates to the factory.
5. `server/tools/story-factory.ts` – Pure function that:
   - Randomly selects an antagonist + component.
   - Picks the correct template for the task’s `transformationType` + `category`.
   - Substitutes `{{antagonist}}` and `{{component}}` placeholders.
   - Returns an enriched task object ready for the API/UI.

### Updating Stories (Writers-Friendly)
- Open `server/data/problems.json`.
- Find the transformation type you want (e.g. `rotation_90deg`).
- Add or edit an object in the array with fields: `id`, `category`, `title`, `description`.
- Keep it short (<60-char title, <180-char description) and include placeholders where relevant.
- No code changes are needed – the loader will pick it up automatically.

## AI Failure Content System

### Purpose
Provides humorous and educational content about why AI struggles with different transformation types, adding both entertainment value and educational insights to tasks.

### AI Failure Data Structure
The `server/data/ai_failure.json` file contains content for each transformation type:

```json
{
  "transformation_type": {
    "ai_difficulty": "Technical explanation of why AI struggles with this transformation",
    "comic_situation1": "Humorous scenario showing AI failing at the transformation",
    "comic_situation2": "Another humorous scenario",
    "comic_situation3": "A third humorous scenario",
    "kids_explanation": "Simple explanation for younger players about why the transformation is hard for AI",
    "kids_explanation1": "Second simple explanation",
    "kids_explanation2": "Third simple explanation"
  }
}
```

### Transformation Types Covered
- `horizontal_reflection`: Mirror flips left-to-right
- `vertical_reflection`: Mirror flips top-to-bottom
- `rotation_90deg`: 90° clockwise rotation
- `rotation_270deg`: 270° clockwise (or 90° counter-clockwise) rotation
- `pattern_completion`: Logical sequence pattern completion

### Using the AI Failure Content
- Use the `scripts/enhance-tasks.js` script to automatically enhance task descriptions and hints with this content
- The enhancement script:
  1. Detects the transformation type used in each task
  2. Prepends a random comic situation and AI difficulty explanation to the task's description
  3. Adds the three kids_explanation entries to the beginning of the hints array
- For tasks that don't follow standard transformation naming patterns, manual enhancement is recommended

### Updating AI Failure Content
- Edit `server/data/ai_failure.json` to modify existing content
- Maintain the structure of each transformation type entry
- When adding new transformation types, ensure all seven fields are included
- After updating, re-run the enhancement script to apply changes to task files

---

## Future Enhancements

### Scalability Considerations
- Database migration from in-memory to persistent storage

### Feature Roadmap
- Unity port
- UI/UX improvements
- Officer track with complex transformations
- Onboarding system
