import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded border border-border bg-card p-6 md:p-10">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid opacity-30" />

        {/* Glow accents */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative text-center space-y-3">
          {/* Status indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-primary/30 bg-primary/5 text-xs font-mono text-primary uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-primary blink" />
            System Online
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-[0.15em]">
            APK Uploader
          </h1>

          <p className="text-sm md:text-base font-mono text-muted-foreground tracking-[0.3em] uppercase">
            Upload · Bagikan · Deploy
          </p>
        </div>
      </div>
    </motion.header>
  );
}
