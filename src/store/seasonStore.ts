/**
 * ============================================================
 * SEASON STORE — Zustand Global State for Seasons & Tasks
 * ============================================================
 * Manages the active season, all seasons list, and task state.
 *
 * SEASON LIFECYCLE:
 * draft → active → completed → archived
 *
 * Only one season can be 'active' at a time per farm.
 * Completed seasons are kept for historical comparison.
 * Archived seasons are hidden from the main list but
 * preserved in Firestore for data integrity.
 *
 * TASK STATUS FLOW:
 * upcoming → pending → done
 *                   ↘ overdue (if not done by scheduled date)
 *                   ↘ skipped (manually skipped by admin)
 * ============================================================
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Season, SeasonSummary, GrowthStage } from '../types/season';
import { Task, TaskGroup, TaskStatus } from '../types/task';

// ─────────────────────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────────────────────
interface SeasonStore {
  // ── State ────────────────────────────────────────────────

  /** The currently selected/active season */
  activeSeason: Season | null;

  /** All seasons for the active farm */
  seasons: Season[];

  /** All tasks for the active season */
  tasks: Task[];

  /** Computed summary stats for the active season */
  seasonSummary: SeasonSummary | null;

  isLoading: boolean;
  error: string | null;

  // ── Actions ──────────────────────────────────────────────

  setActiveSeason: (season: Season) => void;
  setSeasons: (seasons: Season[]) => void;
  setTasks: (tasks: Task[]) => void;
  setSeasonSummary: (summary: SeasonSummary) => void;

  /**
   * Adds a new season to the seasons list.
   * Called after Season Setup Wizard completes.
   */
  addSeason: (season: Season) => void;

  /**
   * Updates a season document in the local list.
   * Called when season status changes or budget updates.
   */
  updateSeason: (seasonId: string, updates: Partial<Season>) => void;

  /**
   * Updates a single task's status and completion data.
   * Called when Farm Manager taps "Mark Done" on a task.
   *
   * @param taskId - the task to update
   * @param updates - status, actualCost, notes, completedAt etc.
   */
  updateTask: (taskId: string, updates: Partial<Task>) => void;

  /**
   * Adds a custom task to the current season.
   * Only Farm Admins can call this — enforced in the UI layer.
   */
  addTask: (task: Task) => void;

  /**
   * Removes a task from the local list.
   * Only for custom tasks — default tasks cannot be deleted.
   */
  removeTask: (taskId: string) => void;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSeasons: () => void;

  // ── Computed helpers ─────────────────────────────────────

  /**
   * Returns the next pending or upcoming task by day number.
   * Used on the Home Dashboard "Next Task" card.
   */
  getNextTask: () => Task | null;

  /**
   * Returns all overdue tasks (status === 'overdue').
   * Used for the red alert banner on the dashboard.
   */
  getOverdueTasks: () => Task[];

  /**
   * Groups tasks by their phase (Land Prep, Vegetative etc.)
   * for the Task Timeline screen.
   */
  getTasksByPhase: () => TaskGroup[];

  /**
   * Calculates how many days into the season we are.
   * Used for the progress ring on the dashboard.
   */
  getDaysElapsed: () => number;

  /**
   * Determines the current growth stage based on days elapsed.
   * Used for the growth stage chip on the dashboard.
   */
  getCurrentGrowthStage: () => GrowthStage;

  /**
   * Calculates total actual spend from completed tasks.
   * Used on the Budget & ROI screen.
   */
  getTotalSpent: () => number;
}

// ─────────────────────────────────────────────────────────────
// GROWTH STAGE BOUNDARIES (days from planting)
// Adjust these if the variety changes typical growth periods.
// Based on standard Ex-Baika / NERICA growth calendar.
// ─────────────────────────────────────────────────────────────
const GROWTH_STAGES: { stage: GrowthStage; maxDay: number }[] = [
  { stage: 'pre_planting', maxDay: 0 },
  { stage: 'land_prep', maxDay: 14 },
  { stage: 'vegetative', maxDay: 55 },
  { stage: 'reproductive', maxDay: 90 },
  { stage: 'ripening', maxDay: 110 },
  { stage: 'harvest', maxDay: 130 },
];

// ─────────────────────────────────────────────────────────────
// PHASE LABELS
// Maps task types to their phase group name on the timeline.
// ─────────────────────────────────────────────────────────────
const PHASE_LABELS: Record<string, string> = {
  land_prep: 'Land Preparation',
  planting: 'Planting',
  vegetative: 'Vegetative Stage',
  reproductive: 'Reproductive Stage',
  harvest: 'Harvest',
};

