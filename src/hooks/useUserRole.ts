import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'free' | 'pro' | 'business';

interface UserRoleData {
  role: UserRole;
  is_beta_tester: boolean;
  subscription_status: string;
  subscription_plan: string;
  subscription_expiry: string | null;
  trial_ends_at: string | null;
}

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>('free');
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trialing');
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);

  // Memoizar la función de actualización de estados
  const updateUserData = useCallback((data: UserRoleData) => {
    setRole(data.role.toLowerCase() as UserRole);
    setIsBetaTester(data.is_beta_tester);
    setSubscriptionStatus(data.subscription_status);
    setSubscriptionPlan(data.subscription_plan);
    setTrialEndsAt(data.trial_ends_at);
    setSubscriptionExpiry(data.subscription_expiry);
  }, []);

  // Memoizar la función de fetch
  const fetchUserRole = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;

      if (user) {
        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            role,
            is_beta_tester,
            subscription_status,
            subscription_plan,
            subscription_expiry,
            trial_ends_at
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (data) {
          updateUserData(data as UserRoleData);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [updateUserData]);

  useEffect(() => {
    let subscription: any;
    
    // Función para inicializar
    const initialize = async () => {
      await fetchUserRole();

      // Suscribirse a cambios solo después de la carga inicial
      subscription = supabase
        .channel('user_profile_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_profiles',
          },
          (payload) => {
            const newData = payload.new as UserRoleData;
            updateUserData(newData);
          }
        )
        .subscribe();
    };

    initialize();

    // Cleanup
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchUserRole, updateUserData]);

  const isPremium = useCallback(() => {
    return role !== 'free' && subscriptionStatus === 'active';
  }, [role, subscriptionStatus]);

  const hasAccess = useCallback((feature: string) => {
    // Si es una característica beta, solo los beta testers tienen acceso
    if (feature.startsWith('beta_')) {
      return isBetaTester;
    }

    // Para características premium
    if (feature.startsWith('premium_')) {
      if (role === 'free') return false;

      // Verificar estado de suscripción
      if (subscriptionStatus !== 'active') {
        const now = new Date();
        
        // Verificar período de prueba
        if (subscriptionStatus === 'trialing' && trialEndsAt) {
          const trial = new Date(trialEndsAt);
          return now < trial;
        }

        // Verificar suscripción expirada
        if (subscriptionExpiry) {
          const expiry = new Date(subscriptionExpiry);
          return now < expiry;
        }

        return false;
      }

      return true;
    }

    // Para características básicas
    return true;
  }, [role, isBetaTester, subscriptionStatus, trialEndsAt, subscriptionExpiry]);

  const canAccessBetaFeature = useCallback((feature: string) => {
    return isBetaTester;
  }, [isBetaTester]);

  return {
    role,
    loading,
    error,
    isPremium,
    isBetaTester,
    hasAccess,
    canAccessBetaFeature,
    subscriptionStatus,
    subscriptionPlan,
    trialEndsAt,
    subscriptionExpiry
  };
}; 