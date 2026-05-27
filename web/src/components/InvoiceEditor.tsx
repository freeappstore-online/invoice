import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type {
  ClientInfo,
  CurrencyCode,
  DiscountKind,
  DocumentKind,
  InvoiceDoc,
  InvoiceStatus,
  LineItem,
  RecurrenceCadence,
  TaxMode,
  TemplateId,
} from "../types/invoice";
import { computeTotals, lineTotalCents } from "../lib/totals";
import {
  centsToInputString,
  formatCents,
  parseDollarsToCents,
} from "../lib/money";
import { makeId } from "../lib/id";
import { InvoicePreview, renderInvoiceToHtml } from "../templates/InvoicePreview";
import { downloadHtmlSnapshot } from "../lib/export";
import { renderToStaticMarkup } from "react-dom/server";
import { Field, SelectField, TextField } from "./Field";

interface Props {
  doc: InvoiceDoc;
  clients: ClientInfo[];
  onChange: (next: InvoiceDoc) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCreateNextRecurring: () => void;
  onSaveClient: (client: ClientInfo) => void;
  onBack: () => void;
}

const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "BRL", label: "BRL — Brazilian Real" },
];

const TEMPLATE_OPTIONS: { value: TemplateId; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
];

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const RECURRENCE_OPTIONS: { value: RecurrenceCadence; label: string }[] = [
  { value: "none", label: "Not recurring" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const KIND_OPTIONS: { value: DocumentKind; label: string }[] = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
];

export function InvoiceEditor({
  doc,
  clients,
  onChange,
  onDelete,
  onDuplicate,
  onCreateNextRecurring,
  onSaveClient,
  onBack,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [clientQuery, setClientQuery] = useState("");
  const totals = useMemo(() => computeTotals(doc), [doc]);

  const matchingClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return [];
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [clientQuery, clients]);

  const update = <K extends keyof InvoiceDoc>(key: K, value: InvoiceDoc[K]) => {
    onChange({ ...doc, [key]: value });
  };

  const updateBusiness = <K extends keyof InvoiceDoc["business"]>(
    key: K,
    value: InvoiceDoc["business"][K],
  ) => {
    onChange({ ...doc, business: { ...doc.business, [key]: value } });
  };
  const updateClient = <K extends keyof InvoiceDoc["client"]>(
    key: K,
    value: InvoiceDoc["client"][K],
  ) => {
    onChange({ ...doc, client: { ...doc.client, [key]: value } });
  };
  const updatePayment = <K extends keyof InvoiceDoc["payment"]>(
    key: K,
    value: InvoiceDoc["payment"][K],
  ) => {
    onChange({ ...doc, payment: { ...doc.payment, [key]: value } });
  };

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    const items = doc.items.map((it) =>
      it.id === id ? { ...it, ...patch } : it,
    );
    onChange({ ...doc, items });
  };
  const addItem = () => {
    onChange({
      ...doc,
      items: [
        ...doc.items,
        { id: makeId(), description: "", quantity: 1, unitPriceCents: 0 },
      ],
    });
  };
  const removeItem = (id: string) => {
    onChange({ ...doc, items: doc.items.filter((it) => it.id !== id) });
  };

  const onLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateBusiness("logoDataUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onPrint = () => {
    window.print();
  };

  const onDownloadHtml = () => {
    const body = renderToStaticMarkup(<InvoicePreview doc={doc} />);
    const html = renderInvoiceToHtml(doc, body);
    const filename =
      doc.kind === "receipt"
        ? `receipt-${doc.client.name || "unknown"}.html`
        : `invoice-${doc.number}.html`;
    downloadHtmlSnapshot(filename, html);
  };

  const applyClient = (c: ClientInfo) => {
    onChange({
      ...doc,
      client: {
        id: c.id,
        name: c.name,
        address: c.address,
        email: c.email,
      },
    });
    setClientQuery("");
  };

  const saveClientToDb = () => {
    if (!doc.client.name.trim()) return;
    onSaveClient(doc.client);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      {/* FORM */}
      <div className="no-print flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="rounded-md px-3 py-1.5 text-sm"
            style={{
              border: "1px solid var(--line)",
              color: "var(--ink)",
              background: "var(--panel)",
            }}
          >
            ← Back
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={onDuplicate}
              className="rounded-md px-3 py-1.5 text-sm"
              style={{
                border: "1px solid var(--line)",
                color: "var(--ink)",
                background: "var(--panel)",
              }}
            >
              Duplicate
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this document?")) onDelete();
              }}
              className="rounded-md px-3 py-1.5 text-sm"
              style={{
                border: "1px solid var(--error)",
                color: "var(--error)",
                background: "transparent",
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <Section title="Document">
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Type"
              value={doc.kind}
              onChange={(v) => update("kind", v)}
              options={KIND_OPTIONS}
            />
            <SelectField
              label="Template"
              value={doc.template}
              onChange={(v) => update("template", v)}
              options={TEMPLATE_OPTIONS}
            />
            {doc.kind === "invoice" ? (
              <TextField
                label="Number"
                value={doc.number}
                onChange={(v) => update("number", v)}
              />
            ) : (
              <div />
            )}
            <SelectField
              label="Status"
              value={doc.status}
              onChange={(v) => update("status", v)}
              options={STATUS_OPTIONS}
            />
            <TextField
              label="Issue date"
              type="date"
              value={doc.issueDate}
              onChange={(v) => update("issueDate", v)}
            />
            {doc.kind === "invoice" ? (
              <TextField
                label="Due date"
                type="date"
                value={doc.dueDate}
                onChange={(v) => update("dueDate", v)}
              />
            ) : (
              <div />
            )}
            <SelectField
              label="Currency"
              value={doc.currency}
              onChange={(v) => update("currency", v)}
              options={CURRENCY_OPTIONS}
            />
            <SelectField
              label="Recurring"
              value={doc.recurrence}
              onChange={(v) => update("recurrence", v)}
              options={RECURRENCE_OPTIONS}
            />
          </div>
          {doc.recurrence !== "none" ? (
            <button
              onClick={onCreateNextRecurring}
              className="mt-3 rounded-md px-3 py-1.5 text-sm"
              style={{
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                background: "transparent",
              }}
            >
              Create next ({doc.recurrence})
            </button>
          ) : null}
        </Section>

        <Section title="Your business">
          <div className="flex items-start gap-3">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg"
              style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
            >
              {doc.business.logoDataUrl ? (
                <img
                  src={doc.business.logoDataUrl}
                  alt=""
                  className="h-full w-full object-contain"
                />
              ) : (
                <span style={{ color: "var(--muted)", fontSize: 10 }}>LOGO</span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md px-3 py-1.5 text-xs"
                  style={{
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                    background: "var(--panel)",
                  }}
                >
                  Upload
                </button>
                {doc.business.logoDataUrl ? (
                  <button
                    onClick={() => updateBusiness("logoDataUrl", "")}
                    className="rounded-md px-3 py-1.5 text-xs"
                    style={{
                      border: "1px solid var(--line)",
                      color: "var(--muted)",
                      background: "transparent",
                    }}
                  >
                    Clear
                  </button>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onLogoUpload}
                  className="hidden"
                />
              </div>
              <TextField
                label="Or paste data URL"
                value={doc.business.logoDataUrl}
                onChange={(v) => updateBusiness("logoDataUrl", v)}
                placeholder="data:image/png;base64,..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
            <TextField
              label="Business name"
              value={doc.business.name}
              onChange={(v) => updateBusiness("name", v)}
            />
            <TextField
              label="Email"
              type="email"
              value={doc.business.email}
              onChange={(v) => updateBusiness("email", v)}
            />
            <TextField
              label="Phone"
              type="tel"
              value={doc.business.phone}
              onChange={(v) => updateBusiness("phone", v)}
            />
            <TextField
              label="Website"
              type="url"
              value={doc.business.website}
              onChange={(v) => updateBusiness("website", v)}
            />
            <TextField
              label="Tax ID"
              value={doc.business.taxId}
              onChange={(v) => updateBusiness("taxId", v)}
            />
            <TextField
              label="Address"
              value={doc.business.address}
              onChange={(v) => updateBusiness("address", v)}
              multiline
              rows={2}
            />
          </div>
        </Section>

        <Section title="Client">
          <div className="relative mb-3">
            <input
              type="text"
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              placeholder="Search saved clients..."
            />
            {matchingClients.length > 0 ? (
              <div
                className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg shadow-lg"
                style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
              >
                {matchingClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => applyClient(c)}
                    className="block w-full px-3 py-2 text-left text-sm hover:opacity-80"
                    style={{ color: "var(--ink)" }}
                  >
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.email ? (
                      <div style={{ color: "var(--muted)", fontSize: 11 }}>
                        {c.email}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Client name"
              value={doc.client.name}
              onChange={(v) => updateClient("name", v)}
            />
            <TextField
              label="Client email"
              type="email"
              value={doc.client.email}
              onChange={(v) => updateClient("email", v)}
            />
            <div className="sm:col-span-2">
              <TextField
                label="Client address"
                value={doc.client.address}
                onChange={(v) => updateClient("address", v)}
                multiline
                rows={2}
              />
            </div>
          </div>
          <button
            onClick={saveClientToDb}
            disabled={!doc.client.name.trim()}
            className="mt-3 rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
            style={{
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              background: "transparent",
            }}
          >
            Save client to address book
          </button>
        </Section>

        <Section title="Line items">
          <div className="flex flex-col gap-2">
            {doc.items.map((it) => (
              <LineItemRow
                key={it.id}
                item={it}
                currency={doc.currency}
                onChange={(patch) => updateItem(it.id, patch)}
                onRemove={() => removeItem(it.id)}
                canRemove={doc.items.length > 1}
              />
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-3 rounded-md px-3 py-1.5 text-sm"
            style={{
              border: "1px dashed var(--line-strong)",
              color: "var(--accent)",
              background: "transparent",
              width: "100%",
            }}
          >
            + Add line item
          </button>
        </Section>

        <Section title="Tax & discount">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tax rate %">
              <input
                type="number"
                value={doc.taxRatePercent}
                min={0}
                max={100}
                step={0.1}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  update("taxRatePercent", isNaN(v) ? 0 : v);
                }}
              />
            </Field>
            <SelectField<TaxMode>
              label="Tax mode"
              value={doc.taxMode}
              onChange={(v) => update("taxMode", v)}
              options={[
                { value: "exclusive", label: "Exclusive (add to total)" },
                { value: "inclusive", label: "Inclusive (already in price)" },
              ]}
            />
            <SelectField<DiscountKind>
              label="Discount type"
              value={doc.discountKind}
              onChange={(v) => update("discountKind", v)}
              options={[
                { value: "amount", label: "Fixed amount" },
                { value: "percentage", label: "Percentage" },
              ]}
            />
            <Field
              label={
                doc.discountKind === "percentage" ? "Discount %" : "Discount amount"
              }
            >
              <input
                type="number"
                value={doc.discountValue}
                min={0}
                step={doc.discountKind === "percentage" ? 0.1 : 1}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  update("discountValue", isNaN(v) ? 0 : v);
                }}
              />
            </Field>
          </div>
        </Section>

        <Section title="Notes & payment">
          <TextField
            label="Notes / payment terms"
            value={doc.notes}
            onChange={(v) => update("notes", v)}
            multiline
            rows={3}
            placeholder="Payment due within 14 days. Thank you for your business."
          />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Bank details"
              value={doc.payment.bankDetails}
              onChange={(v) => updatePayment("bankDetails", v)}
              multiline
              rows={3}
              placeholder="Account name, BSB/sort code, account number..."
            />
            <div className="flex flex-col gap-3">
              <TextField
                label="PayPal"
                value={doc.payment.paypal}
                onChange={(v) => updatePayment("paypal", v)}
                placeholder="email@example.com"
              />
              <TextField
                label="Stripe link"
                value={doc.payment.stripeLink}
                onChange={(v) => updatePayment("stripeLink", v)}
                placeholder="https://..."
              />
              <TextField
                label="Crypto address"
                value={doc.payment.cryptoAddress}
                onChange={(v) => updatePayment("cryptoAddress", v)}
              />
            </div>
          </div>
        </Section>

        <Section title="Export">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onPrint}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              Print / Save as PDF
            </button>
            <button
              onClick={onDownloadHtml}
              className="rounded-md px-3 py-1.5 text-sm"
              style={{
                border: "1px solid var(--line)",
                color: "var(--ink)",
                background: "var(--panel)",
              }}
            >
              Download HTML
            </button>
          </div>
        </Section>

        <div
          className="rounded-lg p-3 text-xs"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            color: "var(--muted)",
          }}
        >
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCents(totals.subtotalCents, doc.currency)}</span>
          </div>
          {totals.discountCents > 0 ? (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatCents(totals.discountCents, doc.currency)}</span>
            </div>
          ) : null}
          {doc.taxRatePercent > 0 ? (
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCents(totals.taxCents, doc.currency)}</span>
            </div>
          ) : null}
          <div
            className="mt-1 flex justify-between pt-1 text-sm font-bold"
            style={{ borderTop: "1px solid var(--line)", color: "var(--ink)" }}
          >
            <span>Total</span>
            <span>{formatCents(totals.totalCents, doc.currency)}</span>
          </div>
        </div>
      </div>

      {/* PREVIEW */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ boxShadow: "0 0 0 1px var(--line)" }}
      >
        <InvoicePreview doc={doc} />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
      }}
    >
      <div
        className="mb-3 text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

