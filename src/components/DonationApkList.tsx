import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, RefreshCw, Search } from "lucide-react";
import { ApkCard } from "./ApkCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getLicenseSession } from "@/lib/license-session";

interface DonationApk {
  id: string;
  app_name: string;
  version: string;
  description: string;
  category: "donation";
  file_name: string;
  file_size: number | null;
  download_count: number;
  icon_url: string | null;
  created_at: string;
}

interface DonationApkListProps {
  refreshTrigger: number;
  isAdmin?: boolean;
}

export function DonationApkList({ refreshTrigger, isAdmin = false }: DonationApkListProps) {
  const [apks, setApks] = useState<DonationApk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApks = async () => {
    setLoading(true);
    try {
      const session = getLicenseSession();
      const { data, error } = await supabase.functions.invoke("list-donation-apks", {
        body: { key: session?.key ?? "" },
      });
      if (error) throw error;
      setApks((data?.apks as DonationApk[]) ?? []);
    } catch (error) {
      console.error("Error fetching donation APKs:", error);
      setApks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApks();
  }, [refreshTrigger]);

  const filtered = apks.filter(
    (apk) =>
      apk.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apk.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apk.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">
              Donation APK/APKS
            </h2>
            <span className="text-xs font-mono text-muted-foreground">[{apks.length}]</span>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded border border-border p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded bg-secondary flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1 uppercase tracking-wider">
            {searchQuery ? "Tidak Ditemukan" : "Belum Ada APK"}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((apk, index) => (
            <ApkCard
              key={apk.id}
              id={apk.id}
              appName={apk.app_name}
              version={apk.version}
              description={apk.description}
              fileName={apk.file_name}
              filePath=""
              downloadUrl=""
              fileSize={apk.file_size ?? undefined}
              downloadCount={apk.download_count}
              iconUrl={apk.icon_url ?? undefined}
              category="donation"
              createdAt={apk.created_at}
              index={index}
              onDownloadComplete={fetchApks}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
