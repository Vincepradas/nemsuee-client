import { useMemo } from "react";

const configuredApiBase = (import.meta.env.VITE_API_URL || "nemsuee-a3cxc3fgejhxapfb.southeastasia-01.azurewebsites.net/api").trim();

const API_BASE =
  configuredApiBase || (import.meta.env.DEV ? "nemsuee-a3cxc3fgejhxapfb.southeastasia-01.azurewebsites.net/api" : "/api");

type ApiError = Error & { status?: number; path?: string };

export function useApi() {
  const headers = useMemo(
    () =>
      ({
        "Content-Type": "application/json",
      }) as Record<string, string>,
    [],
  );

  async function api(path: string, options: RequestInit = {}) {
    if (!import.meta.env.DEV && !configuredApiBase && !API_BASE.startsWith("/")) {
      throw new Error("VITE_API_URL is not configured for production.");
    }
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        ...options,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.message || body.error || `Request failed (${res.status})`;
        const err = new Error(message) as ApiError;
        err.status = res.status;
        err.path = path;
        throw err;
      }
      return res.status === 204 ? null : res.json();
    } catch (error) {
      if (error instanceof Error) {
        // Fetch throws TypeError on CORS/network issues.
        if (error.name === "TypeError") {
          throw new Error(
            "Network/CORS error: cannot reach server. Please check API URL, CORS origin, and backend status.",
          );
        }
        throw error;
      }
      throw new Error("Unexpected request error.");
    }
  }

  return { api, headers };
}
