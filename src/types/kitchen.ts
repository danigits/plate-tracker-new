import { UUID } from "crypto";

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
  category: 'vegetable' | 'meat' | 'grain' | 'dairy' | 'spice' | 'groceries' | 'other';
  quantity: number;
  pricePerUnit: number;
  unit: 'kg' | 'gm' | 'ltr' | 'ml' | 'unit' | 'pack';
  threshold: number;
  kitchenId: string;
  lastUpdated: string;
  image_url?: string; // ✅ new optional field
}


export interface PreparationPlan {
  id: string;
  kitchenId: string;
  menu_item_id:UUID;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'special';
  estimatedPlates: number;
  actualPlates: number | null;
  wastage: number | null;
  wastageReason?: string;
  is_approved: 'planned' | 'in-progress' | 'completed'|'true';
  recipes: string[];
}

export type NewInventoryItem = Omit<InventoryItem, 'id'>;

export interface AddItemProps {
  onItemAdded: () => void;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
}
