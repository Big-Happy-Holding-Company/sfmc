# Story Wrapper System Plan

*Author: Cascade (o3 high reasoning)*  
*Date: 2025-06-21*

## Objective
Provide a modular narrative layer (“story wrapper”) that adds humorous Space-Force-2050 context to the mechanically generated ARC-AGI puzzles without altering underlying logic/data.

## High-Level Approach
1. **Generate puzzle mechanics** – existing `task-factory.ts` remains unchanged.
2. **Apply AI Failure content** – `task-factory.ts`, `story-factory.ts`, and `generate-task.ts` should use the AI Failure content from `ai_failure.json` as the primary narrative wrapper for all new tasks. This replaces the previous placeholder-based approach.
3. **Output** – tasks will automatically include appropriate comic situations, AI difficulty explanations, and kid-friendly explanations based on their transformation type.

## New Files / Folders
| Path | Purpose |
| --- | --- |
| `server/tools/story-factory.ts` | Core function `applyStory(task, opts)` + lightweight helper utilities. |
| `server/templates/storyTemplates.ts` | Pure data: map of transformation → array of `{ title, description }` templates containing Handlebars-style placeholders `{{placeholder}}`. |
| `server/data/antagonists.json` | List of antagonists for inserting as story elements via the `{{antagonist}}` placeholder. |
| `server/data/components.json` | List of ship/mission components for inserting as story elements via the `{{component}}` placeholder. |
| `server/data/problems.json` | List of transformations for inserting as story elements via the `{{problem}}` placeholder. |
| `server/data/ai_failure.json` | **PRIMARY** source of narrative content for all new tasks. Contains comic situations, AI difficulty explanations, and kid-friendly hints organized by transformation type. Should be used directly by task-factory.ts, story-factory.ts, and generate-task.ts when generating new tasks. |

> NOTE: Only `story-factory.ts` contains logic; all narrative content lives in data files so non-dev writers can update without code changes. The `ai_failure.json` file is now the primary source for narrative content in task generation.

Writers can add or remove entries freely.

## API Surface
```ts
interface StoryOptions {
  antagonist?: string;      // Force a particular antagonist (optional)
  templateId?: string;      // Force a particular template key
}

function applyStory(task: Task, opts?: StoryOptions): Task; // returns cloned & enriched task
```

## Testing Strategy (Standalone)
1. Pull a few existing JSON tasks from `server/data/tasks/`.
2. Run a script (`npx tsx scripts/test-story-wrapper.ts`) that loads each task, applies the story wrapper, and prints before/after.
3. Manual review by design team.

## Current Integration
The story wrapper system now uses AI Failure content exclusively. The CLI generator, task factory, and story factory should all pull content directly from `ai_failure.json` for each new task based on its transformation type, including:
1. Random comic situation as part of the task description
2. AI difficulty explanation as part of the task description
3. Three kid-friendly explanations at the beginning of the hints array

## Outstanding Tasks
- Update `task-factory.ts`, `story-factory.ts`, and `generate-task.ts` to use AI failure content from `ai_failure.json`
- Ensure all new tasks are automatically enriched with appropriate comic situations, AI difficulty explanations, and kid-friendly hints
- Generate a set of 4x4 grid tasks for each category with different transformations using the AI failure content system
- Validate that the enriched tasks have the correct narrative elements



---
Plan modified by user.
