import { useState } from "react";
import { Header } from "@/components/Header";
import { ApkUploadForm } from "@/components/ApkUploadForm";
import { ApkList } from "@/components/ApkList";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAdmin } = useAuth();

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

        <div className="space-y-8">
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Form - Only show for admins */}
            {isAdmin && (
              <div className="lg:col-span-1">
                <ApkUploadForm onUploadSuccess={handleUploadSuccess} />
              </div>
            )}

            {/* APK List */}
            <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
              <ApkList refreshTrigger={refreshTrigger} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-border/30">
        <div className="container max-w-7xl mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground font-mono uppercase tracking-wider">
            © {new Date().getFullYear()} APK Uploader — All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
