import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { InventoryItem } from '@/types/kitchen';
import { NewInventoryItem } from '@/types/kitchen';
import { AddItemProps } from '@/types/kitchen';

export const AddItemForm: React.FC<AddItemProps> = ({ onItemAdded }) => {
    const [item, setItem] = useState < NewInventoryItem >
        ({
            name: '',
            category: 'vegetable',
            quantity: 0,
            threshold: 10,
            pricePerUnit:0,
            unit: 'kg',
        });

    const handleChange = (key: keyof typeof item, value: string | number) => {
        setItem({ ...item, [key]: value });
    };

    const handleSubmit = async () => {
        const { error } = await supabase.from('inventory_items').insert([item]);
        if (error) {
            console.error('Error adding item:', error);
        } else {
            onItemAdded(); // Refresh the inventory list
            setItem({ name: '', category: 'vegetable', quantity: 0, threshold: 10, unit: 'kg' ,pricePerUnit:10});
        }
    };

    return (
        <div className="space-y-4">
            <Input placeholder="Item Name" value={item.name} onChange={e => handleChange('name', e.target.value)} />
            <Input type="number" placeholder="Quantity" value={item.quantity} onChange={e => handleChange('quantity', +e.target.value)} />
            <Input type="number" placeholder="Threshold" value={item.threshold} onChange={e => handleChange('threshold', +e.target.value)} />
            <Input placeholder="Unit" value={item.unit} onChange={e => handleChange('unit', e.target.value)} />
            <Input type="number" placeholder="PriceperUnit"  value={item.pricePerUnit} onChange={e => handleChange('pricePerUnit', e.target.value)} />
            <Select value={item.category} onValueChange={val => handleChange('category', val)}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="vegetable">Vegetable</SelectItem>
                    <SelectItem value="meat">Meat</SelectItem>
                    <SelectItem value="grain">Grain</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="spice">Spice</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleSubmit}>Add Item</Button>
        </div>
    );
};

