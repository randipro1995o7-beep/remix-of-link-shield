import { ArrowLeft, Shield, Heart, AlertCircle, Info } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';

interface AboutPageProps {
  onBack: () => void;
}

/**
 * About Screen
 * 
 * Honest, transparent description of what Link Guardian does and doesn't do.
 * No overclaims. No security guarantees.
 */
export function AboutPage({ onBack }: AboutPageProps) {
  const { t } = useApp();

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
          <h1 className="text-xl font-semibold text-foreground">{t.about.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8 space-y-6">
        {/* App Icon & Name */}
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t.appName}</h2>
          <p className="text-muted-foreground">{t.about.description}</p>
        </div>

        {/* Mission */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            {t.about.mission}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {t.about.missionDesc}
          </p>
        </Card>

        {/* Honest Claims - IMPORTANT for Play Store */}
        <Card className="p-4 border-warning/30 bg-warning/5">
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            {t.about.honestClaim}
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{t.about.notAntivirus}</span>
            </li>
            <li className="flex items-start gap-3">
              <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{t.about.notGuarantee}</span>
            </li>
            <li className="flex items-start gap-3">
              <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{t.about.assistsOnly}</span>
            </li>
          </ul>
        </Card>

        {/* What Link Guardian Does */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-3">What Link Guardian Does</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-success mt-1">✓</span>
              <span>Adds a pause before opening external links</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-1">✓</span>
              <span>Shows basic information about the link destination</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-1">✓</span>
              <span>Helps you think before clicking unfamiliar links</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-1">✓</span>
              <span>Keeps your link history private on your device</span>
            </li>
          </ul>
        </Card>

        {/* What Link Guardian Does NOT Do */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-3">What Link Guardian Does NOT Do</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">✗</span>
              <span>Scan for viruses or malware</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">✗</span>
              <span>Guarantee website safety</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">✗</span>
              <span>Block all dangerous websites</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">✗</span>
              <span>Replace your judgment or common sense</span>
            </li>
          </ul>
        </Card>

        {/* Version & Credits */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">
            {t.about.version} 1.0.0
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            {t.about.madeWith} <Heart className="w-4 h-4 text-destructive inline" />
          </p>
        </div>
      </div>
    </div>
  );
}
