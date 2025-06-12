// PreparationEstimate.tsx
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
import { Plus, Edit } from "lucide-react";
import { PreparationPlan } from "@/types/kitchen";
import PreparationEstimateDialog from "./PreparationEstimateDialog";

// --- Constants ---
const mealTypes = ["breakfast", "lunch", "dinner"];
const initialMealPlan = { menuItems: [{ name: "", headCount: 0 }] };

// --- Badge Helper ---
const getStatusBadge = (status: string) => {
  switch (status) {
    case "planned":
      return <Badge className="bg-blue-100 text-blue-800">Planned</Badge>;
    case "in-progress":
      return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case "true":
      return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
    default:
      return <Badge className="bg-gray-200 text-gray-600">Unknown</Badge>;
  }
};

// --- Main Component ---
const PreparationEstimate: React.FC = () => {
  const [plans, setPlans] = useState<PreparationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [kitchenUser, setKitchenUser] = useState<{ kitchenId: string } | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("today");
  const [showDialog, setShowDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<PreparationPlan | null>(null);

  const handleEdit = (plan: PreparationPlan) => {
    setEditPlan(plan);
    setEditDialogOpen(true);
  };

  const [form, setForm] = useState({
    kitchen_id: "",
    date: new Date().toISOString().split("T")[0],
    meals: {
      breakfast: structuredClone(initialMealPlan),
      lunch: structuredClone(initialMealPlan),
      dinner: structuredClone(initialMealPlan),
    },
  });

  const currentDate = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date(Date.now() + 86400000)
    .toISOString()
    .split("T")[0];

  // Fetch plans from Supabase
  useEffect(() => {
    const fetchPlans = async () => {
      const stored = localStorage.getItem("kitchenUser");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setKitchenUser(parsed);
          setForm((prev) => ({ ...prev, kitchen_id: parsed.kitchenId }));
        } catch (e) {
          console.error("Error parsing kitchenUser", e);
        }
      }

      const { data, error } = await supabase
        .from("preparation_plan_items")
        .select(`*, menu_items(name)`)
        .order("date", { ascending: false });

      if (error) console.error("Error fetching plans:", error);
      else setPlans(data ?? []);
      setLoading(false);
    };

    fetchPlans();
  }, []);

  // Handle input changes
  const handleChange = (
    meal: string,
    index: number,
    field: "name" | "headCount",
    value: string | number
  ) => {
    setForm((prev) => {
      const updated = { ...prev };
      updated.meals[meal].menuItems[index][field] =
        field === "headCount" ? Number(value) : value;
      return updated;
    });
  };

  // Add menu item to meal
  const addMenuItem = (meal: string) => {
    setForm((prev) => {
      const updated = { ...prev };
      updated.meals[meal].menuItems.push({ name: "", headCount: 0 });
      return updated;
    });
  };

  // Create plan
  const handleCreatePlan = async () => {
    const allEntries = mealTypes.flatMap((meal) =>
      form.meals[meal].menuItems
        .filter((m) => m.name)
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
      .from("preparation_plan_items")
      .insert(allEntries)
      .select();

    if (!error && data) {
      setPlans((prev) => [...prev, ...data]);
      setShowModal(false);
      setForm({
        kitchen_id: kitchenUser?.kitchenId ?? "",
        date: currentDate,
        meals: {
          breakfast: structuredClone(initialMealPlan),
          lunch: structuredClone(initialMealPlan),
          dinner: structuredClone(initialMealPlan),
        },
      });
    } else {
      console.error(error?.message);
    }
  };

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesDate =
      (activeTab === "today" && plan.date === currentDate) ||
      (activeTab === "tomorrow" && plan.date === tomorrowDate) ||
      activeTab === "all";

    const matchesSearch =
      plan.menu_items?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.wastage_reason?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch && plan.estimated_plates >= 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal Preparation</h1>
          <p className="text-muted-foreground">Plan meals and track wastage</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Preparation Plan
        </Button>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today's Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {plans.filter((p) => p.date === currentDate).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estimated Plates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {plans
                .filter((p) => p.date === currentDate)
                .reduce((sum, p) => sum + p.estimated_plates, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Wastage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {plans
                .filter((p) => p.date === currentDate && p.wastage != null)
                .reduce((sum, p) => sum + (p.wastage || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="today" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        {["today", "tomorrow", "all"].map((tab) => (
          <TabsContent value={tab} key={tab}>
            <PreparationTable plans={filteredPlans} onEdit={handleEdit} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Wastage Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wastage</DialogTitle>
          </DialogHeader>
          {editPlan && (
            <div className="space-y-4">
              <p>
                <strong>Menu:</strong> {editPlan.menu_items?.name}
              </p>
              <Input
                type="number"
                placeholder="Wastage Count"
                value={editPlan.wastage ?? ""}
                onChange={(e) =>
                  setEditPlan({ ...editPlan, wastage: Number(e.target.value) })
                }
              />
              <Textarea
                placeholder="Reason"
                value={editPlan.wastage_reason ?? ""}
                onChange={(e) =>
                  setEditPlan({ ...editPlan, wastage_reason: e.target.value })
                }
              />
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!editPlan) return;
                const { error } = await supabase
                  .from("preparation_plan_items")
                  .update({
                    wastage: editPlan.wastage,
                    wastage_reason: editPlan.wastage_reason,
                  })
                  .eq("id", editPlan.id);
                if (!error) {
                  setPlans((prev) =>
                    prev.map((p) =>
                      p.id === editPlan.id
                        ? { ...p, ...editPlan, status: "completed" }
                        : p
                    )
                  );
                  setEditDialogOpen(false);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Plan Creation Dialog */}
      <PreparationEstimateDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        kitchenId={kitchenUser?.kitchenId}
      />
    </div>
  );
};

// --- Table Subcomponent ---
const PreparationTable: React.FC<{
  plans: PreparationPlan[];
  onEdit: (plan: PreparationPlan) => void;
}> = ({ plans, onEdit }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Meal</TableHead>
          <TableHead>Menu</TableHead>
          <TableHead>Estimated</TableHead>
          <TableHead>Wastage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((p) => (
          <TableRow key={p.id ?? "-"}>
            <TableCell>{p.date ?? "-"}</TableCell>
            <TableCell className="capitalize">{p.meal_type ?? "-"}</TableCell>
            <TableCell>{p.menu_items?.name ?? "-"}</TableCell>
            <TableCell>{p.estimated_plates ?? "-"}</TableCell>
            <TableCell>{p.wastage ?? "-"}</TableCell>
            <TableCell>{getStatusBadge(p.status)}</TableCell>
            <TableCell>
              {p.date === new Date().toISOString().split("T")[0] && (
                <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>
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

export default PreparationEstimate;
