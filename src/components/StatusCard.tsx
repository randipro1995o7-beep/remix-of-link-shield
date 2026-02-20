import { Shield, ShieldOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import LinkShield from '@/plugins/LinkShield';
import { useState } from 'react';

/**
 * Status Card - Shows current safety status
 * 
 * Uses assistive language, not absolute security claims.
 * "Active" rather than "Protected" to avoid overclaiming.
 * Shield icon acts as on/off toggle button.
 */
export function StatusCard() {
  const { state, t, setProtectionEnabled, setPanicMode } = useApp();
  const isActive = state.isProtectionEnabled;
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      if (!isActive) {
        // ACTIVATION SEQUENCE
        console.log('Enabling protection component...');
        await LinkShield.setProtectionEnabled({ enabled: true });
        setProtectionEnabled(true);

        setTimeout(async () => {
          await LinkShield.openAppLinkSettings();
        }, 500);

      } else {
        // DEACTIVATION
        await LinkShield.setProtectionEnabled({ enabled: false });
        setProtectionEnabled(false);
        setPanicMode(false);
      }
    } catch (error) {
      console.error('Failed to toggle protection:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-500",
        isActive
          ? "bg-gradient-to-br from-success/90 to-primary/90 status-safe"
          : "bg-gradient-to-br from-warning/90 to-accent/90 status-alert"
      )}
      role="status"
      aria-live="polite"
      aria-label={isActive ? t.home.statusActive : t.home.statusPaused}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Shield Icon — acts as ON/OFF toggle */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            "backdrop-blur-sm transition-all duration-300",
            "cursor-pointer active:scale-90",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
            isActive
              ? "bg-white/30 ring-2 ring-white/50 shadow-lg shadow-white/20 animate-gentle-pulse"
              : "bg-white/20 hover:bg-white/30",
            isToggling && "opacity-50 pointer-events-none"
          )}
          aria-label={isActive ? t.home.statusActive : t.home.statusPaused}
        >
          {isActive ? (
            <Shield className="w-8 h-8 text-white drop-shadow-md" />
          ) : (
            <ShieldOff className="w-8 h-8 text-white/80" />
          )}
        </button>

        {/* Text - Using assistive language */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white mb-1">
            {isActive ? t.home.statusActive : t.home.statusPaused}
          </h2>
          <p className="text-white/80 text-sm">
            {isActive ? t.home.statusActiveDesc : t.home.statusPausedDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
