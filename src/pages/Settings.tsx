import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Globe, Bell, HelpCircle, Shield, FileText, History, Users, Crown, Mail, MessageCircle, ExternalLink, Lock, Check, Activity, Fingerprint, Sun, Moon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { useSafetyPin } from '@/contexts/SafetyPinContext';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import LinkShield from '@/plugins/LinkShield';
import { Language } from '@/i18n/translations';
import { SafetyHistoryScreen } from '@/components/SafetyHistoryScreen';
import { FamilyModeSetup } from '@/components/FamilyModeSetup';
import { WhitelistScreen } from '@/components/WhitelistScreen';
import { PrivacyPolicy } from './PrivacyPolicy';
import { AboutPage } from './AboutPage';
import { ChangePinScreen } from '@/components/ChangePinScreen';
import { PremiumScreen } from '@/components/PremiumScreen';
import { RecoveryOptionsScreen } from '@/components/RecoveryOptionsScreen';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const languages: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย' },
  { code: 'tl', label: 'Filipino', nativeLabel: 'Filipino' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'lo', label: 'Lao', nativeLabel: 'ລາວ' },
  { code: 'my', label: 'Burmese', nativeLabel: 'မြန်မာဘာသာ' },
  { code: 'km', label: 'Khmer', nativeLabel: 'ខ្មែរ' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'pt-br', label: 'Portuguese (Brazil)', nativeLabel: 'Português (Brasil)' },
  { code: 'zh', label: 'Chinese (Simplified)', nativeLabel: '简体中文' },
];

interface SettingsItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  badge?: 'premium' | 'new';
}

