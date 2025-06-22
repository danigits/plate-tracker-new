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
import { Profile } from "@/types/auth";

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

export function DeliveryDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [mealType, setMealType] = useState<MealType>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [deliveryPoint, setDeliveryPoint] = useState<DeliveryPoint | null>(
    null
  );
  const [deliveryPointLoading, setDeliveryPointLoading] = useState(true);
  const [deliveryPointError, setDeliveryPointError] = useState<string | null>(
    null
  );
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const slideDuration = 3000;
  const [editMode, setEditMode] = useState(false);
  const [updatedItems, setUpdatedItems] = useState<PlanItem[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: number]: string }>({});

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  //const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const yesterday = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0];
  }, []);

  const getCurrentMealType = useCallback((): MealType => {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 0 && hours < 10) return "breakfast";
    if (hours >= 10 && hours < 14) return "lunch";
    if (hours >= 14 && hours < 18) return "snacks";
    if (hours >= 18 && hours < 22) return "dinner";
    return null;
  }, []);

  const fetchDeliveryPoint = useCallback(async (pointId: string) => {
    if (!pointId) {
      setDeliveryPointError("No delivery point ID provided");
      setDeliveryPointLoading(false);
      return;
    }

    setDeliveryPointLoading(true);
    setDeliveryPointError(null);

    try {
      const { data, error } = await supabase
        .from("delivery_points")
        .select(
          `
          id,
          name,
          code,
          latitude,
          longitude,
          kitchen:kitchen_id (id, name)
        `
        )
        .eq("id", pointId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Delivery point not found");

      setDeliveryPoint({
        id: data.id,
        name: data.name || "Unnamed Delivery Point",
        code: data.code || "N/A",
        coordinates:
          data.latitude && data.longitude
            ? { lat: data.latitude, lng: data.longitude }
            : null,
        kitchen: data.kitchen || null,
      });
    } catch (error) {
      setDeliveryPointError(
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error("Error fetching delivery point:", error);
    } finally {
      setDeliveryPointLoading(false);
    }
  }, []);

  const fetchTrip = useCallback(async () => {
    if (!profile?.delivery_point_id) {
      console.warn("No delivery_point_id available - skipping trip fetch");
      setTripId(null);
      return;
    }

    try {
      const currentMealType = getCurrentMealType();
      if (!currentMealType) {
        setTripId(null);
        return;
      }

      const { data, error } = await supabase
        .from("trip_delivery_points")
        .select(
          `
          trip_id, 
          trip_instances!inner(
            status,
            created_at
          )
        `
        )
        .eq("delivery_point_id", profile.delivery_point_id)
        //.eq("trip_instances.meal_type", currentMealType)
        .eq("trip_instances.meal_type", "breakfast")
        .eq("trip_instances.trip_date", today)
        .in("trip_instances.status", ["approved", "in_progress"])
        .order("created_at", {
          referencedTable: "trip_instances",
          ascending: false,
        });

      if (error) throw error;
      setTripId(data?.[0]?.trip_id || null);
    } catch (error) {
      console.error("Error fetching trip:", error);
      setTripId(null);
    }
  }, [profile?.delivery_point_id, getCurrentMealType, today]);

  const fetchPlanItems = useCallback(async () => {
    if (!profile?.delivery_point_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("delivery_point_plan_items")
        .select(
          `
          id,
          estimated_plates,
          received_plates,
          served_plates,
          wasted_quantity,
          wasted_reason,
          received_time,
          menu_items (id, name, itemurl)
        `
        )
        .eq("delivery_point_id", profile.delivery_point_id)
        .eq("date", today)
        .order("menu_item_id", { ascending: true });

      if (error) throw error;
      setPlanItems(data ?? []);
    } catch (error) {
      console.error("Failed to fetch plan items:", error);
      setPlanItems([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.delivery_point_id, today]);

  useEffect(() => {
    if (!profile?.delivery_point_id) return;

    setMealType(getCurrentMealType());
    fetchPlanItems();
    fetchTrip();
    fetchDeliveryPoint(profile.delivery_point_id);
  }, [
    profile,
    getCurrentMealType,
    fetchPlanItems,
    fetchTrip,
    fetchDeliveryPoint,
  ]);

  const images = useMemo<ImageSlide[]>(
    () =>
      planItems
        .filter((item) => item.menu_items?.itemurl)
        .map((item) => ({
          src: item.menu_items!.itemurl!,
          name: item.menu_items!.name,
        })),
    [planItems]
  );

  const nextSlide = useCallback(
    () => setCurrentIndex((i) => (i + 1) % images.length),
    [images.length]
  );

  const prevSlide = useCallback(
    () => setCurrentIndex((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!showSlideshow || !isPlaying || images.length === 0) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, slideDuration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showSlideshow, isPlaying, slideDuration, nextSlide, images.length]);

  const openSlideshow = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex(0);
    setIsPlaying(true);
    setShowSlideshow(true);
  }, [images.length]);

  useEffect(() => {
    if (editMode) {
      setUpdatedItems([...planItems]);
    }
  }, [editMode, planItems]);

  const handleFieldChange = (
    id: number,
    field: keyof PlanItem,
    value: string | number
  ) => {
    setUpdatedItems((prevItems) =>
      prevItems.map((item) => {
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
      })
    );
  };

  const saveUpdates = async () => {
    try {
      const validationErrors = updatedItems.map(validateRow).filter(Boolean);
      if (validationErrors.length > 0) {
        alert(`Validation errors:\n${validationErrors.join("\n")}`);
        return;
      }

      // Create an array of update promises
      const updatePromises = updatedItems.map((item) =>
        supabase
          .from("delivery_point_plan_items")
          .update({
            received_plates: item.received_plates,
            served_plates: item.served_plates,
            //wasted_quantity: item.received_plates - item.served_plates,
            wasted_reason: item.wasted_reason,
            //received_time: item.received_time,
          })
          .eq("id", item.id)
      );

      // Execute all updates
      const results = await Promise.all(updatePromises);

      // Check for errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      alert("Updated successfully!");
      setEditMode(false);
      fetchPlanItems();
    } catch (error) {
      console.error("Save failed:", error);
      alert(`Update failed: ${error.message}`);
    }
  };
  const validateRow = (item: PlanItem) => {
    // if (!item.received_plates || !item.served_plates) {
    //   return "All fields are required";
    // }
    if (item.served_plates > item.received_plates) {
      return "Served plates cannot exceed received";
    }
    return "";
  };
  // const saveUpdates = async () => {
  //   try {
  //     const updates = updatedItems.map((item) => ({
  //       id: item.id,
  //       received_plates: item.received_plates,
  //       served_plates: item.served_plates,
  //       wasted_reason: item.wasted_reason,
  //       received_time: item.received_time,
  //     }));

  //     const { error } = await supabase
  //       .from("delivery_point_plan_items")
  //       .upsert(updates)
  //       .eq((id = updates.id));

  //     if (error) throw error;

  //     alert("Updated successfully!");
  //     setEditMode(false);
  //     fetchPlanItems();
  //   } catch (error) {
  //     console.error("Save failed:", error);
  //     alert("Update failed. See console for details.");
  //   }
  // };
  // const saveUpdates = async () => {
  //   const errors: { [key: number]: string } = {};
  //   updatedItems.forEach((item) => {
  //     const error = validateRow(item);
  //     if (error) errors[item.id] = error;
  //   });

  //   if (Object.keys(errors).length > 0) {
  //     setFormErrors(errors);
  //     alert("Please fix errors before saving.");
  //     return;
  //   }

  //   const updates = updatedItems.map(
  //     ({
  //       id,
  //       received_plates,
  //       served_plates,
  //       wasted_reason,
  //       //arrival_time,
  //     }) => ({
  //       id,
  //       received_plates,
  //       served_plates,
  //       wasted_reason,
  //       // received_time: arrival_time,
  //       updated_at: new Date().toISOString(),
  //     })
  //   );

  //   const { error } = await supabase
  //     .from("delivery_point_plan_items")
  //     .upsert(updates, { onConflict: "id" });

  //   if (error) {
  //     alert("Update failed");
  //     console.error(error);
  //   } else {
  //     alert("Updated successfully!");
  //     setEditMode(false);
  //     fetchPlanItems();
  //   }
  // };

  if (loading || deliveryPointLoading) {
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

  if (deliveryPointError) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <h3 className="font-medium text-red-800">Error Loading Data</h3>
        <p className="text-sm text-red-600">{deliveryPointError}</p>
      </div>
    );
  }

  if (planItems.length === 0) {
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
          {deliveryPoint?.name || "Delivery Point"}
        </h3>
        {deliveryPoint?.coordinates && (
          <p className="text-sm text-blue-600 mt-1">
            Location: {deliveryPoint.coordinates.lat.toFixed(6)},{" "}
            {deliveryPoint.coordinates.lng.toFixed(6)}
          </p>
        )}
        {deliveryPoint?.kitchen && (
          <p className="text-sm text-blue-600">
            Kitchen: {deliveryPoint.kitchen.name}
          </p>
        )}
        {deliveryPoint?.kitchen && (
          <p className="text-sm text-blue-600">
            delivery_point_id:{deliveryPoint.id}
          </p>
        )}
        {deliveryPoint?.kitchen && (
          <p className="text-sm text-blue-600">
            Today's Date:
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Trip Status */}
      {tripId ? (
        <div className="mb-4 p-2 bg-green-50 text-green-800 rounded">
          <CheckCircle className="inline mr-2" />
          Active Trip: {tripId}
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
        {planItems.map((item) => (
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
      {tripId && (
        <div className="mt-8">
          <DeliveryPointDashboard
            tripId={tripId}
            delivery_point_id={profile.delivery_point_id}
          />
        </div>
      )}

      {/* Slideshow Modal */}
      {showSlideshow && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={images[currentIndex].src}
              alt={images[currentIndex].name}
              className="max-h-[80vh] max-w-full object-contain"
            />

            <div className="absolute bottom-8 left-0 right-0 text-white text-center px-4">
              <div className="text-xl font-medium mb-2">
                {images[currentIndex].name}
              </div>
              <div className="text-sm opacity-80">
                {currentIndex + 1} of {images.length}
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
              onClick={() => setIsPlaying((p) => !p)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={nextSlide}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              Next ›
            </button>
          </div>

          <button
            onClick={() => setShowSlideshow(false)}
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
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded ${
            editMode
              ? "bg-gray-500 hover:bg-gray-600 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {editMode ? "Cancel Editing" : "Edit Delivery Details"}
        </button>

        {editMode && (
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
                  {updatedItems.map((item) => (
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
                onClick={() => setEditMode(false)}
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
