import { useState } from 'react';
import { Shield, Eye, Layers, Bell, ChevronRight, CheckCircle } from 'lucide-react';
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

const permissionSteps: PermissionStep[] = [
  {
    id: 'accessibility',
    icon: Eye,
    title: 'Link Detection',
    shortDesc: 'Know when you tap a link',
    longDesc: 'This allows Link Guardian to notice when you\'re about to open a link from messages, emails, or other apps.',
    whyNeeded: 'Without this, we can\'t help protect you from harmful links.',
    isRequired: true,
  },
  {
    id: 'overlay',
    icon: Layers,
    title: 'Safety Screen',
    shortDesc: 'Show safety warnings',
    longDesc: 'This lets Link Guardian show a helpful safety check before you visit a website.',
    whyNeeded: 'This is how we pause and help you think before clicking.',
    isRequired: true,
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Safety Alerts',
    shortDesc: 'Get notified about threats',
    longDesc: 'Receive gentle notifications when we block a potentially harmful link.',
    whyNeeded: 'Helps keep you informed, but you can skip this if you prefer.',
    isRequired: false,
  },
];

export function PermissionExplanationScreen({ onComplete, onSkip }: PermissionExplanationScreenProps) {
  const { state, grantPermission } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentPermission = permissionSteps[currentStep];
  const isGranted = state.permissions[currentPermission.id];
  const Icon = currentPermission.icon;

  const handleGrant = () => {
    // In a real Android app, this would open system settings
    // For now, we simulate granting
    grantPermission(currentPermission.id);
    
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
    }
  };

  const requiredGranted = 
    state.permissions.accessibility && 
    state.permissions.overlay;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 pt-8 safe-area-top">
        <div className="flex items-center justify-center mb-2">
          <Shield className="w-8 h-8 text-primary mr-2" />
          <h1 className="text-xl font-bold text-foreground">Setting Up Safety</h1>
        </div>
        <p className="text-center text-muted-foreground">
          We need a few permissions to keep you safe
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2 px-4 py-4">
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
            <CheckCircle className="w-12 h-12 text-success" />
          ) : (
            <Icon className="w-12 h-12 text-primary" />
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
        <Card className="w-full max-w-sm p-4 mb-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between"
          >
            <span className="font-medium text-foreground">
              {isExpanded ? 'Less details' : 'Why is this needed?'}
            </span>
            <ChevronRight className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )} />
          </button>
          
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
              <p className="text-muted-foreground">{currentPermission.longDesc}</p>
              <p className="text-sm text-foreground font-medium">{currentPermission.whyNeeded}</p>
            </div>
          )}
        </Card>

        {/* Required Badge */}
        {currentPermission.isRequired && !isGranted && (
          <p className="text-sm text-warning mb-4">Required for safety protection</p>
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
            >
              Allow {currentPermission.title}
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
            {currentStep < permissionSteps.length - 1 ? 'Continue' : 'Start Protection'}
          </Button>
        )}

        {/* Skip All (if required permissions granted) */}
        {requiredGranted && currentStep < permissionSteps.length - 1 && (
          <button
            onClick={onComplete}
            className="w-full text-center text-sm text-muted-foreground/60 py-2"
          >
            Skip remaining and start protection
          </button>
        )}
      </div>
    </div>
  );
}
