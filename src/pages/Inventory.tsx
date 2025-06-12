import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

//import { mockInventory } from '@/data/mockData';
import { InventoryItem } from "@/types/kitchen";
import { supabase } from "@/integrations/supabase/client";
import { AddItemForm } from "@/components/dashboard/AddItemForm";

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*");

      if (error) {
        console.error("Error fetching inventory:", error);
      } else {
        setInventory(data);
      }
      setLoading(false);
    };

    fetchInventory();
  }, []);

  // Filter inventory items
  const filteredItems = inventory.filter(
    (item) =>
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter === "all" || item.category === categoryFilter)
  );

  const updateItem = async (updatedItem: InventoryItem) => {
    const { error } = await supabase
      .from("inventory_items")
      .update({
        name: updatedItem.name,
        category: updatedItem.category,
        quantity: updatedItem.quantity,
        threshold: updatedItem.threshold,
        unit: updatedItem.unit,
        unit: updatedItem.pricePerUnit,
      })
      .eq("id", updatedItem.id);
    if (error) {
      console.error("Update error:", error);
    } else {
      console.log("Item updated!");
      // You can re-fetch items or call a refresh callback here
      fetchInventory;
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("inventory_items").select("*");

    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setInventory(data);
    }
    setLoading(false);
  };

  // Calculate stock status
  const getStockStatus = (item: InventoryItem) => {
    const ratio = item.quantity / item.threshold;
    if (ratio <= 1) return "low";
    if (ratio <= 2) return "medium";
    return "good";
  };

  const totalStockValue = inventory.reduce(
    (sum, item) => sum + item.quantity * (priceMap[item.id] ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            Track and manage your kitchen inventory
          </p>
        </div>
        {/* <Button className="bg-kitchen-secondary hover:bg-green-600" onClick={AddItemForm}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button> */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-kitchen-secondary hover:bg-green-600">
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <AddItemForm onItemAdded={fetchInventory} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {
                inventory.filter((item) => getStockStatus(item) === "low")
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalStockValue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search items..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vegetable">Vegetables</SelectItem>
                <SelectItem value="meat">Meat</SelectItem>
                <SelectItem value="grain">Grains</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
                <SelectItem value="spice">Spices</SelectItem>
                <SelectItem value="other">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        {/* <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                { <TableHead>Rate</TableHead> #not needed
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            {loading ? (
              <p>Loading inventory...</p>
            ) : (
              <TableBody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        # not needed
                        <div className="flex items-center space-x-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-10 w-10 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center bg-muted rounded border">
                              <Package className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <span>{item.name}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center">
                          <div className="mr-2 bg-muted p-2 rounded-md">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-10 w-10 rounded object-cover border"
                              />
                            ) : (
                              <div className="h-10 w-10 flex items-center justify-center bg-muted rounded border">
                                <Package className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {item.category}
                      </TableCell>
                      <TableCell>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        #not needed
                        {item.pricePerUnit} {"INR"}
                      </TableCell>
                      <TableCell>
                        {item.threshold} {item.unit}
                      </TableCell>
                      <TableCell>
                        {stockStatus === "low" ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800 border-red-200"
                          >
                            Low Stock
                          </Badge>
                        ) : stockStatus === "medium" ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 border-amber-200"
                          >
                            Medium
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            Good
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItem(item)}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No items found matching your search
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </CardContent> */}
        <CardContent>
          {loading ? (
            <p>Loading inventory...</p>
          ) : (
            <>
              {filteredItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No items found matching your search
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item);

                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-background"
                      >
                        <div className="p-4 flex flex-col h-full">
                          {/* Image */}
                          <div className="w-full h-40 mb-3 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-full object-contain"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <h3 className="text-lg font-semibold mb-1">
                            {item.name}
                          </h3>

                          {/* Category */}
                          <p className="text-sm text-muted-foreground capitalize mb-1">
                            {item.category}
                          </p>

                          {/* Quantity */}
                          <p className="text-sm mb-1">
                            <strong>Quantity:</strong> {item.quantity}{" "}
                            {item.unit}
                          </p>

                          {/* Threshold */}
                          <p className="text-sm mb-1">
                            <strong>Threshold:</strong> {item.threshold}{" "}
                            {item.unit}
                          </p>

                          {/* Status */}
                          <div className="mb-2">
                            {stockStatus === "low" ? (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                Low Stock
                              </Badge>
                            ) : stockStatus === "medium" ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                Medium
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Good
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-auto pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItem(item)}
                              className="w-full"
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
