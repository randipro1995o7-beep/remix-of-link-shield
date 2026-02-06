/**
 * Scam Domain Database
 * 
 * Database lokal domain penipuan yang dikenal.
 * Juga mendukung remote database untuk update tanpa app update.
 */

import {
    isKnownScamDomainRemote,
    getScamInfoRemote,
    hasRemoteData,
    getRemoteDatabaseInfo,
    initRemoteDatabase,
    syncDatabase,
    forceSyncDatabase,
} from './remoteScamDatabase';

export interface ScamDomainEntry {
    domain: string;
    category: ScamCategory;
    description?: string;
}

export type ScamCategory =
    | 'fake_bank'      // Bank palsu
    | 'lottery_scam'   // Undian/hadiah palsu
    | 'phishing'       // Mencuri kredensial
    | 'malware'        // Menyebarkan virus
    | 'crypto_scam'    // Penipuan crypto
    | 'shopping_scam'  // Toko online palsu
    | 'impersonation'  // Meniru website resmi
    | 'other';

// Database domain penipuan yang dikenal (LOCAL FALLBACK)
// Format: domain tanpa www. dan tanpa https://
const SCAM_DOMAINS: ScamDomainEntry[] = [
    // === FAKE BANKING (Indonesia) ===
    { domain: 'bri-undian.xyz', category: 'fake_bank' },
    { domain: 'bri-promo-hadiah.com', category: 'fake_bank' },
    { domain: 'bca-undian-gratis.com', category: 'fake_bank' },
    { domain: 'mandiri-hadiah.net', category: 'fake_bank' },
    { domain: 'bni-promo.xyz', category: 'fake_bank' },
    { domain: 'bank-bri-official.com', category: 'fake_bank' },
    { domain: 'bca-mobile-secure.com', category: 'fake_bank' },
    { domain: 'mandiri-online-login.com', category: 'fake_bank' },

    // === LOTTERY / PRIZE SCAMS ===
    { domain: 'menang-undian-gratis.com', category: 'lottery_scam' },
    { domain: 'claim-hadiah-now.xyz', category: 'lottery_scam' },
    { domain: 'pemenang-undian.com', category: 'lottery_scam' },
    { domain: 'undian-berhadiah-resmi.com', category: 'lottery_scam' },
    { domain: 'hadiah-gratis-2024.com', category: 'lottery_scam' },
    { domain: 'lucky-winner-prize.com', category: 'lottery_scam' },
    { domain: 'free-iphone-giveaway.com', category: 'lottery_scam' },

    // === E-WALLET SCAMS (Indonesia) ===
    { domain: 'dana-kaget-gratis.xyz', category: 'impersonation' },
    { domain: 'ovo-promo-cashback.com', category: 'impersonation' },
    { domain: 'gopay-hadiah.net', category: 'impersonation' },
    { domain: 'shopeepay-bonus.com', category: 'impersonation' },
    { domain: 'linkaja-promo.xyz', category: 'impersonation' },

    // === SOCIAL MEDIA PHISHING ===
    { domain: 'login-facebook-secure.com', category: 'phishing' },
    { domain: 'verify-whatsapp-account.net', category: 'phishing' },
    { domain: 'instagram-verify-account.com', category: 'phishing' },
    { domain: 'tiktok-login-verify.com', category: 'phishing' },
    { domain: 'telegram-security-check.com', category: 'phishing' },
    { domain: 'wa-security-update.com', category: 'phishing' },

    // === GOVERNMENT IMPERSONATION ===
    { domain: 'bansos-pemerintah.xyz', category: 'impersonation' },
    { domain: 'subsidi-blt.com', category: 'impersonation' },
    { domain: 'cek-bansos-2024.net', category: 'impersonation' },
    { domain: 'kemensos-bantuan.com', category: 'impersonation' },
    { domain: 'prakerja-daftar.xyz', category: 'impersonation' },

    // === SHOPPING SCAMS ===
    { domain: 'shopee-flash-sale.xyz', category: 'shopping_scam' },
    { domain: 'tokopedia-promo-gratis.com', category: 'shopping_scam' },
    { domain: 'lazada-diskon-90.com', category: 'shopping_scam' },
    { domain: 'bukalapak-sale.xyz', category: 'shopping_scam' },

    // === CRYPTO SCAMS ===
    { domain: 'bitcoin-giveaway-elon.com', category: 'crypto_scam' },
    { domain: 'crypto-double-profit.com', category: 'crypto_scam' },
    { domain: 'binance-airdrop-free.com', category: 'crypto_scam' },

    // === JOB SCAMS ===
    { domain: 'kerja-online-gaji-besar.com', category: 'other' },
    { domain: 'lowongan-kerja-mudah.xyz', category: 'other' },
    { domain: 'income-tambahan-jutaan.com', category: 'other' },
];

