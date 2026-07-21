/**
 * Minimal typed fetch client for the Netlify Dashboard backoffice API.
 *
 * It is configured once at startup from Umbraco's auth context (see entry-point.ts), so every
 * request carries the backoffice bearer token — never call `fetch` directly from components.
 */

export interface ClientConfig {
  /** Backoffice base URL (e.g. https://localhost:44388). */
  baseUrl?: string;
  /** Returns the current bearer token value (without the "Bearer " scheme). */
  token?: () => string | undefined | Promise<string | undefined>;
  credentials?: RequestCredentials;
}

/** Base path for this package's API, matching [BackOfficeRoute] on the C# controllers. */
export const API_BASE_PATH = "/umbraco/netlify-dashboard/api/v1";

let config: ClientConfig = {};

export function setClientConfig(next: ClientConfig): void {
  config = { ...config, ...next };
}

/** Error carrying the HTTP status and the server-provided message. */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  const token = config.token ? await config.token() : undefined;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${config.baseUrl ?? ""}${API_BASE_PATH}${path}`, {
    method,
    headers,
    body: payload,
    credentials: config.credentials ?? "include",
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function readError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) {
      return response.statusText || `Request failed (${response.status})`;
    }
    // ASP.NET may return a ProblemDetails object or a plain string.
    try {
      const parsed = JSON.parse(text);
      return parsed?.detail ?? parsed?.title ?? parsed?.message ?? text;
    } catch {
      return text;
    }
  } catch {
    return response.statusText || `Request failed (${response.status})`;
  }
}

export const http = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
