/**
 * Safe Link Heuristic Service
 * 
 * Multi-signal heuristic to identify links that are clearly NOT phishing.
 * When all signals indicate safety, the link can bypass the full review screen.
 * 
 * Signals checked:
 * 1. Domain is in trusted domains list (200+ domains)
 * 2. URL uses HTTPS
 * 3. PhishGuard score is very low (< 20)
 * 4. No dangerous file downloads (.apk, .exe, .msi, .bat)
 * 5. Domain is not a URL shortener
 * 6. Domain has good reputation (top-100 or top-1000)
 */

import { isTrustedDomain } from '@/lib/trustedDomains';
import { KNOWN_BRANDS } from '@/lib/services/PhishGuard';
import DomainReputation from './DomainReputation';
import PhishGuard from './PhishGuard';
import { logger } from '@/lib/utils/logger';
import { UserFeedbackService } from './UserFeedbackService';

// Dangerous file extensions that should never be auto-allowed
const DANGEROUS_EXTENSIONS = ['.apk', '.exe', '.msi', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'];

// Known URL shortener domains
const URL_SHORTENERS = new Set([
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
    'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'dlvr.it',
    'fb.me', 'lnkd.in', 'youtu.be', 'amzn.to', 'rb.gy', 'cutt.ly',
    'shorturl.at', 'tiny.cc', 'bc.vc', 'v.gd', 'clck.ru', 'rebrand.ly',
    's.id', 'linktr.ee', 'qr.ae', 'surl.li', 'shorturl.asia', 'u.to',
]);

export interface SafetyHeuristicResult {
    /** Whether the link is considered safe enough to bypass review */
    isSafe: boolean;
    /** Reason for the decision (for logging/debugging) */
    reason: string;
    /** Individual signal results */
    signals: {
        isTrustedDomain: boolean;
        isHttps: boolean;
        hasLowPhishScore: boolean;
        hasNoDangerousFile: boolean;
        isNotShortener: boolean;
        hasGoodReputation: boolean;
    };
}

class SafeLinkHeuristicService {
    /**
     * Check if a URL is heuristically safe (can bypass review).
     * ALL signals must pass for the link to be considered safe.
     */
    async check(url: string, domain: string): Promise<SafetyHeuristicResult> {
        const signals = {
            isTrustedDomain: false,
            isHttps: false,
            hasLowPhishScore: false,
            hasNoDangerousFile: false,
            isNotShortener: false,
            hasGoodReputation: false,
        };

        // Signal 1: Trusted domain check (trustedDomains.ts + KNOWN_BRANDS + user feedback)
        const userFeedback = UserFeedbackService.getFeedbackSync(domain);
        signals.isTrustedDomain = isTrustedDomain(domain) || this.isKnownBrandDomain(domain) || (userFeedback?.autoTrusted === true);
        if (!signals.isTrustedDomain) {
            return this.result(false, 'Domain is not in trusted list', signals);
        }

        // Signal 2: HTTPS check
        signals.isHttps = url.toLowerCase().startsWith('https://');
        if (!signals.isHttps) {
            return this.result(false, 'URL does not use HTTPS', signals);
        }

        // Signal 3: No dangerous file download
        signals.hasNoDangerousFile = this.hasNoDangerousFile(url);
        if (!signals.hasNoDangerousFile) {
            return this.result(false, 'URL contains dangerous file extension', signals);
        }

        // Signal 4: Not a URL shortener
        signals.isNotShortener = !this.isUrlShortener(domain);
        if (!signals.isNotShortener) {
            return this.result(false, 'Domain is a URL shortener', signals);
        }

        // Signal 5: Domain reputation
        const reputation = DomainReputation.getReputation(domain);
        signals.hasGoodReputation = reputation.isKnown;

        // Signal 6: PhishGuard score (quick check)
        const phishResult = await PhishGuard.analyzeUrl(url);
        signals.hasLowPhishScore = phishResult.score < 20;
        if (!signals.hasLowPhishScore) {
            return this.result(false, `PhishGuard score too high: ${phishResult.score}`, signals);
        }

        // All signals pass — link is heuristically safe
        const isSafe = signals.isTrustedDomain && signals.isHttps &&
            signals.hasLowPhishScore && signals.hasNoDangerousFile &&
            signals.isNotShortener;

        if (isSafe) {
            logger.info('SafeLinkHeuristic: auto-allowing', domain);
        }

        return this.result(isSafe, isSafe ? 'All safety signals pass' : 'Not all signals pass', signals);
    }

    /**
     * Check if URL path contains dangerous file extensions
     */
    private hasNoDangerousFile(url: string): boolean {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            const path = urlObj.pathname.toLowerCase();
            return !DANGEROUS_EXTENSIONS.some(ext => path.endsWith(ext));
        } catch {
            return true; // If URL can't be parsed, don't block on this signal
        }
    }

    /**
     * Check if domain is a known URL shortener
     */
    private isUrlShortener(domain: string): boolean {
        const parts = domain.split('.');
        // Check exact match and root domain
        if (URL_SHORTENERS.has(domain)) return true;
        if (parts.length >= 2) {
            const root = parts.slice(-2).join('.');
            if (URL_SHORTENERS.has(root)) return true;
        }
        return false;
    }

    /**
     * Check if domain is an official domain of a known brand
     */
    private isKnownBrandDomain(domain: string): boolean {
        return KNOWN_BRANDS.some(brand =>
            brand.officialDomains.some(official =>
                domain === official || domain.endsWith('.' + official)
            )
        );
    }

    private result(isSafe: boolean, reason: string, signals: SafetyHeuristicResult['signals']): SafetyHeuristicResult {
        return { isSafe, reason, signals };
    }
}

export const SafeLinkHeuristic = new SafeLinkHeuristicService();
