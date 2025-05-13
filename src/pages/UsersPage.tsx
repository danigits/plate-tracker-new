import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/types/auth';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchKitchens();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setUsers(data);
  };

  const fetchKitchens = async () => {
    const { data } = await supabase.from('kitchens').select('id, name');
    setKitchens(data || []);
  };

  const updateUser = async (id: string, updates: any) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: 'User updated successfully' });
      fetchUsers();
    }
  };

  const setPassword = async (email: string, newPassword: string) => {
    const { error } = await supabase.auth.admin.updateUserByEmail(email, {
      password: newPassword
    });

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Password Set', description: `Password updated for ${email}` });
  };

  const sendResetLink = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Link Sent', description: `Reset link sent to ${email}` });
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">User Management</h2>
      {users.map((user) => (
        <div key={user.id} className="p-3 border rounded space-y-2">
          <p><strong>{user.name}</strong> ({user.name})</p>

          <div className="flex gap-2">
            <select
              value={user.role}
              onChange={(e) => updateUser(user.id, { role: e.target.value })}
              className="border rounded p-1"
            >
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={user.kitchen_id || ''}
              onChange={(e) => updateUser(user.id, { kitchen_id: e.target.value })}
              className="border rounded p-1"
            >
              <option value="">Select Kitchen</option>
              {kitchens.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => {
              const newPassword = prompt('Enter new password:');
              if (newPassword) setPassword(user.email, newPassword);
            }}>
              Set Password
            </Button>

            <Button variant="outline" onClick={() => sendResetLink(user.email)}>
              Send Reset Link
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
