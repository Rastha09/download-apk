import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Package, Upload, Moon, Sun, Globe, HelpCircle, Info, LogIn, LogOut, Check, Shield, Gem, KeyRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import profileLogo from "@/assets/profile.png";
import { DrawerModal } from "./DrawerModal";
import { useI18n } from "@/lib/i18n";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, isSuperAdmin, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [showFaq, setShowFaq] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLang, setShowLang] = useState(false);

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
    { icon: Home, label: t("drawer.home"), href: "/" },
    { icon: Package, label: t("drawer.allApks"), href: "/" },
    { icon: Gem, label: t("drawer.donationApks"), href: "/donasi" },
    ...(isAdmin ? [{ icon: Upload, label: t("drawer.uploadApk"), href: "/" }] : []),
    ...(isAdmin ? [{ icon: KeyRound, label: t("drawer.licenseKeys"), href: "/admin/license-keys" }] : []),
    ...(isSuperAdmin ? [{ icon: Shield, label: t("drawer.manageAdmins"), href: "/manage-admins" }] : []),
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
                    {user?.email?.split("@")[0] || t("drawer.guest")}
                  </p>
                  <p className="text-xs text-primary font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary blink inline-block" />
                    {t("drawer.online")}
                  </p>
                </div>
              </div>

              <div className="h-px bg-border mx-4" />

              {/* Navigation */}
              <div className="p-3 space-y-1">
                <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">{t("drawer.nav")}</p>
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
                <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">{t("drawer.settings")}</p>

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150"
                >
                  {theme === "dark" ? <Moon className="w-4 h-4 text-accent" /> : <Sun className="w-4 h-4 text-accent" />}
                  {theme === "dark" ? t("drawer.darkMode") : t("drawer.lightMode")}
                </button>

                <button
                  onClick={() => { setShowLang(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150 text-left"
                >
                  <Globe className="w-4 h-4 text-accent" />
                  {t("drawer.language")}
                </button>

                <button
                  onClick={() => { setShowFaq(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150 text-left"
                >
                  <HelpCircle className="w-4 h-4 text-accent" />
                  {t("drawer.faq")}
                </button>

                <button
                  onClick={() => { setShowAbout(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-foreground uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150 text-left"
                >
                  <Info className="w-4 h-4 text-accent" />
                  {t("drawer.about")}
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
                    {t("drawer.logout")}
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-primary uppercase tracking-wider font-mono hover:bg-primary/10 transition-all duration-150"
                  >
                    <LogIn className="w-4 h-4" />
                    {t("drawer.login")}
                  </Link>
                )}
                <p className="px-3 py-2 text-[10px] text-muted-foreground font-mono">v1.0.0</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* FAQ Modal */}
      <DrawerModal isOpen={showFaq} title={t("faq.title")} onClose={() => setShowFaq(false)}>
        <div className="space-y-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <h4 className="font-bold text-primary mb-1">{t(`faq.q${i}` as any)}</h4>
              <p className="text-muted-foreground">{t(`faq.a${i}` as any)}</p>
            </div>
          ))}
        </div>
      </DrawerModal>

      {/* About Modal */}
      <DrawerModal isOpen={showAbout} title={t("about.title")} onClose={() => setShowAbout(false)}>
        <div className="space-y-4">
          <div className="text-center pb-4 border-b border-border">
            <h4 className="text-xl font-bold text-primary">DEIMOS MODS™</h4>
            <p className="text-muted-foreground text-xs mt-1">v1.0.0</p>
          </div>
          <p className="text-muted-foreground">{t("about.description")}</p>
          <div>
            <h4 className="font-bold text-primary mb-1">{t("about.featuresTitle")}</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t("about.feature1")}</li>
              <li>{t("about.feature2")}</li>
              <li>{t("about.feature3")}</li>
              <li>{t("about.feature4")}</li>
              <li>{t("about.feature5")}</li>
              <li>{t("about.feature6")}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">{t("about.techTitle")}</h4>
            <p className="text-muted-foreground">React · TypeScript · Tailwind CSS · Cloud</p>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">{t("about.copyright")}</p>
        </div>
      </DrawerModal>

      {/* Language Modal */}
      <DrawerModal isOpen={showLang} title={t("lang.title")} onClose={() => setShowLang(false)}>
        <div className="space-y-2">
          {[
            { code: "id" as const, label: t("lang.id"), flag: "🇮🇩" },
            { code: "en" as const, label: t("lang.en"), flag: "🇺🇸" },
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
        </div>
      </DrawerModal>
    </>
  );
}
