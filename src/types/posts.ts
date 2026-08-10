export type PostState = 'borrador' | 'listo' | 'planificado' | 'publicado';
export type LineaEditorial = 'IA para CIOs y C-Level' | 'Casos reales y lecciones' | 'Frameworks y checklists' | 'Opinión sobre tendencias y hype' | 'Marca personal y bastidores';
export type FuncionEditorial = 'alcance' | 'autoridad' | 'conversacion' | 'flexible';
export type FormatoPost = 'texto' | 'carrusel' | 'compartido' | 'video' | 'meme' | 'articulo';

export interface Post {
  id?: string;
  _id?: string;
  user_id: string;
  content: string;
  image_url?: string;
  state: PostState;
  scheduled_datetime?: string;
  titulo?: string;
  linea_editorial?: LineaEditorial;
  funcion_editorial?: FuncionEditorial;
  formato?: FormatoPost;
  fuente?: string;
  punto_de_vista?: string;
  hipotesis?: string;
  activo_reutilizable?: string;
  published_post_url?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Helper to get a valid date string from a Post
export function getPostDate(post: Post, field: 'created' | 'updated' = 'created'): Date {
  const val = field === 'created'
    ? (post.createdAt || post.created_at)
    : (post.updatedAt || post.updated_at);
  const d = new Date(val || Date.now());
  return isNaN(d.getTime()) ? new Date() : d;
}

export function getPostId(post: Post): string {
  return post._id || post.id || '';
}

export interface AIGeneratedImage {
  id: string;
  post_id: string;
  prompt: string;
  style: string;
  url: string;
  created_at: string;
}

export interface ContentPlan {
  id: string;
  user_id: string;
  generated_at: string;
  status: string;
}

export interface ContentPlanItem {
  id: string;
  plan_id: string;
  post_id?: string;
  suggested_datetime?: string;
  topic: string;
  content_type: string;
}
