
import { Kitchen, InventoryItem, PreparationPlan } from '@/types/kitchen';

// Mock data for kitchens
export const mockKitchens: Kitchen[] = Array.from({ length: 40 }, (_, i) => ({
  id: `k${i + 1}`,
  name: `Kitchen ${i + 1}`,
  location: `Location ${Math.floor(i / 5) + 1}`,
  status: i % 10 === 0 ? 'maintenance' : i % 5 === 0 ? 'inactive' : 'active',
  lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
}));

// Mock inventory data
export const mockInventory: InventoryItem[] = [
  {
    id: 'i1',
    name: 'Rice',
    category: 'grain',
    quantity: 50,
    unit: 'kg',
    threshold: 10,
    kitchenId: 'k1',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'i2',
    name: 'Potatoes',
    category: 'vegetable',
    quantity: 30,
    unit: 'kg',
    threshold: 5,
    kitchenId: 'k1',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'i3',
    name: 'Chicken',
    category: 'meat',
    quantity: 15,
    unit: 'kg',
    threshold: 3,
    kitchenId: 'k1',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'i4',
    name: 'Onions',
    category: 'vegetable',
    quantity: 20,
    unit: 'kg',
    threshold: 4,
    kitchenId: 'k1',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'i5',
    name: 'Tomatoes',
    category: 'vegetable',
    quantity: 8,
    unit: 'kg',
    threshold: 2,
    kitchenId: 'k1',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'i6',
    name: 'Milk',
    category: 'dairy',
    quantity: 12,
    unit: 'l',
    threshold: 3,
    kitchenId: 'k1',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'i7',
    name: 'Salt',
    category: 'spice',
    quantity: 5,
    unit: 'kg',
    threshold: 1,
    kitchenId: 'k1',
    lastUpdated: new Date().toISOString()
  }
];

// Mock preparation plans
export const mockPreparationPlans: PreparationPlan[] = [
  {
    id: 'p1',
    kitchenId: 'k1',
    date: new Date().toISOString().split('T')[0],
    mealType: 'lunch',
    estimatedPlates: 150,
    actualPlates: 145,
    wastage: 5,
    wastageReason: 'Overcooked',
    status: 'completed',
    recipes: ['r1', 'r2', 'r3']
  },
  {
    id: 'p2',
    kitchenId: 'k1',
    date: new Date().toISOString().split('T')[0],
    mealType: 'dinner',
    estimatedPlates: 120,
    actualPlates: null,
    wastage: null,
    status: 'planned',
    recipes: ['r2', 'r4']
  },
  {
    id: 'p3',
    kitchenId: 'k2',
    date: new Date().toISOString().split('T')[0],
    mealType: 'lunch',
    estimatedPlates: 200,
    actualPlates: 190,
    wastage: 10,
    wastageReason: 'Preparation delay',
    status: 'completed',
    recipes: ['r1', 'r5']
  },
  {
    id: 'p4',
    kitchenId: 'k3',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mealType: 'breakfast',
    estimatedPlates: 100,
    actualPlates: null,
    wastage: null,
    status: 'planned',
    recipes: ['r6', 'r7']
  }
];

// Weekly wastage stats for dashboard
export const mockWeeklyWastage = [
  { day: 'Mon', wastage: 12 },
  { day: 'Tue', wastage: 18 },
  { day: 'Wed', wastage: 8 },
  { day: 'Thu', wastage: 15 },
  { day: 'Fri', wastage: 20 },
  { day: 'Sat', wastage: 10 },
  { day: 'Sun', wastage: 5 }
];

// Kitchen performance stats
export const mockKitchenPerformance = mockKitchens.slice(0, 5).map((kitchen, index) => ({
  kitchenId: kitchen.id,
  kitchenName: kitchen.name,
  efficiency: 85 + (Math.random() * 10 - 5),
  wastagePercentage: 5 + (Math.random() * 5 - 2.5),
  mealsPrepared: 1200 + (index * 50) + Math.floor(Math.random() * 100),
}));
