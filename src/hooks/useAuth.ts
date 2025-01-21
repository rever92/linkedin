import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

export interface AuthState {
  session: Session | null;
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
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Obtener la sesión del servidor
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) throw error;
          
          setState(prev => ({
            ...prev,
            session,
            isLoading: false,
          }));
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

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          setState(prev => ({
            ...prev,
            session: newSession,
            isLoading: false,
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setState(prev => ({
        ...prev,
        error: error as Error,
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    ...state,
    signOut,
    isAuthenticated: !!state.session,
  };
}; 