import { ShieldX, RefreshCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

interface ErrorScreenProps {
  type: 'storage' | 'permission' | 'analysis' | 'generic';
  onRetry?: () => void;
  onBack: () => void;
}

/**
 * Fail-Safe Error Screen
 * 
 * Displays when any system error occurs during the safety flow.
 * The link remains BLOCKED by default for user safety.
 * Uses calm, non-technical language.
 */
export function ErrorScreen({ type, onRetry, onBack }: ErrorScreenProps) {
  const { t } = useApp();

  const errorMessages: Record<typeof type, { title: string; description: string }> = {
    storage: {
      title: t.errors.storageTitle,
      description: t.errors.storageDesc,
    },
    permission: {
      title: t.errors.permissionTitle,
      description: t.errors.permissionDesc,
    },
    analysis: {
      title: t.errors.analysisTitle,
      description: t.errors.analysisDesc,
    },
    generic: {
      title: t.errors.generic,
      description: t.errors.genericDesc,
    },
  };

  const { title, description } = errorMessages[type] || errorMessages.generic;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-muted-foreground" />
      </div>

      {/* Title */}
      <h2 className="text-title text-foreground text-center mb-3">
        {title}
      </h2>

      {/* Description */}
      <p className="text-center text-muted-foreground mb-4 max-w-sm leading-relaxed">
        {description}
      </p>

      {/* Safety notice */}
      <div className="px-4 py-3 rounded-xl bg-primary/10 mb-8 max-w-sm">
        <p className="text-sm text-center text-primary">
          {t.errors.linkBlockedSafety}
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        {onRetry && (
          <Button onClick={onRetry} size="lg" className="w-full h-14 text-lg gap-2">
            <RefreshCcw className="w-5 h-5" />
            {t.errors.tryAgain}
          </Button>
        )}
        
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.errors.goBack}
        </button>
      </div>
    </div>
  );
}
