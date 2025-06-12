import React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const MultiSelect = ({
  items,
  selected,
  onChange,
}: {
  items: { id: string; name: string; category_name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) => {
  const grouped = items.reduce((acc, item) => {
    acc[item.category_name] = acc[item.category_name] || [];
    acc[item.category_name].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  };

  return (
    <div className="border p-3 rounded-md max-h-60 overflow-y-auto space-y-2">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <Label className="text-muted-foreground">{category}</Label>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 pl-2 cursor-pointer"
              onClick={() => toggle(item.id)}
            >
              <Checkbox checked={selected.includes(item.id)} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap gap-1 pt-2">
        {selected.map((id) => {
          const name = items.find((i) => i.id === id)?.name;
          return (
            <Badge key={id} variant="outline">
              {name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
