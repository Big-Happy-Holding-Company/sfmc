# Mission Control 2045

My nephew Wyatt was the inspiration for this app.  AI is rapidly changing the world we live in. He is 6 years old and wants to be a mission control specialist.  The US Space Force was formed in 2019 and is the branch of the U.S. Armed Forces that is responsible for space operations, including space situational awareness, space traffic management, and space-based missile defense. I wonder what that will look like in 2050.  I want to give him a fun way to learn about the types of tasks he might actually encounter in the future based upon the reasoning and logic that are difficult for AI to perform.  I envision a future where AI can perform most tasks, but there are still some tasks that require human intuition and reasoning.  This Space Force-themed puzzle game has recruits complete operational tasks to advance through enlisted ranks and all the tasks are based upon the Abstract Reasoning Corpus (ARC) puzzles. The puzzles are transformed to fit the Space Force theme and the game is designed to be platform agnostic. One challenge as a developer has been accomodating the challenges that individuals with unique disabilities (such as colorblindness) face, while still maintaining a fun and engaging experience for all players and staying true to the structure of the ARC-AGI test framework. 

In 2050 this game will hopefully serve as an interesting temporal artifact of a very specific moment in the development of AI and AI reasoning towards what we today call AGI.  (And in 25 years will probably call something totally different!)  

## ARC-AGI Framework - Like holy sh*t these people are way smarter than me...

The Abstract and Reasoning Corpus for Artificial General Intelligence (ARC-AGI) is a benchmark designed to measure intelligence. (If you want to feel really dumb, go see what they consider to be "easy" puzzles for humans to solve! 😂) This project leverages puzzles and logic from:

- Official ARC Prize: https://arcprize.org/arc-agi
- Puzzle datasets: https://github.com/arcprize/ARC-AGI-2/tree/main/data
- Reference: https://github.com/fchollet/ARC-AGI

This project is designed to build upon that framework by adding a Space Force theme and making it accessible to a wider audience and especially young people and the colorblind.  It is also designed to be platform agnostic and can be run on any device with a web browser.

## Architecture Overview

### System Design
- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js with TypeScript
- **Storage**: In-memory with modular JSON task loading
- **UI**: Tailwind CSS + shadcn/ui components  (This is just for the prototype)

### Directory Structure
```
├── client/                 # Frontend React application
│   └── src/
│       ├── components/     # Reusable UI components
│       │   ├── game/       # Game-specific components
│       │   └── ui/         # Base UI components (shadcn)
│       ├── constants/      # Emoji sets and game constants
│       ├── pages/          # Route components
│       └── types/          # TypeScript type definitions
├── server/                 # Backend Express application
│   ├── cli/                # CLI utilities (task generation, etc.)
│   ├── data/
│   │   └── tasks/          # Individual JSON task files
│   ├── templates/          # Task and story templates
│   │   ├── generators/
│   │   ├── categories.ts
│   │   ├── transformations.ts
│   │   └── validators.ts
│   ├── tools/              # Code-generation helpers
│   │   ├── task-factory.ts
│   │   └── story-factory.ts   # Narrative wrapper (NEW)
│   ├── services/           # Business logic services
│   ├── tests/              # Automated backend tests
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route handlers
│   └── storage.ts          # Data storage interface
├── docs/                   # Technical and design documentation
│   └── story_wrapper_system_plan.md   # Narrative wrapper plan (NEW)
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema and types
└── README.md               # This file
```

## Task System Architecture

### Transformation System

#### Available Transformations
1. **Geometric Transformations**
   - `horizontal_reflection`: Flip grid left-to-right
   - `vertical_reflection`: Flip grid top-to-bottom (NEW)
   - `rotation_90deg`: Rotate grid 90° clockwise
   - `rotation_270deg`: Rotate grid 270° clockwise (replaces object_counting)

2. **Logical Transformations**
   - `pattern_completion`: Complete the pattern in the grid

#### Transformation Properties
Each transformation includes:
- Unique type identifier
- Name and description
- Category (geometric/logical)
- Difficulty level
- Hint patterns
- Associated grid generator

### Task Generation

#### CLI Commands
```bash
# Generate a single task
npx tsx server/cli/generate-task.ts single -c CATEGORY -t TRANSFORMATION -s SIZE -o OUTPUT_FILE

# Example: Generate SEC task with vertical reflection
npx tsx server/cli/generate-task.ts single -c SEC -t vertical_reflection -s 4 -o server/data/tasks/SEC-100.json
```

#### Task Generation Process
1. Selects transformation type based on category
2. Generates appropriate grid examples
3. Applies story wrapper with Space-Force theme
4. Validates the task
5. Saves to specified location

### Modular Task Loading
Tasks are stored as individual JSON files in `server/data/tasks/` for easy maintenance and scalability. The time limit on all tasks should be null unless otherwise specified.

#### Task File Structure
```json
{
  "id": "OS-001",
  "title": "Oxygen Sensor Calibration",
  "description": "Task description for context",
  "category": "🛡️ O₂ Sensor Check",
  "difficulty": "Basic",
  "gridSize": 2,
  "timeLimit": null,
  "basePoints": 350,
  "requiredRankLevel": 1,
  "emojiSet": "status_main",
  "examples": [
    {
      "input": [[0, 1], [1, 0]],
      "output": [[1, 0], [0, 1]]
    }
  ],
  "testInput": [[0, 1], [1, 0]],
  "testOutput": [[1, 0], [0, 1]],
  "hints": [
    "Progressive hint 1",
    "Progressive hint 2", 
    "Final solution hint"
  ]
}
```

