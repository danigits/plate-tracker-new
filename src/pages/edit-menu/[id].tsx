import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Pencil, Trash } from "lucide-react";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
};

type Category = {
  id: string;
  name: string;
};

type AddedIngredient = {
  ingredient_id: string;
  name: string;
  unit: string;
  perServingQty: number;
};

export default function EditMenuItem() {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = router.query;

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addedIngredients, setAddedIngredients] = useState<AddedIngredient[]>(
    []
  );
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [perServingQty, setPerServingQty] = useState("");
  const [editMode, setEditMode] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const [{ data: categories }, { data: ingredients }] = await Promise.all([
        supabase.from("menu_categories").select("*"),
        supabase.from("ingredients").select("*"),
      ]);
      setCategories(categories || []);
      setIngredients(ingredients || []);

      const { data: item, error } = await supabase
        .from("menu_items")
        .select(
          `
          id, name, category_id,
          menu_item_ingredients (
            ingredient_id,
            per_serving_qty,
            ingredients (name, unit)
          )
        `
        )
        .eq("id", id)
        .single();

      if (error || !item) {
        toast({
          title: "Error loading menu item",
          description: error?.message,
        });
        router.push("/menu");
        return;
      }

      setName(item.name);
      setCategoryId(item.category_id);

      const loaded = item.menu_item_ingredients.map((i: any) => ({
        ingredient_id: i.ingredient_id,
        name: i.ingredients.name,
        unit: i.ingredients.unit,
        perServingQty: i.per_serving_qty,
      }));

      setAddedIngredients(loaded);
    };

    fetchData();
  }, [id]);

  const handleAddOrUpdateIngredient = () => {
    if (!selectedIngredientId || !perServingQty) return;

    const ingredient = ingredients.find((i) => i.id === selectedIngredientId);
    if (!ingredient) return;

    const existing = addedIngredients.find(
      (i) => i.ingredient_id === selectedIngredientId
    );

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
      toast({ title: "Already exists", description: "Use edit instead." });
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
    if (!name || !categoryId || addedIngredients.length === 0) {
      toast({
        title: "Missing fields",
        description: "Name, category, and ingredients are required.",
      });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({ name, category_id: categoryId })
        .eq("id", id);

      if (updateError) throw updateError;

      await supabase
        .from("menu_item_ingredients")
        .delete()
        .eq("menu_item_id", id);

      const newLinks = addedIngredients.map((ing) => ({
        menu_item_id: id,
        ingredient_id: ing.ingredient_id,
        per_serving_qty: ing.perServingQty,
        required_qty: 0,
        final_used_qty: 0,
      }));

      const { error: insertError } = await supabase
        .from("menu_item_ingredients")
        .insert(newLinks);

      if (insertError) throw insertError;

      toast({
        title: "Updated",
        description: "Menu item updated successfully.",
      });
      router.push("/menu");
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 mt-8">
      <h2 className="text-xl font-semibold">Edit Menu Item</h2>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Menu Item Name"
      />

      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger>
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
          placeholder="Qty per serve"
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
              <TableHead>Qty</TableHead>
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
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(ing.ingredient_id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button onClick={handleSubmit} className="w-full">
        Save Changes
      </Button>
    </div>
  );
}
