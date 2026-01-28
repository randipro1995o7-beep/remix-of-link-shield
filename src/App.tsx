import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { PinProvider } from "@/contexts/PinContext";
import { LinkInterceptionProvider } from "@/contexts/LinkInterceptionContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { LinkInterceptionFlow } from "@/components/LinkInterceptionFlow";
import { useShareIntent } from "@/hooks/useShareIntent";

// Pages
import Index from "./pages/Index";
import Protection from "./pages/Protection";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component to use hooks inside providers
function AppContent() {
  // Initialize share intent listener
  useShareIntent();

  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/protection" element={<Protection />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
      
      {/* Global link interception overlay */}
      <LinkInterceptionFlow />
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <PinProvider>
          <LinkInterceptionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </LinkInterceptionProvider>
        </PinProvider>
      </AppProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
