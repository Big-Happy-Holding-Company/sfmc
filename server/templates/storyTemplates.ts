/**
 * Story Template Loader for the Story Wrapper System
 * ------------------------------------------------
 * This module loads narrative templates from problems.json and provides
 * a clean interface for the story-factory to access them.
 * 
 * All templates are stored in server/data/problems.json so writers
 * can modify them without touching TypeScript code.
 * 
 * Author: Cascade (model)
 * Date: 2025-06-21
 */

import fs from 'fs';
import path from 'path';

export interface StoryTemplate {
  /** Unique slug so writers can force-select a template if desired */
  id: string;
  title: string;
  description: string;
}

// Transformation keys recognised by the task factory
export type TransformationKey =
  | "horizontal_reflection"
  | "rotation_90deg"
  | "pattern_completion"
  | "vertical_reflection"
  | "rotation_270deg";

/**
 * Load narrative templates from JSON, with fallbacks if file is missing or invalid
 */
function loadStoryTemplates(): Record<TransformationKey, StoryTemplate[]> {
  // Fallback templates in case JSON file is missing or invalid
  const fallbackTemplates: Record<TransformationKey, StoryTemplate[]> = {
    horizontal_reflection: [{
      id: "mirror_panels",
      title: "Flip the Solar Grid!",
      description: "🚀 Crisis! {{antagonist}} was taking selfies 📱 near the control panel and knocked the solar array blueprint backwards ⇄! Now the panels face deep space instead of the Sun ☀️, and life support is failing! Study the before → after symbol grids to see the flip. Mirror today's entire grid left-to-right ↔️ to restore oxygen 💨 before time runs out ⏰!",
    }],
    rotation_90deg: [{
      id: "quarter_spin",
      title: "Realign the Launch Pad 90°!",
      description: "🔥 Countdown halted! {{antagonist}} was playing mobile games 🎮 and carelessly spun the launch-pad orientation map one quarter-turn ↻ (90° clockwise). Now the boosters point at Mission Control 🏢 instead of orbit 🛰️! Study the sample symbol grids to see the rotation. Turn today's entire grid 90° clockwise 🔃 to save everyone from fiery disaster 💥!",
    }],
    pattern_completion: [{
      id: "complete_colors",
      title: "Finish the Color Pattern!",
      description: "📡 Pattern failure! {{antagonist}} was too busy watching space soap operas 📺 to complete the transmission grid. Half the critical relay symbols are missing ❓ and astronauts can't call home 📞! Examine the example grids to see how blank spaces should be filled. Complete today's symbol grid with the correct patterns ✨ to restore communication for the stranded crew 👩‍🚀👨‍🚀!",
    }],
    vertical_reflection: [{
      id: "mirror_vertical",
      title: "Flip the Radar Upside Down!",
      description: "📡 Radar calamity! {{antagonist}} spilled coffee ☕ on the console and flipped the radar display upside-down. The ground looks like sky and incoming ships are showing up backwards 🛸! Study the before → after symbol grids to see the flip. Mirror today's entire grid top-to-bottom 🔼🔽 to prevent spacecraft collisions 💥!",
    }],
    rotation_270deg: [{
      id: "three_spin",
      title: "Spin the Grid 270°!",
      description: "🌌 Trajectory disaster! {{antagonist}} was showing off to visitors 👥 and spun the flight deck display three full clicks ↻↻↻ (270° clockwise). Now the rocket's aimed at the Moon 🌙 instead of Mars 🔴 and we've got minutes ⏱️ to fix it! Study the before → after symbol grids to see the exact rotation. Turn today's entire grid 270° clockwise 🔃 to save the $4 billion mission 🚀💰!",
    }],
  };
  
  try {
    // Attempt to load templates from JSON file
    const dataPath = path.resolve(__dirname, '..', 'data', 'problems.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      
      // Validate parsed data to ensure it has all required transformation types
      const isValid = [
        'horizontal_reflection',
        'rotation_90deg',
        'pattern_completion',
        'vertical_reflection',
        'rotation_270deg'
      ].every(key => 
        Array.isArray(parsed[key]) && 
        parsed[key].length > 0 && 
        parsed[key].every((template: any) => 
          typeof template.id === 'string' && 
          typeof template.title === 'string' && 
          typeof template.description === 'string'
        )
      );
      
      if (isValid) {
        return parsed as Record<TransformationKey, StoryTemplate[]>;
      }
    }
  } catch (error) {
    console.error('Error loading story templates from JSON:', error);
  }
  
  // Return fallback templates if loading fails
  return fallbackTemplates;
}

/**
 * Map of ARC-AGI transformation type → narrative templates.
 * Placeholders follow double-brace syntax, e.g. {{antagonist}}.
 * Loaded from problems.json with fallbacks if file is missing or invalid.
 */
export const StoryTemplates = loadStoryTemplates();