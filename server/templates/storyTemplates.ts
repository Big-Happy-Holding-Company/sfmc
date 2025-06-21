/**
 * Narrative template definitions for the Story Wrapper System.
 *
 * Each template explains— in plain, kid-friendly words— how the player at
 * US Space Force Mission Control should manipulate an ARC-AGI colored grid.
 * Grids are pixel art where numbers 0-9 map to colors (0 = black).
 * The file provides one clear template per transformation type, using a single
 * {{antagonist}} placeholder. Titles stay under 60 chars; descriptions under 180.
 *
 * Author: Cascade (model)
 */

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
 * Map of ARC-AGI transformation type → narrative templates.
 * Placeholders follow double-brace syntax, e.g. {{antagonist}}.
 */
export const StoryTemplates: Record<TransformationKey, StoryTemplate[]> = {
  /** Horizontal reflection: flip entire grid left ↔ right */
  horizontal_reflection: [
    {
      id: "mirror_panels",
      title: "Flip the Solar Grid!",
      description:
        "🚀 Crisis! {{antagonist}} was taking selfies 📱 near the control panel and knocked the solar array blueprint backwards ⇄! Now the panels face deep space instead of the Sun ☀️, and life support is failing! Study the before → after symbol grids to see the flip. Mirror today's entire grid left-to-right ↔️ to restore oxygen 💨 before time runs out ⏰!",
    },
  ],

  /** 90-degree clockwise rotation */
  rotation_90deg: [
    {
      id: "quarter_spin",
      title: "Realign the Launch Pad 90°!",
      description:
        "🔥 Countdown halted! {{antagonist}} was playing mobile games 🎮 and carelessly spun the launch-pad orientation map one quarter-turn ↻ (90° clockwise). Now the boosters point at Mission Control 🏢 instead of orbit 🛰️! Study the sample symbol grids to see the rotation. Turn today's entire grid 90° clockwise 🔃 to save everyone from fiery disaster 💥!",
    },
  ],

  /** Fill missing squares to complete pattern */
  pattern_completion: [
    {
      id: "complete_colors",
      title: "Finish the Color Pattern!",
      description:
        "📡 Pattern failure! {{antagonist}} was too busy watching space soap operas 📺 to complete the transmission grid. Half the critical relay symbols are missing ❓ and astronauts can't call home 📞! Examine the example grids to see how blank spaces should be filled. Complete today's symbol grid with the correct patterns ✨ to restore communication for the stranded crew 👩‍🚀👨‍🚀!",
    },
  ],

  /** Vertical reflection: flip entire grid top ↔ bottom */
  vertical_reflection: [
    {
      id: "mirror_vertical",
      title: "Flip the Radar Upside Down!",
      description:
        "📡 Radar calamity! {{antagonist}} spilled coffee ☕ on the console and flipped the radar display upside-down. The ground looks like sky and incoming ships are showing up backwards 🛸! Study the before → after symbol grids to see the flip. Mirror today's entire grid top-to-bottom 🔼🔽 to prevent spacecraft collisions 💥!",
    },
  ],

  /** 270-degree clockwise rotation (three clicks) */
  rotation_270deg: [
    {
      id: "three_spin",
      title: "Spin the Grid 270°!",
      description:
        "🌌 Trajectory disaster! {{antagonist}} was showing off to visitors 👥 and spun the flight deck display three full clicks ↻↻↻ (270° clockwise). Now the rocket's aimed at the Moon 🌙 instead of Mars 🔴 and we've got minutes ⏱️ to fix it! Study the before → after symbol grids to see the exact rotation. Turn today's entire grid 270° clockwise 🔃 to save the $4 billion mission 🚀💰!",
    },
  ],
};