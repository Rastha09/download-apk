import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(supabaseUrl, serviceKey);

    // Allow either service role key or an authenticated admin user
    let allowed = token === serviceKey;
    if (!allowed) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user) {
        const { data: roleData } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id);
        allowed = !!roleData?.some((r: any) => r.role === "admin" || r.role === "super_admin");
      }
    }
    if (!allowed) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: rows, error } = await admin.from("apk_uploads").select("id, file_path");
    if (error) throw error;

    const results: any[] = [];
    for (const row of rows ?? []) {
      const oldPath: string = row.file_path;
      const match = oldPath.match(/^(\d{10,})[_]+(.+)$/);
      if (!match) {
        results.push({ id: row.id, skipped: oldPath });
        continue;
      }
      const timestamp = match[1];
      const rest = match[2];
      const dotIdx = rest.lastIndexOf(".");
      const base = dotIdx > 0 ? rest.slice(0, dotIdx) : rest;
      const ext = dotIdx > 0 ? rest.slice(dotIdx) : "";
      const newPath = `${base}_${timestamp}${ext}`;
      if (newPath === oldPath) {
        results.push({ id: row.id, skipped: "already" });
        continue;
      }

      const { error: moveErr } = await admin.storage.from("apk-files").move(oldPath, newPath);
      if (moveErr) {
        results.push({ id: row.id, oldPath, error: moveErr.message });
        continue;
      }
      const { data: urlData } = admin.storage.from("apk-files").getPublicUrl(newPath);
      const { error: updErr } = await admin
        .from("apk_uploads")
        .update({ file_path: newPath, download_url: urlData.publicUrl })
        .eq("id", row.id);
      if (updErr) {
        results.push({ id: row.id, oldPath, newPath, error: updErr.message });
      } else {
        results.push({ id: row.id, oldPath, newPath, ok: true });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
