/**
 * ============================================================
 * ENVIRONMENT CONFIGURATION
 * ============================================================
 * Centralises all environment variables and app-wide constants.
 *
 * HOW TO USE:
 * - Never hardcode API keys anywhere in the app
 * - Always import from this file
 * - In production, these values should come from
 *   a .env file using expo-constants or react-native-config
 *
 * ADDING NEW VARIABLES:
 * 1. Add the variable here with a descriptive comment
 * 2. Add the type to the Config interface below
 * 3. Import and use it anywhere in the app via:
 *    import { ENV } from '@/config/env';
 * ============================================================
 */

export const ENV = {
  /**
   * App identity
   * Update APP_VERSION whenever you release a new build
   */
  APP_NAME: 'REGEM Farm Track',
  APP_VERSION: '1.0.0',
  APP_ENV: __DEV__ ? 'development' : 'production',

  /**
   * Anthropic Claude API
   * Used by the AI Smart Planner to generate season strategies
   * Get your key at: https://console.anthropic.com
   * IMPORTANT: In production, route all Claude API calls through
   * a Firebase Cloud Function to keep this key server-side only
   */
  CLAUDE_API_KEY: 'YOUR_CLAUDE_API_KEY_HERE',
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',
  CLAUDE_MAX_TOKENS: 2000,

  /**
   * Paystack Payment Gateway
   * Used for subscription billing (supports Ghana Mobile Money)
   * Get your key at: https://dashboard.paystack.com
   * Use the TEST key during development, LIVE key in production
   */
  PAYSTACK_PUBLIC_KEY: 'YOUR_PAYSTACK_PUBLIC_KEY_HERE',

  /**
   * OpenWeatherMap API
   * Used on the Home Dashboard to show local farm weather
   * Get your free key at: https://openweathermap.org/api
   */
  WEATHER_API_KEY: 'YOUR_OPENWEATHERMAP_KEY_HERE',
  WEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',

  /**
   * Support contact
   * The WhatsApp number shown in Settings → Support Chat
   * Format: country code + number, no spaces or symbols
   */
  SUPPORT_WHATSAPP: '233XXXXXXXXX',

  /**
   * Feature flags
   * Toggle features on/off without deploying new code
   * Useful for gradual rollouts and A/B testing
   */
  FEATURES: {
    AI_PLANNER: true,        // Claude AI season planning
    WEATHER: true,           // Weather widget on dashboard
    PAYSTACK: false,         // Set to true when ready to take payments
    OFFLINE_MODE: true,      // Firestore offline persistence
    PUSH_NOTIFICATIONS: true, // FCM + local notifications
    VOICE_NOTES: true,       // Voice notes on task completion
    FIELD_MAP: false,        // Field mapping (future feature)
  },

  /**
   * Subscription plan limits
   * These mirror the Firestore subscription documents
   * Used client-side to show/hide features before server confirms
   */
  PLAN_LIMITS: {
    free: {
      maxFarms: 1,
      maxActiveSeasons: 1,
      maxAcres: 2,
      maxManagers: 0,
      aiPlanner: false,
    },
    basic: {
      maxFarms: 1,
      maxActiveSeasons: 3,
      maxAcres: 10,
      maxManagers: 1,
      aiPlanner: false,
    },
    pro: {
      maxFarms: 3,
      maxActiveSeasons: 999,
      maxAcres: 50,
      maxManagers: 5,
      aiPlanner: true,
    },
    enterprise: {
      maxFarms: 999,
      maxActiveSeasons: 999,
      maxAcres: 999,
      maxManagers: 999,
      aiPlanner: true,
    },
  },
};