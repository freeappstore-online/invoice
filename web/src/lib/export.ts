import type { InvoiceDoc, ClientInfo, AppSettings } from "../types/invoice";

interface ExportPayload {
  exportedAt: string;
  invoices: InvoiceDoc[];
  clients: ClientInfo[];
  settings: AppSettings;
}

export function downloadJsonBackup(
  invoices: InvoiceDoc[],
  clients: ClientInfo[],
  settings: AppSettings,
): void {
  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    invoices,
    clients,
    settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, `invoices-${stamp()}.json`);
}

export function downloadHtmlSnapshot(filename: string, html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