function SettingsItem({ icon: Icon, title, subtitle, onClick, rightElement, badge }: SettingsItemProps) {
  const isClickable = Boolean(onClick);
  const isRowButton = isClickable; // if not clickable, render a non-disabled container so nested controls (Switch) still work

  const className = `
    w-full flex items-center gap-4 p-4 text-left rounded-xl
    transition-all duration-200 ease-out animate-scale-in
    ${isClickable
      ? 'hover:bg-muted/50 active:bg-muted active:scale-[0.98] cursor-pointer'
      : 'cursor-default'
    }
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  `;

  const content = (
    <>
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{title}</p>
          {badge === 'premium' && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              Premium
            </span>
          )}
          {badge === 'new' && (
            <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
              New
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {rightElement || (isClickable && (
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
      ))}
    </>
  );

  if (isRowButton) {
    return (
      <button
        onClick={onClick}
        className={className}
        aria-label={subtitle ? `${title}: ${subtitle}` : title}
        type="button"
      >
        {content}
      </button>
    );
  }

  // Non-clickable row: keep layout but DO NOT disable, so nested interactive elements keep working.
  return (
    <div className={className} aria-label={subtitle ? `${title}: ${subtitle}` : title}>
      {content}
    </div>
  );
}

export default function Settings() {
  const { state, t, setLanguage, dispatch, grantPermission } = useApp();
  const { biometricAvailable, biometricEnabled, setBiometricEnabled, biometricType } = useSafetyPin();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [showFamilyMode, setShowFamilyMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWhitelist, setShowWhitelist] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const NOTIFICATIONS_KEY = 'safetyshield_notifications_enabled';
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_KEY);
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    } catch {
      // ignore
    }
    return state.notificationsEnabled;
  });

  const currentLang = languages.find(l => l.code === state.language);
  const currentLanguage = currentLang?.nativeLabel || 'English';

  useEffect(() => {
    // keep AppContext in sync (other screens rely on this flag)
    dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: notificationsEnabled });
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, String(notificationsEnabled));
    } catch {
      // ignore
    }
  }, [notificationsEnabled, dispatch]);

  const handleLanguageChange = () => {
    setShowLanguageSelector(true);
  };

  // Show full-screen overlays
  if (showHistory) {
    return <SafetyHistoryScreen onBack={() => setShowHistory(false)} />;
  }

  if (showWhitelist) {
    return <WhitelistScreen onBack={() => setShowWhitelist(false)} />;
  }

  if (showFamilyMode) {
    return (
      <FamilyModeSetup
        onComplete={() => setShowFamilyMode(false)}
        onCancel={() => setShowFamilyMode(false)}
      />
    );
  }

  if (showPrivacy) {
    return <PrivacyPolicy onBack={() => setShowPrivacy(false)} />;
  }

  if (showAbout) {
    return <AboutPage onBack={() => setShowAbout(false)} />;
  }

  if (showChangePin) {
    return <ChangePinScreen onBack={() => setShowChangePin(false)} />;
  }

  if (showPremium) {
    return <PremiumScreen onBack={() => setShowPremium(false)} />;
  }

  if (showRecoveryOptions) {
    return <RecoveryOptionsScreen onBack={() => setShowRecoveryOptions(false)} />;
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-4 pb-2 -mx-4 px-4 flex justify-between items-center transition-all">
        <h1 className="text-display text-foreground">
          {t.settings.title}
        </h1>
        <Button
          onClick={() => {
            if (state.theme === 'tokyo-night') {
              dispatch({ type: 'SET_THEME', payload: 'light' });
            } else {
              dispatch({ type: 'SET_THEME', payload: 'tokyo-night' });
            }
          }}
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Toggle Tokyo Night Mode"
        >
          {state.theme === 'tokyo-night' ? (
            <Sun className="w-6 h-6 text-foreground/80" />
          ) : (
            <Moon className="w-6 h-6 text-foreground/80" />
          )}
        </Button>
      </header>

      {/* Safety Features */}
      <Card className="overflow-hidden card-elevated divide-y divide-border">
        <SettingsItem
          icon={History}
          title={t.settings.safetyHistory}
          subtitle={t.settings.safetyHistoryDesc}
          onClick={() => setShowHistory(true)}
        />

        <SettingsItem
          icon={Shield}
          title={t.settings.whitelist}
          subtitle={t.settings.whitelistDesc}
          onClick={() => setShowWhitelist(true)}
        />

        <SettingsItem
          icon={MessageCircle}
          title={t.settings.smsFilter}
          subtitle={t.settings.smsFilterDesc}
          onClick={async () => {
            // Request permission or open settings
            const res = await LinkShield.requestSmsPermission();
            if (res.granted) {
              grantPermission('sms');
            } else {
              // If not granted, maybe open app settings
              await LinkShield.openAppLinkSettings();
            }
          }}
          badge="new"
        />

        <SettingsItem
          icon={Activity}
          title={t.settings.accessibilityService}
          subtitle={t.settings.accessibilityServiceDesc}
          onClick={async () => {
            await LinkShield.openAccessibilitySettings();
            grantPermission('accessibility');
          }}
          badge="new"
        />

        <SettingsItem
          icon={Users}
          title={t.settings.familyMode}
          subtitle={t.settings.familyModeDesc}
          onClick={() => setShowFamilyMode(true)}
          badge="premium"
        />

        <SettingsItem
          icon={Lock}
          title={t.settings.changePin}
          subtitle={t.settings.changePinDesc}
          onClick={() => setShowChangePin(true)}
        />

        {biometricAvailable && (
          <SettingsItem
            icon={Fingerprint}
            title={(() => {
              // Map raw biometric type to translation key
              const type = biometricType.toLowerCase().replace(/\s+/g, '');
              // Check if key exists in t.biometrics, else default to 'biometric'
              // We use type casting or checking because type is string
              if (type === 'faceid') return t.biometrics.faceId;
              if (type === 'touchid') return t.biometrics.touchId;
              if (type === 'fingerprint') return t.biometrics.fingerprint;
              if (type === 'faceauthentication' || type === 'facerecognition') return t.biometrics.faceAuthentication;
              if (type === 'irisauthentication' || type === 'irisrecognition') return t.biometrics.irisAuthentication;
              return t.biometrics.biometric;
            })()}
            subtitle={biometricEnabled ? t.biometrics.enabled : t.biometrics.disabled}
            rightElement={
              <Switch
                size="lg"
                checked={biometricEnabled}
                onCheckedChange={async (checked) => {
                  try {
                    await setBiometricEnabled(checked);
                  } catch (err) {
                    // Start a new task if error handling is needed, but for now just console error via context
                    console.error("Failed to toggle biometric", err);
                  }
                }}
              />
            }
          />
        )}

        <SettingsItem
          icon={Shield}
          title={t.settings.recovery}
          subtitle={t.settings.recoveryDesc}
          onClick={() => setShowRecoveryOptions(true)}
        />

        <SettingsItem
          icon={Activity}
          title={t.settings.securityLogs}
          subtitle={t.settings.securityLogsDesc}
          onClick={() => navigate('/security-dashboard')}
          badge="new"
        />

        <SettingsItem
          icon={Crown}
          title={t.settings.premium}
          subtitle={t.settings.premiumDesc}
          onClick={() => setShowPremium(true)}
          badge="new"
        />
      </Card>

      {/* General Settings */}
      <Card className="overflow-hidden card-elevated divide-y divide-border">
        <SettingsItem
          icon={Globe}
          title={t.settings.language}
          subtitle={currentLanguage}
          onClick={handleLanguageChange}
        />

        <SettingsItem
          icon={Bell}
          title={t.settings.notifications}
          subtitle={t.settings.notificationsDesc}
          rightElement={
            <Switch
              size="lg"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              aria-label={t.settings.notifications}
            />
          }
        />
      </Card>

      {/* Help & Info */}
      <Card className="overflow-hidden card-elevated divide-y divide-border">
        <SettingsItem
          icon={HelpCircle}
          title={t.settings.help}
          onClick={() => setShowHelp(true)}
        />

        <SettingsItem
          icon={Shield}
          title={t.settings.about}
          onClick={() => setShowAbout(true)}
        />

        <SettingsItem
          icon={FileText}
          title={t.settings.privacy}
          onClick={() => setShowPrivacy(true)}
        />
      </Card>

      {/* Version */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          {t.settings.version} 1.0.0
        </p>
      </div>

      {/* Language Selector Sheet */}
      <Sheet open={showLanguageSelector} onOpenChange={setShowLanguageSelector}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <SheetHeader className="text-left pb-4 flex-shrink-0">
            <SheetTitle className="text-xl">{t.settings.language}</SheetTitle>
            <SheetDescription>
              {t.settings.selectLanguage}
            </SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto pb-6 -mx-6 px-6">
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageSelector(false);
                  }}
                  className={`
                    w-full flex items-center justify-between p-4 rounded-xl transition-all
                    ${state.language === lang.code
                      ? 'bg-primary/10 text-primary border-transparent'
                      : 'bg-muted/30 hover:bg-muted/50 text-foreground border-transparent'
                    }
                  `}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-base">{lang.nativeLabel}</span>
                    <span className="text-sm opacity-70">{lang.label}</span>
                  </div>
                  {state.language === lang.code && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Help & Support Sheet */}
      <Sheet open={showHelp} onOpenChange={setShowHelp}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="text-xl">{t.settings.help}</SheetTitle>
            <SheetDescription>
              {t.settings.findAnswers}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 pb-6">
            {/* FAQ Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t.settings.faq}
              </h3>

              <div className="space-y-2">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium text-sm">
                    {t.settings.faq1}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.settings.faq1Desc}
                  </p>
                </div>

                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium text-sm">
                    {t.settings.faq2}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.settings.faq2Desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-2 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t.settings.contactUs}
              </h3>

              <button
                onClick={() => window.open('mailto:support@safetyshield.app', '_blank')}
                className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-muted-foreground">support@safetyshield.app</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => window.open('https://twitter.com/safetyshield', '_blank')}
                className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Twitter / X</p>
                  <p className="text-xs text-muted-foreground">@safetyshield</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
