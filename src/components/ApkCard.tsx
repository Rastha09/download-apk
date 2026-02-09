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
  linkvertiseUrls?: string[];
  onDelete?: () => void;
  onDownloadComplete?: () => void;
  onEdit?: () => void;
  showDelete?: boolean;
  isAdmin?: boolean;
}

const ROTATION_KEY_PREFIX = "apk_link_rotation_";

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
  linkvertiseUrls = [],
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

  const hasLinkvertise = linkvertiseUrls && linkvertiseUrls.length > 0 && linkvertiseUrls[0]?.trim() !== "";

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

  const getNextLinkvertiseUrl = (): string | null => {
    if (!linkvertiseUrls || linkvertiseUrls.length === 0) return null;
    const rotationKey = ROTATION_KEY_PREFIX + id;
    const lastIndex = parseInt(localStorage.getItem(rotationKey) || "-1", 10);
    const nextIndex = (lastIndex + 1) % linkvertiseUrls.length;
    localStorage.setItem(rotationKey, String(nextIndex));
    return linkvertiseUrls[nextIndex];
  };

  const handleDownloadClick = () => {
    if (!hasLinkvertise) return;
    setShowModal(true);
  };

  const handleConfirmDownload = () => {
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

    const targetUrl = getNextLinkvertiseUrl();
    if (!targetUrl) {
      setIsRedirecting(false);
      setShowModal(false);
      return;
    }

    setTimeout(async () => {
      window.open(targetUrl, "_blank");
      try {
        await supabase.rpc("increment_download_count", { apk_id: id });
        onDownloadComplete?.();
      } catch (error) {
        console.error("Error incrementing download count:", error);
      }
      setIsRedirecting(false);
      setShowModal(false);
    }, 1800);
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
        className="group bg-card/40 backdrop-blur-sm rounded-2xl border border-border/30 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={`${appName} icon`}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0 shadow-glow ${
                  iconUrl ? "hidden" : ""
                }`}
              >
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              {/* File type badge */}
              <div
                className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-0.5 ${
                  fileName.toLowerCase().endsWith(".apks")
                    ? "bg-purple-500 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {fileName.toLowerCase().endsWith(".apks") ? (
                  <>
                    <Layers className="w-2.5 h-2.5" />
                    <span>S</span>
                  </>
                ) : (
                  <Package className="w-2.5 h-2.5" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground truncate">{appName}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  v{version}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    fileName.toLowerCase().endsWith(".apks")
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  }`}
                >
                  {fileName.toLowerCase().endsWith(".apks") ? "APKS Bundle" : "APK"}
                </span>
                <span className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{fileName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{downloadCount.toLocaleString("id-ID")} download</span>
            </div>
          </div>

          {/* Admin: APK URL (readonly + copy) */}
          {isAdmin && (
            <div className="mb-4 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                APK URL (Admin Only)
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={downloadUrl}
                  className="h-9 text-xs bg-muted/50 font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  className="h-9 w-9 flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Linkvertise status badge (admin only) */}
          {isAdmin && !hasLinkvertise && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-medium">
                ⚠ Linkvertise belum dikonfigurasi. Tombol download nonaktif untuk user publik.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Download button: disabled/hidden if no Linkvertise for public users */}
            {isAdmin ? (
              <>
                <Button
                  onClick={handleDownloadClick}
                  disabled={deleting || !hasLinkvertise}
                  className="flex-1 h-11 font-semibold gradient-success hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {hasLinkvertise ? "Download" : "Download (Nonaktif)"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  disabled={deleting}
                  className="h-11 px-3"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            ) : hasLinkvertise ? (
              <Button
                onClick={handleDownloadClick}
                disabled={deleting}
                className="flex-1 h-11 font-semibold gradient-success hover:opacity-90 transition-opacity"
              >
                <Download className="w-5 h-5 mr-2" />
                Download
              </Button>
            ) : null}

            {showDelete && (
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="outline"
                className="h-11 px-3 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className={`w-5 h-5 ${deleting ? "animate-pulse" : ""}`} />
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
        currentIconUrl={iconUrl}
        currentLinkvertiseUrls={linkvertiseUrls}
        onClose={() => setShowEditModal(false)}
        onSave={() => onEdit?.()}
      />
    </>
  );
}
