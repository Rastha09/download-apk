import { motion } from "framer-motion";
import { Download, Copy, Check, Calendar, HardDrive, Smartphone, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from "react";
import Swal from "sweetalert2";
import { supabase } from "@/integrations/supabase/client";

interface ApkCardProps {
  id: string;
  appName: string;
  version: string;
  description: string;
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSize?: number;
  createdAt: string;
  index: number;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function ApkCard({
  id,
  appName,
  version,
  description,
  fileName,
  filePath,
  downloadUrl,
  fileSize,
  createdAt,
  index,
  onDelete,
  showDelete = false,
}: ApkCardProps) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setDownloading(false);
      setDownloadProgress(0);
      Swal.fire({
        icon: "info",
        title: "Download Dibatalkan",
        text: "Proses download telah dibatalkan.",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      Swal.fire({
        icon: "success",
        title: "Link Copied!",
        text: "Download link has been copied to clipboard.",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Copy Failed",
        text: "Could not copy link to clipboard.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadProgress(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(downloadUrl, { signal: controller.signal });
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        received += value.length;

        if (total > 0) {
          const percentComplete = Math.round((received / total) * 100);
          setDownloadProgress(percentComplete);
        }
      }

      abortControllerRef.current = null;

      // Combine chunks into a single Blob
      const blob = new Blob(chunks as BlobPart[], { type: "application/vnd.android.package-archive" });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Download Complete!",
        text: `${appName} has been downloaded.`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (error: any) {
      abortControllerRef.current = null;
      // Don't show error for cancelled downloads
      if (error.name === "AbortError") {
        return;
      }
      console.error("Download error:", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Could not download the file. Please try again.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Hapus APK?",
      text: `Apakah Anda yakin ingin menghapus "${appName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "hsl(0 84.2% 60.2%)",
      cancelButtonColor: "hsl(var(--muted))",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        // Delete file from storage
        const { error: storageError } = await supabase.storage
          .from("apk-files")
          .remove([filePath]);

        if (storageError) throw storageError;

        // Delete record from database
        const { error: dbError } = await supabase
          .from("apk_uploads")
          .delete()
          .eq("id", id);

        if (dbError) throw dbError;

        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "APK berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false,
        });

        onDelete?.();
      } catch (error) {
        console.error("Error deleting APK:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Menghapus",
          text: "Terjadi kesalahan saat menghapus APK.",
          confirmButtonColor: "hsl(145 65% 42%)",
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0 shadow-glow">
            <Smartphone className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">{appName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                v{version}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(fileSize)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{fileName}</span>
          </div>
        </div>

        {/* Download Link */}
        <div className="bg-muted rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={downloadUrl}
              readOnly
              className="flex-1 bg-transparent text-xs text-muted-foreground truncate border-none outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 px-2 hover:bg-background"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Download Progress */}
        {downloading && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Downloading...</span>
              <span className="font-medium text-foreground">{downloadProgress}%</span>
            </div>
            <Progress value={downloadProgress} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {downloading ? (
            <Button
              onClick={handleCancelDownload}
              variant="outline"
              className="flex-1 h-11 font-semibold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-5 h-5 mr-2" />
              Batalkan ({downloadProgress}%)
            </Button>
          ) : (
            <Button
              onClick={handleDownload}
              disabled={deleting}
              className="flex-1 h-11 font-semibold gradient-success hover:opacity-90 transition-opacity"
            >
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>
          )}
          {showDelete && (
            <Button
              onClick={handleDelete}
              disabled={deleting || downloading}
              variant="outline"
              className="h-11 px-3 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className={`w-5 h-5 ${deleting ? "animate-pulse" : ""}`} />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
