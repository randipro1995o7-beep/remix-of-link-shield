/**
 * Secure Logger Utility
 * 
 * Production-safe logging system that prevents sensitive data leakage.
 * Automatically redacts sensitive information and respects environment settings.
 * 
 * Usage:
 * - Development: All logs visible
 * - Production: Only errors logged, sensitive data redacted
 */

// Detect environment
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
    /\b\d{4}\b/g,                    // 4-digit PINs
    /\b\d{6}\b/g,                    // 6-digit OTPs
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
];

/**
 * Redact sensitive information from strings
 */
function redactSensitive(data: any): any {
    if (typeof data === 'string') {
        let redacted = data;
        SENSITIVE_PATTERNS.forEach(pattern => {
            redacted = redacted.replace(pattern, '***REDACTED***');
        });
        return redacted;
    }

    if (typeof data === 'object' && data !== null) {
        const redacted: any = Array.isArray(data) ? [] : {};
        for (const key in data) {
            // Redact keys that likely contain sensitive data
            if (['pin', 'otp', 'password', 'token', 'secret', 'email', 'phone'].some(k => key.toLowerCase().includes(k))) {
                redacted[key] = '***REDACTED***';
            } else {
                redacted[key] = redactSensitive(data[key]);
            }
        }
        return redacted;
    }

    return data;
}

/**
 * Format log message with timestamp
 */
function formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
}

/**
 * Secure logger interface
 */
export const logger = {
    /**
     * Info level - development only
     */
    info: (message: string, ...args: any[]) => {
        if (isDevelopment) {
            console.log(formatMessage('INFO', message, ...args));
        }
    },

    /**
     * Warning level - development only
     */
    warn: (message: string, ...args: any[]) => {
        if (isDevelopment) {
            console.warn(formatMessage('WARN', message, ...args));
        }
    },

    /**
     * Error level - always logged but sanitized in production
     */
    error: (message: string, error?: any) => {
        if (isDevelopment) {
            console.error(formatMessage('ERROR', message), error);
        } else {
            // In production, redact sensitive data and log to error tracking service
            const sanitizedError = redactSensitive(error);
            console.error(formatMessage('ERROR', message), sanitizedError);

            // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
            // reportToErrorTracking({ message, error: sanitizedError });
        }
    },

    /**
     * Debug level - development only, verbose
     */
    debug: (message: string, data?: any) => {
        if (isDevelopment) {
            console.debug(formatMessage('DEBUG', message), data);
        }
    },

    /**
     * Security event logging - always logged for audit trail
     */
    security: (event: string, details?: any) => {
        const sanitizedDetails = redactSensitive(details);
        const logMessage = formatMessage('SECURITY', event, sanitizedDetails);

        if (isDevelopment) {
            console.log(`🔒 ${logMessage}`);
        } else {
            console.log(logMessage);
        }

        // TODO: Send to security monitoring service
        // reportSecurityEvent({ event, details: sanitizedDetails });
    },

    /**
     * Explicitly mark as sensitive - never logged in production
     */
    sensitive: (message: string, data?: any) => {
        if (isDevelopment) {
            console.warn(formatMessage('SENSITIVE', message), '⚠️ Contains sensitive data:', data);
        }
        // Never log in production - silent fail
    },
};

/**
 * Export redaction utility for testing
 */
export { redactSensitive };
