import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserRole } from './useUserRole';

interface PremiumActionLimits {
  profile_analysis: {
    days_between_analysis: number;
  };
  post_optimization: {
    max_per_post: number;
    monthly_limit: number;
  };
}

const ROLE_LIMITS: { [key: string]: PremiumActionLimits } = {
  PREMIUM: {
    profile_analysis: {
      days_between_analysis: 30,
    },
    post_optimization: {
      max_per_post: 3,
      monthly_limit: 30,
    },
  },
  PRO: {
    profile_analysis: {
      days_between_analysis: 7,
    },
    post_optimization: {
      max_per_post: 5,
      monthly_limit: 100,
    },
  },
};

export const usePremiumActions = () => {
  const { role } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerAction = async (
    actionType: 'profile_analysis' | 'post_optimization',
    metadata: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Usuario no autenticado');

      const { error: insertError } = await supabase
        .from('premium_actions')
        .insert([{
          user_id: user.id,
          action_type: actionType,
          metadata
        }]);

      if (insertError) throw insertError;

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkProfileAnalysisLimit = async (): Promise<boolean> => {
    if (!role || !ROLE_LIMITS[role]) return false;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return false;

      const { data: lastAnalysis } = await supabase
        .from('premium_actions')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('action_type', 'profile_analysis')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!lastAnalysis || lastAnalysis.length === 0) return true;

      const lastAnalysisDate = new Date(lastAnalysis[0].created_at);
      const daysSinceLastAnalysis = Math.floor(
        (new Date().getTime() - lastAnalysisDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysSinceLastAnalysis >= ROLE_LIMITS[role].profile_analysis.days_between_analysis;
    } catch (err) {
      console.error('Error al verificar límite de análisis:', err);
      return false;
    }
  };

  const checkPostOptimizationLimit = async (postId: string): Promise<boolean> => {
    if (!role || !ROLE_LIMITS[role]) return false;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return false;

      // Verificar límite por post
      const { data: postOptimizations } = await supabase
        .from('premium_actions')
        .select('id')
        .eq('user_id', user.id)
        .eq('action_type', 'post_optimization')
        .contains('metadata', { post_id: postId });

      if (postOptimizations && postOptimizations.length >= ROLE_LIMITS[role].post_optimization.max_per_post) {
        return false;
      }

      // Verificar límite mensual
      const { data: monthlyActions } = await supabase
        .rpc('get_monthly_actions', {
          p_user_id: user.id
        });

      const monthlyOptimizations = monthlyActions?.find(
        action => action.action_type === 'post_optimization'
      )?.count || 0;

      return monthlyOptimizations < ROLE_LIMITS[role].post_optimization.monthly_limit;
    } catch (err) {
      console.error('Error al verificar límite de optimizaciones:', err);
      return false;
    }
  };

  return {
    registerAction,
    checkProfileAnalysisLimit,
    checkPostOptimizationLimit,
    loading,
    error
  };
};