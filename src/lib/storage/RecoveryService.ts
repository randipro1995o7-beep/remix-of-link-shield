/**
 * Recovery Service
 * 
 * Manages recovery options for PIN reset functionality.
 * Stores recovery phone number and email securely.
 */

import { secureStorage } from './CapacitorStorageProvider';

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
     */
    async generateOTP(): Promise<string> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity

        await secureStorage.save(STORAGE_KEYS.PENDING_OTP, otp);
        await secureStorage.save(STORAGE_KEYS.OTP_EXPIRY, expiry.toString());

        return otp;
    },

    /**
     * Verify OTP code
     */
    async verifyOTP(inputOtp: string): Promise<boolean> {
        const storedOtp = await secureStorage.get(STORAGE_KEYS.PENDING_OTP);
        const expiryStr = await secureStorage.get(STORAGE_KEYS.OTP_EXPIRY);

        if (!storedOtp || !expiryStr) return false;

        const expiry = parseInt(expiryStr, 10);
        if (Date.now() > expiry) {
            // OTP expired, clear it
            await this.clearOTP();
            return false;
        }

        return storedOtp === inputOtp;
    },

    /**
     * Clear pending OTP
     */
    async clearOTP(): Promise<void> {
        await secureStorage.remove(STORAGE_KEYS.PENDING_OTP);
        await secureStorage.remove(STORAGE_KEYS.OTP_EXPIRY);
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
