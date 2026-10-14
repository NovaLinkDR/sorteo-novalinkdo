const REF_KEY = "sorteo_referral_code";

/**
 * Guarda el codigo de referido. Se usa localStorage (no sessionStorage) para
 * que no se pierda si el comprador navega en otra pestaña o vuelve mas tarde.
 * El ultimo link de referido que abra es el que cuenta.
 */
export function saveReferralCode(code: string | null) {
  if (!code || typeof window === "undefined") return;
  const trimmed = code.trim();
  if (trimmed) {
    try {
      localStorage.setItem(REF_KEY, trimmed);
    } catch {}
  }
}

export function getReferralCode(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(REF_KEY) || "";
  } catch {
    return "";
  }
}

export function clearReferralCode() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REF_KEY);
  } catch {}
}

export function appendRefToUrl(url: string): string {
  const ref = getReferralCode();
  if (!ref) return url;
  if (url.includes("ref=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ref=${encodeURIComponent(ref)}`;
}
