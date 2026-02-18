import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';
import { firebaseDb, AuthService } from '@/lib/services/AuthService';
import { SecureLocalStorage } from '@/lib/storage/SecureLocalStorage';
import { logger } from '@/lib/utils/logger';

const VOTES_STORAGE_KEY = 'user_reputation_votes';
const COLLECTION_NAME = 'domain_reputation';

export interface ReputationScore {
    score: number; // 0-100
    totalVotes: number;
    label: 'Very Safe' | 'Safe' | 'Neutral' | 'Suspicious' | 'Dangerous';
    vote: 'safe' | 'unsafe' | null; // User's own vote
}

interface FirestoreReputationData {
    domain: string;
    safeVotes: number;
    unsafeVotes: number;
    totalVotes: number;
    lastUpdated: any;
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
     * Get real reputation score from Firestore
     */
    async getReputation(domain: string): Promise<ReputationScore> {
        const lowerDomain = domain.toLowerCase();

        // 1. Check local user vote
        const userVote = this.userVotes[lowerDomain] || null;

        // 2. Fetch aggregate data from Firestore
        let safeVotes = 0;
        let unsafeVotes = 0;
        let totalVotes = 0;

        try {
            const docRef = doc(firebaseDb, COLLECTION_NAME, lowerDomain);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as FirestoreReputationData;
                safeVotes = data.safeVotes || 0;
                unsafeVotes = data.unsafeVotes || 0;
                totalVotes = data.totalVotes || 0;
            }
        } catch (error) {
            logger.warn('Failed to fetch reputation from Firestore, using local/mock fallback', error);
            // Fallback to purely local knowledge if offline
            if (userVote === 'safe') { safeVotes = 1; totalVotes = 1; }
            if (userVote === 'unsafe') { unsafeVotes = 1; totalVotes = 1; }
        }

        // 3. Calculate Score (Wilson Score Interval is better, but simple ratio for now)
        // Default to 50 (Neutral) if no votes
        let score = 50;

        if (totalVotes > 0) {
            const ratio = safeVotes / totalVotes;
            score = Math.round(ratio * 100);
        }

        return {
            score,
            totalVotes,
            label: this.getLabel(score),
            vote: userVote,
        };
    }

    /**
     * Submit a vote to Firestore
     */
    async submitVote(domain: string, vote: 'safe' | 'unsafe'): Promise<ReputationScore> {
        const lowerDomain = domain.toLowerCase();
        const previousVote = this.userVotes[lowerDomain];

        // If already voted same way, ignore
        if (previousVote === vote) {
            return this.getReputation(domain);
        }

        // Optimistic UI update locally
        this.userVotes[lowerDomain] = vote;
        await this.saveLocalVotes();

        try {
            const docRef = doc(firebaseDb, COLLECTION_NAME, lowerDomain);

            await runTransaction(firebaseDb, async (transaction) => {
                const sfDoc = await transaction.get(docRef);

                if (!sfDoc.exists()) {
                    // Create new document
                    transaction.set(docRef, {
                        domain: lowerDomain,
                        safeVotes: vote === 'safe' ? 1 : 0,
                        unsafeVotes: vote === 'unsafe' ? 1 : 0,
                        totalVotes: 1,
                        lastUpdated: serverTimestamp()
                    });
                } else {
                    // Update existing
                    const data = sfDoc.data() as FirestoreReputationData;
                    let newSafe = data.safeVotes || 0;
                    let newUnsafe = data.unsafeVotes || 0;
                    let newTotal = data.totalVotes || 0;

                    // Remove previous vote if exists
                    if (previousVote === 'safe') { newSafe--; newTotal--; }
                    if (previousVote === 'unsafe') { newUnsafe--; newTotal--; }

                    // Add new vote
                    if (vote === 'safe') { newSafe++; newTotal++; }
                    if (vote === 'unsafe') { newUnsafe++; newTotal++; }

                    transaction.update(docRef, {
                        safeVotes: newSafe,
                        unsafeVotes: newUnsafe,
                        totalVotes: newTotal,
                        lastUpdated: serverTimestamp()
                    });
                }
            });

            logger.info(`Vote submitted for ${domain}: ${vote}`);

        } catch (error) {
            logger.error('Failed to submit vote to Firestore', error);
            // We revert local vote? Or keep it and retry? 
            // For now, keep local optimistic state.
        }

        return this.getReputation(domain);
    }

    private async saveLocalVotes() {
        try {
            await SecureLocalStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(this.userVotes));
        } catch (e) {
            logger.error('Failed to save reputation votes locally', e);
        }
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
