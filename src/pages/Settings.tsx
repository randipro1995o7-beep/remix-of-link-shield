import { useEffect, useState } from 'react';
import { ChevronRight, Globe, Bell, HelpCircle, Shield, FileText, History, Users, Crown, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Language } from '@/i18n/translations';
import { SafetyHistoryScreen } from '@/components/SafetyHistoryScreen';
import { FamilyModeSetup } from '@/components/FamilyModeSetup';
import { PrivacyPolicy } from './PrivacyPolicy';
import { AboutPage } from './AboutPage';
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
  const isRowButton = isClickable; // if not clickable, render a non-disabled container so nested controls (Switch) still work
  
  const className = `
    w-full flex items-center gap-4 p-4 text-left rounded-xl
    transition-all duration-200 ease-out
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
  const { state, t, setLanguage, dispatch } = useApp();
  const [showHistory, setShowHistory] = useState(false);
  const [showFamilyMode, setShowFamilyMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const NOTIFICATIONS_KEY = 'linkguardian_notifications_enabled';
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

      {/* Help & Support Sheet */}
      <Sheet open={showHelp} onOpenChange={setShowHelp}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="text-xl">{t.settings.help}</SheetTitle>
            <SheetDescription>
              {state.language === 'id' 
                ? 'Temukan jawaban atau hubungi kami' 
                : 'Find answers or get in touch'}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-3 pb-6">
            {/* FAQ Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {state.language === 'id' ? 'Pertanyaan Umum' : 'FAQ'}
              </h3>
              
              <div className="space-y-2">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium text-sm">
                    {state.language === 'id' 
                      ? 'Bagaimana cara kerja Link Guardian?' 
                      : 'How does Link Guardian work?'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {state.language === 'id'
                      ? 'Link Guardian membantu Anda berhenti sejenak sebelum membuka tautan. Ini memberi waktu untuk mempertimbangkan keamanan tautan.'
                      : 'Link Guardian helps you pause before opening links. This gives you time to consider link safety.'}
                  </p>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium text-sm">
                    {state.language === 'id' 
                      ? 'Apakah data saya aman?' 
                      : 'Is my data safe?'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {state.language === 'id'
                      ? 'Ya! Semua data disimpan secara lokal di perangkat Anda. Tidak ada yang dikirim ke server.'
                      : 'Yes! All data is stored locally on your device. Nothing is sent to servers.'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Contact Section */}
            <div className="space-y-2 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {state.language === 'id' ? 'Hubungi Kami' : 'Contact Us'}
              </h3>
              
              <button 
                onClick={() => window.open('mailto:support@linkguardian.app', '_blank')}
                className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-muted-foreground">support@linkguardian.app</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <button 
                onClick={() => window.open('https://twitter.com/linkguardian', '_blank')}
                className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Twitter / X</p>
                  <p className="text-xs text-muted-foreground">@linkguardian</p>
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
