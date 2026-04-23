/**
 * ============================================================
 * FARM STORE — Zustand Global State for Farm & Config Data
 * ============================================================
 * Manages the active farm, its configuration, and price history.
 *
 * RELATIONSHIP TO AUTH STORE:
 * - authStore holds WHO is logged in
 * - farmStore holds WHICH farm is active and its settings
 * - When user switches farms (Settings → Switch Farm),
 *   authStore.setActiveFarm() is called first, then
 *   farmStore.loadFarm() fetches the new farm's data
 *
 * CONFIG EDITING FLOW:
 * 1. Farm Admin opens Price Configurator
 * 2. They edit a price (e.g. NPK: GH₵400 → GH₵450)
 * 3. updateConfigField() is called
 * 4. Change is saved to Firestore via farmService.ts
 * 5. Old value is logged to priceHistory collection
 * 6. All screens that use that price auto-update via this store
 * ============================================================
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Farm, FarmConfig, LaborRates, InputItem, PriceHistoryEntry } from '../types/farm';

// ─────────────────────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────────────────────
interface FarmStore {
  // ── State ────────────────────────────────────────────────

  /** The currently active farm document from Firestore */
  activeFarm: Farm | null;

  /** The farm's configuration (prices, rates, doses) */
  config: FarmConfig | null;

  /** All farms the user has access to (for farm switcher) */
  farms: Farm[];

  /** Recent price change history for the Price History screen */
  priceHistory: PriceHistoryEntry[];

  /** True while fetching farm data from Firestore */
  isLoading: boolean;

  /** Error message if farm data fetch fails */
  error: string | null;

  /** True if there are unsaved config changes pending sync */
  hasPendingChanges: boolean;

  // ── Actions ──────────────────────────────────────────────

  /** Sets the active farm after user selects or switches farms */
  setActiveFarm: (farm: Farm) => void;

  /** Sets the full list of farms the user can access */
  setFarms: (farms: Farm[]) => void;

  /** Sets the farm configuration loaded from Firestore */
  setConfig: (config: FarmConfig) => void;

  /**
   * Updates a single field in the farm configuration.
   * This is the main action used by the Price Configurator screen.
   *
   * @param section - which config section to update
   *   ('laborRates' | 'inputCosts' | 'mixingDoses')
   * @param key - the specific field within that section
   * @param value - the new value
   *
   * @example
   * // Update NPK price from GH₵400 to GH₵450
   * updateConfigField('inputCosts', 'npk', { ...npk, unitCost: 450 })
   */
  updateConfigField: (
    section: 'laborRates' | 'inputCosts' | 'mixingDoses',
    key: string,
    value: any
  ) => void;

  /**
   * Updates a specific labor rate.
   * Shortcut for updateConfigField('laborRates', ...)
   *
   * @example
   * updateLaborRate('harrowingPerAcre', 400)
   */
  updateLaborRate: (key: keyof LaborRates, value: number) => void;

  /**
   * Updates a specific input item's cost or quantity.
   * Triggers a price history entry when unitCost changes.
   *
   * @example
   * updateInputItem('npk', { unitCost: 450 })
   */
  updateInputItem: (itemId: string, updates: Partial<InputItem>) => void;

  /** Adds a new price history entry to the local list */
  addPriceHistoryEntry: (entry: PriceHistoryEntry) => void;

  /** Sets the full price history list from Firestore */
  setPriceHistory: (history: PriceHistoryEntry[]) => void;

  /** Marks that there are unsaved changes pending Firestore sync */
  setPendingChanges: (hasPending: boolean) => void;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  /** Clears all farm data — called on logout or farm switch */
  clearFarm: () => void;

  // ── Computed helpers ─────────────────────────────────────

  /**
   * Calculates the total estimated budget for the season
   * based on current config prices and quantities.
   * Used by the Budget & ROI screen.
   */
  getTotalInputCost: () => number;

  /**
   * Returns the total labor cost for applying all inputs
   * based on current labor rates.
   */
  getTotalLaborCost: () => number;

  /**
   * Returns a specific input item by ID.
   * Used by the Inventory Tracker and Mixing Calculator.
   */
  getInputById: (itemId: string) => InputItem | undefined;
}

