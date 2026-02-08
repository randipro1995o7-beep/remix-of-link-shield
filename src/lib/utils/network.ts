/**
 * Network Utilities
 * 
 * Provides secure network request handling with:
 * - Configurable timeouts
 * - Exponential backoff retry
 * - Error handling
 * - Request cancellation
 */

import { logger } from './logger';

export interface FetchOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
};

/**
 * Enhanced fetch with timeout support
 */
export async function fetchWithTimeout(
    url: string,
    options: FetchOptions = {}
): Promise<Response> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
            logger.error('Request timeout', { url, timeout });
            throw new Error(`Request timeout after ${timeout}ms`);
        }

        throw error;
    }
}

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateRetryDelay(
    attempt: number,
    config: RetryConfig
): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry(
    url: string,
    options: FetchOptions = {}
): Promise<Response> {
    const {
        retries = DEFAULT_RETRY_CONFIG.maxRetries,
        retryDelay = DEFAULT_RETRY_CONFIG.initialDelay,
        onRetry,
        ...fetchOptions
    } = options;

    const retryConfig: RetryConfig = {
        maxRetries: retries,
        initialDelay: retryDelay,
        maxDelay: DEFAULT_RETRY_CONFIG.maxDelay,
        backoffMultiplier: DEFAULT_RETRY_CONFIG.backoffMultiplier,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
        try {
            const response = await fetchWithTimeout(url, fetchOptions);

            // Retry on 5xx errors
            if (response.status >= 500 && response.status < 600) {
                throw new Error(`Server error: ${response.status}`);
            }

            // Success
            if (attempt > 1) {
                logger.info(`Request succeeded on attempt ${attempt}`, { url });
            }

            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on client errors (4xx)
            if (error instanceof Response && error.status >= 400 && error.status < 500) {
                throw lastError;
            }

            // Check if we should retry
            if (attempt <= retryConfig.maxRetries) {
                const delay = calculateRetryDelay(attempt, retryConfig);

                logger.warn(`Request failed, retrying in ${delay}ms`, {
                    url,
                    attempt,
                    maxRetries: retryConfig.maxRetries,
                    error: lastError.message,
                });

                // Call retry callback if provided
                onRetry?.(attempt, lastError);

                await sleep(delay);
            } else {
                // Max retries exceeded
                logger.error(`Request failed after ${attempt} attempts`, {
                    url,
                    error: lastError.message,
                });
            }
        }
    }

    throw lastError || new Error('Request failed');
}

/**
 * Secure fetch with all protections
 * - Timeout
 * - Retry with exponential backoff
 * - Error handling
 */
export async function secureFetch(
    url: string,
    options: FetchOptions = {}
): Promise<Response> {
    // Validate URL
    try {
        new URL(url);
    } catch {
        throw new Error('Invalid URL');
    }

    // Enforce HTTPS in production
    if (!import.meta.env.DEV && !url.startsWith('https://')) {
        logger.security('Blocked insecure HTTP request', { url });
        throw new Error('Only HTTPS requests allowed in production');
    }

    return fetchWithRetry(url, {
        timeout: DEFAULT_TIMEOUT,
        retries: DEFAULT_RETRY_CONFIG.maxRetries,
        ...options,
    });
}

/**
 * Download JSON with type safety
 */
export async function fetchJSON<T>(
    url: string,
    options: FetchOptions = {}
): Promise<T> {
    const response = await secureFetch(url, {
        ...options,
        headers: {
            'Accept': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
    }

    return response.json();
}

/**
 * Check network connectivity
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Wait for network connectivity
 */
export function waitForOnline(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
        if (isOnline()) {
            resolve(true);
            return;
        }

        const timeoutId = setTimeout(() => {
            window.removeEventListener('online', onOnline);
            resolve(false);
        }, timeout);

        const onOnline = () => {
            clearTimeout(timeoutId);
            window.removeEventListener('online', onOnline);
            resolve(true);
        };

        window.addEventListener('online', onOnline);
    });
}
