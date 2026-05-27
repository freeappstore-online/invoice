import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AppSettings,
  BusinessInfo,
  ClientInfo,
  CurrencyCode,
  InvoiceDoc,
  TemplateId,
} from "../types/invoice";
import {
  loadClients,
  loadInvoices,
  loadSettings,
  saveClients,
  saveInvoices,
  saveSettings,
} from "../lib/storage";
import { makeId } from "../lib/id";
import { addRecurrence, defaultDueDate, todayIso } from "../lib/dates";

function blankClient(): ClientInfo {
  return { id: makeId(), name: "", address: "", email: "" };
}

function buildInvoice(settings: AppSettings, counter: number): InvoiceDoc {
  const now = Date.now();
  return {
    id: makeId(),
    kind: "invoice",
    number: `INV-${counter}`,
    issueDate: todayIso(),
    dueDate: defaultDueDate(),
    currency: settings.defaultCurrency,
    template: settings.defaultTemplate,
    status: "draft",
    business: { ...settings.business },
    client: blankClient(),
    items: [
      {
        id: makeId(),
        description: "",
        quantity: 1,
        unitPriceCents: 0,
      },
    ],
    taxRatePercent: 0,
    taxMode: "exclusive",
    discountKind: "amount",
    discountValue: 0,
    notes: "",
    payment: {
      bankDetails: "",
      paypal: "",
      stripeLink: "",
      cryptoAddress: "",
    },
    recurrence: "none",
    createdAt: now,
    updatedAt: now,
  };
}

export interface InvoiceStore {
  invoices: InvoiceDoc[];
  clients: ClientInfo[];
  settings: AppSettings;

  setSettings: (next: AppSettings) => void;
  setDefaultCurrency: (currency: CurrencyCode) => void;
  setDefaultTemplate: (template: TemplateId) => void;
  setBusiness: (business: BusinessInfo) => void;

  createInvoice: () => InvoiceDoc;
  upsertInvoice: (doc: InvoiceDoc) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => InvoiceDoc | null;
  createNextRecurring: (id: string) => InvoiceDoc | null;

  upsertClient: (client: ClientInfo) => void;
  deleteClient: (id: string) => void;

  replaceAllFromImport: (
    invoices: InvoiceDoc[],
    clients: ClientInfo[],
    settings: AppSettings,
  ) => void;
}

export function useInvoiceStore(): InvoiceStore {
  const [invoices, setInvoices] = useState<InvoiceDoc[]>(() => loadInvoices());
  const [clients, setClients] = useState<ClientInfo[]>(() => loadClients());
  const [settings, setSettingsState] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);
  useEffect(() => {
    saveClients(clients);
  }, [clients]);
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setSettings = useCallback((next: AppSettings) => {
    setSettingsState(next);
  }, []);

  const setDefaultCurrency = useCallback((currency: CurrencyCode) => {
    setSettingsState((s) => ({ ...s, defaultCurrency: currency }));
  }, []);
  const setDefaultTemplate = useCallback((template: TemplateId) => {
    setSettingsState((s) => ({ ...s, defaultTemplate: template }));
  }, []);
  const setBusiness = useCallback((business: BusinessInfo) => {
    setSettingsState((s) => ({ ...s, business }));
  }, []);

  const createInvoice = useCallback((): InvoiceDoc => {
    const counter = settings.invoiceCounter;
    const doc = buildInvoice(settings, counter);
    setSettingsState((s) => ({ ...s, invoiceCounter: s.invoiceCounter + 1 }));
    setInvoices((prev) => [doc, ...prev]);
    return doc;
  }, [settings]);

  const upsertInvoice = useCallback((doc: InvoiceDoc) => {
    setInvoices((prev) => {
      const updated: InvoiceDoc = { ...doc, updatedAt: Date.now() };
      const idx = prev.findIndex((d) => d.id === doc.id);
      if (idx === -1) return [updated, ...prev];
      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const duplicateInvoice = useCallback(
    (id: string): InvoiceDoc | null => {
      const source = invoices.find((d) => d.id === id);
      if (!source) return null;
      const counter = settings.invoiceCounter;
      const dup: InvoiceDoc = {
        ...source,
        id: makeId(),
        number: `INV-${counter}`,
        status: "draft",
        issueDate: todayIso(),
        dueDate: defaultDueDate(),
        items: source.items.map((it) => ({ ...it, id: makeId() })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSettingsState((s) => ({ ...s, invoiceCounter: s.invoiceCounter + 1 }));
      setInvoices((prev) => [dup, ...prev]);
      return dup;
    },
    [invoices, settings],
  );

  const createNextRecurring = useCallback(
    (id: string): InvoiceDoc | null => {
      const source = invoices.find((d) => d.id === id);
      if (!source || source.recurrence === "none") return null;
      const counter = settings.invoiceCounter;
      const nextIssue = addRecurrence(source.issueDate, source.recurrence);
      const nextDue = addRecurrence(source.dueDate, source.recurrence);
      const next: InvoiceDoc = {
        ...source,
        id: makeId(),
        number: `INV-${counter}`,
        status: "draft",
        issueDate: nextIssue,
        dueDate: nextDue,
        items: source.items.map((it) => ({ ...it, id: makeId() })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSettingsState((s) => ({ ...s, invoiceCounter: s.invoiceCounter + 1 }));
      setInvoices((prev) => [next, ...prev]);
      return next;
    },
    [invoices, settings],
  );

  const upsertClient = useCallback((client: ClientInfo) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx === -1) return [client, ...prev];
      const next = prev.slice();
      next[idx] = client;
      return next;
    });
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const replaceAllFromImport = useCallback(
    (newInvoices: InvoiceDoc[], newClients: ClientInfo[], newSettings: AppSettings) => {
      setInvoices(newInvoices);
      setClients(newClients);
      setSettingsState(newSettings);
    },
    [],
  );

  return useMemo(
    () => ({
      invoices,
      clients,
      settings,
      setSettings,
      setDefaultCurrency,
      setDefaultTemplate,
      setBusiness,
      createInvoice,
      upsertInvoice,
      deleteInvoice,
      duplicateInvoice,
      createNextRecurring,
      upsertClient,
      deleteClient,
      replaceAllFromImport,
    }),
    [
      invoices,
      clients,
      settings,
      setSettings,
      setDefaultCurrency,
      setDefaultTemplate,
      setBusiness,
      createInvoice,
      upsertInvoice,
      deleteInvoice,
      duplicateInvoice,
      createNextRecurring,
      upsertClient,
      deleteClient,
      replaceAllFromImport,
    ],
  );
}
