const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function getBrowserOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:8080";
}

function resolveBackendOrigin() {
  const raw = process.env.REACT_APP_API_URL || getBrowserOrigin();
  let parsed;

  try {
    parsed = new URL(raw, getBrowserOrigin());
  } catch {
    parsed = new URL("http://localhost:8080");
  }

  const pageIsHttps =
    typeof window !== "undefined" && window.location?.protocol === "https:";
  const isLocalhost = LOCAL_HOSTNAMES.has(parsed.hostname);

  // Prevent mixed-content: if app is on HTTPS and backend host is not localhost,
  // force HTTPS for HTTP-based endpoints (REST/SSE/SockJS).
  if (pageIsHttps && !isLocalhost) {
    parsed.protocol = "https:";
  }

  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

export function getApiBaseUrl() {
  return new URL("/api", resolveBackendOrigin()).toString();
}

export function buildApiUrl(path) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return new URL(normalizedPath, `${getApiBaseUrl()}/`).toString();
}

export function getSockJsUrl() {
  return new URL("/ws", resolveBackendOrigin()).toString();
}

export function getStompBrokerUrl() {
  const base = resolveBackendOrigin();
  const pageIsHttps =
    typeof window !== "undefined" && window.location?.protocol === "https:";
  const isLocalhost = LOCAL_HOSTNAMES.has(base.hostname);

  base.protocol = pageIsHttps && !isLocalhost ? "wss:" : "ws:";
  base.pathname = "/ws";
  return base.toString();
}