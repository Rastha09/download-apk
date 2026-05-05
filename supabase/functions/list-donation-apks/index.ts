import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const keyPattern = /^[A-Z0-9-]{1,64}$/;

// Simple in-memory IP rate limiter
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Check admin via JWT (admins bypass license requirement)
    const authHeader = req.headers.get("Authorization");
    let isAdmin = false;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await admin.auth.getClaims(token);
      const userId = claimsData?.claims?.sub;
      if (userId) {
        const { data: roleCheck } = await admin.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });
        isAdmin = !!roleCheck;
      }
    }

    if (!isAdmin) {
      const body = await req.json().catch(() => null);
      const key = String(body?.key ?? "").trim().toUpperCase();

      if (!keyPattern.test(key)) {
        return new Response(JSON.stringify({ error: "License key tidak valid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: validationData, error: validationError } = await admin.rpc(
        "validate_license_key",
        { _key: key, _client_ip: clientIp }
      );
      if (validationError) throw validationError;
      const validation = Array.isArray(validationData) ? validationData[0] : validationData;
      if (!validation?.is_valid) {
        return new Response(
          JSON.stringify({ error: validation?.message || "License tidak valid" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Return donation APKs WITHOUT download_url / file_path
    const { data, error } = await admin
      .from("apk_uploads")
      .select(
        "id, app_name, version, description, category, file_name, file_size, download_count, icon_url, created_at"
      )
      .eq("category", "donation")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ apks: data ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("list-donation-apks error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
