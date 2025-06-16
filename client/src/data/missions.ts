export const RANK_ICONS: Record<string, string> = {
  "Specialist 1": "🪖",
  "Specialist 2": "🪖🪖", 
  "Specialist 3": "🪖🪖🪖",
  "Specialist 4": "🪖⭐",
  "Sergeant": "⭐",
  "Second Lieutenant": "🎖️",
};

export const MISSION_CATEGORIES = [
  {
    id: "o2-sensor",
    name: "🛡️ O₂ Sensor Check",
    description: "2×2 Grids • Basic",
    difficulty: "Basic",
    gridSize: "2×2",
  },
  {
    id: "pre-launch",
    name: "🚀 Pre-Launch Ops", 
    description: "3×3 Grids • Intermediate",
    difficulty: "Intermediate",
    gridSize: "3×3",
  },
  {
    id: "fuel-systems",
    name: "⚡ Fuel Systems",
    description: "4×4 Grids • Advanced", 
    difficulty: "Advanced",
    gridSize: "4×4",
  },
  {
    id: "officer-track",
    name: "🎖️ Officer Track",
    description: "Variable Grids • Expert",
    difficulty: "Expert", 
    gridSize: "Variable",
  },
];

export const DIFFICULTY_COLORS: Record<string, string> = {
  "Basic": "mission-green",
  "Intermediate": "mission-blue", 
  "Advanced": "mission-red",
  "Expert": "mission-amber",
};
