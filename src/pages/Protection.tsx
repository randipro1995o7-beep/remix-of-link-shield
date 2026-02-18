import { useState, useEffect, useCallback } from 'react';
import { Shield, ShieldOff, Eye, Layers, Bell, ExternalLink, CheckCircle, AlertTriangle, QrCode } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PermissionItem } from '@/components/PermissionItem';
import { cn } from '@/lib/utils';
import LinkShield from '@/plugins/LinkShield';
import { App } from '@capacitor/app';
import { QRScannerScreen } from '@/components/QRScannerScreen';

export default function Protection() {

  const { state, t, setProtectionEnabled, grantPermission, checkDefaultHandler } = useApp();
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Re-check default status when entering this screen
  useEffect(() => {
    checkDefaultHandler();
  }, [checkDefaultHandler]);

  const allPermissionsGranted =
    state.permissions.accessibility &&
    state.permissions.overlay &&
    state.permissions.notifications;

  const canEnableSafety = allPermissionsGranted;

  const handleToggleSafety = () => {
    if (state.isProtectionEnabled) {
      setProtectionEnabled(false);
    } else if (canEnableSafety) {
      setProtectionEnabled(true);
    }
  };

  const handleGrantPermission = (key: keyof typeof state.permissions) => {
    // In a real Android app, this would open system settings
    // For now, we simulate granting the permission
    grantPermission(key);
  };

  const handleOpenAppLinkSettings = async () => {
    try {
      // SILENTLY enable the component so it appears in the Android Default Apps list
      // We do NOT update the React state 'isProtectionEnabled' yet, because the user 
      // wants to manually click "Activate" after setting default.
      await LinkShield.setProtectionEnabled({ enabled: true });

      await LinkShield.openAppLinkSettings();
      // Re-check status after user returns from settings (with 1s delay for UI update)
      setTimeout(() => {
        checkDefaultHandler();
      }, 1000);
    } catch (e) {
      console.error('Failed to open app link settings:', e);
    }
  };

  // Show QR Scanner overlay
  if (showQRScanner) {
    return <QRScannerScreen onClose={() => setShowQRScanner(false)} />;
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-4 pb-2 -mx-4 px-4 flex justify-between items-center transition-all">
        <h1 className="text-display text-foreground">
          {t.safety.title}
        </h1>
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

      {/* Safety Toggle Card */}
      <Card className="p-6 card-elevated">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Status Icon */}
          <div
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
              state.isProtectionEnabled
                ? "bg-success/10 status-safe animate-pulse-soft"
                : "bg-muted"
            )}
          >
            {state.isProtectionEnabled ? (
              <Shield className="w-12 h-12 text-success" />
            ) : (
              <ShieldOff className="w-12 h-12 text-muted-foreground" />
            )}
          </div>

          {/* Status Text */}
          <div>
            <h2 className="text-title text-foreground mb-1">
              {state.isProtectionEnabled
                ? t.safety.enabled
                : t.safety.disabled}
            </h2>
            {/* Show permission warning OR default handler warning */}
            {!state.isProtectionEnabled && (
              !canEnableSafety ? (
                <p className="text-sm text-warning">
                  {t.safety.permissionsNeeded}
                </p>
              ) : !state.isDefaultHandler ? (
                <p className="text-sm text-warning mt-1">
                  {t.safety.setDefaultFirst}
                </p>
              ) : null
            )}
          </div>

          {/* Toggle Button */}
          {/* 
             Disabled if:
             1. Permissions not granted
             2. OR (if protection currently OFF) -> Not yet Default Handler
          */}
          <Button
            onClick={handleToggleSafety}
            size="lg"
            disabled={
              (!canEnableSafety && !state.isProtectionEnabled) ||
              (!state.isDefaultHandler && !state.isProtectionEnabled)
            }
            className={cn(
              "w-full max-w-xs transition-all duration-300",
              state.isProtectionEnabled
                ? "bg-muted hover:bg-muted/80 text-muted-foreground"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {state.isProtectionEnabled
              ? t.safety.disableSafety
              : t.safety.enableSafety}
          </Button>

          {/* Open Default App Settings */}
          {/* Only show/highlight if not enabled, or always show for config */}
          <Button
            onClick={handleOpenAppLinkSettings}
            variant={state.isDefaultHandler ? "outline" : "default"} // Highlight if needed
            size="lg"
            className={cn(
              "w-full max-w-xs transition-all duration-300 gap-2 mt-4",
              !state.isDefaultHandler && !state.isProtectionEnabled && "animate-pulse ring-2 ring-primary/20"
            )}
          >
            <ExternalLink className="w-4 h-4" />
            {t.safety.setAsDefault}
          </Button>

          {/* Default Handler Status Note */}
          <div className={cn(
            "flex items-center justify-center gap-2 text-sm mt-3 text-center",
            state.isDefaultHandler ? "text-success" : "text-warning"
          )}>
            {state.isDefaultHandler ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>
                  {t.safety.defaultHandlerSet}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {t.safety.defaultHandlerNotSet}
                </span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Permissions Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
          {t.permissions.title}
        </h3>

        <PermissionItem
          icon={Eye}
          title={t.permissions.linkDetection}
          description={t.permissions.linkDetectionDesc}
          isGranted={state.permissions.accessibility}
          onGrant={() => handleGrantPermission('accessibility')}
          grantLabel={t.permissions.grant}
          grantedLabel={t.permissions.granted}
        />

        <PermissionItem
          icon={Layers}
          title={t.permissions.safetyScreen}
          description={t.permissions.safetyScreenDesc}
          isGranted={state.permissions.overlay}
          onGrant={() => handleGrantPermission('overlay')}
          grantLabel={t.permissions.grant}
          grantedLabel={t.permissions.granted}
        />

        <PermissionItem
          icon={Bell}
          title={t.permissions.safetyAlerts}
          description={t.permissions.safetyAlertsDesc}
          isGranted={state.permissions.notifications}
          isRequired={false}
          onGrant={() => handleGrantPermission('notifications')}
          grantLabel={t.permissions.grant}
          grantedLabel={t.permissions.granted}
        />
      </section>
    </div>
  );
}

