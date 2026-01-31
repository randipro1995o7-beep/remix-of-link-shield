import { useState } from 'react';
import { Shield, Eye, Layers, Bell, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface PermissionExplanationScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface PermissionStep {
  id: 'accessibility' | 'overlay' | 'notifications';
  icon: typeof Eye;
  title: string;
  shortDesc: string;
  longDesc: string;
  whyNeeded: string;
  isRequired: boolean;
}

/**
 * Permission Explanation Screen
 * 
 * Shows user-friendly explanations BEFORE requesting system permissions.
 * Uses calm, non-technical language.
 * Clearly explains what we do NOT do.
 */
export function PermissionExplanationScreen({ onComplete, onSkip }: PermissionExplanationScreenProps) {
  const { state, t, grantPermission } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeniedMessage, setShowDeniedMessage] = useState(false);

  const permissionSteps: PermissionStep[] = [
    {
      id: 'accessibility',
      icon: Eye,
      title: t.permissions.linkDetection,
      shortDesc: t.permissions.linkDetectionDesc,
      longDesc: 'This lets Link Guardian notice when you tap a link from messages, emails, or other apps.',
      whyNeeded: 'Without this, we cannot help you pause before opening links.',
      isRequired: true,
    },
    {
      id: 'overlay',
      icon: Layers,
      title: t.permissions.safetyScreen,
      shortDesc: t.permissions.safetyScreenDesc,
      longDesc: 'This lets us show a helpful screen before you visit a website.',
      whyNeeded: 'This is how we help you pause and think before clicking.',
      isRequired: true,
    },
    {
      id: 'notifications',
      icon: Bell,
      title: t.permissions.safetyAlerts,
      shortDesc: t.permissions.safetyAlertsDesc,
      longDesc: 'Receive gentle reminders about your link activity.',
      whyNeeded: 'This is optional - you can skip if you prefer.',
      isRequired: false,
    },
  ];

  const currentPermission = permissionSteps[currentStep];
  const isGranted = state.permissions[currentPermission.id];
  const Icon = currentPermission.icon;

  const handleGrant = () => {
    // In a real Android app, this would open system settings
    // For demo, we simulate granting
    grantPermission(currentPermission.id);
    setShowDeniedMessage(false);
    
    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentStep < permissionSteps.length - 1) {
        setCurrentStep(currentStep + 1);
        setIsExpanded(false);
      } else {
        onComplete();
      }
    }, 500);
  };

  const handleSkipCurrent = () => {
    if (!currentPermission.isRequired) {
      if (currentStep < permissionSteps.length - 1) {
        setCurrentStep(currentStep + 1);
        setIsExpanded(false);
      } else {
        onComplete();
      }
    } else {
      // Show denied message for required permissions
      setShowDeniedMessage(true);
    }
  };

  const requiredGranted = 
    state.permissions.accessibility && 
    state.permissions.overlay;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-title"
    >
      {/* Header */}
      <div className="p-4 pt-8 safe-area-top">
        <div className="flex items-center justify-center mb-2">
          <Shield className="w-8 h-8 text-primary mr-2" aria-hidden="true" />
          <h1 id="permission-title" className="text-xl font-bold text-foreground">
            {t.permissions.title}
          </h1>
        </div>
        <p className="text-center text-muted-foreground">
          {t.permissions.description}
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2 px-4 py-4" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemax={permissionSteps.length}>
        {permissionSteps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentStep ? "w-8 bg-primary" : "w-2",
              index < currentStep || state.permissions[step.id] 
                ? "bg-primary" 
                : "bg-muted"
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Current Permission */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300",
          isGranted ? "bg-success/10" : "bg-primary/10"
        )}>
          {isGranted ? (
            <CheckCircle className="w-12 h-12 text-success" aria-hidden="true" />
          ) : (
            <Icon className="w-12 h-12 text-primary" aria-hidden="true" />
          )}
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          {currentPermission.title}
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-6">
          {currentPermission.shortDesc}
        </p>

        {/* Expandable Details */}
        <Card className="w-full max-w-sm p-4 mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between"
            aria-expanded={isExpanded}
          >
            <span className="font-medium text-foreground">
              {isExpanded ? 'Less details' : 'Why is this needed?'}
            </span>
            <ChevronRight className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )} aria-hidden="true" />
          </button>
          
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
              <p className="text-muted-foreground">{currentPermission.longDesc}</p>
              <p className="text-sm text-foreground font-medium">{currentPermission.whyNeeded}</p>
            </div>
          )}
        </Card>

        {/* What we do NOT do - Transparency */}
        <Card className="w-full max-w-sm p-4 bg-muted/30 mb-4">
          <p className="text-sm font-medium text-foreground mb-2">{t.permissions.whatWeDoNot}</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span>{t.permissions.doesNotSpy}</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span>{t.permissions.doesNotCollect}</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span>{t.permissions.doesNotShare}</span>
            </li>
          </ul>
        </Card>

        {/* Denied Message */}
        {showDeniedMessage && (
          <Card className="w-full max-w-sm p-4 bg-warning/10 border-warning/30 mb-4 animate-fade-in">
            <h3 className="font-medium text-foreground mb-1">{t.permissions.deniedTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.permissions.deniedDesc}</p>
          </Card>
        )}

        {/* Required Badge */}
        {currentPermission.isRequired && !isGranted && !showDeniedMessage && (
          <p className="text-sm text-warning mb-4">{t.permissions.required}</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 safe-area-bottom space-y-3">
        {!isGranted ? (
          <>
            <Button
              onClick={handleGrant}
              size="lg"
              className="w-full h-14 text-lg"
              aria-label={`${t.permissions.grant} ${currentPermission.title}`}
            >
              {t.permissions.grant} {currentPermission.title}
            </Button>
            
            {!currentPermission.isRequired && (
              <button
                onClick={handleSkipCurrent}
                className="w-full text-center text-muted-foreground py-2"
              >
                Skip this step
              </button>
            )}
          </>
        ) : (
          <Button
            onClick={() => {
              if (currentStep < permissionSteps.length - 1) {
                setCurrentStep(currentStep + 1);
                setIsExpanded(false);
              } else {
                onComplete();
              }
            }}
            size="lg"
            className="w-full h-14 text-lg"
          >
            {currentStep < permissionSteps.length - 1 ? t.common.continue : t.common.done}
          </Button>
        )}

        {/* Skip All (if required permissions granted) */}
        {requiredGranted && currentStep < permissionSteps.length - 1 && (
          <button
            onClick={onComplete}
            className="w-full text-center text-sm text-muted-foreground/60 py-2"
          >
            Skip remaining steps
          </button>
        )}
      </div>
    </div>
  );
}
