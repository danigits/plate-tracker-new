
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AuthContextType } from '@/types/auth';

// Mock users for demo purposes
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@kitchen.com',
    password: 'admin123',
    role: UserRole.ADMIN
  },
  {
    id: '2',
    name: 'Chef John',
    email: 'chef@kitchen.com',
    password: 'chef123',
    role: UserRole.CHEF,
    kitchenId: 'k1'
  },
  {
    id: '3',
    name: 'Cutter Smith',
    email: 'cutter@kitchen.com',
    password: 'cutter123',
    role: UserRole.CUTTER,
    kitchenId: 'k1'
  },
  {
    id: '4',
    name: 'Supervisor Jane',
    email: 'supervisor@kitchen.com',
    password: 'super123',
    role: UserRole.SUPERVISOR
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for stored user on initial load
  React.useEffect(() => {
    const storedUser = localStorage.getItem('kitchenUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('kitchenUser');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const foundUser = mockUsers.find(
          (u) => u.email === email && u.password === password
        );
        
        if (foundUser) {
          // Remove password before storing user
          const { password, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem('kitchenUser', JSON.stringify(userWithoutPassword));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kitchenUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
