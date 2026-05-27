import type { InvoiceDoc } from "../types/invoice";

export function documentLabel(doc: InvoiceDoc): string {
  return doc.kind === "receipt" ? "Receipt" : "Invoice";
}

export function hasPaymentInfo(doc: InvoiceDoc): boolean {
  const p = doc.payment;
  return !!(p.bankDetails || p.paypal || p.stripeLink || p.cryptoAddress);
}
