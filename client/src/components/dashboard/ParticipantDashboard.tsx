/**AUTHOR: Claude Sonnet 4
 * DATE: 2025-09-12
 * PURPOSE: TOTALLY UNKNOWN!!!!  
 * SRP and DRY check: ????
 * HARC Platform - Participant Dashboard
 * =====================================
 * Displays a participant's cognitive performance score (CPS) and compares it
 * directly against AI benchmark data for the same puzzles.
 * 
 * 
 * THIS PAGE SOUNDS LIKE IT WAS LARGELY HALLUCINATED BY THE AI
 * NEEDS Audit!
 * Cognitive Performance Score (CPS) is not a real thing and I am worried about how it is being used
 */

import { useState, useEffect } from 'react';
import { ComparisonCard } from './ComparisonCard';
import { playFabAuthManager } from '@/services/playfab/authManager';
import { playFabRequestManager } from '@/services/playfab/requestManager';
import { playFabUserData } from '@/services/playfab/userData';
import { arcExplainerAPI, type AIPuzzlePerformance } from '@/services/arcExplainerAPI';

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


interface ComparisonData {
  human: HumanPerformanceRecord;
  ai: AIPuzzlePerformance | null;
}

// Fetches the detailed human performance data from PlayFab user data.
const fetchHumanPerformanceData = async (): Promise<HumanPerformanceRecord[]> => {
  try {
    console.log('Fetching human performance data from PlayFab...');
    
    // Get player data using existing service
    const playerData = await playFabUserData.getPlayerData();
    const data = playerData?.humanPerformanceData;
    
    if (!data) {
      console.log('No human performance data found for this user.');
      return [];
    }

    const performanceRecords: HumanPerformanceRecord[] = JSON.parse(data);
    console.log(`Found ${performanceRecords.length} performance records`);
    return performanceRecords;
    
  } catch (error) {
    console.error('Failed to fetch human performance data:', error);
    return [];
  }
};

const fetchAiBenchmarkData = async (puzzleIds: string[]): Promise<Map<string, AIPuzzlePerformance>> => {
  try {
    console.log('Fetching AI benchmark data for puzzles:', puzzleIds);
    // Use existing arc-explainer API service
    const performanceMap = await arcExplainerAPI.getBatchPuzzlePerformance(puzzleIds);
    console.log(`Got AI performance data for ${performanceMap.size} puzzles`);
    return performanceMap;
  } catch (error) {
    console.error('Failed to fetch AI benchmark data:', error);
    return new Map();
  }
};

export function ParticipantDashboard() {
  const [humanData, setHumanData] = useState<HumanPerformanceRecord[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        setIsLoading(true);
        
        // Initialize PlayFab if needed
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();
        
        // Load human performance data
        const humanPerformance = await fetchHumanPerformanceData();
        setHumanData(humanPerformance);

        if (humanPerformance.length > 0) {
          // Get unique puzzle IDs
          const uniquePuzzleIds = [...new Set(humanPerformance.map(record => record.puzzleId))];
          
          // Fetch AI benchmark data
          const aiPerformanceMap = await fetchAiBenchmarkData(uniquePuzzleIds);

          // Create comparison data - take latest record for each puzzle
          const latestRecords = new Map<string, HumanPerformanceRecord>();
          humanPerformance.forEach(record => {
            const existing = latestRecords.get(record.puzzleId);
            if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
              latestRecords.set(record.puzzleId, record);
            }
          });

          const mergedData: ComparisonData[] = Array.from(latestRecords.values()).map(humanRecord => ({
            human: humanRecord,
            ai: aiPerformanceMap.get(humanRecord.puzzleId) || null
          }));

          setComparisonData(mergedData);
        }

        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
        setIsLoading(false);
      }
    };

    initializeAndLoadData();
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