// ─────────────────────────────────────────────────────────────
// STORE CREATION
// ─────────────────────────────────────────────────────────────
export const useSeasonStore = create<SeasonStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ───────────────────────────────────
      activeSeason: null,
      seasons: [],
      tasks: [],
      seasonSummary: null,
      isLoading: false,
      error: null,

      // ── Actions ─────────────────────────────────────────

      setActiveSeason: (season: Season) => {
        set({ activeSeason: season });
      },

      setSeasons: (seasons: Season[]) => {
        /**
         * Sorts seasons by startDate descending so the
         * most recent season appears first in the list.
         */
        const sorted = [...seasons].sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        set({ seasons: sorted });
      },

      setTasks: (tasks: Task[]) => {
        /**
         * Sorts tasks by dayNumber ascending so they appear
         * in chronological order on the timeline.
         */
        const sorted = [...tasks].sort((a, b) => a.dayNumber - b.dayNumber);
        set({ tasks: sorted });
      },

      setSeasonSummary: (summary: SeasonSummary) => {
        set({ seasonSummary: summary });
      },

      addSeason: (season: Season) => {
        set((state) => ({
          seasons: [season, ...state.seasons],
        }));
      },

      updateSeason: (seasonId: string, updates: Partial<Season>) => {
        set((state) => ({
          seasons: state.seasons.map((s) =>
            s.id === seasonId ? { ...s, ...updates } : s
          ),
          // Also update activeSeason if it's the same one
          activeSeason:
            state.activeSeason?.id === seasonId
              ? { ...state.activeSeason, ...updates }
              : state.activeSeason,
        }));
      },

      updateTask: (taskId: string, updates: Partial<Task>) => {
        /**
         * Updates a task in the local list.
         * The actual Firestore write is handled by taskService.ts
         * which calls this action after a successful save.
         */
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
        }));
      },

      addTask: (task: Task) => {
        /**
         * Inserts the new task in the correct position
         * based on its dayNumber to maintain sort order.
         */
        set((state) => {
          const newTasks = [...state.tasks, task].sort(
            (a, b) => a.dayNumber - b.dayNumber
          );
          return { tasks: newTasks };
        });
      },

      removeTask: (taskId: string) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      clearSeasons: () => {
        set({
          activeSeason: null,
          seasons: [],
          tasks: [],
          seasonSummary: null,
          isLoading: false,
          error: null,
        });
      },

      // ── Computed helpers ─────────────────────────────────

      getNextTask: () => {
        /**
         * Finds the first task that is either pending or upcoming,
         * sorted by dayNumber. This is shown on the dashboard
         * as the "Next Task" card.
         */
        const tasks = get().tasks;
        return (
          tasks.find(
            (t) => t.status === 'pending' || t.status === 'upcoming'
          ) ?? null
        );
      },

      getOverdueTasks: () => {
        return get().tasks.filter((t) => t.status === 'overdue');
      },

      getTasksByPhase: () => {
        /**
         * Groups tasks into phase buckets for the timeline screen.
         * Each group has a label, task list, and progress counter.
         *
         * Phase grouping logic:
         * - Days 1–14:   Land Preparation
         * - Days 15–55:  Vegetative Stage
         * - Days 56–90:  Reproductive Stage
         * - Days 91+:    Harvest
         */
        const tasks = get().tasks;
        const groups: Record<string, Task[]> = {};

        tasks.forEach((task) => {
          const phase = getPhaseForDay(task.dayNumber);
          if (!groups[phase]) groups[phase] = [];
          groups[phase].push(task);
        });

        return Object.entries(groups).map(([phase, phaseTasks]) => ({
          phase,
          stage: PHASE_LABELS[phase] ?? phase,
          tasks: phaseTasks,
          totalTasks: phaseTasks.length,
          doneTasks: phaseTasks.filter((t) => t.status === 'done').length,
        }));
      },

      getDaysElapsed: () => {
        /**
         * Calculates days since season start date.
         * Returns 0 if no active season or start date.
         */
        const season = get().activeSeason;
        if (!season?.startDate) return 0;

        const start = new Date(season.startDate);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      },

      getCurrentGrowthStage: () => {
        /**
         * Determines growth stage based on days elapsed.
         * Works through the GROWTH_STAGES array and returns
         * the stage whose maxDay is first exceeded.
         */
        const days = get().getDaysElapsed();

        for (const { stage, maxDay } of GROWTH_STAGES) {
          if (days <= maxDay) return stage;
        }

        return 'harvest';
      },

      getTotalSpent: () => {
        /**
         * Sums actual costs of all completed tasks.
         * Falls back to estimated cost if actual cost not recorded.
         */
        return get()
          .tasks.filter((t) => t.status === 'done')
          .reduce((total, task) => {
            return total + (task.actualCost ?? task.estimatedCost);
          }, 0);
      },
    }),

    {
      name: 'regem-season-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeSeason: state.activeSeason,
        seasons: state.seasons,
        tasks: state.tasks,
      }),
    }
  )
);

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS (module-level, not in store)
// ─────────────────────────────────────────────────────────────

/**
 * Determines which phase a task belongs to based on its day number.
 * Used by getTasksByPhase() to group tasks on the timeline.
 */
function getPhaseForDay(dayNumber: number): string {
  if (dayNumber <= 14) return 'land_prep';
  if (dayNumber <= 55) return 'vegetative';
  if (dayNumber <= 90) return 'reproductive';
  return 'harvest';
}