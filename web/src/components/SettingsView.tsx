import { useRef, type ChangeEvent, type ReactNode } from "react";
import type {
  AppSettings,
  ClientInfo,
  CurrencyCode,
  InvoiceDoc,
  TemplateId,
} from "../types/invoice";
import { SelectField, TextField } from "./Field";
import { downloadJsonBackup } from "../lib/export";

interface Props {
  settings: AppSettings;
  invoices: InvoiceDoc[];
  clients: ClientInfo[];
  onSettingsChange: (next: AppSettings) => void;
  onImport: (
    invoices: InvoiceDoc[],
    clients: ClientInfo[],
    settings: AppSettings,
  ) => void;
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

export function SettingsView({
  settings,
  invoices,
  clients,
  onSettingsChange,
  onImport,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  const updateBiz = <K extends keyof AppSettings["business"]>(
    key: K,
    value: AppSettings["business"][K],
  ) => {
    onSettingsChange({
      ...settings,
      business: { ...settings.business, [key]: value },
    });
  };

  const onExport = () => {
    downloadJsonBackup(invoices, clients, settings);
  };

  const onImportClick = () => {
    fileRef.current?.click();
  };

  const onFileChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      try {
        const parsed = JSON.parse(reader.result) as {
          invoices?: InvoiceDoc[];
          clients?: ClientInfo[];
          settings?: AppSettings;
        };
        if (
          !Array.isArray(parsed.invoices) ||
          !Array.isArray(parsed.clients) ||
          !parsed.settings
        ) {
          alert("This file doesn't look like an Invoice Maker export.");
          return;
        }
        if (
          !confirm(
            `Replace all current data with ${parsed.invoices.length} invoice(s) and ${parsed.clients.length} client(s)?`,
          )
        ) {
          return;
        }
        onImport(parsed.invoices, parsed.clients, parsed.settings);
      } catch {
        alert("Could not read that file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
        Settings
      </h2>

      <Section title="Defaults">
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Default currency"
            value={settings.defaultCurrency}
            onChange={(v) => update("defaultCurrency", v)}
            options={CURRENCY_OPTIONS}
          />
          <SelectField
            label="Default template"
            value={settings.defaultTemplate}
            onChange={(v) => update("defaultTemplate", v)}
            options={TEMPLATE_OPTIONS}
          />
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Next invoice number
            </label>
            <input
              type="number"
              value={settings.invoiceCounter}
              min={0}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                update("invoiceCounter", isNaN(v) ? 0 : v);
              }}
            />
          </div>
        </div>
      </Section>

      <Section title="Your business (used on new invoices)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Business name"
            value={settings.business.name}
            onChange={(v) => updateBiz("name", v)}
          />
          <TextField
            label="Email"
            type="email"
            value={settings.business.email}
            onChange={(v) => updateBiz("email", v)}
          />
          <TextField
            label="Phone"
            type="tel"
            value={settings.business.phone}
            onChange={(v) => updateBiz("phone", v)}
          />
          <TextField
            label="Website"
            type="url"
            value={settings.business.website}
            onChange={(v) => updateBiz("website", v)}
          />
          <TextField
            label="Tax ID"
            value={settings.business.taxId}
            onChange={(v) => updateBiz("taxId", v)}
          />
          <TextField
            label="Address"
            value={settings.business.address}
            onChange={(v) => updateBiz("address", v)}
            multiline
            rows={2}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Logo data URL"
              value={settings.business.logoDataUrl}
              onChange={(v) => updateBiz("logoDataUrl", v)}
              placeholder="data:image/png;base64,..."
            />
          </div>
        </div>
      </Section>

      <Section title="Backup & restore">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Export all as JSON
          </button>
          <button
            onClick={onImportClick}
            className="rounded-md px-3 py-1.5 text-sm"
            style={{
              border: "1px solid var(--line)",
              color: "var(--ink)",
              background: "var(--panel)",
            }}
          >
            Import from JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onFileChosen}
            className="hidden"
          />
        </div>
        <div
          className="mt-2 text-xs"
          style={{ color: "var(--muted)" }}
        >
          All data is stored locally in your browser. Importing replaces everything.
        </div>
      </Section>
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
