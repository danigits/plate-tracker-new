import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddMenuItemForm from "./AddMenuItemForm";

export default function MenuItemDialog({ kitchenId, onMenuItemCreated }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-kitchen-secondary hover:bg-green-600">
          <Plus className="mr-2 h-4 w-4" /> Add Menu Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Menu Item</DialogTitle>
        </DialogHeader>
        <AddMenuItemForm kitchenId={kitchenId} onCreated={onMenuItemCreated} />
      </DialogContent>
    </Dialog>
  );
}
