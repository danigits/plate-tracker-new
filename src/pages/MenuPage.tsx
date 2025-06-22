import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ingredient, MenuCategory, MenuItem } from "@/types/kitchen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MenuItemCard } from "./MenuItemCard";
import MenuManagerForm from "./MenuManagerForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

const PAGE_SIZE = 20; // Items to load per batch

const MenuPage = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const [{ data: ingredientData }, { data: categoryData }] =
        await Promise.all([
          supabase.from("ingredients").select("*"),
          supabase.from("menu_categories").select("*"),
        ]);

      setIngredients(ingredientData || []);
      setCategories(categoryData || []);
      fetchMenuItems(1, true);
    };

    fetchInitialData();
  }, []);

  // Fetch menu items with pagination
  const fetchMenuItems = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const from = (pageNum - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("menu_items")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setMenuItems((prev) => (reset ? data || [] : [...prev, ...(data || [])]));
      setHasMore((count || 0) > to + 1);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => {
            const newPage = prev + 1;
            fetchMenuItems(newPage);
            return newPage;
          });
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loading, fetchMenuItems]);

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
      fetchMenuItems(1, true); // Refresh first page
    }
  };

  const handleRefresh = () => {
    fetchMenuItems(1, true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Add and manage your menu items
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create New Menu Item */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <MenuManagerForm
                ingredients={ingredients}
                categories={categories}
                onMenuItemCreated={(newItem) => {
                  setMenuItems((prev) => [newItem, ...prev]);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Menu Items List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              {menuItems.length === 0 && !loading ? (
                <p className="text-muted-foreground">No menu items yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  ))}

                  {/* Loading skeletons */}
                  {loading &&
                    Array.from({ length: 4 }).map((_, index) => (
                      <Card key={`skeleton-${index}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-2">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}

              {/* Infinite scroll trigger */}
              <div
                ref={observerRef}
                className="h-10 flex items-center justify-center"
              >
                {loading && <span>Loading more items...</span>}
                {!hasMore && menuItems.length > 0 && (
                  <span className="text-muted-foreground text-sm">
                    No more items to load
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
