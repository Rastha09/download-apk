import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InvitePayload {
  email?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is super_admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: isSuper, error: roleErr } = await admin.rpc("is_super_admin", {
      _user_id: user.id,
    });
    if (roleErr || !isSuper) {
      return new Response(JSON.stringify({ error: "Forbidden: super admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as InvitePayload;
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email tidak valid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or invite user
    let targetUserId: string | null = null;
    const { data: existing, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw listErr;
    const found = existing.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      targetUserId = found.id;
    } else {
      const redirectTo = req.headers.get("origin") ?? undefined;
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
        email,
        redirectTo ? { redirectTo } : undefined,
      );
      if (inviteErr) {
        return new Response(JSON.stringify({ error: inviteErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = invited.user?.id ?? null;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Gagal membuat akun" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing role
    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id, role")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (existingRole) {
      if (existingRole.role === "super_admin") {
        return new Response(JSON.stringify({ error: "User ini adalah Super Admin" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (existingRole.role === "admin") {
        return new Response(JSON.stringify({ error: "User sudah menjadi admin", alreadyAdmin: true }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // upgrade existing 'user' row
      await admin
        .from("user_roles")
        .update({ role: "admin", invited_by: user.id })
        .eq("id", existingRole.id);
    } else {
      const { error: insErr } = await admin.from("user_roles").insert({
        user_id: targetUserId,
        role: "admin",
        invited_by: user.id,
      });
      if (insErr) throw insErr;
    }

    return new Response(
      JSON.stringify({ success: true, email, userId: targetUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("invite-admin error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
