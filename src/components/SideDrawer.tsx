import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Package, Upload, Moon, Sun, Globe, HelpCircle, Info, LogIn, LogOut, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import profileLogo from "@/assets/profile.png";
import { DrawerModal } from "./DrawerModal";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, signOut } = useAuth();
  const [showFaq, setShowFaq] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [lang, setLang] = useState("id");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const menuItems = [
    { icon: Home, label: "Beranda", href: "/" },
    { icon: Package, label: "Semua APK", href: "/" },
    ...(isAdmin ? [{ icon: Upload, label: "Upload APK", href: "/" }] : []),
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 right-0 z-50 h-full w-[280px] max-w-[85vw] bg-drawer border-l border-accent/30 shadow-glow-cyan overflow-y-auto flex flex-col"
            >
              {/* Profile */}
              <div className="p-5 flex items-center gap-3">
                <div className="relative">
                  <img src={profileLogo} alt="Avatar" className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/60" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary blink ring-2 ring-drawer" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground tracking-wide uppercase font-mono">
                    {user?.email?.split("@")[0] || "Guest User"}
                  </p>
                  <p className="text-xs text-primary font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary blink inline-block" />
                    Online
                  </p>
                </div>
              </div>

              <div className="h-px bg-border mx-4" />

              {/* Navigation */}
              <div className="p-3 space-y-1">
                <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Navigasi</p>
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 hover:border-l-2 hover:border-primary transition-all duration-150"
                  >
                    <item.icon className="w-4 h-4 text-accent flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="h-px bg-border mx-4" />

              {/* Settings */}
              <div className="p-3 space-y-1">
                <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Pengaturan</p>

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150"
                >
                  {theme === "dark" ? <Moon className="w-4 h-4 text-accent" /> : <Sun className="w-4 h-4 text-accent" />}
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </button>

                <button
                  onClick={() => { setShowLang(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150 text-left"
                >
                  <Globe className="w-4 h-4 text-accent" />
                  Bahasa
                </button>

                <button
                  onClick={() => { setShowFaq(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150 text-left"
                >
                  <HelpCircle className="w-4 h-4 text-accent" />
                  FAQ
                </button>

                <button
                  onClick={() => { setShowAbout(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150 text-left"
                >
                  <Info className="w-4 h-4 text-accent" />
                  Tentang Aplikasi
                </button>
              </div>

              <div className="h-px bg-border mx-4" />

              {/* Bottom */}
              <div className="mt-auto p-3 space-y-1">
                {user ? (
                  <button
                    onClick={() => { signOut(); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-destructive uppercase tracking-wider font-mono hover:bg-destructive/10 transition-all duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-primary uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                )}
                <p className="px-3 py-2 text-[10px] text-muted-foreground font-mono">v1.0.0</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* FAQ Modal */}
      <DrawerModal isOpen={showFaq} title="FAQ" onClose={() => setShowFaq(false)}>
        <div className="space-y-5">
          <div>
            <h4 className="font-bold text-primary mb-1">Apa itu DEIMOS MODS™?</h4>
            <p className="text-muted-foreground">Platform untuk berbagi file APK/APKS modifikasi. Upload oleh admin, download gratis oleh siapa saja.</p>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Apakah download gratis?</h4>
            <p className="text-muted-foreground">Ya, semua file bisa didownload gratis. Anda akan melewati halaman iklan singkat (Safelinku) untuk mendukung layanan tetap gratis.</p>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Mengapa ada cooldown saat download?</h4>
            <p className="text-muted-foreground">Cooldown mencegah spam klik dan melindungi server dari beban berlebih.</p>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Bagaimana cara upload APK?</h4>
            <p className="text-muted-foreground">Hanya admin yang bisa upload. Login dengan akun admin, lalu gunakan form upload di halaman utama.</p>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Format file apa yang didukung?</h4>
            <p className="text-muted-foreground">File .APK dan .APKS dengan ukuran maksimal 500MB.</p>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Apakah file aman?</h4>
            <p className="text-muted-foreground">Semua file diupload oleh admin terpercaya. Namun, selalu gunakan antivirus dan install dari sumber terpercaya.</p>
          </div>
        </div>
      </DrawerModal>

      {/* About Modal */}
      <DrawerModal isOpen={showAbout} title="Tentang Aplikasi" onClose={() => setShowAbout(false)}>
        <div className="space-y-4">
          <div className="text-center pb-4 border-b border-border">
            <h4 className="text-xl font-bold text-primary">DEIMOS MODS™</h4>
            <p className="text-muted-foreground text-xs mt-1">v1.0.0</p>
          </div>
          <p className="text-muted-foreground">
            DEIMOS MODS™ adalah platform distribusi APK modifikasi yang dirancang untuk kemudahan berbagi aplikasi Android.
          </p>
          <div>
            <h4 className="font-bold text-primary mb-1">Fitur Utama</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Upload file APK/APKS hingga 500MB</li>
              <li>Ekstraksi ikon otomatis dari file APK</li>
              <li>Download melalui Safelinku shortlink</li>
              <li>Pencarian & filter aplikasi</li>
              <li>Tema gelap cyber dengan partikel interaktif</li>
              <li>Responsif untuk semua perangkat</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Teknologi</h4>
            <p className="text-muted-foreground">React · TypeScript · Tailwind CSS · Lovable Cloud</p>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            © 2026 DEIMOS MODS™. All rights reserved.
          </p>
        </div>
      </DrawerModal>

      {/* Language Modal */}
      <DrawerModal isOpen={showLang} title="Pilih Bahasa" onClose={() => setShowLang(false)}>
        <div className="space-y-2">
          {[
            { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
            { code: "en", label: "English", flag: "🇺🇸" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setShowLang(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[4px] border transition-all ${
                lang === l.code 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border hover:border-primary/30 text-foreground"
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <span className="font-semibold">{l.label}</span>
              {lang === l.code && <Check className="w-4 h-4 ml-auto text-primary" />}
            </button>
          ))}
          <p className="text-xs text-muted-foreground mt-3">
            * Saat ini tampilan hanya tersedia dalam Bahasa Indonesia.
          </p>
        </div>
      </DrawerModal>
    </>
  );
}
