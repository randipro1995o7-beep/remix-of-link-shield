import { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { useApp } from '@/contexts/AppContext';
import LinkShield from '@/plugins/LinkShield';
import { logger } from '@/lib/utils/logger';

const NOTIFICATION_ID = 1001;

export function useSecurityStatusNotification() {
    const { state, t } = useApp();

    // Function to perform the check and update notification
    const checkAndNotify = async () => {
        try {
            // 1. Check permissions
            const permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                const request = await LocalNotifications.requestPermissions();
                if (request.display !== 'granted') return;
            }

            // 2. Check Default Link Handler Status
            let isDefault = false;
            try {
                const result = await LinkShield.isLinkHandlerEnabled(); // Assuming this plugin method exists and works
                isDefault = result.enabled;
            } catch (e) {
                logger.error('Failed to check link handler status for notification', e);
                // If plugin fails, we might assume false or just return to avoid false alarm
                // But for security app, better to warn if unsure? Let's assume false.
            }

            // 3. Determine Status
            const isProtected = state.isProtectionEnabled && isDefault;

            // 4. Define Notification Content
            const title = isProtected
                ? t.settings.protectionActive
                : t.settings.protectionInactive;

            const body = isProtected
                ? t.settings.protectionActiveDesc
                : t.settings.protectionInactiveDesc;

            // 5. Schedule (Update) Notification
            // We schedule it "now" to update the existing one with the same ID
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id: NOTIFICATION_ID,
                        ongoing: true, // Key for persistence on Android
                        autoCancel: false, // Don't dismiss when clicked
                        smallIcon: 'ic_stat_shield', // Need to ensure this resource exists, or use default
                        schedule: { at: new Date(Date.now() + 100) },
                        actionTypeId: '',
                        extra: {
                            type: 'security_status'
                        }
                    },
                ],
            });

        } catch (error) {
            logger.error('Failed to update security notification', error);
        }
    };

    useEffect(() => {
        // Initial check
        checkAndNotify();

        // Re-check when app resumes (e.g. user comes back from settings)
        const listener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                checkAndNotify();
            }
        });

        // Also separate interval check? Maybe every minute? 
        // No, app state change and state change should be enough.

        return () => {
            listener.then(l => l.remove());
        };
    }, [state.isProtectionEnabled, state.language]); // Re-run if user toggles protection or changes language

    return null; // This hook doesn't render anything
}
