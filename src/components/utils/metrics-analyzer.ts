import { LinkedInPost } from '../types';

export interface ProfileAnalysis {
  generalMetrics: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    overallEngagementRate: number;
    avgViewsPerPost: number;
    avgLikesPerPost: number;
    avgCommentsPerPost: number;
    avgSharesPerPost: number;
  };
  postTypeAnalysis: {
    [key: string]: {
      postCount: number;
      avgViews: number;
      avgLikes: number;
      avgComments: number;
      avgShares: number;
      avgEngagementRate: number;
    };
  };
  categoryAnalysis: {
    [key: string]: {
      postCount: number;
      avgViews: number;
      avgEngagement: number;
      engagementRate: number;
    };
  };
  timeAnalysis: {
    dayOfWeek: string;
    hour: number;
    engagementRate: number;
    postCount: number;
    avgViews: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
  }[];
  contentLength: {
    shortPosts: {
      count: number;
      avgEngagement: number;
    };
    mediumPosts: {
      count: number;
      avgEngagement: number;
    };
    longPosts: {
      count: number;
      avgEngagement: number;
    };
  };
  trends: {
    views: number[];
    engagement: number[];
    dates: string[];
  };
}

export const analyzeProfileMetrics = (posts: LinkedInPost[]): ProfileAnalysis => {
  // Ordenar posts por fecha para análisis de tendencias
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Métricas generales
  const generalMetrics = {
    totalPosts: posts.length,
    totalViews: posts.reduce((sum, post) => sum + post.views, 0),
    totalLikes: posts.reduce((sum, post) => sum + post.likes, 0),
    totalComments: posts.reduce((sum, post) => sum + post.comments, 0),
    totalShares: posts.reduce((sum, post) => sum + post.shares, 0),
    overallEngagementRate: 0,
    avgViewsPerPost: 0,
    avgLikesPerPost: 0,
    avgCommentsPerPost: 0,
    avgSharesPerPost: 0
  };

  // Calcular promedios
  generalMetrics.avgViewsPerPost = generalMetrics.totalViews / posts.length;
  generalMetrics.avgLikesPerPost = generalMetrics.totalLikes / posts.length;
  generalMetrics.avgCommentsPerPost = generalMetrics.totalComments / posts.length;
  generalMetrics.avgSharesPerPost = generalMetrics.totalShares / posts.length;
  generalMetrics.overallEngagementRate = (
    (generalMetrics.totalLikes + generalMetrics.totalComments + generalMetrics.totalShares) / 
    generalMetrics.totalViews
  ) * 100;

  // Análisis por tipo de post
  const postTypeAnalysis: { [key: string]: { postCount: number; avgViews: number; avgLikes: number; avgComments: number; avgShares: number; avgEngagementRate: number } } = {};
  posts.forEach(post => {
    const postType = post.post_type || 'unknown';
    if (!postTypeAnalysis[postType]) {
      postTypeAnalysis[postType] = {
        postCount: 0,
        avgViews: 0,
        avgLikes: 0,
        avgComments: 0,
        avgShares: 0,
        avgEngagementRate: 0
      };
    }
    postTypeAnalysis[postType].postCount++;
    postTypeAnalysis[postType].avgViews += post.views;
    postTypeAnalysis[postType].avgLikes += post.likes;
    postTypeAnalysis[postType].avgComments += post.comments;
    postTypeAnalysis[postType].avgShares += post.shares;
  });

  // Calcular promedios para cada tipo de post
  Object.keys(postTypeAnalysis).forEach(type => {
    const metrics = postTypeAnalysis[type];
    const count = metrics.postCount;
    metrics.avgViews /= count;
    metrics.avgLikes /= count;
    metrics.avgComments /= count;
    metrics.avgShares /= count;
    metrics.avgEngagementRate = (
      (metrics.avgLikes + metrics.avgComments + metrics.avgShares) / 
      metrics.avgViews
    ) * 100;
  });

  // Análisis por categoría
  const categoryAnalysis: { [key: string]: { postCount: number; avgViews: number; avgEngagement: number; engagementRate: number } } = {};
  posts.forEach(post => {
    const category = post.category || 'uncategorized';
    if (!categoryAnalysis[category]) {
      categoryAnalysis[category] = {
        postCount: 0,
        avgViews: 0,
        avgEngagement: 0,
        engagementRate: 0
      };
    }
    categoryAnalysis[category].postCount++;
    categoryAnalysis[category].avgViews += post.views;
    categoryAnalysis[category].avgEngagement += post.likes + post.comments + post.shares;
  });

  // Calcular promedios para cada categoría
  Object.keys(categoryAnalysis).forEach(category => {
    const metrics = categoryAnalysis[category];
    const count = metrics.postCount;
    metrics.avgViews /= count;
    metrics.avgEngagement /= count;
    metrics.engagementRate = (metrics.avgEngagement / metrics.avgViews) * 100;
  });

  // Análisis de horarios
  const timeAnalysis = analyzePostingTimes(posts);

  // Análisis de longitud de contenido
  const contentLength = analyzeContentLength(posts);

  // Análisis de tendencias
  const trends = analyzeTrends(sortedPosts);

  return {
    generalMetrics,
    postTypeAnalysis,
    categoryAnalysis,
    timeAnalysis,
    contentLength,
    trends
  };
};

