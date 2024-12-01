'use client';
import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
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
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import { Spinner } from './Spinner';
import { LinkedInPost, DashboardStats } from '../types';
import PostsTable from './PostsTable';
import AdvancedMetrics from './AdvancedMetrics';
import AIRecommendations from './AIRecommendations';
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

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    if (range !== 'custom') {
      setDate(undefined);
    }
  };

  const getFilteredData = () => {
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

  const engagementRate = filteredData.length > 0
    ? ((stats.totalLikes + stats.totalComments + stats.totalShares) / stats.totalViews) * 100
    : 0;

  const viewsPerPost = stats.totalViews / stats.totalPosts || 0;
  const likesPerPost = stats.totalLikes / stats.totalPosts || 0;
  const commentsPerPost = stats.totalComments / stats.totalPosts || 0;
  const sharesPerPost = stats.totalShares / stats.totalPosts || 0;

  const getPreviousPeriodData = () => {
    const now = new Date();
    let currentStartDate: Date;
    let currentEndDate: Date = now;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (dateRange) {
      case 'last7Days':
        // Periodo actual: últimos 7 días
        currentStartDate = new Date(now);
        currentStartDate.setDate(now.getDate() - 7);
        // Periodo anterior: 7 días anteriores a los últimos 7 días
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setDate(currentStartDate.getDate() - 7);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'last28Days':
        // Periodo actual: últimos 28 días
        currentStartDate = new Date(now);
        currentStartDate.setDate(now.getDate() - 28);
        // Periodo anterior: 28 días anteriores a los últimos 28 días
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setDate(currentStartDate.getDate() - 28);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'thisMonth':
        // Periodo actual: mes actual
        currentStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // Periodo anterior: mes anterior
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'lastMonth':
        // Periodo actual: mes anterior
        currentStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        currentEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        // Periodo anterior: dos meses atrás
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
      case 'last3Months':
        // Periodo actual: últimos 3 meses
        currentStartDate = new Date(now);
        currentStartDate.setMonth(now.getMonth() - 3);
        // Periodo anterior: 3 meses anteriores a los últimos 3 meses
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setMonth(currentStartDate.getMonth() - 3);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'last6Months':
        // Periodo actual: últimos 6 meses
        currentStartDate = new Date(now);
        currentStartDate.setMonth(now.getMonth() - 6);
        // Periodo anterior: 6 meses anteriores a los últimos 6 meses
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setMonth(currentStartDate.getMonth() - 6);
        previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'lastYear':
        // Periodo actual: último año
        currentStartDate = new Date(now);
        currentStartDate.setFullYear(now.getFullYear() - 1);
        // Periodo anterior: año anterior al último año
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
  };

  const previousFilteredData = getPreviousPeriodData();
  const previousTotalViews = previousFilteredData.reduce((sum, post) => sum + post.views, 0);
  const previousTotalLikes = previousFilteredData.reduce((sum, post) => sum + post.likes, 0);
  const previousTotalComments = previousFilteredData.reduce((sum, post) => sum + post.comments, 0);
  const previousTotalShares = previousFilteredData.reduce((sum, post) => sum + post.shares, 0);
  const previousTotalPosts = previousFilteredData.length;

  const previousEngagementRate = previousFilteredData.length > 0
    ? ((previousTotalLikes + previousTotalComments + previousTotalShares) / previousTotalViews) * 100
    : 0;

  const engagementRateComparison = engagementRate - previousEngagementRate;

  const postsComparison = stats.totalPosts - previousTotalPosts;
  const viewsComparison = stats.totalViews - previousTotalViews;
  const likesComparison = stats.totalLikes - previousTotalLikes;
  const commentsComparison = stats.totalComments - previousTotalComments;
  const sharesComparison = stats.totalShares - previousTotalShares;

  const handleMetricChange = (metric: 'views' | 'likes' | 'comments' | 'shares') => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const groupDataByWeek = (data: LinkedInPost[]) => {
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
  };

  const chartData = (dateRange === 'last3Months' || dateRange === 'last6Months' || dateRange === 'lastYear'
    ? groupDataByWeek(filteredData)
    : filteredData.map(post => ({
      date: new Date(post.date).toISOString(),
      views: post.views,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
    })))
    .filter(data => data.views > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    setLoading(true);
    setUpdateMessage(null);

    const results = await new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: async (results) => {
          try {
            const posts = results.data.slice(1).map((row: any) => {
              if (row.length === 0 || !row[0]) {
                console.error('Fila vacía encontrada:', row);
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
                  console.error('Formato de fecha incorrecto en la fila:', row);
                  throw new Error('No se pudo extraer la fecha del post');
                }
              } else {
                console.error('No se encontró ID de post ni fecha en la fila:', row);
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
                user_id: user.id
              };
            }).filter(post => post !== null);

            const totalBatches = Math.ceil(posts.length / BATCH_SIZE); // Calcular el total de lotes
            let processedBatches = 0; // Contador de lotes procesados

            for (let i = 0; i < totalBatches; i++) {
              const batch = posts.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE); // Obtener el lote actual

              const { error: upsertError } = await supabase
                .from('linkedin_posts')
                .upsert(batch.map(post => ({
                  url: post.url,
                  date: post.date,
                  text: post.text,
                  views: post.views,
                  likes: post.likes,
                  comments: post.comments,
                  shares: post.shares,
                  post_type: post.post_type,
                  user_id: user.id
                })), {
                  onConflict: 'url',
                  ignoreDuplicates: false
                });

              if (upsertError) throw upsertError;

              processedBatches++; // Incrementar el contador de lotes procesados
              setUpdateMessage(`Procesando lote ${processedBatches} de ${totalBatches}`); // Actualizar el mensaje de progreso
            }

            const { data: updatedPosts, error: loadError } = await supabase
              .from('linkedin_posts')
              .select('*')
              .order('date', { ascending: false });

            if (loadError) throw loadError;

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

  // Mantener los datos originales sin filtrar para la tabla
  const allPostsData = data; // Suponiendo que 'data' contiene todos los posts

  // Función para calcular el reparto por tipo de publicación
  const calculateCategoryData = () => {
    const categories: {
      [key: string]: {
        count: number;
        views: number;
        likes: number;
        comments: number;
        shares: number;
      }
    } = {};

    filteredData.forEach(post => {
      const category = post.category || 'Sin categoría';
      if (!categories[category]) {
        categories[category] = { count: 0, views: 0, likes: 0, comments: 0, shares: 0 };
      }
      categories[category].count += 1;
      categories[category].views += post.views;
      categories[category].likes += post.likes;
      categories[category].comments += post.comments;
      categories[category].shares += post.shares;
    });

    const categoryDataArray = Object.entries(categories).map(([key, value]) => ({
      category: key,
      count: value.count,
      views: value.views,
      likes: value.likes,
      comments: value.comments,
      shares: value.shares,
      engagementRate: value.views > 0 ? ((value.likes + value.comments + value.shares) / value.views) * 100 : 0
    }));

    setCategoryData(categoryDataArray);
  };

  // Función separada para calcular datos por tipo de post
  const calculatePostTypeData = () => {
    const postTypes: {
      [key: string]: {
        count: number;
        views: number;
        likes: number;
        comments: number;
        shares: number;
      }
    } = {};

    filteredData.forEach(post => {
      const postType = post.post_type || 'Sin tipo';
      if (!postTypes[postType]) {
        postTypes[postType] = { count: 0, views: 0, likes: 0, comments: 0, shares: 0 };
      }
      postTypes[postType].count += 1;
      postTypes[postType].views += post.views;
      postTypes[postType].likes += post.likes;
      postTypes[postType].comments += post.comments;
      postTypes[postType].shares += post.shares;
    });

    const postTypeDataArray = Object.entries(postTypes).map(([key, value]) => ({
      post_type: key,
      count: value.count,
      views: value.views,
      likes: value.likes,
      comments: value.comments,
      shares: value.shares
    }));

    setPostTypeData(postTypeDataArray);
  };

  // Actualizar useEffect para calcular ambos conjuntos de datos
  useEffect(() => {
    calculateCategoryData();
    calculatePostTypeData();
  }, [filteredData]);

  // Función para manejar el cambio de ordenación
  const handleSort = (field: 'category' | 'count' | 'views' | 'likes' | 'comments' | 'shares' | 'engagementRate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrar y ordenar los datos de categoría
  const sortedCategoryData = [...categoryData]
    .filter(category => (category.views / category.count) > 0) // Filtrar categorías con alcance promedio > 0
    .sort((a, b) => {
      const aValue = sortField === 'engagementRate' ? a.engagementRate : a[sortField];
      const bValue = sortField === 'engagementRate' ? b.engagementRate : b[sortField];

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // const totalPosts = data.length; // Total de posts a procesar
  // const totalBatches = Math.ceil(totalPosts / BATCH_SIZE); // Calcular el total de lotes

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
              <SelectTrigger className="w-[180px] bg-white">
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
            change={`${postsComparison > 0 ? '+' : ''}${postsComparison}`}
            trend={postsComparison >= 0 ? 'up' : 'down'}
            icon={<Activity className="h-4 w-4 text-primary" />}
            subtitle={`${formattedAvgPostsPerWeek} posts/semana`}
          />
          <MetricCard
            title="Visualizaciones"
            value={stats.totalViews.toLocaleString()}
            change={`${viewsComparison > 0 ? '+' : ''}${viewsComparison.toLocaleString()}`}
            trend={viewsComparison >= 0 ? 'up' : 'down'}
            icon={<Eye className="h-4 w-4 text-primary" />}
            subtitle={`${viewsPerPost.toFixed(2)}/post`}
          />

          <MetricCard
            title="% Engagement"
            value={`${engagementRate.toFixed(2)}%`}
            change={`${engagementRateComparison > 0 ? '+' : ''}${engagementRateComparison.toFixed(2)}%`}
            trend={engagementRateComparison >= 0 ? 'up' : 'down'}
            icon={<BarChart3 className="h-4 w-4 text-primary" />}
          />

          <MetricCard
            title="Reacciones"
            value={stats.totalLikes.toLocaleString()}
            change={`${likesComparison > 0 ? '+' : ''}${likesComparison}`}
            trend={likesComparison >= 0 ? 'up' : 'down'}
            icon={<Heart className="h-4 w-4 text-primary" />}
            subtitle={`${likesPerPost.toFixed(2)}/post`}
          />

          <MetricCard
            title="Comentarios"
            value={stats.totalComments.toLocaleString()}
            change={`${commentsComparison > 0 ? '+' : ''}${commentsComparison}`}
            trend={commentsComparison >= 0 ? 'up' : 'down'}
            icon={<MessageCircle className="h-4 w-4 text-primary" />}
            subtitle={`${commentsPerPost.toFixed(2)}/post`}
          />

          <MetricCard
            title="Compartidos"
            value={stats.totalShares.toLocaleString()}
            change={`${sharesComparison > 0 ? '+' : ''}${sharesComparison}`}
            trend={sharesComparison >= 0 ? 'up' : 'down'}
            icon={<Share2 className="h-4 w-4 text-primary" />}
            subtitle={`${sharesPerPost.toFixed(2)}/post`}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-5">
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
                      className={cn(
                        "transition-colors",
                        isSelected && "bg-primary hover:bg-secondary"
                      )}
                      onClick={() => handleMetricChange(metric as 'views' | 'likes' | 'comments' | 'shares')}
                    >
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
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

        <Card className="lg:col-span-2">
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
        </Card>
      </div>
      <AdvancedMetrics data={data} filteredData={filteredData} />
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Temas frecuentes</h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-50">
                  <TableHead onClick={() => handleSort('category')} className="cursor-pointer">Category</TableHead>
                  <TableHead onClick={() => handleSort('count')} className="cursor-pointer text-right">Posts</TableHead>
                  <TableHead onClick={() => handleSort('views')} className="cursor-pointer text-right">Avg. Reach</TableHead>
                  <TableHead onClick={() => handleSort('likes')} className="cursor-pointer text-right">Avg. Engagement</TableHead>
                  <TableHead onClick={() => handleSort('engagementRate')} className="cursor-pointer text-right">Engagement Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategoryData.map((category, idx) => {
                  const avgViews = category.views / category.count;
                  const avgInteractions = (category.likes + category.comments + category.shares) / category.count;

                  return (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{category.category}</TableCell>
                      <TableCell className="text-right">{category.count}</TableCell>
                      <TableCell className="text-right">{avgViews.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{avgInteractions.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{category.engagementRate.toFixed(2)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tus Posts</h3>
        <PostsTable data={data} />
      </div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Spinner className="animate-spin h-10 w-10 text-blue-500" />
            <p className="mt-2">Updating your data...</p>
          </div>
        </div>
      )}

      {updateMessage && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <p>{updateMessage}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Refresh to see your new data
          </Button>
        </div>
      )}
      <div className="mt-8">
        <AIRecommendations data={data} />
      </div>
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
    <Card className="overflow-hidden transition-all hover:shadow-lg">
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