// Build a Set for fast lookup
const SCAM_DOMAIN_SET = new Set(SCAM_DOMAINS.map(entry => entry.domain.toLowerCase()));

// Build a Map for category lookup
const SCAM_DOMAIN_MAP = new Map<string, ScamDomainEntry>(
    SCAM_DOMAINS.map(entry => [entry.domain.toLowerCase(), entry])
);

/**
 * Check local database for domain
 */
function isKnownScamDomainLocal(domain: string): boolean {
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    // Exact match
    if (SCAM_DOMAIN_SET.has(normalizedDomain)) {
        return true;
    }

    // Check if it's a subdomain of a known scam domain
    const parts = normalizedDomain.split('.');
    for (let i = 1; i < parts.length; i++) {
        const parentDomain = parts.slice(i).join('.');
        if (SCAM_DOMAIN_SET.has(parentDomain)) {
            return true;
        }
    }

    return false;
}

/**
 * Get scam info from local database
 */
function getScamInfoLocal(domain: string): ScamDomainEntry | null {
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    // Exact match
    if (SCAM_DOMAIN_MAP.has(normalizedDomain)) {
        return SCAM_DOMAIN_MAP.get(normalizedDomain) || null;
    }

    // Check parent domains
    const parts = normalizedDomain.split('.');
    for (let i = 1; i < parts.length; i++) {
        const parentDomain = parts.slice(i).join('.');
        if (SCAM_DOMAIN_MAP.has(parentDomain)) {
            return SCAM_DOMAIN_MAP.get(parentDomain) || null;
        }
    }

    return null;
}

/**
 * Check if a domain is in the known scam database
 * Checks REMOTE first (if available), then falls back to LOCAL
 */
export function isKnownScamDomain(domain: string): boolean {
    // Check remote database first (if has data)
    if (hasRemoteData() && isKnownScamDomainRemote(domain)) {
        return true;
    }

    // Fall back to local database
    return isKnownScamDomainLocal(domain);
}

/**
 * Get scam information for a domain
 * Checks REMOTE first (if available), then falls back to LOCAL
 */
export function getScamInfo(domain: string): ScamDomainEntry | null {
    // Check remote database first (if has data)
    if (hasRemoteData()) {
        const remoteInfo = getScamInfoRemote(domain);
        if (remoteInfo) return remoteInfo;
    }

    // Fall back to local database
    return getScamInfoLocal(domain);
}

/**
 * Get human-readable category name
 */
export function getCategoryLabel(category: ScamCategory, lang: 'en' | 'id' = 'id'): string {
    const labels: Record<ScamCategory, { en: string; id: string }> = {
        fake_bank: { en: 'Fake Banking Site', id: 'Situs Bank Palsu' },
        lottery_scam: { en: 'Lottery/Prize Scam', id: 'Penipuan Undian/Hadiah' },
        phishing: { en: 'Phishing Attack', id: 'Serangan Phishing' },
        malware: { en: 'Malware Distribution', id: 'Penyebaran Malware' },
        crypto_scam: { en: 'Crypto Scam', id: 'Penipuan Crypto' },
        shopping_scam: { en: 'Fake Online Shop', id: 'Toko Online Palsu' },
        impersonation: { en: 'Impersonation', id: 'Penyamaran Situs Resmi' },
        other: { en: 'Known Scam', id: 'Penipuan Teridentifikasi' },
    };

    return labels[category]?.[lang] || labels.other[lang];
}

/**
 * Get database version/date for display
 * Shows combined info from remote + local
 */
export function getDatabaseInfo(): {
    version: string;
    lastUpdated: string;
    totalDomains: number;
    source: 'remote' | 'local';
} {
    const remoteInfo = getRemoteDatabaseInfo();

    if (remoteInfo.isRemote && remoteInfo.totalDomains > 0) {
        return {
            version: remoteInfo.version,
            lastUpdated: remoteInfo.lastUpdated,
            totalDomains: remoteInfo.totalDomains + SCAM_DOMAINS.length,
            source: 'remote',
        };
    }

    return {
        version: '1.0.0',
        lastUpdated: '2026-02-04',
        totalDomains: SCAM_DOMAINS.length,
        source: 'local',
    };
}

// Re-export remote database functions
export {
    initRemoteDatabase,
    syncDatabase,
    forceSyncDatabase,
    getRemoteDatabaseInfo,
};

