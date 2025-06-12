import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  camera?: any; // optional, for edit
  triggerLabel: string;
  onRefresh: () => void;
};

const CCTVFormDialog: React.FC<Props> = ({
  camera,
  triggerLabel,
  onRefresh,
}) => {
  const [open, setOpen] = useState(false);
  const [kitchens, setKitchens] = useState([]);
  const [form, setForm] = useState({
    kitchen_id: "",
    name: "",
    stream_url: "",
    supports_audio: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchKitchens = async () => {
      const { data } = await supabase.from("kitchens").select("id, name");
      setKitchens(data || []);
    };
    fetchKitchens();
  }, []);

  useEffect(() => {
    if (camera) {
      setForm({
        kitchen_id: camera.kitchen_id,
        name: camera.name,
        stream_url: camera.stream_url,
        supports_audio: camera.supports_audio,
      });
    }
  }, [camera]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.kitchen_id || !form.name || !form.stream_url) {
      toast({ title: "All fields are required" });
      return;
    }

    if (camera) {
      // UPDATE
      const { error } = await supabase
        .from("kitchen_cameras")
        .update(form)
        .eq("id", camera.id);
      if (error) {
        toast({ title: "Error updating camera" });
      } else {
        toast({ title: "Camera updated" });
        setOpen(false);
        onRefresh();
      }
    } else {
      // INSERT
      const { error } = await supabase.from("kitchen_cameras").insert(form);
      if (error) {
        toast({ title: "Error adding camera" });
      } else {
        toast({ title: "Camera added" });
        setOpen(false);
        onRefresh();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={camera ? "outline" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {camera ? "Edit CCTV Camera" : "Add CCTV Camera"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Select
            value={form.kitchen_id}
            onValueChange={(val) => handleChange("kitchen_id", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Kitchen" />
            </SelectTrigger>
            <SelectContent>
              {kitchens.map((k: any) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Camera Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <Input
            placeholder="Stream URL"
            value={form.stream_url}
            onChange={(e) => handleChange("stream_url", e.target.value)}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={form.supports_audio}
              onCheckedChange={(val) =>
                handleChange("supports_audio", val as boolean)
              }
            />
            <label className="text-sm">Supports Audio (Two-way)</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{camera ? "Update" : "Add"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CCTVFormDialog;
