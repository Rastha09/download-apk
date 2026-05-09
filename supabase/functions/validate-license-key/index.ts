import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const keyPattern = /^[A-Z0-9-]{1,64}$/;
const devicePattern = /^[a-zA-Z0-9-]{8,128}$/;

// IP-based rate limiter to prevent brute-force key enumeration
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 10;

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
      return new Response(JSON.stringify({ error: "Terlalu banyak percobaan, coba lagi nanti" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const key = String(body?.key ?? "").trim().toUpperCase();
    const deviceId = String(body?.deviceId ?? "").trim();
    const fingerprint = String(body?.fingerprint ?? "").trim();

    if (!keyPattern.test(key)) {
      return new Response(JSON.stringify({ error: "Format license key tidak valid" }), {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await admin.rpc("validate_license_key", {
      _key: key,
      _device_id: deviceId,
      _fingerprint: fingerprint,
    });

    if (error) {
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result || typeof result.is_valid !== "boolean") {
      throw new Error("Invalid validation response");
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("validate-license-key error", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
