"use strict";
/**
 * Categories definition for SFMC puzzles
 *
 * This file serves as the source of truth for all category metadata used in task generation.
 * Each category defines properties that will be applied to tasks of that category.
 *
 * @author Cascade
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_TEMPLATES = void 0;
exports.getNextTaskId = getNextTaskId;
/**
 * Source of truth for all category metadata
 * These categories align with the Mission Control system requirements
 * and use emoji sets defined in spaceEmojis.ts
 */
exports.CATEGORY_TEMPLATES = {
    OS: {
        categoryCode: "OS",
        categoryName: "🛡️ O₂ Sensor Check",
        emojiSet: "status_main",
        basePoints: 350,
        requiredRankLevel: 1
    },
    PL: {
        categoryCode: "PL",
        categoryName: "🚀 Pre-Launch Ops",
        emojiSet: "celestial_set1",
        basePoints: 300,
        requiredRankLevel: 1
    },
    FS: {
        categoryCode: "FS",
        categoryName: "⚡ Fuel Systems",
        emojiSet: "tech_set1",
        basePoints: 325,
        requiredRankLevel: 1
    },
    NAV: {
        categoryCode: "NAV",
        categoryName: "🧭 Navigation",
        emojiSet: "nav_alerts",
        basePoints: 350,
        requiredRankLevel: 1
    },
    COM: {
        categoryCode: "COM",
        categoryName: "📡 Communications",
        emojiSet: "tech_set2",
        basePoints: 400,
        requiredRankLevel: 1
    },
    PWR: {
        categoryCode: "PWR",
        categoryName: "⚡ Power Systems",
        emojiSet: "tech_set1",
        basePoints: 375,
        requiredRankLevel: 1
    },
    SEC: {
        categoryCode: "SEC",
        categoryName: "🔒 Security",
        emojiSet: "status_alerts",
        basePoints: 425,
        requiredRankLevel: 1
    }
};
/**
 * Store the last used task number for each category to ensure sequential IDs
 */
var lastUsedTaskNumbers = {};
/**
 * Get the next task ID for a category
 * @param categoryCode The category code (e.g., "COM", "NAV")
 * @returns Task ID in the format "CAT-100", incrementing sequentially
 */
function getNextTaskId(categoryCode) {
    // Start from 100 if this category hasn't been used yet
    if (!lastUsedTaskNumbers[categoryCode]) {
        lastUsedTaskNumbers[categoryCode] = 100;
    }
    else {
        // Otherwise, increment the last used number
        lastUsedTaskNumbers[categoryCode]++;
    }
    // Format the task ID with leading zeros (e.g., "COM-100")
    var number = lastUsedTaskNumbers[categoryCode].toString().padStart(3, '0');
    return "".concat(categoryCode, "-").concat(number);
}
