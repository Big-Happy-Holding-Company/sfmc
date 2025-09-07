/**
 * Leaderboard Types & Configuration
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE: 
 * Centralized configuration for all leaderboard types.
 * Adding new leaderboards requires only adding entries here.
 * 
 * HOW IT WORKS:
 * - Enum-driven system prevents code bloat
 * - Each leaderboard type has metadata and PlayFab statistic mapping
 * 
 * HOW THE PROJECT USES IT:
 * - LeaderboardService uses this config to handle all leaderboard operations generically
 * - UI components use this for display names, descriptions, etc.
 */

import { PLAYFAB_CONSTANTS } from '@/types/playfab';

export enum LeaderboardType {
  GLOBAL = 'GLOBAL',
  OFFICER_TRACK = 'OFFICER_TRACK',
  // Future leaderboards can be added here without code changes:
  // SPEED = 'SPEED',
  // STREAK = 'STREAK',
  // ACCURACY = 'ACCURACY'
}

export interface LeaderboardConfig {
  type: LeaderboardType;
  displayName: string;
  description: string;
  statisticName: string;
  icon?: string;
  category: 'primary' | 'specialty' | 'performance';
  enabled: boolean;
}

export const LEADERBOARD_CONFIGS: Record<LeaderboardType, LeaderboardConfig> = {
  [LeaderboardType.GLOBAL]: {
    type: LeaderboardType.GLOBAL,
    displayName: 'Global Leaderboard',
    description: 'All players ranked by total points',
    statisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.LEVEL_POINTS,
    icon: '🌍',
    category: 'primary',
    enabled: true
  },
  [LeaderboardType.OFFICER_TRACK]: {
    type: LeaderboardType.OFFICER_TRACK,
    displayName: 'Officer Track',
    description: 'ARC puzzle specialists',
    statisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.OFFICER_TRACK_POINTS,
    icon: '🎯',
    category: 'specialty',
    enabled: true
  }
  // Future additions would go here - no code changes needed elsewhere
};

export const getLeaderboardConfig = (type: LeaderboardType): LeaderboardConfig => {
  return LEADERBOARD_CONFIGS[type];
};

export const getEnabledLeaderboards = (): LeaderboardConfig[] => {
  return Object.values(LEADERBOARD_CONFIGS).filter(config => config.enabled);
};

export const getLeaderboardsByCategory = (category: LeaderboardConfig['category']): LeaderboardConfig[] => {
  return Object.values(LEADERBOARD_CONFIGS)
    .filter(config => config.enabled && config.category === category);
};
