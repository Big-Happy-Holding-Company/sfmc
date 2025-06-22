/**
 * Story Factory – narrative wrapper for ARC-AGI tasks
 * --------------------------------------------------
 * This module augments a mechanically generated task with a humorous
 * Space-Force-2050 narrative. It is intentionally **pure** (no side-effects),
 * with all story content loaded from external JSON files:
 * 
 * - ai_failure.json: PRIMARY source of narrative content organized by transformation type
 *   Contains comic situations, AI difficulty explanations, and kid-friendly hints
 * 
 * This modular design allows writers to update content without touching code.
 * 
 * Author: Cascade Claude 3.7 Sonnet Thinking 
 * Date: 2025-06-22
 * Updated: 2025-06-22 - Changed to use ai_failure.json as primary content source
 */

import fs from "fs";
import path from "path";
import { TaskDefinition } from "../templates/task.interface";
import { TransformationKey } from "../templates/storyTemplates";

/** Options to influence AI failure content selection */
export interface StoryOptions {
  comicSituationIndex?: number; // Force a particular comic situation (1-3)
  randomizeHints?: boolean; // Whether to randomize the order of kids_explanation hints (default: false)
}

/** 
 * Default AI Failure content in case the JSON file is missing 
 * Contains simplified version of one transformation type
 */
const aiFallbackData = {
  "horizontal_reflection": {
    "ai_difficulty": "AI struggles with spatial reasoning and mirror symmetry.",
    "comic_situation1": "The AI kept trying to calculate mirror reflections pixel by pixel.",
    "comic_situation2": "Mission Control's guidance system confused left and right when mirroring.",
    "comic_situation3": "The life support display showed oxygen readings backwards for 2 hours.",
    "kids_explanation": "Computers don't understand mirrors like you do.",
    "kids_explanation1": "It's like reading your name in a mirror - you figure it out easily, computers struggle.",
    "kids_explanation2": "Imagine flipping a tower of blocks - you just see it, computers calculate each block."
  }
};

/** 
 * Utility: Load AI failure content from server/data/ai_failure.json 
 * 
 * @returns The loaded AI failure content or fallback if loading failed
 */
function loadAIFailureContent() {
  try {
    // Try multiple path approaches to find the file
    const possiblePaths = [
      path.resolve(__dirname, "..", "data", "ai_failure.json"),
      path.resolve(process.cwd(), "server", "data", "ai_failure.json"),
      path.resolve(".", "server", "data", "ai_failure.json")
    ];
    
    // Try each path until we find one that exists
    let dataPath = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        dataPath = p;
        break;
      }
    }
    
    if (dataPath) {
      const raw = fs.readFileSync(dataPath, "utf-8");
      const parsed = JSON.parse(raw);
      console.log(`Successfully loaded AI failure content from ${dataPath}`);
      return parsed;
    } else {
      console.warn("Warning: ai_failure.json not found in any of the expected locations, using fallback data");
    }
  } catch (error) {
    console.error("Error loading ai_failure.json:", error);
    /* Will fall back to default values */
  }
  return aiFallbackData;
}

/**
 * Main entry point. Applies AI failure content to the task based on its transformation type.
 *
 * @param task  The task to enrich with AI failure content.
 * @param opts  Optional overrides to guide content selection.
 */
export function applyStory(
  task: TaskDefinition,
  opts: StoryOptions = {}
): TaskDefinition {
  const transformationType = task.transformationType as TransformationKey | undefined;

  if (!transformationType) {
    // Transformation not recognized – return task unchanged.
    console.warn("Warning: No transformation type specified in task");
    return task;
  }

  // Load AI failure content
  const aiFailureContent = loadAIFailureContent();
  
  // Check if we have content for this transformation type
  if (!aiFailureContent[transformationType]) {
    console.warn(`No AI failure content found for transformation type: ${transformationType}`);
    return task;
  }

  // Get the appropriate content for this transformation
  const content = aiFailureContent[transformationType];
  
  // Select which comic situation to use (randomly or via options)
  let comicSituationIndex = opts.comicSituationIndex;
  if (!comicSituationIndex || comicSituationIndex < 1 || comicSituationIndex > 3) {
    comicSituationIndex = Math.floor(Math.random() * 3) + 1;
  }
  
  const comicSituation = content[`comic_situation${comicSituationIndex}`];
  const aiDifficulty = content.ai_difficulty;
  
  // Create enhanced description by prepending comic situation and AI difficulty
  const enhancedDescription = `${comicSituation} ${aiDifficulty} ${task.description}`;
  
  // Get the kid-friendly explanations
  const kidsExplanations = [
    content.kids_explanation,
    content.kids_explanation1,
    content.kids_explanation2
  ];
  
  // Combine the existing hints with the kid-friendly explanations
  const enhancedHints = [...kidsExplanations];
  
  // Add the original hints after the kid-friendly explanations
  if (task.hints && Array.isArray(task.hints)) {
    enhancedHints.push(...task.hints);
  }
  
  return {
    ...task,
    description: enhancedDescription,
    hints: enhancedHints,
  };
}