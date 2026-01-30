import { useState } from 'react';
import { ChevronRight, Globe, Bell, HelpCircle, Shield, FileText, History, Users, Crown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Language } from '@/i18n/translations';
import { SafetyHistoryScreen } from '@/components/SafetyHistoryScreen';
import { FamilyModeSetup } from '@/components/FamilyModeSetup';

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ar', label: 'العربية' },
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
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      ))}
    </button>
  );
}

export default function Settings() {
  const { state, t, setLanguage, dispatch } = useApp();
  const [showHistory, setShowHistory] = useState(false);
  const [showFamilyMode, setShowFamilyMode] = useState(false);
  
  const currentLanguage = languages.find(l => l.code === state.language)?.label || 'English';
  
  const handleNotificationsToggle = (checked: boolean) => {
    dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: checked });
  };
  
  const handleLanguageChange = () => {
    // In a real app, this would open a language picker modal
    // For now, cycle through languages
    const currentIndex = languages.findIndex(l => l.code === state.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].code);
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
          onClick={() => {}}
        />
        
        <SettingsItem
          icon={FileText}
          title={t.settings.privacy}
          onClick={() => {}}
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
