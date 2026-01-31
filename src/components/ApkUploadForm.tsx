import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileUp, Loader2, CheckCircle, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface ApkUploadFormProps {
  onUploadSuccess: () => void;
}

export function ApkUploadForm({ onUploadSuccess }: ApkUploadFormProps) {
  const [appName, setAppName] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith(".apk")) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Only .apk files are allowed!",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    // Check file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Maximum file size is 500MB!",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appName.trim() || !version.trim() || !description.trim() || !selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in all fields and select an APK file.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${timestamp}_${sanitizedName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("apk-files")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("apk-files")
        .getPublicUrl(filePath);

      const downloadUrl = urlData.publicUrl;

      // Save metadata to database
      const { error: dbError } = await supabase.from("apk_uploads").insert({
        app_name: appName.trim(),
        version: version.trim(),
        description: description.trim(),
        file_name: selectedFile.name,
        file_path: filePath,
        download_url: downloadUrl,
        file_size: selectedFile.size,
      });

      if (dbError) throw dbError;

      // Success!
      Swal.fire({
        icon: "success",
        title: "Upload Successful!",
        text: "Your APK has been uploaded successfully.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });

      // Reset form
      setAppName("");
      setVersion("");
      setDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      onUploadSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message || "An error occurred while uploading.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Upload APK</h2>
            <p className="text-sm text-muted-foreground">Share your Android app with the world</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="appName">App Name</Label>
            <Input
              id="appName"
              placeholder="e.g., My Amazing App"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              disabled={isUploading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              placeholder="e.g., 1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              disabled={isUploading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your app..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>APK File</Label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-success bg-success/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <FileUp className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Drag & drop your APK file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse (max 500MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isUploading}
            className="w-full h-12 text-base font-semibold gradient-hero hover:opacity-90 transition-opacity"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload APK
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
