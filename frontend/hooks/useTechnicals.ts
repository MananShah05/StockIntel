import useSWR from "swr";
import { TechnicalSnapshot } from "../lib/types";
import { fetcher } from "../lib/api";

export function useTechnicals(ticker: string) {
  return useSWR<TechnicalSnapshot>(
    ticker ? `/api/stocks/${ticker}/technicals` : null,
    fetcher
  );
}
