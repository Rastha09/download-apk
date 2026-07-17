import { useState } from "react";
import { Header } from "@/components/Header";
import { ApkUploadForm } from "@/components/ApkUploadForm";
import { ApkList } from "@/components/ApkList";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { AdminOnlyNotice } from "@/components/AdminOnlyNotice";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAdmin } = useAuth();
  const { t } = useI18n();

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Navbar />

      <div className="container max-w-7xl mx-auto px-4 py-6 md:py-10 relative z-10">
        <div className="mb-8">
          <Header />
        </div>

        {isAdmin ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ApkUploadForm onUploadSuccess={handleUploadSuccess} />
              </div>
              <div className="lg:col-span-2">
                <ApkList refreshTrigger={refreshTrigger} isAdmin={isAdmin} category="free" />
              </div>
            </div>
          </div>
        ) : (
          <AdminOnlyNotice />
        )}
      </div>


      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-border/30">
        <div className="container max-w-7xl mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground font-mono uppercase tracking-wider">
            © {new Date().getFullYear()} {t("footer.rights")} — DEIMOS™.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
