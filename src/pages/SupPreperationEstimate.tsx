import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { PreparationPlan } from "@/types/kitchen";
import PreparationEstimateDialog from "./PreparationEstimateDialog";

// Constants
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
const INITIAL_MEAL_PLAN = { menuItems: [{ name: "", headCount: 0 }] };

// Utility functions
const getStatusBadge = (status: string) => {
  const statusMap = {
    approved: { className: "bg-blue-100 text-blue-800", label: "Approved" },
    pending: { className: "bg-amber-100 text-amber-800", label: "Pending" },
    received: { className: "bg-green-100 text-green-800", label: "Received" },
    transit: { className: "bg-blue-100 text-blue-800", label: "Transit" },
  };

  const statusConfig = statusMap[status as keyof typeof statusMap] || {
    className: "",
    label: status,
  };
  return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
};

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const PreparationTable: React.FC<{
  plans: PreparationPlan[];
  onEdit: (plan: PreparationPlan) => void;
}> = ({ plans, onEdit }) => {
  const today = formatDate(new Date());

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Delivery Point</TableHead>
          <TableHead>Meal</TableHead>
          <TableHead>Menu</TableHead>
          <TableHead>Estimated</TableHead>
          <TableHead>Consumption</TableHead>
          <TableHead>Wastage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>{plan.date ?? "-"}</TableCell>
            <TableCell>{plan.delivery_point_name ?? "-"}</TableCell>

            <TableCell className="capitalize">
              {plan.meal_type ?? "-"}
            </TableCell>
            <TableCell>{plan.menu_items?.name ?? "-"}</TableCell>
            <TableCell>{plan.estimated_plates ?? "-"}</TableCell>
            <TableCell>{plan.consumption ?? "-"}</TableCell>
            <TableCell>{plan.wastage_quantity ?? "-"}</TableCell>
            <TableCell>{getStatusBadge(plan.status)}</TableCell>
            <TableCell>
              {plan.date === today && (
                <Button size="sm" variant="ghost" onClick={() => onEdit(plan)}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const SupPreparationEstimate: React.FC = () => {
  // State management
  const [state, setState] = useState({
    plans: [] as PreparationPlan[],
    loading: true,
    showModal: false,
    showDialog: false,
    editDialogOpen: false,
    searchTerm: "",
    activeTab: "today" as "today" | "tomorrow" | "all",
    kitchenUser: null as { kitchenId: string } | null,
    editPlan: null as PreparationPlan | null,
  });

  const [form, setForm] = useState({
    kitchen_id: "",
    date: formatDate(new Date()),
    meals: {
      breakfast: structuredClone(INITIAL_MEAL_PLAN),
      lunch: structuredClone(INITIAL_MEAL_PLAN),
      dinner: structuredClone(INITIAL_MEAL_PLAN),
    },
  });
  const [deliveryPlans, setDeliveryPlans] = useState([]);
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  // Derived values
  const currentDate = formatDate(new Date());
  const tomorrowDate = formatDate(new Date(Date.now() + 86400000));
  const kitchenId = state.kitchenUser?.kitchenId;
  const filteredPlans = state.plans.filter((plan) => {
    if (kitchenId && plan.kitchen_id !== kitchenId) return false;

    // Existing date filter
    const matchesDate =
      (state.activeTab === "today" && plan.date === currentDate) ||
      (state.activeTab === "tomorrow" && plan.date === tomorrowDate) ||
      state.activeTab === "all";

    // Existing search filter
    const matchesSearch =
      plan.menu_items?.name
        ?.toLowerCase()
        .includes(state.searchTerm.toLowerCase()) ||
      plan.wastage_reason
        ?.toLowerCase()
        .includes(state.searchTerm.toLowerCase());

    return matchesDate && matchesSearch && (plan.estimated_plates ?? 0) >= 0;
  });

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("kitchenUser");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setState((prev) => ({ ...prev, kitchenUser: parsedUser }));
          setForm((prev) => ({ ...prev, kitchen_id: parsedUser.kitchenId }));
        }

        // Fetch all delivery points (id + name)
        const { data: points, error: pointError } = await supabase
          .from("delivery_points")
          .select("id, name");

        if (pointError) throw pointError;

        const pointMap = Object.fromEntries(points.map((p) => [p.id, p.name]));

        // Fetch delivery_point_plan_items with related menu_items
        const { data: plans, error: planError } = await supabase
          .from("delivery_point_plan_items")
          .select(
            `
          *,
          menu_items (*)
        `
          )
          .order("date", { ascending: false });

        if (planError) throw planError;

        // Virtual join: add delivery_point_name from the delivery_points map
        const enrichedPlans = plans.map((plan) => ({
          ...plan,
          delivery_point_name: pointMap[plan.delivery_point_id] || "Unknown",
        }));

        // Set in both UI state and internal state
        setDeliveryPoints(points);
        setDeliveryPlans(enrichedPlans);
        setState((prev) => ({
          ...prev,
          plans: enrichedPlans, // make sure this version is used in your table
          loading: false,
        }));
      } catch (error) {
        console.error("Data fetching error:", error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  // Event handlers
  const handleChange = (
    meal: keyof typeof form.meals,
    index: number,
    field: "name" | "headCount",
    value: string | number
  ) => {
    setForm((prev) => {
      const updated = { ...prev };
      updated.meals[meal].menuItems[index][field] =
        field === "headCount" ? Number(value) : String(value);
      return updated;
    });
  };

  const addMenuItem = (meal: keyof typeof form.meals) => {
    setForm((prev) => ({
      ...prev,
      meals: {
        ...prev.meals,
        [meal]: {
          menuItems: [
            ...prev.meals[meal].menuItems,
            { name: "", headCount: 0 },
          ],
        },
      },
    }));
  };

  const handleCreatePlan = async () => {
    try {
      const allEntries = MEAL_TYPES.flatMap((meal) =>
        form.meals[meal].menuItems
          .filter((item) => item.name.trim())
          .map((item) => ({
            kitchen_id: form.kitchen_id,
            date: form.date,
            meal_type: meal,
            menu_item_name: item.name,
            estimated_plates: item.headCount,
            actual_plates: null,
            wastage: null,
            wastage_reason: "",
            status: "planned",
          }))
      );

      const { data, error } = await supabase
        .from("delivery_point_plan_items")
        .insert(allEntries)
        .select();

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        plans: [...prev.plans, ...data],
        showModal: false,
      }));

      setForm({
        kitchen_id: state.kitchenUser?.kitchenId ?? "",
        date: currentDate,
        meals: {
          breakfast: structuredClone(INITIAL_MEAL_PLAN),
          lunch: structuredClone(INITIAL_MEAL_PLAN),
          dinner: structuredClone(INITIAL_MEAL_PLAN),
        },
      });
    } catch (error) {
      console.error("Plan creation failed:", error);
    }
  };

  const handleEditSave = async () => {
    if (!state.editPlan) return;

    try {
      const { error } = await supabase
        .from("delivery_point_plan_items")
        .update({
          wastage_quantity: state.editPlan.wastage_quantity,
          wastage_reason: state.editPlan.wastage_reason,
        })
        .eq("id", state.editPlan.id);

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        plans: prev.plans.map((p) =>
          p.id === state.editPlan?.id
            ? { ...p, ...state.editPlan, status: "completed" }
            : p
        ),
        editDialogOpen: false,
      }));
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // Render
  if (state.loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal Preparation</h1>
          <p className="text-muted-foreground">Plan meals and track wastage</p>
        </div>
        <Button
          onClick={() => setState((prev) => ({ ...prev, showDialog: true }))}
        >
          <Plus className="mr-2 h-4 w-4" /> New Preparation Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                state.plans.filter(
                  (p) =>
                    p.date === currentDate &&
                    (!kitchenId || p.kitchen_id === kitchenId)
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Estimated Persons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {state.plans
                .filter(
                  (p) =>
                    p.date === currentDate &&
                    (!kitchenId || p.kitchen_id === kitchenId)
                )
                .reduce((sum, p) => sum + (p.estimated_plates || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Wastage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-kitchen-danger">
              {state.plans
                .filter(
                  (p) =>
                    p.date === currentDate &&
                    p.wastage_quantity !== null &&
                    (!kitchenId || p.kitchen_id === kitchenId)
                )
                .reduce((sum, p) => sum + (p.wastage_quantity || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={state.activeTab}
        onValueChange={(value) =>
          setState((prev) => ({ ...prev, activeTab: value as any }))
        }
      >
        <TabsList className="mb-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {(["today", "tomorrow", "all"] as const).map((tab) => (
          <TabsContent value={tab} key={tab}>
            <PreparationTable
              plans={filteredPlans}
              onEdit={(plan) =>
                setState((prev) => ({
                  ...prev,
                  editPlan: plan,
                  editDialogOpen: true,
                }))
              }
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      <Dialog
        open={state.showModal}
        onOpenChange={(open) =>
          setState((prev) => ({ ...prev, showModal: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Preparation Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
            />

            {MEAL_TYPES.map((meal) => (
              <div key={meal} className="mb-6">
                <h3 className="text-lg font-semibold capitalize mb-2">
                  {meal}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {form.meals[meal].menuItems.map((item, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">
                          Item {idx + 1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center text-muted-foreground">
                          <span className="text-sm">No Image</span>
                        </div>
                        <Input
                          placeholder="Menu Item Name"
                          value={item.name}
                          onChange={(e) =>
                            handleChange(meal, idx, "name", e.target.value)
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Plates"
                          value={item.headCount}
                          onChange={(e) =>
                            handleChange(meal, idx, "headCount", e.target.value)
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                  <Card
                    onClick={() => addMenuItem(meal)}
                    className="cursor-pointer hover:bg-muted border-dashed border-2 border-gray-300 flex items-center justify-center"
                  >
                    <div className="text-center text-muted-foreground">
                      <Plus className="mx-auto mb-1" />
                      Add Item
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleCreatePlan}>Save Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={state.editDialogOpen}
        onOpenChange={(open) =>
          setState((prev) => ({ ...prev, editDialogOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wastage</DialogTitle>
          </DialogHeader>

          {state.editPlan && (
            <div className="space-y-4">
              <p>
                <strong>Menu:</strong> {state.editPlan.menu_items?.name}
              </p>
              <Input
                type="number"
                placeholder="Wastage Count"
                value={state.editPlan.wastage_quantity ?? ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    editPlan: {
                      ...prev.editPlan!,
                      wastage_quantity: Number(e.target.value),
                    },
                  }))
                }
              />
              <Textarea
                placeholder="Reason (optional)"
                value={state.editPlan.wastage_reason ?? ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    editPlan: {
                      ...prev.editPlan!,
                      wastage_reason: e.target.value,
                    },
                  }))
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PreparationEstimateDialog
        open={state.showDialog}
        onClose={() => setState((prev) => ({ ...prev, showDialog: false }))}
        kitchenId={state.kitchenUser?.kitchenId}
      />
    </div>
  );
};

export default SupPreparationEstimate;
