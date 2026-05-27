import type { CurrencyCode } from "../types/invoice";

interface CurrencyMeta {
  symbol: string;
  decimals: number; // most are 2, JPY is 0
  locale: string;
}

const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  USD: { symbol: "$", decimals: 2, locale: "en-US" },
  EUR: { symbol: "€", decimals: 2, locale: "en-IE" },
  GBP: { symbol: "£", decimals: 2, locale: "en-GB" },
  AUD: { symbol: "A$", decimals: 2, locale: "en-AU" },
  JPY: { symbol: "¥", decimals: 0, locale: "ja-JP" },
  CAD: { symbol: "C$", decimals: 2, locale: "en-CA" },
  INR: { symbol: "₹", decimals: 2, locale: "en-IN" },
  BRL: { symbol: "R$", decimals: 2, locale: "pt-BR" },
};

export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_META[currency].symbol;
}

export function getCurrencyDecimals(currency: CurrencyCode): number {
  return CURRENCY_META[currency].decimals;
}

/**
 * Format cents as a currency string with proper grouping.
 * For JPY, "cents" are still the smallest unit (i.e. yen × 1) — we store everything
 * as integer cents and only present according to the currency's decimal count.
 */
export function formatCents(cents: number, currency: CurrencyCode): string {
  const meta = CURRENCY_META[currency];
  const isNegative = cents < 0;
  const abs = Math.abs(cents);

  if (meta.decimals === 0) {
    const whole = Math.round(abs / 100);
    const formatted = whole.toLocaleString(meta.locale);
    return (isNegative ? "-" : "") + meta.symbol + formatted;
  }

  const divisor = Math.pow(10, meta.decimals);
  const factor = 100 / divisor;
  const whole = Math.floor(abs / 100);
  const remainder = Math.round((abs % 100) / factor);
  const formatted =
    whole.toLocaleString(meta.locale) +
    "." +
    String(remainder).padStart(meta.decimals, "0");
  return (isNegative ? "-" : "") + meta.symbol + formatted;
}

/**
 * Parse a user-entered dollar string into cents.
 * Accepts negatives, commas, currency symbols, spaces. Returns null if invalid.
 */
export function parseDollarsToCents(input: string): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") {
    return null;
  }
  const num = parseFloat(cleaned);
  if (isNaN(num) || !isFinite(num)) return null;
  return Math.round(num * 100);
}

/**
 * Convert cents to a plain dollar string for use in number inputs.
 */
export function centsToInputString(cents: number): string {
  if (cents === 0) return "";
  const isNegative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const remainder = abs % 100;
  const out =
    remainder === 0
      ? String(whole)
      : whole + "." + String(remainder).padStart(2, "0");
  return (isNegative ? "-" : "") + out;
}
