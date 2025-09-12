# Project Knowledge Base: PlayFab Architecture

**Last Updated**: 2025-09-12
**Author**: Cascade (as Senior Software Architect)

**Purpose**: This document serves as the single source of truth for understanding the PlayFab integration within the Space Force Mission Control project. It is structured for clarity and to be easily parsed by both human developers and LLMs.

---

## 1. Core Architecture

This project utilizes a **Backend-as-a-Service (BaaS)** model with PlayFab as the exclusive backend. The frontend is a static React site that communicates directly with PlayFab APIs.

- **Frontend**: React + Vite (`client/`)
- **Backend**: PlayFab Cloud Services (No custom server)
- **Styling**: Tailwind CSS + shadcn/ui
- **External APIs**: `arc-explainer` (for AI performance metadata)

### Guiding Principles
- **Single Source of Truth**: All game data, puzzle data, and user data resides in PlayFab.
- **No Local Fallbacks**: The application relies entirely on PlayFab for data. There are no local JSON files for puzzles used in production.
- **Secure by Design**: Critical operations like solution validation and data updates are handled by server-side CloudScript to prevent client-side manipulation.

---

## 2. PlayFab Data Storage Strategy

Our PlayFab integration uses a multi-layered approach to store data, providing both high-level summaries for leaderboards and granular details for research.

### Layer 1: Title Data (The "Game Content")

This is the static configuration for the entire game.

- **Purpose**: Stores all puzzle and task definitions.
- **Keys**:
    - `AllTasks`: A JSON array of 155 tasks for the main game.
    - `officer-tasks-training-batch*.json`: 400 puzzles.
    - `officer-tasks-training2-batch*.json`: 1000 puzzles.
    - `officer-tasks-evaluation-batch*.json`: 400 puzzles.
    - `officer-tasks-evaluation2-batch*.json`: 120 puzzles.
- **Access**: Fetched on client startup via `GetTitleData()`.

### Layer 2: Player Statistics (The "Scoreboard")

These are simple, indexed numerical values used for competitive ranking.

- **Purpose**: Drives the leaderboards.
- **Statistics**:
    - `LevelPoints`: For the main game.
    - `OfficerTrackPoints`: For the ARC-AGI puzzles.
- **Access**: Updated via `UpdatePlayerStatistics` and read via `GetLeaderboard`.

### Layer 3: Player User Data (The "Player File")

This is a flexible key-value store for each player, where we keep detailed records.

- **Purpose**: To track individual player progress and detailed performance outcomes.
- **Key**: `humanPerformanceData`
- **Value**: A JSON string representing an array of objects. Each object is a record of a successfully completed puzzle.
- **Schema for each record**:
    ```json
    {
      "puzzleId": "string",
      "correct": true,
      "scoreData": {
        "finalScore": "number",
        "timeBonus": "number",
        "basePoints": "number"
      },
      "newTotalPoints": "number",
      "timestamp": "ISO_string"
    }
    ```
- **Update Logic**: This data is **append-only** and managed exclusively by the `ValidateARCPuzzle` CloudScript function to ensure data integrity.

### Layer 4: PlayFab Events (The "Replay Log")

This is the most granular layer, capturing every player interaction.

- **Purpose**: To provide a detailed, step-by-step replay of a player's solution process for deep analysis and research.
- **Mechanism**: The client sends events to PlayFab via the `WritePlayerEvent` API.
- **Key Events**:
    - `game_start`: Session initiation.
    - `player_action`: Every grid interaction (`cell_change`, `grid_resize`, etc.).
    - `validation_complete`: The result of every attempt (success or fail).
    - `game_completion`: Final confirmation of a successful solution.
- **Data Analysis**: To calculate metrics like **total actions** or **precise time-to-solution**, this event stream must be queried and aggregated offline.

---

## 3. Core Services & API Interaction

All interactions with PlayFab are managed through a set of dedicated services in `client/src/services/playfab/`.

- **`playFabCore.ts`**: The foundation. All API calls must go through `playFabCore.makeHttpRequest()`. This ensures that the necessary `X-Authentication` session ticket is always included in the headers.
- **`auth.ts`**: Handles `LoginWithCustomID` and session management.
- **`userData.ts`**: Manages getting and setting data in the Player User Data store (e.g., `humanPerformanceData`).
- **`events.ts`**: Responsible for sending the detailed event stream to PlayFab.
- **`officerTrack.ts` & `validation.ts`**: Handle the logic for the Officer Track, including calling the `ValidateARCPuzzle` CloudScript.

### CloudScript Functions

We use server-side CloudScript for secure, authoritative actions:

1.  **`ValidateARCPuzzle`**: The most critical function. It validates a player's solution, calculates the score, and updates both the Player Statistics (for leaderboards) and the `humanPerformanceData` array (for detailed history).
2.  **`GenerateAnonymousName`**: Creates unique, anonymous display names for players.

---

## 4. Critical Development Guidelines & Pitfalls

This section documents key lessons learned to prevent recurring issues.

### Core Rules
1.  **Authentication is Mandatory**: Never use a direct `fetch()` to a PlayFab API. **Always** use `playFabCore.makeHttpRequest()` to ensure the session ticket is attached.
2.  **Avoid Service Recursion**: Never call a `get` function from within its corresponding `update` function (e.g., `getOfficerPlayerData` inside `updateOfficerPlayerData`). This causes infinite loops. Pass the data as an argument or use a cached value instead.
3.  **Safely Parse JSON**: PlayFab Title Data or User Data can sometimes return a literal string `"undefined"`. Always check for this before calling `JSON.parse()` to prevent crashes.
    ```typescript
    // Safe parsing pattern
    if (dataValue && dataValue !== 'undefined') {
      const parsed = JSON.parse(dataValue);
      // ... proceed
    }
    ```

### Debugging Workflow
1.  **Check the Console for Infinite Loops**: This is the primary symptom of service recursion.
2.  **Log the Raw API Response**: Don't just log `success`. Log the entire `response.Data` object to inspect the actual data structure returned from PlayFab.
3.  **Use the `scripts/` Directory**: The tools in this directory are essential for verifying data, exploring APIs, and debugging issues. Refer to `docs/playfab-tools-reference.md` for a full guide.

---

## 5. External API: `arc-explainer`

While PlayFab is our backend, we use the external `arc-explainer` API for one specific purpose: **enriching the Officer Track puzzle selection**.

- **URL**: `https://arc-explainer-production.up.railway.app`
- **Purpose**: To identify puzzles that are particularly interesting for human players, specifically those where AI models performed poorly, were overconfident in wrong answers, or generated untrustworthy explanations.
- **Key Endpoints Used**:
    - `/api/puzzle/worst-performing`: To find puzzles where AI failed.
    - `/api/puzzle/confidence-stats`: To find puzzles where AI was overconfident in a wrong answer.
    - `/api/puzzle/performance-stats`: To get trustworthiness scores.