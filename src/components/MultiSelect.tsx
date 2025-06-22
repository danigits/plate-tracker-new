import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export const MultiSelect = ({
  items,
  selected,
  onChange,
  placeholder = "Select items",
}: {
  items: { id: string; name: string; category_name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const grouped = items
    .filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase().trim())
    )
    .reduce((acc, item) => {
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

  const selectAllInCategory = (category: string) => {
    const ids = grouped[category].map((i) => i.id);
    const merged = Array.from(new Set([...selected, ...ids]));
    onChange(merged);
  };

  const clearAllInCategory = (category: string) => {
    const ids = grouped[category].map((i) => i.id);
    onChange(selected.filter((id) => !ids.includes(id)));
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </Button>
      </Popover.Trigger>

      <Popover.Content
        className="bg-white border rounded-md p-4 shadow-lg w-80 max-h-96 overflow-y-auto z-50"
        sideOffset={8}
      >
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2"
        />

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs text-muted-foreground">
                {category}
              </Label>
              <div className="text-xs space-x-1">
                <button onClick={() => selectAllInCategory(category)}>
                  Select
                </button>
                <span>|</span>
                <button onClick={() => clearAllInCategory(category)}>
                  Clear
                </button>
              </div>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 pl-2 py-1 cursor-pointer"
                onClick={() => toggle(item.id)}
              >
                <Checkbox checked={selected.includes(item.id)} />
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        ))}

        {selected.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1">
            {selected.map((id) => {
              const name = items.find((i) => i.id === id)?.name;
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => toggle(id)}
                >
                  {name} ✕
                </Badge>
              );
            })}
          </div>
        )}
      </Popover.Content>
    </Popover.Root>
  );
};
