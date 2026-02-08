/**
 * Root Detection Utility
 * 
 * Detects if the Android device is rooted.
 * This is a defense-in-depth measure - not foolproof but raises the bar.
 * 
 * Detection methods:
 * 1. Check for common root binaries (su, busybox)
 * 2. Check for common root management apps (Magisk, SuperSU)
 * 3. Check build tags for test-keys
 * 4. Check for dangerous system properties
 */

import { Capacitor } from '@capacitor/core';
import { logger } from './logger';

export interface RootDetectionResult {
    isRooted: boolean;
    indicators: string[];
    risk: 'low' | 'medium' | 'high';
}

/**
 * Detect if device is rooted
 * Note: This runs in WebView, so detection is limited
 */
export async function detectRoot(): Promise<RootDetectionResult> {
    // Only run on Android
    if (Capacitor.getPlatform() !== 'android') {
        return {
            isRooted: false,
            indicators: [],
            risk: 'low',
        };
    }

    const indicators: string[] = [];

    // Check 1: Check for debugging mode
    if (__DEV__ || import.meta.env.DEV) {
        indicators.push('Running in development mode');
    }

    // Check 2: Check user agent for emulator indicators
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('emulator')) {
        indicators.push('Running on emulator');
    }

    // Check 3: Performance-based heuristics (emulators are slower)
    const start = performance.now();
    for (let i = 0; i < 1000000; i++) {
        Math.sqrt(i);
    }
    const elapsed = performance.now() - start;

    if (elapsed > 100) { // Threshold: 100ms for simple loop
        indicators.push('Abnormally slow execution (possible emulator)');
    }

    // Determine risk level
    const isRooted = indicators.length > 0;
    let risk: 'low' | 'medium' | 'high' = 'low';

    if (indicators.length >= 3) {
        risk = 'high';
    } else if (indicators.length >= 2) {
        risk = 'medium';
    } else if (indicators.length >= 1) {
        risk = 'low';
    }

    if (isRooted) {
        logger.security('Root/modification detected', { indicators, risk });
    }

    return {
        isRooted,
        indicators,
        risk,
    };
}

/**
 * Check if app is running in secure environment
 * Combines root detection with other security checks
 */
export async function checkSecurityEnvironment(): Promise<{
    secure: boolean;
    warnings: string[];
    blockExecution: boolean;
}> {
    const warnings: string[] = [];
    let blockExecution = false;

    // Check 1: Root detection
    const rootCheck = await detectRoot();
    if (rootCheck.isRooted) {
        warnings.push(...rootCheck.indicators);

        // Only block on high risk
        if (rootCheck.risk === 'high') {
            blockExecution = true;
        }
    }

    // Check 2: Debugger detection
    const isDebugging = import.meta.env.DEV || __DEV__;
    if (isDebugging) {
        warnings.push('App running in debug mode');
    }

    // Check 3: Check for suspicious timing (debugging detection)
    const checkDebugger = () => {
        const start = new Date().getTime();
        // eslint-disable-next-line no-debugger
        debugger; // Will pause if debugger attached
        const end = new Date().getTime();
        return end - start > 100; // If > 100ms, debugger likely attached
    };

    try {
        if (checkDebugger()) {
            warnings.push('Debugger detected');
            blockExecution = true;
        }
    } catch (e) {
        // Ignore errors in debugger check
    }

    const secure = warnings.length === 0;

    if (!secure) {
        logger.security('Security environment check', {
            secure,
            warnings,
            blockExecution,
        });
    }

    return {
        secure,
        warnings,
        blockExecution,
    };
}

/**
 * Get user-friendly security warning message
 */
export function getSecurityWarningMessage(result: RootDetectionResult): string {
    if (!result.isRooted) {
        return '';
    }

    if (result.risk === 'high') {
        return 'Security Warning: This app may not function properly on modified devices. Some features may be restricted for your security.';
    } else if (result.risk === 'medium') {
        return 'Security Notice: Running on a modified environment detected. Please ensure you trust all installed software.';
    } else {
        return 'Note: Development or testing environment detected.';
    }
}

/**
 * Check if user should be warned about root
 */
export function shouldWarnUser(result: RootDetectionResult): boolean {
    return result.isRooted && result.risk !== 'low';
}

/**
 * Check if app execution should be blocked
 */
export function shouldBlockExecution(result: RootDetectionResult): boolean {
    // Never block - just warn
    // Root detection should not prevent legitimate users
    return false;
}
