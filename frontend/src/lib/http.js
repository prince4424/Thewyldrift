export const TOKEN_KEY = "thewyldriftAdminToken";

const DEFAULT_API_BASE = "http://localhost:8080";

/** Base URL for `/api/...` (no trailing slash). Set `VITE_API_URL` in `.env` when the API is not same-origin. */
export function getApiBase() {
  const raw =
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (raw !== undefined && String(raw).trim() !== "") {
    return String(raw).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return DEFAULT_API_BASE.replace(/\/$/, "");
}

/** Turn `/api/foo` into `http://localhost:8080/api/foo`. Leaves absolute URLs unchanged. */
export function resolveApiUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${getApiBase()}${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function generateIdempotencyKey() {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function requestJson(url, options = {}) {
  const headers = new Headers(options.headers || {});

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (!(options.body instanceof FormData) && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const resolvedUrl = resolveApiUrl(url);

  let response;
  let data = {};
  try {
    response = await fetch(resolvedUrl, { ...options, headers });
    data = await response.json().catch(() => ({}));
  } catch (error) {
    throw new Error(error?.message || "Network request failed");
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    const errors = Array.isArray(data?.errors) ? data.errors.filter(Boolean) : [];
    const base = data?.message || data?.error || "Request failed";
    const detail = errors.length ? `${base}: ${errors.join(" ")}` : base;
    const err = new Error(detail);
    // Attach structured info for UI field highlighting.
    err.status = response.status;
    err.payload = data;
    err.validationErrors = errors;
    throw err;
  }

  return data;
}

