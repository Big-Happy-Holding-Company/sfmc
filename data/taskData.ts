// Embedded task data for production deployment

import type { Task } from '../../shared/schema';

export const EMBEDDED_TASKS: Task[] = [
  {
    "id": "FS-001",
    "title": "Basic Fuel Flow Check",
    "description": "Primary fuel lines showing irregular flow patterns. Study the mechanical component patterns.",
    "category": "⚡ Fuel Systems",
    "difficulty": "Basic",
    "gridSize": 2,
    "timeLimit": null,
    "basePoints": 500,
    "requiredRankLevel": 1,
    "emojiSet": "tech_set2",
    "examples": [
      {
        "input": [["⚙️", "⬛"], ["⬛", "🔧"]],
        "output": [["🔧", "⬛"], ["⬛", "⚙️"]]
      },
      {
        "input": [["🔨", "🛠️"], ["⬛", "⬛"]],
        "output": [["⬛", "⬛"], ["🛠️", "🔨"]]
      }
    ],
    "testInput": [["⚛️", "⬛"], ["🎛️", "⬛"]],
    "testOutput": [["⬛", "🎛️"], ["⬛", "⚛️"]],
    "hints": [
      "Notice how the mechanical components change positions.",
      "The transformation swaps items diagonally across the grid.",
      "Top-left and bottom-right positions are exchanged."
    ]
  },
  {
    "id": "FS-002",
    "title": "Fuel Line Symmetry Check",
    "description": "Fuel distribution requires mirror symmetry verification. Analyze the reflection patterns in the system diagnostics.",
    "category": "⚡ Fuel Systems",
    "difficulty": "Intermediate",
    "gridSize": 3,
    "timeLimit": 120,
    "basePoints": 650,
    "requiredRankLevel": 2,
    "emojiSet": "tech_set2",
    "examples": [
      {
        "input": [
          ["⚙️", "⬛", "🔧"],
          ["⬛", "⚛️", "⬛"],
          ["🛠️", "⬛", "🔨"]
        ],
        "output": [
          ["🔧", "⬛", "⚙️"],
          ["⬛", "⚛️", "⬛"],
          ["🔨", "⬛", "🛠️"]
        ]
      },
      {
        "input": [
          ["🔋", "🎛️", "⬛"],
          ["⚡", "⬛", "💻"],
          ["⬛", "🛠️", "🔧"]
        ],
        "output": [
          ["⬛", "🎛️", "🔋"],
          ["💻", "⬛", "⚡"],
          ["🔧", "🛠️", "⬛"]
        ]
      }
    ],
    "testInput": [
      ["⚙️", "🔨", "⬛"],
      ["💡", "⚛️", "🎛️"],
      ["⬛", "🔧", "🛠️"]
    ],
    "testOutput": [
      ["⬛", "🔨", "⚙️"],
      ["🎛️", "⚛️", "💡"],
      ["🛠️", "🔧", "⬛"]
    ],
    "hints": [
      "Look for a reflection pattern across the vertical center line.",
      "Elements on the left side appear on the right side in mirrored positions.",
      "The center column remains unchanged during the transformation."
    ]
  },
  {
    "id": "FS-003",
    "title": "Fuel Pressure Equalization",
    "description": "Critical fuel systems require pressure balancing across connected chambers. Balance the distribution network.",
    "category": "⚡ Fuel Systems",
    "difficulty": "Advanced",
    "gridSize": 4,
    "timeLimit": 180,
    "basePoints": 800,
    "requiredRankLevel": 3,
    "emojiSet": "tech_set2",
    "examples": [
      {
        "input": [
          ["⚙️", "⚙️", "⬛", "⬛"],
          ["⚙️", "⚙️", "⬛", "⬛"],
          ["⬛", "⬛", "🔧", "🔧"],
          ["⬛", "⬛", "🔧", "🔧"]
        ],
        "output": [
          ["⚙️", "⚙️", "🔧", "🔧"],
          ["⚙️", "⚙️", "🔧", "🔧"],
          ["⚙️", "⚙️", "🔧", "🔧"],
          ["⚙️", "⚙️", "🔧", "🔧"]
        ]
      }
    ],
    "testInput": [
      ["🛠️", "🛠️", "⬛", "⬛"],
      ["🛠️", "🛠️", "⬛", "⬛"],
      ["⬛", "⬛", "⚛️", "⚛️"],
      ["⬛", "⬛", "⚛️", "⚛️"]
    ],
    "testOutput": [
      ["🛠️", "🛠️", "⚛️", "⚛️"],
      ["🛠️", "🛠️", "⚛️", "⚛️"],
      ["🛠️", "🛠️", "⚛️", "⚛️"],
      ["🛠️", "🛠️", "⚛️", "⚛️"]
    ],
    "hints": [
      "Each quadrant expands to fill the empty adjacent quadrant.",
      "The pattern fills the entire grid maintaining the original boundaries.",
      "Objects spread to equalize pressure across connected regions."
    ]
  },
  {
    "id": "NAV-001",
    "title": "Navigation Vector Check",
    "description": "Navigation systems require directional calibration. Study the arrow transformation patterns.",
    "category": "🧭 Navigation",
    "difficulty": "Basic",
    "gridSize": 2,
    "timeLimit": null,
    "basePoints": 420,
    "requiredRankLevel": 1,
    "emojiSet": "nav_alerts",
    "examples": [
      {
        "input": [["⬆️", "⬛"], ["⬛", "⬇️"]],
        "output": [["⬇️", "⬛"], ["⬛", "⬆️"]]
      },
      {
        "input": [["⬅️", "➡️"], ["⬛", "⬛"]],
        "output": [["⬛", "⬛"], ["➡️", "⬅️"]]
      }
    ],
    "testInput": [["↗️", "⬛"], ["🧭", "⬛"]],
    "testOutput": [["⬛", "🧭"], ["⬛", "↗️"]],
    "hints": [
      "Observe how directional arrows change positions.",
      "The pattern swaps elements diagonally across the grid.",
      "Navigation vectors move to opposite diagonal positions."
    ]
  },
  {
    "id": "NAV-002",
    "title": "Coordinate Rotation Protocol",
    "description": "Navigation arrays require 90-degree clockwise rotation for orbital alignment. Study the directional transformation patterns.",
    "category": "🧭 Navigation",
    "difficulty": "Intermediate",
    "gridSize": 3,
    "timeLimit": 150,
    "basePoints": 600,
    "requiredRankLevel": 2,
    "emojiSet": "nav_alerts",
    "examples": [
      {
        "input": [
          ["⬆️", "➡️", "⬇️"],
          ["⬅️", "🧭", "↗️"],
          ["↙️", "↖️", "↘️"]
        ],
        "output": [
          ["↙️", "⬅️", "⬆️"],
          ["↖️", "🧭", "➡️"],
          ["↘️", "↗️", "⬇️"]
        ]
      },
      {
        "input": [
          ["⬆️", "⬛", "⬇️"],
          ["⬛", "🧭", "⬛"],
          ["⬅️", "⬛", "➡️"]
        ],
        "output": [
          ["⬅️", "⬛", "⬆️"],
          ["⬛", "🧭", "⬛"],
          ["➡️", "⬛", "⬇️"]
        ]
      }
    ],
    "testInput": [
      ["↗️", "⬆️", "↖️"],
      ["➡️", "🧭", "⬅️"],
      ["↘️", "⬇️", "↙️"]
    ],
    "testOutput": [
      ["↘️", "➡️", "↗️"],
      ["⬇️", "🧭", "⬆️"],
      ["↙️", "⬅️", "↖️"]
    ],
    "hints": [
      "The grid rotates 90 degrees clockwise around the center.",
      "Each directional arrow also rotates to match its new position.",
      "The center element remains stationary during rotation."
    ]
  },
  {
    "id": "NAV-003",
    "title": "Gravitational Field Mapping",
    "description": "Navigation requires understanding object attraction patterns. Objects move toward the center of gravitational influence.",
    "category": "🧭 Navigation",
    "difficulty": "Advanced",
    "gridSize": 4,
    "timeLimit": 200,
    "basePoints": 850,
    "requiredRankLevel": 3,
    "emojiSet": "nav_alerts",
    "examples": [
      {
        "input": [
          ["⬆️", "⬛", "⬛", "⬇️"],
          ["⬛", "⬛", "⬛", "⬛"],
          ["⬛", "⬛", "🧭", "⬛"],
          ["⬅️", "⬛", "⬛", "➡️"]
        ],
        "output": [
          ["⬛", "⬛", "⬛", "⬛"],
          ["⬛", "⬇️", "➡️", "⬛"],
          ["⬛", "⬅️", "🧭", "⬆️"],
          ["⬛", "⬛", "⬛", "⬛"]
        ]
      }
    ],
    "testInput": [
      ["↗️", "⬛", "⬛", "↖️"],
      ["⬛", "⬛", "⬛", "⬛"],
      ["⬛", "⬛", "🧭", "⬛"],
      ["↘️", "⬛", "⬛", "↙️"]
    ],
    "testOutput": [
      ["⬛", "⬛", "⬛", "⬛"],
      ["⬛", "↙️", "↖️", "⬛"],
      ["⬛", "↘️", "🧭", "↗️"],
      ["⬛", "⬛", "⬛", "⬛"]
    ],
    "hints": [
      "Objects are attracted toward the central gravitational source.",
      "Each arrow moves one step closer to the center position.",
      "The gravitational center (🧭) remains stationary."
    ]
  },
  {
    "id": "OS-001",
    "title": "Oxygen Sensor Calibration",
    "description": "Basic systems health checks are part of our daily routine here. Lend us a hand by examining the previous correct configurations and then correctly configure the new sensor.",
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
      },
      {
        "input": [["🟢", "🔵"], ["⬛", "⬛"]],
        "output": [["⬛", "⬛"], ["🔵", "🟢"]]
      }
    ],
    "testInput": [["🟣", "⬛"], ["🟠", "⬛"]],
    "testOutput": [["⬛", "🟠"], ["⬛", "🟣"]],
    "hints": [
      "Look at how the colored indicators change positions.",
      "The transformation swaps elements diagonally across the grid.",
      "Top-left goes to bottom-right, bottom-left goes to top-right."
    ]
  },
  {
    "id": "OS-002",
    "title": "Atmospheric Pressure Check",
    "description": "Secondary oxygen sensors need recalibration. Here's what worked before, can you recalibrate our setting to restore proper atmospheric readings?",
    "category": "🛡️ O₂ Sensor Check",
    "difficulty": "Basic",
    "gridSize": 2,
    "timeLimit": null,
    "basePoints": 400,
    "requiredRankLevel": 1,
    "emojiSet": "status_main",
    "examples": [
      {
        "input": [["🔴", "🟢"], ["🔵", "🟡"]],
        "output": [["🟡", "🔵"], ["🟢", "🔴"]]
      }
    ],
    "testInput": [["🟣", "🟠"], ["⬛", "🔴"]],
    "testOutput": [["🔴", "⬛"], ["🟠", "🟣"]],
    "hints": [
      "Notice the rotation pattern in the transformation.",
      "The grid rotates 180 degrees clockwise.",
      "Bottom-right becomes top-left, top-left becomes bottom-right."
    ]
  },
  {
    "id": "OS-003",
    "title": "Pattern Fill Algorithm",
    "description": "Oxygen sensor arrays need pattern completion. Fill empty spaces following the established color sequence patterns.",
    "category": "🛡️ O₂ Sensor Check",
    "difficulty": "Intermediate",
    "gridSize": 3,
    "timeLimit": 120,
    "basePoints": 550,
    "requiredRankLevel": 2,
    "emojiSet": "status_main",
    "examples": [
      {
        "input": [
          ["🔴", "⬛", "🔴"],
          ["⬛", "🟢", "⬛"],
          ["🔴", "⬛", "🔴"]
        ],
        "output": [
          ["🔴", "🟢", "🔴"],
          ["🟢", "🟢", "🟢"],
          ["🔴", "🟢", "🔴"]
        ]
      },
      {
        "input": [
          ["🔵", "🟡", "⬛"],
          ["🟡", "⬛", "🟡"],
          ["⬛", "🟡", "🔵"]
        ],
        "output": [
          ["🔵", "🟡", "🔵"],
          ["🟡", "🔵", "🟡"],
          ["🔵", "🟡", "🔵"]
        ]
      }
    ],
    "testInput": [
      ["🟣", "⬛", "🟣"],
      ["⬛", "🟠", "⬛"],
      ["🟣", "⬛", "🟣"]
    ],
    "testOutput": [
      ["🟣", "🟠", "🟣"],
      ["🟠", "🟠", "🟠"],
      ["🟣", "🟠", "🟣"]
    ],
    "hints": [
      "Look for the dominant color pattern in the corners.",
      "Empty spaces are filled with the center color.",
      "The transformation creates a checkerboard-like pattern."
    ]
  },
  {
    "id": "PL-001",
    "title": "Pre-Launch Sequence Alpha",
    "description": "Critical pre-launch systems require pattern verification. Study the radar and equipment positioning patterns.",
    "category": "🚀 Pre-Launch Ops",
    "difficulty": "Basic",
    "gridSize": 2,
    "timeLimit": null,
    "basePoints": 450,
    "requiredRankLevel": 1,
    "emojiSet": "tech_set1",
    "examples": [
      {
        "input": [["🛩️", "⬛"], ["⬛", "📡"]],
        "output": [["📡", "⬛"], ["⬛", "🛩️"]]
      },
      {
        "input": [["🔭", "⚡"], ["⬛", "⬛"]],
        "output": [["⬛", "⬛"], ["⚡", "🔭"]]
      }
    ],
    "testInput": [["🔋", "⬛"], ["💻", "⬛"]],
    "testOutput": [["⬛", "💻"], ["⬛", "🔋"]],
    "hints": [
      "Look at how equipment positions change between input and output.",
      "The transformation swaps elements diagonally across the grid.",
      "Each non-empty cell moves to the opposite diagonal position."
    ]
  },
  {
    "id": "PL-002",
    "title": "Launch Sequence Color Coding",
    "description": "Pre-launch systems require color propagation analysis. Objects spread their colors to adjacent empty spaces.",
    "category": "🚀 Pre-Launch Ops",
    "difficulty": "Intermediate",
    "gridSize": 3,
    "timeLimit": 100,
    "basePoints": 700,
    "requiredRankLevel": 2,
    "emojiSet": "tech_set1",
    "examples": [
      {
        "input": [
          ["🔋", "⬛", "⬛"],
          ["⬛", "⬛", "⬛"],
          ["⬛", "⬛", "💻"]
        ],
        "output": [
          ["🔋", "🔋", "⬛"],
          ["🔋", "⬛", "💻"],
          ["⬛", "💻", "💻"]
        ]
      },
      {
        "input": [
          ["⬛", "🛩️", "⬛"],
          ["⬛", "⬛", "⬛"],
          ["📡", "⬛", "⬛"]
        ],
        "output": [
          ["🛩️", "🛩️", "🛩️"],
          ["📡", "⬛", "⬛"],
          ["📡", "📡", "⬛"]
        ]
      }
    ],
    "testInput": [
      ["⚡", "⬛", "⬛"],
      ["⬛", "⬛", "⬛"],
      ["⬛", "⬛", "🔭"]
    ],
    "testOutput": [
      ["⚡", "⚡", "⬛"],
      ["⚡", "⬛", "🔭"],
      ["⬛", "🔭", "🔭"]
    ],
    "hints": [
      "Each object expands to fill one adjacent empty space.",
      "Objects spread horizontally and vertically, not diagonally.",
      "Multiple objects can expand simultaneously without overlapping."
    ]
  },
  {
    "id": "PL-003",
    "title": "Launch Trajectory Calculation",
    "description": "Pre-launch systems require trajectory path optimization. Calculate the optimal launch vector through the obstacle field.",
    "category": "🚀 Pre-Launch Ops",
    "difficulty": "Advanced",
    "gridSize": 4,
    "timeLimit": 220,
    "basePoints": 950,
    "requiredRankLevel": 3,
    "emojiSet": "tech_set1",
    "examples": [
      {
        "input": [
          ["🚀", "⬛", "❌", "⬛"],
          ["⬛", "❌", "⬛", "⬛"],
          ["❌", "⬛", "⬛", "❌"],
          ["⬛", "⬛", "⬛", "🎯"]
        ],
        "output": [
          ["🚀", "🔥", "❌", "⬛"],
          ["⬛", "❌", "🔥", "⬛"],
          ["❌", "⬛", "⬛", "🔥"],
          ["⬛", "⬛", "⬛", "🎯"]
        ]
      }
    ],
    "testInput": [
      ["🚀", "⬛", "❌", "⬛"],
      ["⬛", "⬛", "⬛", "❌"],
      ["❌", "⬛", "❌", "⬛"],
      ["⬛", "⬛", "⬛", "🎯"]
    ],
    "testOutput": [
      ["🚀", "🔥", "❌", "⬛"],
      ["⬛", "🔥", "⬛", "❌"],
      ["❌", "🔥", "❌", "⬛"],
      ["⬛", "🔥", "⬛", "🎯"]
    ],
    "hints": [
      "Find the diagonal path from rocket to target avoiding obstacles.",
      "Use flame markers (🔥) to show the trajectory path.",
      "The path must avoid all obstacle markers (❌)."
    ]
  },
  {
    "id": "COM-001",
    "title": "Signal Relay Connection",
    "description": "Communication arrays require connection path analysis. Find the shortest path between signal endpoints.",
    "category": "📡 Communications",
    "difficulty": "Basic",
    "gridSize": 3,
    "timeLimit": 90,
    "basePoints": 400,
    "requiredRankLevel": 1,
    "emojiSet": "tech_set1",
    "examples": [
      {
        "input": [
          ["📡", "⬛", "⬛"],
          ["⬛", "⬛", "⬛"],
          ["⬛", "⬛", "💻"]
        ],
        "output": [
          ["📡", "📶", "⬛"],
          ["⬛", "📶", "⬛"],
          ["⬛", "📶", "💻"]
        ]
      },
      {
        "input": [
          ["🛰️", "⬛", "⬛"],
          ["⬛", "⬛", "⬛"],
          ["⬛", "⬛", "📻"]
        ],
        "output": [
          ["🛰️", "📶", "⬛"],
          ["⬛", "📶", "⬛"],
          ["⬛", "📶", "📻"]
        ]
      }
    ],
    "testInput": [
      ["📡", "⬛", "⬛"],
      ["⬛", "⬛", "⬛"],
      ["⬛", "⬛", "🔭"]
    ],
    "testOutput": [
      ["📡", "📶", "⬛"],
      ["⬛", "📶", "⬛"],
      ["⬛", "📶", "🔭"]
    ],
    "hints": [
      "Connect the two communication devices with a direct path.",
      "Use signal bars (📶) to create the connection line.",
      "The path follows the shortest route between endpoints."
    ]
  },
  {
    "id": "COM-002",
    "title": "Signal Interference Cancellation",
    "description": "Communication arrays suffer from signal interference. Remove interference patterns while preserving primary signals.",
    "category": "📡 Communications",
    "difficulty": "Intermediate",
    "gridSize": 3,
    "timeLimit": 110,
    "basePoints": 580,
    "requiredRankLevel": 2,
    "emojiSet": "tech_set1",
    "examples": [
      {
        "input": [
          ["📡", "📶", "📡"],
          ["📶", "❌", "📶"],
          ["📡", "📶", "📡"]
        ],
        "output": [
          ["📡", "⬛", "📡"],
          ["⬛", "⬛", "⬛"],
          ["📡", "⬛", "📡"]
        ]
      },
      {
        "input": [
          ["🛰️", "❌", "💻"],
          ["❌", "📶", "❌"],
          ["📻", "❌", "🔭"]
        ],
        "output": [
          ["🛰️", "⬛", "💻"],
          ["⬛", "📶", "⬛"],
          ["📻", "⬛", "🔭"]
        ]
      }
    ],
    "testInput": [
      ["📡", "❌", "🛰️"],
      ["❌", "📶", "❌"],
      ["💻", "❌", "📻"]
    ],
    "testOutput": [
      ["📡", "⬛", "🛰️"],
      ["⬛", "📶", "⬛"],
      ["💻", "⬛", "📻"]
    ],
    "hints": [
      "Remove all interference markers (❌) from the grid.",
      "Replace interference with empty space (⬛).",
      "Keep all communication devices and valid signals intact."
    ]
  },
  {
    "id": "PWR-001",
    "title": "Power Grid Cascade Analysis",
    "description": "Energy distribution systems require cascade failure prevention. Analyze how power flows through connected components.",
    "category": "⚡ Power Systems",
    "difficulty": "Advanced",
    "gridSize": 4,
    "timeLimit": 240,
    "basePoints": 900,
    "requiredRankLevel": 3,
    "emojiSet": "tech_set2",
    "examples": [
      {
        "input": [
          ["🔋", "⬛", "⬛", "⬛"],
          ["⬛", "⚡", "⬛", "⬛"],
          ["⬛", "⬛", "⚡", "⬛"],
          ["⬛", "⬛", "⬛", "💡"]
        ],
        "output": [
          ["🔋", "🔌", "⬛", "⬛"],
          ["🔌", "⚡", "🔌", "⬛"],
          ["⬛", "🔌", "⚡", "🔌"],
          ["⬛", "⬛", "🔌", "💡"]
        ]
      }
    ],
    "testInput": [
      ["🔋", "⬛", "⬛", "⬛"],
      ["⬛", "⬛", "⚡", "⬛"],
      ["⬛", "⚡", "⬛", "⬛"],
      ["⬛", "⬛", "⬛", "💡"]
    ],
    "testOutput": [
      ["🔋", "🔌", "⬛", "⬛"],
      ["🔌", "🔌", "⚡", "🔌"],
      ["⬛", "⚡", "🔌", "🔌"],
      ["⬛", "⬛", "🔌", "💡"]
    ],
    "hints": [
      "Power flows from the battery to the light through the shortest path.",
      "Power nodes (⚡) act as connection points in the grid.",
      "Empty spaces between connected components become power lines (🔌)."
    ]
  },
  {
    "id": "SEC-001",
    "title": "Security Grid Pattern Lock",
    "description": "Access control systems require pattern recognition for security clearance. Complete the missing elements in the security matrix.",
    "category": "🔐 Security Systems",
    "difficulty": "Basic",
    "gridSize": 3,
    "timeLimit": 80,
    "basePoints": 380,
    "requiredRankLevel": 1,
    "emojiSet": "status_main",
    "examples": [
      {
        "input": [
          ["🔴", "🟢", "🔴"],
          ["🟢", "⬛", "🟢"],
          ["🔴", "🟢", "🔴"]
        ],
        "output": [
          ["🔴", "🟢", "🔴"],
          ["🟢", "🔴", "🟢"],
          ["🔴", "🟢", "🔴"]
        ]
      },
      {
        "input": [
          ["🔵", "🟡", "🔵"],
          ["🟡", "⬛", "🟡"],
          ["🔵", "🟡", "🔵"]
        ],
        "output": [
          ["🔵", "🟡", "🔵"],
          ["🟡", "🔵", "🟡"],
          ["🔵", "🟡", "🔵"]
        ]
      }
    ],
    "testInput": [
      ["🟣", "🟠", "🟣"],
      ["🟠", "⬛", "🟠"],
      ["🟣", "🟠", "🟣"]
    ],
    "testOutput": [
      ["🟣", "🟠", "🟣"],
      ["🟠", "🟣", "🟠"],
      ["🟣", "🟠", "🟣"]
    ],
    "hints": [
      "The center cell should match the corner pattern.",
      "Look at the alternating color pattern around the edges.",
      "The missing center takes the color that appears in the corners."
    ]
  }
];