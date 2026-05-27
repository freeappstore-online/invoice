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

export function ClassicTemplate({ doc, totals }: Props) {
  const label = documentLabel(doc);
  return (
    <div
      className="invoice-paper template-classic"
      style={{ padding: 32, fontSize: 13, lineHeight: 1.5 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #111",
          paddingBottom: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {doc.business.logoDataUrl ? (
            <img
              src={doc.business.logoDataUrl}
              alt=""
              style={{ width: 56, height: 56, objectFit: "contain" }}
            />
          ) : null}
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {doc.business.name || "Your Business"}
            </div>
            <BizMeta doc={doc} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {label}
          </div>
          {doc.kind === "invoice" ? (
            <div style={{ color: "#555", marginTop: 4 }}>#{doc.number}</div>
          ) : null}
          <Stamp status={doc.status} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div>
          <SectionLabel>Bill To</SectionLabel>
          <div style={{ fontWeight: 600 }}>
            {doc.client.name || "Client name"}
          </div>
          {doc.client.address ? (
            <div style={{ whiteSpace: "pre-line", color: "#555" }}>
              {doc.client.address}
            </div>
          ) : null}
          {doc.client.email ? (
            <div style={{ color: "#555" }}>{doc.client.email}</div>
          ) : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <Meta label="Issue date" value={formatDateLong(doc.issueDate)} />
          {doc.kind === "invoice" ? (
            <Meta label="Due date" value={formatDateLong(doc.dueDate)} />
          ) : null}
          <Meta label="Currency" value={doc.currency} />
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #111" }}>
            <th style={th("left")}>Description</th>
            <th style={th("right", 70)}>Qty</th>
            <th style={th("right", 110)}>Unit Price</th>
            <th style={th("right", 120)}>Total</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
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
        <div style={{ marginTop: 24 }}>
          <SectionLabel>Notes</SectionLabel>
          <div style={{ whiteSpace: "pre-line", color: "#333" }}>{doc.notes}</div>
        </div>
      ) : null}

      {hasPaymentInfo(doc) ? (
        <div style={{ marginTop: 16 }}>
          <SectionLabel>Payment</SectionLabel>
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
    .join("  ·  ");
  if (contact) lines.push(contact);
  if (doc.business.taxId) lines.push(`Tax ID: ${doc.business.taxId}`);
  return (
    <div style={{ color: "#555", fontSize: 12, whiteSpace: "pre-line" }}>
      {lines.join("\n")}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1.4,
        color: "#555",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: "#888",
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Totals({ doc, totals }: { doc: InvoiceDoc; totals: InvoiceTotals }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ minWidth: 260 }}>
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
            borderTop: "2px solid #111",
            marginTop: 8,
            paddingTop: 8,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 16,
            fontWeight: 800,
          }}
        >
          <span>Total</span>
          <span>{formatCents(totals.totalCents, doc.currency)}</span>
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
        color: "#333",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PaymentBlock({ doc }: { doc: InvoiceDoc }) {
  return (
    <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}>
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

function Stamp({ status }: { status: InvoiceDoc["status"] }) {
  if (status === "draft") return null;
  const color =
    status === "paid"
      ? "#16a34a"
      : status === "overdue"
        ? "#dc2626"
        : "#2563eb";
  return (
    <div
      style={{
        marginTop: 6,
        display: "inline-block",
        border: `2px solid ${color}`,
        color,
        textTransform: "uppercase",
        fontWeight: 800,
        letterSpacing: 1.5,
        padding: "2px 8px",
        fontSize: 11,
        borderRadius: 4,
      }}
    >
      {status}
    </div>
  );
}

function th(align: "left" | "right", width?: number): CSSProperties {
  return {
    textAlign: align,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#555",
    fontWeight: 700,
    padding: "8px 6px",
    width,
  };
}
function td(align: "left" | "right"): CSSProperties {
  return { textAlign: align, padding: "8px 6px", verticalAlign: "top" };
}

function formatQty(q: number): string {
  if (Number.isInteger(q)) return String(q);
  return q.toFixed(2);
}
