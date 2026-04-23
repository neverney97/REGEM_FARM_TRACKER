/**
 * ============================================================
 * FIREBASE CONFIGURATION & INITIALISATION
 * ============================================================
 * Compatible with Firebase 10.x + React Native + Expo
 *
 * IMPORTANT NOTE ON AUTH PERSISTENCE:
 * Firebase 10+ removed firebase/auth/react-native entirely.
 * The correct approach is to use indexedDB or memory persistence
 * from firebase/auth directly, combined with AsyncStorage
 * through a custom persistence layer.
 *
 * SERVICES USED:
 * - Firebase Auth:      User authentication (email + Google)
 * - Firestore:          Primary database (real-time + offline)
 * - Firebase Storage:   File uploads (photos, voice notes, PDFs)
 *
 * OFFLINE SUPPORT:
 * Firestore offline persistence is enabled so farmers in
 * low-connectivity areas can still use the app fully.
 * All writes queue locally and sync when back online.
 * ============================================================
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ─────────────────────────────────────────────────────────────
// FIREBASE PROJECT CONFIGURATION
// Replace ALL values below with your actual Firebase project config.
// Find these in: Firebase Console → Project Settings → Your Apps
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// ─────────────────────────────────────────────────────────────
// APP INITIALISATION
// Prevents re-initialising Firebase on hot reload in development.
// getApps().length check ensures we only initialise once.
// ─────────────────────────────────────────────────────────────
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// ─────────────────────────────────────────────────────────────
// FIREBASE AUTH
//
// Firebase 10+ no longer exports getReactNativePersistence
// from a separate path. Instead we use getAuth() directly
// and handle session persistence via expo-secure-store in
// our auth service layer (src/services/authService.ts).
//
// This means:
// - Auth state is managed by Firebase in memory during the session
// - Our authService checks SecureStore on app launch to restore
//   the session token and re-authenticate silently
// - This is actually MORE secure than AsyncStorage persistence
//   because SecureStore is encrypted on the device
// ─────────────────────────────────────────────────────────────
const auth: Auth = getAuth(app);

// ─────────────────────────────────────────────────────────────
// FIRESTORE DATABASE
//
// persistentLocalCache enables full offline support:
// - Data cached locally on the device
// - Reads work without internet connection
// - Writes queued and synced when reconnected
// - Critical for farmers working in remote areas
// ─────────────────────────────────────────────────────────────
let db: Firestore;

try {
  db = initializeFirestore(app, {
    /**
     * persistentLocalCache is the modern replacement for
     * enableIndexedDbPersistence(). Provides automatic
     * offline caching and background sync on reconnection.
     */
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (error) {
  /**
   * Fallback to standard Firestore if persistence fails.
   * Can happen on older Android devices or if already
   * initialised during hot reload in development.
   */
  console.warn(
    'Firestore persistence setup failed, using standard mode:',
    error
  );
  db = getFirestore(app);
}

// ─────────────────────────────────────────────────────────────
// FIREBASE STORAGE
// Used for task photos, voice notes, and exported PDF reports
// ─────────────────────────────────────────────────────────────
const storage: FirebaseStorage = getStorage(app);

// ─────────────────────────────────────────────────────────────
// FIRESTORE COLLECTION PATHS
//
// All Firestore collection names are defined here as constants.
// Never hardcode collection names directly in service files —
// always import from here so renames only need one change.
//
// STRUCTURE:
// /users/{userId}
// /farms/{farmId}
// /farms/{farmId}/config/{configId}
// /farms/{farmId}/priceHistory/{entryId}
// /farms/{farmId}/seasons/{seasonId}
// /farms/{farmId}/seasons/{seasonId}/tasks/{taskId}
// /farms/{farmId}/seasons/{seasonId}/inventory/{itemId}
// /farms/{farmId}/seasons/{seasonId}/laborLogs/{logId}
// /subscriptions/{farmId}
// ─────────────────────────────────────────────────────────────
export const COLLECTIONS = {
  // Top-level collections
  USERS: 'users',
  FARMS: 'farms',
  SUBSCRIPTIONS: 'subscriptions',

  // Sub-collections under /farms/{farmId}
  FARM_CONFIG: 'config',
  PRICE_HISTORY: 'priceHistory',

  // Sub-collections under /farms/{farmId}/seasons/{seasonId}
  SEASONS: 'seasons',
  TASKS: 'tasks',
  INVENTORY: 'inventory',
  LABOR_LOGS: 'laborLogs',
} as const;

// ─────────────────────────────────────────────────────────────
// PATH HELPERS
//
// Helper functions for building Firestore document paths.
// Use these instead of manually concatenating strings.
// ─────────────────────────────────────────────────────────────

/**
 * Builds the path to a season's sub-collection
 * @example getSeasonPath('farm1', 'season1', COLLECTIONS.TASKS)
 * @returns 'farms/farm1/seasons/season1/tasks'
 */
export const getSeasonPath = (
  farmId: string,
  seasonId: string,
  subCollection: string
): string => {
  return `${COLLECTIONS.FARMS}/${farmId}/${COLLECTIONS.SEASONS}/${seasonId}/${subCollection}`;
};

/**
 * Builds the path to a farm's sub-collection
 * @example getFarmPath('farm1', COLLECTIONS.PRICE_HISTORY)
 * @returns 'farms/farm1/priceHistory'
 */
export const getFarmPath = (
  farmId: string,
  subCollection: string
): string => {
  return `${COLLECTIONS.FARMS}/${farmId}/${subCollection}`;
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// Import these throughout the app:
// import { auth, db, storage, COLLECTIONS } from '@/config/firebase'
// ─────────────────────────────────────────────────────────────
export { app, auth, db, storage };