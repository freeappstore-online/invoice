import type { InvoiceDoc, InvoiceTotals, LineItem } from "../types/invoice";

export function lineTotalCents(item: LineItem): number {
  // quantity may be decimal; price is in cents.
  return Math.round(item.quantity * item.unitPriceCents);
}

export function computeTotals(doc: InvoiceDoc): InvoiceTotals {
  const subtotalCents = doc.items.reduce(
    (sum, item) => sum + lineTotalCents(item),
    0,
  );

  let discountCents = 0;
  if (doc.discountKind === "amount") {
    discountCents = Math.round(doc.discountValue * 100);
  } else {
    discountCents = Math.round((subtotalCents * doc.discountValue) / 100);
  }
  if (discountCents < 0) discountCents = 0;
  if (discountCents > subtotalCents) discountCents = subtotalCents;

  const taxableCents = subtotalCents - discountCents;

  let taxCents = 0;
  let totalCents = 0;
  if (doc.taxMode === "exclusive") {
    taxCents = Math.round((taxableCents * doc.taxRatePercent) / 100);
    totalCents = taxableCents + taxCents;
  } else {
    // inclusive: total = taxable, tax is portion already inside
    totalCents = taxableCents;
    const divisor = 100 + doc.taxRatePercent;
    if (divisor > 0) {
      taxCents = Math.round((taxableCents * doc.taxRatePercent) / divisor);
    }
  }

  return {
    subtotalCents,
    discountCents,
    taxableCents,
    taxCents,
    totalCents,
  };
}
