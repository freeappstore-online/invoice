export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "JPY"
  | "CAD"
  | "INR"
  | "BRL";

export type TemplateId = "classic" | "modern" | "minimal";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type DocumentKind = "invoice" | "receipt";

export type RecurrenceCadence = "none" | "monthly" | "quarterly" | "yearly";

export type DiscountKind = "amount" | "percentage";

export type TaxMode = "exclusive" | "inclusive";

export interface BusinessInfo {
  name: string;
  logoDataUrl: string; // image data URL or empty
  address: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  address: string;
  email: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number; // can be decimal (e.g. hours)
  unitPriceCents: number;
}

export interface PaymentInfo {
  bankDetails: string;
  paypal: string;
  stripeLink: string;
  cryptoAddress: string;
}

export interface InvoiceDoc {
  id: string;
  kind: DocumentKind;
  number: string; // invoice number; ignored for receipts
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: CurrencyCode;
  template: TemplateId;
  status: InvoiceStatus;

  business: BusinessInfo;
  client: ClientInfo;
  items: LineItem[];

  taxRatePercent: number; // 0..100
  taxMode: TaxMode;
  discountKind: DiscountKind;
  discountValue: number; // dollars if amount, percent if percentage

  notes: string;
  payment: PaymentInfo;

  recurrence: RecurrenceCadence;

  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  defaultCurrency: CurrencyCode;
  defaultTemplate: TemplateId;
  invoiceCounter: number;
  business: BusinessInfo;
}

export interface InvoiceTotals {
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
}

export type TabId = "list" | "edit" | "clients" | "stats" | "settings";
