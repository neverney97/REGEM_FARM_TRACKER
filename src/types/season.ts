export type SeasonStatus = 'draft' | 'active' | 'completed' | 'archived';

export type GrowthStage =
  | 'pre_planting'
  | 'land_prep'
  | 'vegetative'
  | 'reproductive'
  | 'ripening'
  | 'harvest';

export interface Season {
  id: string;
  farmId: string;
  name: string;
  variety: string;
  acres: number;
  startDate: Date;
  endDate?: Date;
  status: SeasonStatus;
  totalBudget: number;
  totalSpent: number;
  totalRevenue?: number;
  bagsHarvested?: number;
  sellingPricePerBag: number;
  notes?: string;
  createdFrom?: string;
  createdAt: Date;
  createdBy: string;
}

export interface SeasonSummary {
  season: Season;
  tasksTotal: number;
  tasksDone: number;
  tasksOverdue: number;
  currentStage: GrowthStage;
  daysElapsed: number;
  daysTotal: number;
  estimatedROI: number;
  netProfit: number;
}