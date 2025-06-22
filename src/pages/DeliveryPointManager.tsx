import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KitchenTripDashboard from "@/components/dashboard/KitchenTripDashboard";

// Using SCDN for icons
const ReloadIcon = () => (
  <svg
    className="mr-2 h-4 w-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4V8L16 4M12 20V16L8 20M19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MAX_RETRIES = 3;
const PAGE_SIZE = 50;
const MAX_DELIVERY_POINTS = 30;
const MAX_DELIVERY_POINTS_PER_KITCHEN = 30;

export default function DeliveryPointManager() {
  const [retryCount, setRetryCount] = useState(0);
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [selectedKitchen, setSelectedKitchen] = useState<string>("");
  const [deliveryPoints, setDeliveryPoints] = useState<string[]>([""]);
  const [existingPoints, setExistingPoints] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  //const [retryCount, setRetryCount] = useState(0); // Added retryCount state
  // ... [keep all the existing state declarations] ...

  // Fetch kitchens with retry logic
  const checkKitchenLimit = async (kitchenId: string) => {
    const { count, error } = await supabase
      .from("delivery_points")
      .select("*", { count: "exact", head: true })
      .eq("kitchen_id", kitchenId);

    if (error) throw error;
    return count || 0;
  };

  const handleAddField = () => {
    if (deliveryPoints.length >= 10) {
      // Limit of 10 fields at a time
      toast({
        title: "Maximum reached",
        description: "You can add up to 10 delivery points at a time",
        variant: "destructive",
      });
      return;
    }
    setDeliveryPoints([...deliveryPoints, ""]);
  };

  const handleSubmit = async (attempt = 1) => {
    if (!selectedKitchen) {
      toast({
        title: "Error",
        description: "Please select a kitchen",
        variant: "destructive",
      });
      return;
    }

    // Check existing count
    try {
      const currentCount = await checkKitchenLimit(selectedKitchen);
      if (currentCount >= MAX_DELIVERY_POINTS_PER_KITCHEN) {
        toast({
          title: "Limit Reached",
          description: `Maximum of ${MAX_DELIVERY_POINTS_PER_KITCHEN} delivery points already exist for this kitchen`,
          variant: "destructive",
        });
        return;
      }

      const payload = deliveryPoints
        .map((name) => name.trim())
        .filter(Boolean)
        .slice(0, MAX_DELIVERY_POINTS_PER_KITCHEN - currentCount) // Don't exceed limit
        .map((name) => ({
          kitchen_id: selectedKitchen,
          name,
        }));

      if (payload.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one valid delivery point name",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      const { error } = await supabase.from("delivery_points").insert(payload);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery points added successfully!",
      });
      setDeliveryPoints([""]);
      fetchDeliveryPoints(true);
      setIsModalOpen(false);
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        setTimeout(() => handleSubmit(attempt + 1), 2000 * attempt);
      } else {
        toast({
          title: "Failed to save delivery points",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const fetchKitchens = useCallback(async (attempt = 1) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("kitchens")
        .select("id, name");

      if (error) throw error;

      setKitchens(data || []);
      setRetryCount(0);
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        setTimeout(() => fetchKitchens(attempt + 1), 2000 * attempt);
        setRetryCount(attempt);
      } else {
        toast({
          title: "Failed to load kitchens",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  const fetchDeliveryPoints = useCallback(
    async (reset = false, attempt = 1) => {
      if (!selectedKitchen) return;

      setIsLoading(true);
      const currentPage = reset ? 1 : page;
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      try {
        const { data, error, count } = await supabase
          .from("delivery_points")
          .select("*", { count: "exact" })
          .eq("kitchen_id", selectedKitchen)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        setExistingPoints((prev) =>
          reset ? data || [] : [...prev, ...(data || [])]
        );
        setHasMore((count || 0) > to + 1);
        if (reset) setPage(1);
        setRetryCount(0);
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          setTimeout(
            () => fetchDeliveryPoints(reset, attempt + 1),
            2000 * attempt
          );
          setRetryCount(attempt);
        } else {
          toast({
            title: "Failed to load delivery points",
            description: error.message,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedKitchen, page]
  );

  useEffect(() => {
    fetchKitchens();
    //useAuth();
  }, [fetchKitchens]);

  useEffect(() => {
    fetchDeliveryPoints(true);
  }, [selectedKitchen, fetchDeliveryPoints]);

  const handleChange = (index: number, value: string) => {
    const updated = [...deliveryPoints];
    updated[index] = value;
    setDeliveryPoints(updated);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  // ... [keep all other existing functions like fetchDeliveryPoints, handleAddField, etc.] ...

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <h2 className="text-2xl font-bold">Delivery Points Management</h2>

      {user.kitchenId !== "all" && (
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Create Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">
              <KitchenTripDashboard />
            </div>
          </CardContent>
        </Card>
      )}

      {retryCount > 0 && (
        <div className="bg-yellow-50 border-yellow-200 border p-3 rounded-lg">
          <p className="text-yellow-800">
            Server busy (attempt {retryCount} of {MAX_RETRIES}). Retrying...
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Points List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Existing Delivery Points</h3>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Add Delivery Points</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Add New Delivery Points</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Kitchen</Label>
                      <Select
                        onValueChange={setSelectedKitchen}
                        value={selectedKitchen}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoading
                                ? "Loading kitchens..."
                                : "Choose a kitchen"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {kitchens.map((k) => (
                            <SelectItem key={k.id} value={k.id}>
                              {k.name} (
                              {
                                existingPoints.filter(
                                  (p) => p.kitchen_id === k.id
                                ).length
                              }
                              /{MAX_DELIVERY_POINTS_PER_KITCHEN})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Delivery Points (max {MAX_DELIVERY_POINTS_PER_KITCHEN}{" "}
                        per kitchen)
                      </Label>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {deliveryPoints.map((name, idx) => (
                          <Input
                            key={idx}
                            placeholder={`Delivery Point ${idx + 1}`}
                            value={name}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            disabled={isSubmitting}
                          />
                        ))}
                      </div>
                      {deliveryPoints.length < 10 && (
                        <Button
                          variant="outline"
                          onClick={handleAddField}
                          disabled={
                            isSubmitting ||
                            existingPoints.filter(
                              (p) => p.kitchen_id === selectedKitchen
                            ).length >= MAX_DELIVERY_POINTS_PER_KITCHEN
                          }
                        >
                          + Add Delivery Point
                        </Button>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSubmit()}
                      disabled={
                        isSubmitting ||
                        existingPoints.filter(
                          (p) => p.kitchen_id === selectedKitchen
                        ).length >= MAX_DELIVERY_POINTS_PER_KITCHEN
                      }
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <ReloadIcon />
                          Saving...
                        </>
                      ) : (
                        "Save Delivery Points"
                      )}
                    </Button>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg">
            <ScrollArea className="h-[500px]">
              {isLoading && page === 1 ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-3 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  ))}
                </div>
              ) : existingPoints.length > 0 ? (
                <>
                  <div className="divide-y">
                    {existingPoints.map((point) => (
                      <div key={point.id} className="p-3 hover:bg-gray-50">
                        <p className="font-medium">{point.name}</p>
                        <p className="text-sm text-gray-500">
                          Created:{" "}
                          {new Date(point.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {hasMore && (
                    <div className="p-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <ReloadIcon />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {selectedKitchen
                    ? "No delivery points found"
                    : "Select a kitchen to view delivery points"}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Kitchen Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Kitchen Information</h3>
          {selectedKitchen ? (
            <div className="border rounded-lg p-4">
              <p className="font-medium">
                {kitchens.find((k) => k.id === selectedKitchen)?.name ||
                  "Unknown Kitchen"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Total Delivery Points: {existingPoints.length}
                {hasMore && "+"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              Select a kitchen to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