### Emoji Set System
Emoji sets follow ARC-AGI (Abstract and Reasoning Corpus for Artificial General Intelligence) conventions with exactly 10 emojis per set, mapping to numerical indices 0-9.

#### Available Emoji Sets
- `status_main`: Basic status indicators - These use colors and since my nephew is colorblind, I'm not using them.
- `tech_set1`: Power and Fuel systems
- `tech_set2`: Communication systems
- `celestial_set1`: Planetary bodies
- `celestial_set2`: Stellar objects
- `nav_alerts`: Navigation vectors
- `status_alerts`: Warning systems
- `weather_climate`: Atmospheric conditions

## Game Mechanics

### Rank Progression
Players advance through Space Force enlisted ranks by earning points:
See `client/src/data/ranks.ts` for rank progression.

### Task Categories
- **🛡️ O₂ Sensor Check**: Oxygen system diagnostics (OS-XXX)
- **🚀 Pre-Launch Ops**: Launch preparation tasks (PL-XXX)
- **📊 Fuel Systems**: Fuel flow and mixture analysis (FS-XXX)
- **🧭 Navigation**: Directional calibration (NAV-XXX)
- **📡 Communications**: Communication systems (COM-XXX) 
- **⚡ Power Systems**: Power flow and distribution (PWR-XXX)
- **🔒 Security**: Security systems (SEC-XXX)
See `server/templates/categories.ts` for category metadata.


### Timer System
- **Speed Bonus**: Tasks count up, rewarding faster completion
- **Time Limited**: Limits are all set to null for development, but can be added for expanded difficulty and point rewards. I personally hate timed missions so I'll probably never do it.

## Development Guidelines

### Task Generation Tools

The project includes CLI tools for generating puzzle tasks programmatically:

```powershell
# Generate a single task
npx tsx server\cli\generate-task.ts single -c <CATEGORY> -t <TRANSFORMATION> -s <SIZE> -o <OUTPUT_PATH>

# Generate all tasks for a category
npx tsx server\cli\generate-task.ts category -c <CATEGORY> -o <OUTPUT_DIR>

# Generate all tasks for all categories
npx tsx server\cli\generate-task.ts all -o <OUTPUT_DIR>

# List available categories and transformations
npx tsx server\cli\generate-task.ts list
```

Parameters:
- `-c, --category`: Category code (e.g., COM, NAV, FS)
- `-t, --transformation`: Transformation type (e.g., horizontal_reflection, rotation_90deg)
- `-s, --size`: Grid size (2-4)
- `-d, --difficulty`: Difficulty level (Basic, Intermediate, Advanced)
- `-o, --output`: Output file or directory

See the comprehensive guide in `docs/task_generation_guide.md` for more details.

### Adding New Tasks
1. Create a new JSON file in `server/data/tasks/`
2. Follow the task file structure above
3. **IMPORTANT**: Use numbers 0-9 in the logic/data files, not emojis
4. Emojis are only mapped in the UI layer using `client/src/constants/spaceEmojis.ts`
5. Test the task transformation logic
6. Add progressive hints for player assistance

### Standard for Puzzle Representation
- **Logic/Data Files**: Always use integers 0-9 in data files (input, output arrays)
- **UI Rendering**: Numbers are mapped to emojis only during rendering

- The app should be able to import standard ARC-AGI files like those from the official repositories
- Note: Existing files in the tasks folder may use emojis directly, but all new files should follow the standard integer format

### SOURCE Emoji Sets
1.  `client/src/constants/spaceEmojis.ts` is the source of truth for emoji mapping!!
2. Maintain exactly 10 emojis per set
3. Keep index 0 as `⬛` (black background)
4. `EMOJI_SET_INFO` is the source of truth for emoji set metadata!!

### SOURCE Task Sets 
1. Tasks should have their transformation types in the description
2. This allows for 40 different types of task in each category.

### Ready-to-Use Template (copy & replace fields)
```jsonc
{
  "id": "<CATEGORY-XXX>",
  "title": "<Creative title incorporating the logic of the transformation>",
  "description": "<Creative player-facing story about the task as it relates to the operations of ground control at the US Space Force>",
  "category": "<COM-XXX Communications / FS-XXX Fuel Systems / NAV-XXX Navigation / OS-XXX Oxygen Sensors / PL-XXX Pre-Launch / PWR-XXX Power Systems / SEC-XXX Security>",
  "difficulty": "Basic",
  "gridSize": 3,
  "timeLimit": null,
  "basePoints": 1500,
  "requiredRankLevel": 1,
  "emojiSet": "<EMOJI-SET-NAME>",
  "examples": [ /* two example objects */ ],
  "testInput": [ /* grid */ ],
  "testOutput": [ /* grid */ ],
  "hints": [
    "<Hint 1>",
    "<Hint 2>",
    "⬛ <background clarification>"
  ]
}
```

# ARC-AGI Transformation Types

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



## Narrative Story Wrapper System

### Purpose
Adds a light-hearted Space-Force-2050 story layer to every ARC-AGI puzzle without touching core puzzle data.

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
