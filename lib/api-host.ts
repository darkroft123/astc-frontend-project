/**
 * Resolves scheme (https/http) based on environment.
 */
function getProtocol(): string {
  if (typeof window !== "undefined") {
    return window.location.protocol === "https:" || window.location.hostname.includes("joyit")
      ? "https"
      : window.location.protocol.replace(":", "");
  }
  return "https";
}

/**
 * Resolves base domain (always joyit.io in production, never .local).
 */
function getBaseDomain(): string {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname.includes("joyit") || hostname.includes("astc")) {
      return "joyit.io";
    }
  }
  return "joyit.io";
}

/**
 * Returns the GraphQL Gateway endpoint for client requests.
 */
export function getGraphQLUrl(): string {
  if (process.env.NEXT_PUBLIC_GRAPHQL_URL) {
    return process.env.NEXT_PUBLIC_GRAPHQL_URL;
  }
  const scheme = getProtocol();
  return `${scheme}://astc-joyit.io/graphql`;
}

/**
 * Resolves Auth Frontend (Login UI) URL.
 */
export function getAuthFrontendUrl(path: string = "/login"): string {
  const scheme = getProtocol();
  const authFrontendUrl =
    process.env.NEXT_PUBLIC_AUTH_FRONTEND_URL ||
    `${scheme}://astc-joyit.io`;
  return `${authFrontendUrl}${path}`;
}

/**
 * Resolves base API URLs for microservices in K8s.
 */
export function getApiBaseUrl(port?: number | string, path: string = ""): string {
  const scheme = getProtocol();
  const p = typeof port === "string" ? parseInt(port, 10) : port;

  if (p === 3003) {
    return getAuthFrontendUrl(path);
  }

  if (p === 3010) {
    const authHost =
      process.env.NEXT_PUBLIC_AUTH_API_URL ||
      `${scheme}://auth-api.astc.joyit.io`;
    return `${authHost}${path}`;
  }

  const apiHost =
    process.env.NEXT_PUBLIC_API_URL ||
    `${scheme}://astc-joyit.io/graphql`;
  return `${apiHost}${path}`;
}
