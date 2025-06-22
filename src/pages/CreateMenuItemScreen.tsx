import React, { useEffect, useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

const PAGE_SIZE = 50;

const CreateMenuItemScreen = () => {
  const { toast } = useToast();
  const [menuItemName, setMenuItemName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [perServingQty, setPerServingQty] = useState("");
  const [addedIngredients, setAddedIngredients] = useState<AddedIngredient[]>(
    []
  );
  const [editMode, setEditMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ingredientsPage, setIngredientsPage] = useState(1);
  const [hasMoreIngredients, setHasMoreIngredients] = useState(true);
  const ingredientsScrollRef = useRef<HTMLDivElement>(null);

  // Fetch functions remain the same as before
  const fetchIngredients = useCallback(
    async (page: number, reset = false) => {
      setLoading(true);
      try {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error, count } = await supabase
          .from("ingredients")
          .select("*", { count: "exact" })
          .range(from, to);

        if (error) throw error;

        setIngredients((prev) =>
          reset ? data || [] : [...prev, ...(data || [])]
        );
        setHasMoreIngredients((count || 0) > to + 1);
      } catch (err) {
        toast({
          title: "Error fetching ingredients",
          description: String(err),
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchIngredients(1, true);
  }, [fetchIngredients]);

  // Scroll handler
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreIngredients && !loading) {
          setIngredientsPage((prev) => {
            const newPage = prev + 1;
            fetchIngredients(newPage);
            return newPage;
          });
        }
      },
      { threshold: 1.0 }
    );

    if (ingredientsScrollRef.current) {
      observer.observe(ingredientsScrollRef.current);
    }

    return () => {
      if (ingredientsScrollRef.current) {
        observer.unobserve(ingredientsScrollRef.current);
      }
    };
  }, [hasMoreIngredients, loading, fetchIngredients]);

  // ... [keep all your existing handler functions unchanged] ...

  return (
    <Card className="w-full max-w-6xl mx-auto mt-6">
      {" "}
      {/* Increased max width */}
      <CardHeader>
        <CardTitle>Create Menu Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {" "}
        {/* Increased spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Form Inputs */}
          <div className="space-y-4">
            <Input
              placeholder="Enter menu item name"
              value={menuItemName}
              onChange={(e) => setMenuItemName(e.target.value)}
              className="w-full"
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

            <div className="grid grid-cols-3 gap-3">
              <Select
                value={selectedIngredientId}
                onValueChange={(val) => setSelectedIngredientId(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Ingredient" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2 p-2">
                    {ingredients.map((ing) => (
                      <SelectItem
                        key={ing.id}
                        value={ing.id.toString()}
                        className="col-span-1"
                      >
                        <div className="flex flex-col">
                          <span>{ing.name}</span>
                          <span className="text-xs text-gray-500">
                            {ing.unit}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {hasMoreIngredients && (
                      <div
                        ref={ingredientsScrollRef}
                        className="col-span-3 p-2 text-center text-sm text-gray-500"
                      >
                        {loading ? "Loading..." : "Scroll to load more"}
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>

              <Input
                placeholder="Qty/serve"
                value={perServingQty}
                onChange={(e) => setPerServingQty(e.target.value)}
                type="number"
              />

              <Button onClick={handleAddOrUpdateIngredient} className="w-full">
                {editMode ? "Update" : "Add"}
              </Button>
            </div>

            <Button onClick={handleSubmit} className="w-full">
              Save Menu Item
            </Button>
          </div>

          {/* Right Column - Added Ingredients Grid */}
          <div className="space-y-2">
            <h3 className="font-medium">Added Ingredients</h3>
            {addedIngredients.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {addedIngredients.map((ing) => (
                  <div
                    key={ing.ingredient_id}
                    className="border rounded-lg p-3 flex flex-col"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{ing.name}</p>
                        <p className="text-sm text-gray-500">
                          {ing.perServingQty} {ing.unit}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleEdit(ing.ingredient_id)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => handleDelete(ing.ingredient_id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No ingredients added yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateMenuItemScreen;
