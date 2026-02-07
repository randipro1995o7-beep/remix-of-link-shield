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
  const { state, t, setProtectionEnabled, grantPermission } = useApp();
  const [isDefaultHandler, setIsDefaultHandler] = useState<boolean | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Check if app is set as default link handler
  const checkDefaultStatus = useCallback(async () => {
    try {
      const result = await LinkShield.isLinkHandlerEnabled();
      setIsDefaultHandler(result.enabled);
    } catch (e) {
      console.error('Failed to check link handler status:', e);
      setIsDefaultHandler(null);
    }
  }, []);

  useEffect(() => {
    // Check on mount
    checkDefaultStatus();

    // Also check when app comes back to foreground (e.g., after user changes settings)
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkDefaultStatus();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [checkDefaultStatus]);

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
        checkDefaultStatus();
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
      <header className="pt-4 pb-2 flex justify-between items-center">
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
                ? "bg-success/10 status-safe"
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
              ) : !isDefaultHandler ? (
                <p className="text-sm text-warning mt-1">
                  {state.language === 'id'
                    ? 'Atur sebagai default terlebih dahulu'
                    : 'Set as default first'}
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
              (!isDefaultHandler && !state.isProtectionEnabled)
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
            variant={isDefaultHandler ? "outline" : "default"} // Highlight if needed
            size="sm"
            className={cn(
              "gap-2 mt-2",
              !isDefaultHandler && !state.isProtectionEnabled && "animate-pulse ring-2 ring-primary/20"
            )}
          >
            <ExternalLink className="w-4 h-4" />
            {state.language === 'id' ? 'Atur sebagai Default' : 'Set as Default Link Handler'}
          </Button>

          {/* Default Handler Status Note */}
          {isDefaultHandler !== null && (
            <div className={cn(
              "flex items-center gap-2 text-sm mt-1",
              isDefaultHandler ? "text-success" : "text-warning"
            )}>
              {isDefaultHandler ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {state.language === 'id'
                      ? 'Aplikasi sudah diatur sebagai default'
                      : 'App is set as default link handler'}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {state.language === 'id'
                      ? 'Anda belum mengatur aplikasi sebagai default'
                      : 'App is not set as default link handler'}
                  </span>
                </>
              )}
            </div>
          )}
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

