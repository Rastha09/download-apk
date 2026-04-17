import { useEffect, useState, FormEvent } from "react";
import { Navigate, Link } from "react-router-dom";
import { Shield, UserPlus, Trash2, ArrowLeft, Crown, Loader2, Mail } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminEntry {
  id: string;
  user_id: string;
  email: string;
  role: "admin" | "super_admin";
  created_at: string;
  invited_by: string | null;
  invited_by_email: string | null;
}

const ManageAdmins = () => {
  const { user, isSuperAdmin, loading } = useAuth();
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-admins");
      if (error) throw error;
      setAdmins((data as { admins: AdminEntry[] }).admins ?? []);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat",
        text: (e as Error).message,
        background: "#0F1318",
        color: "#fff",
        confirmButtonColor: "#00FF88",
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchAdmins();
  }, [isSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-admin", {
        body: { email: trimmed },
      });
      if (error) {
        // Try to parse function error
        let msg = error.message;
        try {
          const ctx = (error as unknown as { context?: { body?: string } }).context;
          if (ctx?.body) {
            const parsed = JSON.parse(ctx.body);
            msg = parsed.error ?? msg;
          }
        } catch {/* ignore */}
        throw new Error(msg);
      }
      await Swal.fire({
        icon: "success",
        title: "Admin diundang!",
        html: `Email <b>${trimmed}</b> telah ditambahkan sebagai admin.<br/>Magic link telah dikirim ke email tersebut.`,
        background: "#0F1318",
        color: "#fff",
        confirmButtonColor: "#00FF88",
      });
      setEmail("");
      fetchAdmins();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal mengundang",
        text: (err as Error).message,
        background: "#0F1318",
        color: "#fff",
        confirmButtonColor: "#00FF88",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (entry: AdminEntry) => {
    if (entry.role === "super_admin") return;
    const result = await Swal.fire({
      title: "Cabut akses admin?",
      html: `Akses admin untuk <b>${entry.email}</b> akan dicabut.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Cabut",
      cancelButtonText: "Batal",
      background: "#0F1318",
      color: "#fff",
      confirmButtonColor: "#FF3366",
      cancelButtonColor: "#475569",
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase.from("user_roles").delete().eq("id", entry.id);
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal mencabut",
        text: error.message,
        background: "#0F1318",
        color: "#fff",
        confirmButtonColor: "#00FF88",
      });
      return;
    }
    Swal.fire({
      icon: "success",
      title: "Akses dicabut",
      background: "#0F1318",
      color: "#fff",
      confirmButtonColor: "#00FF88",
      timer: 1600,
      showConfirmButton: false,
    });
    fetchAdmins();
  };

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Navbar />

      <div className="container max-w-4xl mx-auto px-4 py-6 md:py-10 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-mono uppercase tracking-wider mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded bg-primary/10 border border-primary/30">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground">
              Manage Admins
            </h1>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Super Admin Panel
            </p>
          </div>
        </div>

        {/* Invite Form */}
        <div className="bg-card border border-border rounded p-5 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary font-mono mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Undang Admin Baru
          </h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="pl-9 font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !email.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase tracking-wider"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengundang...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Undang
                </>
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Magic link akan dikirim ke email. User akan langsung jadi admin tanpa registrasi manual.
          </p>
        </div>

        {/* Admin List */}
        <div className="bg-card border border-border rounded">
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary font-mono">
              Admin Aktif ({admins.length})
            </h2>
          </div>

          {fetching ? (
            <div className="p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : admins.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground font-mono">
              Belum ada admin.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {admins.map((a) => (
                <li
                  key={a.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded border ${
                        a.role === "super_admin"
                          ? "bg-accent/10 border-accent/40"
                          : "bg-primary/10 border-primary/30"
                      }`}
                    >
                      {a.role === "super_admin" ? (
                        <Crown className="w-4 h-4 text-accent" />
                      ) : (
                        <Shield className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.email}</p>
                      <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                        {a.role === "super_admin" ? "Super Admin" : "Admin"}
                        {a.invited_by_email && ` · diundang oleh ${a.invited_by_email}`}
                      </p>
                    </div>
                  </div>

                  {a.role === "super_admin" ? (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent px-2 py-1 border border-accent/30 rounded">
                      Owner
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(a)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageAdmins;
