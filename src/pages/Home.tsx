import { StatusCard } from '@/components/StatusCard';
import { StatsDisplay } from '@/components/StatsDisplay';
import { DemoLinkButton } from '@/components/DemoLinkButton';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';

export default function Home() {
  const { t, state } = useApp();
  
  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="pt-4 pb-2">
        <h1 className="text-display text-foreground">
          {t.appName}
        </h1>
        <p className="text-muted-foreground">
          {t.tagline}
        </p>
      </header>
      
      {/* Status Card */}
      <StatusCard />
      
      {/* Stats */}
      <section>
        <StatsDisplay />
      </section>

      {/* Demo Section - only shown for testing */}
      {state.isProtectionEnabled && (
        <Card className="p-4 card-elevated">
          <h3 className="font-medium text-foreground mb-3">
            {t.home.testSafety}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t.home.testSafetyDesc}
          </p>
          <DemoLinkButton 
            url="https://suspicious-site.example.com/claim-prize"
            source="SMS"
            label={t.home.simulateLink}
          />
        </Card>
      )}
    </div>
  );
}
