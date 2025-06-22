export interface RankInfo {
  level: number;
  name: string;
  icon: string;
  threshold: number;
  nextThreshold?: number;
  isHonorary?: boolean;
}

export const RANKS: RankInfo[] = [
  { level: 1, name: "Specialist 1", icon: "🌌", threshold: 0, nextThreshold: 1600 },
  { level: 2, name: "Specialist 2", icon: "🌌🪐", threshold: 1600, nextThreshold: 3200 },
  { level: 3, name: "Specialist 3", icon: "🌌🪐🚀", threshold: 3200, nextThreshold: 6400 },
  { level: 4, name: "Specialist 4", icon: "🌌🪐🚀⭐", threshold: 6400, nextThreshold: 12800 },
  { level: 5, name: "Sergeant", icon: "⭐", threshold: 12800, nextThreshold: 25600 },
  { level: 6, name: "Technical Sergeant", icon: "⭐⭐", threshold: 25600, nextThreshold: 51200 },
  { level: 7, name: "Master Sergeant", icon: "⭐⭐⭐", threshold: 51200, nextThreshold: 102400 },
  { level: 8, name: "Senior Master Sergeant", icon: "⭐⭐⭐⭐", threshold: 102400, nextThreshold: 204800 },
  { level: 9, name: "Chief Master Sergeant", icon: "🌟", threshold: 204800, nextThreshold: 409600 },
  { level: 10, name: "Command Chief Master Sergeant", icon: "🌟🛡️", threshold: 409600, nextThreshold: 819200 },
  { level: 11, name: "Chief Master Sergeant of the Space Force", icon: "👑", threshold: 819200, nextThreshold: 1638400 },
  { level: 12, name: "Second Lieutenant", icon: "🎖️", threshold: 1638400, nextThreshold: 3276800 },
  { level: 13, name: "First Lieutenant", icon: "🎖️🎖️", threshold: 3276800, nextThreshold: 6553600 },
  { level: 14, name: "Captain", icon: "🎖️🎖️🎖️", threshold: 6553600, nextThreshold: 13107200 },
  { level: 15, name: "Major", icon: "🎖️⭐", threshold: 13107200, nextThreshold: 26214400 },
  { level: 16, name: "Lieutenant Colonel", icon: "🦅⭐", threshold: 26214400, nextThreshold: 52428800 },
  { level: 17, name: "Colonel", icon: "🦅", threshold: 52428800, nextThreshold: 104857600 },
  { level: 18, name: "Brigadier General", icon: "🌠", threshold: 104857600, nextThreshold: 209715200 },
  { level: 19, name: "Major General", icon: "🌠🌠", threshold: 209715200, nextThreshold: 419430400 },
  { level: 20, name: "Lieutenant General", icon: "🌠🌠🌠", threshold: 419430400, nextThreshold: 838860800 },
  { level: 21, name: "General", icon: "🌠🌠🌠🌠", threshold: 838860800 },
];

export const RANK_ICONS: Record<string, string> = Object.fromEntries(
  RANKS.map(({ name, icon }) => [name, icon])
);

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

  const nextRank = RANKS.find(rank => rank.level === currentRank.level + 1);
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
