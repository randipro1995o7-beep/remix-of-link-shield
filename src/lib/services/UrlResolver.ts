import { CapacitorHttp } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * Redirect chain entry for tracking each hop
 */
export interface RedirectHop {
    url: string;
    domain: string;
    type: 'http' | 'client-side' | 'origin';
    statusCode?: number;
}

/**
 * Result of URL resolution including the full redirect chain
 */
export interface ResolvedUrlResult {
    /** Final destination URL */
    finalUrl: string;
    /** Full redirect chain from origin to destination */
    redirectChain: RedirectHop[];
    /** Number of cross-domain hops */
    crossDomainHops: number;
    /** Whether the redirect chain is suspicious (many hops or cross-domain) */
    isSuspiciousRedirect: boolean;
    /** Total number of redirects */
    totalRedirects: number;
}

/**
 * Service to resolve shortened URLs and follow redirects to find the final destination.
 * Uses CapacitorHttp to bypass CORS restrictions on mobile.
 * 
 * Enhanced with:
 * - Deeper redirect following (up to 7 hops)
 * - Full redirect chain tracking
 * - Cross-domain hop detection
 * - Suspicious redirect analysis
 */
class UrlResolverService {
    private static readonly MAX_DEPTH = 7;
    private static readonly CROSS_DOMAIN_WARNING_THRESHOLD = 2;

    /**
     * Extract domain from a URL string
     */
    private extractDomain(url: string): string {
        try {
            return new URL(url).hostname.toLowerCase();
        } catch {
            return '';
        }
    }

    /**
     * Resolves the final URL after following redirects, with full chain tracking.
     * @param url The initial URL to resolve
     * @returns ResolvedUrlResult with final URL, chain, and analysis
     */
    async resolveWithChain(url: string): Promise<ResolvedUrlResult> {
        const chain: RedirectHop[] = [{
            url,
            domain: this.extractDomain(url),
            type: 'origin',
        }];

        const finalUrl = await this.resolveFinalUrl(url, 0, chain);

        // Analyze the chain
        const domains = new Set(chain.map(h => h.domain).filter(Boolean));
        const crossDomainHops = Math.max(0, domains.size - 1); // Subtract 1 for the origin domain

        return {
            finalUrl,
            redirectChain: chain,
            crossDomainHops,
            isSuspiciousRedirect: crossDomainHops >= UrlResolverService.CROSS_DOMAIN_WARNING_THRESHOLD ||
                chain.length > 4,
            totalRedirects: Math.max(0, chain.length - 1), // Subtract 1 for the origin
        };
    }

    /**
     * Resolves the final URL after following redirects.
     * @param url The initial URL to resolve
     * @param depth Current recursion depth
     * @param chain Optional chain to track hops
     * @returns The final destination URL, or the original if no redirect/error
     */
    async resolveFinalUrl(url: string, depth = 0, chain?: RedirectHop[]): Promise<string> {
        // Prevent infinite loops - increased from 3 to MAX_DEPTH
        if (depth > UrlResolverService.MAX_DEPTH) return url;

        try {
            // Basic validation
            if (!url || !url.startsWith('http')) {
                return url;
            }

            logger.debug('Resolving URL:', url);

            // CHANGED: Use GET instead of HEAD to inspect body for client-side redirects
            const response = await CapacitorHttp.request({
                method: 'GET',
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                connectTimeout: 5000,
                readTimeout: 5000
            });

            // 1. Check HTTP Redirects (Capacitor handles this, but let's check response.url)
            if (response.url && response.url !== url) {
                // Track the HTTP redirect hop
                if (chain) {
                    chain.push({
                        url: response.url,
                        domain: this.extractDomain(response.url),
                        type: 'http',
                        statusCode: response.status,
                    });
                }

                // Check for additional client-side redirects after the HTTP redirect
                if (response.data && typeof response.data === 'string') {
                    const clientSideRedirect = this.detectClientSideRedirect(response.data);
                    if (clientSideRedirect) {
                        const resolvedClient = this.resolveRelativeUrl(clientSideRedirect, response.url);
                        if (chain) {
                            chain.push({
                                url: resolvedClient,
                                domain: this.extractDomain(resolvedClient),
                                type: 'client-side',
                            });
                        }
                        return this.resolveFinalUrl(resolvedClient, depth + 1, chain);
                    }
                }
                logger.info('URL resolved (HTTP):', { from: url, to: response.url });
                return response.url;
            }

            // 2. Check Client-Side Redirects (Meta Refresh / Window.Location) for status 200 responses
            if (response.data && typeof response.data === 'string') {
                const clientSideRedirect = this.detectClientSideRedirect(response.data);
                if (clientSideRedirect) {
                    const nextUrl = this.resolveRelativeUrl(clientSideRedirect, url);

                    if (chain) {
                        chain.push({
                            url: nextUrl,
                            domain: this.extractDomain(nextUrl),
                            type: 'client-side',
                        });
                    }

                    logger.info('URL resolved (Client-Side):', { from: url, to: nextUrl });
                    // Recurse to resolve the new target
                    return this.resolveFinalUrl(nextUrl, depth + 1, chain);
                }
            }

            return url;
        } catch (error) {
            logger.error('Failed to resolve URL:', error);
            return url;
        }
    }

    /**
     * Resolve a potentially relative URL against a base URL
     */
    private resolveRelativeUrl(target: string, base: string): string {
        if (target.startsWith('http')) {
            return target;
        }
        try {
            if (target.startsWith('/')) {
                const origin = new URL(base).origin;
                return origin + target;
            }
            return new URL(target, base).href;
        } catch {
            return target;
        }
    }

    /**
     * Detects <meta http-equiv="refresh"> or window.location redirects in HTML
     */
    private detectClientSideRedirect(html: string): string | null {
        try {
            // Check for <meta http-equiv="refresh" content="0; url=...">
            const metaRefreshRegex = /<meta\s+http-equiv=["']?refresh["']?\s+content=["']?\d+;\s*url=([^"']+)["']?/i;
            const metaMatch = html.match(metaRefreshRegex);
            if (metaMatch && metaMatch[1]) {
                return metaMatch[1];
            }

            // Also check reversed attribute order: content before http-equiv
            const metaRefreshRegex2 = /<meta\s+content=["']?\d+;\s*url=([^"']+)["']?\s+http-equiv=["']?refresh["']?/i;
            const metaMatch2 = html.match(metaRefreshRegex2);
            if (metaMatch2 && metaMatch2[1]) {
                return metaMatch2[1];
            }

            // Check for window.location = "...", .href, .replace(), .assign()
            const jsRedirectRegex = /(?:window|self|top|document)\.location(?:\.href)?\s*=\s*["']([^"']+)["']|(?:window|self|top|document)\.location\.(?:replace|assign)\(["']([^"']+)["']\)/;
            const jsMatch = html.match(jsRedirectRegex);
            if (jsMatch) {
                return jsMatch[1] || jsMatch[2];
            }

            // Check for document.location redirect
            const docLocationRegex = /document\.location\s*=\s*["']([^"']+)["']/;
            const docMatch = html.match(docLocationRegex);
            if (docMatch && docMatch[1]) {
                return docMatch[1];
            }
        } catch (e) {
            return null;
        }
        return null;
    }
}

export const UrlResolver = new UrlResolverService();
