import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Ingredient } from "@/types/kitchen";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

const UNITS = ["g", "kg", "ml", "L", "piece", "cup", "tbsp", "tsp"];

const IngredientManager: React.FC = () => {
  // State management
  const [state, setState] = useState({
    ingredients: [] as Ingredient[],
    newIngredient: { name: "", unit: "", price: "", image_url: "" },
    editIngredient: null as Ingredient | null,
    searchTerm: "",
    error: null as string | null,
    isLoading: false,
    isEditDialogOpen: false,
    isDeleteDialogOpen: false,
    selectedIngredientId: null as string | null,
  });

  // Derived state
  const filteredIngredients = useMemo(
    () =>
      state.ingredients.filter((ing) =>
        ing.name.toLowerCase().includes(state.searchTerm.toLowerCase())
      ),
    [state.ingredients, state.searchTerm]
  );

  // Data fetching
  const fetchIngredients = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name");

      if (error) throw error;
      setState((prev) => ({ ...prev, ingredients: data || [] }));
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }));
      toast({
        variant: "destructive",
        title: "Error fetching ingredients",
        description: err.message,
      });
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Handlers
  const handleInputChange = (field: keyof Ingredient, value: string) => {
    setState((prev) => ({
      ...prev,
      newIngredient: { ...prev.newIngredient, [field]: value },
    }));
  };

  const handleEditInputChange = (field: keyof Ingredient, value: string) => {
    setState((prev) => ({
      ...prev,
      editIngredient: prev.editIngredient
        ? { ...prev.editIngredient, [field]: value }
        : null,
    }));
  };

  const handleAddIngredient = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Validate
      if (!state.newIngredient.name.trim()) throw new Error("Name is required");
      if (!state.newIngredient.unit.trim()) throw new Error("Unit is required");
      if (
        state.newIngredient.price &&
        isNaN(Number(state.newIngredient.price))
      ) {
        throw new Error("Price must be a number");
      }

      const { error } = await supabase
        .from("ingredients")
        .insert([state.newIngredient]);

      if (error) throw error;

      toast({
        title: "Ingredient added",
        description: `${state.newIngredient.name} was added successfully`,
      });

      await fetchIngredients();
      setState((prev) => ({
        ...prev,
        newIngredient: { name: "", unit: "", price: "", image_url: "" },
      }));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error adding ingredient",
        description: err.message,
      });
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleUpdateIngredient = async () => {
    if (!state.editIngredient) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      console.log("Clicked Save — editIngredient:", state.editIngredient);

      const { name, unit, price, id } = state.editIngredient;

      if (!name.trim()) throw new Error("Name is required");
      if (!unit.trim()) throw new Error("Unit is required");
      if (!id) throw new Error("Invalid ingredient ID");
      if (
        price !== undefined &&
        price !== null &&
        price !== "" &&
        isNaN(Number(price))
      ) {
        throw new Error("Price must be a number");
      }

      const updatedIngredient = {
        ...state.editIngredient,
        name: name.trim(),
        unit: unit.trim(),
        price: price !== "" ? Number(price) : null,
      };
      const { error, status } = await supabase
        .from("ingredients")
        .update(updatedIngredient)
        .eq("id", updatedIngredient.id);

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Supabase error [${status}]: ${error.message}`);
      }

      // const { error } = await supabase
      //   .from("ingredients")
      //   .update(updatedIngredient)
      //   .eq("id", id);

      // if (error) throw error;

      toast({
        title: "Ingredient updated",
        description: `${updatedIngredient.name} was updated successfully`,
      });

      await fetchIngredients();
      setState((prev) => ({
        ...prev,
        editIngredient: null,
        isEditDialogOpen: false,
      }));
    } catch (err) {
      console.error("Error updating ingredient", err);
      toast({
        variant: "destructive",
        title: "Error updating ingredient",
        description: err.message,
      });
    } finally {
      console.log("Finishing Save — resetting loading");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteIngredient = async () => {
    if (!state.selectedIngredientId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { error } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", state.selectedIngredientId);

      if (error) throw error;

      toast({
        title: "Ingredient deleted",
        description: "The ingredient was removed successfully",
      });

      await fetchIngredients();
      setState((prev) => ({
        ...prev,
        selectedIngredientId: null,
        isDeleteDialogOpen: false,
      }));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error deleting ingredient",
        description: err.message,
      });
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price));
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Manage Ingredients</h2>

      {/* Add Ingredient Form */}
      <div className="bg-card p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Add New Ingredient</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Flour"
              value={state.newIngredient.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              value={state.newIngredient.unit}
              onValueChange={(value) => handleInputChange("unit", value)}
            >
              <SelectTrigger>
                {state.newIngredient.unit || "Select unit"}
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (optional)</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              value={state.newIngredient.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image URL (optional)</Label>
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={state.newIngredient.image_url}
              onChange={(e) => handleInputChange("image_url", e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleAddIngredient} disabled={state.isLoading}>
            {state.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Add Ingredient
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-card p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Ingredients</Label>
            <Input
              id="search"
              placeholder="Search by name..."
              value={state.searchTerm}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={fetchIngredients}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    {ingredient.image_url ? (
                      <img
                        src={ingredient.image_url}
                        alt={ingredient.name}
                        className="w-12 h-12 rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          No image
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ingredient.name}
                  </TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell>{formatPrice(ingredient.price)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog
                      open={
                        state.isEditDialogOpen &&
                        state.editIngredient?.id === ingredient.id
                      }
                      onOpenChange={(open) => {
                        if (open) {
                          setState((prev) => ({
                            ...prev,
                            editIngredient: ingredient,
                            isEditDialogOpen: true,
                          }));
                        } else {
                          setState((prev) => ({
                            ...prev,
                            editIngredient: null,
                            isEditDialogOpen: false,
                          }));
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Ingredient</DialogTitle>
                          <DialogDescription>
                            Update the details of {ingredient.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                              id="edit-name"
                              value={state.editIngredient?.name || ""}
                              onChange={(e) =>
                                handleEditInputChange("name", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-unit">Unit</Label>
                            <Select
                              value={state.editIngredient?.unit || ""}
                              onValueChange={(value) =>
                                handleEditInputChange("unit", value)
                              }
                            >
                              <SelectTrigger>
                                {state.editIngredient?.unit || "Select unit"}
                              </SelectTrigger>
                              <SelectContent>
                                {UNITS.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-price">Price</Label>
                            <Input
                              id="edit-price"
                              type="number"
                              value={state.editIngredient?.price || ""}
                              onChange={(e) =>
                                handleEditInputChange("price", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-image">Image URL</Label>
                            <Input
                              id="edit-image"
                              type="url"
                              value={state.editIngredient?.image_url || ""}
                              onChange={(e) =>
                                handleEditInputChange(
                                  "image_url",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleUpdateIngredient}
                            disabled={state.isLoading}
                          >
                            {state.isLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog
                      open={
                        state.isDeleteDialogOpen &&
                        state.selectedIngredientId === ingredient.id
                      }
                      onOpenChange={(open) => {
                        setState((prev) => ({
                          ...prev,
                          selectedIngredientId: open ? ingredient.id : null,
                          isDeleteDialogOpen: open,
                        }));
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the {ingredient.name} ingredient.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteIngredient}
                            disabled={state.isLoading}
                          >
                            {state.isLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {state.searchTerm
                    ? "No matching ingredients found"
                    : "No ingredients available"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IngredientManager;
