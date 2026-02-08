export interface PhishGuardResult {
    score: number; // 0-100
    isSuspicious: boolean;
    reasons: string[];
    details: {
        brandImpersonationScore: number;
        tldScore: number;
        structureScore: number;
        keywordScore: number;
    };
}

interface Brand {
    name: string;
    officialDomains: string[];
    keywords: string[]; // Variations to look for
}

const KNOWN_BRANDS: Brand[] = [
    {
        name: 'BCA',
        officialDomains: ['bca.co.id', 'klikbca.com', 'klikbca.co.id', 'mybca.bca.co.id'],
        keywords: ['bca', 'klikbca', 'mybca']
    },
    {
        name: 'BRI',
        officialDomains: ['bri.co.id', 'ib.bri.co.id', 'brimo.bri.co.id'],
        keywords: ['bri', 'brimo', 'bankbri']
    },
    {
        name: 'Mandiri',
        officialDomains: ['bankmandiri.co.id', 'mandirinline.com', 'livin.bankmandiri.co.id'],
        keywords: ['mandiri', 'livin', 'bankmandiri']
    },
    {
        name: 'BNI',
        officialDomains: ['bni.co.id', 'ib.bni.co.id'],
        keywords: ['bni', 'bankbni']
    },
    {
        name: 'DANA',
        officialDomains: ['dana.id', 'dana.com'],
        keywords: ['dana', 'danaid']
    },
    {
        name: 'GoJek',
        officialDomains: ['gojek.com', 'gopay.co.id'],
        keywords: ['gojek', 'gopay']
    },
    {
        name: 'Shopee',
        officialDomains: ['shopee.co.id', 'shopee.com'],
        keywords: ['shopee', 'shopeepay']
    },
    {
        name: 'Tokopedia',
        officialDomains: ['tokopedia.com'],
        keywords: ['tokopedia']
    },
    {
        name: 'Google',
        officialDomains: ['google.com', 'google.co.id', 'gmail.com', 'accounts.google.com'],
        keywords: ['google', 'gmail']
    },
    {
        name: 'Facebook',
        officialDomains: ['facebook.com', 'fb.com'],
        keywords: ['facebook', 'fb']
    },
    {
        name: 'Instagram',
        officialDomains: ['instagram.com'],
        keywords: ['instagram', 'ig']
    },
    {
        name: 'WhatsApp',
        officialDomains: ['whatsapp.com', 'wa.me'],
        keywords: ['whatsapp']
    },
    {
        name: 'SatuSehat',
        officialDomains: ['satusehat.kemkes.go.id', 'pedulilindungi.id'],
        keywords: ['satusehat', 'pedulilindungi']
    },
    // Global Brands
    {
        name: 'PayPal',
        officialDomains: ['paypal.com', 'paypal.me'],
        keywords: ['paypal']
    },
    {
        name: 'Netflix',
        officialDomains: ['netflix.com'],
        keywords: ['netflix']
    },
    {
        name: 'Microsoft',
        officialDomains: ['microsoft.com', 'live.com', 'office.com', 'outlook.com'],
        keywords: ['microsoft', 'office365', 'outlook']
    },
    {
        name: 'Apple',
        officialDomains: ['apple.com', 'icloud.com'],
        keywords: ['apple', 'icloud', 'itunes']
    },
    {
        name: 'Amazon',
        officialDomains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.co.jp'],
        keywords: ['amazon', 'prime']
    },
    {
        name: 'DHL',
        officialDomains: ['dhl.com'],
        keywords: ['dhl', 'delivery']
    },
    {
        name: 'FedEx',
        officialDomains: ['fedex.com'],
        keywords: ['fedex']
    }
];

const RISKY_TLDS = [
    '.xyz', '.top', '.icu', '.link', '.tk', '.ga', '.cf', '.ml', '.cn',
    '.bd', '.pk', '.ke', '.ng', '.buzz', '.work', '.surf', '.cam', '.bar',
    '.rest', '.wiki', '.live', '.monster', '.gq', '.cc', '.ru', '.ir',
    '.info', '.net', '.org', // Sometimes abused, but maybe too broad? Keeping for now based on risk profiling.
    '.biz', '.club', '.vip', '.pro'
];

const SUSPICIOUS_KEYWORDS = [
    // ID Keywords
    'login', 'signin', 'verify', 'verifikasi', 'update', 'secure', 'account',
    'akun', 'banking', 'promo', 'hadiah', 'undian', 'bonus', 'claim', 'klaim',
    'winner', 'pemenang', 'alert', 'warning', 'confirm', 'konfirmasi',
    'password', 'credential', 'wallet', 'dompet', 'free', 'gratis',

    // Global/English Keywords
    'auth', 'authenticate', 'billing', 'invoice', 'payment', 'pay',
    'support', 'service', 'security', 'suspended', 'locked', 'unlock',
    'mobile', 'validation', 'check', 'notification', 'urgent', 'limited',
    'offer', 'server', 'admin', 'recover', 'restore'
];

class PhishGuardService {
    private static readonly BRAND_SCORE_MAX = 40;
    private static readonly TLD_SCORE_MAX = 20;
    private static readonly STRUCTURE_SCORE_MAX = 20;
    private static readonly KEYWORD_SCORE_MAX = 20;
    private static readonly SUSPICIOUS_THRESHOLD = 40; // Total score > 40 means suspicious

