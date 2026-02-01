import { useState } from 'react';
import { ChevronRight, Globe, Bell, HelpCircle, Shield, FileText, History, Users, Crown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Language } from '@/i18n/translations';
import { SafetyHistoryScreen } from '@/components/SafetyHistoryScreen';
import { FamilyModeSetup } from '@/components/FamilyModeSetup';
import { PrivacyPolicy } from './PrivacyPolicy';
import { AboutPage } from './AboutPage';

const languages: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
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
  
  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors rounded-xl disabled:cursor-default"
      aria-label={subtitle ? `${title}: ${subtitle}` : title}
    >
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
    </button>
  );
}

export default function Settings() {
  const { state, t, setLanguage, dispatch } = useApp();
  const [showHistory, setShowHistory] = useState(false);
  const [showFamilyMode, setShowFamilyMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  const currentLang = languages.find(l => l.code === state.language);
  const currentLanguage = currentLang?.nativeLabel || 'English';
  
  const handleNotificationsToggle = (checked: boolean) => {
    dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: checked });
  };
  
  const handleLanguageChange = () => {
    // Cycle through supported languages (English and Indonesian for now)
    const supportedLanguages: Language[] = ['en', 'id'];
    const currentIndex = supportedLanguages.indexOf(state.language as Language);
    const nextIndex = (currentIndex + 1) % supportedLanguages.length;
    setLanguage(supportedLanguages[nextIndex]);
  };

  // Show full-screen overlays
  if (showHistory) {
    return <SafetyHistoryScreen onBack={() => setShowHistory(false)} />;
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
  
  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="pt-4 pb-2">
        <h1 className="text-display text-foreground">
          {t.settings.title}
        </h1>
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
          icon={Users}
          title={t.settings.familyMode}
          subtitle={t.settings.familyModeDesc}
          onClick={() => setShowFamilyMode(true)}
          badge="premium"
        />
        
        <SettingsItem
          icon={Crown}
          title={t.settings.premium}
          subtitle={t.settings.premiumDesc}
          onClick={() => {}}
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
              checked={state.notificationsEnabled}
              onCheckedChange={handleNotificationsToggle}
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
          onClick={() => {}}
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
    </div>
  );
}
