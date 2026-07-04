import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, Trash2, Video as VideoIcon, X, PlayCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  storage_path: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

const MAX_MB = 200;

export default function TutorialPage() {
  const { isAdmin } = useAuth();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchTutorials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setTutorials(data as Tutorial[]);
      // Generate signed URLs for all
      const urlMap: Record<string, string> = {};
      await Promise.all(
        (data as Tutorial[]).map(async (t) => {
          if (t.storage_path) {
            const { data: signed } = await supabase.storage
              .from("tutorial-videos")
              .createSignedUrl(t.storage_path, 3600);
            if (signed?.signedUrl) urlMap[t.id] = signed.signedUrl;
          } else {
            urlMap[t.id] = t.video_url;
          }
        }),
      );
      setSignedUrls(urlMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      Swal.fire({ icon: "warning", title: "Lengkapi judul & pilih video", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      Swal.fire({ icon: "error", title: `Maks ${MAX_MB}MB`, toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Progress via XHR is complex through storage SDK; fallback to indeterminate feel
      const uploadPromise = supabase.storage
        .from("tutorial-videos")
        .upload(path, file, { contentType: file.type, upsert: false });

      // Fake steady progress
      const int = setInterval(() => setProgress((p) => Math.min(p + 5, 90)), 400);
      const { error: upErr } = await uploadPromise;
      clearInterval(int);
      if (upErr) throw upErr;
      setProgress(100);

      const { data: pub } = supabase.storage.from("tutorial-videos").getPublicUrl(path);
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insErr } = await supabase.from("tutorials").insert({
        title: title.trim(),
        description: description.trim() || null,
        video_url: pub.publicUrl,
        storage_path: path,
        created_by: user?.id ?? null,
      });
      if (insErr) throw insErr;

      Swal.fire({ icon: "success", title: "Tutorial ditambahkan", toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
      setTitle("");
      setDescription("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
      await fetchTutorials();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Gagal upload", text: err.message ?? String(err) });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (t: Tutorial) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "Hapus tutorial ini?",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
    });
    if (!res.isConfirmed) return;
    if (t.storage_path) {
      await supabase.storage.from("tutorial-videos").remove([t.storage_path]);
    }
    await supabase.from("tutorials").delete().eq("id", t.id);
    await fetchTutorials();
  };

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Navbar />

      <div className="container max-w-5xl mx-auto px-4 py-6 md:py-10 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary uppercase tracking-wider font-mono flex items-center gap-2">
              <PlayCircle className="w-7 h-7" /> Tutorial
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Video panduan penggunaan aplikasi
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowForm((v) => !v)}
              className="font-mono uppercase tracking-wider"
            >
              {showForm ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {showForm ? "Tutup" : "Upload Video"}
            </Button>
          )}
        </div>

        {isAdmin && showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleUpload}
            className="mb-8 p-5 rounded-lg border border-primary/30 bg-card space-y-4"
          >
            <div>
              <Label className="font-mono text-xs uppercase tracking-wider">Judul</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-wider">Deskripsi</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-wider">
                File Video (mp4/webm/mov, maks {MAX_MB}MB)
              </Label>
              <Input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            {uploading && (
              <div className="space-y-1">
                <Progress value={progress} />
                <p className="text-xs font-mono text-muted-foreground">Uploading… {progress}%</p>
              </div>
            )}
            <Button type="submit" disabled={uploading} className="w-full font-mono uppercase tracking-wider">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Mengupload..." : "Simpan Tutorial"}
            </Button>
          </motion.form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tutorials.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <VideoIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-mono text-muted-foreground uppercase tracking-wider text-sm">
              Belum Ada Tutorial
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tutorials.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
              >
                <div className="relative aspect-video bg-black">
                  {signedUrls[t.id] ? (
                    activeId === t.id ? (
                      <video
                        src={signedUrls[t.id]}
                        controls
                        autoPlay
                        playsInline
                        onPlay={() => window.dispatchEvent(new Event("bgm:duck"))}
                        onPause={() => window.dispatchEvent(new Event("bgm:unduck"))}
                        onEnded={() => window.dispatchEvent(new Event("bgm:unduck"))}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          window.dispatchEvent(new Event("bgm:duck"));
                          setActiveId(t.id);
                        }}
                        className="w-full h-full flex items-center justify-center group"
                        aria-label="Play video"
                      >
                        <video
                          src={signedUrls[t.id] + "#t=0.1"}
                          preload="metadata"
                          muted
                          className="absolute inset-0 w-full h-full object-contain opacity-70"
                        />
                        <PlayCircle className="w-16 h-16 text-primary relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform" />
                      </button>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground font-mono uppercase tracking-wider text-sm">
                      {t.title}
                    </h3>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(t)}
                        className="text-destructive hover:bg-destructive/10 p-1.5 rounded"
                        aria-label="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
                      {t.description}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground font-mono mt-3 uppercase tracking-wider">
                    {new Date(t.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
