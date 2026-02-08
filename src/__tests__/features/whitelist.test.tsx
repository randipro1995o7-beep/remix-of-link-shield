import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LinkInterceptionProvider, useLinkInterception } from '../../contexts/LinkInterceptionContext';
import { AppProvider } from '../../contexts/AppContext';
import { ReactNode } from 'react';

// Mock dependencies
vi.mock('@capacitor/preferences', () => ({
    Preferences: {
        get: vi.fn().mockResolvedValue({ value: null }),
        set: vi.fn().mockResolvedValue({}),
        remove: vi.fn().mockResolvedValue({}),
        clear: vi.fn().mockResolvedValue({}),
        keys: vi.fn().mockResolvedValue({ keys: [] }),
    },
}));

vi.mock('@capacitor/app', () => ({
    App: {
        addListener: vi.fn().mockReturnValue(Promise.resolve({ remove: vi.fn() })),
    }
}));

// Mock other plugins that might be init-ed
vi.mock('@capacitor/network', () => ({
    Network: {
        addListener: vi.fn().mockReturnValue(Promise.resolve({ remove: vi.fn() })),
        getStatus: vi.fn().mockResolvedValue({ connected: true }),
    }
}));

// Wrapper
const wrapper = ({ children }: { children: ReactNode }) => (
    <AppProvider>
        <LinkInterceptionProvider>
            {children}
        </LinkInterceptionProvider>
    </AppProvider>
);

describe('LinkInterceptionContext - Whitelist', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should initialize with default whitelist', async () => {
        const { result } = renderHook(() => useLinkInterception(), { wrapper });

        // Wait for effect to run (if any async init)
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.whitelist).toContain('youtube.com');
        expect(result.current.whitelist).toContain('google.com');
    });

    it('should add a domain to whitelist', async () => {
        const { result } = renderHook(() => useLinkInterception(), { wrapper });

        await act(async () => {
            result.current.addToWhitelist('example.com');
        });

        expect(result.current.whitelist).toContain('example.com');
        expect(result.current.isWhitelisted('https://example.com')).toBe(true);
    });

    it('should remove a domain from whitelist', async () => {
        const { result } = renderHook(() => useLinkInterception(), { wrapper });

        // First ensure it's there (default or added)
        const domainToRemove = 'google.com';
        expect(result.current.whitelist).toContain(domainToRemove);

        await act(async () => {
            result.current.removeFromWhitelist(domainToRemove);
        });

        expect(result.current.whitelist).not.toContain(domainToRemove);
        expect(result.current.isWhitelisted('https://google.com')).toBe(false);
    });

    it('should correctly identify whitelisted URLs', async () => {
        const { result } = renderHook(() => useLinkInterception(), { wrapper });

        await act(async () => {
            result.current.addToWhitelist('test-site.com');
        });

        expect(result.current.isWhitelisted('https://test-site.com')).toBe(true);
        expect(result.current.isWhitelisted('http://test-site.com/some/path')).toBe(true);
        expect(result.current.isWhitelisted('https://sub.test-site.com')).toBe(false); // Exact match on hostname usually, let's verify logic
        // The current logic in LinkInterceptionContext.tsx:
        // const domain = getDomain(url);
        // return domain ? whitelist.includes(domain) : false;
        // getDomain uses new URL(url).hostname
        // So 'test-site.com' is in whitelist. 'sub.test-site.com' hostname is 'sub.test-site.com'. 
        // It probably won't match unless logic handles subdomains. The current implementation seems to check exact hostname match against whitelist array.
    });

    it('should persist whitelist to storage', async () => {
        // This is harder to test without inspecting the mock calls to Preferences
        // But we can verify the mock was called
        const { result } = renderHook(() => useLinkInterception(), { wrapper });

        const { Preferences } = await import('@capacitor/preferences');

        await act(async () => {
            result.current.addToWhitelist('persistent-site.com');
        });

        expect(Preferences.set).toHaveBeenCalled();
    });
});
