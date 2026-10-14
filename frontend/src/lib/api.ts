export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/**
 * Los assets de premios viven en el `public/` del backend y la BD los guarda
 * como rutas relativas ("/rifas/ps5.jpg"). La SPA vive en otro dominio, asi
 * que hay que anteponer la URL de la API. Las URLs absolutas pasan intactas.
 */
export function assetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

export async function api<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(opts?.headers);

  if (
    opts?.body &&
    !(opts.body instanceof FormData) &&
    !(opts.body instanceof URLSearchParams) &&
    !(opts.body instanceof Blob) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    credentials: "include",
    ...opts,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  let data: any = null;
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const message = (data && typeof data === "object" && data.error) ? data.error : `Error ${res.status}`;
    const err: ApiError = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

/**
 * Obtener comprobante o archivo binario con credenciales incluidas.
 */
export async function apiBlob(path: string, opts?: RequestInit): Promise<Blob> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    const err: ApiError = new Error(`Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.blob();
}
