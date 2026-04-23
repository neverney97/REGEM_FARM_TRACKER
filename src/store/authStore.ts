/**
 * ============================================================
 * AUTH STORE — Zustand Global State for Authentication
 * ============================================================
 * Manages the authenticated user's state across the entire app.
 *
 * WHY ZUSTAND:
 * - Simpler than Redux with less boilerplate
 * - Works perfectly with React Native
 * - Supports persistence via AsyncStorage
 * - Minimal re-renders — only components that use a specific
 *   piece of state re-render when that piece changes
 *
 * HOW TO USE IN A COMPONENT:
 *   import { useAuthStore } from '@/store/authStore'
 *   const { user, isAuthenticated } = useAuthStore()
 *
 * HOW TO TRIGGER AN ACTION:
 *   const { setUser, clearAuth } = useAuthStore()
 *   setUser(firebaseUser)
 *
 * IMPORTANT:
 * This store holds CLIENT-SIDE state only.
 * The source of truth is always Firebase Auth + Firestore.
 * This store is just a fast local cache of that data
 * so components don't need to re-fetch on every render.
 * ============================================================
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, UserRole, SubscriptionPlan } from '../types/auth';

// ─────────────────────────────────────────────────────────────
// STORE INTERFACE
// Defines all state properties and actions available in this store.
// Actions are functions that modify the state.
// ─────────────────────────────────────────────────────────────
interface AuthStore extends AuthState {
  // ── Actions ──────────────────────────────────────────────

  /**
   * Called after successful Firebase login/register.
   * Sets the user object and marks the session as authenticated.
   */
  setUser: (user: User) => void;

  /**
   * Updates specific fields on the current user without
   * replacing the entire user object. Useful for profile updates.
   */
  updateUser: (updates: Partial<User>) => void;

  /**
   * Called when the app is loading and checking auth state.
   * Shows a loading screen while Firebase restores the session.
   */
  setLoading: (isLoading: boolean) => void;

  /**
   * Stores an error message to display in the UI.
   * e.g. 'Invalid email or password'
   */
  setError: (error: string | null) => void;

  /**
   * Clears all auth state on logout.
   * Resets everything back to the initial unauthenticated state.
   */
  clearAuth: () => void;

  /**
   * Updates the user's active farm.
   * Called when user switches between farms in Settings.
   */
  setActiveFarm: (farmId: string) => void;

  /**
   * Updates the user's subscription plan in local state.
   * Called after a successful Paystack payment or webhook update.
   */
  setSubscriptionPlan: (plan: SubscriptionPlan) => void;

  // ── Computed helpers ─────────────────────────────────────

  /**
   * Returns true if the current user is a Farm Admin or Super Admin.
   * Use this to show/hide admin-only features like Price Configurator.
   *
   * @example
   * const { isAdmin } = useAuthStore()
   * {isAdmin() && <PriceConfiguratorButton />}
   */
  isAdmin: () => boolean;

  /**
   * Returns true if the current user is a Super Admin only.
   * Use this for platform-level features like global farm dashboard.
   */
  isSuperAdmin: () => boolean;

  /**
   * Returns true if the current user's subscription allows
   * access to the AI Smart Planner feature.
   */
  hasAIAccess: () => boolean;

  /**
   * Returns true if the user can create more farms based on
   * their current subscription plan limits.
   */
  canCreateFarm: (currentFarmCount: number) => boolean;
}

// ─────────────────────────────────────────────────────────────
// INITIAL STATE
// The default values when the app first loads or after logout.
// ─────────────────────────────────────────────────────────────
const initialState: AuthState = {
  user: null,
  isLoading: true, // true on startup while Firebase checks session
  isAuthenticated: false,
  error: null,
};

// ─────────────────────────────────────────────────────────────
// PLAN LIMITS
// Mirrors ENV.PLAN_LIMITS but kept here for store-level checks.
// Update these if subscription tiers change.
// ─────────────────────────────────────────────────────────────
const PLAN_LIMITS: Record<SubscriptionPlan, { maxFarms: number; aiPlanner: boolean }> = {
  free: { maxFarms: 1, aiPlanner: false },
  basic: { maxFarms: 1, aiPlanner: false },
  pro: { maxFarms: 3, aiPlanner: true },
  enterprise: { maxFarms: 999, aiPlanner: true },
};

// ─────────────────────────────────────────────────────────────
// STORE CREATION
// persist middleware saves the store to AsyncStorage so the
// user's session survives app restarts.
// ─────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ───────────────────────────────────
      ...initialState,

      // ── Actions ─────────────────────────────────────────

      setUser: (user: User) => {
        /**
         * Sets the authenticated user and marks session as active.
         * Called by authService after successful Firebase sign-in.
         */
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      updateUser: (updates: Partial<User>) => {
        /**
         * Merges updates into the existing user object.
         * Only updates the fields provided, preserves the rest.
         */
        const currentUser = get().user;
        if (!currentUser) return;
        set({
          user: { ...currentUser, ...updates },
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        /**
         * Stores error message for display in auth screens.
         * Pass null to clear the error.
         */
        set({ error, isLoading: false });
      },

      clearAuth: () => {
        /**
         * Resets all auth state to initial values.
         * Called on logout — does NOT call Firebase signOut()
         * directly. That is handled by authService.ts which
         * then calls this action to clear local state.
         */
        set({ ...initialState, isLoading: false });
      },

      setActiveFarm: (farmId: string) => {
        /**
         * Updates the user's currently selected farm.
         * The active farm determines which data is shown
         * across all screens (dashboard, tasks, inventory etc.)
         */
        const currentUser = get().user;
        if (!currentUser) return;
        set({
          user: { ...currentUser, activeFarmId: farmId },
        });
      },

      setSubscriptionPlan: (plan: SubscriptionPlan) => {
        /**
         * Updates subscription plan after payment confirmation.
         * Also called by the Firestore subscription listener
         * when the server-side plan changes (e.g. renewal, expiry).
         */
        const currentUser = get().user;
        if (!currentUser) return;
        set({
          user: { ...currentUser, subscriptionPlan: plan },
        });
      },

      // ── Computed helpers ─────────────────────────────────

      isAdmin: () => {
        /**
         * Farm Admins and Super Admins can edit configs,
         * view financials, and manage their team.
         * Farm Managers cannot.
         */
        const role = get().user?.role;
        return role === 'farm_admin' || role === 'super_admin';
      },

      isSuperAdmin: () => {
        /**
         * Only the platform owner (Emmanuel) has super_admin role.
         * Grants access to all farms and the global dashboard.
         */
        return get().user?.role === 'super_admin';
      },

      hasAIAccess: () => {
        /**
         * AI Planner is only available on Pro and Enterprise plans.
         * Returns false for free and basic users → shows upgrade prompt.
         */
        const plan = get().user?.subscriptionPlan ?? 'free';
        return PLAN_LIMITS[plan].aiPlanner;
      },

      canCreateFarm: (currentFarmCount: number) => {
        /**
         * Checks if the user can create another farm based on
         * their subscription plan limit.
         *
         * @param currentFarmCount - how many farms they already have
         * @returns true if they are under their plan limit
         */
        const plan = get().user?.subscriptionPlan ?? 'free';
        return currentFarmCount < PLAN_LIMITS[plan].maxFarms;
      },
    }),

    {
      /**
       * PERSISTENCE CONFIGURATION
       * Saves the store to AsyncStorage under this key.
       * Only persists the user object — not loading/error states
       * since those are transient and should reset on app restart.
       */
      name: 'regem-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        /**
         * Only persist these fields to AsyncStorage.
         * Excludes isLoading and error as they are session-specific.
         */
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);