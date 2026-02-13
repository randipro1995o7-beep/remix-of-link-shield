import DomainReputation from './DomainReputation';
import { PhishingModel } from '../ml/PhishingModel';

export type ThreatLevel = 'safe' | 'warning' | 'danger';

export interface PhishGuardResult {
    score: number; // 0-100
    isSuspicious: boolean;
    threatLevel: ThreatLevel;
    reasons: string[];
    details: {
        brandImpersonationScore: number;
        tldScore: number;
        structureScore: number;
        keywordScore: number;
        pathAnalysisScore: number;
        mlScore: number;
    };
}

interface Brand {
    name: string;
    officialDomains: string[];
    keywords: string[]; // Variations to look for
}

export const KNOWN_BRANDS: Brand[] = [
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
        keywords: ['mandiri', 'bankmandiri']
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
        keywords: ['facebook']
    },
    {
        name: 'Instagram',
        officialDomains: ['instagram.com'],
        keywords: ['instagram']
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
        keywords: ['amazon']
    },
    {
        name: 'DHL',
        officialDomains: ['dhl.com'],
        keywords: ['dhl']
    },
    {
        name: 'FedEx',
        officialDomains: ['fedex.com'],
        keywords: ['fedex']
    }
];

// High-risk TLDs strongly associated with phishing/scam
const RISKY_TLDS = [
    '.xyz', '.top', '.icu', '.link', '.tk', '.ga', '.cf', '.ml', '.cn',
    '.bd', '.pk', '.ke', '.ng', '.buzz', '.work', '.surf', '.cam', '.bar',
    '.rest', '.wiki', '.live', '.monster', '.gq', '.cc', '.ru', '.ir',
    '.biz', '.club', '.vip', '.pro'
];

// Common/safe TLDs that should not add risk on their own
const SAFE_TLDS = [
    '.com', '.co.id', '.go.id', '.ac.id', '.id', '.org', '.net', '.edu',
    '.gov', '.co', '.io', '.app', '.dev', '.me'
];

// --- Tiered keyword system ---
// High-weight keywords: strongly associated with phishing (15 pts each, max 2 counted)
const HIGH_WEIGHT_KEYWORDS = [
    'login', 'signin', 'verify', 'verifikasi', 'password', 'credential',
    'undian', 'hadiah', 'winner', 'pemenang', 'suspended', 'locked',
    'unlock', 'urgent', 'gratis', 'free'
];

// Low-weight keywords: commonly appear in legitimate sites too (5 pts each, max 2 counted)
const LOW_WEIGHT_KEYWORDS = [
    'update', 'secure', 'account', 'akun', 'banking', 'promo', 'bonus',
    'claim', 'klaim', 'alert', 'warning', 'confirm', 'konfirmasi',
    'wallet', 'dompet', 'auth', 'authenticate', 'billing', 'invoice',
    'payment', 'support', 'service', 'security', 'validation',
    'notification', 'limited', 'offer', 'recover', 'restore'
];

