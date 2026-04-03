export interface CurrencyMeta {
  symbol: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  code: string;
  name_plural: string;
  type: string;
}

export interface CurrenciesResponse {
  data: Record<string, CurrencyMeta>;
}

export interface LatestResponse {
  data: Record<string, number>;
}

export interface HistoricalResponse {
  data: Record<string, Record<string, number>>;
}

export interface HistoryRecord {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  date: string;
  timestamp: string;
}

export interface ConversionError {
  message: string;
  field: 'currencies' | 'conversion' | null;
}
