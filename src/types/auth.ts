export interface AuthUser {
  id: string;
  email: string;
  role: string;
  is_beta_tester: boolean;
  subscription_status: string;
  subscription_plan: string;
  subscription_expiry: string | null;
  trial_ends_at: string | null;
  subscription_start_date: string | null;
  next_billing_date: string | null;
  stripe_customer_id: string | null;
  last_login: string | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}
