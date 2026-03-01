import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Shield, Download, Clock, Smartphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const COUNTDOWN_SECONDS = 15;

export default function SafelinkPage() {
  const { apkId } = useParams<{ apkId: string }>();
  const navigate = useNavigate();
  const [apk, setApk] = useState<any>(null);
  const [redirectSlug, setRedirectSlug] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apkId) {
      setError(true);
      return;
    }

    const fetchData = async () => {
      const [apkRes, slugRes] = await Promise.all([
        supabase
          .from("apk_uploads")
          .select("app_name, version, description, icon_url, file_size")
          .eq("id", apkId)
          .single(),
        supabase
          .from("apk_redirects")
          .select("slug")
          .eq("apk_id", apkId)
          .order("created_at", { ascending: true })
          .limit(1),
      ]);

      if (apkRes.error || !apkRes.data) {
        setError(true);
        return;
      }

      setApk(apkRes.data);

      if (slugRes.data && slugRes.data.length > 0) {
        setRedirectSlug(slugRes.data[0].slug);
      } else {
        setError(true);
      }
    };

    fetchData();
  }, [apkId]);

  useEffect(() => {
    if (!apk || error) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [apk, error]);

  const handleDownload = async () => {
    if (!redirectSlug || !apkId) return;

    try {
      await supabase.rpc("increment_download_count", { apk_id: apkId });
    } catch (e) {
      console.error("Error incrementing download count:", e);
    }

    window.location.replace(`/go/${redirectSlug}`);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Link Tidak Tersedia</h1>
          <p className="text-muted-foreground mb-4">File ini tidak tersedia untuk diunduh.</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  if (!apk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progress = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full gradient-hero" />

          <div className="p-6 md:p-8">
            {/* App Icon */}
            <div className="flex justify-center mb-5">
              {apk.icon_url ? (
                <img
                  src={apk.icon_url}
                  alt={apk.app_name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
                  <Smartphone className="w-10 h-10 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* App Info */}
            <h1 className="text-xl font-bold text-foreground text-center mb-1">
              {apk.app_name}
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-1">
              Versi {apk.version}
              {apk.file_size ? ` • ${formatFileSize(apk.file_size)}` : ""}
            </p>
            {apk.description && (
              <p className="text-xs text-muted-foreground text-center mb-6 line-clamp-2">
                {apk.description}
              </p>
            )}

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mb-6 px-3 py-2 rounded-lg bg-secondary">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs text-secondary-foreground font-medium">
                File telah diverifikasi dan aman untuk diunduh
              </span>
            </div>

            {/* Countdown / Download */}
            {!ready ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">
                    Link download tersedia dalam{" "}
                    <span className="font-bold text-foreground text-lg">{countdown}</span> detik
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-hero rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Mohon tunggu, halaman ini untuk mendukung layanan tetap gratis.
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Button
                  onClick={handleDownload}
                  className="w-full h-12 text-base font-semibold gradient-success hover:opacity-90 transition-opacity"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Sekarang
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Kembali ke halaman utama
          </button>
        </div>
      </motion.div>
    </div>
  );
}
