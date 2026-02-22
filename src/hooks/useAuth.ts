import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { AuthSession } from '../types/auth';

export interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  error: Error | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    session: null,
    isLoading: true,
    error: null,
  });

  const navigate = useNavigate();

  const updateSession = useCallback((session: AuthSession | null) => {
    setState(prev => ({
      ...prev,
      session,
      isLoading: false,
    }));
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Try to get stored session
        const stored = api.getStoredSession();

        if (!stored) {
          if (mounted) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        // Refresh the token to verify it's still valid
        const refreshed = await api.refresh();
        if (mounted) {
          if (refreshed) {
            updateSession(refreshed);
          } else {
            // Session expired
            updateSession(null);
          }
        }
      } catch (error) {
        console.error('Error al inicializar la autenticación:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: error as Error,
            isLoading: false,
          }));
        }
      }
    };

    initialize();

    // Refresh token periodically (every 10 minutes)
    const refreshInterval = setInterval(async () => {
      const session = api.getStoredSession();
      if (session) {
        const refreshed = await api.refresh();
        if (refreshed && mounted) {
          updateSession(refreshed);
        }
      }
    }, 10 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, [updateSession]);

  const signOut = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    window.location.href = '/';
  };

  return {
    ...state,
    signOut,
    isAuthenticated: !!state.session,
  };
};
