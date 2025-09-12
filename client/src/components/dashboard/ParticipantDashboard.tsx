/**
 * HARC Platform - Participant Dashboard
 * =====================================
 * Displays a participant's cognitive performance score (CPS) and compares it
 * directly against AI benchmark data for the same puzzles.
 */

import { useState, useEffect } from 'react';
import { ComparisonCard } from './ComparisonCard';

import { playFabAuthManager } from '@/services/playfab/authManager';
import { playFabRequestManager } from '@/services/playfab/requestManager';
import { searchPuzzleById, type OfficerPuzzle } from '@/services/officerArcAPI';

// Defines the structure of a single performance record
interface HumanPerformanceRecord {
  puzzleId: string;
  timestamp: string;
  basePoints: number;
  speedBonus: number;
  efficiencyBonus: number;
  firstTryBonus?: number;
  finalScore: number;
  timeElapsed: number;
  stepCount: number;
  attemptNumber: number;
}

type AiBenchmarkRecord = OfficerPuzzle; // Use the type from the API service

interface ComparisonData {
  human: HumanPerformanceRecord;
  ai: AiBenchmarkRecord;
}

// Fetches the detailed human performance data from PlayFab user data.
const fetchHumanPerformanceData = async (): Promise<HumanPerformanceRecord[]> => {
  console.log('Fetching human performance data from PlayFab...');
  await playFabAuthManager.ensureAuthenticated();
  const playFabId = playFabAuthManager.getPlayFabId();

  if (!playFabId) {
    throw new Error('User is not authenticated. Cannot fetch performance data.');
  }

  const response = await playFabRequestManager.makeRequest('getUserData', {
    PlayFabId: playFabId,
    Keys: ['humanPerformanceData'],
  });

  const data = response.Data?.humanPerformanceData?.Value;
  if (!data) {
    console.log('No human performance data found for this user.');
    return [];
  }

  try {
    const performanceRecords: HumanPerformanceRecord[] = JSON.parse(data);
    return performanceRecords;
  } catch (error) {
    console.error('Failed to parse human performance data:', error);
    return []; // Return empty array on parsing error
  }
};

const fetchAiBenchmarkData = async (puzzleIds: string[]): Promise<AiBenchmarkRecord[]> => {
  console.log('Fetching AI benchmark data for puzzles:', puzzleIds);
  const benchmarkPromises = puzzleIds.map(id => searchPuzzleById(id));
  const results = await Promise.all(benchmarkPromises);
  return results.filter((r): r is AiBenchmarkRecord => r !== null);
};

export function ParticipantDashboard() {
  const [humanData, setHumanData] = useState<HumanPerformanceRecord[]>([]);
    const [aiData, setAiData] = useState<AiBenchmarkRecord[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const humanPerformance = await fetchHumanPerformanceData();
        setHumanData(humanPerformance);

        if (humanPerformance.length > 0) {
          const puzzleIds = humanPerformance.map(record => record.puzzleId);
          const aiBenchmarks = await fetchAiBenchmarkData(puzzleIds);
          setAiData(aiBenchmarks);

          // Merge human and AI data for comparison
          const mergedData: ComparisonData[] = humanPerformance
            .map(humanRecord => {
              const aiRecord = aiBenchmarks.find(ai => ai.id === humanRecord.puzzleId);
              return aiRecord ? { human: humanRecord, ai: aiRecord } : null;
            })
            .filter((item): item is ComparisonData => item !== null);

          setComparisonData(mergedData);
        }

        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return <div className="p-4 text-center">Loading participant dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 bg-slate-800 text-white">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">Participant Dashboard</h1>
      
      {humanData.length === 0 ? (
        <p>No performance data found. Complete some puzzles in the Assessment section to see your results.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisonData.map(data => (
            <ComparisonCard key={data.human.puzzleId} humanRecord={data.human} aiRecord={data.ai} />
          ))}
        </div>
      )}
    </div>
  );
}
