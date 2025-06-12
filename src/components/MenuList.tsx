import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useRouter } from "next/router";
import { useToast } from "@/components/ui/use-toast";
import { Save, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
const MenuList = () => {
  const { toast } = useToast();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenuItems = async () => {
      const { data, error } = await supabase.from("menu_items").select(`
          id, name,
          menu_categories (name),
          menu_item_ingredients (
            per_serving_qty,
            ingredients (name, unit)
          )
        `);

      if (error) {
        toast({ title: "Error", description: error.message });
      } else {
        setMenuItems(data || []);
      }
    };

    fetchMenuItems();
  }, []);

  useEffect(() => {
    const filtered = menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, menuItems]);

  const exportToCSV = () => {
    if (filteredItems.length === 0) return;

    const rows = filteredItems.map((item) => ({
      Name: item.name,
      Category: item.menu_categories?.name || "",
      Ingredients: item.menu_item_ingredients
        ?.map(
          (i) =>
            `${i.ingredients?.name || ""} (${i.per_serving_qty} ${
              i.ingredients?.unit || ""
            })`
        )
        .join("; "),
    }));

    const csvHeader = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((r) =>
      Object.values(r)
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "menu_items.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <Button onClick={() => navigate(`/edit-menu/${item.id}`)}>Edit</Button>
      <div className="flex justify-between items-center gap-4">
        <Input
          placeholder="Search menu item by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Save className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Ingredients</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.menu_categories?.name || "-"}</TableCell>
              <TableCell>
                {item.menu_item_ingredients
                  ?.map(
                    (i) =>
                      `${i.ingredients?.name || ""} (${i.per_serving_qty} ${
                        i.ingredients?.unit || ""
                      })`
                  )
                  .join(", ")}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/edit-menu/${item.id}`)}
                  className="flex items-center gap-1"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MenuList;
