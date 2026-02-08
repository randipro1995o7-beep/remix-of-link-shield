/**
 * Security Event Logger
 * 
 * Centralized security event tracking and audit logging.
 * Provides compliance-grade audit trail for enterprise deployments.
 * 
 * Features:
 * - Persistent event storage
 * - Event filtering and search
 * - Export to JSON/CSV
 * - Automatic event rotation (max 1000 events)
 * - Security metrics calculation
 */

import { Preferences } from '@capacitor/preferences';
import { logger } from '@/lib/utils/logger';

const STORAGE_KEY = 'lg_security_events';
const MAX_EVENTS = 1000;

export type SecurityEventType =
    | 'auth_success'
    | 'auth_failure'
    | 'rate_limit_triggered'
    | 'rate_limit_cleared'
    | 'account_locked'
    | 'account_unlocked'
    | 'otp_generated'
    | 'otp_verified'
    | 'otp_failed'
    | 'otp_expired'
    | 'root_detected'
    | 'security_warning'
    | 'pin_created'
    | 'pin_changed'
    | 'recovery_setup'
    | 'recovery_used';

export type SecurityEventSeverity = 'info' | 'warning' | 'critical';

export interface SecurityEvent {
    id: string;
    timestamp: number;
    type: SecurityEventType;
    severity: SecurityEventSeverity;
    message: string;
    details?: Record<string, any>;
}

export interface SecurityMetrics {
    totalEvents: number;
    last24h: {
        total: number;
        authAttempts: number;
        authFailures: number;
        authSuccesses: number;
        rateLimitEvents: number;
        rootDetections: number;
        activeLockouts: number;
    };
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
}