const analyzePostingTimes = (posts: LinkedInPost[]) => {
  const timeMetrics: { [key: string]: { dayOfWeek: string; hour: number; engagementRate: number; postCount: number; avgViews: number; avgLikes: number; avgComments: number; avgShares: number } } = {};
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  posts.forEach(post => {
    const date = new Date(post.date);
    const key = `${date.getDay()}-${date.getHours()}`;
    
    if (!timeMetrics[key]) {
      timeMetrics[key] = {
        dayOfWeek: days[date.getDay()],
        hour: date.getHours(),
        engagementRate: 0,
        postCount: 0,
        avgViews: 0,
        avgLikes: 0,
        avgComments: 0,
        avgShares: 0
      };
    }

    timeMetrics[key].postCount++;
    timeMetrics[key].avgViews += post.views;
    timeMetrics[key].avgLikes += post.likes;
    timeMetrics[key].avgComments += post.comments;
    timeMetrics[key].avgShares += post.shares;
    timeMetrics[key].engagementRate += ((post.likes + post.comments + post.shares) / post.views) * 100;
  });

  // Calcular promedios y filtrar slots con menos de 3 posts
  const timeArray = Object.values(timeMetrics)
    .filter(metrics => metrics.postCount >= 3)
    .map(metrics => ({
      ...metrics,
      engagementRate: metrics.engagementRate / metrics.postCount,
      avgViews: metrics.avgViews / metrics.postCount,
      avgLikes: metrics.avgLikes / metrics.postCount,
      avgComments: metrics.avgComments / metrics.postCount,
      avgShares: metrics.avgShares / metrics.postCount
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate);

  return {
    heatmap: timeArray,
    bestPerformingTimes: timeArray.slice(0, 3),
    worstPerformingTimes: timeArray.slice(-3)
  };
};

const analyzeContentLength = (posts: LinkedInPost[]) => {
  const contentRanges = {
    short: { min: 0, max: 499 },
    medium: { min: 500, max: 1499 },
    long: { min: 1500, max: null }
  };

  const initMetrics = (): { range: { min: number; max: number | null }; postCount: number; avgViews: number; avgLikes: number; avgComments: number; avgShares: number; engagementRate: number; totalViews: number; totalLikes: number; totalComments: number; totalShares: number } => ({
    range: { min: 0, max: null },
    postCount: 0,
    avgViews: 0,
    avgLikes: 0,
    avgComments: 0,
    avgShares: 0,
    engagementRate: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0
  });

  const metrics = {
    short: initMetrics(),
    medium: initMetrics(),
    long: initMetrics()
  };

  // Establecer los rangos
  metrics.short.range = contentRanges.short;
  metrics.medium.range = contentRanges.medium;
  metrics.long.range = contentRanges.long;

  posts.forEach(post => {
    const length = post.text.length;
    let category: 'short' | 'medium' | 'long';

    if (length < 500) {
      category = 'short';
    } else if (length <= 1500) {
      category = 'medium';
    } else {
      category = 'long';
    }

    metrics[category].postCount++;
    metrics[category].totalViews += post.views;
    metrics[category].totalLikes += post.likes;
    metrics[category].totalComments += post.comments;
    metrics[category].totalShares += post.shares;
  });

  // Calcular promedios y engagement rates
  ['short', 'medium', 'long'].forEach((category) => {
    const m = metrics[category as keyof typeof metrics];
    if (m.postCount > 0) {
      m.avgViews = m.totalViews / m.postCount;
      m.avgLikes = m.totalLikes / m.postCount;
      m.avgComments = m.totalComments / m.postCount;
      m.avgShares = m.totalShares / m.postCount;
      m.engagementRate = ((m.totalLikes + m.totalComments + m.totalShares) / m.totalViews) * 100;
    }
  });

  // Determinar la longitud con mejor desempeño
  const bestPerformingLength = Object.entries(metrics)
    .reduce((best, [key, value]) => 
      value.engagementRate > (metrics[best as keyof typeof metrics].engagementRate) ? 
        key as 'short' | 'medium' | 'long' : 
        best
    , 'medium' as 'short' | 'medium' | 'long');

  return {
    ...metrics,
    bestPerformingLength
  };
};

const analyzeTrends = (sortedPosts: LinkedInPost[]) => {
  const trends = {
    viewsTrend: 'stable' as const,
    engagementTrend: 'stable' as const,
    postFrequency: 0
  };

  if (sortedPosts.length < 2) return trends;

  // Calcular tendencias de views y engagement
  const firstHalf = sortedPosts.slice(0, Math.floor(sortedPosts.length / 2));
  const secondHalf = sortedPosts.slice(Math.floor(sortedPosts.length / 2));

  const avgViewsFirst = firstHalf.reduce((sum, post) => sum + post.views, 0) / firstHalf.length;
  const avgViewsSecond = secondHalf.reduce((sum, post) => sum + post.views, 0) / secondHalf.length;

  const avgEngagementFirst = firstHalf.reduce((sum, post) => 
    sum + ((post.likes + post.comments + post.shares) / post.views), 0) / firstHalf.length;
  const avgEngagementSecond = secondHalf.reduce((sum, post) => 
    sum + ((post.likes + post.comments + post.shares) / post.views), 0) / secondHalf.length;

  // Determinar tendencias
  trends.viewsTrend = avgViewsSecond > avgViewsFirst * 1.1 ? 'increasing' :
                      avgViewsSecond < avgViewsFirst * 0.9 ? 'decreasing' : 'stable';

  trends.engagementTrend = avgEngagementSecond > avgEngagementFirst * 1.1 ? 'increasing' :
                          avgEngagementSecond < avgEngagementFirst * 0.9 ? 'decreasing' : 'stable';

  // Calcular frecuencia de posts
  const firstDate = new Date(sortedPosts[0].date);
  const lastDate = new Date(sortedPosts[sortedPosts.length - 1].date);
  const weeksDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
  trends.postFrequency = sortedPosts.length / weeksDiff;

  return trends;
};