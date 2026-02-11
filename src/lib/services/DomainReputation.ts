/**
 * Domain Reputation Service
 * 
 * Uses a curated list of top domains (based on Tranco Top Sites ranking)
 * to provide reputation scoring. Domains in the top list get a reputation
 * boost that reduces their PhishGuard score, helping prevent false positives
 * on popular sites.
 * 
 * The list is maintained locally for offline operation and fast lookups.
 */

import { logger } from '@/lib/utils/logger';

export type ReputationTier = 'top-100' | 'top-1000' | 'top-10000' | 'unknown';

export interface DomainReputationResult {
    /** The queried domain */
    domain: string;
    /** Reputation tier based on ranking */
    tier: ReputationTier;
    /** Score reduction to apply (negative = reduces suspicion) */
    scoreAdjustment: number;
    /** Whether domain was found in the reputation database */
    isKnown: boolean;
}

// Top 100 most popular domains (based on Tranco ranking)
const TOP_100_DOMAINS = new Set([
    'google.com', 'youtube.com', 'facebook.com', 'microsoft.com', 'apple.com',
    'amazon.com', 'netflix.com', 'instagram.com', 'linkedin.com', 'twitter.com',
    'x.com', 'whatsapp.com', 'wikipedia.org', 'reddit.com', 'yahoo.com',
    'tiktok.com', 'bing.com', 'live.com', 'office.com', 'outlook.com',
    'github.com', 'stackoverflow.com', 'medium.com', 'wordpress.com', 'wordpress.org',
    'adobe.com', 'spotify.com', 'twitch.tv', 'discord.com', 'pinterest.com',
    'paypal.com', 'ebay.com', 'dropbox.com', 'salesforce.com', 'zoom.us',
    'slack.com', 'notion.so', 'figma.com', 'canva.com', 'cloudflare.com',
    'amazonaws.com', 'icloud.com', 'telegram.org', 'signal.org', 'whatsapp.net',
    'vimeo.com', 'dailymotion.com', 'quora.com', 'tumblr.com', 'flickr.com',
    'bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com', 'theguardian.com',
    'reuters.com', 'bloomberg.com', 'washingtonpost.com', 'wsj.com', 'forbes.com',
    'msn.com', 'aol.com', 'indeed.com', 'glassdoor.com', 'zillow.com',
    'booking.com', 'airbnb.com', 'tripadvisor.com', 'expedia.com', 'uber.com',
    'lyft.com', 'doordash.com', 'grubhub.com', 'walmart.com', 'target.com',
    'bestbuy.com', 'homedepot.com', 'lowes.com', 'costco.com', 'etsy.com',
    'shopify.com', 'stripe.com', 'squarespace.com', 'wix.com', 'godaddy.com',
    'namecheap.com', 'bluehost.com', 'digitalocean.com', 'heroku.com', 'netlify.com',
    'vercel.com', 'firebase.google.com', 'heroku.com', 'docker.com', 'kubernetes.io',
    'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com', 'oracle.com', 'ibm.com',
]);

// Additional top 1000 domains (Indonesian + international popular sites)
const TOP_1000_DOMAINS = new Set([
    // Indonesian popular
    'tokopedia.com', 'shopee.co.id', 'bukalapak.com', 'lazada.co.id',
    'gojek.com', 'grab.com', 'traveloka.com', 'tiket.com',
    'detik.com', 'kompas.com', 'tribunnews.com', 'liputan6.com', 'cnnindonesia.com',
    'kumparan.com', 'tempo.co', 'suara.com', 'okezone.com', 'sindonews.com',
    'antaranews.com', 'republika.co.id', 'viva.co.id', 'merdeka.com',
    'bca.co.id', 'bri.co.id', 'bankmandiri.co.id', 'bni.co.id',
    'dana.id', 'gopay.co.id', 'ovo.id', 'linkaja.co.id',
    'ruangguru.com', 'zenius.net', 'brainly.co.id',
    'telkomsel.com', 'indosat.com', 'xl.co.id', 'smartfren.com',
    'kaskus.co.id', 'idntimes.com', 'grid.id', 'dream.co.id',
    // International popular (not in top 100)
    'samsung.com', 'huawei.com', 'xiaomi.com', 'oppo.com', 'vivo.com',
    'sony.com', 'lg.com', 'dell.com', 'hp.com', 'lenovo.com',
    'intel.com', 'amd.com', 'nvidia.com', 'qualcomm.com',
    'visa.com', 'mastercard.com', 'americanexpress.com',
    'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com',
    'hsbc.com', 'barclays.com', 'goldmansachs.com',
    'att.com', 'verizon.com', 'tmobile.com', 'sprint.com',
    'nike.com', 'adidas.com', 'puma.com', 'underarmour.com',
    'coca-cola.com', 'pepsi.com', 'mcdonalds.com', 'starbucks.com',
    'tesla.com', 'ford.com', 'toyota.com', 'honda.com', 'bmw.com',
    'mercedes-benz.com', 'audi.com', 'volkswagen.com',
    'nfl.com', 'nba.com', 'mlb.com', 'fifa.com', 'espn.com',
    'imdb.com', 'rottentomatoes.com', 'metacritic.com',
    'stackoverflow.com', 'gitlab.com', 'bitbucket.org', 'npmjs.com',
    'pypi.org', 'maven.org', 'nuget.org', 'rubygems.org',
    'w3.org', 'w3schools.com', 'mdn.io', 'developer.mozilla.org',
    'docs.google.com', 'drive.google.com', 'mail.google.com', 'maps.google.com',
    'play.google.com', 'music.youtube.com',
    'web.whatsapp.com', 'web.telegram.org',
]);

class DomainReputationService {
    /**
     * Get the reputation of a domain
     */
    getReputation(domain: string): DomainReputationResult {
        const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

        // Check top 100 first
        if (this.isInSet(normalizedDomain, TOP_100_DOMAINS)) {
            return {
                domain: normalizedDomain,
                tier: 'top-100',
                scoreAdjustment: -20, // Significant reduction
                isKnown: true,
            };
        }

        // Check top 1000
        if (this.isInSet(normalizedDomain, TOP_1000_DOMAINS)) {
            return {
                domain: normalizedDomain,
                tier: 'top-1000',
                scoreAdjustment: -10, // Moderate reduction
                isKnown: true,
            };
        }

        // Unknown domain
        return {
            domain: normalizedDomain,
            tier: 'unknown',
            scoreAdjustment: 0,
            isKnown: false,
        };
    }

    /**
     * Check if a domain or its parent domain is in a set
     * e.g., "mail.google.com" would match "google.com"
     */
    private isInSet(domain: string, domainSet: Set<string>): boolean {
        // Exact match
        if (domainSet.has(domain)) return true;

        // Check parent domains (subdomain matching)
        const parts = domain.split('.');
        for (let i = 1; i < parts.length - 1; i++) {
            const parent = parts.slice(i).join('.');
            if (domainSet.has(parent)) return true;
        }

        return false;
    }

    /**
     * Get total number of domains in the reputation database
     */
    getDatabaseSize(): number {
        return TOP_100_DOMAINS.size + TOP_1000_DOMAINS.size;
    }
}

export default new DomainReputationService();
