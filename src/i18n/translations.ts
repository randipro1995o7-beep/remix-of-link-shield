// Internationalization support for Link Guardian
// Default language: English
// Structure ready for adding more languages

export type Language = 'en' | 'id' | 'es' | 'pt' | 'fr' | 'de' | 'zh' | 'hi' | 'ar';

export interface TranslationKeys {
  // App general
  appName: string;
  tagline: string;
  
  // Navigation
  nav: {
    home: string;
    safety: string;
    settings: string;
  };
  
  // Home screen
  home: {
    statusActive: string;
    statusActiveDesc: string;
    statusPaused: string;
    statusPausedDesc: string;
    linksChecked: string;
    threatsBlocked: string;
    safetyActiveSince: string;
    testSafety: string;
    testSafetyDesc: string;
    simulateLink: string;
  };
  
  // Safety screen
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
    deniedTitle: string;
    deniedDesc: string;
    whatWeDoNot: string;
    doesNotSpy: string;
    doesNotCollect: string;
    doesNotShare: string;
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
  
  // Safety PIN
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
    purpose: string;
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
    holdProgress: string;
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
  
  // Privacy & About
  privacy: {
    title: string;
    intro: string;
    localOnly: string;
    localOnlyDesc: string;
    noUpload: string;
    noUploadDesc: string;
    noTracking: string;
    noTrackingDesc: string;
    clearableData: string;
    clearableDataDesc: string;
    lastUpdated: string;
  };
  
