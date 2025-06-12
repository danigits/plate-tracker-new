import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Ingredient, MenuCategory, MenuItem } from "@/types/kitchen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MenuItemCard } from "./MenuItemCard";
import MenuManagerForm from "./MenuManagerForm";

const MenuPage = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMenuItems = async () => {
    setRefreshing(true);
    const { data } = await supabase.from("menu_items").select("*");
    setMenuItems(data || []);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (!error) {
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleUpdate = async (updatedItem: MenuItem) => {
    const { error } = await supabase
      .from("menu_items")
      .update(updatedItem)
      .eq("id", updatedItem.id);

    if (!error) {
      fetchMenuItems();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: ingredientData },
        { data: categoryData },
        { data: menuData },
      ] = await Promise.all([
        supabase.from("ingredients").select("*"),
        supabase.from("menu_categories").select("*"),
        supabase.from("menu_items").select("*"),
      ]);

      setIngredients(ingredientData || []);
      setCategories(categoryData || []);
      setMenuItems(menuData || []);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Existing Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {menuItems.length === 0 ? (
            <p className="text-muted-foreground">No menu items yet.</p>
          ) : (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <div>
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="text-muted-foreground">Add and manage your menu items</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Menu Item</CardTitle>
        </CardHeader>
        <CardContent>
          <MenuManagerForm
            ingredients={ingredients}
            categories={categories}
            onMenuItemCreated={(newItem) =>
              setMenuItems((prev) => [...prev, newItem])
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> – {item.category}
              </li>
            ))}
            {menuItems.length === 0 && (
              <p className="text-muted-foreground">No menu items yet.</p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuPage;
