/**
 * Domain Age Checker
 * 
 * Checks domain registration age using RDAP (Registration Data Access Protocol).
 * RDAP is free, standardized (RFC 7480-7484), and returns JSON.
 * 
 * Newly registered domains (< 30 days) are strong phishing indicators.
 * Domains < 180 days are moderately suspicious.
 * 
 * Features:
 * - In-memory cache with TTL (24 hours per domain)
 * - Graceful degradation on API failure
 * - TLD-specific RDAP bootstrap via IANA
 * - Timeout protection (5s)
 */

import { logger } from '@/lib/utils/logger';

export interface DomainAgeResult {
    ageInDays: number | null;     // null = lookup failed
    registrationDate: string | null; // ISO date string
    isNewDomain: boolean;         // < 30 days
    isYoungDomain: boolean;       // < 180 days
    isLookupAvailable: boolean;   // false if RDAP failed
}

interface CacheEntry {
    result: DomainAgeResult;
    timestamp: number;
}

// RDAP bootstrap — maps TLDs to their RDAP server URLs
// Source: https://data.iana.org/rdap/dns.json
const RDAP_SERVERS: Record<string, string> = {
    // Generic TLDs
    'com': 'https://rdap.verisign.com/com/v1',
    'net': 'https://rdap.verisign.com/net/v1',
    'org': 'https://rdap.org/org/v1',
    'info': 'https://rdap.afilias.net/rdap/info/v1',
    'biz': 'https://rdap.identitydigital.services/rdap/v1',
    'xyz': 'https://rdap.centralnic.com/xyz/v1',
    'online': 'https://rdap.centralnic.com/online/v1',
    'site': 'https://rdap.centralnic.com/site/v1',
    'top': 'https://rdap.centralnic.com/top/v1',
    'club': 'https://rdap.identitydigital.services/rdap/v1',
    'shop': 'https://rdap.centralnic.com/shop/v1',
    'app': 'https://rdap.nic.google/v1',
    'dev': 'https://rdap.nic.google/v1',
    'io': 'https://rdap.identitydigital.services/rdap/v1',
    'me': 'https://rdap.identitydigital.services/rdap/v1',
    'link': 'https://rdap.identitydigital.services/rdap/v1',
    'click': 'https://rdap.identitydigital.services/rdap/v1',
    'fun': 'https://rdap.centralnic.com/fun/v1',
    'buzz': 'https://rdap.centralnic.com/buzz/v1',
    'space': 'https://rdap.centralnic.com/space/v1',
    'live': 'https://rdap.identitydigital.services/rdap/v1',
    'store': 'https://rdap.centralnic.com/store/v1',
    // Country-code TLDs
    'id': 'https://rdap.pandi.or.id/v1',
    'co.id': 'https://rdap.pandi.or.id/v1',
    'my': 'https://rdap.mynic.my/v1',
    'sg': 'https://rdap.sgnic.sg/v1',
    'ph': 'https://rdap.dot.ph/v1',
    'uk': 'https://rdap.nominet.uk/v1',
    'de': 'https://rdap.denic.de/v1',
    'au': 'https://rdap.auda.org.au/v1',
    'jp': 'https://rdap.jprs.jp/v1',
    'kr': 'https://rdap.kisa.or.kr/v1',
    'in': 'https://rdap.registry.in/v1',
    'ru': 'https://rdap.tcinet.ru/v1',
    'br': 'https://rdap.registro.br/v1',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds
const NEW_DOMAIN_DAYS = 30;
const YOUNG_DOMAIN_DAYS = 180;

class DomainAgeCheckerService {
    private cache: Map<string, CacheEntry> = new Map();

    /**
     * Extract the root domain for RDAP lookup.
     * e.g., "sub.example.co.id" → "example.co.id"
     */
    private getRootDomain(domain: string): string {
        const parts = domain.split('.');
        // Handle two-part ccTLDs like co.id, com.au, co.uk, etc.
        const twoPartCcTlds = ['co.id', 'co.uk', 'com.au', 'co.jp', 'co.kr', 'com.br', 'com.sg', 'com.my', 'co.in', 'com.ph'];
        if (parts.length >= 3) {
            const lastTwo = parts.slice(-2).join('.');
            const isCompoundCcTld = twoPartCcTlds.some(tld => domain.endsWith('.' + tld) || domain === lastTwo);
            if (isCompoundCcTld && parts.length >= 3) {
                return parts.slice(-3).join('.');
            }
        }
        return parts.slice(-2).join('.');
    }

    /**
     * Get the TLD for RDAP server lookup.
     */
    private getTld(domain: string): string {
        const parts = domain.split('.');
        // Check compound TLDs first
        if (parts.length >= 2) {
            const lastTwo = parts.slice(-2).join('.');
            if (RDAP_SERVERS[lastTwo]) {
                return lastTwo;
            }
        }
        return parts[parts.length - 1];
    }

    /**
     * Get the RDAP server URL for a given domain.
     */
    private getRdapServer(domain: string): string | null {
        const tld = this.getTld(domain);
        return RDAP_SERVERS[tld] || null;
    }

    /**
     * Look up domain age via RDAP.
     */
    async checkDomainAge(domain: string): Promise<DomainAgeResult> {
        const rootDomain = this.getRootDomain(domain.toLowerCase());

        // Check cache first
        const cached = this.getFromCache(rootDomain);
        if (cached) {
            return cached;
        }

        const rdapServer = this.getRdapServer(rootDomain);
        if (!rdapServer) {
            const result = this.unavailableResult();
            this.addToCache(rootDomain, result);
            return result;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            const response = await fetch(`${rdapServer}/domain/${rootDomain}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/rdap+json',
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                logger.warn('DomainAgeChecker: RDAP returned', response.status, 'for', rootDomain);
                const result = this.unavailableResult();
                this.addToCache(rootDomain, result);
                return result;
            }

            const data = await response.json();
            const result = this.parseRdapResponse(data);
            this.addToCache(rootDomain, result);
            logger.info('DomainAgeChecker:', rootDomain, result.ageInDays !== null ? `${result.ageInDays} days old` : 'age unknown');
            return result;
        } catch (error) {
            logger.warn('DomainAgeChecker: lookup failed for', rootDomain, error);
            const result = this.unavailableResult();
            this.addToCache(rootDomain, result);
            return result;
        }
    }

    /**
     * Parse RDAP response to extract registration date.
     * RDAP responses have an `events` array with eventAction "registration".
     */
    private parseRdapResponse(data: any): DomainAgeResult {
        try {
            const events = data.events || [];
            let registrationDate: string | null = null;

            // Look for registration event
            for (const event of events) {
                if (event.eventAction === 'registration' && event.eventDate) {
                    registrationDate = event.eventDate;
                    break;
                }
            }

            if (!registrationDate) {
                // Fallback: some registrars use different field names
                // Try "last changed of registration" or just take the earliest date
                let earliestDate: string | null = null;
                for (const event of events) {
                    if (event.eventDate) {
                        if (!earliestDate || new Date(event.eventDate) < new Date(earliestDate)) {
                            earliestDate = event.eventDate;
                        }
                    }
                }
                registrationDate = earliestDate;
            }

            if (!registrationDate) {
                return this.unavailableResult();
            }

            const regDate = new Date(registrationDate);
            const now = new Date();
            const ageInDays = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));

            return {
                ageInDays,
                registrationDate: regDate.toISOString(),
                isNewDomain: ageInDays < NEW_DOMAIN_DAYS,
                isYoungDomain: ageInDays < YOUNG_DOMAIN_DAYS,
                isLookupAvailable: true,
            };
        } catch (error) {
            logger.warn('DomainAgeChecker: failed to parse RDAP response', error);
            return this.unavailableResult();
        }
    }

    /**
     * Return a result indicating the lookup is unavailable.
     */
    private unavailableResult(): DomainAgeResult {
        return {
            ageInDays: null,
            registrationDate: null,
            isNewDomain: false,
            isYoungDomain: false,
            isLookupAvailable: false,
        };
    }

    // --- Cache management ---

    private getFromCache(domain: string): DomainAgeResult | null {
        const entry = this.cache.get(domain);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            this.cache.delete(domain);
            return null;
        }
        return entry.result;
    }

    private addToCache(domain: string, result: DomainAgeResult): void {
        // Evict old entries if cache gets too large
        if (this.cache.size > 200) {
            const oldest = this.cache.keys().next().value;
            if (oldest) this.cache.delete(oldest);
        }
        this.cache.set(domain, { result, timestamp: Date.now() });
    }

    clearCache(): void {
        this.cache.clear();
    }

    getCacheSize(): number {
        return this.cache.size;
    }
}

export default new DomainAgeCheckerService();
