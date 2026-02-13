import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApp } from './AppContext';
import { logger } from '@/lib/utils/logger';
import { SecureLocalStorage } from '@/lib/storage/SecureLocalStorage';
import PhishGuard, { PhishGuardResult, KNOWN_BRANDS, ThreatLevel } from '@/lib/services/PhishGuard';
import { UrlResolver, ResolvedUrlResult } from '@/lib/services/UrlResolver';
import GoogleSafeBrowsing, { SafeBrowsingResult } from '@/lib/services/GoogleSafeBrowsing';
import DomainAgeChecker, { DomainAgeResult } from '@/lib/services/DomainAgeChecker';
import { SafeLinkHeuristic } from '@/lib/services/SafeLinkHeuristic';

export interface InterceptedLink {
  url: string;
  finalUrl?: string; // The URL after following redirects
  source?: string; // e.g., "WhatsApp", "SMS", "Email"
  timestamp: Date;
  securityAnalysis?: PhishGuardResult;
  safeBrowsingResult?: SafeBrowsingResult;
  redirectInfo?: ResolvedUrlResult;
  domainAgeResult?: DomainAgeResult;
}

interface LinkInterceptionContextType {
  currentLink: InterceptedLink | null;
  interceptLink: (url: string, source?: string, isDemo?: boolean) => void;
  clearLink: () => void;
  allowLink: () => void;
  blockLink: () => void;
  linkHistory: InterceptedLink[];
  whitelist: string[];
  systemWhitelist: string[];
  addToWhitelist: (url: string) => void;
  removeFromWhitelist: (domain: string) => void;
  isWhitelisted: (url: string) => boolean;
}

const LinkInterceptionContext = createContext<LinkInterceptionContextType | undefined>(undefined);

const HISTORY_KEY = 'lg_link_history';
const WHITELIST_KEY = 'lg_whitelist';
const MAX_HISTORY = 50;

// Default trusted sites for new users
const DEFAULT_WHITELIST = [
  'youtube.com',
  'google.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'whatsapp.com',
  'linkedin.com',
  'safeguard-7c1a9.firebaseapp.com' // Firebase Auth domain - tidak boleh di-intercept
];

interface LinkInterceptionProviderProps {
  children: ReactNode;
}

