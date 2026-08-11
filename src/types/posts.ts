export type PostState = 'borrador' | 'listo' | 'planificado' | 'publicado';
export type LineaEditorial = string;
export type FuncionEditorial = string;
export type FormatoPost = string;
export type TaxonomyKind = 'linea_editorial' | 'funcion_editorial' | 'formato';
export type PlannerMetricField = 'impresiones' | 'reacciones' | 'comentarios' | 'compartidos' | 'guardados';

export interface ContentTaxonomy {
  id?: string;
  _id?: string;
  user_id?: string;
  kind: TaxonomyKind;
  value: string;
  active: boolean;
  is_default?: boolean;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalyticsBreakdown {
  value: string;
  posts: number;
  posts_with_metrics: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impresiones?: number;
  reacciones?: number;
  comentarios?: number;
  compartidos?: number;
  guardados?: number;
  interactions: number;
  average_views: number;
  average_interactions: number;
  engagement_rate: number;
}

export interface PlannerAnalytics {
  summary: {
    posts: number;
    posts_with_metrics: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    impresiones?: number;
    reacciones?: number;
    comentarios?: number;
    compartidos?: number;
    guardados?: number;
    interactions: number;
    average_views: number;
    average_interactions: number;
    average_likes: number;
    average_comments: number;
    average_shares: number;
    average_saves: number;
    engagement_rate: number;
  };
  breakdowns: Record<TaxonomyKind, AnalyticsBreakdown[]>;
  posts: Post[];
}

export interface Post {
  id?: string;
  _id?: string;
  user_id: string;
  content: string;
  content_type?: string;
  image_url?: string;
  state: PostState;
  scheduled_datetime?: string | null;
  plan_item_id?: string | null;
  titulo?: string;
  linea_editorial?: LineaEditorial;
  funcion_editorial?: FuncionEditorial;
  formato?: FormatoPost;
  fuente?: string;
  punto_de_vista?: string;
  hipotesis?: string;
  activo_reutilizable?: string;
  published_post_url?: string;
  impresiones?: number | null;
  reacciones?: number | null;
  comentarios?: number | null;
  compartidos?: number | null;
  guardados?: number | null;
  fecha_medicion?: string | null;
  // Legacy aliases kept for records created before planner metrics became canonical.
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  metrics_updated_at?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface StrategyProfile {
  id?: string;
  _id?: string;
  user_id?: string;
  target_audience: string;
  tone: string;
  core_topics: string[];
  goals: string[];
  content_formats: string[];
  extra_instructions: string;
  channel?: 'linkedin';
  is_default?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ContentPlanStatus = 'draft' | 'approving' | 'approved' | 'archived';
export type ContentPlanItemStatus = 'draft' | 'validated' | 'converted_to_post';

export interface ContentPlanItem {
  id?: string;
  _id?: string;
  plan_id: string;
  user_id: string;
  week_index: number;
  suggested_date?: string | null;
  suggested_time?: string;
  content_type: string;
  topic: string;
  angle: string;
  pain_point: string;
  contrarian_insight: string;
  objective: string;
  cta: string;
  hook_idea: string;
  supporting_points: string[];
  extra_instructions: string;
  status: ContentPlanItemStatus;
  linked_planner_post_id?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentPlan {
  id?: string;
  _id?: string;
  user_id: string;
  strategy_profile_id: string;
  title: string;
  status: ContentPlanStatus;
  start_date: string;
  end_date: string;
  cadence_mode: 'weekly_frequency' | 'custom_dates';
  cadence?: {
    posts_per_week?: number;
    preferred_days?: string[];
    preferred_times?: string[];
    duration_in_weeks?: number;
  };
  generation_context?: Record<string, unknown>;
  source_recommendation_id?: string | null;
  items: ContentPlanItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratePlanRequest {
  strategy: StrategyProfile;
  plan: {
    title?: string;
    start_date: string;
    end_date?: string;
    duration_in_weeks: number;
    posts_per_week: number;
    preferred_days: string[];
    preferred_times: string[];
    cadence_mode?: 'weekly_frequency' | 'custom_dates';
    extra_instructions?: string;
  };
}

export interface RegeneratePlanItemRequest {
  extra_instructions?: string;
}

export interface ConvertPlanItemToPostRequest {
  plan_id: string;
  item_id: string;
}

export interface PlanEditorContext {
  plan: ContentPlan | null;
  planItem: ContentPlanItem | null;
  strategy: StrategyProfile | null;
  recommendation?: Record<string, unknown> | null;
  historicalPosts?: Record<string, unknown>[];
}

// Helper to get a valid date string from a Post
export function getPostDate(post: Post, field: 'created' | 'updated' = 'created'): Date {
  const val = field === 'created'
    ? (post.createdAt || post.created_at)
    : (post.updatedAt || post.updated_at);
  const d = new Date(val || Date.now());
  return isNaN(d.getTime()) ? new Date() : d;
}

export function getPostId<T extends { _id?: string; id?: string }>(post: T): string {
  return post._id || post.id || '';
}

const legacyMetricFields: Record<PlannerMetricField, keyof Post> = {
  impresiones: 'views',
  reacciones: 'likes',
  comentarios: 'comments',
  compartidos: 'shares',
  guardados: 'saves',
};

export function getPostMetric(post: Partial<Post>, field: PlannerMetricField): number {
  return Number(post[field] ?? post[legacyMetricFields[field]] ?? 0);
}

export interface AIGeneratedImage {
  id: string;
  post_id: string;
  prompt: string;
  style: string;
  url: string;
  created_at: string;
}
