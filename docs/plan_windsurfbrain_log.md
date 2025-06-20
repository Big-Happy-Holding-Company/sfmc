# Templatization System Implementation Plan

## Notes
- The user is not a professional developer; explanations and comments must be clear and thorough.
- All emoji sets must reference spaceEmojis.ts as the source of truth.
- Project structure and implementation must follow d:\1Projects\sfmc\docs\templatization_implementation_plan.md.
- Begin with Phase 1: Foundation Setup, Step 1—create the basic project structure as outlined.
- Reference d:\1Projects\sfmc\shared\schema.ts and d:\1Projects\sfmc\README.md as sources of truth for schema and transformation types.
- Before proceeding with further phases, validate that generated tasks strictly conform to the rules and lessons in puzzle_tasks_plan_2025-06-17.md, using COM-001.json as a reference example.
- Full compliance must include all schema fields, content standards (hints, test pairs, emoji set keys, etc.), and transformation guidelines described in puzzle_tasks_plan_2025-06-17.md.
- Task IDs must count upwards sequentially from 100 within each category (e.g., COM-100, COM-101, ...).
- Each generated task must include exactly three hints, matching the COM-001.json example and the requirements in puzzle_tasks_plan_2025-06-17.md.
- Sequential task ID generation and the three-hint requirement are now actively enforced in code.
- The generator/factory logic and configuration have now been validated to produce correct COM-100.json and FS-100.json files matching the schema and content standards. The next step is to generate 4x4 grid tasks for all remaining categories.
- The correct CLI flag for grid size is `-s`/`--size` (not `--grid-size`).
- The generator/factory logic and validator logic for transformation name handling and explicit transformation type (from task definition, not ID) have now been debugged and fixed.
- Transformation names and category codes must be validated against actual values in the project source of truth (not just schema/reference); audit generator/factory logic for both category and transformation name handling.
- Ensure transformation type names (e.g., "rotation_90deg") and category names/codes are always sourced from transformations.ts and categories.ts, never guessed or inferred from filenames or user input. This is a strict requirement and must be enforced to prevent errors.
- Transformation name handling, category name usage audit, and validator logic update are now complete.
- Several 4x4 grid tasks for the remaining categories (OS, PL, NAV, PWR, SEC) have now been successfully generated and validated.
- The TypeScript/ESM configuration (tsconfig.json) must be correct (e.g., "module": "ESNext", "ts-node": { "esm": true }) to ensure the generator/factory tools execute and output files reliably; manual fixes are not a sustainable solution.

## Task List
- [x] Review and understand the entire implementation plan in templatization_implementation_plan.md
- [x] Create the basic project structure as defined in Phase 1, Step 1
  - [x] server/templates/categories.ts
  - [x] server/templates/transformations.ts
  - [x] server/templates/generators/
  - [x] server/templates/validators.ts
  - [x] server/tools/task-factory.ts
  - [x] server/tools/test-runner.ts
- [x] Define category templates in categories.ts (Phase 1, Step 2)
- [x] Correct category templates in categories.ts to match README.md (Phase 1, Step 2)
- [x] Implement Task Interface in task.interface.ts (Phase 1, Step 3)
- [x] Define core transformations in transformations.ts (Phase 2, Step 4)
- [x] Implement grid generator classes in generators/ (Phase 2, Step 5)
  - [x] HorizontalReflectionGenerator
  - [x] Rotation90DegGenerator
  - [x] PatternCompletionGenerator
  - [x] XorOperationGenerator
  - [x] ObjectCountingGenerator
- [x] All grid generators are complete
- [x] Implement task factory in task-factory.ts (Phase 3, Step 6)
- [x] Implement validation system in validators.ts (Phase 3, Step 7)
- [x] Implement test runner in test-runner.ts (Phase 3, Step 8)
- [x] Implement CLI tools for task generation (Phase 4)
- [x] Validate generated tasks against puzzle_tasks_plan_2025-06-17.md and COM-001.json example
  - [x] Create a comprehensive checklist covering all schema and content standards from puzzle_tasks_plan_2025-06-17.md
  - [x] Checklist must explicitly verify sequential task IDs (starting at 100) and presence of three hints per task
  - [x] Validate at least one generated task end-to-end against this checklist
  - [x] Update generators/validators as needed to ensure compliance
  - [x] Update tsconfig.json to ensure proper ESM/TypeScript compatibility and verify that generator/factory scripts run as expected
  - [x] Compare generated tasks (e.g., COM-100.json) to COM-001.json and revise the generator/factory logic to ensure full schema and content compliance
  - [x] Generate and validate an FS category task using the updated generator/factory
  - [x] Debug and fix transformation name handling to match schema/reference files
  - [x] Audit transformation and category name usage in generator/factory logic to ensure strict compliance with project sources
  - [x] Update validator logic to use explicit transformation type from task definition, not task ID
- [x] Generate 4x4 grid tasks for PWR and SEC categories

## Current Goal
All required 4x4 grid tasks generated; review or extend as needed