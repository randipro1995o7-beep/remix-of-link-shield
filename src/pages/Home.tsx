import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusCard } from '@/components/StatusCard';
import { StatsDisplay } from '@/components/StatsDisplay';
import { DemoLinkButton } from '@/components/DemoLinkButton';
import { SafetyStatsChart } from '@/components/SafetyStatsChart';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import LinkShield from '@/plugins/LinkShield';
import { QrCode, Lock, Unlock, ShieldAlert, MessageCircle, Activity } from 'lucide-react';
import { QRScannerScreen } from '@/components/QRScannerScreen';
import { HomeGuideOverlay } from '@/components/home/HomeGuideOverlay';
import { ScamEducationScreen } from '@/components/education/ScamEducationScreen';
import { NewsSection } from '@/components/home/NewsSection';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

/**
 * Home Page
 * 
 * Uses assistive language throughout.
 * No absolute security claims.
 */
export default function Home() {
  const { state, dispatch, t, setProtectionEnabled, setPanicMode, grantPermission } = useApp();
  const navigate = useNavigate();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showEducation, setShowEducation] = useState(false);

  // Show QR Scanner overlay
  if (showQRScanner) {
    return <QRScannerScreen onClose={() => setShowQRScanner(false)} />;
  }

  // Show Scam Education overlay
  if (showEducation) {
    return <ScamEducationScreen />;
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

      {/* Panic Mode Control */}
      <Card className={cn(
        "p-4 border-l-4 transition-all duration-300",
        state.isPanicMode
          ? "bg-destructive/10 border-l-destructive shadow-lg shadow-destructive/20 border-destructive"
          : "bg-card border-l-transparent hover:border-l-destructive/50",
        !state.isProtectionEnabled && "opacity-50 pointer-events-none grayscale"
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "p-2.5 rounded-full transition-colors flex-shrink-0",
              state.isPanicMode ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted text-muted-foreground"
            )}>
              {state.isPanicMode ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={cn("font-semibold truncate", state.isPanicMode ? "text-destructive" : "text-foreground")}>
                {t.home.panicMode}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {state.isPanicMode
                  ? t.home.panicModeActiveDesc
                  : t.home.panicModeInactiveDesc}
              </p>
            </div>
          </div>
          <Switch
            checked={state.isPanicMode}
            onCheckedChange={(checked) => setPanicMode(checked)}
            disabled={!state.isProtectionEnabled}
            aria-label={t.home.togglePanicMode}
            className={cn(state.isPanicMode && "data-[state=checked]:bg-destructive")}
          />
        </div>
      </Card>

      {/* Warning if enabled but not default handler */}
      {state.isProtectionEnabled && !state.isDefaultHandler && (
        <div
          className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-3 cursor-pointer"
          onClick={() => LinkShield.openAppLinkSettings()}
        >
          <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-yellow-500">
              {t.home.protectionPausedWarning || "Protection Paused: Simple Set as Default Browser"}
            </p>
          </div>
        </div>
      )}

      {/* Advanced Protection Status */}
      <div className="grid grid-cols-2 gap-4">
        {/* SMS Filter Status */}
        <Card
          className={cn(
            "p-4 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden transition-all cursor-pointer active:scale-95 hover:bg-muted/50"
          )}
          onClick={async () => {
            try {
              // Directly request SMS permission via native dialog
              const res = await LinkShield.requestSmsPermission();
              if (res.granted) {
                grantPermission('sms');
                alert('SMS Filter berhasil diaktifkan! ✅');
              } else {
                // Denied — guide user manually
                alert(
                  'Izin SMS ditolak.\n\n' +
                  'Untuk mengaktifkan:\n' +
                  '1. Buka Pengaturan HP\n' +
                  '2. Pilih Aplikasi → Safety SHIELD\n' +
                  '3. Pilih Izin\n' +
                  '4. Aktifkan SMS'
                );
              }
            } catch (error: any) {
              console.error('SMS permission error:', error);
              alert('Error: ' + (error?.message || error?.errorMessage || JSON.stringify(error)));
            }
          }}
        >
          <div className={cn(
            "p-3 rounded-full mb-1 transition-colors",
            state.permissions.sms ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-sm">SMS Filter</h3>
          <p className={cn(
            "text-xs",
            state.permissions.sms ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {state.permissions.sms ? "Active" : "Enable"}
          </p>
        </Card>

        {/* Accessibility Status */}
        <Card
          className={cn(
            "p-4 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer active:scale-95 hover:bg-muted/50"
          )}
          onClick={async () => {
            await LinkShield.openAccessibilitySettings();
            // We rely on app resume check for update
          }}
        >
          <div className={cn(
            "p-3 rounded-full mb-1 transition-colors",
            state.permissions.accessibility ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-sm">Overlay</h3>
          <p className={cn(
            "text-xs",
            state.permissions.accessibility ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {state.permissions.accessibility ? "Active" : "Enable"}
          </p>
        </Card>
      </div>

      {/* Scam Education Button */}
      <Card
        className="p-4 border-l-4 border-l-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer active:scale-98"
        onClick={() => setShowEducation(true)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {t.home.scamEducationTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.home.scamEducationDesc}
            </p>
          </div>
        </div>
      </Card>

      {/* OCR Scanner Button */}
      <Card
        className="p-4 border-l-4 border-l-secondary bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer active:scale-98 mt-4"
        onClick={() => navigate('/scan-image')}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-secondary/10 text-secondary-foreground flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {t.home.ocrTitle || 'Run Screenshot Analysis'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.home.ocrDesc || 'Scan screenshots for potential scams or phishing attempts'}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <section aria-label="Safety statistics">
        <StatsDisplay />
      </section>

      {/* Activity Chart */}
      <section aria-label="Safety Activity Chart">
        <SafetyStatsChart />
      </section>

      {/* News Section */}
      <section aria-label="Security News">
        <NewsSection />
      </section>

      {/* Demo Section - only shown for testing */}
      {
        state.isProtectionEnabled && (
          <Card className="p-4 card-elevated animate-scale-in">
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
        )
      }

      {/* Interactive Onboarding Guide */}
      <HomeGuideOverlay />
    </div >
  );
}
