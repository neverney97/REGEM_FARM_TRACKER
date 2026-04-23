export type UserRole = 'super_admin' | 'farm_admin' | 'farm_manager';

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  farmIds: string[];
  activeFarmId?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionValidUntil?: Date;
  language: 'en' | 'tw' | 'ee';
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}