
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  kitchenId?: string;
}

export enum UserRole {
  ADMIN = "admin",
  CHEF = "chef",
  CUTTER = "cutter",
  SUPERVISOR = "supervisor",
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  registerBiometrics: () => Promise<boolean>;
  hasBiometricCredential: boolean;
}

export interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'chef' | 'cutter' | 'supervisor';
  kitchen_id?: string | null;
}