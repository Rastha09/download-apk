import { motion } from "framer-motion";
import profileLogo from "@/assets/profile.png";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded-3xl gradient-hero p-6 md:p-8 shadow-glow">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative group cursor-pointer flex-shrink-0"
          >
            <div className="absolute -inset-1.5 rounded-full bg-primary/40 blur-lg group-hover:bg-primary/60 transition-all duration-500 animate-pulse" />
            <img
              src={profileLogo}
              alt="Deimos Logo"
              className="relative w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-2 ring-white/40 shadow-lg group-hover:ring-white/70 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300"
            />
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
      </div>
    </motion.header>
  );
}
