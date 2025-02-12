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
        // Intentar recuperar la sesión almacenada
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) throw error;
          
          setState(prev => ({
            ...prev,
            session,
            isLoading: false,
          }));

          // Si hay una sesión, verificar y refrescar el token si es necesario
          if (session) {
            const { data: { session: refreshedSession }, error: refreshError } = 
              await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Error al refrescar la sesión:', refreshError);
              // Si hay un error al refrescar, intentamos cerrar sesión y redirigir
              await supabase.auth.signOut();
              navigate('/login');
            } else if (refreshedSession && mounted) {
              setState(prev => ({
                ...prev,
                session: refreshedSession,
              }));
            }
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

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (mounted) {
          console.log('Cambio en el estado de autenticación:', event);
          
          if (event === 'SIGNED_OUT') {
            // Limpiar el estado local
            setState(prev => ({
              ...prev,
              session: null,
              isLoading: false,
            }));
            // Redirigir al login
            navigate('/login');
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setState(prev => ({
              ...prev,
              session: newSession,
              isLoading: false,
            }));
          }
        }
      }
    );

    // Configurar un intervalo para refrescar el token periódicamente
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (!refreshError && refreshedSession && mounted) {
          setState(prev => ({
            ...prev,
            session: refreshedSession,
          }));
        }
      }
    }, 10 * 60 * 1000); // Refrescar cada 10 minutos

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [navigate]);

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