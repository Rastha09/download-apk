import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ImagePlus, Save, Trash2, Plus, Link2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface ApkEditModalProps {
  isOpen: boolean;
  apkId: string;
  appName: string;
  currentDescription?: string;
  currentIconUrl?: string;
  currentLinkvertiseUrls?: string[];
  onClose: () => void;
  onSave: () => void;
}

export function ApkEditModal({
  isOpen,
  apkId,
  appName,
  currentDescription = "",
  currentIconUrl,
  currentLinkvertiseUrls = [],
  onClose,
  onSave,
}: ApkEditModalProps) {
  const [description, setDescription] = useState(currentDescription);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(currentIconUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [slugs, setSlugs] = useState<{ id: string; slug: string }[]>([]);
  const [newSlug, setNewSlug] = useState("");
  const [loadingSlugs, setLoadingSlugs] = useState(false);
  const [linkvertiseUrl1, setLinkvertiseUrl1] = useState(currentLinkvertiseUrls[0] || "");
  const [linkvertiseUrl2, setLinkvertiseUrl2] = useState(currentLinkvertiseUrls[1] || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription(currentDescription);
      setIconPreview(currentIconUrl || null);
      setLinkvertiseUrl1(currentLinkvertiseUrls[0] || "");
      setLinkvertiseUrl2(currentLinkvertiseUrls[1] || "");
      setIconFile(null);
      fetchSlugs();
    }
  }, [isOpen]);

  const fetchSlugs = async () => {
    setLoadingSlugs(true);
    const { data } = await supabase
      .from("apk_redirects")
      .select("id, slug")
      .eq("apk_id", apkId)
      .order("created_at", { ascending: true });
    setSlugs(data || []);
    setLoadingSlugs(false);
  };

  const handleAddSlug = async () => {
    const trimmed = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("apk_redirects")
      .insert({ apk_id: apkId, slug: trimmed })
      .select("id, slug")
      .single();

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.message.includes("duplicate") ? "Slug sudah digunakan." : error.message,
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    setSlugs((prev) => [...prev, data]);
    setNewSlug("");
  };

  const handleDeleteSlug = async (slugId: string) => {
    await supabase.from("apk_redirects").delete().eq("id", slugId);
    setSlugs((prev) => prev.filter((s) => s.id !== slugId));
  };

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      Swal.fire({ icon: "error", title: "Format Tidak Valid", text: "Hanya PNG, JPG, WebP, GIF.", confirmButtonColor: "hsl(145 65% 42%)" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File Terlalu Besar", text: "Maks 5MB.", confirmButtonColor: "hsl(145 65% 42%)" });
      return;
    }

    setIconFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setIconPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: Record<string, any> = {
        description: description.trim(),
      };

      if (iconFile) {
        const ext = iconFile.name.split(".").pop() || "png";
        const iconPath = `icons/${apkId}_${Date.now()}.${ext}`;
        const { error: iconError } = await supabase.storage
          .from("apk-files")
          .upload(iconPath, iconFile, { contentType: iconFile.type, upsert: true });
        if (iconError) throw iconError;
        const { data: iconUrlData } = supabase.storage.from("apk-files").getPublicUrl(iconPath);
        updateData.icon_url = iconUrlData.publicUrl;
      }

      // Save linkvertise URLs
      const linkvertiseUrls = [linkvertiseUrl1.trim(), linkvertiseUrl2.trim()].filter(u => u !== "");
      updateData.linkvertise_urls = linkvertiseUrls.length > 0 ? linkvertiseUrls : null;

      const { error: dbError } = await supabase.from("apk_uploads").update(updateData).eq("id", apkId);
      if (dbError) throw dbError;

      Swal.fire({ icon: "success", title: "Tersimpan!", timer: 1500, showConfirmButton: false });
      onSave();
      onClose();
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Gagal Menyimpan", text: error.message, confirmButtonColor: "hsl(145 65% 42%)" });
    } finally {
      setIsSaving(false);
    }
  };

  const domain = window.location.origin;

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
            className="relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="h-1 w-full gradient-hero" />
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Edit {appName}</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
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
                        <img src={iconPreview} alt="Icon preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Klik untuk upload ikon baru</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, GIF (max 5MB)</p>
                      {iconFile && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-primary font-medium truncate max-w-[150px]">{iconFile.name}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setIconFile(null); setIconPreview(currentIconUrl || null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleIconSelect} className="hidden" />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Deskripsi APK (opsional)
                  </Label>
                  <Textarea
                    placeholder="Jelaskan fitur atau catatan aplikasi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {/* Redirect Slug Management */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Redirect Slugs
                  </Label>
                  {loadingSlugs ? (
                    <p className="text-xs text-muted-foreground">Memuat...</p>
                  ) : slugs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Belum ada redirect slug</p>
                  ) : (
                    <div className="space-y-2">
                      {slugs.map((s) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <Input readOnly value={`${domain}/go/${s.slug}`} className="h-9 text-xs bg-muted/50 font-mono flex-1" />
                          <Button variant="outline" size="icon" onClick={() => handleDeleteSlug(s.id)} className="h-9 w-9 flex-shrink-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="slug-baru (huruf kecil, angka, strip)"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSlug()}
                      disabled={isSaving}
                      className="h-9 text-sm flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={handleAddSlug} disabled={!newSlug.trim() || isSaving} className="h-9 w-9 flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Linkvertise URLs */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Linkvertise URLs
                  </Label>
                  <div className="space-y-2">
                    <Input placeholder="Link Linkvertise #1" value={linkvertiseUrl1} onChange={(e) => setLinkvertiseUrl1(e.target.value)} disabled={isSaving} className="h-10" />
                    <Input placeholder="Link Linkvertise #2 (opsional)" value={linkvertiseUrl2} onChange={(e) => setLinkvertiseUrl2(e.target.value)} disabled={isSaving} className="h-10" />
                  </div>
                  <p className="text-xs text-muted-foreground">Isi minimal 1 agar tombol download aktif untuk publik.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-11 font-semibold gradient-hero hover:opacity-90 transition-opacity">
                    {isSaving ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Menyimpan...</>) : (<><Save className="w-5 h-5 mr-2" />Simpan</>)}
                  </Button>
                  <Button variant="outline" onClick={onClose} disabled={isSaving} className="h-11 px-5">Batal</Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
