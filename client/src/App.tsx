import { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MissionControl from "@/pages/MissionControl";
import NotFound from "@/pages/not-found";
import { LoadingSplash } from "@/components/game/LoadingSplash";
import { OnboardingModal } from "@/components/game/OnboardingModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MissionControl} />
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {showSplash ? (
          <LoadingSplash onComplete={handleSplashComplete} duration={5000} />
        ) : (
          <>
            <Toaster />
            <Router />
            <OnboardingModal open={showOnboarding} onClose={handleOnboardingComplete} />
          </>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
