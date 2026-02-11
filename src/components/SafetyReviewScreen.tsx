import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, ShieldAlert, ShieldX, CheckCircle, AlertTriangle, XCircle, ExternalLink, X, ArrowRight, Globe, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { performSafetyReview, SafetyReviewResult, SafetyCheck, RiskLevel } from '@/lib/safetyReview';
import { SafeBrowsingResult } from '@/lib/services/GoogleSafeBrowsing';
import { ResolvedUrlResult } from '@/lib/services/UrlResolver';
import DomainReputation from '@/lib/services/DomainReputation';
import { SafetyHistoryService, FamilyModeService } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { HighRiskConfirmation } from './HighRiskConfirmation';
import { GuardianPinVerification } from './GuardianPinVerification';
import { SafetyPinVerification } from './SafetyPinVerification';
import { BlockedLinkScreen } from './BlockedLinkScreen';
import { useApp } from '@/contexts/AppContext';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { playWarningSound, playDangerSound } from '@/lib/alertSound';

interface SafetyReviewScreenProps {
  url: string;
  source?: string;
  onCancel: () => void;
  onProceed: () => void;
  safeBrowsingResult?: SafeBrowsingResult;
  redirectInfo?: ResolvedUrlResult;
}

/**
 * Safety Review Screen
 * 
 * Shows link analysis results with calm, non-fear-based language.
 * Uses assistive wording - "helps you decide" not "protects you".
 */
