import { CapacitorHttp } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * Service to resolve shortened URLs and follow redirects to find the final destination.
 * Uses CapacitorHttp to bypass CORS restrictions on mobile.
 */
class UrlResolverService {
    /**
     * Resolves the final URL after following redirects.
     * @param url The initial URL to resolve
     * @returns The final destination URL, or the original if no redirect/error
     */
    /**
     * Resolves the final URL after following redirects.
     * @param url The initial URL to resolve
     * @returns The final destination URL, or the original if no redirect/error
     */
    async resolveFinalUrl(url: string, depth = 0): Promise<string> {
        // Prevent infinite loops
        if (depth > 3) return url;

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
                // Optimization: If it redirected, recursively check the new URL in case of double redirect
                // But typically Capacitor follows all HTTP redirects.
                // Let's just return unless we find a specific reason to recurse.
                // Actually, some client-side redirects happen AFTER an HTTP redirect.
                // So we should verify the BODY of the result.
                if (response.data && typeof response.data === 'string') {
                    const clientSideRedirect = this.detectClientSideRedirect(response.data);
                    if (clientSideRedirect) {
                        return this.resolveFinalUrl(clientSideRedirect, depth + 1);
                    }
                }
                logger.info('URL resolved (HTTP):', { from: url, to: response.url });
                return response.url;
            }

            // 2. Check Client-Side Redirects (Meta Refresh / Window.Location) for status 200 responses
            // Safeguard: response.data can be an object, string, or null depending on content-type
            if (response.data && typeof response.data === 'string') {
                const clientSideRedirect = this.detectClientSideRedirect(response.data);
                if (clientSideRedirect) {
                    // Handle relative URLs
                    let nextUrl = clientSideRedirect;
                    if (nextUrl.startsWith('/')) {
                        const origin = new URL(url).origin;
                        nextUrl = origin + nextUrl;
                    } else if (!nextUrl.startsWith('http')) {
                        // relative path without leading slash?
                        const baseUrl = new URL(url);
                        // simple join (could be improved)
                        nextUrl = new URL(nextUrl, baseUrl.href).href;
                    }

                    logger.info('URL resolved (Client-Side):', { from: url, to: nextUrl });
                    // Recurse to resolve the new target
                    return this.resolveFinalUrl(nextUrl, depth + 1);
                }
            }

            return url;
        } catch (error) {
            logger.error('Failed to resolve URL:', error);
            return url;
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

            // Check for window.location = "...", .href, .replace(), .assign()
            // Supports:
            // window.location = "http..."
            // window.location.href = "http..."
            // window.location.replace("http...")
            // window.location.assign("http...")
            // self.location...
            // top.location...
            const jsRedirectRegex = /(?:window|self|top)\.location(?:\.href)?\s*=\s*["']([^"']+)["']|(?:window|self|top)\.location\.(?:replace|assign)\(["']([^"']+)["']\)/;
            const jsMatch = html.match(jsRedirectRegex);
            if (jsMatch) {
                // The match groups depend on which part of the regex matched
                return jsMatch[1] || jsMatch[2];
            }
        } catch (e) {
            return null;
        }
        return null;
    }
}

export const UrlResolver = new UrlResolverService();
