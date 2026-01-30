// Internationalization support for Link Guardian
// Default language: English
// Structure ready for adding more languages

export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'zh' | 'hi' | 'ar';

export interface TranslationKeys {
  // App general
  appName: string;
  tagline: string;
  
  // Navigation - updated terminology
  nav: {
    home: string;
    safety: string;
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
    safetyActiveSince: string;
    testSafety: string;
    testSafetyDesc: string;
    simulateLink: string;
  };
  
  // Safety screen (formerly Protection)
  safety: {
    title: string;
    enabled: string;
    disabled: string;
    enableSafety: string;
    disableSafety: string;
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
    resetSafetyPin: string;
    resetSafetyPinDesc: string;
    safetyHistory: string;
    safetyHistoryDesc: string;
    familyMode: string;
    familyModeDesc: string;
    premium: string;
    premiumDesc: string;
  };
  
  // Permissions
  permissions: {
    title: string;
    description: string;
    linkDetection: string;
    linkDetectionDesc: string;
    safetyScreen: string;
    safetyScreenDesc: string;
    safetyAlerts: string;
    safetyAlertsDesc: string;
    grant: string;
    granted: string;
    required: string;
  };
  
  // Stop screen
  stopScreen: {
    title: string;
    subtitle: string;
    linkDestination: string;
    sharedFrom: string;
    pleaseWait: string;
    second: string;
    seconds: string;
    continueToReview: string;
    skipNotRecommended: string;
  };
  
  // Safety PIN (formerly PIN)
  safetyPin: {
    createTitle: string;
    createSubtitle: string;
    confirmTitle: string;
    confirmSubtitle: string;
    verifyTitle: string;
    verifySubtitle: string;
    mismatchError: string;
    incorrectError: string;
    attemptsRemaining: string;
    tooManyAttempts: string;
    created: string;
    verified: string;
    blocked: string;
  };
  
  // Safety Review
  safetyReview: {
    title: string;
    analyzing: string;
    analyzingDesc: string;
    riskLow: string;
    riskMedium: string;
    riskHigh: string;
    basedOnChecks: string;
    thingsToConsider: string;
    checksPassed: string;
    ourRecommendation: string;
    cancelAndClose: string;
    openAnyway: string;
    disclaimer: string;
  };
  
  // Skip confirmation
  skipConfirmation: {
    title: string;
    description: string;
    consequence1: string;
    consequence2: string;
    consequence3: string;
    goBack: string;
    skipAnyway: string;
  };
  
  // High Risk confirmation
  highRisk: {
    title: string;
    description: string;
    acknowledgment: string;
    cancel: string;
    holdToOpen: string;
    acknowledgeFirst: string;
    holdInstruction: string;
  };
  
  // Safety History
  history: {
    title: string;
    empty: string;
    emptyDesc: string;
    insights: string;
    recentLinks: string;
    from: string;
    dataNotice: string;
    clearTitle: string;
    clearDesc: string;
    clearConfirm: string;
    actions: {
      cancelled: string;
      opened: string;
      blocked: string;
    };
  };
  
  // Family Mode
  familyMode: {
    title: string;
    subtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    infoNotice: string;
    setupButton: string;
    createPinTitle: string;
    createPinDesc: string;
    confirmPinTitle: string;
    confirmPinDesc: string;
    successTitle: string;
    successDesc: string;
    enabled: string;
    blocked: string;
    blockedDesc: string;
    guardianPinTitle: string;
    guardianPinDesc: string;
  };
  
  // Errors
  errors: {
    generic: string;
    genericDesc: string;
    networkError: string;
    securityError: string;
    tryAgain: string;
    goBack: string;
    linkBlocked: string;
    linkBlockedSafety: string;
    storageTitle: string;
    storageDesc: string;
    permissionTitle: string;
    permissionDesc: string;
    analysisTitle: string;
    analysisDesc: string;
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
    show: string;
    hide: string;
  };
}