export function SafetyReviewScreen({ url, source, onCancel, onProceed, safeBrowsingResult, redirectInfo }: SafetyReviewScreenProps) {
  const { t, refreshStats } = useApp();
  const [review, setReview] = useState<SafetyReviewResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [showHighRiskConfirm, setShowHighRiskConfirm] = useState(false);
  const [showGuardianPin, setShowGuardianPin] = useState(false);
  const [showSafetyPin, setShowSafetyPin] = useState(false);
  const [familyModeEnabled, setFamilyModeEnabled] = useState(false);

  // Risk level display configuration - using assistive language
  const riskConfig: Record<RiskLevel, {
    icon: typeof Shield;
    title: string;
    bgColor: string;
    iconColor: string;
    borderColor: string;
  }> = {
    low: {
      icon: Shield,
      title: t.safetyReview.riskLow,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
      borderColor: 'border-success/20',
    },
    medium: {
      icon: ShieldAlert,
      title: t.safetyReview.riskMedium,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20',
    },
    high: {
      icon: ShieldX,
      title: t.safetyReview.riskHigh,
      bgColor: 'bg-destructive/10',
      iconColor: 'text-destructive',
      borderColor: 'border-destructive/20',
    },
    blocked: {
      icon: ShieldX,
      title: t.blocked.title,
      bgColor: 'bg-destructive/20',
      iconColor: 'text-destructive',
      borderColor: 'border-destructive/30',
    },
  };

  useEffect(() => {
    const init = async () => {
      // Check family mode status
      const isFamilyMode = await FamilyModeService.isEnabled();
      setFamilyModeEnabled(isFamilyMode);

      // Simulate brief analysis time for user experience
      await new Promise(resolve => setTimeout(resolve, 1200));
      const result = performSafetyReview(url, safeBrowsingResult);
      setReview(result);
      setIsAnalyzing(false);

      // Play audio alert and haptic feedback for high-risk or blocked links
      if (result.riskLevel === 'high' || result.riskLevel === 'blocked') {
        // Play audio alert
        if (result.riskLevel === 'blocked') {
          await playDangerSound();
        } else {
          await playWarningSound();
        }

        // Also vibrate
        try {
          await Haptics.notification({ type: NotificationType.Warning });
        } catch (e) {
          // Haptics not available, ignore silently
          console.debug('Haptics not available:', e);
        }
      }
    };

    init();
  }, [url]);

  const handleCancel = async () => {
    // Record cancelled decision
    if (review) {
      // Use 'high' for blocked links in history (storage type compatibility)
      const storedRiskLevel = review.riskLevel === 'blocked' ? 'high' : review.riskLevel;
      await SafetyHistoryService.recordDecision({
        url,
        domain: review.domain,
        riskLevel: storedRiskLevel,
        action: 'cancelled',
        source,
      });
      // Refresh global stats
      await refreshStats();
    }
    onCancel();
  };

  const handleProceed = async () => {
    if (!review) return;

    // For HIGH risk links, require extra friction
    // For HIGH risk links
    if (review.riskLevel === 'high') {
      // Check if family mode requires guardian approval
      if (familyModeEnabled) {
        setShowGuardianPin(true);
        return;
      }
      // Otherwise use standard Safety PIN
      setShowSafetyPin(true);
      return;
    }

    // For MEDIUM risk (suspicious, e.g. fake invitation)
    // Require Safety PIN as per user request
    if (review.riskLevel === 'medium') {
      setShowSafetyPin(true);
      return;
    }

    // Record and proceed for low risk
    await recordAndProceed();
  };

  const recordAndProceed = async () => {
    if (review) {
      // Use 'high' for blocked links in history (storage type compatibility)
      const storedRiskLevel = review.riskLevel === 'blocked' ? 'high' : review.riskLevel;
      await SafetyHistoryService.recordDecision({
        url,
        domain: review.domain,
        riskLevel: storedRiskLevel,
        action: 'opened',
        source,
      });
      // Refresh global stats
      await refreshStats();
    }
    onProceed();
  };

  const handleSafetyPinVerified = async () => {
    setShowSafetyPin(false);
    await recordAndProceed();
  };

  const handleGuardianVerified = async () => {
    setShowGuardianPin(false);
    await recordAndProceed();
  };

  // Check result icons
  function CheckIcon({ check }: { check: SafetyCheck }) {
    if (check.passed) {
      return <CheckCircle className="w-5 h-5 text-success flex-shrink-0" aria-hidden="true" />;
    }
    if (check.severity === 'danger') {
      return <XCircle className="w-5 h-5 text-destructive flex-shrink-0" aria-hidden="true" />;
    }
    return <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" aria-hidden="true" />;
  }

  if (isAnalyzing || !review) {
    return (
      <div
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center animate-fade-in"
        role="status"
        aria-live="polite"
        aria-label={t.safetyReview.analyzing}
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-gentle-pulse">
          <Shield className="w-10 h-10 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-title text-foreground mb-2">{t.safetyReview.analyzing}</h2>
        <p className="text-muted-foreground">{t.safetyReview.analyzingDesc}</p>
      </div>
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

  // Show Safety PIN verification (for Medium/High risk)
  if (showSafetyPin) {
    return (
      <SafetyPinVerification
        onSuccess={handleSafetyPinVerified}
        onCancel={() => setShowSafetyPin(false)}
      />
    );
  }

  // Show blocked screen for confirmed scam links - NO BYPASS OPTION
  if (review.riskLevel === 'blocked') {
    return (
      <BlockedLinkScreen
        url={url}
        domain={review.domain}
        scamCategory={review.scamCategory}
        onClose={onCancel}
      />
    );
  }

  const config = riskConfig[review.riskLevel];
  const RiskIcon = config.icon;

  // Separate failed and passed checks
  const failedChecks = review.checks.filter(c => !c.passed);
  const passedChecks = review.checks.filter(c => c.passed);

  // Domain reputation
  const finalDomain = review.domain;
  const reputation = DomainReputation.getReputation(finalDomain);

  // Redirect chain state
  const [showRedirectChain, setShowRedirectChain] = useState(false);
  const hasRedirects = redirectInfo && redirectInfo.totalRedirects > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in"
      role="main"
      aria-labelledby="review-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-area-top">
        <button
          onClick={handleCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label={t.common.back}
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 id="review-title" className="font-semibold text-foreground">{t.safetyReview.title}</h1>
        <div className="w-12" aria-hidden="true" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Risk Level Badge */}
        <div className="flex justify-center pt-4 pb-6">
          <div
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-2xl border-2",
              config.bgColor,
              config.borderColor
            )}
            role="status"
            aria-label={`${config.title}: ${t.safetyReview.basedOnChecks}`}
          >
            <RiskIcon className={cn("w-10 h-10", config.iconColor)} aria-hidden="true" />
            <div>
              <p className={cn("font-bold text-lg", config.iconColor)}>
                {config.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.safetyReview.basedOnChecks}
              </p>
            </div>
          </div>
        </div>

        {/* Domain Reputation Badge */}
        {reputation.isKnown && (
          <div className={cn(
            "flex items-center justify-center gap-2 py-2 px-4 rounded-full mx-auto mb-4 text-sm font-medium",
            reputation.tier === 'top-100'
              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
          )}>
            <Award className="w-4 h-4" aria-hidden="true" />
            <span>
              {reputation.tier === 'top-100' ? 'Verified Popular Site' : 'Known Site'}
            </span>
          </div>
        )}

        {/* Domain Preview */}
        <Card className="p-4 mb-4 bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">{t.stopScreen.linkDestination}</p>
          <p className="font-medium text-foreground break-all">{review.domain}</p>
        </Card>

        {/* Redirect Chain */}
        {hasRedirects && (
          <Card className="mb-4 overflow-hidden">
            <button
              onClick={() => setShowRedirectChain(!showRedirectChain)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              aria-expanded={showRedirectChain}
            >
              <span className="font-medium text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                Redirect Path
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  redirectInfo!.isSuspiciousRedirect
                    ? 'bg-warning/10 text-warning'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {redirectInfo!.totalRedirects} hop{redirectInfo!.totalRedirects > 1 ? 's' : ''}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">
                {showRedirectChain ? t.common.hide : t.common.show}
              </span>
            </button>

            {showRedirectChain && (
              <div className="px-4 pb-4 space-y-1">
                {redirectInfo!.redirectChain.map((hop, i) => {
                  const isLast = i === redirectInfo!.redirectChain.length - 1;
                  const prevDomain = i > 0 ? redirectInfo!.redirectChain[i - 1].domain : null;
                  const isCrossDomain = prevDomain !== null && prevDomain !== hop.domain;

                  return (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && (
                        <ArrowRight className={cn(
                          "w-3 h-3 flex-shrink-0",
                          isCrossDomain ? 'text-warning' : 'text-muted-foreground'
                        )} aria-hidden="true" />
                      )}
                      <span className={cn(
                        "text-sm break-all",
                        isLast ? 'font-medium text-foreground' : 'text-muted-foreground',
                        isCrossDomain && 'text-warning'
                      )}>
                        {hop.domain || hop.url}
                      </span>
                      {hop.type !== 'origin' && (
                        <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                          ({hop.type})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Summary */}
        <Card className="p-4 mb-4">
          <p className="text-foreground leading-relaxed">{review.summary}</p>
        </Card>

        {/* Important: Disclaimer - Honest claim */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 mb-4">
          <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {t.safetyReview.disclaimer}
          </p>
        </div>

        {/* Failed Checks (Issues Found) */}
        {failedChecks.length > 0 && (
          <section className="mb-4" aria-labelledby="things-to-consider">
            <h3 id="things-to-consider" className="font-medium text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" aria-hidden="true" />
              {t.safetyReview.thingsToConsider}
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
              aria-expanded={showAllChecks}
            >
              <span className="font-medium text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" aria-hidden="true" />
                {passedChecks.length} {t.safetyReview.checksPassed}
              </span>
              <span className="text-sm text-muted-foreground">
                {showAllChecks ? t.common.hide : t.common.show}
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
          <h3 className="font-medium text-foreground mb-2">{t.safetyReview.ourRecommendation}</h3>
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
            <X className="w-5 h-5" aria-hidden="true" />
            {t.safetyReview.cancelAndClose}
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
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            <span>{t.safetyReview.openAnyway}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
