import { ArrowLeft, Smartphone, CloudOff, EyeOff, Trash2, Shield } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';

interface PrivacyPolicyProps {
  onBack: () => void;
}

/**
 * Privacy Policy Screen
 * 
 * Clearly explains data handling practices with honest, non-technical language.
 * Aligns with Google Play Store requirements for transparency.
 */
export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const { t } = useApp();

  const privacyPoints = [
    {
      icon: Smartphone,
      title: t.privacy.localOnly,
      description: t.privacy.localOnlyDesc,
    },
    {
      icon: CloudOff,
      title: t.privacy.noUpload,
      description: t.privacy.noUploadDesc,
    },
    {
      icon: EyeOff,
      title: t.privacy.noTracking,
      description: t.privacy.noTrackingDesc,
    },
    {
      icon: Trash2,
      title: t.privacy.clearableData,
      description: t.privacy.clearableDataDesc,
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4 safe-area-top">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={t.common.back}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">{t.privacy.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8 space-y-6">
        {/* Intro */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-foreground">{t.privacy.intro}</p>
          </div>
        </Card>

        {/* Privacy Points */}
        <div className="space-y-4">
          {privacyPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{point.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Technical Details (for transparency) */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-medium text-foreground mb-3">Technical Details</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Safety PIN stored using Android encrypted preferences</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Link history stored locally on device only</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>No network requests made for link analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>No third-party SDKs for analytics or advertising</span>
            </li>
          </ul>
        </Card>

        {/* Last Updated */}
        <p className="text-center text-sm text-muted-foreground">
          {t.privacy.lastUpdated}: January 2026
        </p>
      </div>
    </div>
  );
}
