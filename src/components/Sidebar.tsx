import React, { useState, useEffect } from 'react';
import { Star, LineChart, LogOut, Calendar, Crown, Rocket, User2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';
import { useUserRole } from '../hooks/useUserRole';
import { usePremiumActions } from '../hooks/usePremiumActions';

interface UsageStats {
  profile_analysis: {
    used: number;
    total: number;
  };
  post_optimization: {
    used: number;
    total: number;
  };
}

interface MonthlyAction {
  action_type: string;
  count: number;
}

interface RoleLimit {
  action_type: string;
  limit_type: string;
  limit_value: number;
}

const UsageStats: React.FC = () => {
  const { role } = useUserRole();
  const [stats, setStats] = useState<UsageStats>({
    profile_analysis: { used: 0, total: 0 },
    post_optimization: { used: 0, total: 0 }
  });

  useEffect(() => {
    const loadUsageStats = async () => {
      try {
        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Obtener acciones del mes actual
        const { data: monthlyActions } = await supabase
          .rpc('get_monthly_actions', {
            p_user_id: user.id
          });

        // Obtener límites según el rol
        const { data: roleLimits } = await supabase
          .rpc('get_role_limits', {
            p_role: role
          });

        if (monthlyActions && roleLimits) {
          const newStats: UsageStats = {
            profile_analysis: {
              used: (monthlyActions as MonthlyAction[]).find(a => a.action_type === 'profile_analysis')?.count || 0,
              total: (roleLimits as RoleLimit[]).find(l => l.action_type === 'profile_analysis' && l.limit_type === 'days_between_analysis')?.limit_value || 0
            },
            post_optimization: {
              used: (monthlyActions as MonthlyAction[]).find(a => a.action_type === 'post_optimization')?.count || 0,
              total: (roleLimits as RoleLimit[]).find(l => l.action_type === 'post_optimization' && l.limit_type === 'monthly_limit')?.limit_value || 0
            }
          };
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };

    loadUsageStats();
  }, [role]);

  const getRoleIcon = () => {
    switch (role) {
      case 'PRO':
        return <Rocket className="w-9 h-9 group-hover:w-5 group-hover:h-5 transition-all text-indigo-500" />;
      case 'PREMIUM':
        return <Crown className="w-9 h-9 group-hover:w-5 group-hover:h-5 transition-all text-yellow-500" />;
      default:
        return <User2 className="w-9 h-9 group-hover:w-5 group-hover:h-5 transition-all text-gray-500" />;
    }
  };

  const ProgressBar = ({ used, total }: { used: number; total: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
      <div
        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full"
        style={{ width: `${Math.min((used / total) * 100, 100)}%` }}
      />
    </div>
  );

  return (
    <div className="px-3 py-4 border-t border-gray-200">
      <div className="transition-all duration-200 opacity-0 group-hover:opacity-100 overflow-hidden">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Análisis de Perfil</span>
              <span>{stats.profile_analysis.used}/{stats.profile_analysis.total}</span>
            </div>
            <ProgressBar used={stats.profile_analysis.used} total={stats.profile_analysis.total} />
          </div>

          <div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Optimizaciones</span>
              <span>{stats.post_optimization.used}/{stats.post_optimization.total}</span>
            </div>
            <ProgressBar used={stats.post_optimization.used} total={stats.post_optimization.total} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mt-4">
        <div className="flex items-center justify-center flex-shrink-0">
          {getRoleIcon()}
        </div>
        <span className="font-medium text-sm mt-1 transition-all duration-200 opacity-0 group-hover:opacity-100">
          {role} Plan
        </span>
      </div>
    </div>
  );
};

interface SidebarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView }) => {
  const { canAccessBetaFeature } = useUserRole();

  const menuItems = [
    { id: 'analysis', label: 'Análisis', icon: <LineChart className="w-5 h-5" /> },
    { 
      id: 'planner', 
      label: 'Planificador', 
      icon: <Calendar className="w-5 h-5" />,
      isBeta: true,
      betaMessage: 'Disponible solo para beta testers'
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="relative">
      <div className="fixed top-0 left-0 h-full bg-white border-r border-[#e5e7eb] transition-all duration-300 ease-in-out z-40 w-20 hover:w-64 group rounded-r-[20px] rounded-tl-[0%] rounded-bl-[0%]">
        <div className="flex flex-col h-full py-4">
          <div className="px-4 mb-6">
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-xl font-bold text-foreground transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap">
                Linksight
              </h2>
            </div>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            {menuItems.map((item) => {
              const isDisabled = item.isBeta && !canAccessBetaFeature('beta_' + item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && onNavigate(item.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center px-3 py-2.5 transition-all relative
                    group-hover:rounded-lg group-hover:px-3 
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : currentView !== item.id && 'hover:bg-black/5'}
                    ${currentView === item.id 
                      ? 'bg-primary text-white group-hover:rounded-full !rounded-full group-hover:!rounded-full [&_svg]:text-white' 
                      : ''} rounded-full`}
                  title={isDisabled ? item.betaMessage : ''}
                >
                  <span className={`flex items-center justify-center flex-shrink-0 transition-all
                    ${currentView === item.id ? 'w-9 h-9 group-hover:w-5 group-hover:h-5' : 'w-5 h-5'}`}>
                    {item.icon}
                  </span>
                  <div className="ml-3 transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap">
                    <span className={currentView === item.id ? 'text-white' : ''}>
                      {item.label}
                    </span>
                    {item.isBeta && (
                      <span className="ml-2 text-xs text-gray-500">
                        (Beta)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Estadísticas de uso */}
          <UsageStats />

          {/* Botón de cerrar sesión */}
          <div className="px-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2.5 rounded-lg text-black hover:bg-black/5"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap">
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 