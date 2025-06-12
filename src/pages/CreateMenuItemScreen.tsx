import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash, Pencil } from "lucide-react";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
};

type AddedIngredient = {
  ingredient_id: string;
  name: string;
  unit: string;
  perServingQty: number;
};

type Category = {
  id: string;
  name: string;
};

const CreateMenuItemScreen = () => {
  const { toast } = useToast();

  const [menuItemName, setMenuItemName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [perServingQty, setPerServingQty] = useState("");
  const [addedIngredients, setAddedIngredients] = useState<AddedIngredient[]>(
    []
  );
  const [editMode, setEditMode] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { data: ingredients, error: ingError },
          { data: categories, error: catError },
        ] = await Promise.all([
          supabase.from("ingredients").select("*"),
          supabase.from("menu_categories").select("*"), // Use consistent table
        ]);

        if (ingError) {
          toast({
            title: "Error fetching ingredients",
            description: ingError.message,
          });
        } else {
          setIngredients(ingredients || []);
        }

        if (catError) {
          toast({
            title: "Error fetching categories",
            description: catError.message,
          });
        } else {
          setCategories(categories || []);
          if (categories && categories.length > 0) {
            setCategoryId(categories[0].id); // Set default category
          }
        }
      } catch (err) {
        toast({
          title: "Unexpected error",
          description: String(err),
        });
      }
    };

    fetchData();
  }, []);

  const handleAddOrUpdateIngredient = () => {
    if (!selectedIngredientId || !perServingQty) return;

    const existing = addedIngredients.find(
      (i) => i.ingredient_id === selectedIngredientId
    );

    const ingredient = ingredients.find((i) => i.id === selectedIngredientId);
    if (!ingredient) return;

    if (editMode && existing) {
      setAddedIngredients((prev) =>
        prev.map((i) =>
          i.ingredient_id === selectedIngredientId
            ? { ...i, perServingQty: parseFloat(perServingQty) }
            : i
        )
      );
      setEditMode(null);
    } else if (!existing) {
      setAddedIngredients((prev) => [
        ...prev,
        {
          ingredient_id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          perServingQty: parseFloat(perServingQty),
        },
      ]);
    } else {
      toast({ title: "Ingredient already exists. Use edit instead." });
    }

    setSelectedIngredientId("");
    setPerServingQty("");
  };

  const handleEdit = (id: string) => {
    const ing = addedIngredients.find((i) => i.ingredient_id === id);
    if (ing) {
      setSelectedIngredientId(ing.ingredient_id);
      setPerServingQty(ing.perServingQty.toString());
      setEditMode(id);
    }
  };

  const handleDelete = (id: string) => {
    setAddedIngredients((prev) => prev.filter((i) => i.ingredient_id !== id));
  };

  const handleSubmit = async () => {
    if (!menuItemName || addedIngredients.length === 0 || !categoryId) {
      toast({
        title: "Missing fields",
        description: "Name, category, and ingredients are required.",
      });
      return;
    }

    try {
      const { data: menuItem, error: itemError } = await supabase
        .from("menu_items")
        .insert({
          name: menuItemName,
          category_id: categoryId,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      const ingredientData = addedIngredients.map((ing) => ({
        menu_item_id: menuItem.id,
        ingredient_id: ing.ingredient_id,
        per_serving_qty: ing.perServingQty,
        required_qty: 0,
        final_used_qty: 0,
      }));

      const { error: ingError } = await supabase
        .from("menu_item_ingredients")
        .insert(ingredientData);

      if (ingError) throw ingError;

      toast({ title: "Success", description: "Menu item created!" });
      setMenuItemName("");
      setAddedIngredients([]);
      setSelectedIngredientId("");
      setPerServingQty("");
      setCategoryId(categories[0]?.id || "");
    } catch (error: any) {
      toast({
        title: "Error creating menu item",
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Create Menu Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Enter menu item name"
          value={menuItemName}
          onChange={(e) => setMenuItemName(e.target.value)}
        />

        {categories.length > 0 && (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Meal Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Select
            value={selectedIngredientId}
            onValueChange={setSelectedIngredientId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Ingredient" />
            </SelectTrigger>
            <SelectContent>
              {ingredients.map((ing) => (
                <SelectItem key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Per serving quantity"
            value={perServingQty}
            onChange={(e) => setPerServingQty(e.target.value)}
            type="number"
          />

          <Button onClick={handleAddOrUpdateIngredient}>
            {editMode ? "Update" : "Add"}
          </Button>
        </div>

        {addedIngredients.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Qty/Serve</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addedIngredients.map((ing) => (
                <TableRow key={ing.ingredient_id}>
                  <TableCell>{ing.name}</TableCell>
                  <TableCell>{ing.perServingQty}</TableCell>
                  <TableCell>{ing.unit}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(ing.ingredient_id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(ing.ingredient_id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Button onClick={handleSubmit} className="w-full">
          Save Menu Item
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateMenuItemScreen;
