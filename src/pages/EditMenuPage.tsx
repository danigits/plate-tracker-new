import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/components/ui/use-toast";
import { Trash, Pencil } from "lucide-react";

type Ingredient = { id: string; name: string; unit: string };
type Category = { id: string; name: string };
type AddedIngredient = {
  ingredient_id: string;
  name: string;
  unit: string;
  perServingQty: number;
};

const EditMenuPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [menuItemName, setMenuItemName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [perServingQty, setPerServingQty] = useState("");
  const [addedIngredients, setAddedIngredients] = useState<AddedIngredient[]>(
    []
  );
  const [editMode, setEditMode] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: menuItem }, { data: ingList }, { data: catList }] =
        await Promise.all([
          supabase.from("menu_items").select("*").eq("id", id).single(),
          supabase.from("ingredients").select("*"),
          supabase.from("menu_categories").select("*"),
        ]);

      if (!menuItem) {
        toast({ title: "Error", description: "Menu item not found" });
        navigate("/menu");
        return;
      }

      const { data: menuIngredients } = await supabase
        .from("menu_item_ingredients")
        .select("ingredient_id, per_serving_qty, ingredients(name, unit)")
        .eq("menu_item_id", id);

      setMenuItemName(menuItem.name);
      setCategoryId(menuItem.category_id);
      setIngredients(ingList || []);
      setCategories(catList || []);

      if (menuIngredients) {
        setAddedIngredients(
          menuIngredients.map((m) => ({
            ingredient_id: m.ingredient_id,
            perServingQty: m.per_serving_qty,
            name: m.ingredients.name,
            unit: m.ingredients.unit,
          }))
        );
      }
    };

    fetchData();
  }, [id]);

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
    if (!menuItemName || !categoryId || addedIngredients.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please fill all details.",
      });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({ name: menuItemName, category_id: categoryId })
        .eq("id", id);

      if (updateError) throw updateError;

      await supabase
        .from("menu_item_ingredients")
        .delete()
        .eq("menu_item_id", id);

      const ingredientData = addedIngredients.map((ing) => ({
        menu_item_id: id,
        ingredient_id: ing.ingredient_id,
        per_serving_qty: ing.perServingQty,
        required_qty: 0,
        final_used_qty: 0,
      }));

      const { error: insertError } = await supabase
        .from("menu_item_ingredients")
        .insert(ingredientData);

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Menu item updated!" });
      navigate("/menu");
    } catch (error) {
      toast({ title: "Error updating menu item", description: error.message });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <h2 className="text-2xl font-semibold mb-4">Edit Menu Item</h2>

      <Input
        placeholder="Menu item name"
        value={menuItemName}
        onChange={(e) => setMenuItemName(e.target.value)}
      />

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

      <div className="grid grid-cols-3 gap-4 my-4">
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
          placeholder="Qty per serve"
          type="number"
          value={perServingQty}
          onChange={(e) => setPerServingQty(e.target.value)}
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
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(ing.ingredient_id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
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

      <Button onClick={handleSubmit} className="w-full mt-4">
        Save Changes
      </Button>
    </div>
  );
};

export default EditMenuPage;
