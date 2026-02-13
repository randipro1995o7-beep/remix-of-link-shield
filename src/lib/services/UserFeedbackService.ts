/**
 * User Feedback Service
 * 
 * Tracks user feedback on link safety diagnoses.
 * When a user confirms a domain is safe multiple times (3+), 
 * the system learns and can auto-allow future visits.
 * 
 * Data structure per domain:
 * - safeCount: times user confirmed "this is safe" (opened + confirmed safe)
 * - unsafeCount: times user confirmed "this is dangerous" (cancelled + confirmed dangerous)
 * - lastFeedback: timestamp of last feedback
 * - autoTrusted: whether domain has been auto-promoted to trusted
 */

import { SecureLocalStorage } from '@/lib/storage/SecureLocalStorage';
import { logger } from '@/lib/utils/logger';

const STORAGE_KEY = 'user_domain_feedback';
const AUTO_TRUST_THRESHOLD = 3; // Confirm safe 3 times → auto-trust

export interface DomainFeedback {
    domain: string;
    safeCount: number;
    unsafeCount: number;
    lastFeedback: string; // ISO timestamp
    autoTrusted: boolean;
}

export type FeedbackType = 'safe' | 'unsafe';

interface FeedbackStore {
    [domain: string]: DomainFeedback;
}

class UserFeedbackServiceImpl {
    private cache: FeedbackStore | null = null;

    /**
     * Load feedback store from secure storage
     */
    private async load(): Promise<FeedbackStore> {
        if (this.cache) return this.cache;

        try {
            const stored = await SecureLocalStorage.getItem(STORAGE_KEY);
            this.cache = stored ? JSON.parse(stored) : {};
        } catch (error) {
            logger.error('UserFeedbackService: load failed', error);
            this.cache = {};
        }
        return this.cache!;
    }

    /**
     * Save feedback store to secure storage
     */
    private async save(): Promise<void> {
        if (!this.cache) return;
        try {
            await SecureLocalStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
        } catch (error) {
            logger.error('UserFeedbackService: save failed', error);
        }
    }

    /**
     * Record user feedback for a domain
     * Returns whether the domain was auto-promoted to trusted
     */
    async recordFeedback(domain: string, feedback: FeedbackType): Promise<{ autoTrusted: boolean }> {
        const store = await this.load();
        const lowerDomain = domain.toLowerCase();

        if (!store[lowerDomain]) {
            store[lowerDomain] = {
                domain: lowerDomain,
                safeCount: 0,
                unsafeCount: 0,
                lastFeedback: new Date().toISOString(),
                autoTrusted: false,
            };
        }

        const entry = store[lowerDomain];
        entry.lastFeedback = new Date().toISOString();

        if (feedback === 'safe') {
            entry.safeCount++;
            // Reset unsafe count when user says safe (they're correcting)
            if (entry.unsafeCount > 0 && entry.safeCount > entry.unsafeCount) {
                entry.unsafeCount = 0;
            }
        } else {
            entry.unsafeCount++;
            // If user says unsafe, remove auto-trust
            entry.autoTrusted = false;
            // Reset safe count
            if (entry.safeCount > 0 && entry.unsafeCount > entry.safeCount) {
                entry.safeCount = 0;
            }
        }

        // Auto-trust check: safe 3+ times AND never marked unsafe
        const wasAutoTrusted = entry.autoTrusted;
        if (entry.safeCount >= AUTO_TRUST_THRESHOLD && entry.unsafeCount === 0) {
            entry.autoTrusted = true;
        }

        await this.save();
        logger.info('UserFeedbackService: recorded', { domain: lowerDomain, feedback, safeCount: entry.safeCount, autoTrusted: entry.autoTrusted });

        return { autoTrusted: entry.autoTrusted && !wasAutoTrusted }; // true only on first auto-trust
    }

    /**
     * Check if domain is user-trusted (confirmed safe 3+ times)
     */
    async isUserTrusted(domain: string): Promise<boolean> {
        const store = await this.load();
        const entry = store[domain.toLowerCase()];
        return entry?.autoTrusted === true;
    }

    /**
     * Get feedback data for a domain (sync, uses cache)
     */
    getFeedbackSync(domain: string): DomainFeedback | null {
        if (!this.cache) return null;
        return this.cache[domain.toLowerCase()] || null;
    }

    /**
     * Get all domain feedback entries
     */
    async getAllFeedback(): Promise<DomainFeedback[]> {
        const store = await this.load();
        return Object.values(store);
    }

    /**
     * Clear all feedback data
     */
    async clear(): Promise<void> {
        this.cache = {};
        await this.save();
    }

    /**
     * Initialize cache (call on app startup)
     */
    async initialize(): Promise<void> {
        await this.load();
    }
}

export const UserFeedbackService = new UserFeedbackServiceImpl();
