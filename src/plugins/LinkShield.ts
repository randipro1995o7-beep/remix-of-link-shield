import { registerPlugin } from '@capacitor/core';

export interface LinkShieldPlugin {
    setProtectionEnabled(options: { enabled: boolean }): Promise<void>;
    isLinkHandlerEnabled(): Promise<{ enabled: boolean; defaultHandler?: string; error?: string }>;
    openAppLinkSettings(): Promise<void>;
    openAppDetails(): Promise<void>;
    requestSmsPermission(): Promise<{ granted: boolean }>;
    openAccessibilitySettings(): Promise<void>;
    openOverlaySettings(): Promise<void>;
    requestNotificationPermission(): Promise<{ granted: boolean }>;
    checkPermissions(): Promise<{ sms: boolean; accessibility: boolean; overlay: boolean; notifications: boolean }>;
}

const LinkShield = registerPlugin<LinkShieldPlugin>('LinkShield');

export default LinkShield;
