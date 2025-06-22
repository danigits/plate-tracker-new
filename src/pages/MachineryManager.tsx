import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Machinery = {
  id: string;
  name: string;
  details: string;
  media_urls: string[];
};

export function MachineryManager() {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [machineryList, setMachineryList] = useState<Machinery[]>([]);
  const [selectedMachinery, setSelectedMachinery] = useState<Machinery | null>(
    null
  );
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail" | "new">("list");

  const kitchenId = profile?.kitchen_id;

  const fetchMachinery = async () => {
    if (!kitchenId) return;
    const { data, error } = await supabase
      .from("machinery")
      .select("*")
      .eq("kitchen_id", kitchenId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMachineryList(data);
    }
  };

  useEffect(() => {
    if (profile?.kitchen_id && viewMode === "list") {
      fetchMachinery();
    }
  }, [profile, viewMode]);

  const handleUpload = async () => {
    if (!kitchenId || !name || !details || !files) {
      alert("Please fill all fields and select at least one file");
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const filePath = `kitchen-${kitchenId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("machinery-media")
          .upload(filePath, file);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("machinery-media").getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const { error: insertError } = await supabase.from("machinery").insert({
        name,
        details,
        kitchen_id: kitchenId,
        media_urls: uploadedUrls,
      });

      if (insertError) throw insertError;

      alert("Machinery saved successfully!");
      setName("");
      setDetails("");
      setFiles(null);
      setViewMode("list");
      fetchMachinery();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const viewDetails = (machinery: Machinery) => {
    setSelectedMachinery(machinery);
    setSelectedMedia(machinery.media_urls?.[0] || null);
    setViewMode("detail");
  };

  if (viewMode === "detail" && selectedMachinery) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{selectedMachinery.name}</h1>
          <Button variant="outline" onClick={() => setViewMode("list")}>
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Media Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedMedia ? (
                <div className="rounded-lg overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                  {selectedMedia.endsWith(".mp4") ? (
                    <video controls className="w-full h-full">
                      <source src={selectedMedia} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={selectedMedia}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-gray-100 aspect-video flex items-center justify-center text-gray-500">
                  No media available
                </div>
              )}

              {selectedMachinery.media_urls?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {selectedMachinery.media_urls.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-16 h-16 rounded border cursor-pointer hover:shadow-md overflow-hidden"
                      onClick={() => setSelectedMedia(url)}
                    >
                      {url.endsWith(".mp4") ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img src={url} className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Name</h3>
                  <p>{selectedMachinery.name}</p>
                </div>
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="whitespace-pre-line">
                    {selectedMachinery.details}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (viewMode === "new") {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Add New Machinery</h1>
          <Button variant="outline" onClick={() => setViewMode("list")}>
            Back to List
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter machinery name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                placeholder="Enter machinery details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">Media Files</Label>
              <Input
                id="media"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
              <p className="text-sm text-muted-foreground">
                Upload images or videos of the machinery
              </p>
            </div>

            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Save Machinery"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Machinery Inventory</h1>
        <Button onClick={() => setViewMode("new")}>Add New Machinery</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Media Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machineryList.length > 0 ? (
                machineryList.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.details.substring(0, 50)}...
                    </TableCell>
                    <TableCell className="text-right">
                      {m.media_urls?.length || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDetails(m)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    No machinery added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const Label = ({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium leading-none">
    {children}
  </label>
);
