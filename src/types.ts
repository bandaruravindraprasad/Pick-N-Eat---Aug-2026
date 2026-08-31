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

export type ViewMode = 'dashboard' | 'daily' | 'reports' | 'import';

export type ReportType = 'daily' | 'monthly' | 'yearly';

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
