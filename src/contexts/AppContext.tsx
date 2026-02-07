import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Language, getTranslation, TranslationKeys } from '@/i18n/translations';
import LinkShield from '@/plugins/LinkShield';
import { SafetyHistoryService } from '@/lib/storage';

// App State Types
interface ProtectionStats {
  linksChecked: number;
  threatsBlocked: number;
  protectedSince: Date | null;
}

interface PermissionStatus {
  accessibility: boolean;
  overlay: boolean;
  notifications: boolean;
}

interface AppState {
  // Protection status
  isProtectionEnabled: boolean;
  protectionStats: ProtectionStats;

  // Permissions
  permissions: PermissionStatus;

  // Settings
  language: Language;
  notificationsEnabled: boolean;

  // App status
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// Action Types
type AppAction =
  | { type: 'SET_PROTECTION_ENABLED'; payload: boolean }
  | { type: 'UPDATE_STATS'; payload: Partial<ProtectionStats> }
  | { type: 'SET_PERMISSION'; payload: { key: keyof PermissionStatus; value: boolean } }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_NOTIFICATIONS_ENABLED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_PERSISTED_STATE'; payload: Partial<AppState> }
  | { type: 'RESET_STATE' };

// Initial State
const initialState: AppState = {
  isProtectionEnabled: false,
  protectionStats: {
    linksChecked: 0,
    threatsBlocked: 0,
    protectedSince: null,
  },
  permissions: {
    accessibility: false,
    overlay: false,
    notifications: false,
  },
  language: 'en',
  notificationsEnabled: true,
  isLoading: true,
  isInitialized: false,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROTECTION_ENABLED':
      return {
        ...state,
        isProtectionEnabled: action.payload,
        protectionStats: action.payload && !state.protectionStats.protectedSince
          ? { ...state.protectionStats, protectedSince: new Date() }
          : state.protectionStats,
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        protectionStats: { ...state.protectionStats, ...action.payload },
      };

    case 'SET_PERMISSION':
      return {
        ...state,
        permissions: { ...state.permissions, [action.payload.key]: action.payload.value },
      };

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    case 'SET_NOTIFICATIONS_ENABLED':
      return { ...state, notificationsEnabled: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload, isLoading: false };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'LOAD_PERSISTED_STATE':
      return {
        ...state,
        ...action.payload,
        protectionStats: {
          ...state.protectionStats,
          ...(action.payload.protectionStats || {}),
        },
        permissions: {
          ...state.permissions,
          ...(action.payload.permissions || {}),
        },
      };

    case 'RESET_STATE':
      return { ...initialState, isInitialized: true, isLoading: false };

    default:
      return state;
  }
}

// Context Types
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  t: TranslationKeys;
  // Convenience methods
  setProtectionEnabled: (enabled: boolean) => void;
  setLanguage: (lang: Language) => void;
  grantPermission: (key: keyof PermissionStatus) => void;
  clearError: () => void;
  refreshStats: () => Promise<void>;
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage key for Capacitor Preferences
const STORAGE_KEY = 'linkguardian_app_state';

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Save state to Capacitor Preferences
  const saveState = useCallback(async (stateToSave: AppState) => {
    try {
      const toPersist = {
        language: stateToSave.language,
        notificationsEnabled: stateToSave.notificationsEnabled,
        protectionStats: {
          ...stateToSave.protectionStats,
          protectedSince: stateToSave.protectionStats.protectedSince?.toISOString() || null,
        },
        permissions: stateToSave.permissions,
        isProtectionEnabled: stateToSave.isProtectionEnabled,
      };
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(toPersist),
      });
      console.log('State saved to Preferences:', toPersist.permissions);
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }, []);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        console.log('Loading state from Preferences:', value);

        if (value) {
          const parsed = JSON.parse(value);

          // Build the state to load
          const loadedState: Partial<AppState> = {};

          if (parsed.language) {
            loadedState.language = parsed.language;
          }

          if (typeof parsed.notificationsEnabled === 'boolean') {
            loadedState.notificationsEnabled = parsed.notificationsEnabled;
          }

          if (parsed.protectionStats) {
            loadedState.protectionStats = {
              linksChecked: parsed.protectionStats.linksChecked || 0,
              threatsBlocked: parsed.protectionStats.threatsBlocked || 0,
              protectedSince: parsed.protectionStats.protectedSince
                ? new Date(parsed.protectionStats.protectedSince)
                : null,
            };
          }

          if (parsed.permissions) {
            loadedState.permissions = {
              accessibility: parsed.permissions.accessibility === true,
              overlay: parsed.permissions.overlay === true,
              notifications: parsed.permissions.notifications === true,
            };
            console.log('Loaded permissions:', loadedState.permissions);
          }

          if (typeof parsed.isProtectionEnabled === 'boolean') {
            loadedState.isProtectionEnabled = parsed.isProtectionEnabled;
            // Sync with native
            LinkShield.setProtectionEnabled({ enabled: parsed.isProtectionEnabled }).catch(() => { });
          }

          dispatch({ type: 'LOAD_PERSISTED_STATE', payload: loadedState });
        }

        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        console.error('Failed to load persisted state:', error);
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    loadPersistedState();
  }, []);

  // Persist state changes and sync with native layer
  useEffect(() => {
    if (!state.isInitialized) return;

    // Sync with native Android component
    try {
      LinkShield.setProtectionEnabled({ enabled: state.isProtectionEnabled }).catch(err =>
        console.error('Failed to sync protection state with native layer:', err)
      );
    } catch (e) {
      console.error('Error calling LinkShield plugin:', e);
    }

    // Save to Capacitor Preferences
    saveState(state);
  }, [state.language, state.notificationsEnabled, state.protectionStats, state.isProtectionEnabled, state.permissions, state.isInitialized, saveState]);

  // Get translations for current language
  const t = getTranslation(state.language);

  // Convenience methods
  const setProtectionEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_PROTECTION_ENABLED', payload: enabled });
  };

  const setLanguage = (lang: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  };

  const grantPermission = (key: keyof PermissionStatus) => {
    dispatch({ type: 'SET_PERMISSION', payload: { key, value: true } });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const refreshStats = useCallback(async () => {
    try {
      if (!SafetyHistoryService) {
        console.warn('SafetyHistoryService not available');
        return;
      }
      const insights = await SafetyHistoryService.getInsights();
      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          linksChecked: insights.totalLinksChecked,
          threatsBlocked: insights.linksCancelled + insights.linksBlocked,
        },
      });
    } catch (e) {
      console.error('Failed to refresh stats:', e);
    }
  }, []);

  const value: AppContextType = {
    state,
    dispatch,
    t,
    setProtectionEnabled,
    setLanguage,
    grantPermission,
    clearError,
    refreshStats,
  };

  // Initial stats load
  useEffect(() => {
    if (state.isInitialized) {
      refreshStats();
    }
  }, [state.isInitialized, refreshStats]);


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the context
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Export types for external use
export type { AppState, PermissionStatus, ProtectionStats };
