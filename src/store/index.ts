/**
 * ============================================================
 * STORE INDEX — Central export for all Zustand stores
 * ============================================================
 * Import all stores from this file for cleaner imports:
 *
 * USAGE:
 *   import { useAuthStore, useFarmStore, useSeasonStore } from '@/store'
 *
 * instead of:
 *   import { useAuthStore } from '@/store/authStore'
 *   import { useFarmStore } from '@/store/farmStore'
 *   import { useSeasonStore } from '@/store/seasonStore'
 * ============================================================
 */

export { useAuthStore } from './authStore';
export { useFarmStore, DEFAULT_FARM_CONFIG } from './farmStore';
export { useSeasonStore } from './seasonStore';