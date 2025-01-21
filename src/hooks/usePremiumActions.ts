import { useState } from 'react';
import { supabase } from '../lib/supabase';
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

  const getRoleLimits = async (role: string): Promise<PremiumActionLimits | null> => {
    try {
      console.log('Debug - Obteniendo límites para el rol:', role);
      
      const { data, error } = await supabase
        .from('premium_limits')
        .select('action_type, limit_type, limit_value')
        .eq('role', role.toUpperCase());

      if (error) throw error;

      console.log('Debug - Datos de límites obtenidos:', data);

      const limits: PremiumActionLimits = {
        profile_analysis: { days_between_analysis: 0, monthly_limit: 0 },
        post_optimization: { max_per_post: 0, monthly_limit: 0 },
        batch_analysis: { monthly_limit: 0 }
      };

      if (!data || data.length === 0) {
        console.error('No se encontraron límites para el rol:', role.toUpperCase());
        return null;
      }

      (data as Array<{ action_type: string; limit_type: string; limit_value: number }>).forEach((limit) => {
        if (limit.action_type === 'profile_analysis') {
          if (limit.limit_type === 'days_between_analysis') {
            limits.profile_analysis.days_between_analysis = limit.limit_value;
          } else if (limit.limit_type === 'monthly_limit') {
            limits.profile_analysis.monthly_limit = limit.limit_value;
          }
        } else if (limit.action_type === 'post_optimization') {
          if (limit.limit_type === 'max_per_post') {
            limits.post_optimization.max_per_post = limit.limit_value;
          } else if (limit.limit_type === 'monthly_limit') {
            limits.post_optimization.monthly_limit = limit.limit_value;
          }
        } else if (limit.action_type === 'batch_analysis') {
          if (limit.limit_type === 'monthly_limit') {
            limits.batch_analysis.monthly_limit = limit.limit_value;
          }
        }
      });

      console.log('Debug - Límites procesados:', limits);
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return false;

      // Verificar límite mensual basado en el ciclo de suscripción o mes natural
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('subscription_start_date, next_billing_date')
        .eq('id', user.id)
        .single();

      let cycleAnalyses = 0;

      if (userProfile?.subscription_start_date) {
        // Si hay fecha de suscripción, usar el ciclo personalizado
        const { data: cycleActions } = await supabase
          .rpc('get_current_cycle_actions', {
            p_user_id: user.id,
            p_subscription_start_date: userProfile.subscription_start_date
          });

        cycleAnalyses = cycleActions?.find(
          (action: { action_type: string; count: number }) => action.action_type === 'profile_analysis'
        )?.count || 0;
      } else {
        // Si no hay fecha de suscripción, usar el mes natural
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: monthlyActions } = await supabase
          .from('premium_actions')
          .select('id')
          .eq('user_id', user.id)
          .eq('action_type', 'profile_analysis')
          .gte('created_at', startOfMonth.toISOString());

        cycleAnalyses = monthlyActions?.length || 0;
      }

      // Si ya alcanzó el límite mensual, no permitir más análisis
      if (cycleAnalyses >= roleLimits.profile_analysis.monthly_limit) {
        return false;
      }

      // Verificar el límite diario
      const { data: lastAnalysis } = await supabase
        .from('premium_actions')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('action_type', 'profile_analysis')
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastAnalysis && lastAnalysis.length > 0) {
        const lastAnalysisDate = new Date(lastAnalysis[0].created_at);
        const daysSinceLastAnalysis = Math.floor(
          (new Date().getTime() - lastAnalysisDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Si no ha pasado al menos un día desde el último análisis
        if (daysSinceLastAnalysis < 1) {
          return false;
        }
      }

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

      if (postOptimizations && postOptimizations.length >= roleLimits.post_optimization.max_per_post) {
        return false;
      }

      // Verificar límite mensual
      const { data: monthlyActions } = await supabase
        .rpc('get_monthly_actions', {
          p_user_id: user.id
        });

      const monthlyOptimizations = monthlyActions?.find(
        (action: { action_type: string; count: number }) => action.action_type === 'post_optimization'
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return false;

      // Verificar límite mensual
      const { data: monthlyActions } = await supabase
        .rpc('get_monthly_actions', {
          p_user_id: user.id
        });

      const monthlyBatchAnalyses = monthlyActions?.find(
        (action: { action_type: string; count: number }) => action.action_type === 'batch_analysis'
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