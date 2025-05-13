import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CHEF);
  const [kitchenId, setKitchenId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error || !data?.user) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error?.message || 'Could not create account.'
      });
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    // Save to profiles table
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: userId,
        email,
        name,
        role,
        kitchen_id: kitchenId || null
      }
    ]);

    if (profileError) {
      toast({
        variant: 'destructive',
        title: 'Profile creation failed',
        description: profileError.message
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Signup successful',
      description: 'Please check your email to confirm your account.'
    });

    setLoading(false);
    navigate('/login');
  };

  return (
    <form className="space-y-4 max-w-md mx-auto" onSubmit={handleSignup}>
      <h2 className="text-2xl font-bold text-center">Sign Up</h2>

      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full border rounded px-3 py-2"
        >
          <option value={UserRole.ADMIN}>Admin</option>
          <option value={UserRole.CHEF}>Chef</option>
          <option value={UserRole.CUTTER}>Cutter</option>
          <option value={UserRole.SUPERVISOR}>Supervisor</option>
        </select>
      </div>

      {(role === UserRole.CHEF || role === UserRole.CUTTER ||role === UserRole.SUPERVISOR) && (
        <div>
          <Label htmlFor="kitchenId">Kitchen ID</Label>
          <Input id="kitchenId" value={kitchenId} onChange={(e) => setKitchenId(e.target.value)} required />
        </div>
      )}

      <Button type="submit" className="w-full bg-kitchen-secondary hover:bg-green-600" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </Button>
    </form>
  );
};

export default SignupForm;
