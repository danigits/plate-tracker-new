
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChefHat } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
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

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <ChefHat className="mx-auto h-16 w-16 text-kitchen-secondary" />
        <h1 className="mt-4 text-3xl font-bold">Kitchen Manager</h1>
        <p className="mt-2 text-gray-500">Sign in to your account</p>
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
