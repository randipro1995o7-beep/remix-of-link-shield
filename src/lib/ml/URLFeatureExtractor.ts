/**
 * Extracts numerical features from a URL for ML analysis.
 * Features are normalized where appropriate.
 */
export class URLFeatureExtractor {

    // Calculate Shannon entropy of a string (measure of randomness)
    private static calculateEntropy(str: string): number {
        if (!str) return 0;
        const len = str.length;
        const frequencies = new Map<string, number>();

        for (const char of str) {
            frequencies.set(char, (frequencies.get(char) || 0) + 1);
        }

        let entropy = 0;
        for (const count of frequencies.values()) {
            const p = count / len;
            entropy -= p * Math.log2(p);
        }
        return entropy;
    }

    private static countChar(str: string, char: string): number {
        return str.split(char).length - 1;
    }

    private static isIPAddress(domain: string): number {
        // Simple check for IPv4 pattern
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(domain) ? 1 : 0;
    }

    /**
     * Extracts a fixed-length feature vector from a URL.
     * Vector size: 12
     */
    public static extractFeatures(urlStr: string): number[] {
        if (!urlStr) return new Array(12).fill(0);

        let domain = '';
        let path = '';
        let urlObj: URL | null = null;

        try {
            // Normalize to lowercase for consistent feature extraction
            const lowerUrlStr = urlStr.toLowerCase();
            const fullUrl = lowerUrlStr.startsWith('http') ? lowerUrlStr : `https://${lowerUrlStr}`;
            urlObj = new URL(fullUrl);
            domain = urlObj.hostname;
            path = urlObj.pathname + urlObj.search;
        } catch (e) {
            // If invalid URL, return a "bad" feature vector
            return new Array(12).fill(0);
        }

        if (!urlObj) return new Array(12).fill(0);

        const features: number[] = [];

        // 1. URL Length (normalized by 100 for scale)
        features.push(urlObj.href.length / 100);

        // 2. Domain Length (normalized by 20)
        features.push(domain.length / 20);

        // 3. Dot Count in Domain
        features.push(this.countChar(domain, '.'));

        // 4. Hyphen Count in Domain (phishing often uses hyphens)
        features.push(this.countChar(domain, '-'));

        // 5. At Symbol (@) in URL (highly suspicious)
        features.push(this.countChar(urlObj.href, '@'));

        // 6. IS IP Address
        features.push(this.isIPAddress(domain));

        // 7. Digit Count in Domain (often used in auto-generated phishing domains)
        const digitCount = (domain.match(/\d/g) || []).length;
        features.push(digitCount / domain.length); // Ratio of digits

        // 8. Domain Entropy (measure of randomness, e.g. 'xj3k29.com')
        features.push(this.calculateEntropy(domain));

        // 9. Path Length
        features.push(path.length / 50);

        // 10. Suspicious Keywords in Path (login, verify, etc.)
        const suspiciousKeywords = ['login', 'signin', 'verify', 'account', 'update', 'banking', 'secure'];
        let keywordCount = 0;
        const lowerUrl = urlObj.href.toLowerCase();
        for (const kw of suspiciousKeywords) {
            if (lowerUrl.includes(kw)) keywordCount++;
        }
        features.push(keywordCount);

        // 11. Count of Subdomains (dots in domain - 1 for TLD)
        const subdomainCount = Math.max(0, this.countChar(domain, '.') - 1);
        features.push(subdomainCount);

        // 12. Has TLD (1 if valid-looking TLD, 0 otherwise)
        features.push(domain.includes('.') ? 1 : 0);

        return features;
    }
}
