/**
 * Alert Sound Service
 * 
 * Provides audio notification sounds for dangerous site detection.
 * Uses Web Audio API to generate notification tones without external files.
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (must be called after user interaction due to browser policies)
 */
function getAudioContext(): AudioContext | null {
    if (!audioContext) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            return null;
        }
    }
    return audioContext;
}

/**
 * Play a warning notification sound
 * Subtle but noticeable - two-tone alert
 */
export async function playWarningSound(): Promise<void> {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        // Resume audio context if suspended (required by browsers)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const now = ctx.currentTime;

        // Create oscillator for alert tone
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Warning tone: two beeps (lower frequency, more gentle)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now); // A5 note
        oscillator.frequency.setValueAtTime(660, now + 0.15); // E5 note

        // Set volume (not too loud - professional notification)
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    } catch (e) {
        console.warn('Failed to play warning sound:', e);
    }
}

/**
 * Play a danger/blocked notification sound
 * More urgent alert for blocked links
 */
export async function playDangerSound(): Promise<void> {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        // Resume audio context if suspended
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const now = ctx.currentTime;

        // Create oscillator for alert tone
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Danger tone: three quick beeps (higher pitched, more urgent but still subtle)
        oscillator.type = 'sine';

        // Three-beep pattern
        oscillator.frequency.setValueAtTime(1000, now);        // First beep
        oscillator.frequency.setValueAtTime(0, now + 0.08);    // Silence
        oscillator.frequency.setValueAtTime(1000, now + 0.12); // Second beep
        oscillator.frequency.setValueAtTime(0, now + 0.20);    // Silence
        oscillator.frequency.setValueAtTime(1200, now + 0.24); // Third beep (higher)

        // Volume envelope (not too loud)
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.setValueAtTime(0.25, now + 0.30);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        oscillator.start(now);
        oscillator.stop(now + 0.4);
    } catch (e) {
        console.warn('Failed to play danger sound:', e);
    }
}

/**
 * Play a simple notification beep
 * Single short beep for general alerts
 */
export async function playNotificationBeep(): Promise<void> {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const now = ctx.currentTime;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
    } catch (e) {
        console.warn('Failed to play notification beep:', e);
    }
}
