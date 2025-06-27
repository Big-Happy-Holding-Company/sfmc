# SFMC Unity Port Roadmap

**Author:** Cascade  
**Created:** June 26, 2025  
**Purpose:** This document outlines the development roadmap for the Unity port of the Space Force Mission Control puzzle game, detailing planned features, enhancements, and implementation priorities.

## Project Overview

The Space Force Mission Control (SFMC) puzzle game is being ported from its current web-based implementation (React/Express) to Unity. This port will maintain the core ARC-AGI puzzle mechanics while enhancing the user experience with improved visuals, sound, player progression, and expanded puzzle types.

## UI Constraints & Puzzle Specifications

- **Grid Size Limitations:** Maximum comfortable grid size of 5x5 (I might be wrong on this?  I think a more clever layout with pinch to zoom and swipe to rotate might be possible and accommodate larger grids, this might be a stretch goal?)
- **Examples Per Task:** Limited to 2 examples per task for optimal UI display (Again, not sure if this is a limitation that more clever UI design might be able to overcome)
- **Transformation Types:** Maintain support for existing transformations while adding new varieties
- **Theme:** Continue the Mission Control 2050 narrative and aesthetic

## Current Transformation Types

The existing prototype implements five core transformation types:

1. **Horizontal Reflection** (geometric)
2. **Vertical Reflection** (geometric)
3. **90° Rotation** (geometric) 
4. **270° Rotation** (geometric)
5. **Pattern Completion** (logical)

Stretch Goal: 
6. Needs input based on the Expanded Puzzle Types section
7. Needs input based on the Expanded Puzzle Types section

## Feature Enhancement Priorities

### 1. Expanded Puzzle Types

Implement additional ARC-AGI transformations, focusing on those appropriate for the UI constraints:

#### Geometric Transformations
- **180° Rotation:** Complete the rotation set
- **Diagonal Reflections:** Both primary and secondary diagonal reflection

#### Logical Transformations (Needs audit from Rajesh or Winston)
I don't personally understand these very well and so I'm the least qualified to create or iterate or audit them.  I'm including them here for now, but I think we should focus on the geometric transformations first and then come back to these.  While the whole point of this game is puzzles that have combinatorial and logial depth that I'm not qualified to create or audit. 😬
- **XOR Operations:** Comparing grid cells to reveal patterns  (Maybe?  This seems like it would be too complex for automatic generation, but useful if we could templatize one or two small tasks across categories?)
- **Object Counting:** Simple counting operations within constrained grids (Maybe?  This seems like it would be too complex for automatic generation, but useful if we could templatize one or two small tasks across categories?)
- **AND/OR Operations:** Basic logical operations between grid cells (Maybe?  This seems like it would be too complex for automatic generation, but useful if we could templatize one or two small tasks across categories?)
- **Simple Pattern Extension:** Complete straightforward patterns within small grids

> **Note:** Avoid transformations requiring large grid operations or complex scaling that exceeds the 5x5 grid limitation for now.

### 2. Sound Design

Implement subtle audio feedback to enhance the user experience:

- **Sound System:** Implement a sound system that can be muted and unmuted.  This will be apart from the text-to-speech system.
- **Voice System:** Implement a voice system that reads all game text that would be shown to the user.  I think we can use ElevenLabs or similar? I realize this is huge technichal overhead and possibly a challenge, but I think it would be a great feature to have.  Needs comments on feasibility.

- **Interaction Sounds:** Gentle feedback for grid cell selection, submission, and navigation
- **Completion Sounds:** Satisfying audio cues for correct/incorrect solutions
- **Rank Advancement:** Special audio fanfare for rank promotions
- **Ambient Background:** Optional low-key ambient sounds during tasks
- **Medal/Achievement Sounds:** Unique sounds for earning achievements

### 3. Onboarding Experience  (Mark will take a first pass)

Rework the current onboarding modal into a more comprehensive tutorial:

- **5 Step Tutorial:** Using SEC-001, PWR-001, OS-001, etc. to introduce one transformation at a time, using the task brief to explain why a transformation is difficult for AI to perform. Players are shown an immediately obvious example and then how the AI fails to perform the transformation. (Hardcoded for now into the XXX-001 files)
- **Interactive Learning:** Guided examples with step-by-step assistance using the "hints" from the .json files.
- **Visual Cues:** Highlighting transformation patterns more explicitly via Unity frontend visual feedback
   - Currently the frontend is only showing the user a grid that is empty 

   #### 3.5 Hints

- **Persistent Help:** Access to hints via a button or modal sourced from the .json files throughout gameplay
   - Stretch goal: Each hint comes from a different persona that "costs" the player points silently on the backend calculation.  For example Hint 1 always comes from Sgt. Wyatt and is "hint1" from the .json file and is good and is only a 5% reduction in points.  Hint 2 comes from {persona1} and is "hint2" from the .json file and it might be good or bad and is a 10% reduction in points.  Hint 3 comes from {persona2} and is "hint3" from the .json file and it might be good or bad and is a 15% reduction in points.  

   Stretch goal or easter egg:
   - Solve with AI button: (Joke feature) is a 0% reduction in points, but it fills the grid with all the same emoji that the player must then manually remove.  The AI always says that it is 101% sure of its answer and encourages the player to just submit it without checking. 

