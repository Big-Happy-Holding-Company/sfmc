/*
 * App.tsx
 * Author: Cascade
 * 
 * PURPOSE:
 * Main application component that handles routing, splash screen, and onboarding flow.
 * Updated to use PlayFab-only data flow, removing React Query dependency.
 * 
 * HOW IT WORKS:
 * - Shows splash screen on initial load (1 second)
 * - Displays onboarding modal after splash completion
 * - Routes to main game interface (MissionControl) or FIQ test page
 * - All data management now handled directly by PlayFab service
 * 
 * HOW THE PROJECT USES IT:
 * - Entry point for the React application
 * - Manages app-level state and routing
 * - No longer depends on React Query for server communication
 */
import { useState } from 'react';
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MissionControl from "@/pages/MissionControl";
import FIQTest from "@/pages/FIQTest";
import OfficerTrackSimple from "@/pages/OfficerTrackSimple";
import PuzzleSolver from "@/pages/PuzzleSolver";
import { TutorialPage } from '@/pages/TutorialPage';
import { GridSizeTest } from "@/components/officer/GridSizeTest";
import { AssessmentInterface } from "@/components/assessment/AssessmentInterface";
import { ParticipantDashboard } from "@/components/dashboard/ParticipantDashboard";
import { LLMComparisonPage } from "@/pages/LLMComparisonPage";
import HARCPlatform from "@/pages/HARCPlatform";
import Leaderboards from "@/pages/Leaderboards";
import Profile from "@/pages/Profile";
import HumanVsAiComparison from "@/pages/HumanVsAiComparison";
import NotFound from "@/pages/not-found";
import { LoadingSplash } from "@/components/game/LoadingSplash";
import { OnboardingModal } from "@/components/game/OnboardingModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MissionControl} />
      <Route path="/harc" component={HARCPlatform} />
      <Route path="/fiq-test" component={FIQTest} />
      <Route path="/officer-track" component={OfficerTrackSimple} />
      <Route path="/officer-track/solve/:puzzleId" component={PuzzleSolver} />
      <Route path="/officer-track/ai-comparison" component={LLMComparisonPage} />
      <Route path="/assessment" component={AssessmentInterface} />
      <Route path="/dashboard" component={ParticipantDashboard} />
      <Route path="/leaderboards" component={Leaderboards} />
      <Route path="/profile" component={Profile} />
      <Route path="/grid-test" component={GridSizeTest} />
      <Route path="/tutorial" component={TutorialPage} />
      <Route path="/assessment/comparison" component={HumanVsAiComparison} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // State to control which screen is shown
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // When splash screen completes, show onboarding modal
  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowOnboarding(true);
  };
  
  // When onboarding completes, continue to main app
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };
  
  return (
    <TooltipProvider>
      {showSplash ? (
        <LoadingSplash onComplete={handleSplashComplete} duration={1000} />
      ) : (
        <>
          <Toaster />
          <Router />
          <OnboardingModal open={showOnboarding} onClose={handleOnboardingComplete} />
        </>
      )}
    </TooltipProvider>
  );
}

export default App;
