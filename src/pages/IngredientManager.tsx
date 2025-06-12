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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { Ingredient } from "@/types/kitchen";

const IngredientManager: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    unit: "",
    image_url: "",
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");
    if (error) console.error(error);
    else setIngredients(data);
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleAdd = async () => {
    if (!newIngredient.name.trim() || !newIngredient.unit.trim()) return;
    const imageUrl = newImageUrl.trim();

    const { error } = await supabase
      .from("ingredients")
      .insert([{ ...newIngredient, image_url: imageUrl }]);
    if (!error) {
      setNewIngredient({ name: "", unit: "", image_url: "" });
      setNewImageUrl("");
      fetchIngredients();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (!error) fetchIngredients();
  };

  const handleUpdate = async () => {
    if (!editIngredient) return;
    const { error } = await supabase
      .from("ingredients")
      .update({
        name: editIngredient.name,
        unit: editIngredient.unit,
      })
      .eq("id", editIngredient.id);

    if (!error) {
      setEditIngredient(null);
      fetchIngredients();
    }
  };

  const filtered = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Manage Ingredients</h2>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Name"
          value={newIngredient.name}
          onChange={(e) =>
            setNewIngredient({ ...newIngredient, name: e.target.value })
          }
        />
        <Input
          placeholder="Unit"
          value={newIngredient.unit}
          onChange={(e) =>
            setNewIngredient({ ...newIngredient, unit: e.target.value })
          }
        />
        <Input
          type="url"
          placeholder="Image URL (optional)"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          className="sm:w-72"
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>

      <div className="flex gap-2 mt-4">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((ingredient) => (
            <TableRow key={ingredient.id}>
              <TableCell>
                {ingredient.image_url ? (
                  <img
                    src={ingredient.image_url}
                    alt={ingredient.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <span className="text-gray-400 italic">No image</span>
                )}
              </TableCell>
              <TableCell>{ingredient.name}</TableCell>
              <TableCell>{ingredient.unit}</TableCell>
              <TableCell className="text-right space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditIngredient(ingredient)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Ingredient</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Input
                        value={editIngredient?.name || ""}
                        onChange={(e) =>
                          setEditIngredient(
                            (prev) => prev && { ...prev, name: e.target.value }
                          )
                        }
                      />
                      <Input
                        value={editIngredient?.unit || ""}
                        onChange={(e) =>
                          setEditIngredient(
                            (prev) => prev && { ...prev, unit: e.target.value }
                          )
                        }
                      />
                      <Button onClick={handleUpdate}>Update</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDelete(ingredient.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6">
                No ingredients found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default IngredientManager;
