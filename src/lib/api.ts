import { AuthSession, AuthUser } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const STORAGE_KEY = 'linksight_auth';

class ApiClient {
  private getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private setSession(session: AuthSession | null) {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getAccessToken(): string | null {
    return this.getSession()?.access_token || null;
  }

  getStoredSession(): AuthSession | null {
    return this.getSession();
  }

  getUser(): AuthUser | null {
    return this.getSession()?.user || null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const session = this.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    // Handle 401 - try refresh
    if (res.status === 401 && session?.refresh_token) {
      const refreshed = await this.refreshToken(session.refresh_token);
      if (refreshed) {
        headers['Authorization'] = `Bearer ${refreshed.access_token}`;
        const retryRes = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
        });
        if (!retryRes.ok) {
          const error = await retryRes.json().catch(() => ({ error: 'Error del servidor' }));
          throw new Error(error.error || `Error ${retryRes.status}`);
        }
        return retryRes.json();
      } else {
        // Refresh failed, clear session
        this.setSession(null);
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Error del servidor' }));
      throw new Error(error.error || `Error ${res.status}`);
    }

    return res.json();
  }

  private async refreshToken(refreshToken: string): Promise<AuthSession | null> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) return null;

      const session: AuthSession = await res.json();
      this.setSession(session);
      return session;
    } catch {
      return null;
    }
  }

  // === Auth ===
  async register(email: string, password: string): Promise<AuthSession> {
    const session = await this.request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSession(session);
    return session;
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const session = await this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSession(session);
    return session;
  }

  async refresh(): Promise<AuthSession | null> {
    const session = this.getSession();
    if (!session?.refresh_token) return null;
    return this.refreshToken(session.refresh_token);
  }

  async getMe(): Promise<{ user: AuthUser }> {
    return this.request('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    this.setSession(null);
  }

  // === User Profile ===
  async getUserProfile(): Promise<AuthUser> {
    return this.request('/user/profile');
  }

  async updateUserProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // === LinkedIn Posts ===
  async getPosts(): Promise<any[]> {
    return this.request('/posts');
  }

  async upsertPosts(posts: any[]): Promise<any[]> {
    return this.request('/posts/upsert', {
      method: 'POST',
      body: JSON.stringify({ posts }),
    });
  }

  async updatePostCategory(url: string, category: string): Promise<any> {
    return this.request(`/posts/${encodeURIComponent(url)}/category`, {
      method: 'PUT',
      body: JSON.stringify({ category }),
    });
  }

  // === Premium ===
  async getPremiumLimits(): Promise<any> {
    return this.request('/premium/limits');
  }

  async getPremiumUsage(): Promise<any[]> {
    return this.request('/premium/usage');
  }

  async getPremiumCycleUsage(): Promise<any[]> {
    return this.request('/premium/cycle-usage');
  }

  async registerPremiumAction(action_type: string, metadata: any = {}): Promise<any> {
    return this.request('/premium/actions', {
      method: 'POST',
      body: JSON.stringify({ action_type, metadata }),
    });
  }

  // === Products ===
  async getActiveProducts(): Promise<any[]> {
    return this.request('/products');
  }

  // === Stripe ===
  async createCheckoutSession(priceId: string): Promise<any> {
    return this.request('/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ price_id: priceId }),
    });
  }

  async createPortalSession(): Promise<{ url: string }> {
    return this.request('/stripe/portal', {
      method: 'POST',
    });
  }

  // === Planner ===
  async getPlannerPosts(): Promise<any[]> {
    return this.request('/planner/posts');
  }

  async createPlannerPost(data: any): Promise<any> {
    return this.request('/planner/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlannerPost(id: string, data: any): Promise<any> {
    return this.request(`/planner/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async savePlannerOptimization(postId: string, data: any): Promise<any> {
    return this.request(`/planner/posts/${postId}/optimizations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // === Recommendations ===
  async getLatestRecommendation(): Promise<any> {
    return this.request('/recommendations/latest');
  }

  async saveRecommendation(data: any): Promise<any> {
    return this.request('/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
