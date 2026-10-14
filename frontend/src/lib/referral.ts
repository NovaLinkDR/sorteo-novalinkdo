const REF_KEY = "sorteo_referral_code";

export function saveReferralCode(code: string | null) {
  if (!code || typeof window === "undefined") return;
  const trimmed = code.trim();
  if (trimmed) {
    try {
      sessionStorage.setItem(REF_KEY, trimmed);
    } catch {}
  }
}

export function getReferralCode(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(REF_KEY) || "";
  } catch {
    return "";
  }
}

export function appendRefToUrl(url: string): string {
  const ref = getReferralCode();
  if (!ref) return url;
  if (url.includes("ref=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ref=${encodeURIComponent(ref)}`;
}
