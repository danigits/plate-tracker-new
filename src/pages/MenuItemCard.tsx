import React, { useState } from "react";
import { MenuItem } from "@/types/kitchen";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MenuManagerForm } from "./MenuManagerForm";

interface Props {
  item: MenuItem;
  onDelete: (id: string) => void;
  onUpdate: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<Props> = ({ item, onDelete, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border p-4 rounded-md shadow-sm flex justify-between items-center">
      <div>
        <div className="font-semibold">{item.name}</div>
        <div className="text-sm text-muted-foreground capitalize">
          {item.category}
        </div>
      </div>

      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
            </DialogHeader>
            <MenuManagerForm
              initialData={item}
              onMenuItemCreated={(updated) => {
                onUpdate(updated);
                setIsOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
