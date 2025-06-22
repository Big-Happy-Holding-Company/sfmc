/**
 * Categories definition for SFMC puzzles
 * 
 * This file serves as the source of truth for all category metadata used in task generation.
 * Each category defines properties that will be applied to tasks of that category.
 * 
 * @author Cascade
 */

import { EmojiSet } from "../../client/src/constants/spaceEmojis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * CategoryTemplate defines task properties that are driven by category.
 * Maps 1:1 with Task properties in schema.ts
 */
export interface CategoryTemplate {
  categoryCode: string;       // Two/three-letter code (e.g., "COM" or "OS" or "PL" or "PWR" or "SEC" or "NAV" or "FS")
  categoryName: string;       // Display name with emoji must conform to schema.ts
  emojiSet: EmojiSet;        // Must exist as a set key in spaceEmojis.ts
  basePoints: number;        // Default point value
  requiredRankLevel: number; // Usually 1
}

/**
 * Source of truth for all category metadata
 * These categories align with the Mission Control system requirements
 * and use emoji sets defined in spaceEmojis.ts
 */
export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  OS: {
    categoryCode: "OS",
    categoryName: "🛡️ O₂ Sensor Check",
    emojiSet: "status_main",
    basePoints: 1550,
    requiredRankLevel: 1
  },
  PL: {
    categoryCode: "PL",
    categoryName: "🚀 Pre-Launch Ops",
    emojiSet: "celestial_set1",
    basePoints: 2300,
    requiredRankLevel: 1
  },
  FS: {
    categoryCode: "FS",
    categoryName: "⚡ Fuel Systems",
    emojiSet: "tech_set1",
    basePoints: 2325,
    requiredRankLevel: 1
  },
  NAV: {
    categoryCode: "NAV",
    categoryName: "🧭 Navigation",
    emojiSet: "nav_alerts",
    basePoints: 2350,
    requiredRankLevel: 1
  },
  COM: {
    categoryCode: "COM",
    categoryName: "📡 Communications",
    emojiSet: "tech_set2",
    basePoints: 1400,
    requiredRankLevel: 1
  },
  PWR: {
    categoryCode: "PWR",
    categoryName: "⚡ Power Systems",
    emojiSet: "tech_set1",
    basePoints: 1675,
    requiredRankLevel: 1
  },
  SEC: {
    categoryCode: "SEC",
    categoryName: "🔒 Security",
    emojiSet: "status_alerts",
    basePoints: 5325,
    requiredRankLevel: 1
  }
};

/**
 * Store the last used task number for each category to ensure sequential IDs
 */
const lastUsedTaskNumbers: Record<string, number> = {};

/**
 * Get the next task ID for a category
 * @param categoryCode The category code (e.g., "COM", "NAV")
 * @returns Task ID in the format "CAT-100", incrementing sequentially
 */
export function getNextTaskId(categoryCode: string): string {
  // If this is the first time we need an ID for this category in this process,
  // scan the tasks directory so we start AFTER the highest existing number.
  if (!lastUsedTaskNumbers[categoryCode]) {
    const tasksDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "data",
      "tasks"
    );
    let highest = 99; // we will increment after determining current highest

    if (fs.existsSync(tasksDir)) {
      const files = fs.readdirSync(tasksDir);
      const regex = new RegExp(`^${categoryCode}-(\\d{3})\\.json$`);
      for (const file of files) {
        const match = file.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > highest) highest = num;
        }
      }
    }

    lastUsedTaskNumbers[categoryCode] = highest + 1;
  } else {
    // Subsequent calls while the process is alive simply increment in-memory value
    lastUsedTaskNumbers[categoryCode] += 1;
  }

  const number = lastUsedTaskNumbers[categoryCode].toString().padStart(3, "0");
  return `${categoryCode}-${number}`;
}
