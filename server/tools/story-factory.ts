/**
 * Story Factory – narrative wrapper for ARC-AGI tasks
 * --------------------------------------------------
 * This module augments a mechanically generated task with a humorous
 * Space-Force-2050 narrative. It is intentionally **pure** (no side-effects),
 * with all story content loaded from external JSON files:
 * 
 * - problems.json: Contains all story templates organized by transformation type
 * - antagonists.json: List of antagonists who cause the problems
 * - components.json: List of ship/system components that get broken
 * 
 * This modular design allows writers to update content without touching code.
 * 
 * Author: Cascade with o3 (high reasoning)
 * Date: 2025-06-21
 */

import fs from "fs";
import path from "path";
import { TaskDefinition } from "../templates/task.interface";
import {
  StoryTemplates,
  TransformationKey,
  StoryTemplate,
} from "../templates/storyTemplates";

/** Options writers can use to influence the output */
export interface StoryOptions {
  antagonist?: string; // Force a particular antagonist name
  component?: string; // Force a particular ship/system component
  templateId?: string; // Force a particular narrative template id
}

/** Fallback data in case the JSON lists are missing */
// Primary and secondary lists for placeholder substitutions
const antagonistsFallback = [
  "Elun Stink",
  "Joffrey Beezooos",
  "Mork Zickarborg", 
  "The Tesla Corporation",
  "The SpaceX Corporation"
];

const componentsFallback = [
  "gyro-stabilizer",
  "life-support unit",
  "quantum nav computer",
  "solar array controller",
  "navigation interface",
  "orbital scanner",
  "comms relay",
  "reactor core"
];

/** 
 * Utility: Load a simple JSON array from server/data/ 
 * 
 * @param filename The JSON file to load from server/data/
 * @param fallback Fallback array to use if file can't be loaded
 * @returns The loaded array or fallback if loading failed
 */
function loadJsonArray(filename: string, fallback: string[]): string[] {
  try {
    const dataPath = path.resolve(__dirname, "..", "data", filename);
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as string[];
      } else {
        console.warn(`Warning: ${filename} does not contain a valid array or is empty`); 
      }
    } else {
      console.warn(`Warning: ${filename} not found, using fallback data`);
    }
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    /* Will fall back to default values */
  }
  return fallback;
}

/**
 * Main entry point.
 *
 * @param task  The task to enrich.
 * @param opts  Optional overrides to guide template filling.
 */
export function applyStory(
  task: TaskDefinition,
  opts: StoryOptions = {}
): TaskDefinition {
  const key = task.transformationType as TransformationKey | undefined;

  if (!key || !(key in StoryTemplates)) {
    // Transformation not recognised – return task unchanged.
    return task;
  }

  // Choose template
  const templates = StoryTemplates[key];
  let chosen: StoryTemplate | undefined = undefined;

  if (opts.templateId) {
    chosen = templates.find((t) => t.id === opts.templateId);
  }
  if (!chosen) {
    chosen = templates[Math.floor(Math.random() * templates.length)];
  }

  // Gather substitution data
  const antagonists = loadJsonArray("antagonists.json", antagonistsFallback);
  const components = loadJsonArray("components.json", componentsFallback);

  const antagonist = opts.antagonist ??
    antagonists[Math.floor(Math.random() * antagonists.length)];
    const component = opts.component ??
    components[Math.floor(Math.random() * components.length)];

  // In case templates need two distinct antagonists
  let antagonist1 = antagonist;
  let antagonist2 = antagonist;
  if (/{{\s*antagonist2\s*}}/i.test(chosen.title + chosen.description)) {
    // Ensure antagonist2 differs from antagonist1 if possible
    const others = antagonists.filter((a) => a !== antagonist1);
    antagonist2 = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : antagonist1;
  }

  const placeholderMap: Record<string, string> = {
    antagonist: antagonist1,
    antagonist1: antagonist1,
    antagonist2: antagonist2,
    component,
  };

  const substitute = (text: string) =>
    text.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => placeholderMap[key] || "");

  return {
    ...task,
    title: substitute(chosen.title),
    description: substitute(chosen.description),
  };
}
