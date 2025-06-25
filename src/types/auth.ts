
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  kitchenId?: string;
  profile?:Profile;
}

export enum UserRole {
  ADMIN = "admin",
  CHEF = "chef",
  CUTTER = "cutter",
  SUPERVISOR = "supervisor",
  DELIVERY="delivery",
  INVENTORY = "INVENTORY",
  SUPERADMIN = "SUPERADMIN"
}




// In your types/auth.ts or where you define AuthContextType
export interface AuthContextType {
  user: User | null;
  profile: Profile | null;  // Make this required since you're using it
  isLoading: boolean;
  hasBiometricCredential: boolean;
  isDelivery: boolean;
  deliveryPointId: string | undefined;
  kitchenId: string | undefined;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  registerBiometrics: () => Promise<boolean>;
}

export interface Profile {
  delivery_point_id?: string | null;
  id: string;
  name: string;
  role: 'admin' | 'chef' | 'cutter' | 'supervisor'| 'delivery';
  kitchen_id?: string | null;
}