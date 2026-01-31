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
  created_at: string;
}

interface ApkListProps {
  refreshTrigger: number;
}

export function ApkList({ refreshTrigger }: ApkListProps) {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Package className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Uploaded APKs</h2>
            <p className="text-sm text-muted-foreground">
              {apks.length} {apks.length === 1 ? "app" : "apps"} available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchApks}
            disabled={loading}
            className="h-10 w-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-6 animate-pulse"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="flex-1">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3 mb-4" />
              <div className="h-10 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredApks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? "No apps found" : "No APKs uploaded yet"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Upload your first APK to get started!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              createdAt={apk.created_at}
              index={index}
              onDelete={fetchApks}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
