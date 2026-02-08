import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { SafetyPinProvider } from "@/contexts/SafetyPinContext";
import { LinkInterceptionProvider } from "@/contexts/LinkInterceptionContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { LinkInterceptionFlow } from "@/components/LinkInterceptionFlow";
import { OnboardingFlow } from "@/components/onboarding";
import { useShareIntent } from "@/hooks/useShareIntent";
import { useSecurityStatusNotification } from "@/hooks/useSecurityStatusNotification";
import { initRemoteDatabase } from "@/lib/scamDatabase";
import { EmailService } from "@/lib/email/EmailService";

// Pages
import Index from "./pages/Index";
import Protection from "./pages/Protection";
import Settings from "./pages/Settings";
import { SecurityDashboard } from "./pages/SecurityDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  // Initialize share intent listener
  useShareIntent();

  // Initialize persistent security notification
  useSecurityStatusNotification();

  // Initialize remote scam database on app startup
  useEffect(() => {
    initRemoteDatabase().catch(err => {
      console.warn('Failed to initialize remote database:', err);
    });

    // Initialize Email Service
    try {
      EmailService.init();
    } catch (e) {
      console.warn('Failed to initialize EmailService:', e);
    }
  }, []);

  return (
    <OnboardingFlow>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/protection" element={<Protection />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/security-dashboard" element={<SecurityDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>

      {/* Global link interception overlay */}
      <LinkInterceptionFlow />
    </OnboardingFlow>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <SafetyPinProvider>
          <LinkInterceptionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </LinkInterceptionProvider>
        </SafetyPinProvider>
      </AppProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
