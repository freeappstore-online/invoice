import { useMemo } from "react";
import type { CurrencyCode, InvoiceDoc } from "../types/invoice";
import { computeTotals } from "../lib/totals";
import { formatCents } from "../lib/money";
import { isCurrentMonth, isOverdue } from "../lib/dates";

interface Props {
  invoices: InvoiceDoc[];
  currency: CurrencyCode;
}

export function StatsView({ invoices, currency }: Props) {
  const stats = useMemo(() => {
    let invoicedThisMonth = 0;
    let outstanding = 0;
    let paid = 0;
    let overdue = 0;

    const byClient = new Map<string, number>();

    for (const inv of invoices) {
      if (inv.kind !== "invoice") continue;
      if (inv.currency !== currency) continue;
      const t = computeTotals(inv);

      if (isCurrentMonth(inv.issueDate)) {
        invoicedThisMonth += t.totalCents;
      }
      if (inv.status === "paid") {
        paid += t.totalCents;
      } else if (
        inv.status === "overdue" ||
        (inv.status === "sent" && isOverdue(inv.dueDate))
      ) {
        outstanding += t.totalCents;
        overdue += t.totalCents;
      } else if (inv.status === "sent") {
        outstanding += t.totalCents;
      }

      const key = inv.client.name.trim();
      if (key) {
        byClient.set(key, (byClient.get(key) ?? 0) + t.totalCents);
      }
    }

    let topClient: { name: string; totalCents: number } | null = null;
    for (const [name, total] of byClient) {
      if (!topClient || total > topClient.totalCents) {
        topClient = { name, totalCents: total };
      }
    }

    return {
      invoicedThisMonth,
      outstanding,
      paid,
      overdue,
      topClient,
    };
  }, [invoices, currency]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
        Stats
      </h2>

      <div className="text-xs" style={{ color: "var(--muted)" }}>
        Showing totals in {currency} only. Switch the default currency in Settings
        to see other currencies.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Invoiced this month"
          value={formatCents(stats.invoicedThisMonth, currency)}
        />
        <StatCard
          label="Outstanding"
          value={formatCents(stats.outstanding, currency)}
          tone="warning"
        />
        <StatCard
          label="Paid"
          value={formatCents(stats.paid, currency)}
          tone="success"
        />
        <StatCard
          label="Overdue"
          value={formatCents(stats.overdue, currency)}
          tone={stats.overdue > 0 ? "error" : "neutral"}
        />
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <div
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          Top client
        </div>
        {stats.topClient ? (
          <div className="mt-2">
            <div className="text-lg font-bold" style={{ color: "var(--ink)" }}>
              {stats.topClient.name}
            </div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              {formatCents(stats.topClient.totalCents, currency)} total
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            No clients yet.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "error"
          ? "var(--error)"
          : "var(--ink)";
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </div>
      <div className="mt-1 text-lg font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
