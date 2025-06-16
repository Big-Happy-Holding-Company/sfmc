export interface RankInfo {
  level: number;
  name: string;
  icon: string;
  threshold: number;
  nextThreshold?: number;
}

export const RANKS: RankInfo[] = [
  { level: 1, name: "Specialist 1", icon: "🪖", threshold: 0, nextThreshold: 3600 },
  { level: 2, name: "Specialist 2", icon: "🪖🪖", threshold: 3600, nextThreshold: 8000 },
  { level: 3, name: "Specialist 3", icon: "🪖🪖🪖", threshold: 8000, nextThreshold: 15000 },
  { level: 4, name: "Specialist 4", icon: "🪖⭐", threshold: 15000, nextThreshold: 25000 },
  { level: 5, name: "Sergeant", icon: "⭐", threshold: 25000, nextThreshold: 40000 },
  { level: 6, name: "Second Lieutenant", icon: "🎖️", threshold: 40000 },
];

export function getRankProgress(currentPoints: number): {
  currentRank: RankInfo;
  nextRank?: RankInfo;
  progress: number;
  pointsToNext: number;
} {
  let currentRank = RANKS[0];
  
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (currentPoints >= RANKS[i].threshold) {
      currentRank = RANKS[i];
      break;
    }
  }
  
  const nextRank = RANKS.find(rank => rank.level > currentRank.level);
  const pointsToNext = nextRank ? nextRank.threshold - currentPoints : 0;
  const progress = nextRank 
    ? ((currentPoints - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100
    : 100;
  
  return {
    currentRank,
    nextRank,
    progress: Math.min(100, Math.max(0, progress)),
    pointsToNext: Math.max(0, pointsToNext),
  };
}
