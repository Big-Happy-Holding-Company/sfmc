# Story Wrapper System Plan

*Author: Cascade (o3 high reasoning)*  
*Date: 2025-06-21*

## Objective
Provide a modular narrative layer (“story wrapper”) that adds humorous Space-Force-2050 context to the mechanically generated ARC-AGI puzzles without altering underlying logic/data.

## High-Level Approach
1. **Generate puzzle mechanics** – existing `task-factory.ts` remains unchanged.
2. **Apply story wrapper** – a new `story-factory.ts` takes the task object, selects a template, fills placeholders (antagonist, system component, etc.), and returns the enriched task.
3. **Output** – writers can preview or edit the resulting `title` and `description` before tasks are shipped.

## New Files / Folders
| Path | Purpose |
| --- | --- |
| `server/tools/story-factory.ts` | Core function `applyStory(task, opts)` + lightweight helper utilities. |
| `server/templates/storyTemplates.ts` | Pure data: map of transformation → array of `{ title, description }` templates containing Handlebars-style placeholders `{{placeholder}}`. |
| `server/data/antagonists.json` | Optional list of antagonists for writers. |
| `server/data/components.json` | Optional list of ship/mission components for placeholders. |

> NOTE: Only `story-factory.ts` contains logic; all narrative content lives in data files so non-dev writers can update without code changes.

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

## Future Integration (Deferred)
After validation, add a flag (`--with-story`) to the CLI generator to call `applyStory` automatically.

## Outstanding Tasks
- Scaffold new files with comments per project guidelines.
- Implement `applyStory` logic (simple and pure).
- Populate starter template JSON with one humorous example per transformation.
- Write demo script for QA team.

---
*End of plan.*
