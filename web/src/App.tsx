import { useState } from "react";
import type { InvoiceStatus, TabId } from "./types/invoice";
import { useInvoiceStore } from "./hooks/useInvoiceStore";
import { InvoiceList } from "./components/InvoiceList";
import { InvoiceEditor } from "./components/InvoiceEditor";
import { ClientsView } from "./components/ClientsView";
import { StatsView } from "./components/StatsView";
import { SettingsView } from "./components/SettingsView";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "list", label: "Invoices", emoji: "📄" },
  { id: "clients", label: "Clients", emoji: "👥" },
  { id: "stats", label: "Stats", emoji: "📊" },
  { id: "settings", label: "Settings", emoji: "⚙️" },
];

export default function App() {
  const store = useInvoiceStore();
  const [tab, setTab] = useState<TabId>("list");
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeDoc = activeId
    ? store.invoices.find((d) => d.id === activeId) ?? null
    : null;

  const newInvoice = () => {
    const created = store.createInvoice();
    setActiveId(created.id);
    setTab("edit");
  };

  const openInvoice = (id: string) => {
    setActiveId(id);
    setTab("edit");
  };

  const duplicate = (id: string) => {
    const dup = store.duplicateInvoice(id);
    if (dup) {
      setActiveId(dup.id);
      setTab("edit");
    }
  };

  const createNextRecurring = () => {
    if (!activeDoc) return;
    const next = store.createNextRecurring(activeDoc.id);
    if (next) {
      setActiveId(next.id);
    }
  };

  const onStatusChange = (id: string, status: InvoiceStatus) => {
    const doc = store.invoices.find((d) => d.id === id);
    if (!doc) return;
    store.upsertInvoice({ ...doc, status });
  };

  const backToList = () => {
    setActiveId(null);
    setTab("list");
  };

  const deleteActive = () => {
    if (!activeDoc) return;
    store.deleteInvoice(activeDoc.id);
    backToList();
  };

  return (
    <div
      className="app mx-auto flex min-h-dvh max-w-6xl flex-col"
      style={{ background: "var(--paper)" }}
    >
      {/* Header */}
      <header
        className="no-print sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--glass)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🧾</span>
          <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
            Invoice Maker
          </h1>
        </div>
        <button
          onClick={newInvoice}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + New
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        {tab === "list" ? (
          <InvoiceList
            invoices={store.invoices}
            onOpen={openInvoice}
            onNew={newInvoice}
            onDuplicate={duplicate}
            onDelete={store.deleteInvoice}
            onStatusChange={onStatusChange}
          />
        ) : null}

        {tab === "edit" && activeDoc ? (
          <InvoiceEditor
            doc={activeDoc}
            clients={store.clients}
            onChange={store.upsertInvoice}
            onDelete={deleteActive}
            onDuplicate={() => duplicate(activeDoc.id)}
            onCreateNextRecurring={createNextRecurring}
            onSaveClient={store.upsertClient}
            onBack={backToList}
          />
        ) : null}

        {tab === "edit" && !activeDoc ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "var(--panel)",
              border: "1px dashed var(--line-strong)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              No document selected.
            </div>
            <button
              onClick={newInvoice}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              + New invoice
            </button>
          </div>
        ) : null}

        {tab === "clients" ? (
          <ClientsView
            clients={store.clients}
            invoices={store.invoices}
            onUpsert={store.upsertClient}
            onDelete={store.deleteClient}
          />
        ) : null}

        {tab === "stats" ? (
          <StatsView
            invoices={store.invoices}
            currency={store.settings.defaultCurrency}
          />
        ) : null}

        {tab === "settings" ? (
          <SettingsView
            settings={store.settings}
            invoices={store.invoices}
            clients={store.clients}
            onSettingsChange={store.setSettings}
            onImport={store.replaceAllFromImport}
          />
        ) : null}
      </main>

      {/* Bottom navigation */}
      <nav
        className="no-print fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-6xl items-center justify-around py-2"
        style={{
          background: "var(--dock)",
          borderTop: "1px solid var(--line)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id !== "edit") setActiveId(null);
            }}
            className="flex flex-col items-center gap-0.5 px-3 py-1"
          >
            <span className="text-lg">{t.emoji}</span>
            <span
              className="text-[10px] font-medium"
              style={{
                color: tab === t.id ? "var(--accent)" : "var(--muted)",
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
