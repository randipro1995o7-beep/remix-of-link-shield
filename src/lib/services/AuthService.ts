import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    User
} from 'firebase/auth';
import { firebaseConfig } from '@/config/firebase';
import { logger } from '@/lib/utils/logger';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export const AuthService = {
    /**
     * Send a passwordless sign-in link to the user's email
     * This acts as "proof of ownership" for the email address
     */
    async sendVerificationLink(email: string) {
        try {
            const actionCodeSettings = {
                // The URL to redirect to. Verification happens here.
                // Using the Firebase project default domain to ensure it's whitelisted.
                url: `https://${firebaseConfig.authDomain}/finishSignUp?cartId=1234`,
                // This must be true for mobile app handling
                handleCodeInApp: true,
                iOS: {
                    bundleId: 'com.safeguard.app'
                },
                android: {
                    packageName: 'com.safeguard.app',
                    installApp: true,
                    minimumVersion: '12'
                },
                // The dynamic link domain (if enabled)
                // dynamicLinkDomain: 'safeguard.page.link' // Optional, if using dynamic links
            };

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);

            // Save email locally
            window.localStorage.setItem('emailForSignIn', email);

            logger.info('Verification link sent to ' + email);
            return { success: true };
        } catch (error: any) {
            logger.error('Error sending verification link', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Check if the current URL is a sign-in link
     */
    isSignInLink(url: string) {
        return isSignInWithEmailLink(auth, url);
    },

    /**
     * Complete the sign-in/verification process
     */
    async verifyEmailLink(url: string) {
        try {
            if (!this.isSignInLink(url)) {
                return { success: false, error: 'Not a valid sign-in link' };
            }

            let email = window.localStorage.getItem('emailForSignIn');

            // If email is missing (opened on different device?), prompt user.
            // For this specific app flow, we assume simple re-entry.
            if (!email) {
                return { success: false, error: 'Email not found. Please enter your email again.' };
            }

            const result = await signInWithEmailLink(auth, email, url);

            // Clear email from storage
            window.localStorage.removeItem('emailForSignIn');

            logger.info('Successfully verified email', result.user.email);
            return { success: true, user: result.user };
        } catch (error: any) {
            logger.error('Error verifying email link', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return auth.currentUser;
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChanged(callback: (user: User | null) => void) {
        return auth.onAuthStateChanged(callback);
    },

    auth
};
