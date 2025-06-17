# Mission Control 2045

A Space Force-themed ARC-AGI puzzle game where cadets complete operational tasks to advance through enlisted ranks.

## ARC-AGI Framework

The Abstract and Reasoning Corpus for Artificial General Intelligence (ARC-AGI) is a benchmark designed to measure intelligence. This project leverages puzzles and logic from:

- Official ARC Prize: https://arcprize.org/arc-agi
- Puzzle datasets: https://github.com/arcprize/ARC-AGI-2/tree/main/data
- Reference implementation: https://github.com/fchollet/ARC-AGI

## Architecture Overview

### System Design
- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js with TypeScript
- **Storage**: In-memory with modular JSON task loading
- **UI**: Tailwind CSS + shadcn/ui components

### Directory Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── game/       # Game-specific components
│   │   │   └── ui/         # Base UI components (shadcn)
│   │   ├── constants/      # Emoji sets and game constants
│   │   ├── pages/          # Route components
│   │   └── types/          # TypeScript type definitions
├── server/                 # Backend Express application
│   ├── data/
│   │   └── tasks/          # Individual JSON task files
│   ├── services/           # Business logic services
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route handlers
│   └── storage.ts         # Data storage interface
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── README.md              # This file
```

## Task System Architecture

### Modular Task Loading
Tasks are stored as individual JSON files in `server/data/tasks/` for easy maintenance and scalability.

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
- `status_main`: Basic status indicators
- `tech_set1`: Digital systems (computers, displays)
- `tech_set2`: Mechanical systems (tools, controls)
- `celestial_set1`: Planetary bodies
- `celestial_set2`: Stellar objects
- `nav_alerts`: Navigation vectors
- `status_alerts`: Warning systems
- `weather_climate`: Atmospheric conditions

## Game Mechanics

### Rank Progression
Players advance through Space Force enlisted ranks by earning points:
- Specialist 1-4 (E-1 to E-4)
- Sergeant (E-5)
- Staff Sergeant (E-6)
- Technical Sergeant (E-7)
- Master Sergeant (E-8)
- Senior Master Sergeant (E-9)
- Chief Master Sergeant (E-10)

### Task Categories
- **🛡️ O₂ Sensor Check**: Oxygen system diagnostics
- **🚀 Pre-Launch Ops**: Launch preparation tasks
- **⚡ Fuel Systems**: Fuel flow and mixture analysis
- **🧭 Navigation**: Directional calibration
- **🌍 Celestial Obs**: Planetary observation
- **⭐ Stellar Nav**: Deep space navigation

### Timer System
- **Speed Bonus**: Most tasks count up, rewarding faster completion
- **Time Limited**: Very advanced tasks have countdown timers for added pressure

## Development Guidelines

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
- **Example Format**:
  ```json
  {
    "input": [
      [0, 1, 1],
      [0, 1, 1],
      [1, 0, 0]
    ],
    "output": [[3]]
  }
  ```
- The app should be able to import standard ARC-AGI files like those from the official repositories
- Note: Existing files in the tasks folder may use emojis directly, but all new files should follow the standard integer format

### Modifying Emoji Sets
1. Edit `client/src/constants/spaceEmojis.ts`
2. Maintain exactly 10 emojis per set
3. Keep index 0 as `⬛` (black background)
4. Update `EMOJI_SET_INFO` with descriptions

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

## Running the Application

### Development
```bash
npm run dev
```
Starts both frontend (Vite) and backend (Express) on port 5000

### Production
The application is configured for Replit deployment with automatic process management.

## Future Enhancements

### Scalability Considerations
- Database migration from in-memory to persistent storage

### Feature Roadmap

- UI/UX improvements
- Achievement and badge systems
- Officer track with complex transformations

## Contributing

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Modular architecture with clear separation of concerns
- Comprehensive error handling and logging

### Testing
- Unit tests for task validation logic
- Integration tests for API endpoints
- E2E tests for critical user flows

For questions or support, refer to the inline documentation and type definitions throughout the codebase.