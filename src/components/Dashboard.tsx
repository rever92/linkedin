import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LinkedInPost, DashboardStats } from '../types';
import { Activity, ThumbsUp, MessageCircle, Share2, Eye } from 'lucide-react';
import MetricSelector from './MetricSelector';
import PostsTable from './PostsTable';

interface DashboardProps {
  data: LinkedInPost[];
}

export default function Dashboard({ data }: DashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState('views');

  const stats: DashboardStats = {
    totalPosts: data.length,
    totalViews: data.reduce((sum, post) => sum + post.views, 0),
    totalLikes: data.reduce((sum, post) => sum + post.likes, 0),
    totalComments: data.reduce((sum, post) => sum + post.comments, 0),
    totalShares: data.reduce((sum, post) => sum + post.shares, 0),
    avgEngagementRate: (data.reduce((sum, post) => 
      sum + ((post.likes + post.comments + post.shares) / post.views) * 100, 0) / data.length) || 0
  };

  const chartData = data
    .map(post => ({
      date: new Date(post.date),
      views: post.views,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      engagement: post.likes + post.comments + post.shares
    }))
    .filter(item => !isNaN(item.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(item => ({
      ...item,
      date: item.date.toLocaleDateString()
    }));

  const getBarColor = (metric: string) => {
    const colors = {
      views: '#3b82f6',
      likes: '#ef4444',
      comments: '#10b981',
      shares: '#8b5cf6',
      engagement: '#f59e0b'
    };
    return colors[metric as keyof typeof colors] || '#3b82f6';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={<Eye className="w-6 h-6" />}
        />
        <StatCard
          title="Total Likes"
          value={stats.totalLikes}
          icon={<ThumbsUp className="w-6 h-6" />}
        />
        <StatCard
          title="Total Comments"
          value={stats.totalComments}
          icon={<MessageCircle className="w-6 h-6" />}
        />
        <StatCard
          title="Total Shares"
          value={stats.totalShares}
          icon={<Share2 className="w-6 h-6" />}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Performance Over Time</h3>
          <MetricSelector 
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
          />
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey={selectedMetric}
                fill={getBarColor(selectedMetric)}
                name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <PostsTable data={data} />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
        </div>
        <div className="text-blue-500">{icon}</div>
      </div>
    </div>
  );
}