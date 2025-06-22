// MachineryUploadForm.tsx
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MachineryUploadForm() {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const handleUpload = async () => {
    if (!profile?.kitchen_id || !name || !details || !files) {
      alert("Fill all fields");
      return;
    }

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(`kitchen-${profile.kitchen_id}/${file.name}`, file);

      if (error) {
        alert("Upload failed: " + error.message);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(`kitchen-${profile.kitchen_id}/${file.name}`);

      uploadedUrls.push(publicUrl?.publicUrl || "");
    }

    await supabase.from("machinery").insert({
      name,
      details,
      kitchen_id: profile.kitchen_id,
      media_urls: uploadedUrls,
    });

    alert("Machinery saved");
    setName("");
    setDetails("");
    setFiles(null);
  };

  return (
    <div className="p-4 space-y-4 border rounded shadow-md">
      <h2 className="text-lg font-semibold">Upload Machinery</h2>
      <Input
        placeholder="Machinery Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => setFiles(e.target.files)}
      />
      <Button onClick={handleUpload}>Save</Button>
    </div>
  );
}