interface LineRowProps {
  item: LineItem;
  currency: CurrencyCode;
  onChange: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function LineItemRow({
  item,
  currency,
  onChange,
  onRemove,
  canRemove,
}: LineRowProps) {
  return (
    <div
      className="grid grid-cols-12 items-end gap-2"
      style={{
        padding: 8,
        borderRadius: 8,
        background: "var(--paper)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="col-span-12 sm:col-span-5">
        <label>Description</label>
        <input
          type="text"
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Item or service"
        />
      </div>
      <div className="col-span-3 sm:col-span-2">
        <label>Qty</label>
        <input
          type="number"
          value={item.quantity}
          min={0}
          step={0.01}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange({ quantity: isNaN(v) ? 0 : v });
          }}
        />
      </div>
      <div className="col-span-5 sm:col-span-2">
        <label>Unit price</label>
        <input
          type="text"
          inputMode="decimal"
          value={centsToInputString(item.unitPriceCents)}
          onChange={(e) => {
            const cents = parseDollarsToCents(e.target.value);
            onChange({ unitPriceCents: cents ?? 0 });
          }}
          placeholder="0.00"
        />
      </div>
      <div className="col-span-3 sm:col-span-2">
        <label>Total</label>
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "var(--panel)",
            color: "var(--ink)",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {formatCents(lineTotalCents(item), currency)}
        </div>
      </div>
      <div className="col-span-1">
        <button
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove item"
          className="h-9 w-9 rounded-md text-sm disabled:opacity-30"
          style={{
            border: "1px solid var(--line)",
            color: "var(--error)",
            background: "transparent",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
