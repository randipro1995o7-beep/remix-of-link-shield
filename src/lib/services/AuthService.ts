import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithCredential,
    User
} from 'firebase/auth';
import { firebaseConfig } from '@/config/firebase';
import { logger } from '@/lib/utils/logger';

// Initialize Firebase
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

import { getFirestore } from 'firebase/firestore';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export const firebaseApp = app;
export const firebaseDb = db;

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
    /**
     * Subscribe to auth state changes
     */
    onAuthStateChanged(callback: (user: User | null) => void) {
        return auth.onAuthStateChanged(callback);
    },

    /**
     * Sign in with Google
     */
    async loginWithGoogle() {
        try {
            if (Capacitor.isNativePlatform()) {
                // Native Platform (Android/iOS) - Use Capacitor Firebase Plugin
                logger.info('Starting native Google Sign-In with @capacitor-firebase/authentication');

                // Aggressive Sign-Out Strategy
                // 1. Sign out from Firebase JS SDK to clear any cached user
                try { await auth.signOut(); } catch (e) { /* ignore */ }

                // 2. Disable Credential Manager to force Legacy Google Sign-In Flow
                // The Credential Manager (Android 14+) often auto-selects the previous account.
                // Disabling it falls back to the legacy Google Sign-In intent, which is more 
                // likely to show the "Choose Account" dialog.

                // 3. Force Sign-Out Native Session (Now Patched)
                // We patched the plugin to ensure legacy sign-out works.
                try { await FirebaseAuthentication.signOut(); } catch (e) { /* ignore */ }

                const result = await FirebaseAuthentication.signInWithGoogle({
                    useCredentialManager: false
                });

                if (!result.credential?.idToken) {
                    throw new Error('No ID token returned from Google Sign-In');
                }

                // Create a Firebase credential with the Google ID token
                const credential = GoogleAuthProvider.credential(result.credential.idToken);

                // Sign in with credential from the Google user
                const userCredential = await signInWithCredential(auth, credential);

                logger.info('Native Google sign-in success', userCredential.user.email);
                return { success: true, user: userCredential.user };
            } else {
                // Web Platform - Use Firebase SDK Popup
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                // The signed-in user info.
                const user = result.user;
                logger.info('Google sign-in success', user.email);
                return { success: true, user };
            }
        } catch (error: any) {
            logger.error('Google sign-in error', error);
            const errorMessage = error.message || 'Google sign-in failed';
            return { success: false, error: errorMessage };
        }
    },

    auth
};
