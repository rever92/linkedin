import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LinkedInPost, DashboardStats } from '../types';
import { Activity, ThumbsUp, MessageCircle, Share2, Eye } from 'lucide-react';
import MetricSelector from './MetricSelector';
import PostsTable from './PostsTable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Dashboard.css';
import { format } from 'date-fns';
import FileUpload from './FileUpload';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';

interface DashboardProps {
  data: LinkedInPost[];
}

export default function Dashboard({ data }: DashboardProps) {
  const [selectedMetrics, setSelectedMetrics] = useState({
    views: true,
    likes: false,
    comments: false,
    shares: false,
  });
  const [dateRange, setDateRange] = useState('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    if (range === 'custom') {
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  };

  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRange) {
      case 'thisWeek':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'last6Months':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'lastYear':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'allTime':
        startDate = new Date(0);
        break;
      case 'custom':
        startDate = customStartDate || new Date(0);
        endDate = customEndDate || now;
        break;
      default:
        startDate = new Date(0);
    }

    return data.filter(post => {
      const postDate = new Date(post.date);
      return postDate >= startDate && postDate <= endDate;
    });
  };

  const filteredData = getFilteredData();

  const stats: DashboardStats = {
    totalPosts: filteredData.length,
    totalViews: filteredData.reduce((sum, post) => sum + post.views, 0),
    totalLikes: filteredData.reduce((sum, post) => sum + post.likes, 0),
    totalComments: filteredData.reduce((sum, post) => sum + post.comments, 0),
    totalShares: filteredData.reduce((sum, post) => sum + post.shares, 0),
    avgEngagementRate: (filteredData.reduce((sum, post) => 
      sum + ((post.likes + post.comments + post.shares) / post.views) * 100, 0) / filteredData.length) || 0
  };

  const handleMetricChange = (metric: 'views' | 'likes' | 'comments' | 'shares') => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const chartData = filteredData.map(post => ({
    date: new Date(post.date).toLocaleDateString(),
    views: post.views,
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
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

  const handleFileUpload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    const results = await new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: async (results) => {
          try {
            const posts = results.data.slice(1).map((row: any) => {
              const [datePart, timePart] = row[1].split(', ');
              const [day, month, year] = datePart.split('/');
              const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;

              return {
                url: row[0],
                date: isoDate,
                text: row[2],
                views: parseInt(row[3]) || 0,
                likes: parseInt(row[4]) || 0,
                comments: parseInt(row[5]) || 0,
                shares: parseInt(row[6]) || 0,
                post_type: row[7],
                user_id: user.id
              };
            });

            for (const post of posts) {
              const { error: upsertError } = await supabase
                .from('linkedin_posts')
                .upsert([{
                  url: post.url,
                  date: post.date,
                  text: post.text,
                  views: post.views,
                  likes: post.likes,
                  comments: post.comments,
                  shares: post.shares,
                  post_type: post.post_type,
                  user_id: user.id
                }], {
                  onConflict: ['url'],
                  ignoreDuplicates: false
                });

              if (upsertError) throw upsertError;
            }

            const { data: updatedPosts, error: loadError } = await supabase
              .from('linkedin_posts')
              .select('*')
              .order('date', { ascending: false });

            if (loadError) throw loadError;

            resolve(updatedPosts);
          } catch (err: any) {
            reject(err);
          }
        },
        header: false
      });
    });

    return results;
  };

  const handleUpdateData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        const file = target.files[0];
        try {
          const updatedData = await handleFileUpload(file);
          console.log(updatedData);
          // Aquí puedes actualizar el estado o hacer algo con los datos actualizados
        } catch (error) {
          console.error('Error al cargar el archivo:', error);
        }
      }
    };
    fileInput.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Performance Over Time</h3>
        <button 
          onClick={handleUpdateData} 
          className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-200"
        >
          Actualizar Datos
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <select value={dateRange} onChange={(e) => handleDateRangeChange(e.target.value)} className="border rounded-md p-1">
          <option value="thisWeek">Esta semana</option>
          <option value="thisMonth">Este mes</option>
          <option value="lastMonth">El mes pasado</option>
          <option value="last3Months">Últimos 3 meses</option>
          <option value="last6Months">Últimos 6 meses</option>
          <option value="lastYear">Último año</option>
          <option value="allTime">Todo el tiempo</option>
          <option value="custom">Personalizado</option>
        </select>
        {dateRange === 'custom' && (
          <div className="flex space-x-2">
            <DatePicker
              selected={customStartDate}
              onChange={(date) => setCustomStartDate(date)}
              placeholderText="Fecha de inicio"
            />
            <DatePicker
              selected={customEndDate}
              onChange={(date) => setCustomEndDate(date)}
              placeholderText="Fecha de fin"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Posts"
          value={stats.totalPosts}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="Visualizaciones"
          value={stats.totalViews}
          icon={<Eye className="w-6 h-6" />}
        />
        <StatCard
          title="Reacciones"
          value={stats.totalLikes}
          icon={<ThumbsUp className="w-6 h-6" />}
        />
        <StatCard
          title="Comentarios"
          value={stats.totalComments}
          icon={<MessageCircle className="w-6 h-6" />}
        />
        <StatCard
          title="Compartidos"
          value={stats.totalShares}
          icon={<Share2 className="w-6 h-6" />}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex space-x-4 mb-4">
          {Object.keys(selectedMetrics).map(metric => (
            <label key={metric} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedMetrics[metric as keyof typeof selectedMetrics]}
                onChange={() => handleMetricChange(metric as 'views' | 'likes' | 'comments' | 'shares')}
              />
              <span className="ml-2">{metric.charAt(0).toUpperCase() + metric.slice(1)}</span>
            </label>
          ))}
        </div>

        <div className="flex space-x-4 mb-4">
          {Object.keys(selectedMetrics).map(metric => (
            selectedMetrics[metric as keyof typeof selectedMetrics] && (
              <div key={metric} className="flex items-center">
                <div style={{ backgroundColor: getBarColor(metric), width: 20, height: 10 }} className="mr-2"></div>
                <span>{metric.charAt(0).toUpperCase() + metric.slice(1)}</span>
              </div>
            )
          ))}
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                stroke="#ffffff" 
                tick={{ fontSize: 12, fill: '#ffffff' }} 
                domain={['dataMin', 'dataMax']}
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis yAxisId="left" stroke="#ffffff" tick={{ fontSize: 12, fill: '#ffffff' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#ffffff" tick={{ fontSize: 12, fill: '#ffffff' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                itemStyle={{ color: '#ffffff' }} 
              />
              {selectedMetrics.views && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="views" 
                  stroke={getBarColor('views')} 
                  strokeWidth={2} 
                  dot={false} 
                />
              )}
              {selectedMetrics.likes && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="likes" 
                  stroke={getBarColor('likes')} 
                  strokeWidth={2} 
                  dot={false} 
                />
              )}
              {selectedMetrics.comments && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="comments" 
                  stroke={getBarColor('comments')} 
                  strokeWidth={2} 
                  dot={false} 
                />
              )}
              {selectedMetrics.shares && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="shares" 
                  stroke={getBarColor('shares')} 
                  strokeWidth={2} 
                  dot={false} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <PostsTable data={filteredData} />
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
