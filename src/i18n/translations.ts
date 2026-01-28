// Internationalization support for Link Guardian
// Default language: English
// Structure ready for adding more languages

export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'zh' | 'hi' | 'ar';

export interface TranslationKeys {
  // App general
  appName: string;
  tagline: string;
  
  // Navigation
  nav: {
    home: string;
    protection: string;
    settings: string;
  };
  
  // Home screen
  home: {
    statusSafe: string;
    statusSafeDesc: string;
    statusAlert: string;
    statusAlertDesc: string;
    linksChecked: string;
    threatsBlocked: string;
    protectedSince: string;
  };
  
  // Protection screen
  protection: {
    title: string;
    enabled: string;
    disabled: string;
    enableProtection: string;
    disableProtection: string;
    permissionsNeeded: string;
    grantPermissions: string;
  };
  
  // Settings screen
  settings: {
    title: string;
    language: string;
    notifications: string;
    notificationsDesc: string;
    about: string;
    help: string;
    privacy: string;
    version: string;
  };
  
  // Permissions
  permissions: {
    title: string;
    description: string;
    accessibility: string;
    accessibilityDesc: string;
    overlay: string;
    overlayDesc: string;
    notifications: string;
    notificationsDesc: string;
    grant: string;
    granted: string;
    required: string;
  };
  
  // Errors
  errors: {
    generic: string;
    networkError: string;
    tryAgain: string;
    goBack: string;
  };
  
  // Common
  common: {
    enable: string;
    disable: string;
    save: string;
    cancel: string;
    continue: string;
    back: string;
    done: string;
    loading: string;
  };
}

export const translations: Record<Language, TranslationKeys> = {
  en: {
    appName: 'Link Guardian',
    tagline: 'Stay safe, click smart',
    
    nav: {
      home: 'Home',
      protection: 'Protection',
      settings: 'Settings',
    },
    
    home: {
      statusSafe: 'You\'re Protected',
      statusSafeDesc: 'Link Guardian is actively watching over you',
      statusAlert: 'Protection Paused',
      statusAlertDesc: 'Enable protection to stay safe',
      linksChecked: 'Links checked',
      threatsBlocked: 'Threats blocked',
      protectedSince: 'Protected since',
    },
    
    protection: {
      title: 'Protection Settings',
      enabled: 'Protection is active',
      disabled: 'Protection is paused',
      enableProtection: 'Enable Protection',
      disableProtection: 'Pause Protection',
      permissionsNeeded: 'Permissions needed',
      grantPermissions: 'Grant Permissions',
    },
    
    settings: {
      title: 'Settings',
      language: 'Language',
      notifications: 'Notifications',
      notificationsDesc: 'Get alerts when threats are blocked',
      about: 'About Link Guardian',
      help: 'Help & Support',
      privacy: 'Privacy Policy',
      version: 'Version',
    },
    
    permissions: {
      title: 'Permissions Needed',
      description: 'Link Guardian needs these permissions to protect you from harmful links',
      accessibility: 'Accessibility Service',
      accessibilityDesc: 'Allows Link Guardian to detect when you tap on links',
      overlay: 'Display Over Apps',
      overlayDesc: 'Shows a safety check before opening suspicious links',
      notifications: 'Notifications',
      notificationsDesc: 'Alerts you when a threat is blocked',
      grant: 'Grant',
      granted: 'Granted',
      required: 'Required',
    },
    
    errors: {
      generic: 'Something went wrong',
      networkError: 'No internet connection',
      tryAgain: 'Try Again',
      goBack: 'Go Back',
    },
    
    common: {
      enable: 'Enable',
      disable: 'Disable',
      save: 'Save',
      cancel: 'Cancel',
      continue: 'Continue',
      back: 'Back',
      done: 'Done',
      loading: 'Loading...',
    },
  },
  
  // Placeholder for other languages - can be expanded
  es: {} as TranslationKeys,
  pt: {} as TranslationKeys,
  fr: {} as TranslationKeys,
  de: {} as TranslationKeys,
  zh: {} as TranslationKeys,
  hi: {} as TranslationKeys,
  ar: {} as TranslationKeys,
};

// Default to English for missing translations
export const getTranslation = (lang: Language): TranslationKeys => {
  const translation = translations[lang];
  if (!translation || Object.keys(translation).length === 0) {
    return translations.en;
  }
  return translation;
};
