import { registerPlugin } from '@capacitor/core';

export interface LinkShieldPlugin {
    setProtectionEnabled(options: { enabled: boolean }): Promise<void>;
    isLinkHandlerEnabled(): Promise<{ enabled: boolean }>;
    openAppLinkSettings(): Promise<void>;
}

const LinkShield = registerPlugin<LinkShieldPlugin>('LinkShield');

export default LinkShield;

