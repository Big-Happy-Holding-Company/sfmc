# Puzzle Tasks Plan (2025-06-17)
*Author: Cascade*

## Overview
The following plan outlines the steps required to generate or rewrite basic emoji-based puzzles for several task JSON files. All puzzles must:
1. Follow the task schema demonstrated in `FS-001.json`.
2. Leverage simple ARC-style transformations (pattern completion, reflection, rotation) documented in `arc_transformations.md`.
3. Use only the `0-9` integer tokens which the game engine later maps to the exact emoji sets defined in `spaceEmojis.ts` (source of truth – **no direct emoji characters in JSON**).
4. Mirror the style and structure of the validated example `NAV-001.json`.
5. Include clear, concise comments where the schema allows (e.g., `"meta"` / `"description"` fields) for designers.

## Files to Modify
- `server/data/tasks/PWR-001.json`
- `server/data/tasks/PWR-002.json`
- `server/data/tasks/PWR-003.json`
- `server/data/tasks/COM-001.json` *(rewrite)*
- `server/data/tasks/PL-001.json`
- `server/data/tasks/PL-003.json`

## Reference Files (Read-Only)
- `server/data/tasks/FS-001.json`  – schema template
- `server/data/tasks/NAV-001.json` – validated example puzzle
- `attached_assets/arc_transformations.md` – catalogue of permitted transformations
- `client/src/constants/spaceEmojis.ts` – **source of truth for emoji mapping**

## Tasks Checklist
- [ ] Review schema in **FS-001.json**
- [ ] Review transformation guidelines in **arc_transformations.md**
- [ ] Review emoji mapping in **spaceEmojis.ts**
- [ ] Review example **NAV-001.json**
- [ ] Design puzzle for **PWR-001.json**
- [ ] Design puzzle for **PWR-002.json**
- [ ] Design puzzle for **PWR-003.json**
- [ ] Rewrite puzzle in **COM-001.json**
- [ ] Design puzzle for **PL-001.json**
- [ ] Design puzzle for **PL-003.json**
- [ ] Append entry to **docs/changelog.md** with timestamp and summary of all changes

## Transformation Strategy
We will employ easy-to-grasp ARC transformations to keep puzzles accessible:
1. **Horizontal / Vertical Reflection** – Mirror patterns across an axis.
2. **90° Rotation** – Rotate sub-grids or entire grids.
3. **Simple Repetition / Pattern Extension** – Continue observable numeric patterns.
4. **Color / Token Replacement** – Swap specific numeric tokens using a mapping rule.

## Deliverables
- Updated JSON files containing valid puzzle data adhering to the schema.
- Updated `docs/changelog.md` capturing the work performed (timestamped).

---
**Please review and confirm this plan before I proceed with implementing the puzzles.**
