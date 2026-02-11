/**
 * Google Safe Browsing API Configuration
 * 
 * To use Google Safe Browsing:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project and enable "Safe Browsing API"
 * 3. Create an API key
 * 4. Set the key below or via environment variable VITE_SAFE_BROWSING_API_KEY
 */

export const safeBrowsingConfig = {
    /** 
     * API Key for Google Safe Browsing. 
     * Set via VITE_SAFE_BROWSING_API_KEY env variable or hardcode here.
     */
    apiKey: import.meta.env.VITE_SAFE_BROWSING_API_KEY || '',

    /** Enable/disable Google Safe Browsing check */
    enabled: true,

    /** API endpoint */
    apiUrl: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',

    /** Request timeout in ms */
    timeout: 5000,

    /** Cache duration in ms (5 minutes) */
    cacheDuration: 5 * 60 * 1000,

    /** Max cache entries to prevent memory leaks */
    maxCacheEntries: 500,

    /** Client ID for API tracking */
    clientId: 'safety-shield-app',
    clientVersion: '1.0.0',

    /** Threat types to check */
    threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
    ] as const,

    /** Platform types */
    platformTypes: ['ANY_PLATFORM'] as const,

    /** Threat entry types */
    threatEntryTypes: ['URL'] as const,
};

export type ThreatType = typeof safeBrowsingConfig.threatTypes[number];
