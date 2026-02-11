/**
 * Recovery Service
 * 
 * Manages recovery options for PIN reset functionality.
 * Stores recovery phone number and email securely.
 */

import { secureStorage } from './CapacitorStorageProvider';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/utils/logger';
import { logOTPGenerated, logOTPVerified, SecurityEventLogger } from '@/lib/security/SecurityEventLogger';

const STORAGE_KEYS = {
    RECOVERY_PHONE: 'linkguardian_recovery_phone',
    RECOVERY_EMAIL: 'linkguardian_recovery_email',
    PENDING_OTP: 'linkguardian_pending_otp',
    OTP_EXPIRY: 'linkguardian_otp_expiry',
};

export interface RecoveryOptions {
    phone: string | null;
    email: string | null;
}

export const RecoveryService = {
    /**
     * Save recovery phone number
     */
    async saveRecoveryPhone(phone: string): Promise<void> {
        // Basic validation
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) {
            throw new Error('Invalid phone number');
        }
        await secureStorage.save(STORAGE_KEYS.RECOVERY_PHONE, phone);
    },

    /**
     * Save recovery email
     */
    async saveRecoveryEmail(email: string): Promise<void> {
        // Basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email address');
        }
        await secureStorage.save(STORAGE_KEYS.RECOVERY_EMAIL, email);
    },

    /**
     * Get stored recovery options
     */
    async getRecoveryOptions(): Promise<RecoveryOptions> {
        const phone = await secureStorage.get(STORAGE_KEYS.RECOVERY_PHONE);
        const email = await secureStorage.get(STORAGE_KEYS.RECOVERY_EMAIL);
        return { phone, email };
    },

    /**
     * Helper to get raw email for sending OTP
     */
    async getRecoveryEmail(): Promise<string | null> {
        return await secureStorage.get(STORAGE_KEYS.RECOVERY_EMAIL);
    },

    /**
     * Check if any recovery option is set up
     */
    async hasRecoverySetup(): Promise<boolean> {
        const { phone, email } = await this.getRecoveryOptions();
        return Boolean(phone || email);
    },

    /**
     * Get masked phone for display (e.g., +62***1234)
     */
    async getMaskedPhone(): Promise<string | null> {
        const phone = await secureStorage.get(STORAGE_KEYS.RECOVERY_PHONE);
        if (!phone) return null;

        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 4) return '****';

        const lastFour = cleaned.slice(-4);
        const prefix = cleaned.slice(0, 3);
        return `${prefix}****${lastFour}`;
    },

    /**
     * Get masked email for display (e.g., r***@gmail.com)
     */
    async getMaskedEmail(): Promise<string | null> {
        const email = await secureStorage.get(STORAGE_KEYS.RECOVERY_EMAIL);
        if (!email) return null;

        const [localPart, domain] = email.split('@');
        if (!domain) return '****';

        const maskedLocal = localPart.charAt(0) + '***';
        return `${maskedLocal}@${domain}`;
    },

    /**
     * Generate and store OTP code (6 digits)
     * Returns the OTP for sending via SMS/Email
     * 
     * SECURITY: OTP is hashed before storage using bcrypt
     */
    async generateOTP(): Promise<string> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity

        // Hash OTP before storing (10 rounds = ~100ms on modern devices)
        const hashedOtp = await bcrypt.hash(otp, 10);

        await secureStorage.save(STORAGE_KEYS.PENDING_OTP, hashedOtp);
        await secureStorage.save(STORAGE_KEYS.OTP_EXPIRY, expiry.toString());

        logger.security('OTP generated', { expiresIn: '5 minutes' });

        // Log to security event logger
        await logOTPGenerated({ expiryDuration: '5 minutes' });

        return otp;
    },

    /**
     * Verify OTP code
     * 
     * SECURITY: Uses bcrypt.compare for timing-attack resistant comparison
     */
    async verifyOTP(inputOtp: string): Promise<boolean> {
        try {
            const hashedOtp = await secureStorage.get(STORAGE_KEYS.PENDING_OTP);
            const expiryStr = await secureStorage.get(STORAGE_KEYS.OTP_EXPIRY);

            if (!hashedOtp || !expiryStr) {
                logger.security('OTP verification failed - no pending OTP');
                return false;
            }

            const expiry = parseInt(expiryStr, 10);
            if (Date.now() > expiry) {
                // OTP expired, clear it
                await this.clearOTP();
                logger.security('OTP verification failed - expired');

                // Log expiration
                await SecurityEventLogger.logEvent('otp_expired', 'OTP code expired');

                return false;
            }

            // Use bcrypt to compare (prevents timing attacks)
            const isValid = await bcrypt.compare(inputOtp, hashedOtp);

            if (isValid) {
                logger.security('OTP verified successfully');
                // Clear OTP after successful verification
                await this.clearOTP();

                // Log successful verification
                await logOTPVerified();
            } else {
                logger.security('OTP verification failed - incorrect code');

                // Log failed verification
                await SecurityEventLogger.logEvent('otp_failed', 'OTP verification failed');
            }

            return isValid;
        } catch (error) {
            logger.error('OTP verification error', error);
            return false;
        }
    },

    /**
     * Clear pending OTP
     */
    async clearOTP(): Promise<void> {
        await secureStorage.remove(STORAGE_KEYS.PENDING_OTP);
        await secureStorage.remove(STORAGE_KEYS.OTP_EXPIRY);
    },

    /**
     * Format phone number to E.164 for Firebase Auth
     * e.g., 08123456789 → +628123456789
     */
    formatPhoneToE164(phone: string): string {
        let cleaned = phone.replace(/[^\d+]/g, '');

        if (cleaned.startsWith('0')) {
            cleaned = '+62' + cleaned.substring(1);
        } else if (cleaned.startsWith('62')) {
            cleaned = '+' + cleaned;
        } else if (!cleaned.startsWith('+')) {
            cleaned = '+62' + cleaned;
        }

        return cleaned;
    },

    /**
     * Clear all recovery data
     */
    async clearAll(): Promise<void> {
        await secureStorage.remove(STORAGE_KEYS.RECOVERY_PHONE);
        await secureStorage.remove(STORAGE_KEYS.RECOVERY_EMAIL);
        await this.clearOTP();
    },
};
