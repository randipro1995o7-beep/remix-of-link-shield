import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Language, getTranslation, TranslationKeys } from '@/i18n/translations';

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
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  STATE: 'linkguardian_state',
} as const;

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.STATE);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Restore language
          if (parsed.language) {
            dispatch({ type: 'SET_LANGUAGE', payload: parsed.language });
          }
          
          // Restore notifications preference
          if (typeof parsed.notificationsEnabled === 'boolean') {
            dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: parsed.notificationsEnabled });
          }
          
          // Restore stats
          if (parsed.protectionStats) {
            dispatch({
              type: 'UPDATE_STATS',
              payload: {
                ...parsed.protectionStats,
                protectedSince: parsed.protectionStats.protectedSince
                  ? new Date(parsed.protectionStats.protectedSince)
                  : null,
              },
            });
          }
        }
        
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        console.error('Failed to load persisted state:', error);
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };
    
    loadPersistedState();
  }, []);
  
  // Persist state changes
  useEffect(() => {
    if (!state.isInitialized) return;
    
    try {
      const toPersist = {
        language: state.language,
        notificationsEnabled: state.notificationsEnabled,
        protectionStats: state.protectionStats,
      };
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(toPersist));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }, [state.language, state.notificationsEnabled, state.protectionStats, state.isInitialized]);
  
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
  
  const value: AppContextType = {
    state,
    dispatch,
    t,
    setProtectionEnabled,
    setLanguage,
    grantPermission,
    clearError,
  };
  
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