// ─────────────────────────────────────────────────────────────
// DEFAULT CONFIG
// Used when a new farm is created with no existing config.
// All prices are in GHS (Ghana Cedis) as defaults.
// Farm Admin can change all of these in Price Configurator.
// ─────────────────────────────────────────────────────────────
export const DEFAULT_FARM_CONFIG: Omit<FarmConfig, 'id' | 'farmId' | 'lastUpdatedBy' | 'lastUpdatedAt' | 'version'> = {
  laborRates: {
    fertilizerApplicationPerBag: 40,   // GH₵ per bag applied
    chemicalApplicationPerLiter: 40,   // GH₵ per liter applied
    harrowingPerAcre: 350,             // GH₵ per acre per pass
    harrowingRounds: 2,                // number of harrowing passes
    harvestingPerAcre: 700,            // GH₵ per acre (combined harvester)
    plantingPerAcre: 400,              // GH₵ per acre (SRI transplanting)
  },
  inputCosts: {
    seed: {
      id: 'seed',
      name: 'Ex-Baika Seed',
      qty: 1,
      unit: 'bag',
      unitCost: 550,
      category: 'seed',
    },
    npk: {
      id: 'npk',
      name: 'NPK 15-15-15',
      qty: 15,
      unit: 'bags',
      unitCost: 400,
      category: 'fertilizer',
    },
    soa: {
      id: 'soa',
      name: 'Sulphate of Ammonia',
      qty: 8,
      unit: 'bags',
      unitCost: 400,
      category: 'fertilizer',
    },
    herb_pre: {
      id: 'herb_pre',
      name: 'Pre-emergence Herbicide',
      qty: 5,
      unit: 'liters',
      unitCost: 130,
      category: 'chemical',
    },
    herb_post: {
      id: 'herb_post',
      name: 'Post-emergence Herbicide',
      qty: 5,
      unit: 'liters',
      unitCost: 170,
      category: 'chemical',
    },
    pesticide: {
      id: 'pesticide',
      name: 'Pesticide',
      qty: 5,
      unit: 'liters',
      unitCost: 120,
      category: 'chemical',
    },
    fungicide: {
      id: 'fungicide',
      name: 'Fungicide',
      qty: 5,
      unit: 'kg',
      unitCost: 110,
      category: 'chemical',
    },
    supergro: {
      id: 'supergro',
      name: 'SuperGro',
      qty: 5,
      unit: 'liters',
      unitCost: 170,
      category: 'chemical',
    },
  },
  mixingDoses: {
    herbicide: { chemicalId: 'herbicide', per15L: 100, per20L: 150, unit: 'ml' },
    pesticide: { chemicalId: 'pesticide', per15L: 50, per20L: 75, unit: 'ml' },
    fungicide: { chemicalId: 'fungicide', per15L: 30, per20L: 40, unit: 'g' },
    supergro: { chemicalId: 'supergro', per15L: 15, per20L: 20, unit: 'ml' },
  },
};

