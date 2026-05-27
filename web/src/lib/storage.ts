import type { InvoiceDoc, ClientInfo, AppSettings } from "../types/invoice";

const KEYS = {
  invoices: "invoice_docs",
  clients: "invoice_clients",
  settings: "invoice_settings",
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be full or unavailable; swallow for now.
  }
}

export function loadInvoices(): InvoiceDoc[] {
  return load<InvoiceDoc[]>(KEYS.invoices, []);
}
export function saveInvoices(invoices: InvoiceDoc[]): void {
  save(KEYS.invoices, invoices);
}

export function loadClients(): ClientInfo[] {
  return load<ClientInfo[]>(KEYS.clients, []);
}
export function saveClients(clients: ClientInfo[]): void {
  save(KEYS.clients, clients);
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: "USD",
  defaultTemplate: "classic",
  invoiceCounter: 1000,
  business: {
    name: "",
    logoDataUrl: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    taxId: "",
  },
};

export function loadSettings(): AppSettings {
  const loaded = load<Partial<AppSettings>>(KEYS.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...loaded,
    business: { ...DEFAULT_SETTINGS.business, ...(loaded.business ?? {}) },
  };
}
export function saveSettings(settings: AppSettings): void {
  save(KEYS.settings, settings);
}
