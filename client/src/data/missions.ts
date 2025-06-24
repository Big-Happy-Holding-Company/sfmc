// Missions is a misnomer, it's not a list of missions, it's the tasks that the player can complete to advance their rank.
// Categories are the different types of tasks in the game.
// IDs are the unique identifiers for each task.
// Not sure how this file is actually even used.  



export const MISSION_CATEGORIES = [
  {
    id: "OS",
    name: "🛡️ O₂ Sensor Check",
    description: "Atmospheric monitoring systems",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 4×4",
  },
  {
    id: "FS",
    name: "⚡ Fuel Systems",
    description: "Primary fuel line diagnostics", 
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 4×4",
  },
  {
    id: "NAV",
    name: "🧭 Navigation",
    description: "Vector calibration systems",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 4×4",
  },
  {
    id: "PL",
    name: "🚀 Pre-Launch Ops", 
    description: "Launch sequence verification",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 4×4",
  },
  {
    id: "COM",
    name: "📡 Communications",
    description: "Signal relay and interference systems",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 4×4",
  },
  {
    id: "PWR",
    name: "⚡ Power Systems",
    description: "Energy distribution networks",
    difficulty: "Advanced",
    gridSize: "3×3 - 4×4",
  },
  {
    id: "SEC",
    name: "🔐 Security Systems",
    description: "Access control matrices",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 4×4",
  },
];
//Not sure we use this 
export const DIFFICULTY_COLORS: Record<string, string> = {
  "Basic": "mission-green",
  "Intermediate": "mission-blue", 
  "Advanced": "mission-red",
  "Expert (Officer Rank)": "mission-amber",
};
