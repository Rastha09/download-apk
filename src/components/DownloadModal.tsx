import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";

interface DownloadModalProps {
  isOpen: boolean;
  appName: string;
  iconUrl?: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DownloadModal({ isOpen, appName, iconUrl, isLoading, onConfirm, onCancel }: DownloadModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCountdown(null);
      setGenerating(false);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // When countdown reaches 0, trigger the actual download
  useEffect(() => {
    if (countdown === 0 && generating) {
      setGenerating(false);
      onConfirm();
    }
  }, [countdown, generating, onConfirm]);

  const handleClickDownload = useCallback(() => {
    setGenerating(true);
    setCountdown(5);
  }, []);

  const showCountdown = generating && countdown !== null && countdown > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={!generating && !isLoading ? onCancel : undefined}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-card border border-border/50 rounded-[4px] shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-primary" />

            <div className="p-6 md:p-8">
              {/* APK Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-[4px] bg-secondary flex items-center justify-center overflow-hidden border border-border">
                  {iconUrl ? (
                    <img src={iconUrl} alt={appName} className="w-full h-full object-cover" />
                  ) : (
                    <Smartphone className="w-8 h-8 text-accent" />
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-foreground text-center mb-2 uppercase tracking-wide">
                Unduh {appName}
              </h3>

              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6 font-mono">
                <span className="text-primary">Unduhan sedang dipersiapkan.</span>{" "}
                Untuk menjaga layanan tetap gratis, Anda akan melihat iklan singkat sebelum mengunduh.
              </p>

              {isLoading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse font-mono">
                    Mengarahkan ke halaman unduhan…
                  </p>
                </div>
              ) : showCountdown ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  {/* Countdown circle */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                      <circle
                        cx="40" cy="40" r="36"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={2 * Math.PI * 36 * (countdown / 5)}
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <span className="text-2xl font-bold text-primary font-mono">{countdown}</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono animate-pulse">
                    Generating link...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleClickDownload}
                    className="w-full h-12 text-base font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-[4px] transition-all"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Lanjutkan Download
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onCancel}
                    className="w-full h-10 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
