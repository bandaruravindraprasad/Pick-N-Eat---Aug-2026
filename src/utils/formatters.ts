/**
 * Formats a number to Indian Rupees (₹) format.
 * E.g., 10000 -> ₹10,000 | 125000 -> ₹1,25,000
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Clean short currency format without symbol when needed
 */
export function formatNumberINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates profit (20%) and Cost of Goods (80%) given cash and online sales
 */
export function calculateSalesBreakdown(cash: number, online: number) {
  const safeCash = Math.max(0, isNaN(cash) ? 0 : Number(cash));
  const safeOnline = Math.max(0, isNaN(online) ? 0 : Number(online));
  const total = Math.round((safeCash + safeOnline) * 100) / 100;
  const profit = Math.round(total * 0.2 * 100) / 100; // 20%
  const cogs = Math.round(total * 0.8 * 100) / 100; // 80%

  return {
    cash: safeCash,
    online: safeOnline,
    total,
    profit,
    cogs,
  };
}

/**
 * Format date string (YYYY-MM-DD) to friendly readable display
 * e.g., "2026-08-31" -> "31 Aug 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format date with day of week: "Mon, 31 Aug 2026"
 */
export function formatDateWithDay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get Day Name: "Monday", "Tuesday", etc.
 */
export function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return '';
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  } catch {
    return '';
  }
}

/**
 * Get Today's date string YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get Yesterday's date string YYYY-MM-DD
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse standard month name to number or vice versa
 */
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAYS_OF_WEEK = [
  { value: 'all', label: 'All Days' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
];
