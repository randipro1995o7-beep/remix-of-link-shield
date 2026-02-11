/**
 * Google Safe Browsing API v4 Integration
 * 
 * Checks URLs against Google's threat database including:
 * - Malware
 * - Social Engineering (Phishing)
 * - Unwanted Software
 * - Potentially Harmful Applications
 * 
 * Features:
 * - In-memory cache with TTL to reduce API calls
 * - Graceful degradation on API failure
 * - Configurable timeout
 * - Rate-aware design
 */

import { logger } from '@/lib/utils/logger';
import { safeBrowsingConfig, ThreatType } from '@/config/safeBrowsingConfig';

export interface SafeBrowsingResult {
    /** Whether the URL was flagged as a threat */
    isThreat: boolean;
    /** Type of threat detected (if any) */
    threatType?: ThreatType;
    /** Human-readable threat description */
    threatDescription?: string;
    /** Whether the API was available and responded */
    isApiAvailable: boolean;
    /** Whether this result came from cache */
    fromCache: boolean;
}

interface CacheEntry {
    result: SafeBrowsingResult;
    timestamp: number;
}

interface SafeBrowsingApiResponse {
    matches?: Array<{
        threatType: ThreatType;
        platformType: string;
        threatEntryType: string;
        threat: { url: string };
        cacheDuration?: string;
    }>;
}

const THREAT_DESCRIPTIONS: Record<string, string> = {
    'MALWARE': 'This site may contain malware that can harm your device',
    'SOCIAL_ENGINEERING': 'This site may be attempting to trick you into sharing personal information (phishing)',
    'UNWANTED_SOFTWARE': 'This site may contain unwanted or deceptive software',
    'POTENTIALLY_HARMFUL_APPLICATION': 'This site may contain potentially harmful applications',
};

class GoogleSafeBrowsingService {
    private cache: Map<string, CacheEntry> = new Map();

    /**
     * Check if the Google Safe Browsing API is configured and available
     */
    isConfigured(): boolean {
        return safeBrowsingConfig.enabled && safeBrowsingConfig.apiKey.length > 0;
    }

    /**
     * Check a URL against Google Safe Browsing
     */
    async checkUrl(url: string): Promise<SafeBrowsingResult> {
        // Not configured — graceful degradation
        if (!this.isConfigured()) {
            return {
                isThreat: false,
                isApiAvailable: false,
                fromCache: false,
            };
        }

        // Check cache first
        const cached = this.getFromCache(url);
        if (cached) {
            return { ...cached, fromCache: true };
        }

        try {
            const result = await this.queryApi(url);
            this.addToCache(url, result);
            return result;
        } catch (error) {
            logger.error('Google Safe Browsing API error', error);
            return {
                isThreat: false,
                isApiAvailable: false,
                fromCache: false,
            };
        }
    }

    /**
     * Check multiple URLs in a single API call (batch)
     */
    async checkUrls(urls: string[]): Promise<Map<string, SafeBrowsingResult>> {
        const results = new Map<string, SafeBrowsingResult>();
        const uncachedUrls: string[] = [];

        // Check cache for all URLs
        for (const url of urls) {
            const cached = this.getFromCache(url);
            if (cached) {
                results.set(url, { ...cached, fromCache: true });
            } else {
                uncachedUrls.push(url);
            }
        }

        // If all cached, return immediately
        if (uncachedUrls.length === 0) {
            return results;
        }

        // If not configured, return defaults for uncached
        if (!this.isConfigured()) {
            for (const url of uncachedUrls) {
                results.set(url, { isThreat: false, isApiAvailable: false, fromCache: false });
            }
            return results;
        }

        try {
            const batchResult = await this.queryApiBatch(uncachedUrls);
            for (const url of uncachedUrls) {
                const result = batchResult.get(url) || {
                    isThreat: false,
                    isApiAvailable: true,
                    fromCache: false,
                };
                results.set(url, result);
                this.addToCache(url, result);
            }
        } catch (error) {
            logger.error('Google Safe Browsing batch API error', error);
            for (const url of uncachedUrls) {
                results.set(url, { isThreat: false, isApiAvailable: false, fromCache: false });
            }
        }

        return results;
    }

    /**
     * Query the Safe Browsing API for a single URL
     */
    private async queryApi(url: string): Promise<SafeBrowsingResult> {
        const batch = await this.queryApiBatch([url]);
        return batch.get(url) || { isThreat: false, isApiAvailable: true, fromCache: false };
    }

    /**
     * Query the Safe Browsing API for multiple URLs
     */
    private async queryApiBatch(urls: string[]): Promise<Map<string, SafeBrowsingResult>> {
        const apiUrl = `${safeBrowsingConfig.apiUrl}?key=${safeBrowsingConfig.apiKey}`;

        const requestBody = {
            client: {
                clientId: safeBrowsingConfig.clientId,
                clientVersion: safeBrowsingConfig.clientVersion,
            },
            threatInfo: {
                threatTypes: [...safeBrowsingConfig.threatTypes],
                platformTypes: [...safeBrowsingConfig.platformTypes],
                threatEntryTypes: [...safeBrowsingConfig.threatEntryTypes],
                threatEntries: urls.map(url => ({ url })),
            },
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), safeBrowsingConfig.timeout);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429) {
                    logger.warn('Google Safe Browsing rate limit hit');
                }
                throw new Error(`API returned ${response.status}`);
            }

            const data: SafeBrowsingApiResponse = await response.json();
            return this.parseResponse(data, urls);
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === 'AbortError') {
                logger.warn('Google Safe Browsing request timed out');
            }

            throw error;
        }
    }

    /**
     * Parse the API response into SafeBrowsingResult objects
     */
    private parseResponse(
        data: SafeBrowsingApiResponse,
        queriedUrls: string[]
    ): Map<string, SafeBrowsingResult> {
        const results = new Map<string, SafeBrowsingResult>();

        // Default: all URLs are safe
        for (const url of queriedUrls) {
            results.set(url, {
                isThreat: false,
                isApiAvailable: true,
                fromCache: false,
            });
        }

        // Mark matched URLs as threats
        if (data.matches) {
            for (const match of data.matches) {
                const url = match.threat.url;
                results.set(url, {
                    isThreat: true,
                    threatType: match.threatType,
                    threatDescription: THREAT_DESCRIPTIONS[match.threatType] ||
                        `Threat detected: ${match.threatType}`,
                    isApiAvailable: true,
                    fromCache: false,
                });
            }
        }

        return results;
    }

    /**
     * Get a cached result if available and not expired
     */
    private getFromCache(url: string): SafeBrowsingResult | null {
        const entry = this.cache.get(url);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > safeBrowsingConfig.cacheDuration) {
            this.cache.delete(url);
            return null;
        }

        return entry.result;
    }

    /**
     * Add a result to the cache
     */
    private addToCache(url: string, result: SafeBrowsingResult): void {
        // Evict oldest entries if cache is too large
        if (this.cache.size >= safeBrowsingConfig.maxCacheEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(url, {
            result: { ...result, fromCache: false },
            timestamp: Date.now(),
        });
    }

    /**
     * Clear the entire cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get current cache size (for diagnostics)
     */
    getCacheSize(): number {
        return this.cache.size;
    }
}

export default new GoogleSafeBrowsingService();
