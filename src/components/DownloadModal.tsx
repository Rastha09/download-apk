import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadModalProps {
  isOpen: boolean;
  appName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DownloadModal({ isOpen, appName, isLoading, onConfirm, onCancel }: DownloadModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onCancel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-1 w-full gradient-hero" />

            <div className="p-6 md:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-foreground text-center mb-2">
                Unduh {appName}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
                Unduhan sedang dipersiapkan.{" "}
                <span className="text-foreground/80">
                  Untuk menjaga layanan tetap gratis, Anda akan melihat iklan singkat sebelum mengunduh.
                </span>
              </p>

              {/* Loading state */}
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Menyiapkan halaman unduhan…
                  </p>
                </div>
              ) : (
                /* Action Buttons */
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={onConfirm}
                    className="w-full h-12 text-base font-semibold gradient-success hover:opacity-90 transition-opacity"
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
