import useSWR from "swr";
import { FundamentalSnapshot } from "../lib/types";
import { fetcher } from "../lib/api";

export function useFundamentals(ticker: string) {
  return useSWR<FundamentalSnapshot>(
    ticker ? `/api/stocks/${ticker}/fundamentals` : null,
    fetcher
  );
}
