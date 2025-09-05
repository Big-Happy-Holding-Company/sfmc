# Officer Track UI Plan: AI-Curated Puzzle Selection

## Overview

Transform the Officer Track from a basic puzzle browser into an intelligent training system that leverages arc-explainer's rich AI performance database to curate the most challenging puzzles for officer training.

## Current State Analysis

### Confirmed PlayFab Data (Sept 4, 2025)
- ✅ 2,020 ARC puzzles successfully uploaded across 20 batches
- ✅ Proper puzzle IDs: `ARC-TR-007bbfb7`, `ARC-EV-1ae2feb7`, etc.
- ✅ Fixed arcDataService.ts loading (PlayFab Client API format)
- ✅ Batch structure works correctly

### arc-explainer AI Performance Database
- **useWorstPerformingPuzzles hook** - identifies puzzles most difficult for AI
- **Composite scoring system** based on:
  - Incorrect AI predictions  
  - Low accuracy scores
  - Negative human feedback
  - Processing difficulties
- **Rich metadata**: avgAccuracy, avgConfidence, totalExplanations, compositeScore
- **Filtering capabilities**: accuracy ranges, zero-accuracy puzzles, dataset sources

## Integration Strategy

### Phase 1: Database Connection
1. **Add arc-explainer database connection to SFMC**
   - Import database credentials to `.env`
   - Create shared service for AI performance queries
   - Implement `useWorstPerformingPuzzles` hook in SFMC

### Phase 2: AI-Curated Components

#### 2A: OfficerPuzzleSearch (Enhanced)
**Purpose**: Intelligent puzzle selection beyond simple ID lookup
**Features**:
- **Manual ID Input**: Enter specific puzzle ID (e.g., `1ae2feb7`)
- **AI Difficulty Selector**: 
  - "Impossible for AI" (0% accuracy)
  - "Extremely Hard" (0-25% accuracy)  
  - "Very Hard" (25-50% accuracy)
  - "Challenging" (50-75% accuracy)
- **Smart Random**: Weight selection toward harder puzzles
- **Dataset Filter**: Training/Evaluation with difficulty overlay

#### 2B: OfficerDifficultyCards (Replaces DatasetCards)  
**Purpose**: Show AI difficulty statistics, not just dataset counts
**4 Cards Display**:
```
┌─────────────────────┐ ┌─────────────────────┐
│ IMPOSSIBLE FOR AI   │ │ EXTREMELY HARD      │
│ 🤖❌ 47 puzzles     │ │ 🤖😰 156 puzzles    │
│ 0% AI Success      │ │ 0-25% AI Success    │
│ Top Challenge!      │ │ Advanced Training   │
└─────────────────────┘ └─────────────────────┘

┌─────────────────────┐ ┌─────────────────────┐
│ VERY HARD           │ │ CHALLENGING         │
│ 🤖😅 284 puzzles    │ │ 🤖🤔 378 puzzles    │
│ 25-50% AI Success  │ │ 50-75% AI Success   │
│ Expert Level        │ │ Officer Training    │
└─────────────────────┘ └─────────────────────┘
```

#### 2C: OfficerPuzzleCard (AI-Enhanced)
**Purpose**: Show both puzzle info AND AI difficulty metadata
**Enhanced Data Display**:
- Dataset badge: `ARC1 Training`, `ARC2 Eval` (from arc-explainer format)
- **AI Difficulty Badge**: Color-coded by performance
  - Red: "Impossible" (0% accuracy)
  - Orange: "Extremely Hard" (0-25%)
  - Yellow: "Very Hard" (25-50%)  
  - Blue: "Challenging" (50-75%)
- **Performance Stats**: 
  - "AI Accuracy: 12%" 
  - "Models Tried: 7"
  - "Avg Confidence: 23%"
- **Composite Score**: Overall difficulty rating

#### 2D: OfficerPuzzleViewer (Full Display)
**Purpose**: Complete puzzle view with AI analysis context
**Features**:
- Standard ARC puzzle display (train/test examples)
- **AI Performance Panel**:
  - Which models failed and how
  - Common mistake patterns
  - Human feedback summary
  - "Why this puzzle is hard for AI" explanation
