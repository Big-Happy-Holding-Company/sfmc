/**
 * Narrative template definitions for the Story Wrapper System.
 *
 * Writers Tips:
 * 1. Use double-brace placeholders like {{antagonist}}, {{antagonist1}}, {{antagonist2}}, {{component}}.
 * 2. You can introduce your own placeholder names; just ensure `story-factory.ts` is updated to substitute them.
 * 3. Keep titles short (<60 chars) and descriptions <180 chars so they fit UI cards.
 * 4. Focus on what the player must conceptually do (e.g., “count distinct blobs”) rather than low-level technical terms.
 *
 * Author: Cascade with o3 (high reasoning)
 */

export interface StoryTemplate {
  /** Unique slug so writers can force-select a template if desired */
  id: string;
  title: string;
  description: string;
}

// Transformation keys recognised by the existing task factory
export type TransformationKey =
  | "horizontal_reflection"
  | "rotation_90deg"
  | "pattern_completion"
  | "xor_operation"
  | "object_counting";

/**
 * Map of ARC-AGI transformation type → available narrative templates.
 * Placeholders follow simple double-brace syntax, e.g. {{antagonist}}.
 */
export const StoryTemplates: Record<TransformationKey, StoryTemplate[]> = {
  horizontal_reflection: [
    {
      id: "mirror_mischief",
      title: "{{antagonist}}'s Solar Arrays Are Flipping Out!",
      description:
        "The starboard panels are mirroring port panels after a software glitch. Perform a horizontal reflection to straighten the arrays before power drops!",
    },
  ],
  rotation_90deg: [
    {
      id: "spin_cycle",
      title: "{{component}} Needs a Quarter-Turn Twist!",
      description:
        "Your {{component}} got rotated while dodging space junk. Rotate the grid 90° to restore proper orientation before mission data becomes unreadable.",
    },
  ],
  pattern_completion: [
    {
      id: "predictive_patterns",
      title: "Fill the Gaps in {{antagonist}}'s Starlink Maze!",
      description:
        "{{antagonist}} left an unfinished broadcast pattern. Complete the sequence so comms stay synced across the fleet.",
    },
  ],
  xor_operation: [
    {
      id: "signal_smash",
      title: "Satellites Are Colliding!",
      description:
        "{{antagonist1}} and {{antagonist2}} are in a feud and their comm-sats keep toggling each other’s signals. Apply XOR to stabilise their channels before mission control goes silent!",
    },
  ],
  object_counting: [
    {
      id: "blob_tally",
      title: "How Many Blobs in the Grid?",
      description:
        "Sensors show amorphous energy blobs drifting across the panel. Build the diagnostics grid where each cell reports how many blobs of its colour appear in the original display—mission control needs the full colour-coded count matrix!",
    },
    {
      id: "cluster_control",
      title: "{{component}} Cluster Audit",
      description:
        "Your {{component}} is overwhelmed by unidentified pixel clusters. Construct a compact summary grid that lists the count of each cluster colour so mission control can rebalance power!",
    },
  ],
};
