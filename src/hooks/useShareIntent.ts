import { useEffect, useCallback } from 'react';
import { PluginListenerHandle } from '@capacitor/core';
import { useLinkInterception } from '@/contexts/LinkInterceptionContext';

// URL pattern to detect links
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

// Common source app detection from referrer or intent data
const detectSource = (url: string): string | undefined => {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('whatsapp') || lowerUrl.includes('wa.me')) {
    return 'WhatsApp';
  }
  if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram')) {
    return 'Telegram';
  }
  if (lowerUrl.includes('facebook') || lowerUrl.includes('fb.com')) {
    return 'Facebook';
  }
  if (lowerUrl.includes('instagram')) {
    return 'Instagram';
  }
  if (lowerUrl.includes('twitter') || lowerUrl.includes('x.com')) {
    return 'X (Twitter)';
  }

  return undefined;
};

export function useShareIntent() {
  const { interceptLink } = useLinkInterception();

  // Handle incoming share intent (simulated for web, real for Capacitor)
  const handleShareIntent = useCallback((data: { url?: string; text?: string }) => {
    let url = data.url;

    // If no direct URL, try to extract from shared text
    if (!url && data.text) {
      const matches = data.text.match(URL_REGEX);
      if (matches && matches.length > 0) {
        url = matches[0];
      }
    }

    if (url) {
      const source = detectSource(url);
      interceptLink(url, source);
    }
  }, [interceptLink]);

  useEffect(() => {
    // CAPACITOR: Listen for URLs opened from external apps (WhatsApp, Telegram, etc.)
    const handleAppUrlOpen = async () => {
      const { App } = await import('@capacitor/app');

      const listener = await App.addListener('appUrlOpen', (data) => {
        console.log('App opened with URL:', data.url);

        if (data.url) {
          // Extract the actual URL if it's a deep link to our app
          // The URL might be in format: https://link-shield-final.vercel.app/?url=https://example.com
          let targetUrl = data.url;

          try {
            const urlObj = new URL(data.url);
            const urlParam = urlObj.searchParams.get('url');
            if (urlParam) {
              targetUrl = urlParam;
            }
          } catch {
            // If parsing fails, use the original URL
          }

          const source = detectSource(data.url);
          interceptLink(targetUrl, source);
        }
      });

      return listener;
    };

    let appListener: PluginListenerHandle | null = null;
    handleAppUrlOpen().then(listener => {
      appListener = listener;
    });

    // Listen for links forwarded from native Android layer via MainActivity
    const handleNativeIntercepted = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string }>;
      if (customEvent.detail?.url) {
        console.log('Native intercepted link:', customEvent.detail.url);
        const source = detectSource(customEvent.detail.url);
        interceptLink(customEvent.detail.url, source);
      }
    };

    // For web demo: intercept link clicks on the page
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href) {
        const url = anchor.href;

        // Only intercept external links
        if (
          url.startsWith('http') &&
          !url.includes(window.location.hostname)
        ) {
          e.preventDefault();
          e.stopPropagation();

          const source = detectSource(url);
          interceptLink(url, source);
        }
      }
    };

    // Listen for custom events (for testing/demo purposes)
    const handleCustomShare = (e: CustomEvent) => {
      handleShareIntent(e.detail);
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('linkguardian:share', handleCustomShare as EventListener);
    window.addEventListener('linkguardian:intercepted', handleNativeIntercepted);

    return () => {
      // Cleanup Capacitor listener
      if (appListener) {
        appListener.remove();
      }

      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('linkguardian:share', handleCustomShare as EventListener);
      window.removeEventListener('linkguardian:intercepted', handleNativeIntercepted);
    };
  }, [interceptLink, handleShareIntent]);

  return {
    // Expose for manual testing
    simulateShare: handleShareIntent,
  };
}
