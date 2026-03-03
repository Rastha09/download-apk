import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, RefreshCw, Search } from "lucide-react";
import { ApkCard } from "./ApkCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface ApkUpload {
  id: string;
  app_name: string;
  version: string;
  description: string;
  file_name: string;
  file_path: string;
  download_url: string;
  file_size: number | null;
  download_count: number;
  icon_url: string | null;
  
  created_at: string;
}

interface ApkListProps {
  refreshTrigger: number;
  isAdmin?: boolean;
}

export function ApkList({ refreshTrigger, isAdmin = false }: ApkListProps) {
  const [apks, setApks] = useState<ApkUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("apk_uploads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApks(data || []);
    } catch (error) {
      console.error("Error fetching APKs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApks();
  }, [refreshTrigger]);

  const filteredApks = apks.filter(
    (apk) =>
      apk.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apk.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apk.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">
              Uploaded APK/APKS
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              [{apks.length}]
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchApks}
            disabled={loading}
            className="h-9 w-9 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="> cari aplikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-secondary border-border font-mono text-sm rounded focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded border border-border p-5 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded bg-secondary" />
                <div className="flex-1">
                  <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-secondary rounded w-full mb-2" />
              <div className="h-3 bg-secondary rounded w-2/3 mb-4" />
              <div className="h-10 bg-secondary rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredApks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded bg-secondary flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1 uppercase tracking-wider">
            {searchQuery ? "Tidak Ditemukan" : "Belum Ada APK"}
          </h3>
          <p className="text-xs text-muted-foreground font-mono">
            {searchQuery
              ? "Coba kata kunci lain"
              : "Upload APK pertama untuk memulai"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApks.map((apk, index) => (
            <ApkCard
              key={apk.id}
              id={apk.id}
              appName={apk.app_name}
              version={apk.version}
              description={apk.description}
              fileName={apk.file_name}
              filePath={apk.file_path}
              downloadUrl={apk.download_url}
              fileSize={apk.file_size ?? undefined}
              downloadCount={apk.download_count}
              iconUrl={apk.icon_url ?? undefined}
              
              createdAt={apk.created_at}
              index={index}
              onDelete={fetchApks}
              onDownloadComplete={fetchApks}
              onEdit={fetchApks}
              showDelete={isAdmin}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
