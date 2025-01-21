export interface LinkedInPost {
  url: string;
  date: string;
  text: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  post_type?: string;
  category?: string;
  user_id: string;
}

export interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
}