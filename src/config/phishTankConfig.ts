/**
 * PhishTank API Configuration
 * 
 * To use PhishTank:
 * 1. Get an API key from https://www.phishtank.com/api_register.php (optional but recommended for higher limits)
 * 2. Set the key via environment variable VITE_PHISHTANK_API_KEY
 */

export const phishTankConfig = {
    /** 
     * API Key for PhishTank. 
     * Set via VITE_PHISHTANK_API_KEY env variable or hardcode here.
     */
    apiKey: import.meta.env.VITE_PHISHTANK_API_KEY || '',

    /** Enable/disable PhishTank check */
    enabled: true,

    /** API endpoint */
    apiUrl: 'https://checkurl.phishtank.com/checkurl/',

    /** Request timeout in ms */
    timeout: 8000, // PhishTank can be slower than Google

    /** Cache duration in ms (10 minutes) */
    cacheDuration: 10 * 60 * 1000,

    /** Max cache entries */
    maxCacheEntries: 200,

    /** User Agent is required by PhishTank */
    userAgent: 'phishtank/SafetyShield/1.0',
};