export const translations: Record<Language, TranslationKeys> = {
  en: {
    appName: 'Link Guardian',
    tagline: 'Stay safe, click smart',
    
    nav: {
      home: 'Home',
      safety: 'Safety',
      settings: 'Settings',
    },
    
    home: {
      statusSafe: 'You\'re Protected',
      statusSafeDesc: 'Link Guardian is actively watching over you',
      statusAlert: 'Safety Paused',
      statusAlertDesc: 'Enable safety to stay protected',
      linksChecked: 'Links checked',
      threatsBlocked: 'Threats blocked',
      safetyActiveSince: 'Safety active since',
      testSafety: 'Test Safety',
      testSafetyDesc: 'Tap below to simulate receiving a suspicious link',
      simulateLink: 'Simulate Suspicious Link',
    },
    
    safety: {
      title: 'Safety Settings',
      enabled: 'Safety is active',
      disabled: 'Safety is paused',
      enableSafety: 'Enable Safety',
      disableSafety: 'Pause Safety',
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
      resetSafetyPin: 'Reset Safety PIN',
      resetSafetyPinDesc: 'Create a new 4-digit Safety PIN',
      safetyHistory: 'Safety History',
      safetyHistoryDesc: 'View your link checking activity',
      familyMode: 'Family Mode',
      familyModeDesc: 'Protect loved ones with Guardian PIN',
      premium: 'Premium Features',
      premiumDesc: 'Extended history, Family Mode & more',
    },
    
    permissions: {
      title: 'Permissions Needed',
      description: 'Link Guardian needs these permissions to keep you safe from harmful links',
      linkDetection: 'Link Detection',
      linkDetectionDesc: 'Allows Link Guardian to notice when you tap on links',
      safetyScreen: 'Safety Screen',
      safetyScreenDesc: 'Shows a safety check before opening unfamiliar links',
      safetyAlerts: 'Safety Alerts',
      safetyAlertsDesc: 'Notifies you when a threat is blocked',
      grant: 'Grant',
      granted: 'Granted',
      required: 'Required',
    },
    
    stopScreen: {
      title: 'Let\'s pause for a moment',
      subtitle: 'You\'re about to open an external link. Take a moment to make sure it\'s safe.',
      linkDestination: 'Link destination:',
      sharedFrom: 'Shared from',
      pleaseWait: 'Please wait',
      second: 'second',
      seconds: 'seconds',
      continueToReview: 'Continue to safety review',
      skipNotRecommended: 'Skip safety check (not recommended)',
    },
    
    safetyPin: {
      createTitle: 'Create Your Safety PIN',
      createSubtitle: 'This helps slow down and think before opening links',
      confirmTitle: 'Confirm Your Safety PIN',
      confirmSubtitle: 'Enter the same 4 digits again',
      verifyTitle: 'Enter Your Safety PIN',
      verifySubtitle: 'Confirm it\'s really you',
      mismatchError: 'PINs don\'t match. Please try again.',
      incorrectError: 'Incorrect Safety PIN.',
      attemptsRemaining: 'attempts remaining',
      tooManyAttempts: 'Too many incorrect attempts',
      created: 'Safety PIN created! Continuing...',
      verified: 'Verified! Opening link...',
      blocked: 'Link blocked for your safety',
    },
    
    safetyReview: {
      title: 'Safety Review',
      analyzing: 'Checking this link...',
      analyzingDesc: 'This only takes a moment',
      riskLow: 'Low Risk',
      riskMedium: 'Medium Risk',
      riskHigh: 'High Risk',
      basedOnChecks: 'Based on our checks',
      thingsToConsider: 'Things to consider',
      checksPassed: 'checks passed',
      ourRecommendation: 'Our recommendation',
      cancelAndClose: 'Cancel & Close Link',
      openAnyway: 'Open Anyway',
      disclaimer: 'Link Guardian helps you make safer choices, but cannot guarantee a website is completely safe. Always be careful with personal information.',
    },
    
    skipConfirmation: {
      title: 'Skip Safety Check?',
      description: 'You\'re about to open this link without checking if it\'s safe.',
      consequence1: 'We won\'t check if the website is trustworthy',
      consequence2: 'You may be at risk of scams or harmful content',
      consequence3: 'Your personal information could be exposed',
      goBack: 'Go Back to Safety Check',
      skipAnyway: 'Skip Anyway',
    },
    
    highRisk: {
      title: 'This Link Needs Extra Care',
      description: 'Our checks found several concerns with this website. Please take a moment to consider before proceeding.',
      acknowledgment: 'I understand this link may not be safe and I choose to continue',
      cancel: 'Cancel & Stay Safe',
      holdToOpen: 'Hold to Open Link',
      acknowledgeFirst: 'Check the box above first',
      holdInstruction: 'Hold the button for 1.5 seconds to open',
    },
    
    history: {
      title: 'Safety History',
      empty: 'No links checked yet',
      emptyDesc: 'Your link checking history will appear here',
      insights: 'Your Safety Insights',
      recentLinks: 'Recent Links',
      from: 'from',
      dataNotice: 'All data stays on your device and can be cleared anytime',
      clearTitle: 'Clear History?',
      clearDesc: 'This will remove all your link checking history. This cannot be undone.',
      clearConfirm: 'Clear All History',
      actions: {
        cancelled: 'Cancelled',
        opened: 'Opened',
        blocked: 'Blocked',
      },
    },
    
    familyMode: {
      title: 'Family Mode',
      subtitle: 'Add extra protection for loved ones on this device',
      feature1Title: 'Guardian PIN',
      feature1Desc: 'A separate PIN that only guardians know, required for high-risk links',
      feature2Title: 'Shared Protection',
      feature2Desc: 'Perfect for children, elderly relatives, or shared devices',
      infoNotice: 'Family Mode adds an extra layer of protection. High-risk links will require the Guardian PIN to open.',
      setupButton: 'Set Up Family Mode',
      createPinTitle: 'Create Guardian PIN',
      createPinDesc: 'Choose a 4-digit PIN that only guardians will know',
      confirmPinTitle: 'Confirm Guardian PIN',
      confirmPinDesc: 'Enter the same 4 digits again',
      successTitle: 'Family Mode Active',
      successDesc: 'High-risk links now require Guardian PIN approval',
      enabled: 'Family Mode enabled',
      blocked: 'Access Blocked',
      blockedDesc: 'Too many incorrect Guardian PIN attempts. Please try again later.',
      guardianPinTitle: 'Guardian Approval Needed',
      guardianPinDesc: 'Enter the Guardian PIN to open this high-risk link',
    },
    
    errors: {
      generic: 'Something went wrong',
      genericDesc: 'We encountered an unexpected issue. For your safety, this link has been blocked.',
      networkError: 'No internet connection',
      securityError: 'Security check failed',
      tryAgain: 'Try Again',
      goBack: 'Go Back',
      linkBlocked: 'Link blocked for your safety',
      linkBlockedSafety: 'For your safety, this link has been blocked. You can try again or go back.',
      storageTitle: 'Unable to Access Storage',
      storageDesc: 'We couldn\'t access secure storage on your device. For your safety, this link has been blocked.',
      permissionTitle: 'Permission Required',
      permissionDesc: 'Link Guardian needs permission to check this link. For your safety, it has been blocked.',
      analysisTitle: 'Unable to Check Link',
      analysisDesc: 'We couldn\'t complete the safety check for this link. For your safety, it has been blocked.',
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
      show: 'Show',
      hide: 'Hide',
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
