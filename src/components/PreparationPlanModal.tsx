import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/MultiSelect"; // Assumed custom component
import { supabase } from "@/integrations/supabase/client";

type MenuItem = {
  id: string;
  name: string;
  category_id: string;
};

type PreparationMeal = {
  menu_item_ids: string[];
  estimated_plates: number;
};

type PreparationPlanInput = {
  kitchen_id: string;
  date: string;
  meals: {
    breakfast: PreparationMeal;
    lunch: PreparationMeal;
    dinner: PreparationMeal;
  };
};

interface Props {
  open: boolean;
  onClose: () => void;
  kitchenId: string;
  onCreated?: () => void;
}

const PreparationPlanModal: React.FC<Props> = ({
  open,
  onClose,
  kitchenId,
  onCreated,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [plan, setPlan] = useState<PreparationPlanInput>({
    kitchen_id: kitchenId,
    date: new Date().toISOString().split("T")[0],
    meals: {
      breakfast: { menu_item_ids: [], estimated_plates: 0 },
      lunch: { menu_item_ids: [], estimated_plates: 0 },
      dinner: { menu_item_ids: [], estimated_plates: 0 },
    },
  });

  useEffect(() => {
    const fetchMenuItems = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, category_id");
      if (error) console.error("Error loading menu items:", error.message);
      else setMenuItems(data || []);
    };

    fetchMenuItems();
  }, []);

  const handleCreate = async () => {
    const insertData = {
      kitchen_id: plan.kitchen_id,
      date: plan.date,
      meal_items: plan.meals, // Structure expected to match your DB
    };

    const { error } = await supabase
      .from("preparation_plans")
      .insert([insertData]);

    if (error) {
      console.error("Failed to insert:", error.message);
    } else {
      onClose();
      onCreated?.();
    }
  };

  const updateMeal = (
    mealType: keyof PreparationPlanInput["meals"],
    update: Partial<PreparationMeal>
  ) => {
    setPlan((prev) => ({
      ...prev,
      meals: {
        ...prev.meals,
        [mealType]: {
          ...prev.meals[mealType],
          ...update,
        },
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Preparation Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={plan.date}
              onChange={(e) => setPlan({ ...plan, date: e.target.value })}
            />
          </div>

          {(["breakfast", "lunch", "dinner"] as const).map((mealType) => (
            <div key={mealType} className="border-t pt-4 space-y-4">
              <h3 className="text-lg font-semibold capitalize">{mealType}</h3>

              <div>
                <Label>Select Menu Items</Label>
                <MultiSelect
                  placeholder={`Select ${mealType} items...`}
                  options={menuItems.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  selectedValues={plan.meals[mealType].menu_item_ids}
                  onChange={(selected) =>
                    updateMeal(mealType, { menu_item_ids: selected })
                  }
                />
              </div>

              <div>
                <Label>Estimated Plates</Label>
                <Input
                  type="number"
                  min={0}
                  value={plan.meals[mealType].estimated_plates}
                  onChange={(e) =>
                    updateMeal(mealType, {
                      estimated_plates: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreparationPlanModal;
