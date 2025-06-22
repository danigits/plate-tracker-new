import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AddStaffForm({ kitchenId }: { kitchenId: string }) {
  const [form, setForm] = useState({ full_name: "", role: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from("kitchen_staff").insert([
      {
        ...form,
        kitchen_id: kitchenId,
      },
    ]);
    setLoading(false);
    if (error) {
      alert("Error adding staff: " + error.message);
    } else {
      alert("Staff added successfully");
      setForm({ full_name: "", role: "", phone: "" });
    }
  };

  return (
    <div className="p-4 border rounded-xl space-y-2">
      <Input
        name="full_name"
        value={form.full_name}
        onChange={handleChange}
        placeholder="Full Name"
      />
      <Input
        name="role"
        value={form.role}
        onChange={handleChange}
        placeholder="Role (e.g., Chef)"
      />
      <Input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone"
      />
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Adding..." : "Add Staff"}
      </Button>
    </div>
  );
}
