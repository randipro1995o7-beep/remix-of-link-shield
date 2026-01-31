import { Shield, ShieldOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

/**
 * Status Card - Shows current safety status
 * 
 * Uses assistive language, not absolute security claims.
 * "Active" rather than "Protected" to avoid overclaiming.
 */
export function StatusCard() {
  const { state, t } = useApp();
  const isActive = state.isProtectionEnabled;
  
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
        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            "bg-white/20 backdrop-blur-sm",
            isActive && "animate-gentle-pulse"
          )}
          aria-hidden="true"
        >
          {isActive ? (
            <Shield className="w-8 h-8 text-white" />
          ) : (
            <ShieldOff className="w-8 h-8 text-white" />
          )}
        </div>
        
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
