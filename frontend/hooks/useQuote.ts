import useSWR from "swr";
import { QuoteSnapshot } from "../lib/types";
import { fetcher } from "../lib/api";

export function useQuote(ticker: string) {
  return useSWR<QuoteSnapshot>(
    ticker ? `/api/stocks/${ticker}/quote` : null,
    fetcher,
    { refreshInterval: 60000 } // Refresh every 60s
  );
}
