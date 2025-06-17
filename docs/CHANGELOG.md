# Changelog

## 2025-06-17

### Task JSON Standardization - Improved Approach

- Updated specific task files to ensure `timeLimit` is set to `null`.
- Converted emoji grids in tasks using `tech_set1` and `tech_set2` to numeric format (1-9 system).
- Avoided using 0 (black square) in onboarding puzzles for better visual appeal.
- Replaced unknown emojis with 1 instead of 0 for clearer visuals.
- Created an improved script (`fix-task-files.js`) with better mapping for emoji conversion.

#### Design Philosophy
- For onboarding and basic tasks, visual clarity is important.
- The value 0 represents a black square and should be used sparingly in puzzles.
- All puzzles have proper numeric representations that maintain the original intent.

#### Tasks with Time Limit Updated (8 files)
COM-002, COM-004, COM-006, FS-002, FS-003, FS-006, FS-007, FS-009

#### Tech Set Tasks Converted to Numeric Format (17 files)
- `tech_set1` tasks: COM-001 through COM-007
- `tech_set2` tasks: FS-001 through FS-010
