const LICENSE_STORAGE_KEY = "deimos-license-session";

export interface LicenseSession {
  key: string;
  validatedAt: string;
  expiryDate: string;
}

export function saveLicenseSession(session: LicenseSession) {
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(session));
}

export function getLicenseSession(): LicenseSession | null {
  const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LicenseSession;
    if (!parsed.key || !parsed.expiryDate || !parsed.validatedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLicenseSession() {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
}

export function isLicenseSessionActive(session: LicenseSession | null) {
  if (!session) return false;
  return new Date(session.expiryDate).getTime() >= new Date().setHours(0, 0, 0, 0);
}