/**
 * PhishTank API Integration
 * 
 * Checks URLs against PhishTank's community-driven phishing database.
 */

import { logger } from '@/lib/utils/logger';
import { phishTankConfig } from '@/config/phishTankConfig';

export interface PhishTankResult {
    /** Whether the URL is in PhishTank database */
    isPhishing: boolean;
    /** Whether the URL is verified as phishing by the community */
    isVerified?: boolean;
    /** Link to PhishTank report */
    phishDetailUrl?: string;
    /** Whether the API was available and responded */
    isApiAvailable: boolean;
    /** Whether this result came from cache */
    fromCache: boolean;
    /** Timestamp of the check */
    checkedAt: Date;
}

interface CacheEntry {
    result: PhishTankResult;
    timestamp: number;
}

interface PhishTankApiResponse {
    results: {
        in_database: boolean;
        url: string;
        phish_id?: string;
        phish_detail_page?: string;
        verified?: boolean;
        verified_at?: string;
        valid?: boolean;
    };
    meta: {
        timestamp: string;
        serverid: string;
        status: string;
        requestid: string;
    };
}

class PhishTankService {
    private cache: Map<string, CacheEntry> = new Map();

    /**
     * Check if the API is enabled
     */
    isEnabled(): boolean {
        return phishTankConfig.enabled;
    }

    /**
     * Check a URL against PhishTank
     */
    async checkUrl(url: string): Promise<PhishTankResult> {
        if (!this.isEnabled()) {
            return this.createEmptyResult(false);
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
            logger.error('PhishTank API error', error);
            // Default to safe on error, but mark API as unavailable
            return this.createEmptyResult(false);
        }
    }

    private createEmptyResult(isApiAvailable: boolean): PhishTankResult {
        return {
            isPhishing: false,
            isApiAvailable,
            fromCache: false,
            checkedAt: new Date(),
        };
    }

    /**
     * Query the PhishTank API
     * POST https://checkurl.phishtank.com/checkurl/
     * Body: url=...&format=json&app_key=...
     */
    private async queryApi(url: string): Promise<PhishTankResult> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), phishTankConfig.timeout);

        try {
            const formData = new FormData();
            formData.append('url', url);
            formData.append('format', 'json');
            if (phishTankConfig.apiKey) {
                formData.append('app_key', phishTankConfig.apiKey);
            }

            const response = await fetch(phishTankConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'User-Agent': phishTankConfig.userAgent,
                },
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data: PhishTankApiResponse = await response.json();

            return {
                isPhishing: data.results.in_database && (data.results.valid ?? false),
                isVerified: data.results.verified,
                phishDetailUrl: data.results.phish_detail_page,
                isApiAvailable: true,
                fromCache: false,
                checkedAt: new Date(),
            };

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    private getFromCache(url: string): PhishTankResult | null {
        const entry = this.cache.get(url);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > phishTankConfig.cacheDuration) {
            this.cache.delete(url);
            return null;
        }

        return entry.result;
    }

    private addToCache(url: string, result: PhishTankResult): void {
        if (this.cache.size >= phishTankConfig.maxCacheEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(url, {
            result: { ...result, fromCache: false },
            timestamp: Date.now(),
        });
    }

    clearCache(): void {
        this.cache.clear();
    }
}

export default new PhishTankService();
