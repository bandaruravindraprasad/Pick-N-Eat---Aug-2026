import { ExpenseRecord, PurchaseRecord, SalesRecord } from '../types';
import { getInitialPdfSales } from '../data/initialSales';

// Increment version key so any stale fake demo records from localStorage are purged
const STORAGE_KEY = 'pick_n_eat_real_sales_v2';
const EXPENSES_STORAGE_KEY = 'pick_n_eat_expenses_v1';
const PURCHASES_STORAGE_KEY = 'pick_n_eat_purchases_v1';

export function getStoredSales(): SalesRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialPdfSales();
      saveStoredSales(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => b.date.localeCompare(a.date));
    }
    // If empty or corrupted, seed with real PDF sales
    const initial = getInitialPdfSales();
    saveStoredSales(initial);
    return initial;
  } catch (error) {
    console.error('Error reading sales from localStorage:', error);
    return getInitialPdfSales();
  }
}

export function saveStoredSales(records: SalesRecord[]): void {
  try {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.error('Error saving sales to localStorage:', error);
  }
}

export function resetToPdfData(): SalesRecord[] {
  const initial = getInitialPdfSales();
  saveStoredSales(initial);
  return initial;
}

// ----------------- EXPENSES STORAGE -----------------

export function getStoredExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.date.localeCompare(a.date));
    }
    return [];
  } catch (error) {
    console.error('Error reading expenses from localStorage:', error);
    return [];
  }
}

export function saveStoredExpenses(records: ExpenseRecord[]): void {
  try {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.error('Error saving expenses to localStorage:', error);
  }
}

// ----------------- PURCHASES STORAGE -----------------

export function getStoredPurchases(): PurchaseRecord[] {
  try {
    const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.date.localeCompare(a.date));
    }
    return [];
  } catch (error) {
    console.error('Error reading purchases from localStorage:', error);
    return [];
  }
}

export function saveStoredPurchases(records: PurchaseRecord[]): void {
  try {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.error('Error saving purchases to localStorage:', error);
  }
}
