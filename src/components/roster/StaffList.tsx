import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StaffList({ kitchenId }: { kitchenId: string }) {
  const [staff, setStaff] = useState([]);
  const [editing, setEditing] = useState<any>(null);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("kitchen_staff")
      .select("*")
      .eq("kitchen_id", kitchenId)
      .order("created_at", { ascending: false });
    if (data) setStaff(data);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Delete this staff member?");
    if (!confirmed) return;
    await supabase.from("kitchen_staff").delete().eq("id", id);
    fetchStaff();
  };

  const handleEditSave = async () => {
    await supabase
      .from("kitchen_staff")
      .update({
        full_name: editing.full_name,
        role: editing.role,
        phone: editing.phone,
      })
      .eq("id", editing.id);
    setEditing(null);
    fetchStaff();
  };

  return (
    <div className="space-y-4">
      {staff.map((person) =>
        editing?.id === person.id ? (
          <div
            key={person.id}
            className="p-4 border rounded-xl flex items-center gap-2"
          >
            <Input
              value={editing.full_name}
              onChange={(e) =>
                setEditing({ ...editing, full_name: e.target.value })
              }
            />
            <Input
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
            />
            <Input
              value={editing.phone}
              onChange={(e) =>
                setEditing({ ...editing, phone: e.target.value })
              }
            />
            <Button onClick={handleEditSave}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div
            key={person.id}
            className="p-4 border rounded-xl flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{person.full_name}</div>
              <div className="text-sm text-gray-600">
                {person.role} · {person.phone}
              </div>
            </div>
            <div className="space-x-2">
              <Button onClick={() => setEditing(person)}>Edit</Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(person.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
