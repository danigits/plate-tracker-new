
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChefHat, Fingerprint, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisteringBiometrics, setIsRegisteringBiometrics] = useState(false);
  const { login, isLoading, loginWithBiometrics, registerBiometrics, hasBiometricCredential, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
      });
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await loginWithBiometrics();
      toast({
        title: "Biometric login successful",
        description: "Welcome back!",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Biometric login failed",
        description: "Could not authenticate with biometrics. Please try again or use password.",
      });
    }
  };

  const handleRegisterBiometrics = async () => {
    setIsRegisteringBiometrics(true);
    try {
      const success = await registerBiometrics();
      if (success) {
        toast({
          title: "Biometrics registered",
          description: "You can now use biometric authentication to log in.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: "Could not register biometrics. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "Error registering biometrics.",
      });
    } finally {
      setIsRegisteringBiometrics(false);
    }
  };

  const isBiometricsAvailable = window.PublicKeyCredential !== undefined;

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <ChefHat className="mx-auto h-16 w-16 text-kitchen-secondary" />
        <h1 className="mt-4 text-3xl font-bold">Kitchen Manager</h1>
        <p className="mt-2 text-gray-500">Sign in to your account</p>
      </div>
      
      {hasBiometricCredential && (
        <div className="flex justify-center">
          <Button 
            onClick={handleBiometricLogin} 
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            <Fingerprint className="mr-2" />
            <span>Sign in with Biometrics</span>
          </Button>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-100 text-gray-500">
            Or continue with email
          </span>
        </div>
      </div>
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="admin@kitchen.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button type="submit" className="w-full bg-kitchen-secondary hover:bg-green-600" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        {isBiometricsAvailable && user && !hasBiometricCredential && (
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="w-full" disabled={isLoading}>
                <Shield className="mr-2 h-4 w-4" /> Set up biometric login
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Register Biometric Authentication</DialogTitle>
                <DialogDescription>
                  Set up biometric authentication to log in with your fingerprint or face ID in the future.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center py-6">
                <Fingerprint className="h-16 w-16 text-blue-500" />
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleRegisterBiometrics} 
                  disabled={isRegisteringBiometrics}
                  className="w-full"
                >
                  {isRegisteringBiometrics ? "Registering..." : "Register Biometrics"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </form>

      <div className="text-center text-sm text-gray-500">
        <p>For demo purposes, use these credentials:</p>
        <ul className="mt-2 space-y-1">
          <li>Admin: admin@kitchen.com / admin123</li>
          <li>Chef: chef@kitchen.com / chef123</li>
          <li>Cutter: cutter@kitchen.com / cutter123</li>
          <li>Supervisor: supervisor@kitchen.com / super123</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginForm;