export function LinkInterceptionProvider({ children }: LinkInterceptionProviderProps) {
  const { state } = useApp();
  const [currentLink, setCurrentLink] = useState<InterceptedLink | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [linkHistory, setLinkHistory] = useState<InterceptedLink[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from secure storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Migrate old localStorage data if exists
        const oldWhitelist = localStorage.getItem(WHITELIST_KEY);
        const oldHistory = localStorage.getItem(HISTORY_KEY);

        let finalWhitelist: string[] = [];

        // Load or migrate whitelist
        const storedWhitelist = await SecureLocalStorage.getItem(WHITELIST_KEY);
        if (storedWhitelist) {
          finalWhitelist = JSON.parse(storedWhitelist);
        } else if (oldWhitelist) {
          // Migrate from localStorage
          await SecureLocalStorage.setItem(WHITELIST_KEY, oldWhitelist);
          finalWhitelist = JSON.parse(oldWhitelist);
          localStorage.removeItem(WHITELIST_KEY);
          logger.info('Migrated whitelist from localStorage to secure storage');
        } else {
          // First run (or no data) - DO NOT set defaults here, they are now in systemWhitelist
          finalWhitelist = [];
        }

        // Clean up user whitelist: Remove any domains that are now part of systemWhitelist
        // This ensures they become read-only even if previously saved as user-editable
        const systemDomains = new Set([...DEFAULT_WHITELIST]);
        KNOWN_BRANDS.forEach(b => b.officialDomains.forEach(d => systemDomains.add(d)));

        const cleanedWhitelist = finalWhitelist.filter(domain => !systemDomains.has(domain));

        // If we filtered anything out, save the cleaned version
        if (cleanedWhitelist.length !== finalWhitelist.length) {
          await SecureLocalStorage.setItem(WHITELIST_KEY, JSON.stringify(cleanedWhitelist));
        }

        setWhitelist(cleanedWhitelist);

        // Load or migrate history
        const storedHistory = await SecureLocalStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          const history = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
          setLinkHistory(history);
        } else if (oldHistory) {
          // Migrate from localStorage
          await SecureLocalStorage.setItem(HISTORY_KEY, oldHistory);
          const parsed = JSON.parse(oldHistory);
          const history = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
          setLinkHistory(history);
          localStorage.removeItem(HISTORY_KEY);
          logger.info('Migrated link history from localStorage to secure storage');
        }
      } catch (error) {
        logger.error('Failed to load secure storage data', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  // Save whitelist when it changes
  useEffect(() => {
    if (isInitialized) {
      SecureLocalStorage.setItem(WHITELIST_KEY, JSON.stringify(whitelist)).catch(error => {
        logger.error('Failed to save whitelist', error);
      });
    }
  }, [whitelist, isInitialized]);

  const saveHistory = async (history: InterceptedLink[]) => {
    try {
      await SecureLocalStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch (error) {
      logger.error('Failed to save link history', error);
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

  // Flatten system trusted sites
  const systemWhitelist = React.useMemo(() => {
    const sites: string[] = [...DEFAULT_WHITELIST];
    KNOWN_BRANDS.forEach(brand => {
      sites.push(...brand.officialDomains);
    });
    return sites;
  }, []);

  const isWhitelisted = (url: string) => {
    const domain = getDomain(url);
    if (!domain) return false;

    // Check user whitelist (exact match)
    if (whitelist.includes(domain)) return true;

    // Check system whitelist (exact match)
    if (systemWhitelist.includes(domain)) return true;

    // Check if domain starts with www.
    if (domain.startsWith('www.')) {
      const domainNoWww = domain.replace(/^www\./, '');
      if (whitelist.includes(domainNoWww)) return true;
      if (systemWhitelist.includes(domainNoWww)) return true;
    }

    // Check if domain is a subdomain of any system whitelist domain
    // e.g. promo.shopee.co.id should match shopee.co.id
    // But be careful not to match malicioussubdomain.shopee.co.id.evil.com
    // The previous logic for `isWhitelisted` was exact match. PhishGuard handles brand impersonation.
    // Trusted sites usually mean "skip PhishGuard".
    // Let's keep it simple: Exact match or "parent domain match" if we want to trust subdomains.
    // For now, let's stick to the flattening logic + www handling.
    // Actually, officialDomains in PhishGuard are root domains usually.
    // Let's check for "endsWith" dot domain.

    const isSystemSubdomain = systemWhitelist.some(trusted =>
      domain.endsWith('.' + trusted)
    );

    return isSystemSubdomain;
  };

  const addToWhitelist = (url: string) => {
    const domain = getDomain(url);
    if (domain && !whitelist.includes(domain) && !systemWhitelist.includes(domain)) {
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
      logger.error('Failed to open browser', error);
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

  const interceptLink = React.useCallback(async (url: string, source?: string, isDemo?: boolean) => {
    try {
      const currentState = stateRef.current;

      // Wait for app to be fully initialized before making decisions
      if (!currentState.isInitialized) {
        setPendingUrl({ url, source });
        return;
      }

      // If protection is disabled and NOT a demo, bypass everything and open directly
      if (!currentState.isProtectionEnabled && !isDemo) {
        openInExternalBrowser(url);
        return;
      }

      // Gate 2: User whitelist check only
      // User-whitelisted domains bypass all checks (user's explicit trust decision)
      // System/brand domains are handled by SafeLinkHeuristic (Gate 3) with proper safety validation
      const domain = getDomain(url);

      if (domain && whitelistRef.current.includes(domain)) {
        openInExternalBrowser(url);
        return;
      }

      // Heuristic safe check — bypass review for obviously safe links
      // Uses trusted domains list, HTTPS, PhishGuard score, file extension, and reputation checks
      const heuristicResult = SafeLinkHeuristic.check(url, domain || '');
      if (heuristicResult.isSafe) {
        logger.info('Heuristic bypass: link is safe', { domain, reason: heuristicResult.reason });
        openInExternalBrowser(url);
        return;
      }

      // Resolve final URL (follow redirects) with chain tracking
      let finalUrl = url;
      let securityAnalysis;
      let redirectInfo: ResolvedUrlResult | undefined;

      try {
        redirectInfo = await UrlResolver.resolveWithChain(url);
        finalUrl = redirectInfo.finalUrl;
      } catch (error) {
        logger.error('UrlResolver failed, using original URL', error);
        finalUrl = url;
      }

      // Run PhishGuard analysis, Google Safe Browsing, and Domain Age check in parallel
      let safeBrowsingResult: SafeBrowsingResult | undefined;
      let domainAgeResult: DomainAgeResult | undefined;
      try {
        const [phishGuardResult, gsbResult, ageResult] = await Promise.all([
          Promise.resolve(PhishGuard.analyzeUrl(finalUrl)),
          GoogleSafeBrowsing.checkUrl(finalUrl).catch(err => {
            logger.error('Google Safe Browsing check failed', err);
            return undefined;
          }),
          DomainAgeChecker.checkDomainAge(new URL(finalUrl.startsWith('http') ? finalUrl : `https://${finalUrl}`).hostname).catch(err => {
            logger.error('Domain age check failed', err);
            return undefined;
          }),
        ]);

        securityAnalysis = phishGuardResult;
        safeBrowsingResult = gsbResult;
        domainAgeResult = ageResult;

        // If GSB found a threat, enhance the PhishGuard result
        if (safeBrowsingResult?.isThreat) {
          securityAnalysis = {
            ...securityAnalysis,
            isSuspicious: true,
            threatLevel: 'danger',
            score: Math.max(securityAnalysis.score, 80),
            reasons: [
              ...securityAnalysis.reasons,
              `Google Safe Browsing: ${safeBrowsingResult.threatDescription || safeBrowsingResult.threatType}`,
            ],
          };
        }

        // If redirect chain is suspicious, add to reasons
        if (redirectInfo?.isSuspiciousRedirect) {
          const redirectReasons: string[] = [];
          if (redirectInfo.crossDomainHops >= 2) {
            redirectReasons.push(`Suspicious redirect chain: ${redirectInfo.crossDomainHops} cross-domain hops detected`);
          }
          if (redirectInfo.totalRedirects >= 4) {
            redirectReasons.push(`Long redirect chain: ${redirectInfo.totalRedirects} redirects before reaching destination`);
          }
          if (redirectReasons.length > 0) {
            securityAnalysis = {
              ...securityAnalysis,
              score: Math.min(100, securityAnalysis.score + 15),
              reasons: [...securityAnalysis.reasons, ...redirectReasons],
            };
            // Re-evaluate threat level after adding redirect penalty
            if (securityAnalysis.score >= 50) {
              securityAnalysis = { ...securityAnalysis, isSuspicious: true, threatLevel: 'danger' };
            } else if (securityAnalysis.score >= 35) {
              securityAnalysis = { ...securityAnalysis, threatLevel: 'warning' };
            }
          }
        }
      } catch (error) {
        logger.error('PhishGuard analysis failed', error);
        // Fallback analysis (safe)
        securityAnalysis = { score: 0, isSuspicious: false, threatLevel: 'safe' as ThreatLevel, reasons: [], details: { brandImpersonationScore: 0, tldScore: 0, structureScore: 0, keywordScore: 0, pathAnalysisScore: 0 } };
      }

      const link: InterceptedLink = {
        url, // Keep original URL for display
        finalUrl: finalUrl !== url ? finalUrl : undefined, // Store final URL if different
        source,
        timestamp: new Date(),
        securityAnalysis,
        safeBrowsingResult,
        redirectInfo,
        domainAgeResult,
      };
      setCurrentLink(link);

      // Add to history
      try {
        const currentHistory = linkHistoryRef.current;
        const newHistory = [link, ...currentHistory].slice(0, MAX_HISTORY);
        setLinkHistory(newHistory);
        saveHistory(newHistory);
      } catch (e) {
        logger.error('Failed to save history', e);
      }
    } catch (error) {
      // Master catch-all: if anything fails, log it and show a safe fallback
      logger.error('Critical error in interceptLink', error);
      console.error('interceptLink critical error:', error);

      // Still set a link so the UI doesn't crash - use safe defaults
      setCurrentLink({
        url,
        finalUrl: undefined,
        source,
        timestamp: new Date(),
        securityAnalysis: {
          score: 0,
          isSuspicious: false,
          threatLevel: 'safe' as ThreatLevel,
          reasons: ['Error during analysis'],
          details: {
            brandImpersonationScore: 0,
            tldScore: 0,
            structureScore: 0,
            keywordScore: 0,
            pathAnalysisScore: 0
          }
        }
      });
    }
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
        systemWhitelist,
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
