import { useNavigate, useLocation } from "react-router-dom";
import PreparationPlanModal from "@/components/PreparationPlanModal";
import { Button } from "@/components/ui/button";

const PreparationPlans = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isModalOpen = location.pathname === "/preparation-plans/new";

  return (
    <>
      <div className="p-4">
        <h1 className="text-xl font-bold">Preparation Plans</h1>
        <Button
          onClick={() => navigate("/preparation-plans/new")}
          className="mt-4"
        >
          + Create New
        </Button>
      </div>

      <PreparationPlanModal
        open={isModalOpen}
        onClose={() => navigate("/preparation-plans")}
        kitchenId="YOUR_KITCHEN_ID" // Replace with actual value or prop
        onCreated={() => {
          // Refresh or show toast
          navigate("/preparation-plans");
        }}
      />
    </>
  );
};

export default PreparationPlans;
