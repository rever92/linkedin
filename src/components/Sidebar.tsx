import React, { useState, useEffect } from 'react';
import { Star, LineChart, LogOut, Calendar, Crown, Rocket, User2 } from 'lucide-react';
import { api } from '../lib/api';
import ThemeToggle from './ThemeToggle';
import { useUserRole } from '../hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  currentPath: string;
}

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

const ProgressBar = ({ used, total }: { used: number; total: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
    <div
      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full"
      style={{ width: `${Math.min((used / total) * 100, 100)}%` }}
    />
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPath }) => {
  const { role, subscriptionStatus, subscriptionPlan, canAccessBetaFeature } = useUserRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UsageStats>({
    profile_analysis: { used: 0, total: 0 },
    post_optimization: { used: 0, total: 0 }
  });

  useEffect(() => {
    const loadUsageStats = async () => {
      try {
        const user = api.getUser();
        if (!user) return;

        // Obtener los límites del plan actual
        const limits = await api.getPremiumLimits();

        // Obtener el uso actual del usuario
        const monthlyActions = await api.getPremiumUsage();

        if (limits && monthlyActions) {
          const profileLimit = limits.profile_analysis?.monthly_limit || 0;
          const postLimit = limits.post_optimization?.monthly_limit || 0;

          const profileUsed = monthlyActions.find((a: any) => a.action_type === 'profile_analysis')?.count || 0;
          const postUsed = monthlyActions.find((a: any) => a.action_type === 'post_optimization')?.count || 0;

          console.log('Límites mensuales:', { profileLimit, postLimit });
          console.log('Uso actual:', { profileUsed, postUsed });

          setStats({
            profile_analysis: {
              used: profileUsed,
              total: profileLimit
            },
            post_optimization: {
              used: postUsed,
              total: postLimit
            }
          });
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };

    if (role) {
      loadUsageStats();
    }
  }, [role]);

  const getRoleIcon = () => {
    switch (subscriptionPlan?.toLowerCase()) {
      case 'premium':
        return <Crown className="w-9 h-9 group-hover:w-5 group-hover:h-5 transition-all text-yellow-500" />;
      case 'pro':
        return <Rocket className="w-9 h-9 group-hover:w-5 group-hover:h-5 transition-all text-indigo-500" />;
      case 'free':
      default:
        return <User2 className="w-9 h-9 group-hover:w-5 group-hover:h-5 transition-all text-gray-500" />;
    }
  };

  const getSubscriptionStatusBadge = () => {
    switch (subscriptionStatus) {
      case 'active':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
            Activa
          </span>
        );
      case 'trialing':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            Prueba
          </span>
        );
      case 'past_due':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
            Pago Pendiente
          </span>
        );
      case 'canceled':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Análisis',
      icon: <LineChart className="w-5 h-5" />,
      path: '/dashboard/analysis'
    },
    {
      id: 'planner',
      label: 'Planificador',
      icon: <Calendar className="w-5 h-5" />,
      path: '/planner',
      isBeta: true,
      betaMessage: 'Disponible solo para beta testers'
    }
  ];

  const isCurrentPath = (path: string) => {
    if (path === '/analysis') {
      return ['/analysis', '/posts', '/advanced', '/recommendations'].some((p) =>
        currentPath.startsWith(p)
      );
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className="relative">
      <div className="fixed top-0 left-0 h-full bg-white border-r border-[#e5e7eb] transition-all duration-300 ease-in-out z-40 w-20 hover:w-64 group rounded-r-[20px] rounded-tl-[0%] rounded-bl-[0%]">
        <div className="flex flex-col h-full">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-xl font-bold text-foreground transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap">
                Linksight
              </h2>
            </div>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            {menuItems.map((item) => {
              const isDisabled = item.isBeta && !canAccessBetaFeature;
              const isActive = isCurrentPath(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && navigate(item.path)}
                  disabled={isDisabled}
                  className={`w-full flex items-center px-3 py-2.5 transition-all relative
                    group-hover:rounded-lg group-hover:px-3 
                    ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : !isActive && 'hover:bg-black/5'
                    }
                    ${
                      isActive
                        ? 'bg-primary text-white group-hover:rounded-full !rounded-full group-hover:!rounded-full [&_svg]:text-white'
                        : ''
                    } rounded-full`}
                  title={isDisabled ? item.betaMessage : ''}
                >
                  <span
                    className={`flex items-center justify-center flex-shrink-0 transition-all
                    ${isActive ? 'w-9 h-9 group-hover:w-5 group-hover:h-5' : 'w-5 h-5'}`}
                  >
                    {item.icon}
                  </span>
                  <div className="ml-3 transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap">
                    <span className={isActive ? 'text-white' : ''}>{item.label}</span>
                    {item.isBeta && (
                      <span className="ml-2 text-xs text-gray-500">(Beta)</span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div className="px-3 py-2">
              <div className="transition-all duration-200 opacity-0 group-hover:opacity-100 overflow-hidden pointer-events-none group-hover:pointer-events-auto">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Análisis de Perfil</span>
                      <span>
                        {stats.profile_analysis.used}/{stats.profile_analysis.total}
                      </span>
                    </div>
                    <ProgressBar
                      used={stats.profile_analysis.used}
                      total={stats.profile_analysis.total}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Optimizaciones</span>
                      <span>
                        {stats.post_optimization.used}/{stats.post_optimization.total}
                      </span>
                    </div>
                    <ProgressBar
                      used={stats.post_optimization.used}
                      total={stats.post_optimization.total}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2">
              <div className="px-3">
                <div className={`flex items-center transition-all duration-300 ${!subscriptionPlan ? 'mb-2' : ''}`}>
                  <div className="flex-shrink-0">{getRoleIcon()}</div>
                  <div className="flex flex-col ml-3 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                    <span className="font-medium text-sm">
                      Plan {subscriptionPlan ? subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1) : 'Free'}
                    </span>
                    {getSubscriptionStatusBadge()}
                    <button
                      onClick={() => navigate('/pricing')}
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Ver planes y precios
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-3 py-2.5 transition-all relative group-hover:rounded-lg group-hover:px-3 hover:bg-black/5 rounded-full"
                >
                  <span className="flex items-center justify-center flex-shrink-0 w-5 h-5">
                    <LogOut className="w-5 h-5" />
                  </span>
                  <span className="ml-3 transition-opacity duration-200 opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap">
                    Cerrar Sesión
                  </span>
                </button>
                <div className="hidden">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
