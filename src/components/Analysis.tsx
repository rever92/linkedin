// Analysis.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import Spinner from '@/components/ui/spinner';

// Componentes
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart3, LayoutDashboard, TrendingUp, Sparkles } from 'lucide-react';
import Dashboard from './Dashboard';
import PostsAnalysis from './PostsAnalysis';
import AdvancedAnalysis from './AdvancedAnalysis';
import AIRecommendations from './AIRecommendations';

// Tipos
import { LinkedInPost } from '../types';

export default function Analysis() {
  const [data, setData] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const posts = await api.getPosts();
        if (isMounted) {
          setData(posts || []);
        }
      } catch (err) {
        console.error('Error al cargar los datos:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/analysis/posts')) return 'posts';
    if (path.includes('/analysis/advanced')) return 'advanced';
    if (path.includes('/analysis/recommendations')) return 'recommendations';
    if (path === '/analysis' || path === '/analysis/') return 'dashboard';
    return 'dashboard';
  };

  const handleTabChange = (value: string) => {
    const route = value === 'dashboard' ? '/analysis' : `/analysis/${value}`;
    navigate(route);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">Análisis</h1>

      <Tabs
        defaultValue={getCurrentTab()}
        value={getCurrentTab()}
        onValueChange={handleTabChange}
      >
        <TabsList className="w-full max-w-[600px] mb-8">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="posts">
            <BarChart3 className="w-4 h-4 mr-2" />
            <span>Posts</span>
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span>Análisis Avanzado</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Sparkles className="w-4 h-4 mr-2" />
            <span>Recomendaciones</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <Routes>
            <Route index element={<Dashboard data={data} />} />
            <Route path="posts" element={<PostsAnalysis data={data} />} />
            <Route path="advanced" element={<AdvancedAnalysis data={data} />} />
            <Route path="recommendations" element={<AIRecommendations data={data} />} />
            <Route path="*" element={<Navigate to="/analysis" replace />} />
          </Routes>
        </div>
      </Tabs>
    </div>
  );
}
