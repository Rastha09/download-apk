import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function GoRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError(true);
      return;
    }

    const resolve = async () => {
      const { data, error: fetchError } = await supabase
        .from("apk_redirects")
        .select("apk_id, apk_uploads(download_url)")
        .eq("slug", slug)
        .single();

      if (fetchError || !data) {
        setError(true);
        return;
      }

      const downloadUrl = (data as any).apk_uploads?.download_url;
      if (downloadUrl) {
        window.location.replace(downloadUrl);
      } else {
        setError(true);
      }
    };

    resolve();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Link Tidak Ditemukan</h1>
          <p className="text-muted-foreground">Redirect link ini tidak valid atau sudah dihapus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Mengalihkan...</p>
      </div>
    </div>
  );
}
