import { useMemo } from "react";
import type { InvoiceDoc } from "../types/invoice";
import { computeTotals } from "../lib/totals";
import { ClassicTemplate } from "./ClassicTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { MinimalTemplate } from "./MinimalTemplate";

interface Props {
  doc: InvoiceDoc;
}

export function InvoicePreview({ doc }: Props) {
  const totals = useMemo(() => computeTotals(doc), [doc]);
  switch (doc.template) {
    case "modern":
      return <ModernTemplate doc={doc} totals={totals} />;
    case "minimal":
      return <MinimalTemplate doc={doc} totals={totals} />;
    case "classic":
    default:
      return <ClassicTemplate doc={doc} totals={totals} />;
  }
}

/** Build a fully self-contained HTML document for download/export. */
export function renderInvoiceToHtml(doc: InvoiceDoc, bodyHtml: string): string {
  const docTitle =
    doc.kind === "receipt"
      ? `Receipt ${doc.client.name || ""}`.trim()
      : `Invoice ${doc.number}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(docTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; padding: 0; background: #fff; color: #111; font-family: "Manrope", system-ui, sans-serif; }
  .invoice-paper { max-width: 800px; margin: 24px auto; box-shadow: 0 0 0 1px #eee; background: #fff; }
  @media print {
    @page { size: A4; margin: 12mm; }
    .invoice-paper { margin: 0; max-width: none; box-shadow: none; }
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
