// PostsAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { LinkedInPost } from '../types';
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import PostsTable from './PostsTable';
import { Button } from "@/components/ui/button";
import { DateRange } from 'react-day-picker';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';

interface PostsAnalysisProps {
  data: LinkedInPost[];
}

const PostsAnalysis = ({ data }: PostsAnalysisProps) => {
  const [dateRange, setDateRange] = useState('last28Days');
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const [filteredData, setFilteredData] = useState<LinkedInPost[]>([]);

  // Función para filtrar los datos según el rango de fechas
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

    const filtered = data.filter(post => {
      const postDate = new Date(post.date);
      return postDate >= startDate && postDate <= endDate;
    });
    setFilteredData(filtered);
  };

  useEffect(() => {
    getFilteredData();
  }, [dateRange, date, data]);

  // Estado para Temas Frecuentes y Formatos
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

  // Funciones para calcular los datos
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

  useEffect(() => {
    calculateCategoryData();
    calculatePostTypeData();
  }, [filteredData]);

  // Función para manejar la ordenación
  const handleSort = (field: 'category' | 'count' | 'views' | 'likes' | 'comments' | 'shares' | 'engagementRate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Datos ordenados para Temas Frecuentes
  const sortedCategoryData = [...categoryData]
    .filter(category => (category.views / category.count) > 0)
    .sort((a, b) => {
      // Para campos numéricos, usar comparación numérica
      if (sortField !== 'category') {
        // Asegurar que los valores son números
        const aValue = Number(a[sortField]);
        const bValue = Number(b[sortField]);
        
        if (sortDirection === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }
      
      // Para el campo 'category', usar comparación de cadenas
      const aValue = String(a.category || '');
      const bValue = String(b.category || '');

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  // Colores para el gráfico de Formatos
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

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Análisis de Posts</h1>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] bg-white border border-gray-200/50 shadow">
              <SelectValue placeholder="Selecciona rango de fechas" />
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
                    "Selecciona fechas"
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Temas Frecuentes */}
        <div className="lg:w-1/2">
          <Card className="border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">Temas frecuentes</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gray-50">
                      <TableHead onClick={() => handleSort('category')} className="cursor-pointer">Categoría</TableHead>
                      <TableHead onClick={() => handleSort('count')} className="cursor-pointer text-right">Posts</TableHead>
                      <TableHead onClick={() => handleSort('views')} className="cursor-pointer text-right">Alcance Promedio</TableHead>
                      <TableHead onClick={() => handleSort('likes')} className="cursor-pointer text-right">Interacción Promedio</TableHead>
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
        </div>

        {/* Formatos */}
        <div className="lg:w-1/2">
          <Card className="border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200">
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
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
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
                                  Interacción promedio: {((data.likes + data.comments + data.shares) / data.count).toFixed(1)}
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabla de Posts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Tus Posts</h3>
        <PostsTable data={data} />
      </div>
    </div>
  );
};

export default PostsAnalysis;
