/**
 * Safety History Service
 * 
 * Tracks user's link safety decisions locally on-device.
 * All data stays local and can be cleared by the user.
 * 
 * Features:
 * - Track links checked, cancelled, opened, blocked
 * - Record high-risk encounters
 * - Analyze time-of-day patterns
 * - Generate human-friendly insights
 */

import { generalStorage } from './CapacitorStorageProvider';
import { STORAGE_KEYS, SafetyHistoryEntry, SafetyInsights } from './types';

const MAX_HISTORY_ENTRIES = 100; // Free tier limit
const MAX_HISTORY_ENTRIES_PREMIUM = 500; // Premium tier

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export const SafetyHistoryService = {
  /**
   * Record a new safety decision
   */
  async recordDecision(entry: Omit<SafetyHistoryEntry, 'id' | 'timestamp' | 'hourOfDay'>): Promise<void> {
    try {
      const history = await this.getHistory();
      const now = new Date();
      
      const newEntry: SafetyHistoryEntry = {
        ...entry,
        id: generateId(),
        timestamp: now.toISOString(),
        hourOfDay: now.getHours(),
      };

      // Add to beginning, limit size
      const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ENTRIES_PREMIUM);
      
      await generalStorage.save(STORAGE_KEYS.SAFETY_HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to record safety decision:', error);
      // Fail silently - history is non-critical
    }
  },

  /**
   * Get all history entries
   */
  async getHistory(limit?: number): Promise<SafetyHistoryEntry[]> {
    try {
      const data = await generalStorage.get(STORAGE_KEYS.SAFETY_HISTORY);
      if (!data) return [];
      
      const history = JSON.parse(data) as SafetyHistoryEntry[];
      return limit ? history.slice(0, limit) : history;
    } catch {
      return [];
    }
  },

  /**
   * Get aggregated insights in human-friendly format
   */
  async getInsights(): Promise<SafetyInsights> {
    const history = await this.getHistory();
    
    const insights: SafetyInsights = {
      totalLinksChecked: history.length,
      linksCancelled: history.filter(h => h.action === 'cancelled').length,
      linksOpened: history.filter(h => h.action === 'opened').length,
      linksBlocked: history.filter(h => h.action === 'blocked').length,
      highRiskEncounters: history.filter(h => h.riskLevel === 'high').length,
      riskByTimeOfDay: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Calculate risky link patterns by time of day
    history
      .filter(h => h.riskLevel === 'high' || h.riskLevel === 'medium')
      .forEach(h => {
        const timeOfDay = getTimeOfDay(h.hourOfDay);
        insights.riskByTimeOfDay[timeOfDay]++;
      });

    return insights;
  },

  /**
   * Generate human-friendly insight messages
   */
  async getHumanInsights(): Promise<string[]> {
    const insights = await this.getInsights();
    const messages: string[] = [];

    // Total activity
    if (insights.totalLinksChecked === 0) {
      messages.push("No links checked yet. We're here when you need us!");
    } else if (insights.totalLinksChecked < 10) {
      messages.push(`You've checked ${insights.totalLinksChecked} links so far. Good start!`);
    } else {
      messages.push(`You've reviewed ${insights.totalLinksChecked} links. Great safety awareness!`);
    }

    // Cancellation rate (positive framing)
    if (insights.totalLinksChecked > 5) {
      const cancelRate = insights.linksCancelled / insights.totalLinksChecked;
      if (cancelRate > 0.5) {
        messages.push("You're making thoughtful decisions by cancelling uncertain links.");
      }
    }

    // High-risk patterns
    if (insights.highRiskEncounters > 0) {
      messages.push(`We've helped you avoid ${insights.highRiskEncounters} high-risk links.`);
    }

    // Time-of-day patterns
    const timeEntries = Object.entries(insights.riskByTimeOfDay) as [string, number][];
    const maxTime = timeEntries.reduce<[string, number]>((max, curr) => 
      curr[1] > max[1] ? curr : max, ['', 0]);
    
    if (maxTime[1] >= 3) {
      const timeLabels: Record<string, string> = {
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'late at night',
      };
      messages.push(`You tend to encounter risky links ${timeLabels[maxTime[0]]}. Stay extra alert during these times.`);
    }

    return messages;
  },

  /**
   * Clear all history (user-initiated)
   */
  async clearHistory(): Promise<void> {
    await generalStorage.remove(STORAGE_KEYS.SAFETY_HISTORY);
  },

  /**
   * Get history limited by premium status
   */
  async getHistoryForDisplay(isPremium: boolean): Promise<SafetyHistoryEntry[]> {
    const limit = isPremium ? MAX_HISTORY_ENTRIES_PREMIUM : MAX_HISTORY_ENTRIES;
    return this.getHistory(limit);
  },
};
