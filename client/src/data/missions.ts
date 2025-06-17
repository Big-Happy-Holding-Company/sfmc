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
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 3×3",
  },
  {
    id: "fuel-systems",
    name: "⚡ Fuel Systems",
    description: "Primary fuel line diagnostics", 
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 3×3",
  },
  {
    id: "navigation",
    name: "🧭 Navigation",
    description: "Vector calibration systems",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 4×4",
  },
  {
    id: "pre-launch",
    name: "🚀 Pre-Launch Ops", 
    description: "Launch sequence verification",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 4×4",
  },
  {
    id: "communications",
    name: "📡 Communications",
    description: "Signal relay and interference systems",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 3×3",
  },
  {
    id: "power-systems",
    name: "⚡ Power Systems",
    description: "Energy distribution networks",
    difficulty: "Advanced",
    gridSize: "3×3 - 4×4",
  },
  {
    id: "security-systems",
    name: "🔐 Security Systems",
    description: "Access control matrices",
    difficulty: "Basic - Advanced",
    gridSize: "2×2 - 3×3",
  },
];

export const DIFFICULTY_COLORS: Record<string, string> = {
  "Basic": "mission-green",
  "Intermediate": "mission-blue", 
  "Advanced": "mission-red",
  "Expert": "mission-amber",
};
