import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gem, KeyRound, Loader2, ShieldCheck, AlertTriangle, LogOut } from "lucide-react";
import Swal from "sweetalert2";
import { Navbar } from "@/components/Navbar";
import { ParticleBackground } from "@/components/ParticleBackground";
import { ApkList } from "@/components/ApkList";
import { DonationApkList } from "@/components/DonationApkList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { clearLicenseSession, getLicenseSession, isLicenseSessionActive, saveLicenseSession } from "@/lib/license-session";
import { getDeviceFingerprint, getDeviceId } from "@/lib/device-id";

type ValidationResult = {
  is_valid: boolean;
  message: string;
  expiry_date: string | null;
};

const DonationPage = () => {
  const { isAdmin } = useAuth();
  const [licenseKey, setLicenseKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [refreshTrigger] = useState(0);
  const revalidatingRef = useRef(false);

  const invokeLicenseValidation = useCallback(async (key: string) => {
    const fingerprint = await getDeviceFingerprint();
    const { data, error } = await supabase.functions.invoke("validate-license-key", {
      body: { key, deviceId: getDeviceId(), fingerprint },
    });

    if (error) {
      let message = error.message;
      try {
        const parsed = JSON.parse((error as { context?: { body?: string } }).context?.body ?? "{}");
        message = parsed.error || parsed.message || message;
      } catch {
      }
      throw new Error(message);
    }

    const result = data as ValidationResult;
    if (!result?.is_valid) {
      throw new Error(result?.message || "License key tidak valid");
    }

    return result;
  }, []);

  const revokeAccess = useCallback(async (message: string) => {
    clearLicenseSession();
    setAuthorized(false);
    setExpiryDate(null);
    setLicenseKey("");

    await Swal.fire({
      icon: "warning",
      title: "License perlu divalidasi ulang",
      text: message,
      confirmButtonColor: "hsl(145 65% 42%)",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const session = getLicenseSession();

      if (!isLicenseSessionActive(session)) {
        if (session) {
          clearLicenseSession();
        }
        if (!cancelled) {
          setCheckingSession(false);
        }
        return;
      }

      try {
        const result = await invokeLicenseValidation(session.key);
        if (cancelled) return;

        saveLicenseSession({
          key: session.key,
          validatedAt: new Date().toISOString(),
          expiryDate: result.expiry_date ?? session.expiryDate,
        });
        setAuthorized(true);
        setLicenseKey(session.key);
        setExpiryDate(result.expiry_date ?? session.expiryDate);
      } catch (error) {
        if (!cancelled) {
          await revokeAccess((error as Error).message);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [invokeLicenseValidation, revokeAccess]);

  const revalidateActiveSession = useCallback(async () => {
    const session = getLicenseSession();
    if (!session || !isLicenseSessionActive(session) || revalidatingRef.current) {
      return;
    }

    revalidatingRef.current = true;

    try {
      const result = await invokeLicenseValidation(session.key);
      saveLicenseSession({
        key: session.key,
        validatedAt: new Date().toISOString(),
        expiryDate: result.expiry_date ?? session.expiryDate,
      });
      setAuthorized(true);
      setLicenseKey(session.key);
      setExpiryDate(result.expiry_date ?? session.expiryDate);
    } catch (error) {
      await revokeAccess((error as Error).message);
    } finally {
      revalidatingRef.current = false;
    }
  }, [invokeLicenseValidation, revokeAccess]);

  useEffect(() => {
    if (!authorized) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void revalidateActiveSession();
      }
    };

    const intervalId = window.setInterval(() => {
      void revalidateActiveSession();
    }, 30000);

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authorized, revalidateActiveSession]);

  const expiryText = useMemo(() => {
    if (!expiryDate) return null;
    return new Date(expiryDate).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [expiryDate]);

  const validateKey = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = licenseKey.trim().toUpperCase();
    if (!normalized) {
      await Swal.fire({
        icon: "warning",
        title: "License key wajib diisi",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
      return;
    }

    setValidating(true);
    try {
      const result = await invokeLicenseValidation(normalized);

      saveLicenseSession({
        key: normalized,
        validatedAt: new Date().toISOString(),
        expiryDate: result.expiry_date ?? new Date().toISOString(),
      });
      setAuthorized(true);
      setExpiryDate(result.expiry_date);
      setLicenseKey(normalized);

      await Swal.fire({
        icon: "success",
        title: "Akses donasi terbuka",
        text: "License key valid. Anda sekarang bisa melihat APK donasi.",
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    } catch (error) {
      setAuthorized(false);
      clearLicenseSession();
      await Swal.fire({
        icon: "error",
        title: "Akses ditolak",
        text: (error as Error).message,
        confirmButtonColor: "hsl(145 65% 42%)",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleResetSession = () => {
    clearLicenseSession();
    setAuthorized(false);
    setExpiryDate(null);
    setLicenseKey("");
  };

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <Navbar />

      <main className="container max-w-7xl mx-auto px-4 py-6 md:py-10 relative z-10 space-y-8">
        <section className="border border-border bg-card rounded p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-primary">
                <Gem className="w-3.5 h-3.5" />
                Donation Access
              </div>
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground">APK Donasi</h1>
              <p className="text-sm text-muted-foreground font-mono max-w-xl">
                Masukkan license key aktif untuk membuka daftar APK donasi. Key akan terikat ke perangkat (browser) saat pertama kali digunakan, jadi aman digunakan saat berganti WiFi atau data seluler.
              </p>
            </div>

            {isAdmin ? (
              <div className="rounded border border-border bg-secondary/40 px-4 py-3 text-sm font-mono text-muted-foreground">
                <div className="flex items-center gap-2 text-primary font-semibold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  Admin Access
                </div>
                <p>Bypass license aktif</p>
              </div>
            ) : authorized && (
              <div className="rounded border border-border bg-secondary/40 px-4 py-3 text-sm font-mono text-muted-foreground">
                <div className="flex items-center gap-2 text-primary font-semibold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  License Aktif
                </div>
                <p>{licenseKey}</p>
                {expiryText && <p>Berlaku sampai {expiryText}</p>}
              </div>
            )}
          </div>
        </section>

        {isAdmin ? (
          <section className="space-y-4">
            <ApkList refreshTrigger={refreshTrigger} category="donation" title="Donation APK/APKS" isAdmin />
          </section>
        ) : checkingSession ? (
          <section className="max-w-xl mx-auto border border-border bg-card rounded p-5 md:p-6">
            <div className="flex items-center justify-center gap-3 text-sm font-mono text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Memeriksa status license...
            </div>
          </section>
        ) : !authorized ? (
          <section className="max-w-xl mx-auto border border-border bg-card rounded p-5 md:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded bg-secondary flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Verifikasi License Key</h2>
                <p className="text-xs text-muted-foreground font-mono">Akses halaman ini memerlukan key yang valid dan belum expired.</p>
              </div>
            </div>

            <form onSubmit={validateKey} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license-key">License Key</Label>
                <Input
                  id="license-key"
                  autoComplete="off"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="DEIMOS-XXXXXX-XXXXXX"
                  className="h-12 font-mono uppercase tracking-wider"
                  disabled={validating}
                />
              </div>

              <div className="rounded border border-border bg-secondary/30 p-4 text-xs font-mono text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-primary" />
                  <p>Key valid akan tersimpan di browser agar tidak perlu input ulang saat refresh halaman.</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-accent" />
                  <p>Maks. 5 browser per key (mis. Chrome, Telegram, Google App). Jika dipakai di browser baru melebihi batas, hubungi admin untuk reset.</p>
                </div>
              </div>

              <Button type="submit" disabled={validating} className="w-full h-12 text-base font-bold uppercase tracking-wider">
                {validating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memvalidasi...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Buka APK Donasi
                  </>
                )}
              </Button>
            </form>
          </section>
        ) : (
          <section className="space-y-4">
            <DonationApkList refreshTrigger={refreshTrigger} />
          </section>
        )}
      </main>
    </div>
  );
};

export default DonationPage;