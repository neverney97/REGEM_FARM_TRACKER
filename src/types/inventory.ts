export interface InventoryItem {
  id: string;
  farmId: string;
  seasonId: string;
  name: string;
  category: 'seed' | 'fertilizer' | 'herbicide' | 'pesticide' | 'fungicide' | 'other';
  unit: string;
  plannedQty: number;
  remainingQty: number;
  unitCost: number;
  laborCostPerUnit: number;
  reorderThreshold: number;
  storageLocation?: string;
  batchId?: string;
  supplierName?: string;
  photoUrl?: string;
  usageLogs: UsageLog[];
}

export type StockStatus = 'in_stock' | 'low' | 'critical' | 'out';

export interface UsageLog {
  id: string;
  qty: number;
  date: Date;
  taskId?: string;
  loggedBy: string;
  notes?: string;
}