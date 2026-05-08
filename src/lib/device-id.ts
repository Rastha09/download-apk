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
  // RFC4122-ish fallback for older browsers
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
