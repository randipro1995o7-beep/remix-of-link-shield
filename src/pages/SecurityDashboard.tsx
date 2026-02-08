import React, { useEffect, useState } from 'react';
import { SecurityEventLogger, SecurityEvent, SecurityMetrics, SecurityEventType, SecurityEventSeverity } from '@/lib/security/SecurityEventLogger';
import { useNavigate } from 'react-router-dom';
import './SecurityDashboard.css';

export function SecurityDashboard() {
    const navigate = useNavigate();

    const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<SecurityEventType | 'all'>('all');
    const [filterSeverity, setFilterSeverity] = useState<SecurityEventSeverity | 'all'>('all');

    const loadData = React.useCallback(async () => {
        setLoading(true);
        try {
            // Get metrics
            const metricsData = await SecurityEventLogger.getMetrics();
            setMetrics(metricsData);

            // Get filtered events
            const filter: any = { limit: 50 };
            if (filterType !== 'all') filter.type = filterType;
            if (filterSeverity !== 'all') filter.severity = filterSeverity;

            const eventsData = await SecurityEventLogger.getEvents(filter);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to load security data', error);
        } finally {
            setLoading(false);
        }
    }, [filterType, filterSeverity]);

    // Load data
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleExportJSON = async () => {
        const json = await SecurityEventLogger.exportJSON();
        downloadFile(json, 'security-events.json', 'application/json');
    };

    const handleExportCSV = async () => {
        const csv = await SecurityEventLogger.exportCSV();
        downloadFile(csv, 'security-events.csv', 'text/csv');
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getSeverityIcon = (severity: SecurityEventSeverity) => {
        switch (severity) {
            case 'critical': return '🔴';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m ago`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }

        // Show date
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    if (loading) {
        return (
            <div className="security-dashboard loading">
                <div className="spinner"></div>
                <p>Loading security data...</p>
            </div>
        );
    }

    return (
        <div className="security-dashboard">
            <header className="dashboard-header">
                <button className="back-btn" onClick={() => navigate('/settings')}>
                    ← Back
                </button>
                <h1>Security Dashboard</h1>
            </header>

            {/* Metrics Summary */}
            {metrics && (
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-value">{metrics.last24h.authAttempts}</div>
                        <div className="metric-label">Auth Attempts</div>
                        <div className="metric-sublabel">Last 24h</div>
                    </div>

                    <div className="metric-card warning">
                        <div className="metric-value">{metrics.last24h.authFailures}</div>
                        <div className="metric-label">Failed Logins</div>
                        <div className="metric-sublabel">Last 24h</div>
                    </div>

                    <div className="metric-card critical">
                        <div className="metric-value">{metrics.last24h.rootDetections}</div>
                        <div className="metric-label">Root Detected</div>
                        <div className="metric-sublabel">Last 24h</div>
                    </div>

                    <div className="metric-card critical">
                        <div className="metric-value">{metrics.last24h.activeLockouts}</div>
                        <div className="metric-label">Active Locks</div>
                        <div className="metric-sublabel">Current</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters">
                <div className="filter-group">
                    <label>Event Type:</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                        <option value="all">All Types</option>
                        <option value="auth_success">Auth Success</option>
                        <option value="auth_failure">Auth Failure</option>
                        <option value="account_locked">Account Locked</option>
                        <option value="otp_generated">OTP Generated</option>
                        <option value="otp_verified">OTP Verified</option>
                        <option value="otp_failed">OTP Failed</option>
                        <option value="root_detected">Root Detected</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Severity:</label>
                    <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as any)}>
                        <option value="all">All Severities</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>

                <div className="export-buttons">
                    <button onClick={handleExportJSON} className="export-btn">
                        Export JSON
                    </button>
                    <button onClick={handleExportCSV} className="export-btn">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Events List */}
            <div className="events-container">
                <h2>Recent Security Events ({events.length})</h2>

                {events.length === 0 ? (
                    <div className="no-events">
                        <p>No security events found</p>
                    </div>
                ) : (
                    <div className="events-list">
                        {events.map(event => (
                            <div key={event.id} className={`event-item severity-${event.severity}`}>
                                <div className="event-icon">{getSeverityIcon(event.severity)}</div>
                                <div className="event-content">
                                    <div className="event-message">{event.message}</div>
                                    <div className="event-meta">
                                        <span className="event-type">{event.type.replace(/_/g, ' ')}</span>
                                        <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                                    </div>
                                    {event.details && Object.keys(event.details).length > 0 && (
                                        <div className="event-details">
                                            {JSON.stringify(event.details)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
