import { motion } from "framer-motion";
import { Smartphone, Upload } from "lucide-react";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded-3xl gradient-hero p-8 md:p-12 shadow-glow">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <Smartphone className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
                APK Uploader
              </h1>
              <p className="text-primary-foreground/80 text-sm md:text-base">
                Upload & share your Android apps easily
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2.5"
          >
            <Upload className="w-5 h-5 text-primary-foreground" />
            <span className="text-primary-foreground font-medium text-sm">
              Direct Download Links
            </span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
