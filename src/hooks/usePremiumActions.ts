import { useState } from 'react';
import { api } from '../lib/api';
import { useUserRole } from './useUserRole';

interface PremiumActionLimits {
  profile_analysis: {
    days_between_analysis: number;
    monthly_limit: number;
  };
  post_optimization: {
    max_per_post: number;
    monthly_limit: number;
  };
  batch_analysis: {
    monthly_limit: number;
  };
}

export const usePremiumActions = () => {
  const { role } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerAction = async (
    actionType: 'profile_analysis' | 'post_optimization' | 'batch_analysis',
    metadata: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      await api.registerPremiumAction(actionType, metadata);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getRoleLimits = async (role: string): Promise<PremiumActionLimits | null> => {
    try {
      const limits = await api.getPremiumLimits();
      return limits;
    } catch (err) {
      console.error('Error al obtener límites:', err);
      return null;
    }
  };

  const checkProfileAnalysisLimit = async (): Promise<boolean> => {
    if (!role) return false;

    const roleLimits = await getRoleLimits(role);
    if (!roleLimits) return false;

    try {
      // Get cycle usage
      const cycleActions = await api.getPremiumCycleUsage();
      const cycleAnalyses = cycleActions.find(
        (a: any) => a.action_type === 'profile_analysis'
      )?.count || 0;

      if (cycleAnalyses >= roleLimits.profile_analysis.monthly_limit) {
        return false;
      }

      // Check daily limit - get recent actions
      const monthlyActions = await api.getPremiumUsage();
      // We'll use the cycle actions to approximate last analysis timing
      // For a more precise check, we'd need a dedicated endpoint
      return true;
    } catch (err) {
      console.error('Error al verificar límite de análisis:', err);
      return false;
    }
  };

  const checkPostOptimizationLimit = async (postId: string): Promise<boolean> => {
    if (!role) return false;

    const roleLimits = await getRoleLimits(role);
    if (!roleLimits) return false;

    try {
      const monthlyActions = await api.getPremiumUsage();
      const monthlyOptimizations = monthlyActions.find(
        (a: any) => a.action_type === 'post_optimization'
      )?.count || 0;

      return monthlyOptimizations < roleLimits.post_optimization.monthly_limit;
    } catch (err) {
      console.error('Error al verificar límite de optimizaciones:', err);
      return false;
    }
  };

  const checkBatchAnalysisLimit = async (): Promise<boolean> => {
    if (!role) return false;

    const roleLimits = await getRoleLimits(role);
    if (!roleLimits) return false;

    try {
      const monthlyActions = await api.getPremiumUsage();
      const monthlyBatchAnalyses = monthlyActions.find(
        (a: any) => a.action_type === 'batch_analysis'
      )?.count || 0;

      return monthlyBatchAnalyses < roleLimits.batch_analysis.monthly_limit;
    } catch (err) {
      console.error('Error al verificar límite de análisis por lotes:', err);
      return false;
    }
  };

  return {
    registerAction,
    checkProfileAnalysisLimit,
    checkPostOptimizationLimit,
    checkBatchAnalysisLimit,
    getRoleLimits,
    loading,
    error
  };
};
