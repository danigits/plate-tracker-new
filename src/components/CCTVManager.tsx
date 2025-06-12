import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Kitchen = { id: string; name: string };
type Camera = {
  id: string;
  name: string;
  stream_url: string;
  kitchen_id: string;
  kitchen_name?: string;
};

const CCTVManager: React.FC = () => {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [filteredKitchen, setFilteredKitchen] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    stream_url: "",
    kitchen_id: "",
  });

  useEffect(() => {
    fetchKitchens();
    fetchCameras();
  }, []);

  const fetchKitchens = async () => {
    const { data, error } = await supabase.from("kitchens").select("id, name");
    if (data) setKitchens(data);
    else console.error(error);
  };

  const fetchCameras = async () => {
    const { data, error } = await supabase
      .from("kitchen_cameras")
      .select("*, kitchens(name)");
    if (data) {
      const mapped = data.map((cam) => ({
        ...cam,
        kitchen_name: cam.kitchens?.name || "",
      }));
      setCameras(mapped);
    } else console.error(error);
  };

  const handleSave = async () => {
    const { name, stream_url, kitchen_id } = formData;
    if (!name || !stream_url || !kitchen_id) return;

    if (editingCamera) {
      await supabase
        .from("kitchen_cameras")
        .update({
          name,
          stream_url,
          kitchen_id,
        })
        .eq("id", editingCamera.id);
    } else {
      await supabase.from("cctv_cameras").insert({
        name,
        stream_url,
        kitchen_id,
      });
    }

    setFormData({ name: "", stream_url: "", kitchen_id: "" });
    setEditingCamera(null);
    setDialogOpen(false);
    fetchCameras();
  };

  const handleEdit = (camera: Camera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      stream_url: camera.stream_url,
      kitchen_id: camera.kitchen_id,
    });
    setDialogOpen(true);
  };

  const filteredCameras = filteredKitchen
    ? cameras.filter((cam) => cam.kitchen_id === filteredKitchen)
    : cameras;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <Select
          onValueChange={(val) => setFilteredKitchen(val)}
          value={filteredKitchen}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Kitchen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Kitchens</SelectItem>
            {kitchens.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCamera(null);
                setFormData({ name: "", stream_url: "", kitchen_id: "" });
              }}
            >
              Add CCTV
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCamera ? "Edit CCTV" : "Add CCTV"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Camera name"
                />
              </div>
              <div>
                <Label>Stream URL</Label>
                <Input
                  value={formData.stream_url}
                  onChange={(e) =>
                    setFormData({ ...formData, stream_url: e.target.value })
                  }
                  placeholder="https://example.com/stream"
                />
              </div>
              <div>
                <Label>Kitchen</Label>
                <Select
                  value={formData.kitchen_id}
                  onValueChange={(val) =>
                    setFormData({ ...formData, kitchen_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Kitchen" />
                  </SelectTrigger>
                  <SelectContent>
                    {kitchens.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full mt-2" onClick={handleSave}>
                {editingCamera ? "Update Camera" : "Add Camera"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCameras.map((cam) => (
          <Card key={cam.id}>
            <CardHeader>
              <CardTitle>{cam.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {cam.kitchen_name}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <video
                src={cam.stream_url}
                controls
                className="w-full h-[200px] object-cover rounded"
              />
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => alert(`Speak to ${cam.name}`)}
                >
                  🎤 Speak
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(cam.stream_url, "_blank")}
                >
                  ⛶ Maximize
                </Button>
                <Button variant="ghost" onClick={() => handleEdit(cam)}>
                  ✎ Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CCTVManager;
