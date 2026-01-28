import { StatusCard } from '@/components/StatusCard';
import { StatsDisplay } from '@/components/StatsDisplay';
import { useApp } from '@/contexts/AppContext';

export default function Home() {
  const { t } = useApp();
  
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
    </div>
  );
}
