import { useAuth } from "@/contexts/AuthContext";
import { AddStaffForm } from "./AddStaffForm";
import { BulkUploadStaff } from "./BulkUploadStaff";
import { StaffList } from "./StaffList";

export default function KitchenStaffManager() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Add Staff</h2>
      <AddStaffForm kitchenId={user?.kitchenId} />
      <BulkUploadStaff kitchenId={user?.kitchenId} />
      <h2 className="text-xl font-bold">Existing Staff</h2>
      <StaffList kitchenId={user?.kitchenId} />
    </div>
  );
}