    /**
     * Calculates Levenshtein distance between two strings
     */
    private levenshtein(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // increment along the first column of each row
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // increment each column in the first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1 // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Checks if a string is physically close to another (Typosquatting)
     * e.g., 'g00gle' vs 'google'
     */
    private isTyposquatting(domain: string, keyword: string): boolean {
        // 1. Check if keyword is contained but surrounded by suspicious characters
        // e.g. bca-promo containing bca
        if (domain.includes(keyword)) return true;

        // 2. Check Levenshtein distance for close matches
        // Max distance allowed typically 1 or 2 for short words
        const distance = this.levenshtein(domain, keyword);
        if (distance > 0 && distance <= 2 && keyword.length > 3) {
            return true;
        }

        // 3. Simple character replacement checks (homoglyphs)
        // 0 -> o, 1 -> l, etc.
        const normalized = domain
            .replace(/0/g, 'o')
            .replace(/1/g, 'l')
            .replace(/3/g, 'e')
            .replace(/4/g, 'a')
            .replace(/@/g, 'a')
            .replace(/5/g, 's')
            .replace(/7/g, 't');

        if (normalized.includes(keyword)) return true;

        return false;
    }

    public analyzeUrl(urlStr: string): PhishGuardResult {
        let score = 0;
        const reasons: string[] = [];
        let domain = '';
        let urlObj: URL | null = null;
        let pathAndQuery = '';

        // 1. Basic Parsing
        try {
            // Handle URLs without protocol
            const fullUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
            urlObj = new URL(fullUrl);
            domain = urlObj.hostname.toLowerCase();
            pathAndQuery = (urlObj.pathname + urlObj.search).toLowerCase();
        } catch (e) {
            // If invalid URL, high suspicion
            return {
                score: 100,
                isSuspicious: true,
                reasons: ['Invalid URL Structure'],
                details: {
                    brandImpersonationScore: 0,
                    tldScore: 0,
                    structureScore: 0,
                    keywordScore: 0
                }
            };
        }

        // 2. Brand Impersonation Check (0-40)
        let brandScore = 0;
        for (const brand of KNOWN_BRANDS) {
            // Skip if it IS an official domain
            const isOfficial = brand.officialDomains.some(official =>
                domain === official || domain.endsWith('.' + official)
            );

            if (isOfficial) {
                // Safe brand, negative score to help trusted sites? 
                // Or just stop checking brands.
                // Let's just ensure we don't flag it as impersonation.
                continue;
            }

            // Check keywords against domain
            for (const keyword of brand.keywords) {
                if (this.isTyposquatting(domain, keyword)) {
                    brandScore = PhishGuardService.BRAND_SCORE_MAX;
                    reasons.push(`Potential impersonation of ${brand.name} detected`);
                    break; // Stop checking keywords for this brand
                }
            }
            if (brandScore > 0) break; // Stop checking other brands if one is found
        }
        score += brandScore;


        // 3. TLD Reputation Check (0-20)
        let tldScore = 0;
        const isRiskyTld = RISKY_TLDS.some(tld => domain.endsWith(tld));
        if (isRiskyTld) {
            tldScore = PhishGuardService.TLD_SCORE_MAX;
            reasons.push('Uses a high-risk Top Level Domain (TLD)');
        }
        score += tldScore;


        // 4. Structure & Complexity Check (0-20)
        let structureScore = 0;

        // Check for IP address
        const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
        if (isIpAddress) {
            structureScore += 20;
            reasons.push('Uses raw IP address instead of domain name');
        } else {
            // Count subdomains (dots)
            // e.g. www.google.com -> 2 dots. sub1.sub2.google.com -> 4 dots.
            const dotCount = (domain.match(/\./g) || []).length;
            if (dotCount > 3) {
                structureScore += 10;
                reasons.push('Excessive number of subdomains');
            }

            // Count hyphens
            const hyphenCount = (domain.match(/-/g) || []).length;
            if (hyphenCount > 2) {
                structureScore += 10;
                reasons.push('Excessive use of hyphens in domain');
            }
        }
        score += Math.min(structureScore, PhishGuardService.STRUCTURE_SCORE_MAX);


        // 5. Suspicious Keywords Check (0-20)
        let keywordScore = 0;
        // Check both domain and path/query
        const textToCheck = domain + pathAndQuery;
        let foundKeywords = 0;

        for (const kw of SUSPICIOUS_KEYWORDS) {
            if (textToCheck.includes(kw)) {
                foundKeywords++;
                if (foundKeywords <= 2) { // Cap at reasonable number for reporting
                    // reasons.push(`Contains suspicious keyword: '${kw}'`);
                }
            }
        }

        if (foundKeywords > 0) {
            keywordScore = Math.min(foundKeywords * 10, PhishGuardService.KEYWORD_SCORE_MAX);
            reasons.push(`Contains ${foundKeywords} suspicious security-related keywords`);
        }
        score += keywordScore;


        // Final Result Compilation
        return {
            score,
            isSuspicious: score >= PhishGuardService.SUSPICIOUS_THRESHOLD,
            reasons,
            details: {
                brandImpersonationScore: brandScore,
                tldScore,
                structureScore: Math.min(structureScore, PhishGuardService.STRUCTURE_SCORE_MAX),
                keywordScore
            }
        };
    }
}

export default new PhishGuardService();
