import { Shield, ShieldOff, Eye, Layers, Bell } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PermissionItem } from '@/components/PermissionItem';
import { cn } from '@/lib/utils';

export default function Protection() {
  const { state, t, setProtectionEnabled, grantPermission } = useApp();
  
  const allPermissionsGranted = 
    state.permissions.accessibility &&
    state.permissions.overlay &&
    state.permissions.notifications;
  
  const canEnableProtection = allPermissionsGranted;
  
  const handleToggleProtection = () => {
    if (state.isProtectionEnabled) {
      setProtectionEnabled(false);
    } else if (canEnableProtection) {
      setProtectionEnabled(true);
    }
  };
  
  const handleGrantPermission = (key: keyof typeof state.permissions) => {
    // In a real Android app, this would open system settings
    // For now, we simulate granting the permission
    grantPermission(key);
  };
  
  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="pt-4 pb-2">
        <h1 className="text-display text-foreground">
          {t.protection.title}
        </h1>
      </header>
      
      {/* Protection Toggle Card */}
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
                ? t.protection.enabled
                : t.protection.disabled}
            </h2>
            {!canEnableProtection && !state.isProtectionEnabled && (
              <p className="text-sm text-warning">
                {t.protection.permissionsNeeded}
              </p>
            )}
          </div>
          
          {/* Toggle Button */}
          <Button
            onClick={handleToggleProtection}
            size="lg"
            disabled={!canEnableProtection && !state.isProtectionEnabled}
            className={cn(
              "w-full max-w-xs transition-all duration-300",
              state.isProtectionEnabled
                ? "bg-muted hover:bg-muted/80 text-muted-foreground"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {state.isProtectionEnabled
              ? t.protection.disableProtection
              : t.protection.enableProtection}
          </Button>
        </div>
      </Card>
      
      {/* Permissions Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
          {t.permissions.title}
        </h3>
        
        <PermissionItem
          icon={Eye}
          title={t.permissions.accessibility}
          description={t.permissions.accessibilityDesc}
          isGranted={state.permissions.accessibility}
          onGrant={() => handleGrantPermission('accessibility')}
          grantLabel={t.permissions.grant}
          grantedLabel={t.permissions.granted}
        />
        
        <PermissionItem
          icon={Layers}
          title={t.permissions.overlay}
          description={t.permissions.overlayDesc}
          isGranted={state.permissions.overlay}
          onGrant={() => handleGrantPermission('overlay')}
          grantLabel={t.permissions.grant}
          grantedLabel={t.permissions.granted}
        />
        
        <PermissionItem
          icon={Bell}
          title={t.permissions.notifications}
          description={t.permissions.notificationsDesc}
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
