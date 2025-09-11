/**
 * Profile Page
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Dedicated page for user profile management using UserProfile component.
 * Provides access to display name and avatar management features.
 * 
 * HOW IT WORKS:
 * - Renders UserProfile component with proper page layout
 * - Includes Header navigation for consistency
 * - Matches design patterns from other pages
 * 
 * HOW THE PROJECT USES IT:
 * - Accessible via /profile route and Header navigation
 * - Allows users to convert from anonymous to personalized profiles
 */

import { useState, useEffect } from 'react';
import { Header } from "@/components/game/Header";
import { UserProfile } from "@/components/user/UserProfile";
import {
  playFabRequestManager,
  playFabAuthManager,
  playFabUserData,
  playFabTasks
} from '@/services/playfab';
import type { PlayFabPlayer } from "@/services/playfab";

export default function Profile() {
  const [player, setPlayer] = useState<PlayFabPlayer | null>(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
    const loadPageData = async () => {
      try {
        // New initialization flow
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();
        
        const [playerData, tasksData] = await Promise.all([
          playFabUserData.getPlayerData(),
          playFabTasks.getAllTasks()
        ]);

        setPlayer(playerData);
        setTotalTasks(tasksData.length);
      } catch (error) {
        console.error('PlayFab initialization failed:', error);
        setPlayer({ 
          id: 'unknown', 
          username: 'Officer', 
          rank: 'Cadet', 
          rankLevel: 1, 
          totalPoints: 0, 
          completedMissions: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setTotalTasks(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, []);

  if (isLoading || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-white text-lg">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header player={player} totalTasks={totalTasks} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            👤 Officer Profile
          </h1>
          <p className="text-blue-200 text-lg">
            Manage your identity and leaderboard presence
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <UserProfile 
            onProfileUpdate={(profile) => {
              console.log('Profile updated:', profile);
            }}
          />
        </div>
      </div>
    </div>
  );
}
