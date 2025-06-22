import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function BulkUploadStaff({ kitchenId }: { kitchenId: string }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        const rows = results.data.map((row: any) => ({
          kitchen_id: kitchenId,
          full_name: row.full_name,
          role: row.role,
          phone: row.phone,
        }));
        const { error } = await supabase.from("kitchen_staff").insert(rows);
        setUploading(false);
        if (error) {
          alert("Upload failed: " + error.message);
        } else {
          alert("Staff uploaded successfully!");
        }
      },
    });
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      { full_name: "Ramesh Kumar", role: "Chef", phone: "9876543210" },
      { full_name: "Kavita Sharma", role: "Cutter", phone: "9876543222" },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample Staff");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "csv",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "sample_staff_upload.csv");
  };

  return (
    <div className="p-4 border rounded-xl space-y-2">
      <label className="block font-medium">Upload CSV File</label>
      <Input type="file" accept=".csv" onChange={handleFileChange} />
      <Button disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Staff"}
      </Button>
      <Button variant="outline" onClick={downloadSampleCSV}>
        📄 Download Sample CSV
      </Button>
    </div>
  );
}
