import { motion } from "framer-motion";
import { Download, Copy, Check, Calendar, HardDrive, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Swal from "sweetalert2";

interface ApkCardProps {
  id: string;
  appName: string;
  version: string;
  description: string;
  fileName: string;
  downloadUrl: string;
  fileSize?: number;
  createdAt: string;
  index: number;
}

export function ApkCard({
  appName,
  version,
  description,
  fileName,
  downloadUrl,
  fileSize,
  createdAt,
  index,
}: ApkCardProps) {
  const [copied, setCopied] = useState(false);

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

  const handleDownload = () => {
    // Create a temporary anchor element for direct download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          className="w-full h-11 font-semibold gradient-success hover:opacity-90 transition-opacity"
        >
          <Download className="w-5 h-5 mr-2" />
          Download APK
        </Button>
      </div>
    </motion.div>
  );
}
