import { SalesRecord } from '../types';
import { calculateSalesBreakdown } from '../utils/formatters';
import { sales2023Data } from './sales2023';
import { sales2024Data } from './sales2024';
import { sales2025Data } from './sales2025';
import { sales2026Data } from './sales2026';

export function getInitialPdfSales(): SalesRecord[] {
  const combinedRaw = [
    ...sales2023Data,
    ...sales2024Data,
    ...sales2025Data,
    ...sales2026Data,
  ];

  // Convert raw records into fully computed SalesRecord objects
  const records: SalesRecord[] = combinedRaw.map((item) => {
    const calc = calculateSalesBreakdown(item.cash, item.online);
    return {
      id: `rec_${item.date}`,
      date: item.date,
      cash: calc.cash,
      online: calc.online,
      total: calc.total,
      profit: calc.profit,
      cogs: calc.cogs,
      notes: item.notes || '',
      createdAt: `${item.date}T20:00:00.000Z`,
      updatedAt: `${item.date}T20:00:00.000Z`,
    };
  });

  // Sort in descending chronological order (newest first)
  return records.sort((a, b) => b.date.localeCompare(a.date));
}
