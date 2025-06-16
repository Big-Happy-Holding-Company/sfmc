# Mission Control 2045

A Space Force-themed ARC puzzle game where cadets complete operational tasks to advance through enlisted ranks.

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
      "input": [["🟡", "⬛"], ["⬛", "🔴"]],
      "output": [["🔴", "⬛"], ["⬛", "🟡"]]
    }
  ],
  "testInput": [["🟣", "⬛"], ["🟠", "⬛"]],
  "testOutput": [["⬛", "🟠"], ["⬛", "🟣"]],
  "hints": [
    "Progressive hint 1",
    "Progressive hint 2", 
    "Final solution hint"
  ]
}
```

### Emoji Set System
Emoji sets follow ARC (Artificial Reasoning Challenge) conventions with exactly 10 emojis per set, mapping to color indices 0-9.

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
- **Time Limited**: Advanced tasks have countdown timers for added pressure

## Development Guidelines

### Adding New Tasks
1. Create a new JSON file in `server/data/tasks/`
2. Follow the task file structure above
3. Use appropriate emoji sets from `client/src/constants/spaceEmojis.ts`
4. Test the task transformation logic
5. Add progressive hints for player assistance

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
- Task validation service for community-contributed puzzles
- Performance monitoring for large task libraries
- Caching layer for frequently accessed tasks

### Feature Roadmap
- Multiplayer competitions
- Custom puzzle creation tools
- Advanced hint systems with visual aids
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