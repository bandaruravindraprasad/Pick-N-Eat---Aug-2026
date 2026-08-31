export interface SalesRecord {
  id: string;
  date: string; // YYYY-MM-DD
  cash: number;
  online: number;
  total: number;
  profit: number; // 20% of total
  cogs: number; // 80% of total
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode = 'cash' | 'online' | 'other';

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // Free-text name entered by user without any dropdown
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // Free-text name entered by user without any dropdown
  amount: number;
  paymentMode: PaymentMode;
  quantity?: string; // e.g. "5 kg", "2 tins", "10 boxes" (optional free text)
  supplier?: string; // e.g. "Market", "Dairy", "Metro" (optional free text)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'dashboard' | 'daily' | 'expenses' | 'purchases' | 'reports' | 'import';

export type ReportType = 'daily' | 'monthly' | 'yearly' | 'pnl';

export interface ReportFilter {
  date?: string;
  dayOfWeek?: string; // 'all' | '0' (Sunday) .. '6' (Saturday)
  month?: string; // 'all' | '01' .. '12'
  year?: string; // 'all' | '2024' | '2025' | '2026' | '2027'
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ImportParsedRow {
  id: string;
  date: string; // YYYY-MM-DD
  rawDate: string;
  cash: number;
  online: number;
  total: number;
  profit: number;
  cogs: number;
  notes?: string;
  isDuplicate: boolean;
  existingRecord?: SalesRecord;
  isValid: boolean;
  errorMessage?: string;
  selected: boolean;
}

export type DuplicateAction = 'skip' | 'update';
