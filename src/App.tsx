import { useEffect } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthService } from '@/lib/services/AuthService';
import { toast } from 'sonner';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { SafetyPinProvider } from "@/contexts/SafetyPinContext";
import { LinkInterceptionProvider } from "@/contexts/LinkInterceptionContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { LinkInterceptionFlow } from "@/components/LinkInterceptionFlow";
import { OnboardingFlow } from "@/components/onboarding";
import { useShareIntent } from "@/hooks/useShareIntent";
import { useSecurityStatusNotification } from "@/hooks/useSecurityStatusNotification";
import { initRemoteDatabase } from "@/lib/scamDatabase";

// Pages
import Index from "./pages/Index";
import Protection from "./pages/Protection";
import Settings from "./pages/Settings";
import { SecurityDashboard } from "./pages/SecurityDashboard";
import { OCRScannerScreen } from "./components/OCRScannerScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { state } = useApp(); // Access state for theme

  // Initialize share intent listener
  useShareIntent();

  // Initialize persistent security notification
  useSecurityStatusNotification();

  // Initialize remote scam database on app startup
  useEffect(() => {
    initRemoteDatabase().catch(err => {
      console.warn('Failed to initialize remote database:', err);
    });
  }, []);

  // Update Status Bar based on Theme
  useEffect(() => {
    const setStatusBar = async () => {
      try {
        if (state.theme === 'tokyo-night') {
          // Dark Mode: Dark Blue background (#1a1b26) for visibility
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#1a1b26' });
        } else {
          // Revert to default style (Light) when not in Dark Mode
          // We must reset this, otherwise the dark color persists.
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        }
      } catch (error) {
        console.warn('Status bar plugin error:', error);
      }
    };
    setStatusBar();
  }, [state.theme]); // Re-run when theme changes

  useEffect(() => {
    // Listen for deep links (e.g. Firebase Auth links)
    const listener = CapacitorApp.addListener('appUrlOpen', async (data) => {
      const url = data.url;
      if (AuthService.isSignInLink(url)) {
        toast.loading('Verifying email link...', { id: 'auth-verify' });
        const result = await AuthService.verifyEmailLink(url);
        if (result.success) {
          toast.success('Email verified! You can now reset your PIN.', { id: 'auth-verify' });
          // Navigation to the relevant screen is handled by the screen listening to auth state,
          // or we could dispatch a global event/state here.
        } else {
          toast.error('Verification failed: ' + result.error, { id: 'auth-verify' });
        }
      }
    });

    return () => {
      listener.then(handle => handle.remove());
    };
  }, []);

  return (
    <OnboardingFlow>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/protection" element={<Protection />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/security-dashboard" element={<SecurityDashboard />} />
          <Route path="/scan-image" element={<OCRScannerScreen />} />
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
  <ErrorBoundary onReset={() => window.location.reload()}>
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
