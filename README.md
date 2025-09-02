# Mission Control 2045

A Space Force-themed puzzle game where players complete operational tasks to advance through enlisted ranks. Tasks are based on the Abstract Reasoning Corpus (ARC) puzzles, transformed to fit the Space Force theme while maintaining accessibility for all players, including those with color vision deficiencies.

## About

- **Purpose**: Provide an engaging way to develop and test human reasoning skills through space operations-themed puzzles
- **Inspiration**: Based on the ARC-AGI benchmark for measuring intelligence
- **Platform**: Web-based, responsive design works on any device with a modern browser

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open `http://localhost:5173` in your browser

## Key Features

- **Task Categories**: Various space operations themes (Oxygen Systems, Navigation, Power, etc.)
- **Rank Progression**: Advance through Space Force enlisted ranks by solving puzzles
- **Accessibility**: Designed with colorblind-friendly emoji sets and clear visual feedback

## Technical Stack

### Core Technologies
- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js with TypeScript
- **UI Components**: Tailwind CSS + shadcn/ui
- **Cloud Services**: PlayFab for task management and user progress

### Project Structure

```
├── client/           # Frontend React application
│   └── src/
│       ├── components/  # UI components
│       ├── constants/   # Game constants and emoji sets
│       └── services/    # API clients and services
├── server/           # Backend services
│   ├── data/         # Task definitions
│   └── services/     # Business logic
└── shared/          # Shared types and utilities
```



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
3. Set up environment variables (see `.env.example`)
4. Start development server: `npm run dev`

### Adding New Tasks

1. Create a new JSON file in `server/data/tasks/`
2. Follow the task structure shown above
3. Use numbers 0-9 in input/output arrays (emojis are mapped in the UI)
4. Test your task thoroughly
5. Add progressive hints to help players

### Task Generation

```bash
# Generate a single task
npx tsx server/cli/generate-task.ts single -c <CATEGORY> -t <TRANSFORMATION> -s <SIZE>

# List available categories and transformations
npx tsx server/cli/generate-task.ts list
```

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

## API Endpoints

### Players
- `GET /api/players/:id` - Get player data
- `POST /api/players` - Create new player
- `POST /api/players/:id/validate-solution` - Submit task solution

### Tasks
- `GET /api/tasks` - Get all available tasks
- `GET /api/tasks/:id` - Get specific task



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
