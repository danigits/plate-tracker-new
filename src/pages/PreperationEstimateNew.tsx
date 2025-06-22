// PreparationEstimate.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";
import { Utensils } from "lucide-react";

const mealTypes = ["breakfast", "lunch", "dinner"];

export default function PreparationEstimate() {
  const [mealType, setMealType] = useState("breakfast");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [estimatedPlates, setEstimatedPlates] = useState<
    Record<string, number>
  >({});
  const [kitchenId, setKitchenId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("menu_items").select("*");
      setMenuItems(data || []);
      setIsLoading(false);
    };
    fetchMenuItems();
  }, []);

  const handleChangePlates = (id: string, plates: number) => {
    setEstimatedPlates((prev) => ({ ...prev, [id]: plates }));
  };

  const handleSubmit = async () => {
    const date = dayjs().format("YYYY-MM-DD");

    const { data: plan } = await supabase
      .from("preparation_plans")
      .insert({
        meal_type: mealType,
        date,
        kitchen_id: kitchenId,
        estimated_plates: 0,
        status: "planned",
        meal_data: {},
      })
      .select()
      .single();

    const items = Object.entries(estimatedPlates)
      .filter(([, val]) => val > 0)
      .map(([menuItemId, plates]) => ({
        plan_id: plan.id,
        menu_item_id: menuItemId,
        meal_type: mealType,
        estimated_plates: plates,
        date,
        kitchen_id: kitchenId,
      }));

    await supabase.from("preparation_plan_items").insert(items);

    alert("Preparation estimate saved!");
    setEstimatedPlates({});
  };

  const totalPlates = Object.values(estimatedPlates).reduce(
    (sum, val) => sum + (val || 0),
    0
  );
  const estimatedItemsCount = Object.values(estimatedPlates).filter(
    (v) => v > 0
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Preparation Estimate
          </h1>
          <p className="text-sm text-gray-500">
            Plan your kitchen preparation for {dayjs().format("MMMM D, YYYY")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select onValueChange={setMealType} defaultValue="breakfast">
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Select meal type" />
            </SelectTrigger>
            <SelectContent>
              {mealTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 px-6"
            disabled={estimatedItemsCount === 0}
          >
            Save Plan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Meal Type</p>
                <h3 className="text-xl font-semibold text-gray-900 capitalize">
                  {mealType}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Items Estimated
                </p>
                <h3 className="text-xl font-semibold text-gray-900">
                  {estimatedItemsCount}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Plates
                </p>
                <h3 className="text-xl font-semibold text-gray-900">
                  {totalPlates}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Menu Items</h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Updated Card component in the menu items grid */}

            {menuItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-md transition-all"
              >
                {/* Image Section */}
                <div className="relative h-40 bg-gray-100">
                  {item.itemurl ? (
                    <img
                      src={item.itemurl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/food-placeholder.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Utensils className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Add to cart button */}
                    <Button
                      variant={estimatedPlates[item.id] ? "default" : "outline"}
                      size="sm"
                      className="shrink-0"
                      onClick={() =>
                        handleChangePlates(
                          item.id,
                          (estimatedPlates[item.id] || 0) + 1
                        )
                      }
                    >
                      {estimatedPlates[item.id]
                        ? `${estimatedPlates[item.id]} Added`
                        : "Add"}
                    </Button>
                  </div>

                  {/* Quantity Controls */}
                  {estimatedPlates[item.id] > 0 && (
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleChangePlates(
                              item.id,
                              Math.max(0, (estimatedPlates[item.id] || 0) - 1)
                            )
                          }
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">
                          {estimatedPlates[item.id]}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleChangePlates(
                              item.id,
                              (estimatedPlates[item.id] || 0) + 1
                            )
                          }
                        >
                          +
                        </Button>
                      </div>
                      <span className="text-sm font-medium">
                        {estimatedPlates[item.id] * (item.serving_qty || 1)}{" "}
                        plates
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
