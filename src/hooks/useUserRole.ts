import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'FREE' | 'PREMIUM' | 'PRO';

interface UserRoleData {
  role: UserRole;
  is_beta_tester: boolean;
  trial_ends_at: string | null;
  subscription_expiry: string | null;
}

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>('FREE');
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;

        if (user) {
          const { data, error: profileError } = await supabase
            .from('user_profiles')
            .select('role, is_beta_tester, trial_ends_at, subscription_expiry')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          if (data) {
            setRole(data.role);
            setIsBetaTester(data.is_beta_tester);
            setTrialEndsAt(data.trial_ends_at);
            setSubscriptionExpiry(data.subscription_expiry);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Suscribirse a cambios en el perfil del usuario
    const subscription = supabase
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
          setRole(newData.role);
          setIsBetaTester(newData.is_beta_tester);
          setTrialEndsAt(newData.trial_ends_at);
          setSubscriptionExpiry(newData.subscription_expiry);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isPremium = () => {
    return role === 'PREMIUM' || role === 'PRO';
  };

  const hasAccess = (feature: string) => {
    // Si es una característica beta, solo los beta testers tienen acceso
    if (feature.startsWith('beta_')) {
      return isBetaTester;
    }

    // Para características premium
    if (feature.startsWith('premium_')) {
      if (role === 'FREE') return false;

      // Verificar si el usuario premium está en período de prueba o suscripción activa
      const now = new Date();
      const trial = trialEndsAt ? new Date(trialEndsAt) : null;
      const subscription = subscriptionExpiry ? new Date(subscriptionExpiry) : null;

      return (trial && now < trial) || (subscription && now < subscription);
    }

    // Para características básicas
    return true;
  };

  const canAccessBetaFeature = (feature: string) => {
    return isBetaTester;
  };

  return {
    role,
    loading,
    error,
    isPremium,
    isBetaTester,
    hasAccess,
    canAccessBetaFeature,
    trialEndsAt,
    subscriptionExpiry
  };
}; 