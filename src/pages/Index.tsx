import { useState } from "react";
import { Header } from "@/components/Header";
import { ApkUploadForm } from "@/components/ApkUploadForm";
import { ApkList } from "@/components/ApkList";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8 md:space-y-12">
          {/* Header */}
          <Header />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Form */}
            <div className="lg:col-span-1">
              <ApkUploadForm onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* APK List */}
            <div className="lg:col-span-2">
              <ApkList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-border">
        <div className="container max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} APK Uploader. Share your apps with ease.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
