import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const LinkInterceptionContext = createContext<LinkInterceptionContextType | undefined>(undefined);

const HISTORY_KEY = 'lg_link_history';
const MAX_HISTORY = 50;

interface LinkInterceptionProviderProps {
  children: ReactNode;
}

export function LinkInterceptionProvider({ children }: LinkInterceptionProviderProps) {
  const [currentLink, setCurrentLink] = useState<InterceptedLink | null>(null);
  const [linkHistory, setLinkHistory] = useState<InterceptedLink[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  const saveHistory = (history: InterceptedLink[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch {
      // Ignore storage errors
    }
  };

  const interceptLink = (url: string, source?: string) => {
    const link: InterceptedLink = {
      url,
      source,
      timestamp: new Date(),
    };
    setCurrentLink(link);
    
    // Add to history
    const newHistory = [link, ...linkHistory].slice(0, MAX_HISTORY);
    setLinkHistory(newHistory);
    saveHistory(newHistory);
  };

  const clearLink = () => {
    setCurrentLink(null);
  };

  const allowLink = () => {
    if (currentLink) {
      // In a real Android app, this would open the link
      // For web demo, we'll open in a new tab
      window.open(currentLink.url, '_blank', 'noopener,noreferrer');
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
