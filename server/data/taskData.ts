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
  }
];