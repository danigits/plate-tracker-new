import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Download, Pencil } from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
};

const MenuListAndEditor = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchMenuItems = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, category_id, menu_categories(name)");

      if (error) {
        toast({ title: "Error", description: error.message });
      } else {
        const formatted = data.map((item) => ({
          id: item.id,
          name: item.name,
          category_id: item.category_id,
          category_name: item.menu_categories?.name || "Unknown",
        }));
        setMenuItems(formatted);
        setFilteredItems(formatted);
      }
    };

    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredItems(menuItems);
    } else {
      const lower = search.toLowerCase();
      setFilteredItems(
        menuItems.filter(
          (item) =>
            item.name.toLowerCase().includes(lower) ||
            item.category_name?.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, menuItems]);

  const exportToCSV = () => {
    const header = ["Name", "Category"];
    const rows = filteredItems.map((item) => [item.name, item.category_name]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "menu_items.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Menu Items</CardTitle>
        <Button onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search menu items or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category_name}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => console.log("Edit:", item.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MenuListAndEditor;