// --- Unicode Confusables Map ---
// Maps visually-similar Unicode characters to their ASCII equivalents
const UNICODE_CONFUSABLES: Record<string, string> = {
    // Cyrillic lookalikes
    '\u0430': 'a', // а (Cyrillic)
    '\u0435': 'e', // е (Cyrillic)
    '\u043E': 'o', // о (Cyrillic)
    '\u0440': 'p', // р (Cyrillic)
    '\u0441': 'c', // с (Cyrillic)
    '\u0443': 'y', // у (Cyrillic)
    '\u0445': 'x', // х (Cyrillic)
    '\u043A': 'k', // к (Cyrillic)
    '\u043C': 'm', // м (Cyrillic) - less similar but used
    '\u0456': 'i', // і (Ukrainian Cyrillic)
    '\u0458': 'j', // ј (Cyrillic)
    '\u04BB': 'h', // һ (Cyrillic)
    '\u0501': 'd', // ԁ (Cyrillic)
    '\u051B': 'q', // ԛ (Cyrillic)
    '\u051D': 'w', // ԝ (Cyrillic)
    // Greek lookalikes
    '\u03B1': 'a', // α (Greek alpha)
    '\u03BF': 'o', // ο (Greek omicron)
    '\u03B5': 'e', // ε (Greek epsilon)
    '\u03BA': 'k', // κ (Greek kappa)
    '\u03BD': 'v', // ν (Greek nu)
    '\u03C1': 'p', // ρ (Greek rho)
    '\u03C4': 't', // τ (Greek tau)
    // Latin Extended / Special
    '\u0101': 'a', // ā
    '\u00E0': 'a', // à
    '\u00E1': 'a', // á
    '\u00E2': 'a', // â
    '\u00E4': 'a', // ä
    '\u00E8': 'e', // è
    '\u00E9': 'e', // é
    '\u00EA': 'e', // ê
    '\u00EB': 'e', //ë
    '\u00EC': 'i', // ì
    '\u00ED': 'i', // í
    '\u00EE': 'i', // î
    '\u00EF': 'i', // ï
    '\u00F2': 'o', // ò
    '\u00F3': 'o', // ó
    '\u00F4': 'o', // ô
    '\u00F6': 'o', // ö
    '\u00F9': 'u', // ù
    '\u00FA': 'u', // ú
    '\u00FB': 'u', // û
    '\u00FC': 'u', // ü
    '\u00FD': 'y', // ý
    '\u00FF': 'y', // ÿ
    '\u0142': 'l', // ł
    '\u0144': 'n', // ń
    '\u015B': 's', // ś
    '\u017A': 'z', // ź
    '\u017C': 'z', // ż
    '\u00DF': 'ss', // ß
    // Fullwidth characters
    '\uFF41': 'a', '\uFF42': 'b', '\uFF43': 'c', '\uFF44': 'd',
    '\uFF45': 'e', '\uFF46': 'f', '\uFF47': 'g', '\uFF48': 'h',
    '\uFF49': 'i', '\uFF4A': 'j', '\uFF4B': 'k', '\uFF4C': 'l',
    '\uFF4D': 'm', '\uFF4E': 'n', '\uFF4F': 'o', '\uFF50': 'p',
    '\uFF51': 'q', '\uFF52': 'r', '\uFF53': 's', '\uFF54': 't',
    '\uFF55': 'u', '\uFF56': 'v', '\uFF57': 'w', '\uFF58': 'x',
    '\uFF59': 'y', '\uFF5A': 'z',
    // ASCII digit homoglyphs (existing, kept for completeness)
    '0': 'o', '1': 'l', '3': 'e', '4': 'a', '@': 'a', '5': 's', '7': 't',
};

class PhishGuardService {
    private static readonly BRAND_SCORE_MAX = 40;
    private static readonly BRAND_SCORE_REDUCED = 20; // When brand match is on safe TLD with clean structure
    private static readonly TLD_SCORE_MAX = 20;
    private static readonly STRUCTURE_SCORE_MAX = 20;
    private static readonly KEYWORD_SCORE_MAX = 20;
    private static readonly PATH_SCORE_MAX = 15;
    private static readonly ML_SCORE_MAX = 20;
    private static readonly SUSPICIOUS_THRESHOLD = 50; // Total score >= 50 means danger (blocked)
    private static readonly WARNING_THRESHOLD = 35;    // Total score 35-49 means warning (shown in review)

