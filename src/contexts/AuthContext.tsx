import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { User, UserRole, AuthContextType, Profile } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasBiometricCredential, setHasBiometricCredential] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      // Check for existing session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session check error:", error);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        await handleAuthenticatedUser(session.user);
      }

      setIsLoading(false);
    };

    initializeAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await handleAuthenticatedUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        localStorage.removeItem("kitchenUser");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthenticatedUser = async (user: any) => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const userData: User = {
        id: user.id,
        email: user.email!,
        name: profile.name,
        role: profile.role as UserRole,
        kitchenId: profile.kitchen_id ?? undefined,
        delivery_point_id: profile.delivery_point_id ?? undefined,
      };

      setUser(userData);
      setProfile(profile);
      localStorage.setItem("kitchenUser", JSON.stringify(userData));

      // Check biometric credentials
      checkBiometricAvailability();
    } catch (error) {
      console.error("Error handling authenticated user:", error);
      await supabase.auth.signOut();
    }
  };

  const checkBiometricAvailability = async () => {
    if (window.PublicKeyCredential) {
      try {
        const hasCredential = localStorage.getItem("biometric_credential_id");
        setHasBiometricCredential(!!hasCredential);
      } catch (error) {
        console.error("Error checking biometric availability:", error);
        setHasBiometricCredential(false);
      }
    }
  };

  // const login = async (email: string, password: string): Promise<User> => {
  //   setIsLoading(true);
  //   try {
  //     const { data, error } = await supabase.auth.signInWithPassword({
  //       email,
  //       password,
  //     });

  //     if (error || !data?.session || !data?.user) {
  //       throw new Error(error?.message || "Invalid email or password");
  //     }

  //     return data.user as unknown as User;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.session || !data?.user) {
        throw new Error(error?.message || "Invalid email or password");
      }

      // Fetch and return the complete user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      const userData: User = {
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || "",
        role: profile?.role as UserRole,
        kitchenId: profile?.kitchen_id,
        delivery_point_id: profile?.delivery_point_id,
      };

      setUser(userData);
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const isDelivery = useMemo(() => {
    return profile?.role === "delivery"; // Make sure this matches your actual role value
  }, [profile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.removeItem("kitchenUser");
  };

  const registerBiometrics = async (): Promise<boolean> => {
    if (!user) {
      throw new Error("User must be logged in to register biometrics");
    }

    try {
      const demoCredentialId = btoa(user.email);
      localStorage.setItem("biometric_credential_id", demoCredentialId);
      localStorage.setItem("biometric_user_email", user.email);
      setHasBiometricCredential(true);
      return true;
    } catch (error) {
      console.error("Error registering biometrics:", error);
      return false;
    }
  };

  const loginWithBiometrics = async () => {
    setIsLoading(true);
    try {
      const credentialId = localStorage.getItem("biometric_credential_id");
      if (!credentialId) {
        throw new Error("No biometric credentials found");
      }

      const userData = JSON.parse(localStorage.getItem("kitchenUser") || "{}");
      if (!userData) throw new Error("User not found");

      setUser(userData);
    } catch (error) {
      console.error("Error during biometric login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      hasBiometricCredential,
      isDelivery: profile?.role === UserRole.DELIVERY,
      deliveryPointId: profile?.delivery_point_id,
      kitchenId: profile?.kitchen_id,
      login,
      logout,
      loginWithBiometrics,
      registerBiometrics,
    }),
    [user, profile, isLoading, hasBiometricCredential]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
