import useSWR from "swr";
import { TechnicalHistoryPoint } from "../lib/types";
import { fetcher } from "../lib/api";

export function useTechnicalsHistory(ticker: string, days: number) {
  return useSWR<TechnicalHistoryPoint[]>(
    ticker && days ? `/api/stocks/${ticker}/technicals/history?days=${days}` : null,
    fetcher
  );
}
