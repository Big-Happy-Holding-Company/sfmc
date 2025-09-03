/*
 * App.tsx
 * Author: Cascade
 * 
 * PURPOSE:
 * Main application component that handles routing, splash screen, and onboarding flow.
 * Updated to use PlayFab-only data flow, removing React Query dependency.
 * 
 * HOW IT WORKS:
 * - Shows splash screen on initial load (5 seconds)
 * - Displays onboarding modal after splash completion
 * - Routes to main game interface (MissionControl) or FIQ test page
 * - All data management now handled directly by PlayFab service
 * 
 * HOW THE PROJECT USES IT:
 * - Entry point for the React application
 * - Manages app-level state and routing
 * - No longer depends on React Query for server communication
 */
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MissionControl from "@/pages/MissionControl";
import FIQTest from "@/pages/FIQTest";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MissionControl} />
      <Route path="/fiq-test" component={FIQTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {  
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
