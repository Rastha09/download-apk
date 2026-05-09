import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const keyPattern = /^[A-Z0-9-]{1,64}$/;
const devicePattern = /^[a-zA-Z0-9-]{8,128}$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// rate limiter
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20;

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

    const body = await req.json().catch(() => null);
    const apkId = String(body?.apkId ?? "");
    if (!uuidRegex.test(apkId)) {
      return new Response(JSON.stringify({ error: "apkId tidak valid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Admin bypass via JWT
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
      const key = String(body?.key ?? "").trim().toUpperCase();
      const deviceId = String(body?.deviceId ?? "").trim();
      const fingerprint = String(body?.fingerprint ?? "").trim();
      if (!keyPattern.test(key)) {
        return new Response(JSON.stringify({ error: "License key tidak valid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!devicePattern.test(deviceId)) {
        return new Response(JSON.stringify({ error: "Device ID tidak valid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!devicePattern.test(fingerprint)) {
        return new Response(JSON.stringify({ error: "Fingerprint perangkat tidak valid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: validationData, error: validationError } = await admin.rpc(
        "validate_license_key",
        { _key: key, _device_id: deviceId, _fingerprint: fingerprint }
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

    const { data: apk, error } = await admin
      .from("apk_uploads")
      .select("download_url, file_name, category")
      .eq("id", apkId)
      .single();

    if (error || !apk) {
      return new Response(JSON.stringify({ error: "APK tidak ditemukan" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (apk.category !== "donation") {
      return new Response(JSON.stringify({ error: "Bukan APK donasi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.rpc("increment_download_count", { apk_id: apkId });

    return new Response(
      JSON.stringify({ downloadUrl: apk.download_url, fileName: apk.file_name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("get-donation-download error", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
