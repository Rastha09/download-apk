import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "id" | "en";

const STORAGE_KEY = "deimos-lang";

const dict = {
  id: {
    // Header
    "header.status": "System Online",
    "header.title": "Downloader APK",
    "header.subtitle": "Upload · Download · Share",

    // Navbar / Drawer sections
    "drawer.online": "Online",
    "drawer.guest": "Guest User",
    "drawer.nav": "Navigasi",
    "drawer.settings": "Pengaturan",
    "drawer.home": "Beranda",
    "drawer.allApks": "Semua APK",
    "drawer.donationApks": "APK Donasi",
    "drawer.uploadApk": "Upload APK",
    "drawer.tutorial": "Tutorial",
    "drawer.licenseKeys": "License Keys",
    "drawer.manageAdmins": "Manage Admins",
    "drawer.darkMode": "Dark Mode",
    "drawer.lightMode": "Light Mode",
    "drawer.language": "Bahasa",
    "drawer.faq": "FAQ",
    "drawer.about": "Tentang Aplikasi",
    "drawer.login": "Login",
    "drawer.logout": "Logout",

    // Language modal
    "lang.title": "Pilih Bahasa",
    "lang.id": "Bahasa Indonesia",
    "lang.en": "English",

    // FAQ
    "faq.title": "FAQ",
    "faq.q1": "Apa itu DEIMOS MODS™?",
    "faq.a1": "Platform untuk berbagi file APK/APKS modifikasi. Upload oleh admin, download gratis oleh siapa saja.",
    "faq.q2": "Apakah download gratis?",
    "faq.a2": "Ya, semua file gratis. Untuk APK gratis kamu akan diarahkan ke halaman iklan sebentar sebelum download — dukungan kecil ini yang bikin layanan tetap gratis.",
    "faq.q3": "Mengapa ada cooldown saat download?",
    "faq.a3": "Cooldown mencegah spam klik dan melindungi server dari beban berlebih.",
    "faq.q4": "Bagaimana cara upload APK?",
    "faq.a4": "Hanya admin yang bisa upload. Login dengan akun admin, lalu gunakan form upload di halaman utama.",
    "faq.q5": "Format file apa yang didukung?",
    "faq.a5": "File .APK dan .APKS dengan ukuran maksimal 600MB.",
    "faq.q6": "Apakah file aman?",
    "faq.a6": "Semua file diupload oleh admin terpercaya. Namun, selalu gunakan antivirus dan install dari sumber terpercaya.",

    // About
    "about.title": "Tentang Aplikasi",
    "about.description": "DEIMOS MODS™ adalah platform distribusi APK modifikasi yang dirancang untuk kemudahan berbagi aplikasi Android.",
    "about.featuresTitle": "Fitur Utama",
    "about.feature1": "Upload file APK/APKS hingga 600MB",
    "about.feature2": "Ekstraksi ikon otomatis dari file APK",
    "about.feature3": "Download langsung tanpa iklan",
    "about.feature4": "Pencarian & filter aplikasi",
    "about.feature5": "Tema gelap cyber dengan partikel interaktif",
    "about.feature6": "Responsif untuk semua perangkat",
    "about.techTitle": "Teknologi",
    "about.copyright": "© 2026 DEIMOS MODS™. All rights reserved.",

    // ApkList
    "apk.titleFree": "Gratis APK/APKS",
    "apk.titleDonation": "Donation APK/APKS",
    "apk.search": "> cari aplikasi...",
    "apk.notFound": "Tidak Ditemukan",
    "apk.empty": "Belum Ada APK",
    "apk.notFoundHint": "Coba kata kunci lain",
    "apk.emptyHint": "Upload APK pertama untuk memulai",

    // Footer
    "footer.rights": "All Rights Reserved",
  },
  en: {
    "header.status": "System Online",
    "header.title": "APK Downloader",
    "header.subtitle": "Upload · Download · Share",

    "drawer.online": "Online",
    "drawer.guest": "Guest User",
    "drawer.nav": "Navigation",
    "drawer.settings": "Settings",
    "drawer.home": "Home",
    "drawer.allApks": "All APKs",
    "drawer.donationApks": "Donation APKs",
    "drawer.uploadApk": "Upload APK",
    "drawer.tutorial": "Tutorial",
    "drawer.licenseKeys": "License Keys",
    "drawer.manageAdmins": "Manage Admins",
    "drawer.darkMode": "Dark Mode",
    "drawer.lightMode": "Light Mode",
    "drawer.language": "Language",
    "drawer.faq": "FAQ",
    "drawer.about": "About",
    "drawer.login": "Login",
    "drawer.logout": "Logout",

    "lang.title": "Choose Language",
    "lang.id": "Bahasa Indonesia",
    "lang.en": "English",

    "faq.title": "FAQ",
    "faq.q1": "What is DEIMOS MODS™?",
    "faq.a1": "A platform for sharing modified APK/APKS files. Uploaded by admins, free to download for everyone.",
    "faq.q2": "Are downloads free?",
    "faq.a2": "Yes, all files are free to download directly with no ads.",
    "faq.q3": "Why is there a download cooldown?",
    "faq.a3": "The cooldown prevents click spam and protects the server from being overloaded.",
    "faq.q4": "How do I upload an APK?",
    "faq.a4": "Only admins can upload. Sign in with an admin account and use the upload form on the home page.",
    "faq.q5": "Which file formats are supported?",
    "faq.a5": ".APK and .APKS files up to 600MB.",
    "faq.q6": "Are the files safe?",
    "faq.a6": "All files are uploaded by trusted admins. Still, always use antivirus and install from trusted sources.",

    "about.title": "About",
    "about.description": "DEIMOS MODS™ is a modified APK distribution platform built to make sharing Android apps easy.",
    "about.featuresTitle": "Key Features",
    "about.feature1": "Upload APK/APKS files up to 600MB",
    "about.feature2": "Automatic icon extraction from APK files",
    "about.feature3": "Direct downloads with no ads",
    "about.feature4": "App search & filtering",
    "about.feature5": "Cyber dark theme with interactive particles",
    "about.feature6": "Responsive on all devices",
    "about.techTitle": "Technology",
    "about.copyright": "© 2026 DEIMOS MODS™. All rights reserved.",

    "apk.titleFree": "Free APK/APKS",
    "apk.titleDonation": "Donation APK/APKS",
    "apk.search": "> search apps...",
    "apk.notFound": "Not Found",
    "apk.empty": "No APKs Yet",
    "apk.notFoundHint": "Try another keyword",
    "apk.emptyHint": "Upload the first APK to get started",

    "footer.rights": "All Rights Reserved",
  },
} as const;

export type TranslationKey = keyof typeof dict["id"];

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "id";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "id" ? stored : "id";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey) => dict[lang][key] ?? dict.id[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
