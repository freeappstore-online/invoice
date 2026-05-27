import { useMemo, useState } from "react";
import type { ClientInfo, CurrencyCode, InvoiceDoc } from "../types/invoice";
import { computeTotals } from "../lib/totals";
import { formatCents } from "../lib/money";
import { makeId } from "../lib/id";
import { TextField } from "./Field";

interface Props {
  clients: ClientInfo[];
  invoices: InvoiceDoc[];
  onUpsert: (client: ClientInfo) => void;
  onDelete: (id: string) => void;
}

export function ClientsView({ clients, invoices, onUpsert, onDelete }: Props) {
  const [editing, setEditing] = useState<ClientInfo | null>(null);

  const stats = useMemo(() => {
    const m = new Map<
      string,
      { count: number; totalCents: number; currency: CurrencyCode }
    >();
    for (const inv of invoices) {
      const key = inv.client.name.trim().toLowerCase();
      if (!key) continue;
      const totals = computeTotals(inv);
      const existing = m.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalCents += totals.totalCents;
      } else {
        m.set(key, {
          count: 1,
          totalCents: totals.totalCents,
          currency: inv.currency,
        });
      }
    }
    return m;
  }, [invoices]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
          Clients
        </h2>
        <button
          onClick={() =>
            setEditing({ id: makeId(), name: "", email: "", address: "" })
          }
          className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + Add client
        </button>
      </div>

      {editing ? (
        <ClientForm
          client={editing}
          onCancel={() => setEditing(null)}
          onSave={(c) => {
            onUpsert(c);
            setEditing(null);
          }}
        />
      ) : null}

      {clients.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: "var(--panel)",
            border: "1px dashed var(--line-strong)",
          }}
        >
          <div className="text-4xl">👥</div>
          <div className="mt-2 text-sm font-semibold" style={{ color: "var(--ink)" }}>
            No saved clients
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            Save clients to autocomplete them when filling new invoices.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {clients.map((c) => {
            const s = stats.get(c.name.trim().toLowerCase());
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg p-3"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                }}
              >
                <div className="flex-1">
                  <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                    {c.name}
                  </div>
                  {c.email ? (
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.email}
                    </div>
                  ) : null}
                  {s ? (
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {s.count} invoice{s.count === 1 ? "" : "s"} ·{" "}
                      {formatCents(s.totalCents, s.currency)}
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={() => setEditing(c)}
                  className="rounded-md px-2 py-1 text-xs"
                  style={{
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                    background: "var(--paper)",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete client "${c.name}"?`)) onDelete(c.id);
                  }}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClientForm({
  client,
  onSave,
  onCancel,
}: {
  client: ClientInfo;
  onSave: (c: ClientInfo) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ClientInfo>(client);
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Name"
          value={draft.name}
          onChange={(v) => setDraft({ ...draft, name: v })}
        />
        <TextField
          label="Email"
          type="email"
          value={draft.email}
          onChange={(v) => setDraft({ ...draft, email: v })}
        />
        <div className="sm:col-span-2">
          <TextField
            label="Address"
            value={draft.address}
            onChange={(v) => setDraft({ ...draft, address: v })}
            multiline
            rows={2}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSave(draft)}
          disabled={!draft.name.trim()}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm"
          style={{
            border: "1px solid var(--line)",
            color: "var(--ink)",
            background: "var(--paper)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
