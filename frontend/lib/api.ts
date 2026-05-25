const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

export function getApiUrl(): string {
  // Use NEXT_PUBLIC_API_URL if configured, otherwise fallback to local server gateway
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL;
}

export async function fetcher<JSON = any>(input: RequestInfo, init?: RequestInit): Promise<JSON> {
  const url = typeof input === "string" && !input.startsWith("http") 
    ? `${getApiUrl()}${input}` 
    : input;
    
  const res = await fetch(url, init);
  if (!res.ok) {
    const errorMsg = await res.text().catch(() => "Unknown fetch error");
    throw new Error(errorMsg || `HTTP error! status: ${res.status}`);
  }
  return res.json() as Promise<JSON>;
}

export async function triggerRescore(ticker: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiUrl()}/api/stocks/${ticker.toUpperCase()}/refresh`, {
      method: "POST",
    });

    return res.ok;
  } catch (e) {
    console.error("Failed to trigger rescore:", e);
    return false;
  }
}
