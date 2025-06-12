import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AddItemForm = ({ onItemAdded }: { onItemAdded?: () => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "vegetable",
    quantity: "",
    unit: "kg",
    pricePerUnit: "",
    threshold: "",
    image_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const {
      name,
      category,
      quantity,
      pricePerUnit,
      unit,
      threshold,
      image_url,
    } = formData;

    const { error } = await supabase.from("inventory_items").insert({
      name,
      category,
      quantity: parseFloat(quantity),
      unit,
      pricePerUnit: parseFloat(pricePerUnit),
      threshold: parseFloat(threshold),
      image_url, // Direct URL
      kitchen_id: localStorage.getItem("kitchenId"), // Replace or pass dynamically
      //lastUpdated: new Date().toISOString(),
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Item added successfully" });
      onItemAdded?.();
    }

    setSubmitting(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label>Name</Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label>Category</Label>
        <Select
          value={formData.category}
          onValueChange={(val) => handleSelectChange("category", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {[
              "vegetable",
              "meat",
              "grain",
              "dairy",
              "spice",
              "groceries",
              "other",
            ].map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Quantity</Label>
        <Input
          name="quantity"
          type="number"
          step="any"
          value={formData.quantity}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label>Unit</Label>
        <Select
          value={formData.unit}
          onValueChange={(val) => handleSelectChange("unit", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            {["kg", "g", "l", "ml", "unit", "pack"].map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Price per Unit (₹)</Label>
        <Input
          name="pricePerUnit"
          type="number"
          step="any"
          value={formData.pricePerUnit}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label>Threshold</Label>
        <Input
          name="threshold"
          type="number"
          step="any"
          value={formData.threshold}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label>Image URL</Label>
        <Input
          name="image_url"
          type="url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add Item"}
      </Button>
    </form>
  );
};
