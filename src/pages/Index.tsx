import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { ApkUploadForm } from "@/components/ApkUploadForm";
import { ApkList } from "@/components/ApkList";
import { ParticleBackground } from "@/components/ParticleBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAdmin, loading, signOut } = useAuth();

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="space-y-8 md:space-y-12">
          {/* Auth Actions */}
          <div className="flex justify-end items-center gap-3">
            <ThemeToggle />
            {loading ? null : user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Admin</span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Header */}
          <Header />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
