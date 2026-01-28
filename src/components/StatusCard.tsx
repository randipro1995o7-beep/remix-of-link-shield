import { Shield, ShieldOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export function StatusCard() {
  const { state, t } = useApp();
  const isProtected = state.isProtectionEnabled;
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-500",
        isProtected
          ? "bg-gradient-to-br from-success/90 to-primary/90 status-safe"
          : "bg-gradient-to-br from-warning/90 to-accent/90 status-alert"
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
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
            isProtected && "animate-gentle-pulse"
          )}
        >
          {isProtected ? (
            <Shield className="w-8 h-8 text-white" />
          ) : (
            <ShieldOff className="w-8 h-8 text-white" />
          )}
        </div>
        
        {/* Text */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white mb-1">
            {isProtected ? t.home.statusSafe : t.home.statusAlert}
          </h2>
          <p className="text-white/80 text-sm">
            {isProtected ? t.home.statusSafeDesc : t.home.statusAlertDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
