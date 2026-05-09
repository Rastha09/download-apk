const DEVICE_ID_KEY = "deimos-device-id";

/**
 * Returns a stable per-browser device ID. Generated once and stored in
 * localStorage. Survives WiFi/cellular changes because it is not based on IP.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? fallbackUuid()).toLowerCase();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function fallbackUuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Returns a hash representing the *physical device* (phone/tablet/PC).
 * Multiple browsers on the same device share the same fingerprint because
 * they share screen, timezone, platform, hardware concurrency, and language.
 * Used to prevent a license key from being shared to a different phone.
 */
let cachedFingerprint: string | null = null;
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;

  const nav = navigator as Navigator & { deviceMemory?: number; userAgentData?: { platform?: string } };
  const screenObj = window.screen;

  const parts = [
    nav.userAgentData?.platform ?? nav.platform ?? "",
    `${screenObj.width}x${screenObj.height}x${screenObj.colorDepth}`,
    String(window.devicePixelRatio ?? ""),
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    String(new Date().getTimezoneOffset()),
    String(nav.hardwareConcurrency ?? ""),
    String(nav.deviceMemory ?? ""),
    nav.language ?? "",
    (nav.languages ?? []).join(","),
    String(navigator.maxTouchPoints ?? ""),
  ];

  const data = new TextEncoder().encode(parts.join("|"));
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  cachedFingerprint = hex;
  return hex;
}
