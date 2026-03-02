import { useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://nemsuee-a3cxc3fgejhxapfb.southeastasia-01.azurewebsites.net/api";

export function useApi(token: string | null) {
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  async function api(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, options);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Request failed");
    }
    return res.status === 204 ? null : res.json();
  }

  return { api, headers };
}