    /**
     * Calculates Levenshtein distance between two strings
     */
    private levenshtein(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        Math.min(
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Extract root domain from a hostname.
     * e.g. "sub.example.co.id" -> "example.co.id"
     */
    private getRootDomain(domain: string): string {
        const parts = domain.split('.');
        // Handle .co.id, .go.id, .ac.id etc. (3-part root)
        if (parts.length >= 3) {
            const lastTwo = parts.slice(-2).join('.');
            if (['co.id', 'go.id', 'ac.id', 'co.uk', 'co.jp'].includes(lastTwo)) {
                return parts.slice(-3).join('.');
            }
        }
        if (parts.length >= 2) {
            return parts.slice(-2).join('.');
        }
        return domain;
    }

    /**
     * Checks if a string is physically close to another (Typosquatting).
     * For short keywords (<=3 chars), only matches against root domain to reduce false positives.
     */
    private isTyposquatting(domain: string, keyword: string): boolean {
        // For short keywords, only check the root domain part (not subdomains or full domain)
        const textToCheck = keyword.length <= 3 ? this.getRootDomain(domain) : domain;
        // Split domain into individual segments for more accurate comparison
        const segments = textToCheck.split(/[.\-]/);

        // 1. Check if keyword is contained as a standalone component
        // For short keywords, require it to be a standalone segment separated by dots/hyphens
        if (keyword.length <= 3) {
            if (segments.some(seg => seg === keyword)) return true;
        } else {
            if (textToCheck.includes(keyword)) return true;
        }

        // 2. Levenshtein distance for close matches (only for keywords > 3 chars)
        // Compare against each domain segment individually (not the full domain string)
        if (keyword.length > 3) {
            for (const segment of segments) {
                // Only compare segments of similar length to the keyword
                if (segment.length >= keyword.length - 2 && segment.length <= keyword.length + 2) {
                    const distance = this.levenshtein(segment, keyword);
                    if (distance > 0 && distance <= 2) {
                        return true;
                    }
                }
            }
        }

        // 3. Simple character replacement checks (homoglyphs) — now including Unicode confusables
        const normalized = this.normalizeHomoglyphs(textToCheck);

        if (keyword.length <= 3) {
            const normalizedSegments = normalized.split(/[.\-]/);
            if (normalizedSegments.some(seg => seg === keyword)) return true;
        } else {
            if (normalized.includes(keyword)) return true;
        }

        return false;
    }

    /**
     * Normalize a string by replacing all known homoglyph characters with their ASCII equivalents.
     * Handles Unicode confusables (Cyrillic, Greek, Latin Extended), fullwidth chars, and digit substitutions.
     */
    private normalizeHomoglyphs(input: string): string {
        let result = '';
        for (const char of input) {
            const replacement = UNICODE_CONFUSABLES[char];
            result += replacement !== undefined ? replacement : char;
        }
        return result;
    }

    /**
     * Detect if a domain uses mixed scripts (e.g., mixing Latin and Cyrillic)
     * which is a strong indicator of homoglyph-based phishing.
     */
    private hasMixedScripts(domain: string): boolean {
        // Remove dots and hyphens
        const cleaned = domain.replace(/[.\-]/g, '');
        let hasLatin = false;
        let hasCyrillic = false;
        let hasGreek = false;

        for (const char of cleaned) {
            const code = char.codePointAt(0) || 0;
            if (code >= 0x0041 && code <= 0x007A) hasLatin = true;          // Basic Latin
            else if (code >= 0x00C0 && code <= 0x024F) hasLatin = true;     // Latin Extended
            else if (code >= 0x0400 && code <= 0x04FF) hasCyrillic = true;  // Cyrillic
            else if (code >= 0x0500 && code <= 0x052F) hasCyrillic = true;  // Cyrillic Supplement
            else if (code >= 0x0370 && code <= 0x03FF) hasGreek = true;     // Greek
        }

        const scriptCount = [hasLatin, hasCyrillic, hasGreek].filter(Boolean).length;
        return scriptCount > 1;
    }

    /**
     * Check if domain is an IDN/Punycode domain (starts with xn--)
     * These domains use non-ASCII characters which can be used for homoglyph attacks.
     */
    private isPunycodeDomain(domain: string): boolean {
        return domain.split('.').some(part => part.startsWith('xn--'));
    }

    /**
     * Check if domain contains any non-ASCII characters
     */
    private hasNonAsciiChars(domain: string): boolean {
        return /[^\x00-\x7F]/.test(domain);
    }

    /**
     * Check if domain uses a safe/common TLD
     */
    private isSafeTld(domain: string): boolean {
        return SAFE_TLDS.some(tld => domain.endsWith(tld));
    }

    /**
     * Check if domain has a clean structure (no excessive subdomains/hyphens)
     */
    private hasCleanStructure(domain: string): boolean {
        const dotCount = (domain.match(/\./g) || []).length;
        const hyphenCount = (domain.match(/-/g) || []).length;
        return dotCount <= 3 && hyphenCount <= 2;
    }

    /**
     * Analyze URL path patterns for phishing indicators.
     * Checks for login/payment pages on non-official domains,
     * Base64 payloads, encoded user data, and deep nesting.
     */
    private analyzePathPatterns(urlObj: URL, domain: string, isOfficialBrand: boolean): { score: number; reasons: string[] } {
        let score = 0;
        const reasons: string[] = [];
        const path = urlObj.pathname.toLowerCase();
        const search = urlObj.search.toLowerCase();
        const fullPathAndQuery = path + search;

        // Skip path analysis for official brand domains — their login pages are legitimate
        if (isOfficialBrand) {
            return { score: 0, reasons: [] };
        }

        // 1. Login/Payment page patterns on non-official domains
        const sensitivePathPatterns = [
            /\/(login|signin|sign-in|log-in|masuk)\b/,
            /\/(payment|checkout|bayar|pembayaran)\b/,
            /\/(verify|verification|verifikasi)\b/,
            /\/(reset-password|forgot-password|lupa-password)\b/,
            /\/(update-billing|billing-info|card-update)\b/,
            /\/(confirm-identity|identity-check)\b/,
            /\/(otp|one-time|2fa|two-factor)\b/,
        ];

        let sensitivePathCount = 0;
        for (const pattern of sensitivePathPatterns) {
            if (pattern.test(path)) {
                sensitivePathCount++;
            }
        }

        if (sensitivePathCount >= 1) {
            score += 8;
            reasons.push('URL contains login/payment page pattern on non-official domain');
        }
        if (sensitivePathCount >= 2) {
            score += 5; // Multiple sensitive patterns = very suspicious
        }

        // 2. Base64 encoded payloads in URL (common in phishing redirects)
        // Look for Base64-like strings (20+ chars of base64 alphabet)
        const base64Pattern = /[A-Za-z0-9+/=]{40,}/;
        if (base64Pattern.test(fullPathAndQuery)) {
            score += 5;
            reasons.push('URL contains suspicious encoded data (possible payload)');
        }

        // 3. Encoded user data in URL (email, phone number patterns)
        // Check for email patterns in query params (phishing pages pre-fill victim email)
        const emailInUrl = /[?&][^=]*=([^&]*@[^&]*\.[^&]+)/;
        const phoneInUrl = /[?&][^=]*=(\+?\d{10,})/;
        if (emailInUrl.test(fullPathAndQuery)) {
            score += 5;
            reasons.push('URL contains email address — possible pre-filled phishing page');
        } else if (phoneInUrl.test(fullPathAndQuery)) {
            score += 3;
            reasons.push('URL contains phone number in parameters');
        }

        // 4. Excessive path depth (> 5 segments = suspicious for phishing hiding)
        const pathSegments = path.split('/').filter(s => s.length > 0);
        if (pathSegments.length > 5) {
            score += 3;
            reasons.push(`Deeply nested URL path (${pathSegments.length} levels)`);
        }

        // 5. Path mimicking known brand paths (e.g., /myaccount, /bankapp)
        const brandMimicPatterns = [
            /\/(myaccount|my-account|akun-saya)\//,
            /\/(netbanking|internet-banking|mobile-banking)\//,
            /\/(wallet|e-wallet|ewallet)\//,
        ];
        for (const pattern of brandMimicPatterns) {
            if (pattern.test(path)) {
                score += 5;
                reasons.push('URL path mimics known banking/financial service paths');
                break;
            }
        }

        return { score: Math.min(score, PhishGuardService.PATH_SCORE_MAX), reasons };
    }

    public analyzeUrl(urlStr: string): PhishGuardResult {
        let score = 0;
        const reasons: string[] = [];
        let domain = '';
        let urlObj: URL | null = null;
        let pathOnly = '';

        // 1. Basic Parsing
        try {
            const fullUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
            urlObj = new URL(fullUrl);
            domain = urlObj.hostname.toLowerCase();
            // Only check domain + path, NOT query params (reduces false positives)
            pathOnly = urlObj.pathname.toLowerCase();
        } catch (e) {
            return {
                score: 100,
                isSuspicious: true,
                threatLevel: 'danger',
                reasons: ['Invalid URL Structure'],
                details: {
                    brandImpersonationScore: 0,
                    tldScore: 0,
                    structureScore: 0,
                    keywordScore: 0,
                    pathAnalysisScore: 0,
                    mlScore: 0
                }
            };
        }

        // 2. Brand Impersonation Check (0-40)
        let brandScore = 0;
        let detectedBrand = '';
        for (const brand of KNOWN_BRANDS) {
            const isOfficial = brand.officialDomains.some(official =>
                domain === official || domain.endsWith('.' + official)
            );

            if (isOfficial) {
                continue;
            }

            for (const keyword of brand.keywords) {
                if (this.isTyposquatting(domain, keyword)) {
                    detectedBrand = brand.name;
                    // Context-aware scoring: reduce brand score if domain uses safe TLD + clean structure
                    if (this.isSafeTld(domain) && this.hasCleanStructure(domain)) {
                        brandScore = PhishGuardService.BRAND_SCORE_REDUCED;
                    } else {
                        brandScore = PhishGuardService.BRAND_SCORE_MAX;
                    }
                    reasons.push(`Potential impersonation of ${brand.name} detected`);
                    break;
                }
            }
            if (brandScore > 0) break;
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
        const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
        if (isIpAddress) {
            structureScore += 20;
            reasons.push('Uses raw IP address instead of domain name');
        } else {
            const dotCount = (domain.match(/\./g) || []).length;
            if (dotCount > 3) {
                structureScore += 10;
                reasons.push('Excessive number of subdomains');
            }

            const hyphenCount = (domain.match(/-/g) || []).length;
            if (hyphenCount > 2) {
                structureScore += 10;
                reasons.push('Excessive use of hyphens in domain');
            }
        }
        score += Math.min(structureScore, PhishGuardService.STRUCTURE_SCORE_MAX);

        // 5a. IDN/Punycode & Mixed Script Check (adds to structure score)
        if (this.isPunycodeDomain(domain)) {
            structureScore += 15;
            reasons.push('Uses internationalized domain name (Punycode) — may hide deceptive characters');
        } else if (this.hasNonAsciiChars(domain)) {
            structureScore += 15;
            reasons.push('Domain contains non-ASCII characters that may be used for impersonation');
        }
        if (this.hasMixedScripts(domain)) {
            structureScore += 10;
            reasons.push('Domain mixes character scripts (e.g., Latin and Cyrillic) — strong phishing indicator');
        }
        // Re-apply the cap after IDN/mixed-script additions (using a separate bonus so it can exceed the standard STRUCTURE_SCORE_MAX)
        const idnBonus = Math.max(0, structureScore - PhishGuardService.STRUCTURE_SCORE_MAX);
        score += idnBonus;


        // 5. Tiered Keyword Check (0-20)
        // Only check domain + path (not query params)
        let keywordScore = 0;
        const textToCheck = domain + pathOnly;
        let highCount = 0;
        let lowCount = 0;

        for (const kw of HIGH_WEIGHT_KEYWORDS) {
            if (textToCheck.includes(kw)) {
                highCount++;
            }
        }

        for (const kw of LOW_WEIGHT_KEYWORDS) {
            if (textToCheck.includes(kw)) {
                lowCount++;
            }
        }

        const totalKeywords = highCount + lowCount;

        // Keywords only count if 2+ different keywords found (single keyword = 0 points)
        if (totalKeywords >= 2) {
            // High-weight: 15pts each (max 2 counted = 30, but capped at KEYWORD_SCORE_MAX)
            const highScore = Math.min(highCount, 2) * 15;
            // Low-weight: 5pts each (max 2 counted = 10)
            const lowScore = Math.min(lowCount, 2) * 5;
            keywordScore = Math.min(highScore + lowScore, PhishGuardService.KEYWORD_SCORE_MAX);
            reasons.push(`Contains ${totalKeywords} suspicious security-related keywords`);
        }
        score += keywordScore;


        // 5b. URL Path Analysis (0-15)
        // Check for suspicious path patterns like login pages, Base64 payloads, etc.
        const isOfficialBrand = KNOWN_BRANDS.some(brand =>
            brand.officialDomains.some(official =>
                domain === official || domain.endsWith('.' + official)
            )
        );
        const pathAnalysis = urlObj ? this.analyzePathPatterns(urlObj, domain, isOfficialBrand) : { score: 0, reasons: [] };
        let pathAnalysisScore = pathAnalysis.score;
        score += pathAnalysisScore;
        reasons.push(...pathAnalysis.reasons);


        // 6. Domain Reputation Adjustment
        // Reduce score for well-known legitimate domains to prevent false positives
        const reputation = DomainReputation.getReputation(domain);
        if (reputation.isKnown && reputation.scoreAdjustment < 0) {
            score = Math.max(0, score + reputation.scoreAdjustment);
            if (score < PhishGuardService.WARNING_THRESHOLD) {
                // Only add the reason if it actually changed the threat level
                reasons.push(`Domain has good reputation (${reputation.tier} ranked site)`);
            }
        }

        // 7. On-Device ML Analysis (0-20)
        // Uses lightweight Random Forest model to predict phishing probability
        let mlScore = 0;
        try {
            const mlProbability = PhishingModel.predict(urlStr);
            if (mlProbability > 0.7) {
                mlScore = 20;
                reasons.push(`Machine Learning model detected high phishing probability (${(mlProbability * 100).toFixed(0)}%)`);
            } else if (mlProbability > 0.5) {
                mlScore = 10;
                reasons.push(`Machine Learning model detected suspicious patterns`);
            }
        } catch (e) {
            console.error('ML Prediction failed', e);
        }
        score += mlScore;

        // 8. Determine threat level
        let threatLevel: ThreatLevel = 'safe';
        if (score >= PhishGuardService.SUSPICIOUS_THRESHOLD) {
            threatLevel = 'danger';
        } else if (score >= PhishGuardService.WARNING_THRESHOLD) {
            threatLevel = 'warning';
        }

        return {
            score,
            isSuspicious: score >= PhishGuardService.SUSPICIOUS_THRESHOLD,
            threatLevel,
            reasons,
            details: {
                brandImpersonationScore: brandScore,
                tldScore,
                structureScore: Math.min(structureScore, PhishGuardService.STRUCTURE_SCORE_MAX),
                keywordScore,
                pathAnalysisScore,
                mlScore
            }
        };
    }
}

export default new PhishGuardService();
