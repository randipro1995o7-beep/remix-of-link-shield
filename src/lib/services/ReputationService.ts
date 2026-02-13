import { SecureLocalStorage } from '@/lib/storage/SecureLocalStorage';
import { logger } from '@/lib/utils/logger';

const VOTES_STORAGE_KEY = 'user_reputation_votes';

export interface ReputationScore {
    score: number; // 0-100
    totalVotes: number;
    label: 'Very Safe' | 'Safe' | 'Neutral' | 'Suspicious' | 'Dangerous';
    vote: 'safe' | 'unsafe' | null; // User's own vote
}

class ReputationServiceImpl {
    private userVotes: Record<string, 'safe' | 'unsafe'> = {};

    async initialize() {
        try {
            const stored = await SecureLocalStorage.getItem(VOTES_STORAGE_KEY);
            if (stored) {
                this.userVotes = JSON.parse(stored);
            }
        } catch (e) {
            logger.error('Failed to load reputation votes', e);
        }
    }

    /**
     * Get reputation score for a domain
     * Mocks a backend by generating a deterministic score based on domain name hash
     * unless it's a known popular domain.
     */
    async getReputation(domain: string): Promise<ReputationScore> {
        const lowerDomain = domain.toLowerCase();

        // Check if user has voted locally
        const userVote = this.userVotes[lowerDomain] || null;

        // Mock data generation
        let baseScore = 50;
        let baseVotes = 10;

        // Known popular domains (Mock DB)
        const popularDomains = [
            'google.com', 'facebook.com', 'youtube.com', 'twitter.com', 'instagram.com',
            'wikipedia.org', 'amazon.com', 'microsoft.com', 'apple.com', 'linkedin.com',
            'netflix.com', 'whatsapp.com', 'zoom.us', 'github.com'
        ];

        if (popularDomains.some(d => lowerDomain.endsWith(d))) {
            baseScore = 95 + (domain.length % 5); // 95-99
            baseVotes = 10000 + (domain.length * 100);
        } else {
            // Deterministic pseudo-random score for others
            let hash = 0;
            for (let i = 0; i < lowerDomain.length; i++) {
                hash = lowerDomain.charCodeAt(i) + ((hash << 5) - hash);
            }
            // Normalize to 30-70 range for unknown sites (neutral/uncertain)
            baseScore = 30 + (Math.abs(hash) % 40);
            baseVotes = Math.abs(hash) % 50;
        }

        // Adjust score based on user vote (immediate feedback)
        if (userVote === 'safe') {
            baseVotes++;
            // If few votes, user vote has impact
            if (baseVotes < 100) baseScore = Math.min(100, baseScore + 5);
        } else if (userVote === 'unsafe') {
            baseVotes++;
            if (baseVotes < 100) baseScore = Math.max(0, baseScore - 10);
        }

        return {
            score: baseScore,
            totalVotes: baseVotes,
            label: this.getLabel(baseScore),
            vote: userVote,
        };
    }

    async submitVote(domain: string, vote: 'safe' | 'unsafe'): Promise<ReputationScore> {
        const lowerDomain = domain.toLowerCase();

        // Save locally
        this.userVotes[lowerDomain] = vote;
        try {
            await SecureLocalStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(this.userVotes));
        } catch (e) {
            logger.error('Failed to save reputation vote', e);
        }

        // Return updated score
        return this.getReputation(domain);
    }

    private getLabel(score: number): ReputationScore['label'] {
        if (score >= 90) return 'Very Safe';
        if (score >= 70) return 'Safe';
        if (score >= 40) return 'Neutral';
        if (score >= 20) return 'Suspicious';
        return 'Dangerous';
    }
}

export const ReputationService = new ReputationServiceImpl();
