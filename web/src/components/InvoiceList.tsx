import { useMemo, useState } from "react";
import type { InvoiceDoc, InvoiceStatus } from "../types/invoice";
import { formatCents } from "../lib/money";
import { computeTotals } from "../lib/totals";
import { formatDateLong, isOverdue } from "../lib/dates";

interface Props {
  invoices: InvoiceDoc[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
}

type Filter = "all" | InvoiceStatus | "receipts";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
  { id: "receipts", label: "Receipts" },
];

export function InvoiceList({
  invoices,
  onOpen,
  onNew,
  onDuplicate,
  onDelete,
  onStatusChange,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((d) => {
      // Promote unpaid past-due invoices to "overdue" for filtering display.
      const effectiveStatus: InvoiceStatus =
        d.kind === "invoice" &&
        d.status === "sent" &&
        isOverdue(d.dueDate)
          ? "overdue"
          : d.status;

      if (filter === "receipts") {
        if (d.kind !== "receipt") return false;
      } else if (filter !== "all") {
        if (d.kind === "receipt") return false;
        if (effectiveStatus !== filter) return false;
      }
      if (q) {
        const blob = `${d.number} ${d.client.name} ${d.client.email} ${d.notes}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [invoices, filter, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
          Documents
        </h2>
        <button
          onClick={onNew}
          className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + New invoice
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by number, client, notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              border: "1px solid var(--line)",
              background: filter === f.id ? "var(--accent)" : "var(--panel)",
              color: filter === f.id ? "#fff" : "var(--ink)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState onNew={onNew} hasAny={invoices.length > 0} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((doc) => (
            <Row
              key={doc.id}
              doc={doc}
              onOpen={() => onOpen(doc.id)}
              onDuplicate={() => onDuplicate(doc.id)}
              onDelete={() => {
                if (confirm("Delete this document?")) onDelete(doc.id);
              }}
              onStatusChange={(s) => onStatusChange(doc.id, s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNew, hasAny }: { onNew: () => void; hasAny: boolean }) {
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{
        background: "var(--panel)",
        border: "1px dashed var(--line-strong)",
      }}
    >
      <div className="text-4xl">📄</div>
      <div className="mt-2 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        {hasAny ? "No documents match" : "No invoices yet"}
      </div>
      <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
        {hasAny
          ? "Try clearing your filter or search."
          : "Create your first invoice to get started."}
      </div>
      <button
        onClick={onNew}
        className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ background: "var(--accent)" }}
      >
        + New invoice
      </button>
    </div>
  );
}

function Row({
  doc,
  onOpen,
  onDuplicate,
  onDelete,
  onStatusChange,
}: {
  doc: InvoiceDoc;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStatusChange: (s: InvoiceStatus) => void;
}) {
  const totals = computeTotals(doc);
  const effectiveStatus: InvoiceStatus =
    doc.kind === "invoice" && doc.status === "sent" && isOverdue(doc.dueDate)
      ? "overdue"
      : doc.status;
  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3 sm:flex-row sm:items-center"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
      }}
    >
      <button
        onClick={onOpen}
        className="flex flex-1 flex-col items-start text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--muted)" }}
          >
            {doc.kind}
          </span>
          {doc.kind === "invoice" ? (
            <span style={{ fontWeight: 700, color: "var(--ink)" }}>
              #{doc.number}
            </span>
          ) : null}
          <StatusPill status={effectiveStatus} />
          {doc.recurrence !== "none" ? (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
              style={{
                background: "var(--paper)",
                color: "var(--muted)",
                border: "1px solid var(--line)",
              }}
            >
              {doc.recurrence}
            </span>
          ) : null}
        </div>
        <div className="mt-1 text-sm" style={{ color: "var(--ink)" }}>
          {doc.client.name || "Unnamed client"}
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {formatDateLong(doc.issueDate)}
          {doc.kind === "invoice" ? ` · Due ${formatDateLong(doc.dueDate)}` : ""}
        </div>
      </button>

      <div className="flex items-center gap-3">
        <div
          className="text-right text-sm font-bold"
          style={{ color: "var(--ink)" }}
        >
          {formatCents(totals.totalCents, doc.currency)}
        </div>
        <select
          value={doc.status}
          onChange={(e) => onStatusChange(e.target.value as InvoiceStatus)}
          className="rounded-md text-xs"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
            padding: "4px 6px",
          }}
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <button
          onClick={onDuplicate}
          aria-label="Duplicate"
          className="rounded-md px-2 py-1 text-xs"
          style={{
            border: "1px solid var(--line)",
            color: "var(--ink)",
            background: "var(--paper)",
          }}
        >
          Dup
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete"
          className="rounded-md px-2 py-1 text-xs"
          style={{
            border: "1px solid var(--line)",
            color: "var(--error)",
            background: "var(--paper)",
          }}
        >
          Del
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: InvoiceStatus }) {
  const colors: Record<InvoiceStatus, { bg: string; fg: string }> = {
    draft: { bg: "var(--panel)", fg: "var(--muted)" },
    sent: { bg: "rgba(37, 99, 235, 0.15)", fg: "var(--accent)" },
    paid: { bg: "rgba(22, 163, 74, 0.15)", fg: "var(--success)" },
    overdue: { bg: "rgba(220, 38, 38, 0.15)", fg: "var(--error)" },
  };
  const c = colors[status];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: c.bg, color: c.fg }}
    >
      {status}
    </span>
  );
}
