import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
import { Oval } from 'react-loader-spinner';

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
    '#FF6B6B', // coral
    '#4ECDC4', // turquesa
    '#45B7D1', // azul claro
    '#96CEB4', // verde menta
    '#FFEEAD', // amarillo claro
    '#D4A5A5', // rosa antiguo
    '#9FA4C4', // lavanda
    '#B5EAD7'  // verde agua
  ];

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
            if (customStartDate && customEndDate) {
                const diffTime = Math.abs(customEndDate.getTime() - customStartDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                currentStartDate = customStartDate;
                currentEndDate = customEndDate;
                
                previousEndDate = new Date(customStartDate);
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

  const totalPosts = data.length; // Total de posts a procesar
  const totalBatches = Math.ceil(totalPosts / BATCH_SIZE); // Calcular el total de lotes

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Rendimiento en el tiempo</h3>
      </div>

      <div className="flex justify-between items-center mb-4">
        <select value={dateRange} onChange={(e) => handleDateRangeChange(e.target.value)} className="border rounded-md p-1">
          <option value="last7Days">Últimos 7 días</option>
          <option value="last28Days">Últimos 28 días</option>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Posts"
          value={stats.totalPosts}
          icon={<Activity className="w-6 h-6" />}
          comparison={postsComparison}
          ratio={`${postsComparison} nuevos`}
        />
        <StatCard
          title="Visualizaciones"
          value={stats.totalViews}
          icon={<Eye className="w-6 h-6" />}
          comparison={viewsComparison}
          ratio={`${viewsPerPost.toFixed(2)} /post`}
        />
        <StatCard
          title="Ratio de Engagement"
          value={Number(engagementRate.toFixed(2))}
          icon={<ThumbsUp className="w-6 h-6" />}
          comparison={Number(engagementRateComparison.toFixed(2))}
          ratio={`${engagementRate.toFixed(2)}%`}
          isPercentage={true}
        />
        <StatCard
          title="Reacciones"
          value={stats.totalLikes}
          icon={<ThumbsUp className="w-6 h-6" />}
          comparison={likesComparison}
          ratio={`${likesPerPost.toFixed(2)} /post`}
        />
        <StatCard
          title="Comentarios"
          value={stats.totalComments}
          icon={<MessageCircle className="w-6 h-6" />}
          comparison={commentsComparison}
          ratio={`${commentsPerPost.toFixed(2)} /post`}
        />
        <StatCard
          title="Compartidos"
          value={stats.totalShares}
          icon={<Share2 className="w-6 h-6" />}
          comparison={sharesComparison}
          ratio={`${sharesPerPost.toFixed(2)} /post`}
        />
      </div>

      <div className="flex gap-6 bg-white p-6 rounded-lg shadow">
        <div className="w-[70%]">
          <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
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

          <div className="h-[400px]">
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
                          console.error('Error formateando fecha:', dateStr);
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

        <div className="w-[30%]">
          <h3 className="text-lg font-semibold mb-4">Tipos de Publicación</h3>
          <ResponsiveContainer width="100%" height={400}>
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
          />
        </PieChart>
      </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h3 className="text-lg font-semibold mb-4">Análisis de Temas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th onClick={() => handleSort('category')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th onClick={() => handleSort('count')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                <th onClick={() => handleSort('views')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alcance Promedio</th>
                <th onClick={() => handleSort('likes')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interacción Promedia</th>
                <th onClick={() => handleSort('engagementRate')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa de Engagement</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCategoryData.map((category, idx) => {
                const avgViews = category.views / category.count;
                const avgInteractions = (category.likes + category.comments + category.shares) / category.count;

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {avgViews.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {avgInteractions.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.engagementRate.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div>
      <h3 className="text-lg font-semibold mb-4">Tus publicaciones</h3>
      <PostsTable data={allPostsData} />

      </div>
      
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Spinner className="animate-spin h-10 w-10 text-blue-500" />
            <p className="mt-2">Actualizando tus datos...</p>
          </div>
        </div>
      )}

      {updateMessage && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <p>{updateMessage}</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Actualiza para ver tus nuevos datos
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  comparison, 
  ratio, 
  isPercentage = false 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  comparison: number; 
  ratio: string;
  isPercentage?: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">
            {isPercentage ? `${value.toFixed(2)}%` : value.toLocaleString()}
          </p>
        </div>
        <div className="text-blue-500">{icon}</div>
      </div>
      {comparison !== undefined && (
        <div className="mt-2 text-sm text-right">
          <span className={`font-semibold ${comparison > 0 ? 'text-green-500' : comparison < 0 ? 'text-red-500' : 'text-black'}`}>
            {comparison > 0 ? '↑' : comparison < 0 ? '↓' : ''} {isPercentage ? `${Math.abs(comparison).toFixed(2)}%` : Math.abs(comparison).toLocaleString()}
          </span>
        </div>
      )}
      <div className="mt-2 text-sm text-gray-500 text-right">{ratio}</div>
    </div>
  );
}