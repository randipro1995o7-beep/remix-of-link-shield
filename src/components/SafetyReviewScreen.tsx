import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, ShieldAlert, ShieldX, CheckCircle, AlertTriangle, XCircle, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { performSafetyReview, SafetyReviewResult, SafetyCheck, RiskLevel } from '@/lib/safetyReview';
import { SafetyHistoryService, FamilyModeService } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { HighRiskConfirmation } from './HighRiskConfirmation';
import { GuardianPinVerification } from './GuardianPinVerification';

interface SafetyReviewScreenProps {
  url: string;
  source?: string;
  onCancel: () => void;
  onProceed: () => void;
}

// Risk level display configuration
const riskConfig: Record<RiskLevel, {
  icon: typeof Shield;
  title: string;
  bgColor: string;
  iconColor: string;
  borderColor: string;
}> = {
  low: {
    icon: Shield,
    title: 'Low Risk',
    bgColor: 'bg-success/10',
    iconColor: 'text-success',
    borderColor: 'border-success/20',
  },
  medium: {
    icon: ShieldAlert,
    title: 'Medium Risk',
    bgColor: 'bg-warning/10',
    iconColor: 'text-warning',
    borderColor: 'border-warning/20',
  },
  high: {
    icon: ShieldX,
    title: 'High Risk',
    bgColor: 'bg-destructive/10',
    iconColor: 'text-destructive',
    borderColor: 'border-destructive/20',
  },
};

// Check result icons
function CheckIcon({ check }: { check: SafetyCheck }) {
  if (check.passed) {
    return <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />;
  }
  if (check.severity === 'danger') {
    return <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />;
  }
  return <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />;
}

export function SafetyReviewScreen({ url, source, onCancel, onProceed }: SafetyReviewScreenProps) {
  const [review, setReview] = useState<SafetyReviewResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [showHighRiskConfirm, setShowHighRiskConfirm] = useState(false);
  const [showGuardianPin, setShowGuardianPin] = useState(false);
  const [familyModeEnabled, setFamilyModeEnabled] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Check family mode status
      const isFamilyMode = await FamilyModeService.isEnabled();
      setFamilyModeEnabled(isFamilyMode);
      
      // Simulate brief analysis time for user experience
      await new Promise(resolve => setTimeout(resolve, 1200));
      const result = performSafetyReview(url);
      setReview(result);
      setIsAnalyzing(false);
    };
    
    init();
  }, [url]);

  const handleCancel = async () => {
    // Record cancelled decision
    if (review) {
      await SafetyHistoryService.recordDecision({
        url,
        domain: review.domain,
        riskLevel: review.riskLevel,
        action: 'cancelled',
        source,
      });
    }
    onCancel();
  };

  const handleProceed = async () => {
    if (!review) return;
    
    // For HIGH risk links, require extra friction
    if (review.riskLevel === 'high') {
      // Check if family mode requires guardian approval
      if (familyModeEnabled) {
        setShowGuardianPin(true);
      } else {
        setShowHighRiskConfirm(true);
      }
      return;
    }
    
    // Record and proceed for low/medium risk
    await recordAndProceed();
  };

  const recordAndProceed = async () => {
    if (review) {
      await SafetyHistoryService.recordDecision({
        url,
        domain: review.domain,
        riskLevel: review.riskLevel,
        action: 'opened',
        source,
      });
    }
    onProceed();
  };

  const handleHighRiskConfirmed = async () => {
    setShowHighRiskConfirm(false);
    await recordAndProceed();
  };

  const handleGuardianVerified = async () => {
    setShowGuardianPin(false);
    await recordAndProceed();
  };

  if (isAnalyzing || !review) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-gentle-pulse">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-title text-foreground mb-2">Checking this link...</h2>
        <p className="text-muted-foreground">This only takes a moment</p>
      </div>
    );
  }

  // Show high-risk confirmation overlay
  if (showHighRiskConfirm) {
    return (
      <HighRiskConfirmation
        onConfirm={handleHighRiskConfirmed}
        onCancel={() => setShowHighRiskConfirm(false)}
      />
    );
  }

  // Show guardian PIN verification for family mode
  if (showGuardianPin) {
    return (
      <GuardianPinVerification
        onSuccess={handleGuardianVerified}
        onCancel={() => setShowGuardianPin(false)}
      />
    );
  }

  const config = riskConfig[review.riskLevel];
  const RiskIcon = config.icon;
  
  // Separate failed and passed checks
  const failedChecks = review.checks.filter(c => !c.passed);
  const passedChecks = review.checks.filter(c => c.passed);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-area-top">
        <button
          onClick={handleCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="font-semibold text-foreground">Safety Review</h1>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Risk Level Badge */}
        <div className="flex justify-center pt-4 pb-6">
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-2xl border-2",
            config.bgColor,
            config.borderColor
          )}>
            <RiskIcon className={cn("w-10 h-10", config.iconColor)} />
            <div>
              <p className={cn("font-bold text-lg", config.iconColor)}>
                {config.title}
              </p>
              <p className="text-sm text-muted-foreground">
                Based on our checks
              </p>
            </div>
          </div>
        </div>

        {/* Domain Preview */}
        <Card className="p-4 mb-4 bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">Link destination:</p>
          <p className="font-medium text-foreground break-all">{review.domain}</p>
        </Card>

        {/* Summary */}
        <Card className="p-4 mb-4">
          <p className="text-foreground leading-relaxed">{review.summary}</p>
        </Card>

        {/* Important: Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 mb-4">
          <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Link Guardian helps you make safer choices, but cannot guarantee a website is completely safe. 
            Always be careful with personal information.
          </p>
        </div>

        {/* Failed Checks (Issues Found) */}
        {failedChecks.length > 0 && (
          <section className="mb-4">
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Things to consider
            </h3>
            <div className="space-y-2">
              {failedChecks.map((check) => (
                <Card key={check.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckIcon check={check} />
                    <div>
                      <p className="font-medium text-foreground">{check.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Passed Checks (Collapsible) */}
        {passedChecks.length > 0 && (
          <section className="mb-4">
            <button
              onClick={() => setShowAllChecks(!showAllChecks)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                {passedChecks.length} checks passed
              </span>
              <span className="text-sm text-muted-foreground">
                {showAllChecks ? 'Hide' : 'Show'}
              </span>
            </button>
            
            {showAllChecks && (
              <div className="space-y-2 mt-2">
                {passedChecks.map((check) => (
                  <Card key={check.id} className="p-4 bg-muted/30">
                    <div className="flex items-start gap-3">
                      <CheckIcon check={check} />
                      <div>
                        <p className="font-medium text-foreground">{check.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Recommendation */}
        <Card className={cn(
          "p-4 border-2",
          config.borderColor
        )}>
          <h3 className="font-medium text-foreground mb-2">Our recommendation</h3>
          <p className="text-muted-foreground">{review.recommendation}</p>
        </Card>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <div className="space-y-3 max-w-md mx-auto">
          {/* Primary action - Cancel (recommended) */}
          <Button
            onClick={handleCancel}
            size="lg"
            className="w-full h-14 text-lg gap-2"
          >
            <X className="w-5 h-5" />
            Cancel & Close Link
          </Button>
          
          {/* Secondary action - Proceed anyway */}
          <button
            onClick={handleProceed}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
              "text-muted-foreground hover:text-foreground transition-colors",
              "border border-border hover:bg-muted/50",
              review.riskLevel === 'high' && "text-destructive/60 hover:text-destructive"
            )}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Anyway</span>
          </button>
        </div>
      </div>
    </div>
  );
}
