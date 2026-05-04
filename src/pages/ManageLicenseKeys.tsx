import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Copy, KeyRound, Loader2, RotateCcw, Search, ShieldCheck, Trash2, Plus, RefreshCw, X } from "lucide-react";
import Swal from "sweetalert2";
import { Navbar } from "@/components/Navbar";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface LicenseKeyRow {
  id: string;
  key_string: string;
  expiry_date: string;
  created_at: string;
  bound_ip: string | null;
  is_active: boolean;
  created_by: string | null;
}

const createRandomKey = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chunk = (length: number) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `DEIMOS-${chunk(6)}-${chunk(6)}`;
};

const ManageLicenseKeys = () => {
  const { user, isAdmin, loading } = useAuth();
  const [licenseKeys, setLicenseKeys] = useState<LicenseKeyRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyString, setKeyString] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "expired" | "bound" | "unbound">("all");

  const grouped = useMemo(() => {
    const now = new Date().setHours(0, 0, 0, 0);
    const enriched = licenseKeys.map((item) => ({
      ...item,
      expired: new Date(item.expiry_date).getTime() < now,
    }));

    const q = searchQuery.trim().toLowerCase();
    return enriched.filter((item) => {
      if (q) {
        const haystack = `${item.key_string} ${item.bound_ip ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      switch (statusFilter) {
        case "active": return item.is_active && !item.expired;
        case "inactive": return !item.is_active;
        case "expired": return item.expired;
        case "bound": return !!item.bound_ip;
        case "unbound": return !item.bound_ip;
        default: return true;
      }
    });
  }, [licenseKeys, searchQuery, statusFilter]);

  const fetchKeys = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("license_keys")
        .select("id, key_string, expiry_date, created_at, bound_ip, is_active, created_by")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLicenseKeys((data ?? []) as LicenseKeyRow[]);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat key",
        text: (error as Error).message,
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchKeys();
  }, [isAdmin]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleGenerate = () => setKeyString(createRandomKey());

  const handleCopyKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      await Swal.fire({
        icon: "success",
        title: "Key berhasil disalin",
        text: value,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal menyalin key",
        text: "Browser tidak mengizinkan akses clipboard.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = keyString.trim().toUpperCase();
    if (!normalized || !expiryDate) {
      Swal.fire({ icon: "warning", title: "Lengkapi data", text: "Key dan tanggal expired wajib diisi.", confirmButtonColor: "hsl(145 65% 42%)" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("license_keys").insert({
        key_string: normalized,
        expiry_date: expiryDate,
        created_by: user.id,
        is_active: true,
      });
      if (error) throw error;

      await Swal.fire({ icon: "success", title: "License key dibuat", text: "Key baru berhasil disimpan.", confirmButtonColor: "hsl(145 65% 42%)" });
      setKeyString("");
      setExpiryDate("");
      fetchKeys();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Gagal membuat key", text: (error as Error).message, confirmButtonColor: "hsl(145 65% 42%)" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: LicenseKeyRow) => {
    const result = await Swal.fire({
      title: "Hapus license key?",
      text: row.key_string,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "hsl(0 84.2% 60.2%)",
      cancelButtonColor: "hsl(var(--muted))",
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase.from("license_keys").delete().eq("id", row.id);
    if (error) {
      Swal.fire({ icon: "error", title: "Gagal menghapus", text: error.message, confirmButtonColor: "hsl(145 65% 42%)" });
      return;
    }
    fetchKeys();
  };

  const handleResetIp = async (row: LicenseKeyRow) => {
    const { error } = await supabase.from("license_keys").update({ bound_ip: null }).eq("id", row.id);
    if (error) {
      Swal.fire({ icon: "error", title: "Gagal reset IP", text: error.message, confirmButtonColor: "hsl(145 65% 42%)" });
      return;
    }
    fetchKeys();
  };

  const handleToggleStatus = async (row: LicenseKeyRow) => {
    const { error } = await supabase.from("license_keys").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) {
      Swal.fire({ icon: "error", title: "Gagal mengubah status", text: error.message, confirmButtonColor: "hsl(145 65% 42%)" });
      return;
    }
    fetchKeys();
  };

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Navbar />
      <main className="container max-w-7xl mx-auto px-4 py-6 md:py-10 relative z-10 space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-mono uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>

        <section className="border border-border bg-card rounded p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded bg-primary/10 border border-primary/30">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground">Manage License Keys</h1>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Admin only</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="license-key-string">License Key (Manual / Generate)</Label>
              <div className="flex gap-2">
                <Input
                  id="license-key-string"
                  value={keyString}
                  onChange={(e) => setKeyString(e.target.value.toUpperCase())}
                  placeholder="Ketik manual atau klik Generate"
                  className="font-mono uppercase tracking-wider"
                />
                <Button type="button" variant="outline" onClick={handleGenerate} className="uppercase font-mono" title="Generate otomatis (opsional)">
                  <RefreshCw className="w-4 h-4" />
                  Auto
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">Bebas format — admin bisa membuat key manual sesuai keinginan.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-expiry">Tanggal Expired</Label>
              <Input id="license-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <Button type="submit" disabled={saving} className="uppercase tracking-wider font-mono">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Buat Key
            </Button>
          </form>
        </section>

        <section className="border border-border bg-card rounded overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-5 border-b border-border flex-wrap">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary font-mono">Daftar License Keys</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">Aktif, expired, dan status binding IP.</p>
            </div>
            <Button variant="outline" onClick={fetchKeys} disabled={fetching} className="uppercase tracking-wider font-mono">
              <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {fetching ? (
            <div className="p-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : grouped.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-mono">Belum ada license key.</div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Expired</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bound IP</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs md:text-sm">
                      <div className="flex min-w-[220px] items-center gap-2">
                        <span className="whitespace-nowrap">{row.key_string}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyKey(row.key_string)}
                          className="h-7 w-7 shrink-0 p-0"
                          aria-label={`Copy key ${row.key_string}`}
                          title="Copy key"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{new Date(row.expiry_date).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-mono uppercase ${row.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          <ShieldCheck className="w-3 h-3" />
                          {row.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                        {row.expired && <span className="inline-flex rounded px-2 py-1 text-[10px] font-mono uppercase bg-accent/10 text-accent">Expired</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.bound_ip ?? "Belum terikat"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(row)} className="font-mono uppercase">
                          {row.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleResetIp(row)} className="font-mono uppercase" disabled={!row.bound_ip}>
                          <RotateCcw className="w-4 h-4" />
                          Reset IP
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(row)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ManageLicenseKeys;