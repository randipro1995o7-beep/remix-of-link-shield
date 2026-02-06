import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApp } from './AppContext';

export interface InterceptedLink {
  url: string;
  source?: string; // e.g., "WhatsApp", "SMS", "Email"
  timestamp: Date;
}

interface LinkInterceptionContextType {
  currentLink: InterceptedLink | null;
  interceptLink: (url: string, source?: string) => void;
  clearLink: () => void;
  allowLink: () => void;
  blockLink: () => void;
  linkHistory: InterceptedLink[];
  whitelist: string[];
  addToWhitelist: (url: string) => void;
  removeFromWhitelist: (domain: string) => void;
  isWhitelisted: (url: string) => boolean;
}

const LinkInterceptionContext = createContext<LinkInterceptionContextType | undefined>(undefined);

const HISTORY_KEY = 'lg_link_history';
const WHITELIST_KEY = 'lg_whitelist';
const MAX_HISTORY = 50;

interface LinkInterceptionProviderProps {
  children: ReactNode;
}

export function LinkInterceptionProvider({ children }: LinkInterceptionProviderProps) {
  const { state } = useApp();
  const [currentLink, setCurrentLink] = useState<InterceptedLink | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WHITELIST_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      // Default trusted sites for new users
      return [
        'youtube.com',
        'google.com',
        'facebook.com',
        'instagram.com',
        'twitter.com',
        'whatsapp.com',
        'linkedin.com'
      ];
    } catch {
      return [];
    }
  });

  const [linkHistory, setLinkHistory] = useState<InterceptedLink[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: { url: string; source?: string; timestamp: string }) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(WHITELIST_KEY, JSON.stringify(whitelist));
  }, [whitelist]);

  const saveHistory = (history: InterceptedLink[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch {
      // Ignore storage errors
    }
  };

  const getDomain = (urlKey: string) => {
    try {
      // Try strict parsing first
      const urlObj = new URL(urlKey);
      return urlObj.hostname;
    } catch {
      // If that fails, it might be a raw domain (e.g. "google.com")
      // Try string manipulation or adding protocol
      try {
        if (!urlKey.startsWith('http')) {
          return new URL('https://' + urlKey).hostname;
        }
      } catch {
        // ignore
      }
      return null;
    }
  };

  const isWhitelisted = (url: string) => {
    const domain = getDomain(url);
    return domain ? whitelist.includes(domain) : false;
  };

  const addToWhitelist = (url: string) => {
    const domain = getDomain(url);
    if (domain && !whitelist.includes(domain)) {
      setWhitelist(prev => [...prev, domain]);
    }
  };

  const removeFromWhitelist = (domain: string) => {
    setWhitelist(prev => prev.filter(d => d !== domain));
  };

  const openInExternalBrowser = async (url: string) => {
    try {
      // Use Capacitor Browser to open link in external browser
      // This bypasses our intent filter and prevents infinite loop
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    } catch (error) {
      console.error('Failed to open browser:', error);
      // Fallback for web: open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Refs to access latest state in callbacks without triggering re-renders
  const stateRef = React.useRef(state);
  const whitelistRef = React.useRef(whitelist);
  const linkHistoryRef = React.useRef(linkHistory);

  useEffect(() => {
    stateRef.current = state;
    whitelistRef.current = whitelist;
    linkHistoryRef.current = linkHistory;
  }, [state, whitelist, linkHistory]);

  const [pendingUrl, setPendingUrl] = useState<{ url: string, source?: string } | null>(null);

  // Process pending link once app is initialized
  useEffect(() => {
    if (state.isInitialized && pendingUrl) {
      // We can safely call the stable interceptLink here
      interceptLink(pendingUrl.url, pendingUrl.source);
      setPendingUrl(null);
    }
  }, [state.isInitialized, pendingUrl]);

  const interceptLink = React.useCallback((url: string, source?: string) => {
    const currentState = stateRef.current;

    // Wait for app to be fully initialized before making decisions
    if (!currentState.isInitialized) {
      setPendingUrl({ url, source });
      return;
    }

    // If protection is disabled, bypass everything and open directly
    if (!currentState.isProtectionEnabled) {
      openInExternalBrowser(url);
      return;
    }

    // Check whitelist first
    const domain = getDomain(url);
    const isWhitelisted = domain ? whitelistRef.current.includes(domain) : false;

    if (isWhitelisted) {
      openInExternalBrowser(url);
      return;
    }

    const link: InterceptedLink = {
      url,
      source,
      timestamp: new Date(),
    };
    setCurrentLink(link);

    // Add to history
    const currentHistory = linkHistoryRef.current;
    const newHistory = [link, ...currentHistory].slice(0, MAX_HISTORY);
    setLinkHistory(newHistory);
    saveHistory(newHistory);
  }, []);

  const clearLink = () => {
    setCurrentLink(null);
  };

  const allowLink = async () => {
    if (currentLink) {
      // Auto-add to whitelist when user manually approves
      addToWhitelist(currentLink.url);
      await openInExternalBrowser(currentLink.url);
    }
    setCurrentLink(null);
  };

  const blockLink = () => {
    setCurrentLink(null);
  };

  return (
    <LinkInterceptionContext.Provider
      value={{
        currentLink,
        interceptLink,
        clearLink,
        allowLink,
        blockLink,
        linkHistory,
        whitelist,
        addToWhitelist,
        removeFromWhitelist,
        isWhitelisted,
      }}
    >
      {children}
    </LinkInterceptionContext.Provider>
  );
}

export function useLinkInterception(): LinkInterceptionContextType {
  const context = useContext(LinkInterceptionContext);
  if (context === undefined) {
    throw new Error('useLinkInterception must be used within a LinkInterceptionProvider');
  }
  return context;
}
