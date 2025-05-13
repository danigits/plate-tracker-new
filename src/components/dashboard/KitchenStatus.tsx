
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
//import { mockKitchens } from '@/data/mockData';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust if needed


const KitchenStatus: React.FC = () => {
  const [newKitchen, setNewKitchen] = useState({
    name: '',
    location: '',
    status: 'active',
  });
  const [kitchens, setKitchens] = useState<any[]>([]); // holds kitchens from Supabase
  useEffect(() => {
    const fetchKitchens = async () => {
      const { data, error } = await supabase
        .from('kitchens')
        .select('*')
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching kitchens:', error);
      } else {
        setKitchens(data);
      }
    };
  
    fetchKitchens();
  }, []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
// Get current items
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Filter kitchens based on search term
  const filteredKitchens = kitchens.filter(kitchen =>
    kitchen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kitchen.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const currentKitchens = filteredKitchens.slice(indexOfFirstItem, indexOfLastItem);

const totalPages = Math.ceil(filteredKitchens.length / itemsPerPage);
  

  
  
  
  

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Kitchen Status Overview</CardTitle>
        <CardDescription>Monitor the status of all 40 kitchens</CardDescription>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search kitchens..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
      <div className="mb-6 space-y-4">
  <div className="flex gap-4">
    <Input
      placeholder="Kitchen Name"
      value={newKitchen.name}
      onChange={(e) => setNewKitchen({ ...newKitchen, name: e.target.value })}
    />
    <Input
      placeholder="Location"
      value={newKitchen.location}
      onChange={(e) => setNewKitchen({ ...newKitchen, location: e.target.value })}
    />
    <select
      className="border rounded px-3 py-2 text-sm"
      value={newKitchen.status}
      onChange={(e) => setNewKitchen({ ...newKitchen, status: e.target.value })}
    >
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
      <option value="maintenance">Maintenance</option>
    </select>
    <Button
      onClick={async () => {
        if (!newKitchen.name || !newKitchen.location) return;
      
        const newEntry = {
          ...newKitchen,
         // lastUpdated: new Date().toISOString(),
        };
      
        const { error } = await supabase.from('kitchens').insert([newEntry]);
      
        if (error) {
          console.error('Error inserting kitchen:', error);
          return;
        }
      
        // Refetch kitchens after insert
        const { data, error: fetchError } = await supabase
          .from('kitchens')
          .select('*')
          .order('created_at', { ascending: false });
      
        if (!fetchError) {
          setKitchens(data);
          setNewKitchen({ name: '', location: '', status: 'active' });
          setCurrentPage(1);
        }
      }}
    >
      Add
    </Button>
  </div>
</div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kitchen</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentKitchens.map((kitchen) => (
              <TableRow key={kitchen.id}>
                <TableCell className="font-medium">{kitchen.name}</TableCell>
                <TableCell>{kitchen.location}</TableCell>
                <TableCell>
                  {kitchen.status === 'active' ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Active
                    </Badge>
                  ) : kitchen.status === 'inactive' ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                      Inactive
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      Maintenance
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatDate(kitchen.created_at)}</TableCell>
              </TableRow>
            ))}
            {currentKitchens.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No kitchens found matching '{searchTerm}'
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredKitchens.length)} of {filteredKitchens.length}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default KitchenStatus;
