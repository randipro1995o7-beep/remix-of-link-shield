/**
 * Biometric Authentication Service
 * 
 * Provides fingerprint/face unlock capability as convenience layer for PIN.
 * Uses @aparajita/capacitor-biometric-auth package.
 * 
 * Security Model:
 * - Biometric is CONVENIENCE only, NOT replacement for PIN
 * - PIN remains the master credential
 * - Biometric just unlocks access without typing PIN
 * - User can always fall back to PIN
 */

import { BiometricAuth, BiometryType, BiometryErrorType, CheckBiometryResult, AuthenticateOptions, AndroidBiometryStrength } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';
import { logger } from './logger';
import { SecurityEventLogger } from '@/lib/security/SecurityEventLogger';

export interface BiometricCapability {
    isAvailable: boolean;
    biometryType?: string;
    reason?: string;
}

export interface BiometricAuthResult {
    success: boolean;
    error?: string;
    fallbackToPin?: boolean;
}

/**
 * Check if biometric authentication is available on device
 */
export async function checkBiometricAvailability(): Promise<BiometricCapability> {
    // Only available on native platforms
    if (!Capacitor.isNativePlatform()) {
        return {
            isAvailable: false,
            reason: 'Biometric auth only available on native platforms',
        };
    }

    try {
        const result: CheckBiometryResult = await BiometricAuth.checkBiometry();

        if (result.isAvailable) {
            logger.info('Biometric authentication available', {
                type: result.biometryType,
                strongAvailable: result.strongBiometryIsAvailable,
            });

            return {
                isAvailable: true,
                biometryType: getBiometryTypeName(result.biometryType),
            };
        } else {
            logger.info('Biometric authentication not available', {
                reason: result.reason || result.code || 'Unknown',
            });

            return {
                isAvailable: false,
                reason: result.reason || 'Biometric hardware not available',
            };
        }
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Failed to check biometric availability', err);
        return {
            isAvailable: false,
            reason: err?.message || 'Error checking biometric hardware',
        };
    }
}

/**
 * Authenticate user with biometrics
 * 
 * @param reason - Reason shown to user (e.g., "Unlock Link Shield")
 * @returns Authentication result
 */
export async function authenticateWithBiometric(
    reason: string = 'Verify your identity'
): Promise<BiometricAuthResult> {
    try {
        // Check availability first
        const capability = await checkBiometricAvailability();

        if (!capability.isAvailable) {
            return {
                success: false,
                error: capability.reason,
                fallbackToPin: true,
            };
        }

        // Attempt authentication
        const options: AuthenticateOptions = {
            reason,
            cancelTitle: 'Cancel',
            iosFallbackTitle: 'Use PIN',
            androidTitle: 'Verify Identity',
            androidSubtitle: reason,
            androidConfirmationRequired: false,
            allowDeviceCredential: true, // Allow fallback to device credential (PIN/Pattern) for better UX
            androidBiometryStrength: AndroidBiometryStrength.strong,
        };

        await BiometricAuth.authenticate(options);

        // Success (if no error thrown)
        logger.security('Biometric authentication successful');
        await SecurityEventLogger.logEvent('auth_success', 'Biometric authentication successful', {
            method: 'biometric',
        });

        return {
            success: true,
        };
    } catch (error: unknown) {
        const err = error as any;
        const errorCode = err?.code;

        logger.error('Biometric authentication error', { code: errorCode, message: err?.message });

        // Handle specific error codes
        if (errorCode === BiometryErrorType.userCancel || errorCode === BiometryErrorType.appCancel || errorCode === BiometryErrorType.systemCancel) {
            return {
                success: false,
                error: 'Authentication cancelled',
                fallbackToPin: true,
            };
        }

        if (errorCode === BiometryErrorType.biometryLockout) {
            await SecurityEventLogger.logEvent('security_warning', 'Biometric lockout - too many failed attempts');
            return {
                success: false,
                error: 'Too many failed attempts. Biometric authentication locked.',
                fallbackToPin: true,
            };
        }

        if (errorCode === BiometryErrorType.biometryNotAvailable || errorCode === BiometryErrorType.biometryNotEnrolled) {
            return {
                success: false,
                error: 'Biometric authentication not available',
                fallbackToPin: true,
            };
        }

        if (errorCode === BiometryErrorType.authenticationFailed) {
            await SecurityEventLogger.logEvent('auth_failure', 'Biometric authentication failed', {
                method: 'biometric',
            });
            return {
                success: false,
                error: 'Biometric not recognized',
                fallbackToPin: true,
            };
        }

        if (errorCode === BiometryErrorType.userFallback) {
            return {
                success: false,
                error: 'User requested fallback',
                fallbackToPin: true,
            };
        }

        await SecurityEventLogger.logEvent('auth_failure', 'Biometric authentication error', {
            method: 'biometric',
            error: err?.message,
        });

        return {
            success: false,
            error: err?.message || 'Authentication error',
            fallbackToPin: true,
        };
    }
}

/**
 * Get human-readable biometry type name
 */
export function getBiometryTypeName(type?: BiometryType): string {
    if (type === undefined || type === BiometryType.none) return 'Biometric';

    switch (type) {
        case BiometryType.touchId:
            return 'Touch ID';
        case BiometryType.faceId:
            return 'Face ID';
        case BiometryType.fingerprintAuthentication:
            return 'Fingerprint';
        case BiometryType.faceAuthentication:
            return 'Face Recognition';
        case BiometryType.irisAuthentication:
            return 'Iris Recognition';
        default:
            return 'Biometric';
    }
}

/**
 * Biometric Service - main export
 */
export const BiometricService = {
    /**
     * Check if biometric authentication is available
     */
    checkAvailability: checkBiometricAvailability,

    /**
     * Authenticate with biometrics
     */
    authenticate: authenticateWithBiometric,

    /**
     * Get biometry type name for UI display
     */
    getBiometryTypeName,
};
