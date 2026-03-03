import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Package, Upload, Moon, Sun, Globe, HelpCircle, Info, LogIn, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import profileLogo from "@/assets/profile.png";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, signOut } = useAuth();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const menuItems = [
    { icon: Home, label: "Beranda", href: "/" },
    { icon: Package, label: "Semua APK", href: "/" },
    ...(isAdmin ? [{ icon: Upload, label: "Upload APK", href: "/" }] : []),
  ];

  const settingsItems = [
    { icon: Globe, label: "Bahasa", action: () => {} },
    { icon: HelpCircle, label: "FAQ", action: () => {} },
    { icon: Info, label: "Tentang Aplikasi", action: () => {} },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 z-50 h-full w-[280px] max-w-[85vw] bg-drawer border-l border-accent/30 shadow-glow-cyan overflow-y-auto flex flex-col"
          >
            {/* Profile Section */}
            <div className="p-5 flex items-center gap-3">
              <div className="relative">
                <img
                  src={profileLogo}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/60"
                />
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

            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* Menu Navigation */}
            <div className="p-3 space-y-1">
              <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                Navigasi
              </p>
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

            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* Settings */}
            <div className="p-3 space-y-1">
              <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                Pengaturan
              </p>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150"
              >
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-accent flex-shrink-0" />
                ) : (
                  <Sun className="w-4 h-4 text-accent flex-shrink-0" />
                )}
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </button>

              {settingsItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150 text-left"
                >
                  <item.icon className="w-4 h-4 text-accent flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* Bottom */}
            <div className="mt-auto p-3 space-y-1">
              {user ? (
                <button
                  onClick={() => { signOut(); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-destructive uppercase tracking-wider font-mono hover:bg-destructive/10 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Logout
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-primary uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  Login
                </Link>
              )}
              <p className="px-3 py-2 text-[10px] text-muted-foreground font-mono">
                v1.0.0
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
