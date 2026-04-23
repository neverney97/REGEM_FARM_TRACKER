export interface Farm {
  id: string;
  name: string;
  ownerId: string;
  managerIds: string[];
  location?: {
    latitude: number;
    longitude: number;
    region: string;
  };
  currency: 'GHS' | 'NGN' | 'USD';
  totalAcres: number;
  createdAt: Date;
  subscriptionStatus: 'active' | 'expired' | 'trial';
}

export interface FarmConfig {
  id: string;
  farmId: string;
  laborRates: LaborRates;
  inputCosts: Record<string, InputItem>;
  mixingDoses: Record<string, MixingDose>;
  lastUpdatedBy: string;
  lastUpdatedAt: Date;
  version: number;
}

export interface LaborRates {
  fertilizerApplicationPerBag: number;
  chemicalApplicationPerLiter: number;
  harrowingPerAcre: number;
  harrowingRounds: number;
  harvestingPerAcre: number;
  plantingPerAcre: number;
}

export interface InputItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
  category: 'seed' | 'fertilizer' | 'chemical' | 'other';
}

export interface MixingDose {
  chemicalId: string;
  per15L: number;
  per20L: number;
  unit: string;
}

export interface PriceHistoryEntry {
  id: string;
  farmId: string;
  field: string;
  oldValue: number;
  newValue: number;
  changedBy: string;
  changedAt: Date;
  notes?: string;
}