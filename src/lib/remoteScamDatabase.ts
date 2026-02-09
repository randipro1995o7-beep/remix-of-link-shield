/**
 * Remote Scam Database Service
 * 
 * Fetches updated scam database from GitHub and caches locally.
 * This allows updating the database without requiring app updates.
 */

import { Preferences } from '@capacitor/preferences';
import { ScamDomainEntry, ScamCategory } from './scamDatabase';
import { logger } from '@/lib/utils/logger';
import { secureFetch } from '@/lib/utils/network';

// GitHub raw URL for remote database
// Create a public repo and host scam-database.json there
// Example: https://raw.githubusercontent.com/YOUR_USERNAME/safetyshield-data/main/scam-database.json
const REMOTE_DATABASE_URL = 'https://raw.githubusercontent.com/safetyshield-app/scam-database/main/scam-database.json';

// Storage keys
const STORAGE_KEYS = {
    CACHED_DATABASE: 'ss_scam_db_cache',
    LAST_SYNC: 'ss_scam_db_last_sync',
    DATABASE_VERSION: 'ss_scam_db_version',
};

// Sync interval: 6 hours (in milliseconds)
const SYNC_INTERVAL = 6 * 60 * 60 * 1000;

export interface RemoteDatabaseInfo {
    version: string;
    lastUpdated: string;
    totalDomains: number;
    isRemote: boolean;
    lastSyncTime: Date | null;
}

export interface RemoteDatabase {
    version: string;
    lastUpdated: string;
    domains: ScamDomainEntry[];
}

// In-memory cache for fast access
let cachedDomains: ScamDomainEntry[] = [];
let cachedDomainSet: Set<string> = new Set();
let cachedDomainMap: Map<string, ScamDomainEntry> = new Map();
let lastSyncTime: Date | null = null;
let databaseVersion: string = 'local';

/**
 * Initialize the remote database service
 * Called on app startup
 */
export async function initRemoteDatabase(): Promise<void> {
    try {
        // Load cached database first
        await loadCachedDatabase();

        // Check if we need to sync
        const shouldSync = await shouldSyncDatabase();
        if (shouldSync) {
            // Sync in background, don't block startup
            syncDatabase().catch(err => {
                logger.warn('Background database sync failed', err);
            });
        }
    } catch (error) {
        logger.error('Failed to initialize remote database', error);
    }
}

/**
 * Load cached database from local storage
 */
async function loadCachedDatabase(): Promise<void> {
    try {
        const { value: cachedData } = await Preferences.get({ key: STORAGE_KEYS.CACHED_DATABASE });
        const { value: syncTimeStr } = await Preferences.get({ key: STORAGE_KEYS.LAST_SYNC });
        const { value: version } = await Preferences.get({ key: STORAGE_KEYS.DATABASE_VERSION });

        if (cachedData) {
            const domains: ScamDomainEntry[] = JSON.parse(cachedData);
            updateInMemoryCache(domains);
        }

        if (syncTimeStr) {
            lastSyncTime = new Date(syncTimeStr);
        }

        if (version) {
            databaseVersion = version;
        }
    } catch (error) {
        logger.error('Failed to load cached database', error);
    }
}

/**
 * Update in-memory cache with domain list
 */
function updateInMemoryCache(domains: ScamDomainEntry[]): void {
    cachedDomains = domains;
    cachedDomainSet = new Set(domains.map(d => d.domain.toLowerCase()));
    cachedDomainMap = new Map(domains.map(d => [d.domain.toLowerCase(), d]));
}

/**
 * Check if we should sync the database
 */
async function shouldSyncDatabase(): Promise<boolean> {
    if (!lastSyncTime) return true;

    const timeSinceSync = Date.now() - lastSyncTime.getTime();
    return timeSinceSync > SYNC_INTERVAL;
}

/**
 * Sync database from remote server
 */
export async function syncDatabase(): Promise<{ success: boolean; newDomains?: number; error?: string }> {
    try {
        logger.info('Syncing scam database from remote...');

        // Use secure fetch with timeout and retry
        const response = await secureFetch(REMOTE_DATABASE_URL, {
            timeout: 15000, // 15 seconds for large database
            retries: 2, // Retry twice on failure
            headers: {
                'Accept': 'application/json',
            },
            onRetry: (attempt, error) => {
                logger.warn(`Database sync retry attempt ${attempt}`, { error: error.message });
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: RemoteDatabase = await response.json();

        // Validate data structure
        if (!data.domains || !Array.isArray(data.domains)) {
            throw new Error('Invalid database format');
        }

        // Update cache
        updateInMemoryCache(data.domains);

        // Save to local storage
        await Preferences.set({
            key: STORAGE_KEYS.CACHED_DATABASE,
            value: JSON.stringify(data.domains),
        });

        await Preferences.set({
            key: STORAGE_KEYS.LAST_SYNC,
            value: new Date().toISOString(),
        });

        await Preferences.set({
            key: STORAGE_KEYS.DATABASE_VERSION,
            value: data.version,
        });

        lastSyncTime = new Date();
        databaseVersion = data.version;

        logger.info(`Database synced: ${data.domains.length} domains, version ${data.version}`);

        return { success: true, newDomains: data.domains.length };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Database sync failed', { error: errMsg });
        return { success: false, error: errMsg };
    }
}

/**
 * Force sync database (user-triggered)
 */
export async function forceSyncDatabase(): Promise<{ success: boolean; newDomains?: number; error?: string }> {
    return syncDatabase();
}

/**
 * Check if a domain is in the remote database
 * Falls back to empty if no data loaded
 */
export function isKnownScamDomainRemote(domain: string): boolean {
    if (cachedDomainSet.size === 0) return false;

    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    // Exact match
    if (cachedDomainSet.has(normalizedDomain)) {
        return true;
    }

    // Check subdomains
    const parts = normalizedDomain.split('.');
    for (let i = 1; i < parts.length; i++) {
        const parentDomain = parts.slice(i).join('.');
        if (cachedDomainSet.has(parentDomain)) {
            return true;
        }
    }

    return false;
}

/**
 * Get scam info from remote database
 */
export function getScamInfoRemote(domain: string): ScamDomainEntry | null {
    if (cachedDomainMap.size === 0) return null;

    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    // Exact match
    if (cachedDomainMap.has(normalizedDomain)) {
        return cachedDomainMap.get(normalizedDomain) || null;
    }

    // Check parent domains
    const parts = normalizedDomain.split('.');
    for (let i = 1; i < parts.length; i++) {
        const parentDomain = parts.slice(i).join('.');
        if (cachedDomainMap.has(parentDomain)) {
            return cachedDomainMap.get(parentDomain) || null;
        }
    }

    return null;
}

/**
 * Get remote database info
 */
export function getRemoteDatabaseInfo(): RemoteDatabaseInfo {
    return {
        version: databaseVersion,
        lastUpdated: lastSyncTime?.toISOString().split('T')[0] || 'Never',
        totalDomains: cachedDomains.length,
        isRemote: cachedDomains.length > 0,
        lastSyncTime,
    };
}

/**
 * Check if remote database has data
 */
export function hasRemoteData(): boolean {
    return cachedDomains.length > 0;
}
