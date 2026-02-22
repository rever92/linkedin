import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

export type UserRole = 'free' | 'pro' | 'business';

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>('free');
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    try {
      const user = api.getUser();
      if (user) {
        setRole((user.role || 'free').toLowerCase() as UserRole);
        setIsBetaTester(user.is_beta_tester || false);
        setSubscriptionStatus(user.subscription_status || 'none');
        setSubscriptionPlan(user.subscription_plan || 'free');
        setTrialEndsAt(user.trial_ends_at || null);
        setSubscriptionExpiry(user.subscription_expiry || null);
      }

      // Also fetch fresh data from the server
      const { user: freshUser } = await api.getMe();
      if (freshUser) {
        setRole((freshUser.role || 'free').toLowerCase() as UserRole);
        setIsBetaTester(freshUser.is_beta_tester || false);
        setSubscriptionStatus(freshUser.subscription_status || 'none');
        setSubscriptionPlan(freshUser.subscription_plan || 'free');
        setTrialEndsAt(freshUser.trial_ends_at || null);
        setSubscriptionExpiry(freshUser.subscription_expiry || null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const isPremium = useCallback(() => {
    return role !== 'free' && subscriptionStatus === 'active';
  }, [role, subscriptionStatus]);

  const hasAccess = useCallback((feature: string) => {
    if (feature.startsWith('beta_')) {
      return isBetaTester;
    }

    if (feature.startsWith('premium_')) {
      if (role === 'free') return false;

      if (subscriptionStatus !== 'active') {
        const now = new Date();

        if (subscriptionStatus === 'trialing' && trialEndsAt) {
          const trial = new Date(trialEndsAt);
          return now < trial;
        }

        if (subscriptionExpiry) {
          const expiry = new Date(subscriptionExpiry);
          return now < expiry;
        }

        return false;
      }

      return true;
    }

    return true;
  }, [role, isBetaTester, subscriptionStatus, trialEndsAt, subscriptionExpiry]);

  const canAccessBetaFeature = useCallback((_feature: string) => {
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
    subscriptionExpiry,
    refetch: fetchUserRole,
  };
};
