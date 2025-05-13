import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Plus, Search, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { PreparationPlan } from '@/types/kitchen';

const Preparation: React.FC = () => {
  const [plans, setPlans] = useState<PreparationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [kitchenUser, setKitchenUser] = useState<{ kitchenId: string } | null>(null);

  //const kitchen_id = localStorage.getItem(kitchenUser.kitchenId) ?? '';
  const [newPlan, setNewPlan] = useState({
    kitchen_id: kitchenUser?.kitchenId||'',
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    estimated_plates: 0,
    actual_plates: null,
    wastage: null,
    wastage_reason: '',
    status: 'planned'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('today');

  const currentDate = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase.from('preparation_plans').select('*');
      if (error) {
        console.error('Error fetching plans:', error.message);
      } else {
        setPlans(data || []);
      }
      setLoading(false);
    };
  
    const storedUser = localStorage.getItem('kitchenUser');
    console.log(storedUser);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          setKitchenUser(parsedUser);
          setNewPlan(prev => ({ ...prev, kitchen_id: parsedUser.kitchenId }));
        }
      } catch (e) {
        console.error('Error parsing kitchenUser from localStorage:', e);
      }
    }
    
    
    fetchPlans();
  }, []);
  

  const handleCreatePlan = async () => {
    const { data, error } = await supabase.from('preparation_plans').insert([newPlan]).select();
    if (error) return console.error('Error creating plan:', error.message);
    if (Array.isArray(data)) {
      setPlans(prev => [...prev, ...data]);
    } else if (data) {
      // If a single object was returned (e.g., from an insert), add it directly
      setPlans(prev => [...prev, data]);
    }
    
    setShowModal(false);
    setNewPlan({
      kitchen_id: kitchenUser?.kitchenId||'',
      date: new Date().toISOString().split('T')[0],
      meal_type: 'breakfast',
      estimated_plates: 0,
      actual_plates: null,
      wastage: null,
      wastage_reason: '',
      status: 'planned'
    });
  };

  const filteredPlans = plans.filter(plan => {
    const dateMatches =
      (activeTab === 'today' && plan.date === currentDate) ||
      (activeTab === 'tomorrow' && plan.date === tomorrowDate) ||
      activeTab === 'all';

      const searchMatches =
      (plan.mealType?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (plan.wastageReason?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    return dateMatches && searchMatches;
    
  });

  const getStatusBadge = (status: PreparationPlan['status']) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Planned</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal Preparation</h1>
          <p className="text-muted-foreground">Plan meals and track wastage</p>
        </div>
        <Button className="bg-kitchen-secondary hover:bg-green-600" onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Preparation Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {plans.filter(plan => plan.date === currentDate).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Estimated Plates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {plans.filter(plan => plan.date === currentDate).reduce((sum, plan) => sum + plan.estimatedPlates, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Wastage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-kitchen-danger">
              {plans.filter(plan => plan.date === currentDate && plan.wastage !== null).reduce((sum, plan) => sum + (plan.wastage || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Tabs defaultValue="today" onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:justify-between mb-4">
              <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                <TabsTrigger value="all">All Plans</TabsTrigger>
              </TabsList>
              <div className="relative mt-2 sm:mt-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search plans..."
                  className="pl-8 w-full sm:w-auto"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {['today', 'tomorrow', 'all'].map(tab => (
              <TabsContent value={tab} key={tab}>
                <PreparationTable plans={filteredPlans} />
              </TabsContent>
            ))}
          </Tabs>
        </CardHeader>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Preparation Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kitchen</Label>
              <Input value={newPlan.kitchen_id} onChange={e => setNewPlan({ ...newPlan, kitchen_id: e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={newPlan.date} onChange={e => setNewPlan({ ...newPlan, date: e.target.value })} />
            </div>
            <div>
              <Label>Meal Type</Label>
              <Input value={newPlan.meal_type} onChange={e => setNewPlan({ ...newPlan, meal_type: e.target.value })} />
            </div>
            <div>
              <Label>Estimated Plates</Label>
              <Input type="number" value={newPlan.estimated_plates} onChange={e => setNewPlan({ ...newPlan, estimated_plates: parseInt(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PreparationTable: React.FC<{ plans: PreparationPlan[] }> = ({ plans }) => {
  const getStatusBadge = (status: PreparationPlan['status']) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Planned</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kitchen</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Meal</TableHead>
          <TableHead>Estimated</TableHead>
          <TableHead>Actual</TableHead>
          <TableHead>Wastage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.length ? plans.map(plan => (
          <TableRow key={plan.id}>
            <TableCell>Kitchen {plan.kitchenId?.split('k')[1]}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                {new Date(plan.date).toLocaleDateString()}
              </div>
            </TableCell>
            <TableCell className="capitalize">{plan.mealType}</TableCell>
            <TableCell>{plan.estimatedPlates}</TableCell>
            <TableCell>{plan.actualPlates ?? '-'}</TableCell>
            <TableCell>
              {plan.wastage !== null ? (
                <div>
                  <span className={plan.wastage > 10 ? 'text-red-600 font-medium' : ''}>{plan.wastage}</span>
                  {plan.wastageReason && <div className="text-xs text-muted-foreground">"{plan.wastageReason}"</div>}
                </div>
              ) : '-'}
            </TableCell>
            <TableCell>{getStatusBadge(plan.status)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-4">
              No preparation plans found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default Preparation;