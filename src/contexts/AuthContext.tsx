
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthContextType,Profile } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';


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
  const [hasBiometricCredential, setHasBiometricCredential] = useState(false);

  // Check for stored user and biometric capability on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('kitchenUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('kitchenUser');
      }
    }
    
    // Check if WebAuthn (biometrics) is available
    checkBiometricAvailability();
  }, []);

  // Check if biometric authentication is available
  const checkBiometricAvailability = async () => {
    // Check if the browser supports WebAuthn
    if (window.PublicKeyCredential) {
      try {
        // Check if user has registered biometrics before
        const hasCredential = localStorage.getItem('biometric_credential_id');
        setHasBiometricCredential(!!hasCredential);
      } catch (error) {
        console.error('Error checking biometric availability:', error);
        setHasBiometricCredential(false);
      }
    } else {
      console.log('WebAuthn is not supported by this browser');
      setHasBiometricCredential(false);
    }
  };

  // const login = async (email: string, password: string) => {
  //   setIsLoading(true);
    
  //   // Simulate API call
  //   return new Promise<void>((resolve, reject) => {
  //     setTimeout(() => {
  //       const foundUser = mockUsers.find(
  //         (u) => u.email === email && u.password === password
  //       );
        
  //       if (foundUser) {
  //         // Remove password before storing user
  //         const { password, ...userWithoutPassword } = foundUser;
  //         setUser(userWithoutPassword);
  //         localStorage.setItem('kitchenUser', JSON.stringify(userWithoutPassword));
  //         setIsLoading(false);
  //         resolve();
  //       } else {
  //         setIsLoading(false);
  //         reject(new Error('Invalid email or password'));
  //       }
  //     }, 1000);
  //   });
  // };

  // const signup=async(email: string, password: string)=>{
  //   setIsLoading(true);
  //   const { data, error } = await supabase.auth.admin.createUser({
  //     email: 'test@kitchen.com',
  //     password: 'test1234',
  //     email_confirm: true // optional: skips email confirmation
  //   });
    
  // }

  const login = async (email: string, password: string) => {
    setIsLoading(true);
  
   
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
  
    if (error || !data?.session || !data?.user) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
  
    // Fetch user profile from the profiles table
    const { data: profile, error: profileError } = await supabase
  .from<Profile>('profiles')
  .select('*')  // Select all columns
  .eq('id', data.user.id)  // Filter by user id
  .single();  // Get a single result

if (profileError || !profile) {
  setIsLoading(false);
  throw new Error('Failed to load user profile');
}

  
    // Combine user data from Supabase Auth and profiles
    const userData: User = {
      id: data.user.id,
      email: data.user.email!,
      name: profile.name,
      role: profile.role as UserRole,
      kitchenId: profile.kitchen_id ?? undefined,
    };
  
    // Update state and localStorage
    setUser(userData);
    localStorage.setItem('kitchenUser', JSON.stringify(userData));
  
    setIsLoading(false);
  };
  

  const registerBiometrics = async (): Promise<boolean> => {
    if (!user) {
      console.error('User must be logged in to register biometrics');
      return false;
    }
    
    try {
      // In a real implementation, we would create a credential on the server
      // and register it with the browser
      
      // For demo purposes, we'll just store a flag in localStorage
      const demoCredentialId = btoa(user.email);
      localStorage.setItem('biometric_credential_id', demoCredentialId);
      localStorage.setItem('biometric_user_email', user.email);
      
      setHasBiometricCredential(true);
      return true;
    } catch (error) {
      console.error('Error registering biometrics:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('kitchenUser');
  };
  const loginWithBiometrics = async () => {
    setIsLoading(true);
  
    try {
      // Check if biometric credentials exist
      const credentialId = localStorage.getItem('biometric_credential_id');
      if (!credentialId) {
        throw new Error('No biometric credentials found');
      }
  
      // For demo purposes: Here you'd usually interact with the WebAuthn API to get the user's credentials
      // We'll simulate the biometric login process.
      // You would create a real WebAuthn authentication process instead of this mock
      const demoCredentialId = localStorage.getItem('biometric_credential_id')!;
      
      if (demoCredentialId) {
        // Simulate a login if credential is found
        const userData = JSON.parse(localStorage.getItem('kitchenUser') || '{}');
        if (!userData) throw new Error('User not found');
        
        setUser(userData);
        setIsLoading(false);
        return;
      }
  
      throw new Error('Biometric authentication failed');
    } catch (error) {
      console.error('Error during biometric login:', error);
      setIsLoading(false);
      throw new Error('Failed to login with biometrics');
    }
  };
  
  
  return (
    <AuthContext.Provider value={{ 
      
      user, 
      login, 
      logout, 
      isLoading,
      loginWithBiometrics,
      registerBiometrics,
      hasBiometricCredential
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

