import { useState } from 'react';
import { StatusCard } from '@/components/StatusCard';
import { StatsDisplay } from '@/components/StatsDisplay';
import { DemoLinkButton } from '@/components/DemoLinkButton';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { QRScannerScreen } from '@/components/QRScannerScreen';

/**
 * Home Page
 * 
 * Uses assistive language throughout.
 * No absolute security claims.
 */
export default function Home() {
  const { t, state } = useApp();
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Show QR Scanner overlay
  if (showQRScanner) {
    return <QRScannerScreen onClose={() => setShowQRScanner(false)} />;
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-4 pb-2 -mx-4 px-4 flex justify-between items-center transition-all">
        <div>
          <h1 className="text-display text-foreground">
            {t.appName}
          </h1>
          <p className="text-muted-foreground">
            {t.tagline}
          </p>
        </div>
        {/* QR Scan Button */}
        <Button
          onClick={() => setShowQRScanner(true)}
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full"
          aria-label="Scan QR Code"
        >
          <QrCode className="w-6 h-6" />
        </Button>
      </header>

      {/* Status Card */}
      <StatusCard />

      {/* Stats */}
      <section aria-label="Safety statistics">
        <StatsDisplay />
      </section>

      {/* Demo Section - only shown for testing */}
      {(state.isProtectionEnabled || true) && (
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