// ─────────────────────────────────────────────────────────────
// STORE CREATION
// ─────────────────────────────────────────────────────────────
export const useFarmStore = create<FarmStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ───────────────────────────────────
      activeFarm: null,
      config: null,
      farms: [],
      priceHistory: [],
      isLoading: false,
      error: null,
      hasPendingChanges: false,

      // ── Actions ─────────────────────────────────────────

      setActiveFarm: (farm: Farm) => {
        set({ activeFarm: farm, error: null });
      },

      setFarms: (farms: Farm[]) => {
        set({ farms });
      },

      setConfig: (config: FarmConfig) => {
        set({ config, hasPendingChanges: false });
      },

      updateConfigField: (section, key, value) => {
        /**
         * Updates a single field in the config.
         * Uses nested spread to preserve all other config values.
         * Sets hasPendingChanges so the UI can show a save indicator.
         */
        const currentConfig = get().config;
        if (!currentConfig) return;

        set({
          config: {
            ...currentConfig,
            [section]: {
              ...currentConfig[section],
              [key]: value,
            },
          },
          hasPendingChanges: true,
        });
      },

      updateLaborRate: (key: keyof LaborRates, value: number) => {
        /**
         * Shortcut to update a single labor rate.
         * More readable than calling updateConfigField directly.
         */
        const currentConfig = get().config;
        if (!currentConfig) return;

        set({
          config: {
            ...currentConfig,
            laborRates: {
              ...currentConfig.laborRates,
              [key]: value,
            },
          },
          hasPendingChanges: true,
        });
      },

      updateInputItem: (itemId: string, updates: Partial<InputItem>) => {
        /**
         * Updates a specific input item (e.g. NPK price change).
         * Merges updates with existing item data.
         */
        const currentConfig = get().config;
        if (!currentConfig) return;

        const existingItem = currentConfig.inputCosts[itemId];
        if (!existingItem) return;

        set({
          config: {
            ...currentConfig,
            inputCosts: {
              ...currentConfig.inputCosts,
              [itemId]: { ...existingItem, ...updates },
            },
          },
          hasPendingChanges: true,
        });
      },

      addPriceHistoryEntry: (entry: PriceHistoryEntry) => {
        /**
         * Prepends the new entry to the history list.
         * Most recent changes appear first.
         * Keeps only the last 100 entries in local state
         * to prevent memory bloat. Full history is in Firestore.
         */
        set((state) => ({
          priceHistory: [entry, ...state.priceHistory].slice(0, 100),
        }));
      },

      setPriceHistory: (history: PriceHistoryEntry[]) => {
        set({ priceHistory: history });
      },

      setPendingChanges: (hasPending: boolean) => {
        set({ hasPendingChanges: hasPending });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      clearFarm: () => {
        /**
         * Resets all farm state.
         * Called on logout so the next user starts fresh.
         */
        set({
          activeFarm: null,
          config: null,
          farms: [],
          priceHistory: [],
          isLoading: false,
          error: null,
          hasPendingChanges: false,
        });
      },

      // ── Computed helpers ─────────────────────────────────

      getTotalInputCost: () => {
        /**
         * Calculates total cost of all inputs based on
         * current config prices and quantities.
         *
         * Formula: sum of (qty × unitCost) for each input item
         */
        const config = get().config;
        if (!config) return 0;

        return Object.values(config.inputCosts).reduce((total, item) => {
          return total + item.qty * item.unitCost;
        }, 0);
      },

      getTotalLaborCost: () => {
        /**
         * Calculates total labour cost for applying all inputs.
         * Fertilizer: bags × rate per bag
         * Chemicals: liters × rate per liter
         */
        const config = get().config;
        if (!config) return 0;

        const { laborRates, inputCosts } = config;
        let laborTotal = 0;

        Object.values(inputCosts).forEach((item) => {
          if (item.category === 'fertilizer') {
            laborTotal += item.qty * laborRates.fertilizerApplicationPerBag;
          } else if (item.category === 'chemical') {
            laborTotal += item.qty * laborRates.chemicalApplicationPerLiter;
          }
        });

        return laborTotal;
      },

      getInputById: (itemId: string) => {
        return get().config?.inputCosts[itemId];
      },
    }),

    {
      /**
       * Persist farm and config data locally so it
       * survives app restarts and works offline.
       */
      name: 'regem-farm-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeFarm: state.activeFarm,
        config: state.config,
        farms: state.farms,
      }),
    }
  )
);