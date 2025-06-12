import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Link } from "react-router-dom";

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

type MenuItem = {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
};

const MenuManagerForm = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
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
  const [pasteText, setPasteText] = useState("");

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, category_id, menu_categories(name)");
    //.order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching menu items", description: error.message });
      return;
    }

    const items = data.map((item) => ({
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      category_name: item.menu_categories?.name || "Uncategorized",
    }));
    setMenuItems(items);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [ingredientsRes, categoriesRes] = await Promise.all([
        supabase.from("ingredients").select("*"),
        supabase.from("menu_categories").select("*"),
      ]);

      if (ingredientsRes.error || categoriesRes.error) {
        toast({
          title: "Error fetching data",
          description:
            ingredientsRes.error?.message || categoriesRes.error?.message,
        });
        return;
      }

      setIngredients(ingredientsRes.data || []);
      setCategories(categoriesRes.data || []);

      if (categoriesRes.data?.length) setCategoryId(categoriesRes.data[0].id);
    };

    fetchData();
    fetchMenuItems();
  }, []);

  //   useEffect(() => {
  //     const fetchTest = async () => {
  //       const { data, error } = await supabase.from("ingredients").select("*");
  //       console.log("Ingredients:", data, "Error:", error);
  //     };
  //     fetchTest();
  //   }, []);

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
      toast({ title: "Ingredient already added. Use edit instead." });
    }

    setSelectedIngredientId("");
    setPerServingQty("");
  };
  const handlePasteIngredients = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.trim().split("\n");

    const newIngredients: AddedIngredient[] = [];

    for (let line of lines) {
      const [namePart, qtyPart] = line.split("|").map((s) => s.trim());

      if (!namePart || !qtyPart) continue;

      const matched = ingredients.find(
        (ing) => ing.name.toLowerCase() === namePart.toLowerCase()
      );

      if (matched) {
        const alreadyAdded = addedIngredients.find(
          (i) => i.ingredient_id === matched.id
        );
        if (!alreadyAdded) {
          newIngredients.push({
            ingredient_id: matched.id,
            name: matched.name,
            unit: matched.unit,
            perServingQty: parseFloat(qtyPart),
          });
        }
      } else {
        console.warn(`Ingredient "${namePart}" not found`);
      }
    }

    if (newIngredients.length) {
      setAddedIngredients((prev) => [...prev, ...newIngredients]);
      toast({ title: "Ingredients added from text" });
    }
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

      fetchMenuItems();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
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
            placeholder="Qty per Serving"
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
        <div>
          <Label>Bulk Add Ingredients (Name | Qty)</Label>
          <textarea
            rows={4}
            className="w-full p-2 border rounded"
            placeholder={`Example:\nRice | 100\nSalt | 2`}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <Button
            type="button"
            className="mt-2"
            onClick={handlePasteIngredients}
          >
            Add from text
          </Button>
        </div>

        <Button className="w-full" onClick={handleSubmit}>
          Save Menu Item
        </Button>
      </CardContent>

      <div className="mt-12">
        <CardHeader>
          <CardTitle>Existing Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {menuItems.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/edit-menu/${item.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    <strong>{item.name}</strong>
                  </Link>{" "}
                  –{" "}
                  <span className="text-muted-foreground">
                    {item.category_name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No menu items yet.</p>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default MenuManagerForm;
