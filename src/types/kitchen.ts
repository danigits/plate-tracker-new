
export interface Kitchen {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastUpdated: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'vegetable' | 'meat' | 'grain' | 'dairy' | 'spice' | 'other';
  quantity: number;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'unit' | 'pack';
  threshold: number;
  kitchenId: string;
  lastUpdated: string;
}

export interface PreparationPlan {
  id: string;
  kitchenId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'special';
  estimatedPlates: number;
  actualPlates: number | null;
  wastage: number | null;
  wastageReason?: string;
  status: 'planned' | 'in-progress' | 'completed';
  recipes: string[];
}