export interface EventFilter {
    type?: SecurityEventType;
    severity?: SecurityEventSeverity;
    since?: number;
    until?: number;
    limit?: number;
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine severity from event type
 */
function getSeverity(type: SecurityEventType): SecurityEventSeverity {
    const criticalEvents: SecurityEventType[] = [
        'account_locked',
        'root_detected',
        'security_warning',
    ];

    const warningEvents: SecurityEventType[] = [
        'auth_failure',
        'rate_limit_triggered',
        'otp_failed',
        'otp_expired',
    ];

    if (criticalEvents.includes(type)) return 'critical';
    if (warningEvents.includes(type)) return 'warning';
    return 'info';
}

/**
 * Security Event Logger Service
 */
export const SecurityEventLogger = {
    /**
     * Log a security event
     */
    async logEvent(
        type: SecurityEventType,
        message: string,
        details?: Record<string, any>
    ): Promise<void> {
        try {
            const event: SecurityEvent = {
                id: generateEventId(),
                timestamp: Date.now(),
                type,
                severity: getSeverity(type),
                message,
                details,
            };

            // Get existing events
            const events = await this.getAllEvents();

            // Add new event at the beginning
            events.unshift(event);

            // Rotate if exceeds max
            const rotatedEvents = events.slice(0, MAX_EVENTS);

            // Save back to storage
            await Preferences.set({
                key: STORAGE_KEY,
                value: JSON.stringify(rotatedEvents),
            });

            // Also log to console in development
            logger.security(`[${type}] ${message}`, details);
        } catch (error) {
            logger.error('Failed to log security event', error);
        }
    },

    /**
     * Get all security events
     */
    async getAllEvents(): Promise<SecurityEvent[]> {
        try {
            const { value } = await Preferences.get({ key: STORAGE_KEY });
            if (!value) return [];
            return JSON.parse(value) as SecurityEvent[];
        } catch (error) {
            logger.error('Failed to get security events', error);
            return [];
        }
    },

    /**
     * Get filtered events
     */
    async getEvents(filter: EventFilter = {}): Promise<SecurityEvent[]> {
        try {
            let events = await this.getAllEvents();

            // Filter by type
            if (filter.type) {
                events = events.filter(e => e.type === filter.type);
            }

            // Filter by severity
            if (filter.severity) {
                events = events.filter(e => e.severity === filter.severity);
            }

            // Filter by date range
            if (filter.since) {
                events = events.filter(e => e.timestamp >= filter.since!);
            }

            if (filter.until) {
                events = events.filter(e => e.timestamp <= filter.until!);
            }

            // Limit results
            if (filter.limit) {
                events = events.slice(0, filter.limit);
            }

            return events;
        } catch (error) {
            logger.error('Failed to filter events', error);
            return [];
        }
    },

    /**
     * Calculate security metrics
     */
    async getMetrics(): Promise<SecurityMetrics> {
        try {
            const allEvents = await this.getAllEvents();
            const now = Date.now();
            const last24h = now - 24 * 60 * 60 * 1000;

            const recentEvents = allEvents.filter(e => e.timestamp >= last24h);

            // Count by type
            const eventsByType: Partial<Record<SecurityEventType, number>> = {};
            const eventsBySeverity: Partial<Record<SecurityEventSeverity, number>> = {};

            allEvents.forEach(event => {
                eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
                eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
            });

            // Calculate last 24h metrics
            const authAttempts = recentEvents.filter(e =>
                e.type === 'auth_success' || e.type === 'auth_failure'
            ).length;

            const authFailures = recentEvents.filter(e =>
                e.type === 'auth_failure'
            ).length;

            const authSuccesses = recentEvents.filter(e =>
                e.type === 'auth_success'
            ).length;

            const rateLimitEvents = recentEvents.filter(e =>
                e.type === 'rate_limit_triggered' || e.type === 'account_locked'
            ).length;

            const rootDetections = recentEvents.filter(e =>
                e.type === 'root_detected'
            ).length;

            // Check for active lockouts (locked but not unlocked in last 24h)
            const lockEvents = recentEvents.filter(e =>
                e.type === 'account_locked' || e.type === 'account_unlocked'
            );

            let activeLockouts = 0;
            if (lockEvents.length > 0) {
                const lastLockEvent = lockEvents[0];
                if (lastLockEvent.type === 'account_locked') {
                    activeLockouts = 1;
                }
            }

            return {
                totalEvents: allEvents.length,
                last24h: {
                    total: recentEvents.length,
                    authAttempts,
                    authFailures,
                    authSuccesses,
                    rateLimitEvents,
                    rootDetections,
                    activeLockouts,
                },
                eventsByType: eventsByType as Record<SecurityEventType, number>,
                eventsBySeverity: eventsBySeverity as Record<SecurityEventSeverity, number>,
            };
        } catch (error) {
            logger.error('Failed to calculate metrics', error);
            return {
                totalEvents: 0,
                last24h: {
                    total: 0,
                    authAttempts: 0,
                    authFailures: 0,
                    authSuccesses: 0,
                    rateLimitEvents: 0,
                    rootDetections: 0,
                    activeLockouts: 0,
                },
                eventsByType: {} as Record<SecurityEventType, number>,
                eventsBySeverity: {} as Record<SecurityEventSeverity, number>,
            };
        }
    },

    /**
     * Export events as JSON
     */
    async exportJSON(filter?: EventFilter): Promise<string> {
        const events = await this.getEvents(filter || {});
        return JSON.stringify(events, null, 2);
    },

    /**
     * Export events as CSV
     */
    async exportCSV(filter?: EventFilter): Promise<string> {
        const events = await this.getEvents(filter || {});

        if (events.length === 0) {
            return 'No events to export';
        }

        // CSV header
        const headers = ['ID', 'Timestamp', 'Date', 'Type', 'Severity', 'Message', 'Details'];
        const rows = [headers.join(',')];

        // CSV rows
        events.forEach(event => {
            const date = new Date(event.timestamp).toISOString();
            const details = event.details ? JSON.stringify(event.details).replace(/"/g, '""') : '';

            const row = [
                event.id,
                event.timestamp.toString(),
                `"${date}"`,
                event.type,
                event.severity,
                `"${event.message.replace(/"/g, '""')}"`,
                `"${details}"`,
            ];

            rows.push(row.join(','));
        });

        return rows.join('\n');
    },

    /**
     * Clear all events (use with caution)
     */
    async clearAll(): Promise<void> {
        try {
            await Preferences.remove({ key: STORAGE_KEY });
            logger.info('All security events cleared');
        } catch (error) {
            logger.error('Failed to clear events', error);
        }
    },

    /**
     * Delete events older than specified timestamp
     */
    async deleteOldEvents(beforeTimestamp: number): Promise<number> {
        try {
            const events = await this.getAllEvents();
            const filteredEvents = events.filter(e => e.timestamp >= beforeTimestamp);
            const deletedCount = events.length - filteredEvents.length;

            await Preferences.set({
                key: STORAGE_KEY,
                value: JSON.stringify(filteredEvents),
            });

            logger.info(`Deleted ${deletedCount} old security events`);
            return deletedCount;
        } catch (error) {
            logger.error('Failed to delete old events', error);
            return 0;
        }
    },
};

// Convenience functions for common event types
export const logAuthSuccess = (details?: Record<string, any>) =>
    SecurityEventLogger.logEvent('auth_success', 'Authentication successful', details);

export const logAuthFailure = (details?: Record<string, any>) =>
    SecurityEventLogger.logEvent('auth_failure', 'Authentication failed', details);

export const logRateLimitTriggered = (details?: Record<string, any>) =>
    SecurityEventLogger.logEvent('rate_limit_triggered', 'Rate limit triggered', details);

export const logAccountLocked = (details?: Record<string, any>) =>
    SecurityEventLogger.logEvent('account_locked', 'Account locked due to failed attempts', details);

export const logOTPGenerated = (details?: Record<string, any>) =>
    SecurityEventLogger.logEvent('otp_generated', 'OTP code generated', details);

export const logOTPVerified = (details?: Record<string, any>) =>
    SecurityEventLogger.logEvent('otp_verified', 'OTP verification successful', details);

export const logRootDetected = (details?: Record<string, any>) =>
    SecurityEventLogger.logEvent('root_detected', 'Root/modified device detected', details);
