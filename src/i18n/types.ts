export type Language = 'en' | 'id' | 'ms' | 'th' | 'tl' | 'vi' | 'lo' | 'my' | 'km' | 'ja' | 'es' | 'ru' | 'ar' | 'ko' | 'de' | 'pt-br';

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
        protectionActive: string;
        protectionActiveDesc: string;
        protectionInactive: string;
        protectionInactiveDesc: string;
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
        whitelist: string;
        whitelistDesc: string;
    };

    // Whitelist
    whitelist: {
        title: string;
        description: string;
        empty: string;
        emptyDesc: string;
        remove: string;
        removeConfirmTitle: string;
        removeConfirmDesc: string;
        domain: string;
        addSite: string;
        enterUrl: string;
        add: string;
        invalidUrl: string;
        addedDate: string;
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

    // Blocked Link Screen
    blocked: {
        title: string;
        dangerTitle: string;
        dangerDesc: string;
        attemptedUrl: string;
        identifiedAs: string;
        unknownScam: string;
        whyBlocked: string;
        whyBlockedDesc: string;
        whatToDo: string;
        tip1: string;
        tip2: string;
        tip3: string;
        closeButton: string;
        cannotProceed: string;
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
        close: string;
    };
}
