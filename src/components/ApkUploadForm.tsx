import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileUp, Loader2, CheckCircle, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface ApkUploadFormProps {
  onUploadSuccess: () => void;
}

export function ApkUploadForm({ onUploadSuccess }: ApkUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
      setIsUploading(false);
      setUploadProgress(0);
      Swal.fire({
        icon: "info",
        title: "Upload Dibatalkan",
        text: "Proses upload telah dibatalkan.",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  // Extract app name and version from filename
  const extractAppInfo = (fileName: string) => {
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.(apk|apks)$/i, "");
    
    // Try to extract version from common patterns like "AppName_v1.2.3" or "AppName-1.2.3" or "AppName 1.2.3"
    const versionPatterns = [
      /[_\-\s]v?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/i,  // AppName_v1.2.3 or AppName-1.2.3
      /[_\-\s](\d+\.\d+(?:\.\d+)?(?:\.\d+)?)$/i,   // AppName_1.2.3 at the end
    ];
    
    let version = "1.0";
    let appName = nameWithoutExt;
    
    for (const pattern of versionPatterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        version = match[1];
        // Remove version part from app name
        appName = nameWithoutExt.replace(pattern, "").trim();
        break;
      }
    }
    
    // Clean up app name: replace underscores/dashes with spaces, trim
    appName = appName.replace(/[_\-]+/g, " ").trim();
    
    // Capitalize first letter of each word
    appName = appName.replace(/\b\w/g, (c) => c.toUpperCase());
    
    return { appName, version };
  };

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
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".apk") && !fileName.endsWith(".apks")) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Only .apk and .apks files are allowed!",
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

    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please select an APK or APKS file to upload.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    // Extract app info from filename
    const { appName, version } = extractAppInfo(selectedFile.name);
    const description = `Android app package for ${appName}`;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${timestamp}_${sanitizedName}`;

      // Upload file to storage with progress tracking using XMLHttpRequest
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const uploadUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/apk-files/${filePath}`;
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });
        
        xhr.addEventListener("load", () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener("error", () => {
          xhrRef.current = null;
          reject(new Error("Upload failed"));
        });

        xhr.addEventListener("abort", () => {
          xhrRef.current = null;
          reject(new Error("Upload cancelled"));
        });
        
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
        xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");
        xhr.send(selectedFile);
      });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("apk-files")
        .getPublicUrl(filePath);

      const downloadUrl = urlData.publicUrl;

      // Save metadata to database
      const { error: dbError } = await supabase.from("apk_uploads").insert({
        app_name: appName,
        version: version,
        description: description,
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
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      onUploadSuccess();
    } catch (error: any) {
      // Don't show error for cancelled uploads
      if (error.message === "Upload cancelled") {
        return;
      }
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message || "An error occurred while uploading.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-card/40 backdrop-blur-sm rounded-2xl shadow-lg border border-border/30 p-6 md:p-8">
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
            <Label>APK/APKS File</Label>
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
                accept=".apk,.apks"
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
                      Drag & drop your APK/APKS file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse (max 500MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium text-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isUploading}
              className="flex-1 h-12 text-base font-semibold gradient-hero hover:opacity-90 transition-opacity"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload APK
                </>
              )}
            </Button>
            {isUploading && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelUpload}
                className="h-12 px-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-5 h-5 mr-1" />
                Batal
              </Button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
}
