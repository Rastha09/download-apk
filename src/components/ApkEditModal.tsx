import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ImagePlus, Link2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface ApkEditModalProps {
  isOpen: boolean;
  apkId: string;
  appName: string;
  currentIconUrl?: string;
  currentLinkvertiseUrls?: string[];
  onClose: () => void;
  onSave: () => void;
}

export function ApkEditModal({
  isOpen,
  apkId,
  appName,
  currentIconUrl,
  currentLinkvertiseUrls = [],
  onClose,
  onSave,
}: ApkEditModalProps) {
  const [linkvertiseUrl1, setLinkvertiseUrl1] = useState(currentLinkvertiseUrls[0] || "");
  const [linkvertiseUrl2, setLinkvertiseUrl2] = useState(currentLinkvertiseUrls[1] || "");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(currentIconUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Format Tidak Valid",
        text: "Hanya file gambar (PNG, JPG, WebP, GIF) yang diizinkan.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File Terlalu Besar",
        text: "Ukuran ikon maksimal 5MB.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    setIconFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setIconPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!linkvertiseUrl1.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Linkvertise URL Wajib",
        text: "Masukkan minimal URL Linkvertise #1.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    setIsSaving(true);

    try {
      const updateData: Record<string, any> = {};

      // Upload new icon if selected
      if (iconFile) {
        const timestamp = Date.now();
        const ext = iconFile.name.split(".").pop() || "png";
        const iconPath = `icons/${apkId}_${timestamp}.${ext}`;

        const { error: iconError } = await supabase.storage
          .from("apk-files")
          .upload(iconPath, iconFile, {
            contentType: iconFile.type,
            upsert: true,
          });

        if (iconError) throw iconError;

        const { data: iconUrlData } = supabase.storage
          .from("apk-files")
          .getPublicUrl(iconPath);

        updateData.icon_url = iconUrlData.publicUrl;
      }

      // Build Linkvertise URLs array
      const linkvertiseUrls = [linkvertiseUrl1.trim(), linkvertiseUrl2.trim()].filter(
        (url) => url !== ""
      );
      updateData.linkvertise_urls = linkvertiseUrls;

      // Update database
      const { error: dbError } = await supabase
        .from("apk_uploads")
        .update(updateData)
        .eq("id", apkId);

      if (dbError) throw dbError;

      Swal.fire({
        icon: "success",
        title: "Tersimpan!",
        text: "Data APK berhasil diperbarui.",
        timer: 1500,
        showConfirmButton: false,
      });

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error updating APK:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: error.message || "Terjadi kesalahan saat menyimpan.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-1 w-full gradient-hero" />

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Edit {appName}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-5">
                {/* Icon Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4" />
                    Ikon / Logo APK
                  </Label>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-muted/30"
                    >
                      {iconPreview ? (
                        <img
                          src={iconPreview}
                          alt="Icon preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Klik untuk upload ikon baru
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WebP, GIF (max 5MB)
                      </p>
                      {iconFile && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-primary font-medium truncate max-w-[150px]">
                            {iconFile.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIconFile(null);
                              setIconPreview(currentIconUrl || null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleIconSelect}
                    className="hidden"
                  />
                </div>

                {/* Linkvertise URLs */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Linkvertise URLs
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Link Linkvertise #1 (wajib)"
                      value={linkvertiseUrl1}
                      onChange={(e) => setLinkvertiseUrl1(e.target.value)}
                      disabled={isSaving}
                      className="h-10"
                    />
                    <Input
                      placeholder="Link Linkvertise #2 (opsional)"
                      value={linkvertiseUrl2}
                      onChange={(e) => setLinkvertiseUrl2(e.target.value)}
                      disabled={isSaving}
                      className="h-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL Linkvertise #1 wajib diisi agar tombol download aktif.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 h-11 font-semibold gradient-hero hover:opacity-90 transition-opacity"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Simpan
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                    className="h-11 px-5"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
