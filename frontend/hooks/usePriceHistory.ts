import useSWR from "swr";
import { OHLCVPoint } from "../lib/types";
import { fetcher } from "../lib/api";

export function usePriceHistory(ticker: string, period: string) {
  return useSWR<OHLCVPoint[]>(
    ticker && period ? `/api/stocks/${ticker}/history?period=${period}` : null,
    fetcher
  );
}
