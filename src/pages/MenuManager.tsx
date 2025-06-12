import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Ingredient {
  id: string;
  name: string;
}

interface MenuCategory {
  id: string;
  name: string;
}

interface AddMenuFormProps {
  ingredients: Ingredient[];
  categories: MenuCategory[];
  onSuccess: () => void;
}

export const AddMenuForm: React.FC<AddMenuFormProps> = ({
  ingredients,
  categories,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<
    { ingredientId: string; quantity: number; unit: string }[]
  >([]);
  const [pasteText, setPasteText] = useState("");

  const handleAddIngredient = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredientId: "", quantity: 0, unit: "g" },
    ]);
  };
  const handlePasteIngredients = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.trim().split("\n");

    const newIngredients = [];

    for (let line of lines) {
      const [namePart, qtyPart] = line.split("|").map((s) => s.trim());

      if (!namePart || !qtyPart) continue;

      const matched = ingredients.find(
        (ing) => ing.name.toLowerCase() === namePart.toLowerCase()
      );

      if (matched) {
        const alreadyAdded = selectedIngredients.find(
          (i) => i.ingredient_id === matched.id
        );
        if (!alreadyAdded) {
          newIngredients.push({
            ingredient_id: matched.id,
            quantity: qtyPart,
            unit: matched.unit,
          });
        }
      } else {
        console.warn(`Ingredient "${namePart}" not found`);
      }
    }

    if (newIngredients.length) {
      setSelectedIngredients((prev) => [...prev, ...newIngredients]);
    }
  };

  const handleIngredientChange = (index: number, key: string, value: any) => {
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], [key]: value };
    setSelectedIngredients(updated);
  };

  const handleSubmit = async () => {
    const { data: item, error } = await supabase
      .from("menu_items")
      .insert([{ name, category_id: categoryId, image_url: imageUrl }])
      .select()
      .single();
    if (error || !item) return console.error("Insert menu item failed", error);

    const ingredientRecords = selectedIngredients.map((i) => ({
      menu_item_id: item.id,
      ingredient_id: i.ingredientId,
      quantity: i.quantity,
      unit: i.unit,
    }));

    const { error: relError } = await supabase
      .from("menu_item_ingredients")
      .insert(ingredientRecords);
    if (relError) return console.error("Insert ingredients failed", relError);

    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Image URL</Label>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>

      <div>
        <Label>Ingredients</Label>
        {selectedIngredients.map((ing, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <Select
              value={ing.ingredientId}
              onValueChange={(value) =>
                handleIngredientChange(index, "ingredientId", value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ingredient" />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Qty"
              className="w-24"
              value={ing.quantity}
              onChange={(e) =>
                handleIngredientChange(
                  index,
                  "quantity",
                  parseFloat(e.target.value)
                )
              }
            />
            <Select
              value={ing.unit}
              onValueChange={(value) =>
                handleIngredientChange(index, "unit", value)
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="l">l</SelectItem>
                <SelectItem value="unit">unit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAddIngredient}>
          + Add Ingredient
        </Button>
      </div>
      <div>
        <Label>Bulk Add Ingredients (Name | Qty)</Label>
        <textarea
          rows={4}
          className="w-full p-2 border rounded"
          placeholder={`Example:\nRice | 100\nSalt | 2`}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <Button type="button" className="mt-2" onClick={handlePasteIngredients}>
          Add from text
        </Button>
      </div>

      <Button className="bg-green-600 text-white" onClick={handleSubmit}>
        Save Menu Item
      </Button>
    </div>
  );
};
