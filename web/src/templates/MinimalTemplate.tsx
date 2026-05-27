import type { CSSProperties, ReactNode } from "react";
import type { InvoiceDoc, InvoiceTotals } from "../types/invoice";
import { formatCents } from "../lib/money";
import { lineTotalCents } from "../lib/totals";
import { formatDateLong } from "../lib/dates";
import { documentLabel, hasPaymentInfo } from "./shared";

interface Props {
  doc: InvoiceDoc;
  totals: InvoiceTotals;
}

export function MinimalTemplate({ doc, totals }: Props) {
  const label = documentLabel(doc);
  return (
    <div
      className="invoice-paper template-minimal"
      style={{
        padding: 56,
        fontSize: 13,
        lineHeight: 1.7,
        color: "#222",
      }}
    >
      <div style={{ marginBottom: 48, display: "flex", gap: 16, alignItems: "center" }}>
        {doc.business.logoDataUrl ? (
          <img
            src={doc.business.logoDataUrl}
            alt=""
            style={{ width: 48, height: 48, objectFit: "contain" }}
          />
        ) : null}
        <div
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          {label}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          marginBottom: 48,
        }}
      >
        <div>
          <Tiny>From</Tiny>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {doc.business.name || "Your Business"}
          </div>
          <BizMeta doc={doc} />
        </div>
        <div>
          <Tiny>To</Tiny>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {doc.client.name || "Client name"}
          </div>
          {doc.client.address ? (
            <div style={{ whiteSpace: "pre-line", color: "#666" }}>
              {doc.client.address}
            </div>
          ) : null}
          {doc.client.email ? (
            <div style={{ color: "#666" }}>{doc.client.email}</div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: doc.kind === "invoice" ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr",
          gap: 24,
          marginBottom: 40,
          paddingBottom: 24,
          borderBottom: "1px solid #ddd",
        }}
      >
        {doc.kind === "invoice" ? <Meta label="Number" value={`#${doc.number}`} /> : null}
        <Meta label="Issued" value={formatDateLong(doc.issueDate)} />
        {doc.kind === "invoice" ? <Meta label="Due" value={formatDateLong(doc.dueDate)} /> : null}
        <Meta label="Status" value={doc.status} mono />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={th("left")}>Item</th>
            <th style={th("right", 60)}>Qty</th>
            <th style={th("right", 110)}>Rate</th>
            <th style={th("right", 120)}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={td("left")}>{it.description || "—"}</td>
              <td style={td("right")}>{formatQty(it.quantity)}</td>
              <td style={td("right")}>
                {formatCents(it.unitPriceCents, doc.currency)}
              </td>
              <td style={td("right")}>
                {formatCents(lineTotalCents(it), doc.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Totals doc={doc} totals={totals} />

      {doc.notes ? (
        <div style={{ marginTop: 48 }}>
          <Tiny>Notes</Tiny>
          <div style={{ whiteSpace: "pre-line" }}>{doc.notes}</div>
        </div>
      ) : null}

      {hasPaymentInfo(doc) ? (
        <div style={{ marginTop: 32 }}>
          <Tiny>Payment</Tiny>
          <PaymentBlock doc={doc} />
        </div>
      ) : null}
    </div>
  );
}

function BizMeta({ doc }: { doc: InvoiceDoc }) {
  const lines: string[] = [];
  if (doc.business.address) lines.push(doc.business.address);
  const contact = [doc.business.email, doc.business.phone, doc.business.website]
    .filter(Boolean)
    .join(" · ");
  if (contact) lines.push(contact);
  if (doc.business.taxId) lines.push(`Tax ID: ${doc.business.taxId}`);
  return (
    <div style={{ color: "#666", fontSize: 12, whiteSpace: "pre-line" }}>
      {lines.join("\n")}
    </div>
  );
}

function Tiny({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 2,
        color: "#999",
        marginBottom: 8,
        fontFamily: "Manrope, sans-serif",
      }}
    >
      {children}
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <Tiny>{label}</Tiny>
      <div
        style={{
          fontWeight: 500,
          textTransform: mono ? "capitalize" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Totals({ doc, totals }: { doc: InvoiceDoc; totals: InvoiceTotals }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ minWidth: 280 }}>
        <TotalsRow
          label="Subtotal"
          value={formatCents(totals.subtotalCents, doc.currency)}
        />
        {totals.discountCents > 0 ? (
          <TotalsRow
            label={
              doc.discountKind === "percentage"
                ? `Discount (${doc.discountValue}%)`
                : "Discount"
            }
            value={`-${formatCents(totals.discountCents, doc.currency)}`}
          />
        ) : null}
        {doc.taxRatePercent > 0 ? (
          <TotalsRow
            label={`Tax (${doc.taxRatePercent}%${doc.taxMode === "inclusive" ? " incl." : ""})`}
            value={formatCents(totals.taxCents, doc.currency)}
          />
        ) : null}
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Total
          </span>
          <span
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {formatCents(totals.totalCents, doc.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TotalsRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        color: "#555",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PaymentBlock({ doc }: { doc: InvoiceDoc }) {
  return (
    <div style={{ fontSize: 12, color: "#444", lineHeight: 1.7 }}>
      {doc.payment.bankDetails ? (
        <div style={{ whiteSpace: "pre-line" }}>{doc.payment.bankDetails}</div>
      ) : null}
      {doc.payment.paypal ? <div>PayPal: {doc.payment.paypal}</div> : null}
      {doc.payment.stripeLink ? <div>Pay online: {doc.payment.stripeLink}</div> : null}
      {doc.payment.cryptoAddress ? (
        <div style={{ wordBreak: "break-all" }}>
          Crypto: {doc.payment.cryptoAddress}
        </div>
      ) : null}
    </div>
  );
}

function th(align: "left" | "right", width?: number): CSSProperties {
  return {
    textAlign: align,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#999",
    fontWeight: 600,
    padding: "10px 6px",
    fontFamily: "Manrope, sans-serif",
    width,
  };
}
function td(align: "left" | "right"): CSSProperties {
  return { textAlign: align, padding: "12px 6px", verticalAlign: "top" };
}

function formatQty(q: number): string {
  if (Number.isInteger(q)) return String(q);
  return q.toFixed(2);
}