- Interactive grid using existing SFMC components
- Link to full arc-explainer analysis page

## Technical Implementation

### Database Integration
```typescript
// New service: aiPerformanceService.ts
interface AIPuzzlePerformance {
  puzzleId: string;
  avgAccuracy: number;
  avgConfidence: number; 
  totalExplanations: number;
  negativeFeedback: number;
  compositeScore: number;
  difficultyCategory: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging';
}

export async function getWorstPerformingPuzzles(
  limit: number = 20,
  difficultyFilter?: string
): Promise<AIPuzzlePerformance[]>
```

### Component Architecture
```
/components/game/officer/
├── OfficerPuzzleSearch.tsx       // Enhanced search with AI difficulty
├── OfficerDifficultyCards.tsx    // AI difficulty statistics
├── OfficerPuzzleCard.tsx         // Puzzle + AI performance data  
├── OfficerPuzzleViewer.tsx       // Full display with AI context
└── OfficerAIInsights.tsx         // Why this puzzle is hard panel
```

### Data Flow
1. **Load AI Performance Data**: Query arc-explainer DB for puzzle difficulties
2. **Cross-Reference with PlayFab**: Match puzzle IDs between systems
3. **Intelligent Curation**: Present hardest puzzles first for training
4. **Rich Context**: Show why each puzzle challenges AI systems

## User Experience

### Officer Training Scenarios

**Scenario 1: "Show me the impossible ones"**
- User clicks "Impossible for AI" card
- System shows 47 puzzles with 0% AI success rate
- Each puzzle card shows what models failed and how

**Scenario 2: "Challenge me progressively"**  
- Smart random selection starts with extremely hard puzzles
- As user succeeds, gradually introduces impossible ones
- Adaptive difficulty based on user performance

**Scenario 3: "Analyze specific puzzle"**
- User searches for known hard puzzle (e.g., `1ae2feb7`)
- System shows full puzzle + AI analysis context
- "This puzzle stumps GPT-4, Claude, and Gemini because..."

## Implementation Phases

### Phase 1: Database Connection (Week 1)
- [ ] Add arc-explainer DB credentials to SFMC `.env`
- [ ] Create `aiPerformanceService.ts` 
- [ ] Implement `useWorstPerformingPuzzles` hook
- [ ] Test database connectivity and data retrieval

### Phase 2: Core Components (Week 2)  
- [ ] Build OfficerDifficultyCards with AI stats
- [ ] Enhance OfficerPuzzleSearch with difficulty filters
- [ ] Create OfficerPuzzleCard with performance metadata
- [ ] Test data integration between systems

### Phase 3: Rich Display (Week 3)
- [ ] Build OfficerPuzzleViewer with AI context
- [ ] Add OfficerAIInsights panel ("Why this is hard")
- [ ] Implement intelligent curation algorithms
- [ ] Add cross-links to full arc-explainer analysis

### Phase 4: Polish & Deploy (Week 4)
- [ ] Add loading states and error handling
- [ ] Implement caching for performance data
- [ ] User testing and feedback integration
- [ ] Deploy enhanced Officer Track

## Expected Impact

**For Officers**: 
- Train on puzzles that challenge the best AI systems
- Understand AI limitations and reasoning gaps
- Develop skills complementary to AI capabilities

**For System**:
- Transforms random puzzle browsing into targeted training
- Leverages rich AI performance database for curation
- Provides educational context about AI reasoning

**For Future**:
- Track human performance vs AI performance on same puzzles
- Identify patterns where humans excel beyond AI
- Build training curricula optimized for human-AI collaboration

## Database Schema Requirements

```sql
-- Required from arc-explainer database
SELECT 
  puzzle_id,
  avg_accuracy,
  avg_confidence, 
  total_explanations,
  negative_feedback,
  composite_score,
  latest_analysis
FROM puzzle_performance 
WHERE avg_accuracy < 0.25  -- Focus on hardest puzzles
ORDER BY composite_score DESC
LIMIT 100;
```

This plan transforms the Officer Track from a simple puzzle browser into an intelligent, AI-informed training system that helps officers develop skills in areas where humans can exceed artificial intelligence.