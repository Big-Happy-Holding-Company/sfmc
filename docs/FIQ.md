# Fluid Intelligence Quotient (FIQ) System Requirements

## Core Principles
- FIQ is comparable to standard IQ scoring (100 = average, 80 = low)
- Measures baseline fluid intelligence during onboarding
- Tracks ongoing improvement through training tasks
- Time measured on backend but never shown to users

## Onboarding Assessment Structure

### Foundation Tasks (Tasks 1-40)
- **Requirement**: Must complete all 40 tasks
- **Minimum Score**: 80 FIQ (lowest possible score)
- **Purpose**: Baseline "resting" fluid intelligence measurement
- **Time Pressure**: None - pure cognitive assessment

### Challenge Tasks (Tasks 41-50)
- **Difficulty**: More difficult than foundation tasks
- **Score Range**: 80 → 200 FIQ possible
- **Scoring Components**:
  - Points for correct answers
  - Time bonus for faster completion
- **Purpose**: Determine initial cognitive ceiling

## Scoring System

### Baseline FIQ Calculation
- Tasks 1-40: Completion required for 80 FIQ minimum
- Tasks 41-50: Additional points raise score from 80 to maximum 200 FIQ
- Formula: Baseline FIQ = 80 + (Task 41-50 points) + (Time bonuses)

### Training FIQ System
- **Baseline FIQ**: Fixed score from onboarding (80-200)
- **Training FIQ**: Accumulated points from ongoing app tasks
- **Total FIQ**: Baseline + Training (can exceed 300+)

### Display Format
```
Total FIQ: [Baseline FIQ + Training FIQ]
Example: "FIQ: 247 (Baseline: 142 + Training: 105)"
```

## Implementation Requirements

### Data Tracking
- Record baseline FIQ from onboarding assessment
- Track training FIQ gains separately from regular app usage
- Maintain historical progression data

### User Experience
- Time tracking happens invisibly on backend
- Users never see time pressure or countdown timers
- Focus on cognitive challenge, not speed performance

### Score Progression
- Baseline FIQ represents initial cognitive assessment
- Training FIQ represents "muscle building" through practice
- System allows for continuous improvement beyond initial assessment

