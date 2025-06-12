import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function AddMenuItemForm({ kitchenId, onCreated }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("breakfast");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [pasteText, setPasteText] = useState("");

  useEffect(() => {
    const fetchIngredients = async () => {
      const { data } = await supabase
        .from("ingredients")
        .select("id, name, unit")
        .eq("kitchen_id", kitchenId);
      setIngredients(data || []);
    };
    fetchIngredients();
  }, [kitchenId]);

  const handleAddIngredient = (id) => {
    const existing = selectedIngredients.find((i) => i.ingredient_id === id);
    if (!existing) {
      const ing = ingredients.find((i) => i.id === id);
      setSelectedIngredients([
        ...selectedIngredients,
        { ingredient_id: id, quantity: "", unit: ing.unit },
      ]);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data: menuItem, error } = await supabase
      .from("menu_items")
      .insert([{ name, image_url: imageUrl, category, kitchen_id: kitchenId }])
      .select()
      .single();

    if (menuItem) {
      const ingredientsPayload = selectedIngredients.map((item) => ({
        menu_item_id: menuItem.id,
        ingredient_id: item.ingredient_id,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
      }));

      await supabase.from("menu_item_ingredients").insert(ingredientsPayload);
      onCreated?.();
    } else {
      console.error("Error creating menu item", error);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Image URL</Label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="h-24 mt-2 rounded" />
        )}
      </div>

      <div>
        <Label>Add Ingredients</Label>
        <Select onValueChange={handleAddIngredient}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an ingredient" />
          </SelectTrigger>
          <SelectContent>
            {ingredients.map((ing) => (
              <SelectItem key={ing.id} value={ing.id}>
                {ing.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIngredients.map((ing, index) => (
        <div key={ing.ingredient_id} className="flex gap-2 items-center">
          <span className="flex-grow">
            {ingredients.find((i) => i.id === ing.ingredient_id)?.name}
          </span>
          <Input
            type="number"
            placeholder="Quantity"
            className="w-24"
            value={ing.quantity}
            onChange={(e) => {
              const updated = [...selectedIngredients];
              updated[index].quantity = e.target.value;
              setSelectedIngredients(updated);
            }}
            required
          />
          <span>{ing.unit}</span>
        </div>
      ))}

      <Button type="submit">Create Menu Item</Button>
    </form>
  );
}
