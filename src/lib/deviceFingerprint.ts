// Computes a lightweight, best-effort device fingerprint from stable
// browser/hardware characteristics (not a stored/random ID, so clearing
// cookies or local storage doesn't change it) and sends it along with every
// API call via the X-Device-Fingerprint header. The backend
// (internal/fingerprint) uses it purely as a heuristic signal — never to
// auto-ban — to flag on the admin BAN page when the same apparent device is
// being seen from an unusually large number of different IPs in a short
// span, which typically means someone is rotating through a proxy/VPN pool
// to make one visitor look like many. A normal visitor is completely
// unaffected: nothing here changes behavior or adds any friction, it's only
// ever read by the admin panel.
//
// Deliberately dependency-free (no canvas/audio fingerprinting libraries):
// just a handful of navigator/screen properties every browser already
// exposes, hashed into a short opaque string.

// FNV-1a: a small, fast, non-cryptographic hash — good enough here since
// this only has to distinguish a modest number of concurrent devices at one
// live event, not resist deliberate collision attempts.
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function collectSignals(): string {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const signals = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(","),
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency,
    nav.deviceMemory,
    new Date().getTimezoneOffset(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  return signals.join("|");
}

// Computed once per page load and reused — none of the underlying signals
// change during a session.
let cached: string | null = null;

export function getDeviceFingerprint(): string {
  if (cached !== null) return cached;
  try {
    cached = fnv1a(collectSignals());
  } catch {
    // Some signal (e.g. Intl in an unusual environment) threw — better to
    // send nothing than to crash the request.
    cached = "";
  }
  return cached;
}
