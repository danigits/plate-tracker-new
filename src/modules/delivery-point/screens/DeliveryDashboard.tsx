import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import DeliveryPointDashboard from "./DeliveryPointDashboard";

type PlanItem = {
  id: number;
  estimated_plates: number;
  received_plates: number;
  served_plates: number;
  wasted_quantity: number;
  wasted_reason?: string;
  received_time?: string;
  menu_items?: {
    id: number;
    name: string;
    itemurl?: string;
  };
};

type MealType = "breakfast" | "lunch" | "snacks" | "dinner" | null;

type DeliveryPoint = {
  id: string;
  name: string;
  code: string;
  coordinates: { lat: number; lng: number } | null;
  kitchen: { id: string; name: string } | null;
};

type ImageSlide = {
  src: string;
  name: string;
};

type DashboardState = {
  loading: boolean;
  planItems: PlanItem[];
  mealType: MealType;
  tripId: string | null;
  deliveryPoint: DeliveryPoint | null;
  deliveryPointLoading: boolean;
  deliveryPointError: string | null;
  editMode: boolean;
  updatedItems: PlanItem[];
  formErrors: { [key: number]: string };
};

export function DeliveryDashboard() {
  const { profile } = useAuth();
  const [state, setState] = useState<DashboardState>({
    loading: true,
    planItems: [],
    mealType: null,
    tripId: null,
    deliveryPoint: null,
    deliveryPointLoading: true,
    deliveryPointError: null,
    editMode: false,
    updatedItems: [],
    formErrors: {},
  });

  const [slideshowState, setSlideshowState] = useState({
    show: false,
    currentIndex: 0,
    isPlaying: true,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const slideDuration = 3000;
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  // Memoized derived values
  const images = useMemo<ImageSlide[]>(
    () =>
      state.planItems
        .filter((item) => item.menu_items?.itemurl)
        .map((item) => ({
          src: item.menu_items!.itemurl!,
          name: item.menu_items!.name,
        })),
    [state.planItems]
  );

  // Helper functions
  const getCurrentMealType = useCallback((): MealType => {
    const hours = new Date().getHours();
    if (hours >= 0 && hours < 10) return "breakfast";
    if (hours >= 10 && hours < 14) return "lunch";
    if (hours >= 14 && hours < 18) return "snacks";
    if (hours >= 18 && hours < 22) return "dinner";
    return null;
  }, []);

  const updateState = (partialState: Partial<DashboardState>) => {
    setState((prev) => ({ ...prev, ...partialState }));
  };

  // Data fetching functions
  const fetchDeliveryPoint = useCallback(async (pointId: string) => {
    if (!pointId) {
      updateState({
        deliveryPointError: "No delivery point ID provided",
        deliveryPointLoading: false,
      });
      return;
    }

    updateState({ deliveryPointLoading: true, deliveryPointError: null });

    try {
      const { data, error } = await supabase
        .from("delivery_points")
        .select(
          `
          id, name, code, latitude, longitude, 
          kitchen:kitchen_id (id, name)
        `
        )
        .eq("id", pointId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Delivery point not found");

      updateState({
        deliveryPoint: {
          id: data.id,
          name: data.name || "Unnamed Delivery Point",
          code: data.code || "N/A",
          coordinates:
            data.latitude && data.longitude
              ? { lat: data.latitude, lng: data.longitude }
              : null,
          kitchen: data.kitchen || null,
        },
        deliveryPointLoading: false,
      });
    } catch (error) {
      updateState({
        deliveryPointError:
          error instanceof Error ? error.message : "Unknown error",
        deliveryPointLoading: false,
      });
      console.error("Error fetching delivery point:", error);
    }
  }, []);

  const fetchTrip = useCallback(async () => {
    if (!profile?.delivery_point_id) {
      console.warn("No delivery_point_id available - skipping trip fetch");
      updateState({ tripId: null });
      return;
    }

    try {
      const currentMealType = getCurrentMealType();
      if (!currentMealType) {
        updateState({ tripId: null });
        return;
      }

      const { data, error } = await supabase
        .from("trip_delivery_points")
        .select(
          `
          trip_id, 
          trip_instances!inner(status, created_at)
        `
        )
        .eq("delivery_point_id", profile.delivery_point_id)
        .eq("trip_instances.meal_type", currentMealType)
        .eq("trip_instances.trip_date", today)
        .in("trip_instances.status", ["approved", "in_progress"])
        .order("created_at", {
          referencedTable: "trip_instances",
          ascending: false,
        });

      if (error) throw error;
      updateState({ tripId: data?.[0]?.trip_id || null });
    } catch (error) {
      console.error("Error fetching trip:", error);
      updateState({ tripId: null });
    }
  }, [profile?.delivery_point_id, getCurrentMealType, today]);

  const fetchPlanItems = useCallback(async () => {
    if (!profile?.delivery_point_id) return;

    updateState({ loading: true });

    try {
      const { data, error } = await supabase
        .from("delivery_point_plan_items")
        .select(
          `
          id, estimated_plates, received_plates, served_plates, 
          wasted_quantity, wasted_reason, received_time,
          menu_items (id, name, itemurl)
        `
        )
        .eq("delivery_point_id", profile.delivery_point_id)
        .eq("date", today)
        .order("menu_item_id", { ascending: true });

      if (error) throw error;
      updateState({ planItems: data ?? [], loading: false });
    } catch (error) {
      console.error("Failed to fetch plan items:", error);
      updateState({ planItems: [], loading: false });
    }
  }, [profile?.delivery_point_id, today]);

  // Combined data fetching effect
  useEffect(() => {
    if (!profile?.delivery_point_id) return;

    const mealType = getCurrentMealType();
    updateState({ mealType });

    const fetchAllData = async () => {
      await Promise.all([
        fetchPlanItems(),
        fetchTrip(),
        fetchDeliveryPoint(profile.delivery_point_id),
      ]);
    };

    fetchAllData();
  }, [
    profile?.delivery_point_id,
    fetchPlanItems,
    fetchTrip,
    fetchDeliveryPoint,
    getCurrentMealType,
  ]);

  // Slideshow effects
  const nextSlide = useCallback(
    () =>
      setSlideshowState((prev) => ({
        ...prev,
        currentIndex: (prev.currentIndex + 1) % images.length,
      })),
    [images.length]
  );

  const prevSlide = useCallback(
    () =>
      setSlideshowState((prev) => ({
        ...prev,
        currentIndex: (prev.currentIndex - 1 + images.length) % images.length,
      })),
    [images.length]
  );

  useEffect(() => {
    if (
      !slideshowState.show ||
      !slideshowState.isPlaying ||
      images.length === 0
    ) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(nextSlide, slideDuration);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    slideshowState.show,
    slideshowState.isPlaying,
    slideDuration,
    nextSlide,
    images.length,
  ]);

  const openSlideshow = useCallback(() => {
    if (images.length === 0) return;
    setSlideshowState({
      show: true,
      currentIndex: 0,
      isPlaying: true,
    });
  }, [images.length]);

  // Edit mode handlers
  const handleFieldChange = (
    id: number,
    field: keyof PlanItem,
    value: string | number
  ) => {
    updateState({
      updatedItems: state.updatedItems.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "received_plates" || field === "served_plates") {
          const received =
            Number(
              field === "received_plates" ? value : item.received_plates
            ) || 0;
          const served =
            Number(field === "served_plates" ? value : item.served_plates) || 0;
          updated.wasted_quantity = Math.max(received - served, 0);
        }

        return updated;
      }),
    });
  };

  const validateRow = (item: PlanItem) => {
    if (item.served_plates > item.received_plates) {
      return "Served plates cannot exceed received";
    }
    return "";
  };

  const saveUpdates = async () => {
    try {
      const validationErrors = state.updatedItems
        .map(validateRow)
        .filter(Boolean);
      if (validationErrors.length > 0) {
        alert(`Validation errors:\n${validationErrors.join("\n")}`);
        return;
      }

      const updatePromises = state.updatedItems.map((item) =>
        supabase
          .from("delivery_point_plan_items")
          .update({
            received_plates: item.received_plates,
            served_plates: item.served_plates,
            wasted_reason: item.wasted_reason,
          })
          .eq("id", item.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) throw errors[0].error;

      alert("Updated successfully!");
      updateState({ editMode: false });
      fetchPlanItems();
    } catch (error) {
      console.error("Save failed:", error);
      alert(
        `Update failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Initialize edit mode
  useEffect(() => {
    if (state.editMode) {
      updateState({ updatedItems: [...state.planItems] });
    }
  }, [state.editMode, state.planItems]);

  // Loading states
  if (state.loading || state.deliveryPointLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile?.delivery_point_id) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="font-medium text-blue-800">Delivery Point Needed</h3>
        <p className="text-sm text-blue-600">
          Your account needs to be assigned to a delivery point.
        </p>
      </div>
    );
  }

  if (state.deliveryPointError) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <h3 className="font-medium text-red-800">Error Loading Data</h3>
        <p className="text-sm text-red-600">{state.deliveryPointError}</p>
      </div>
    );
  }

  if (state.planItems.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="font-medium text-gray-800">No Plan Items</h3>
        <p className="text-sm text-gray-600">
          No delivery items scheduled for today.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Delivery Point Header */}
      <div className="p-3 border rounded-lg bg-blue-50 mb-4">
        <h3 className="font-medium text-blue-800">
          <MapPin className="inline mr-2" />
          {state.deliveryPoint?.name || "Delivery Point"}
        </h3>
        {state.deliveryPoint?.coordinates && (
          <p className="text-sm text-blue-600 mt-1">
            Location: {state.deliveryPoint.coordinates.lat.toFixed(6)},{" "}
            {state.deliveryPoint.coordinates.lng.toFixed(6)}
          </p>
        )}
        {state.deliveryPoint?.kitchen && (
          <p className="text-sm text-blue-600">
            Kitchen: {state.deliveryPoint.kitchen.name}
          </p>
        )}
        <p className="text-sm text-blue-600">
          Today's Date:{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Trip Status */}
      {state.tripId ? (
        <div className="mb-4 p-2 bg-green-50 text-green-800 rounded">
          <CheckCircle className="inline mr-2" />
          Active Trip: {state.tripId}
        </div>
      ) : (
        <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 rounded">
          <AlertTriangle className="inline mr-2" />
          No active trip found for current meal period
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Today's Delivery Plan</h2>

      {/* Slideshow Button */}
      {images.length > 0 && (
        <button
          onClick={openSlideshow}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Play All Images Fullscreen
        </button>
      )}

      {/* Plan Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.planItems.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg shadow bg-white p-4 flex flex-col items-center"
          >
            {item.menu_items?.itemurl && (
              <img
                src={item.menu_items.itemurl}
                alt={item.menu_items.name}
                className="rounded-lg mb-3 w-full h-48 object-cover"
              />
            )}
            <div className="font-semibold text-lg text-center mb-2">
              {item.menu_items?.name}
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <div>Estimated:</div>
              <div className="font-medium">{item.estimated_plates}</div>
              <div>Received:</div>
              <div className="font-medium">{item.received_plates}</div>
              <div>Served:</div>
              <div className="font-medium">{item.served_plates}</div>
              <div>Wasted:</div>
              <div className="font-medium text-red-600">
                {item.wasted_quantity}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Point Dashboard */}
      {state.tripId && (
        <div className="mt-8">
          <DeliveryPointDashboard
            tripId={state.tripId}
            delivery_point_id={profile.delivery_point_id}
          />
        </div>
      )}

      {/* Slideshow Modal */}
      {slideshowState.show && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={images[slideshowState.currentIndex].src}
              alt={images[slideshowState.currentIndex].name}
              className="max-h-[80vh] max-w-full object-contain"
            />

            <div className="absolute bottom-8 left-0 right-0 text-white text-center px-4">
              <div className="text-xl font-medium mb-2">
                {images[slideshowState.currentIndex].name}
              </div>
              <div className="text-sm opacity-80">
                {slideshowState.currentIndex + 1} of {images.length}
              </div>
            </div>
          </div>

          <div className="flex space-x-4 mt-4">
            <button
              onClick={prevSlide}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              ‹ Previous
            </button>
            <button
              onClick={() =>
                setSlideshowState((prev) => ({
                  ...prev,
                  isPlaying: !prev.isPlaying,
                }))
              }
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              {slideshowState.isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={nextSlide}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              Next ›
            </button>
          </div>

          <button
            onClick={() =>
              setSlideshowState((prev) => ({ ...prev, show: false }))
            }
            className="absolute top-4 right-4 text-white text-2xl bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center"
            aria-label="Close slideshow"
          >
            ×
          </button>
        </div>
      )}

      {/* Edit Mode Section */}
      <div className="mt-8 border-t pt-6">
        <button
          onClick={() => updateState({ editMode: !state.editMode })}
          className={`px-4 py-2 rounded ${
            state.editMode
              ? "bg-gray-500 hover:bg-gray-600 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {state.editMode ? "Cancel Editing" : "Enter Delivery Details"}
        </button>

        {state.editMode && (
          <div className="mt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Served
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wasted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.updatedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.menu_items?.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={item.received_plates ?? ""}
                          onChange={(e) =>
                            handleFieldChange(
                              item.id,
                              "received_plates",
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-20"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={item.served_plates ?? ""}
                          onChange={(e) =>
                            handleFieldChange(
                              item.id,
                              "served_plates",
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-20"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                        {item.wasted_quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.wasted_reason ?? ""}
                          onChange={(e) =>
                            handleFieldChange(
                              item.id,
                              "wasted_reason",
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 w-40"
                          placeholder="Reason for wastage"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="time"
                          value={
                            item.received_time
                              ? dayjs(item.received_time).format("HH:mm")
                              : ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              item.id,
                              "received_time",
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => updateState({ editMode: false })}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveUpdates}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