  about: {
    title: string;
    description: string;
    mission: string;
    missionDesc: string;
    honestClaim: string;
    notAntivirus: string;
    notGuarantee: string;
    assistsOnly: string;
    version: string;
    madeWith: string;
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

// English translations - 100% complete
const englishTranslations: TranslationKeys = {
  appName: 'Link Guardian',
  tagline: 'Pause, think, then click',
  
  nav: {
    home: 'Home',
    safety: 'Safety',
    settings: 'Settings',
  },
  
  home: {
    statusActive: 'Safety Steps Active',
    statusActiveDesc: 'Link Guardian adds a pause before opening links',
    statusPaused: 'Safety Steps Paused',
    statusPausedDesc: 'Enable safety to add a thoughtful pause before clicking',
    linksChecked: 'Links reviewed',
    threatsBlocked: 'Links cancelled',
    safetyActiveSince: 'Active since',
    testSafety: 'Try It Out',
    testSafetyDesc: 'Tap below to see what happens when you receive a link',
    simulateLink: 'See Safety Flow Demo',
  },
  
  safety: {
    title: 'Safety Settings',
    enabled: 'Safety steps are on',
    disabled: 'Safety steps are off',
    enableSafety: 'Turn On Safety Steps',
    disableSafety: 'Pause Safety Steps',
    permissionsNeeded: 'We need some permissions first',
    grantPermissions: 'Grant Permissions',
  },
  
  settings: {
    title: 'Settings',
    language: 'Language',
    notifications: 'Notifications',
    notificationsDesc: 'Get gentle reminders about your link activity',
    about: 'About Link Guardian',
    help: 'Help & Support',
    privacy: 'Privacy Policy',
    version: 'Version',
    resetSafetyPin: 'Change Safety PIN',
    resetSafetyPinDesc: 'Create a new 4-digit Safety PIN',
    safetyHistory: 'Safety History',
    safetyHistoryDesc: 'See your link review activity',
    familyMode: 'Family Mode',
    familyModeDesc: 'Add extra steps for shared devices',
    premium: 'Premium Features',
    premiumDesc: 'Extended history, Family Mode & more',
  },
  
  permissions: {
    title: 'Permissions Needed',
    description: 'Link Guardian needs these to add a safety pause before you open links',
    linkDetection: 'Link Detection',
    linkDetectionDesc: 'Lets us notice when you tap on a link',
    safetyScreen: 'Safety Screen',
    safetyScreenDesc: 'Shows a helpful pause before visiting websites',
    safetyAlerts: 'Safety Alerts',
    safetyAlertsDesc: 'Gentle reminders about your link activity',
    grant: 'Allow',
    granted: 'Allowed',
    required: 'Required',
    deniedTitle: 'Permission Not Granted',
    deniedDesc: 'Without this permission, Link Guardian cannot help you pause before opening links. You can enable it in your phone settings.',
    whatWeDoNot: 'What we do NOT do:',
    doesNotSpy: 'We do not spy on your browsing',
    doesNotCollect: 'We do not collect your personal data',
    doesNotShare: 'We do not share anything with third parties',
  },
  
  stopScreen: {
    title: 'Let\'s pause for a moment',
    subtitle: 'You\'re about to open an external link. Taking a moment can help you decide if it\'s right for you.',
    linkDestination: 'Link going to:',
    sharedFrom: 'Shared from',
    pleaseWait: 'Please wait',
    second: 'second',
    seconds: 'seconds',
    continueToReview: 'Continue to Review',
    skipNotRecommended: 'Skip this step (not recommended)',
  },
  
  safetyPin: {
    createTitle: 'Create Your Safety PIN',
    createSubtitle: 'This adds a helpful pause when opening links',
    confirmTitle: 'Confirm Your Safety PIN',
    confirmSubtitle: 'Enter the same 4 digits again',
    verifyTitle: 'Enter Your Safety PIN',
    verifySubtitle: 'Taking a moment to think',
    mismatchError: 'PINs don\'t match. Please try again.',
    incorrectError: 'That\'s not quite right.',
    attemptsRemaining: 'attempts remaining',
    tooManyAttempts: 'Too many attempts. Link has been cancelled.',
    created: 'Safety PIN set! Continuing...',
    verified: 'Great! Let\'s review this link...',
    blocked: 'Link cancelled for now',
    purpose: 'The Safety PIN helps you slow down and think before clicking unfamiliar links.',
  },
  
  safetyReview: {
    title: 'Link Review',
    analyzing: 'Looking at this link...',
    analyzingDesc: 'This only takes a moment',
    riskLow: 'Looks Familiar',
    riskMedium: 'Worth Checking',
    riskHigh: 'Needs Attention',
    basedOnChecks: 'Based on our review',
    thingsToConsider: 'Things to consider',
    checksPassed: 'things look okay',
    ourRecommendation: 'Our suggestion',
    cancelAndClose: 'Cancel & Close Link',
    openAnyway: 'Open Anyway',
    disclaimer: 'Link Guardian helps you pause and think, but cannot guarantee any website is completely safe. Always be thoughtful with personal information.',
  },
  
  skipConfirmation: {
    title: 'Skip Review Step?',
    description: 'You\'re choosing to open this link without our review.',
    consequence1: 'We won\'t have a chance to show you any concerns',
    consequence2: 'You might miss helpful information about this link',
    consequence3: 'Consider whether you trust where this came from',
    goBack: 'Go Back to Review',
    skipAnyway: 'Skip Anyway',
  },
  
  highRisk: {
    title: 'This Link Needs Your Attention',
    description: 'We noticed some things that might be worth knowing about. Take a moment before deciding.',
    acknowledgment: 'I\'ve thought about this and want to continue',
    cancel: 'Cancel & Stay Here',
    holdToOpen: 'Hold to Open Link',
    acknowledgeFirst: 'Please check the box above first',
    holdInstruction: 'Press and hold for 1.5 seconds',
    holdProgress: 'Keep holding...',
  },
  
  history: {
    title: 'Your Link History',
    empty: 'No links reviewed yet',
    emptyDesc: 'Your link activity will appear here',
    insights: 'Patterns We Noticed',
    recentLinks: 'Recent Links',
    from: 'from',
    dataNotice: 'All this stays on your phone. You can clear it anytime.',
    clearTitle: 'Clear History?',
    clearDesc: 'This will remove all your link history from this device. This cannot be undone.',
    clearConfirm: 'Clear All History',
    actions: {
      cancelled: 'Cancelled',
      opened: 'Opened',
      blocked: 'Blocked',
    },
  },
  
  familyMode: {
    title: 'Family Mode',
    subtitle: 'Add an extra step for links that need attention',
    feature1Title: 'Guardian PIN',
    feature1Desc: 'A separate PIN that only trusted adults know',
    feature2Title: 'Shared Device Safety',
    feature2Desc: 'Helpful for children, elderly family, or shared devices',
    infoNotice: 'When enabled, links that need attention will require the Guardian PIN before opening.',
    setupButton: 'Set Up Family Mode',
    createPinTitle: 'Create Guardian PIN',
    createPinDesc: 'Choose a 4-digit PIN that only trusted adults will know',
    confirmPinTitle: 'Confirm Guardian PIN',
    confirmPinDesc: 'Enter the same 4 digits again',
    successTitle: 'Family Mode is Ready',
    successDesc: 'Links that need attention now require Guardian approval',
    enabled: 'Family Mode is on',
    blocked: 'Access Paused',
    blockedDesc: 'Too many incorrect attempts. Please try again later.',
    guardianPinTitle: 'Guardian Approval Needed',
    guardianPinDesc: 'A trusted adult needs to enter the Guardian PIN',
  },
  
  privacy: {
    title: 'Privacy Policy',
    intro: 'Link Guardian is designed with your privacy as a priority.',
    localOnly: 'Everything Stays on Your Device',
    localOnlyDesc: 'All link analysis happens right on your phone. Nothing is sent to any server.',
    noUpload: 'No Data Upload',
    noUploadDesc: 'The links you check, your Safety PIN, and your history never leave your device.',
    noTracking: 'No Tracking or Analytics',
    noTrackingDesc: 'We don\'t track who you are or what you do. There are no hidden analytics.',
    clearableData: 'You Control Your Data',
    clearableDataDesc: 'Clear your history anytime from Settings. Uninstalling the app removes everything.',
    lastUpdated: 'Last updated',
  },
  
  about: {
    title: 'About Link Guardian',
    description: 'A simple tool that adds a thoughtful pause before opening links.',
    mission: 'Why We Made This',
    missionDesc: 'In a world of quick taps and instant actions, we believe taking a moment to think can make a difference. Link Guardian isn\'t about blocking or scaring — it\'s about helping you pause.',
    honestClaim: 'Being Honest With You',
    notAntivirus: 'This is not antivirus software',
    notGuarantee: 'We cannot guarantee any website is safe',
    assistsOnly: 'We only help you slow down and consider',
    version: 'Version',
    madeWith: 'Made with care for everyday people',
  },
  
  errors: {
    generic: 'Something didn\'t work',
    genericDesc: 'We couldn\'t complete this action. To be safe, the link has been cancelled.',
    networkError: 'No internet connection',
    securityError: 'Something went wrong',
    tryAgain: 'Try Again',
    goBack: 'Go Back',
    linkBlocked: 'Link cancelled',
    linkBlockedSafety: 'To be safe, this link has been cancelled. You can try again or go back.',
    storageTitle: 'Storage Issue',
    storageDesc: 'We couldn\'t save your settings. To be safe, this link has been cancelled.',
    permissionTitle: 'Permission Needed',
    permissionDesc: 'Link Guardian needs permission to help you. To be safe, this link has been cancelled.',
    analysisTitle: 'Couldn\'t Review Link',
    analysisDesc: 'We couldn\'t check this link. To be safe, it has been cancelled.',
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
};

// Indonesian translations - 100% complete
const indonesianTranslations: TranslationKeys = {
  appName: 'Link Guardian',
  tagline: 'Berhenti, pikir, baru klik',
  
  nav: {
    home: 'Beranda',
    safety: 'Keamanan',
    settings: 'Pengaturan',
  },
  
  home: {
    statusActive: 'Langkah Keamanan Aktif',
    statusActiveDesc: 'Link Guardian menambahkan jeda sebelum membuka tautan',
    statusPaused: 'Langkah Keamanan Dijeda',
    statusPausedDesc: 'Aktifkan keamanan untuk menambah jeda sebelum mengklik',
    linksChecked: 'Tautan ditinjau',
    threatsBlocked: 'Tautan dibatalkan',
    safetyActiveSince: 'Aktif sejak',
    testSafety: 'Coba Sekarang',
    testSafetyDesc: 'Ketuk di bawah untuk melihat apa yang terjadi saat Anda menerima tautan',
    simulateLink: 'Lihat Demo Keamanan',
  },
  
  safety: {
    title: 'Pengaturan Keamanan',
    enabled: 'Langkah keamanan aktif',
    disabled: 'Langkah keamanan nonaktif',
    enableSafety: 'Aktifkan Langkah Keamanan',
    disableSafety: 'Jeda Langkah Keamanan',
    permissionsNeeded: 'Kami perlu beberapa izin dulu',
    grantPermissions: 'Berikan Izin',
  },
  
  settings: {
    title: 'Pengaturan',
    language: 'Bahasa',
    notifications: 'Notifikasi',
    notificationsDesc: 'Dapatkan pengingat lembut tentang aktivitas tautan Anda',
    about: 'Tentang Link Guardian',
    help: 'Bantuan & Dukungan',
    privacy: 'Kebijakan Privasi',
    version: 'Versi',
    resetSafetyPin: 'Ubah PIN Keamanan',
    resetSafetyPinDesc: 'Buat PIN Keamanan 4 digit baru',
    safetyHistory: 'Riwayat Keamanan',
    safetyHistoryDesc: 'Lihat aktivitas peninjauan tautan Anda',
    familyMode: 'Mode Keluarga',
    familyModeDesc: 'Tambahkan langkah ekstra untuk perangkat bersama',
    premium: 'Fitur Premium',
    premiumDesc: 'Riwayat lengkap, Mode Keluarga & lainnya',
  },
  
  permissions: {
    title: 'Izin Diperlukan',
    description: 'Link Guardian memerlukan ini untuk menambahkan jeda keamanan sebelum Anda membuka tautan',
    linkDetection: 'Deteksi Tautan',
    linkDetectionDesc: 'Memungkinkan kami mengetahui saat Anda mengetuk tautan',
    safetyScreen: 'Layar Keamanan',
    safetyScreenDesc: 'Menampilkan jeda yang membantu sebelum mengunjungi situs web',
    safetyAlerts: 'Peringatan Keamanan',
    safetyAlertsDesc: 'Pengingat lembut tentang aktivitas tautan Anda',
    grant: 'Izinkan',
    granted: 'Diizinkan',
    required: 'Diperlukan',
    deniedTitle: 'Izin Tidak Diberikan',
    deniedDesc: 'Tanpa izin ini, Link Guardian tidak dapat membantu Anda berhenti sebelum membuka tautan. Anda dapat mengaktifkannya di pengaturan telepon.',
    whatWeDoNot: 'Yang TIDAK kami lakukan:',
    doesNotSpy: 'Kami tidak memata-matai penelusuran Anda',
    doesNotCollect: 'Kami tidak mengumpulkan data pribadi Anda',
    doesNotShare: 'Kami tidak berbagi apapun dengan pihak ketiga',
  },
  
  stopScreen: {
    title: 'Mari berhenti sebentar',
    subtitle: 'Anda akan membuka tautan eksternal. Berhenti sejenak dapat membantu Anda memutuskan apakah ini tepat untuk Anda.',
    linkDestination: 'Tautan menuju:',
    sharedFrom: 'Dibagikan dari',
    pleaseWait: 'Mohon tunggu',
    second: 'detik',
    seconds: 'detik',
    continueToReview: 'Lanjutkan ke Tinjauan',
    skipNotRecommended: 'Lewati langkah ini (tidak disarankan)',
  },
  
  safetyPin: {
    createTitle: 'Buat PIN Keamanan Anda',
    createSubtitle: 'Ini menambahkan jeda yang membantu saat membuka tautan',
    confirmTitle: 'Konfirmasi PIN Keamanan Anda',
    confirmSubtitle: 'Masukkan 4 digit yang sama lagi',
    verifyTitle: 'Masukkan PIN Keamanan Anda',
    verifySubtitle: 'Mengambil waktu untuk berpikir',
    mismatchError: 'PIN tidak cocok. Silakan coba lagi.',
    incorrectError: 'Itu tidak tepat.',
    attemptsRemaining: 'percobaan tersisa',
    tooManyAttempts: 'Terlalu banyak percobaan. Tautan telah dibatalkan.',
    created: 'PIN Keamanan ditetapkan! Melanjutkan...',
    verified: 'Bagus! Mari tinjau tautan ini...',
    blocked: 'Tautan dibatalkan untuk saat ini',
    purpose: 'PIN Keamanan membantu Anda memperlambat dan berpikir sebelum mengklik tautan yang tidak dikenal.',
  },
  
  safetyReview: {
    title: 'Tinjauan Tautan',
    analyzing: 'Melihat tautan ini...',
    analyzingDesc: 'Ini hanya sebentar',
    riskLow: 'Terlihat Familiar',
    riskMedium: 'Perlu Dicek',
    riskHigh: 'Perlu Perhatian',
    basedOnChecks: 'Berdasarkan tinjauan kami',
    thingsToConsider: 'Hal yang perlu dipertimbangkan',
    checksPassed: 'hal terlihat baik',
    ourRecommendation: 'Saran kami',
    cancelAndClose: 'Batalkan & Tutup Tautan',
    openAnyway: 'Buka Tetap',
    disclaimer: 'Link Guardian membantu Anda berhenti dan berpikir, tetapi tidak dapat menjamin situs web mana pun sepenuhnya aman. Selalu berhati-hati dengan informasi pribadi.',
  },
  
  skipConfirmation: {
    title: 'Lewati Langkah Tinjauan?',
    description: 'Anda memilih untuk membuka tautan ini tanpa tinjauan kami.',
    consequence1: 'Kami tidak akan punya kesempatan untuk menunjukkan kekhawatiran',
    consequence2: 'Anda mungkin melewatkan informasi berguna tentang tautan ini',
    consequence3: 'Pertimbangkan apakah Anda mempercayai dari mana ini berasal',
    goBack: 'Kembali ke Tinjauan',
    skipAnyway: 'Lewati Tetap',
  },
  
  highRisk: {
    title: 'Tautan Ini Perlu Perhatian Anda',
    description: 'Kami melihat beberapa hal yang mungkin perlu Anda ketahui. Luangkan waktu sebelum memutuskan.',
    acknowledgment: 'Saya sudah memikirkan ini dan ingin melanjutkan',
    cancel: 'Batalkan & Tetap Di Sini',
    holdToOpen: 'Tahan untuk Membuka Tautan',
    acknowledgeFirst: 'Silakan centang kotak di atas terlebih dahulu',
    holdInstruction: 'Tekan dan tahan selama 1,5 detik',
    holdProgress: 'Terus tahan...',
  },
  
  history: {
    title: 'Riwayat Tautan Anda',
    empty: 'Belum ada tautan yang ditinjau',
    emptyDesc: 'Aktivitas tautan Anda akan muncul di sini',
    insights: 'Pola yang Kami Perhatikan',
    recentLinks: 'Tautan Terbaru',
    from: 'dari',
    dataNotice: 'Semua ini tetap di telepon Anda. Anda dapat menghapusnya kapan saja.',
    clearTitle: 'Hapus Riwayat?',
    clearDesc: 'Ini akan menghapus semua riwayat tautan Anda dari perangkat ini. Ini tidak dapat dibatalkan.',
    clearConfirm: 'Hapus Semua Riwayat',
    actions: {
      cancelled: 'Dibatalkan',
      opened: 'Dibuka',
      blocked: 'Diblokir',
    },
  },
  
  familyMode: {
    title: 'Mode Keluarga',
    subtitle: 'Tambahkan langkah ekstra untuk tautan yang perlu perhatian',
    feature1Title: 'PIN Wali',
    feature1Desc: 'PIN terpisah yang hanya diketahui orang dewasa terpercaya',
    feature2Title: 'Keamanan Perangkat Bersama',
    feature2Desc: 'Berguna untuk anak-anak, keluarga lansia, atau perangkat bersama',
    infoNotice: 'Saat diaktifkan, tautan yang perlu perhatian akan memerlukan PIN Wali sebelum dibuka.',
    setupButton: 'Siapkan Mode Keluarga',
    createPinTitle: 'Buat PIN Wali',
    createPinDesc: 'Pilih PIN 4 digit yang hanya diketahui orang dewasa terpercaya',
    confirmPinTitle: 'Konfirmasi PIN Wali',
    confirmPinDesc: 'Masukkan 4 digit yang sama lagi',
    successTitle: 'Mode Keluarga Siap',
    successDesc: 'Tautan yang perlu perhatian sekarang memerlukan persetujuan Wali',
    enabled: 'Mode Keluarga aktif',
    blocked: 'Akses Dijeda',
    blockedDesc: 'Terlalu banyak percobaan salah. Silakan coba lagi nanti.',
    guardianPinTitle: 'Persetujuan Wali Diperlukan',
    guardianPinDesc: 'Orang dewasa terpercaya perlu memasukkan PIN Wali',
  },
  
  privacy: {
    title: 'Kebijakan Privasi',
    intro: 'Link Guardian dirancang dengan privasi Anda sebagai prioritas.',
    localOnly: 'Semua Tetap di Perangkat Anda',
    localOnlyDesc: 'Semua analisis tautan terjadi langsung di telepon Anda. Tidak ada yang dikirim ke server mana pun.',
    noUpload: 'Tidak Ada Unggahan Data',
    noUploadDesc: 'Tautan yang Anda periksa, PIN Keamanan Anda, dan riwayat Anda tidak pernah meninggalkan perangkat Anda.',
    noTracking: 'Tidak Ada Pelacakan atau Analitik',
    noTrackingDesc: 'Kami tidak melacak siapa Anda atau apa yang Anda lakukan. Tidak ada analitik tersembunyi.',
    clearableData: 'Anda Mengontrol Data Anda',
    clearableDataDesc: 'Hapus riwayat Anda kapan saja dari Pengaturan. Menghapus aplikasi akan menghapus semuanya.',
    lastUpdated: 'Terakhir diperbarui',
  },
  
  about: {
    title: 'Tentang Link Guardian',
    description: 'Alat sederhana yang menambahkan jeda sebelum membuka tautan.',
    mission: 'Mengapa Kami Membuat Ini',
    missionDesc: 'Di dunia yang serba cepat dan instan, kami percaya meluangkan waktu untuk berpikir bisa membuat perbedaan. Link Guardian bukan tentang memblokir atau menakuti — ini tentang membantu Anda berhenti sejenak.',
    honestClaim: 'Jujur Kepada Anda',
    notAntivirus: 'Ini bukan perangkat lunak antivirus',
    notGuarantee: 'Kami tidak dapat menjamin situs web mana pun aman',
    assistsOnly: 'Kami hanya membantu Anda memperlambat dan mempertimbangkan',
    version: 'Versi',
    madeWith: 'Dibuat dengan perhatian untuk orang biasa',
  },
  
  errors: {
    generic: 'Sesuatu tidak berfungsi',
    genericDesc: 'Kami tidak dapat menyelesaikan tindakan ini. Untuk keamanan, tautan telah dibatalkan.',
    networkError: 'Tidak ada koneksi internet',
    securityError: 'Sesuatu tidak berjalan dengan baik',
    tryAgain: 'Coba Lagi',
    goBack: 'Kembali',
    linkBlocked: 'Tautan dibatalkan',
    linkBlockedSafety: 'Untuk keamanan, tautan ini telah dibatalkan. Anda dapat mencoba lagi atau kembali.',
    storageTitle: 'Masalah Penyimpanan',
    storageDesc: 'Kami tidak dapat menyimpan pengaturan Anda. Untuk keamanan, tautan ini telah dibatalkan.',
    permissionTitle: 'Izin Diperlukan',
    permissionDesc: 'Link Guardian memerlukan izin untuk membantu Anda. Untuk keamanan, tautan ini telah dibatalkan.',
    analysisTitle: 'Tidak Dapat Meninjau Tautan',
    analysisDesc: 'Kami tidak dapat memeriksa tautan ini. Untuk keamanan, tautan telah dibatalkan.',
  },
  
  common: {
    enable: 'Aktifkan',
    disable: 'Nonaktifkan',
    save: 'Simpan',
    cancel: 'Batal',
    continue: 'Lanjutkan',
    back: 'Kembali',
    done: 'Selesai',
    loading: 'Memuat...',
    show: 'Tampilkan',
    hide: 'Sembunyikan',
  },
};

export const translations: Record<Language, TranslationKeys> = {
  en: englishTranslations,
  id: indonesianTranslations,
  // Placeholder for other languages - fall back to English
  es: englishTranslations,
  pt: englishTranslations,
  fr: englishTranslations,
  de: englishTranslations,
  zh: englishTranslations,
  hi: englishTranslations,
  ar: englishTranslations,
};

// Default to English for missing translations
export const getTranslation = (lang: Language): TranslationKeys => {
  const translation = translations[lang];
  if (!translation || Object.keys(translation).length === 0) {
    return translations.en;
  }
  return translation;
};
