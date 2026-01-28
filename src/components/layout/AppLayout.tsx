import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { useApp } from '@/contexts/AppContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { state } = useApp();
  
  if (state.isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content area with bottom padding for nav */}
      <main className="flex-1 pb-20 safe-area-top">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Shield icon with pulse animation */}
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-gentle-pulse">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        
        <p className="text-muted-foreground text-body-lg">
          Loading...
        </p>
      </div>
    </div>
  );
}
