/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-13
 * PURPOSE: Unified exports for core service layer. Provides clean imports for the new
 * architecture that replaces scattered service functionality.
 * SRP and DRY check: Pass - Single responsibility (service exports)
 */

// Core services
export { puzzleRepository, type EnhancedPuzzle, type SearchCriteria, type SearchResult } from './puzzleRepository';
export { arcExplainerClient, type PerformanceData, type PuzzleWithPerformance, type PerformanceStatsResponse } from './arcExplainerClient';
export { playfabPuzzleClient } from './playfabPuzzleClient';

// Cache management
export { CacheManager, puzzleCache, apiCache, metadataCache } from './cacheManager';

// Centralized ID conversion (re-export from existing service)
export { idConverter, type ARCDatasetType } from '@/services/idConverter';

/**
 * Migration guide for deprecated services:
 *
 * OLD: import { puzzlePerformanceService } from '@/services/puzzlePerformanceService'
 * NEW: import { puzzleRepository } from '@/services/core'
 *
 * OLD: import { arcExplainerAPI } from '@/services/arcExplainerAPI'
 * NEW: import { arcExplainerClient } from '@/services/core'
 *
 * OLD: import { officerArcAPI } from '@/services/officerArcAPI'
 * NEW: import { puzzleRepository, arcExplainerClient } from '@/services/core'
 *
 * OLD: import { arcExplainerService } from '@/services/arcExplainerService'
 * NEW: import { arcExplainerClient } from '@/services/core'
 */