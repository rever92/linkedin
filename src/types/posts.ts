export type PostState = 'borrador' | 'listo' | 'planificado';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  state: PostState;
  scheduled_datetime?: string;
  created_at: string;
  updated_at: string;
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