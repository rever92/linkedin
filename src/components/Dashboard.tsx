'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import { Activity, Eye, Heart, MessageCircle, Share2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { api } from '../lib/api';
import Papa from 'papaparse';
import { LinkedInPost, DashboardStats } from '../types';
import PostsTable from './PostsTable';
import AIRecommendations from './AIRecommendations';
import Spinner from "@/components/ui/spinner";

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
  const [dateRange, setDateRange] = useState('last28Days');
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<Array<{
    category: string;
    count: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  }>>([]);
  const [sortField, setSortField] = useState<'category' | 'count' | 'views' | 'likes' | 'comments' | 'shares' | 'engagementRate'>('engagementRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [postTypeData, setPostTypeData] = useState<Array<{
    post_type: string;
    count: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>>([]);

  const getFilteredData = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRange) {
      case 'last7Days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last28Days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 28);
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
        endDate = now;
        break;
      case 'custom':
        startDate = date?.from || new Date(0);
        endDate = date?.to || now;
        break;
      default:
        startDate = new Date(0);
    }

    return data.filter(post => {
      const postDate = new Date(post.date);
      return postDate >= startDate && postDate <= endDate;
    });
  }, [dateRange, date, data]);

  const filteredData = useMemo(() => getFilteredData(), [getFilteredData]);

  const stats = useMemo<DashboardStats>(() => ({
    totalPosts: filteredData.length,
    totalViews: filteredData.reduce((sum, post) => sum + post.views, 0),
    totalLikes: filteredData.reduce((sum, post) => sum + post.likes, 0),
    totalComments: filteredData.reduce((sum, post) => sum + post.comments, 0),
    totalShares: filteredData.reduce((sum, post) => sum + post.shares, 0),
    avgEngagementRate: (filteredData.reduce((sum, post) =>
      sum + ((post.likes + post.comments + post.shares) / post.views) * 100, 0) / filteredData.length) || 0
  }), [filteredData]);

  const engagementRate = useMemo(() => 
    filteredData.length > 0
      ? ((stats.totalLikes + stats.totalComments + stats.totalShares) / stats.totalViews) * 100
      : 0
  , [stats]);

  const perPostStats = useMemo(() => ({
    viewsPerPost: stats.totalViews / stats.totalPosts || 0,
    likesPerPost: stats.totalLikes / stats.totalPosts || 0,
    commentsPerPost: stats.totalComments / stats.totalPosts || 0,
    sharesPerPost: stats.totalShares / stats.totalPosts || 0
  }), [stats]);

  const getPreviousPeriodData = useCallback(() => {
    const now = new Date();
    let currentStartDate: Date;
    let currentEndDate: Date = now;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (dateRange) {
      case 'last7Days':
        currentStartDate = new Date(now);
        currentStartDate.setDate(now.getDate() - 7);
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setDate(currentStartDate.getDate() - 7);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'last28Days':
        currentStartDate = new Date(now);
        currentStartDate.setDate(now.getDate() - 28);
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setDate(currentStartDate.getDate() - 28);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'thisMonth':
        currentStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'lastMonth':
        currentStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        currentEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
      case 'last3Months':
        currentStartDate = new Date(now);
        currentStartDate.setMonth(now.getMonth() - 3);
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setMonth(currentStartDate.getMonth() - 3);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'last6Months':
        currentStartDate = new Date(now);
        currentStartDate.setMonth(now.getMonth() - 6);
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setMonth(currentStartDate.getMonth() - 6);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'lastYear':
        currentStartDate = new Date(now);
        currentStartDate.setFullYear(now.getFullYear() - 1);
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setFullYear(currentStartDate.getFullYear() - 1);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'custom':
        if (date?.from && date?.to) {
          const diffTime = Math.abs(date.to.getTime() - date.from.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          currentStartDate = date.from;
          currentEndDate = date.to;

          previousEndDate = new Date(date.from);
          previousEndDate.setDate(previousEndDate.getDate() - 1);
          previousStartDate = new Date(previousEndDate);
          previousStartDate.setDate(previousStartDate.getDate() - diffDays);
        } else {
          return [];
        }
        break;

      default:
        return [];
    }

    return data.filter(post => {
      const postDate = new Date(post.date);
      return postDate >= previousStartDate && postDate <= previousEndDate;
    });
  }, [dateRange, date, data]);

  const previousFilteredData = useMemo(() => getPreviousPeriodData(), [getPreviousPeriodData]);

  // Calcular estadísticas del período anterior
  const previousStats = useMemo(() => {
    const totalViews = previousFilteredData.reduce((sum, post) => sum + post.views, 0);
    const totalLikes = previousFilteredData.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = previousFilteredData.reduce((sum, post) => sum + post.comments, 0);
    const totalShares = previousFilteredData.reduce((sum, post) => sum + post.shares, 0);
    const totalPosts = previousFilteredData.length;
    
    return {
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalPosts,
      engagementRate: totalViews > 0 
        ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 
        : 0
    };
  }, [previousFilteredData]);

  // Calcular las comparaciones
  const comparisons = useMemo(() => ({
    posts: stats.totalPosts - previousStats.totalPosts,
    views: stats.totalViews - previousStats.totalViews,
    likes: stats.totalLikes - previousStats.totalLikes,
    comments: stats.totalComments - previousStats.totalComments,
    shares: stats.totalShares - previousStats.totalShares,
    engagement: engagementRate - previousStats.engagementRate
  }), [stats, previousStats, engagementRate]);

  useEffect(() => {
    const processData = () => {
      try {
        const categories = filteredData.reduce((acc, post) => {
          const category = post.category || 'Sin categoría';
          if (!acc[category]) {
            acc[category] = {
              category,
              count: 0,
              views: 0,
              likes: 0,
              comments: 0,
              shares: 0,
              engagementRate: 0
            };
          }
          acc[category].count += 1;
          acc[category].views += post.views || 0;
          acc[category].likes += post.likes || 0;
          acc[category].comments += post.comments || 0;
          acc[category].shares += post.shares || 0;
          return acc;
        }, {} as Record<string, typeof categoryData[0]>);

        Object.values(categories).forEach(cat => {
          cat.engagementRate = cat.views > 0 
            ? ((cat.likes + cat.comments + cat.shares) / cat.views) * 100 
            : 0;
        });

        setCategoryData(Object.values(categories));

        const types = filteredData.reduce((acc, post) => {
          const type = post.post_type || 'Desconocido';
          if (!acc[type]) {
            acc[type] = {
              post_type: type,
              count: 0,
              views: 0,
              likes: 0,
              comments: 0,
              shares: 0
            };
          }
          acc[type].count += 1;
          acc[type].views += post.views || 0;
          acc[type].likes += post.likes || 0;
          acc[type].comments += post.comments || 0;
          acc[type].shares += post.shares || 0;
          return acc;
        }, {} as Record<string, typeof postTypeData[0]>);

        setPostTypeData(Object.values(types));
      } catch (error) {
        console.error('Error procesando datos:', error);
      }
    };

    processData();
  }, [filteredData]);

  const handleDateRangeChange = useCallback((range: string) => {
    setDateRange(range);
    if (range !== 'custom') {
      setDate(undefined);
    }
  }, []);

  const handleMetricChange = useCallback((metric: keyof typeof selectedMetrics) => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  }, []);

  const groupDataByWeek = useCallback((data: LinkedInPost[]) => {
    const grouped: { [key: string]: LinkedInPost[] } = {};
    data.forEach(post => {
      const date = new Date(post.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const formattedDate = weekStart.toISOString().split('T')[0];

      if (!grouped[formattedDate]) {
        grouped[formattedDate] = [];
      }
      grouped[formattedDate].push(post);
    });
    return Object.entries(grouped).map(([date, posts]) => ({
      date: new Date(date).toISOString(),
      views: posts.reduce((sum, post) => sum + post.views, 0),
      likes: posts.reduce((sum, post) => sum + post.likes, 0),
      comments: posts.reduce((sum, post) => sum + post.comments, 0),
      shares: posts.reduce((sum, post) => sum + post.shares, 0),
    }));
  }, []);

  const chartData = useMemo(() => {
    const data = dateRange === 'last3Months' || dateRange === 'last6Months' || dateRange === 'lastYear'
      ? groupDataByWeek(filteredData)
      : filteredData.map(post => ({
        date: new Date(post.date).toISOString(),
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
      }));

    return data
      .filter(item => item.views > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dateRange, filteredData, groupDataByWeek]);

  const COLORS = [
    '#4ECDC4', // Primary coral
    '#6be5dd', // Light coral
    '#9ffbf5', // Medium coral
    '#bff1ed', // Very light coral
    '#4ECDC4', // Additional colors if needed
    '#45B7D1',
    '#96CEB4',
    '#FFEEAD',
  ];

  const metricLabels: { [key: string]: string } = {
    views: 'Visualizaciones',
    likes: 'Reacciones',
    comments: 'Comentarios',
    shares: 'Compartidos'
  };

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

  const extractDateFromPostId = (postId: string): string => {
    try {
      const timestamp = parseInt(BigInt(postId).toString(2).slice(0, 41), 2);
      const date = new Date(timestamp);
      return date.toISOString();
    } catch (error) {
      throw new Error('Error al extraer la fecha del ID del post');
    }
  };

  const BATCH_SIZE = 30; // Tamaño del lote

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setUpdateMessage(null);

    const results = await new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: async (results) => {
          try {
            const posts = results.data.slice(1).map((row: any) => {
              if (row.length === 0 || !row[0]) {
                return null;
              }

              let isoDate;
              const url = row[0];

              const postIdMatch = url.match(/(\d{19})/);
              if (postIdMatch) {
                const postId = postIdMatch[1];
                isoDate = extractDateFromPostId(postId);
              } else if (row[1]) {
                const [datePart, timePart] = row[1].split(', ');
                const [day, month, year] = datePart.split('/');
                if (day && month && year && timePart) {
                  isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
                } else {
                  throw new Error('No se pudo extraer la fecha del post');
                }
              } else {
                throw new Error('No se pudo extraer la fecha del post');
              }

              return {
                url: row[0],
                date: isoDate,
                text: row[2],
                views: parseInt(row[3]) || 0,
                likes: parseInt(row[4]) || 0,
                comments: parseInt(row[5]) || 0,
                shares: parseInt(row[6]) || 0,
                post_type: row[7],
              };
            }).filter((post: any) => post !== null);

            const totalBatches = Math.ceil(posts.length / BATCH_SIZE);
            let processedBatches = 0;

            for (let i = 0; i < totalBatches; i++) {
              const batch = posts.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
              await api.upsertPosts(batch);
              processedBatches++;
              setUpdateMessage(`Procesando lote ${processedBatches} de ${totalBatches}`);
            }

            const updatedPosts = await api.getPosts();
            resolve(updatedPosts);
            setUpdateMessage('Datos actualizados correctamente.');
          } catch (err: any) {
            reject(err);
          } finally {
            setLoading(false);
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

  const getWeeksInRange = (range: string): number => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'last7Days':
        return 1; // 1 semana
      case 'last28Days':
        return 4; // Aproximadamente 4 semanas
      case 'thisMonth':
        return Math.ceil(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7); // Días en el mes actual
      case 'lastMonth':
        return Math.ceil(new Date(now.getFullYear(), now.getMonth(), 0).getDate() / 7); // Días en el mes anterior
      case 'last3Months':
        return 13; // Aproximadamente 13 semanas
      case 'last6Months':
        return 26; // Aproximadamente 26 semanas
      case 'lastYear':
        return 52; // Aproximadamente 52 semanas
      case 'allTime':
        return Math.ceil((now.getTime() - new Date(0).getTime()) / (1000 * 60 * 60 * 24 * 7)); // Total de semanas desde el inicio
      case 'custom':
        if (date?.from && date?.to) {
          const diffTime = Math.abs(date.to.getTime() - date.from.getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)); // Semanas en el rango personalizado
        }
        return 0;
      default:
        return 0;
    }
  };

  const weeksInRange = getWeeksInRange(dateRange); // Obtiene el número de semanas en el rango seleccionado
  const avgPostsPerWeek = stats.totalPosts > 0 ? (stats.totalPosts / weeksInRange) : 0; // Calcula el promedio de posts por semana
  const formattedAvgPostsPerWeek = avgPostsPerWeek.toFixed(1).replace('.', ','); // Redondea a un decimal y cambia el separador

  return (
    <div className={`space-y-8 p-8 ${document.body.classList.contains('dark') ? 'bg-background' : 'bg-background'}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tus Estadísticas</h1>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[180px] bg-white border border-gray-200/50 shadow">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7Days">Últimos 7 días</SelectItem>
                <SelectItem value="last28Days">Últimos 28 días</SelectItem>
                <SelectItem value="thisMonth">Este mes</SelectItem>
                <SelectItem value="lastMonth">Mes anterior</SelectItem>
                <SelectItem value="last3Months">Últimos 3 meses</SelectItem>
                <SelectItem value="last6Months">Últimos 6 meses</SelectItem>
                <SelectItem value="lastYear">Últimos 365 días</SelectItem>
                <SelectItem value="allTime">Todo el tiempo</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white"
                  >
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="bg-white"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Posts"
            value={stats.totalPosts.toString()}
            change={`${comparisons.posts > 0 ? '+' : ''}${comparisons.posts}`}
            trend={comparisons.posts >= 0 ? 'up' : 'down'}
            icon={<Activity className="h-4 w-4 text-primary" />}
            subtitle={`${formattedAvgPostsPerWeek} posts/semana`}
          />
          <MetricCard
            title="Visualizaciones"
            value={stats.totalViews.toLocaleString()}
            change={`${comparisons.views > 0 ? '+' : ''}${comparisons.views.toLocaleString()}`}
            trend={comparisons.views >= 0 ? 'up' : 'down'}
            icon={<Eye className="h-4 w-4 text-primary" />}
            subtitle={`${perPostStats.viewsPerPost.toFixed(2)}/post`}
          />
          <MetricCard
            title="% Engagement"
            value={`${engagementRate.toFixed(2)}%`}
            change={`${comparisons.engagement > 0 ? '+' : ''}${comparisons.engagement.toFixed(2)}%`}
            trend={comparisons.engagement >= 0 ? 'up' : 'down'}
            icon={<BarChart3 className="h-4 w-4 text-primary" />}
            subtitle="Tasa de interacción"
          />
          <MetricCard
            title="Reacciones"
            value={stats.totalLikes.toLocaleString()}
            change={`${comparisons.likes > 0 ? '+' : ''}${comparisons.likes}`}
            trend={comparisons.likes >= 0 ? 'up' : 'down'}
            icon={<Heart className="h-4 w-4 text-primary" />}
            subtitle={`${perPostStats.likesPerPost.toFixed(2)}/post`}
          />
          <MetricCard
            title="Comentarios"
            value={stats.totalComments.toLocaleString()}
            change={`${comparisons.comments > 0 ? '+' : ''}${comparisons.comments}`}
            trend={comparisons.comments >= 0 ? 'up' : 'down'}
            icon={<MessageCircle className="h-4 w-4 text-primary" />}
            subtitle={`${perPostStats.commentsPerPost.toFixed(2)}/post`}
          />
          <MetricCard
            title="Compartidos"
            value={stats.totalShares.toLocaleString()}
            change={`${comparisons.shares > 0 ? '+' : ''}${comparisons.shares}`}
            trend={comparisons.shares >= 0 ? 'up' : 'down'}
            icon={<Share2 className="h-4 w-4 text-primary" />}
            subtitle={`${perPostStats.sharesPerPost.toFixed(2)}/post`}
          />
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Rendimiento en el tiempo</h3>
                <div className="flex gap-4">
                  {Object.entries(selectedMetrics).map(([metric, isSelected]) => (
                    <Button
                      key={metric}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      style={{
                        backgroundColor: isSelected ? getBarColor(metric) : 'white',
                        color: isSelected ? 'white' : 'inherit',
                        borderColor: getBarColor(metric),
                        boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
                      }}
                      className={cn(
                        "transition-colors hover:opacity-90",
                        !isSelected && "hover:bg-gray-50"
                      )}
                      onClick={() => handleMetricChange(metric as 'views' | 'likes' | 'comments' | 'shares')}
                    >
                      {metricLabels[metric]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.1} />
                    <XAxis
                      dataKey="date"
                      stroke="#000000"
                      tick={{ fontSize: 12, fill: '#000000' }}
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(dateStr) => {
                        try {
                          const date = new Date(dateStr);
                          if (!isNaN(date.getTime())) {
                            return date.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            });
                          }
                          return '';
                        } catch (error) {
                          console.error('Error formatting date:', dateStr);
                          return '';
                        }
                      }}
                    />
                    <YAxis yAxisId="left" stroke="#000000" tick={{ fontSize: 12, fill: '#000000' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#000000" tick={{ fontSize: 12, fill: '#000000' }} />
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
          </CardContent>
        </Card>
      </div>

        {/* <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Formatos</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={postTypeData}
                      dataKey="count"
                      nameKey="post_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#666"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            className="text-xs"
                          >
                            {`${postTypeData[index].post_type} (${value})`}
                          </text>
                        );
                      }}
                    >
                      {postTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity duration-200"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-semibold">{data.post_type}</p>
                              <p className="text-sm text-gray-600">Posts: {data.count}</p>
                              <p className="text-sm text-gray-600">Alcance promedio: {(data.views / data.count).toFixed(0)}</p>
                              <p className="text-sm text-gray-600">
                                Interacción promedia: {((data.likes + data.comments + data.shares) / data.count).toFixed(1)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Comentarios promedio: {(data.comments / data.count).toFixed(1)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card> */}


      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      ) : (
        <>
          {/* ... existing code ... */}
        </>
      )}

      {updateMessage && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <p>{updateMessage}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Refresh to see your new data
          </Button>
        </div>
      )}

    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  subtitle
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
  subtitle: string
}) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border border-gray-200/50">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">{title}</span>
            <span className="text-[#E85B4E]">{icon}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">{value}</span>
            <span className={cn(
              "text-sm font-medium",
              trend === 'up' ? "text-emerald-600" : "text-red-600"
            )}>
              {change}
            </span>
          </div>
          <span className="text-xs text-gray-500">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  );
}