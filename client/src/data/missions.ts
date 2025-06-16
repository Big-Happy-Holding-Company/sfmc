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
    description: "Atmospheric monitoring systems",
    difficulty: "Basic",
    gridSize: "2×2",
  },
  {
    id: "fuel-systems",
    name: "⚡ Fuel Systems",
    description: "Primary fuel line diagnostics", 
    difficulty: "Basic",
    gridSize: "2×2",
  },
  {
    id: "navigation",
    name: "🧭 Navigation",
    description: "Vector calibration systems",
    difficulty: "Basic",
    gridSize: "2×2",
  },
  {
    id: "pre-launch",
    name: "🚀 Pre-Launch Ops", 
    description: "Launch sequence verification",
    difficulty: "Basic",
    gridSize: "2×2",
  },
];

export const DIFFICULTY_COLORS: Record<string, string> = {
  "Basic": "mission-green",
  "Intermediate": "mission-blue", 
  "Advanced": "mission-red",
  "Expert": "mission-amber",
};