### 4. Player State Management

Improve the management and persistence of player progress on the back end and front end:

- **Saved Progress:** Reliable cross-session progress retention
- **Skill Development:** Visualize players improvement over time or stats or something???
- **Customization Options:** Allow personalization of the interface and experience (Maybe???)

### 5. Achievement System

Implement a "Space Force Medals" achievement system to recognize player skills:

#### Medal Categories
- **Transformation Mastery:** Medals for specific transformation types
  - *Reflection Specialist* (horizontal/vertical reflection mastery)
  - *Rotation Commander* (rotation transformation mastery)
  - *Pattern Recognition Expert* (pattern completion excellence)
  - *Logic Operator* (excellence in logical operations)
  
- **Performance Medals:**
  - *Fast Draw* (exceptionally fast solutions)
  
- **Progression Achievements:**
  - *Rank advancement celebrations*
  - *Category mastery recognition*
  - *Difficulty level achievements*

  Each medal has a level 1 which is 5 tasks completed, level 2 is 10 tasks completed, etc. Medals share a consistent base graphic design, with higher levels distinguished by colored auras or enhancement effects (e.g., bronze, silver, gold, platinum auras) as players progress.

### 6. Scoring and Rank System Audit

Review and enhance the current scoring and rank system:

- **Balanced Difficulty Scaling:** Ensure appropriate point rewards relative to difficulty
- **Time Bonuses:** Review and adjust speed-based bonus calculations
- **Rank Requirements:** Balance the progression through Space Force enlisted ranks
- **Specialized Achievements:** Create achievement tracks for different player styles
-

## Technical Implementation Priorities

### Unity Development Focus

The Unity development team should prioritize:

1. **Core Game Architecture:**
   - Clean separation of game logic from presentation
   - Modular design for easy addition of new transformation types
   - Scalable UI system adaptable to different screen sizes

2. **Enhanced Visual Experience:**
   - Polished Mission Control themed UI elements
     - Want it to look like the high tech sci-fi panel with 7 control panels that are just large symbols: 🧭, 🚀, ⚡, 📡, 🔧, 🔒, 📊
     - See attached_assets\ui_concept.png for an example


   - Smooth interactions with the grid (Add possibility to drag and drop from the palette to the grid, with sound feedback)
   - Intuitive text-free symbolic interface

3. **Robust Player State System:**
   - Persistent player data storage
   - Achievement tracking framework
   

4. **Sound and Voice Framework:**
   - Event-based sound system
   - Volume controls and muting options
   - ElevenLabs integration for voice system

5. **Transformation Implementation:**
   - Framework for easy addition of new transformation types, expansion of task factory and generator
   - Visual debugging tools for transformation testing (Maybe???)
   - Automated validation systems for puzzles (Possible?)

## Implementation Schedule

Proposed development phases:

1. **Foundation Phase:**
   - Core game architecture - In Progress
   - Task factory - Needs Audit
   - Basic UI implementation - In Progress
   - Existing transformation port - In Progress

2. **Enhancement Phase:**
   - Sound system integration
   - Achievement framework
   - New transformation types

3. **Polish Phase:**
   - Tutorial system
   - Performance optimization
   - User testing and refinement

## Success Metrics

The Unity port should encompass the following:

1. Successfully ports the web prototype to Unity - Done
2. Implements the new features outlined in this roadmap
3. Provides a smoother, more engaging user experience
4. Appeals to the target audience of international young neurodiverse learners interested in abstract reasoning
5. Text-to-speech system is implemented and works well


---

This roadmap is a living document and may be updated as development progresses and new insights are gained through user feedback and testing.

Before we finalize this roadmap, I need input and decisions from the team on the following:

Grid Size & Examples

Should we prototype larger grids (6x6, 7x7) and more than 2 examples per task, or is 5x5/2-examples our hard limit for v1?
Logical Transformations

Rajesh/Winston: Can we prioritize at least one logical transformation for the first Unity release? Which one(s) do you recommend as feasible and valuable?
Voice & Sound System

How hard is it to implement full text-to-speech (e.g., ElevenLabs) ?
Any concerns about technical feasibility or cost?


Onboarding & Hints

Should we build a modular, data-driven tutorial/hint system from the start, or is hardcoding fine for v1?
Thoughts on the “AI Solve” joke feature—keep, tweak, or drop?

Player Stats & Customization

What is one stat or one customization we can commit to for v1?

Achievements & Scoring

How can we make achievements less grindy and more creative?
Do we want to include accuracy/creativity-based scoring, not just speed?
Risks & Dependencies

What are our biggest technical or design risks?

Success Metrics

What outcome-based metrics should we track to measure player engagement and learning?

Please add your comments, suggestions, or decisions on each of these points so we can move forward confidently and efficiently.
