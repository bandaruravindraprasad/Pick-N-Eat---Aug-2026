import { SalesRecord } from '../types';
import { getInitialPdfSales } from '../data/initialSales';

// Increment version key so any stale fake demo records from localStorage are purged
const STORAGE_KEY = 'pick_n_eat_real_sales_v2';

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
