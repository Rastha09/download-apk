import { motion } from "framer-motion";
import { Download, Copy, Check, Calendar, HardDrive, Smartphone, Trash2, Package, Layers, BarChart3, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "@/integrations/supabase/client";
import { DownloadModal } from "@/components/DownloadModal";
import { ApkEditModal } from "@/components/ApkEditModal";
import { useDownloadCooldown } from "@/hooks/useDownloadCooldown";

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
  downloadCount: number;
  iconUrl?: string;
  onDelete?: () => void;
  onDownloadComplete?: () => void;
  onEdit?: () => void;
  showDelete?: boolean;
  isAdmin?: boolean;
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
  downloadCount,
  iconUrl,
  onDelete,
  onDownloadComplete,
  onEdit,
  showDelete = false,
  isAdmin = false,
}: ApkCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { checkCooldown, recordClick } = useDownloadCooldown();

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

  const handleDownloadClick = () => {
    setShowModal(true);
  };

  const handleConfirmDownload = async () => {
    const { allowed, remaining } = checkCooldown(id);
    if (!allowed) {
      setShowModal(false);
      Swal.fire({
        icon: "warning",
        title: "Mohon Tunggu",
        text: `Silakan tunggu ${remaining} detik sebelum mencoba kembali.`,
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      return;
    }

    recordClick(id);
    setIsRedirecting(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-safelink", {
        body: { apkId: id },
      });

      if (fnError || !data?.shortlink) {
        throw new Error(data?.error || "Gagal generate link");
      }

      window.location.href = data.shortlink;
    } catch (err: any) {
      console.error("Safelink generation error:", err);
      setIsRedirecting(false);
      setShowModal(false);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message || "Terjadi kesalahan saat menyiapkan link download.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
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
        const { error: storageError } = await supabase.storage
          .from("apk-files")
          .remove([filePath]);
        if (storageError) throw storageError;

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

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyalin",
        text: "Tidak bisa menyalin URL.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="group bg-card border border-border rounded hover:border-primary/50 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
      >
        <div className="p-4 md:p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="relative flex-shrink-0">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={`${appName} icon`}
                  className="w-11 h-11 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`w-11 h-11 rounded bg-secondary flex items-center justify-center ${
                  iconUrl ? "hidden" : ""
                }`}
              >
                <Smartphone className="w-5 h-5 text-accent" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate uppercase tracking-wide">{appName}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded border border-accent/40 text-[10px] font-bold font-mono text-accent uppercase">
                  v{version}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    fileName.toLowerCase().endsWith(".apks")
                      ? "bg-accent/20 text-accent"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  {fileName.toLowerCase().endsWith(".apks") ? "APKS" : "APK"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">{formatFileSize(fileSize)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 font-mono">{description}</p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-4 flex-wrap font-mono">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>{downloadCount.toLocaleString("id-ID")} ⬇</span>
            </div>
          </div>

          {/* Admin: APK URL (readonly + copy) */}
          {isAdmin && (
            <div className="mb-3 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider">
                APK URL
              </label>
              <div className="flex gap-1.5">
                <Input
                  readOnly
                  value={downloadUrl}
                  className="h-8 text-[10px] bg-secondary font-mono rounded border-border"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  className="h-8 w-8 flex-shrink-0 rounded"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadClick}
              disabled={deleting}
              className="flex-1 h-10 font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground hover:glow-pulse rounded transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setShowEditModal(true)}
                disabled={deleting}
                className="h-10 px-3 rounded"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {showDelete && (
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="outline"
                className="h-10 px-3 rounded border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className={`w-4 h-4 ${deleting ? "animate-pulse" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Download Confirmation Modal */}
      <DownloadModal
        isOpen={showModal}
        appName={appName}
        isLoading={isRedirecting}
        onConfirm={handleConfirmDownload}
        onCancel={() => {
          if (!isRedirecting) setShowModal(false);
        }}
      />

      {/* Edit Modal (Admin) */}
      <ApkEditModal
        isOpen={showEditModal}
        apkId={id}
        appName={appName}
        currentDescription={description}
        currentIconUrl={iconUrl}
        onClose={() => setShowEditModal(false)}
        onSave={() => {
          onEdit?.();
        }}
      />
    </>
  );
}
