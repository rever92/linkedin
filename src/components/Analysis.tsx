// Analysis.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import Dashboard from './Dashboard';
import PostsAnalysis from './PostsAnalysis';
import AdvancedAnalysis from './AdvancedAnalysis';
import AIRecommendations from './AIRecommendations';
import { BarChart3, LayoutDashboard, TrendingUp, Sparkles } from 'lucide-react';

const Analysis = ({ data }) => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Análisis</h1>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full max-w-[600px] mb-8">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="posts">
            <BarChart3 className="w-4 h-4" />
            <span>Posts</span>
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <TrendingUp className="w-4 h-4" />
            <span>Análisis Avanzado</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Sparkles className="w-4 h-4" />
            <span>Recomendaciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Dashboard data={data} />
        </TabsContent>

        <TabsContent value="posts">
          <PostsAnalysis data={data} />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedAnalysis data={data} />
        </TabsContent>

        <TabsContent value="recommendations">
          <AIRecommendations data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analysis;
