import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/config/firebase';
import { logger } from '@/lib/utils/logger';
import { SecurityEventLogger } from '@/lib/security/SecurityEventLogger';

/**
 * Phone Auth Service using Firebase Authentication
 * 
 * Uses Firebase Phone Authentication to send real SMS OTP codes
 * and verify them natively. The Capacitor Firebase Auth plugin
 * uses a listener-based pattern:
 * 
 * 1. Call signInWithPhoneNumber() → returns void
 * 2. Listen for phoneCodeSent → get verificationId
 * 3. Listen for phoneVerificationFailed → handle errors
 * 4. Listen for phoneVerificationCompleted → auto-verified (optional)
 * 5. Call confirmVerificationCode(verificationId, code) → verify manually
 * 
 * Requirements:
 * - Firebase project with Phone Auth enabled
 * - SHA-1/SHA-256 fingerprints registered in Firebase Console
 * - google-services.json in android/app/
 */

// Ensure Firebase is initialized
if (getApps().length === 0) {
    initializeApp(firebaseConfig);
}

// Store the verification ID from Firebase for later confirmation
let currentVerificationId: string | null = null;

export const PhoneAuthService = {
    /**
     * Convert Indonesian phone number to E.164 format
     * e.g., 08123456789 → +628123456789
     *       628123456789 → +628123456789  
     *       +628123456789 → +628123456789
     */
    formatToE164(phone: string): string {
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
     * Send OTP via Firebase Phone Authentication
     * 
     * Uses listener-based pattern: registers listeners first,
     * then triggers signInWithPhoneNumber, and wraps everything
     * in a Promise that resolves on phoneCodeSent or 
     * phoneVerificationCompleted, and rejects on phoneVerificationFailed.
     */
    async sendOTP(phoneNumber: string): Promise<{ success: boolean; autoVerified?: boolean; error?: string }> {
        try {
            const e164Phone = this.formatToE164(phoneNumber);

            logger.info('Sending phone OTP via Firebase Auth', { phone: e164Phone.slice(0, 6) + '****' });

            // Clean up any existing listeners
            await FirebaseAuthentication.removeAllListeners();

            return new Promise((resolve) => {
                let resolved = false;

                // Listen for code sent (normal flow)
                FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
                    if (resolved) return;
                    resolved = true;
                    currentVerificationId = event.verificationId;
                    logger.security('Phone OTP sent successfully');
                    SecurityEventLogger.logEvent('otp_generated', 'Phone OTP sent via Firebase');
                    resolve({ success: true });
                });

                // Listen for auto-verification completed (instant verify on some devices)
                FirebaseAuthentication.addListener('phoneVerificationCompleted', (_event) => {
                    if (resolved) return;
                    resolved = true;
                    logger.security('Phone auto-verified by Firebase');
                    SecurityEventLogger.logEvent('otp_verified', 'Phone auto-verified by Firebase');
                    resolve({ success: true, autoVerified: true });
                });

                // Listen for verification failure
                FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
                    if (resolved) return;
                    resolved = true;
                    logger.error('Phone OTP failed', event.message);
                    SecurityEventLogger.logEvent('otp_failed', 'Phone OTP sending failed: ' + event.message);
                    resolve({ success: false, error: this.mapFirebaseError({ message: event.message }) });
                });

                // Trigger the phone sign-in flow
                FirebaseAuthentication.signInWithPhoneNumber({
                    phoneNumber: e164Phone,
                }).catch((error: any) => {
                    if (resolved) return;
                    resolved = true;
                    logger.error('signInWithPhoneNumber call failed', error);
                    resolve({ success: false, error: this.mapFirebaseError(error) });
                });

                // Timeout after 60 seconds
                setTimeout(() => {
                    if (resolved) return;
                    resolved = true;
                    resolve({ success: false, error: 'Waktu habis. Coba lagi / Timed out. Try again' });
                }, 60000);
            });

        } catch (error: any) {
            logger.error('Firebase Phone Auth error', error);
            return { success: false, error: this.mapFirebaseError(error) };
        }
    },

    /**
     * Verify OTP code with Firebase
     * Uses the verificationId from phoneCodeSent listener
     */
    async verifyOTP(code: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!currentVerificationId) {
                return { success: false, error: 'Tidak ada verifikasi pending. Minta kode baru / No pending verification. Request a new code.' };
            }

            const result = await FirebaseAuthentication.confirmVerificationCode({
                verificationId: currentVerificationId,
                verificationCode: code,
            });

            if (result.user) {
                logger.security('Phone OTP verified successfully');
                await SecurityEventLogger.logEvent('otp_verified', 'Phone OTP verified via Firebase');

                // Sign out immediately - we only used phone auth for PIN recovery verification
                await FirebaseAuthentication.signOut();

                // Clear the verification ID
                currentVerificationId = null;

                // Clean up listeners
                await FirebaseAuthentication.removeAllListeners();

                return { success: true };
            } else {
                logger.security('Phone OTP verification failed - no user returned');
                await SecurityEventLogger.logEvent('otp_failed', 'Phone OTP verification failed');
                return { success: false, error: 'Verifikasi gagal / Verification failed' };
            }
        } catch (error: any) {
            logger.error('Phone OTP verification error', error);
            await SecurityEventLogger.logEvent('otp_failed', 'Phone OTP verification error');
            return { success: false, error: this.mapFirebaseError(error) };
        }
    },

    /**
     * Check if there is a pending verification
     */
    hasPendingVerification(): boolean {
        return currentVerificationId !== null;
    },

    /**
     * Clear any pending verification state
     */
    async clearVerification(): Promise<void> {
        currentVerificationId = null;
        await FirebaseAuthentication.removeAllListeners();
    },

    /**
     * Map Firebase error codes to user-friendly bilingual messages
     */
    mapFirebaseError(error: any): string {
        const code = error?.code || error?.message || '';

        if (code.includes('invalid-phone-number')) {
            return 'Nomor HP tidak valid / Invalid phone number';
        }
        if (code.includes('too-many-requests') || code.includes('quota-exceeded')) {
            return 'Terlalu banyak percobaan. Coba lagi nanti / Too many attempts. Try again later';
        }
        if (code.includes('missing-phone-number')) {
            return 'Nomor HP diperlukan / Phone number required';
        }
        if (code.includes('invalid-verification-code')) {
            return 'Kode verifikasi salah / Invalid verification code';
        }
        if (code.includes('session-expired') || code.includes('code-expired')) {
            return 'Kode sudah kedaluwarsa. Minta kode baru / Code expired. Request a new code';
        }
        if (code.includes('network-request-failed')) {
            return 'Koneksi gagal. Periksa internet Anda / Network error. Check your connection';
        }

        return error?.message || 'Terjadi kesalahan / An error occurred';
    },
};
