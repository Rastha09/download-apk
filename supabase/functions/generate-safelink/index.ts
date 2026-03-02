import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache: apkId -> { shortlink, expiresAt }
const cache = new Map<string, { shortlink: string; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apkId } = await req.json();
    if (!apkId) {
      return new Response(JSON.stringify({ error: "apkId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache
    const cached = cache.get(apkId);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify({ shortlink: cached.shortlink }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get download URL from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: apk, error: dbError } = await supabase
      .from("apk_uploads")
      .select("download_url")
      .eq("id", apkId)
      .single();

    if (dbError || !apk) {
      return new Response(JSON.stringify({ error: "APK not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate safelinku shortlink via API
    const apiToken = Deno.env.get("SAFELINKU_API_TOKEN");
    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Safelinku API token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safelinkRes = await fetch("https://safelinku.com/api/v1/links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: apk.download_url }),
    });

    const responseText = await safelinkRes.text();
    console.log("Safelinku API status:", safelinkRes.status, "response:", responseText.substring(0, 500));

    if (!safelinkRes.ok) {
      return new Response(
        JSON.stringify({ error: "Safelinku API error", detail: responseText.substring(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let shortlink: string;
    try {
      const safelinkData = JSON.parse(responseText);
      // Try common response field names
      shortlink = safelinkData.shortenedUrl || safelinkData.shortened || safelinkData.short || safelinkData.link || safelinkData.url || safelinkData.data?.link || safelinkData.data?.url || safelinkData.data?.shortenedUrl || "";
    } catch {
      const urlMatch = responseText.match(/https?:\/\/[^\s<"']+/);
      shortlink = urlMatch ? urlMatch[0] : "";
    }

    if (!shortlink) {
      return new Response(
        JSON.stringify({ error: "No shortlink returned from Safelinku" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment download count
    await supabase.rpc("increment_download_count", { apk_id: apkId });

    // Cache result
    cache.set(apkId, { shortlink, expiresAt: Date.now() + CACHE_TTL_MS });

    return new Response(JSON.stringify({ shortlink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
