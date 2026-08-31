import * as XLSX from 'xlsx';
import { ImportParsedRow, SalesRecord } from '../types';
import { calculateSalesBreakdown } from './formatters';

/**
 * Standardize Excel date parsing (supports Excel serial numbers, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, etc.)
 */
export function normalizeExcelDate(val: any): { dateString: string; raw: string; isValid: boolean } {
  if (val === undefined || val === null || val === '') {
    return { dateString: '', raw: '', isValid: false };
  }

  const rawStr = String(val).trim();

  // If it's an Excel numeric date serial
  if (typeof val === 'number' && !isNaN(val)) {
    try {
      const parsedDate = XLSX.SSF.parse_date_code(val);
      if (parsedDate && parsedDate.y && parsedDate.m && parsedDate.d) {
        const y = String(parsedDate.y);
        const m = String(parsedDate.m).padStart(2, '0');
        const d = String(parsedDate.d).padStart(2, '0');
        return { dateString: `${y}-${m}-${d}`, raw: rawStr, isValid: true };
      }
    } catch (e) {
      // fallback
    }
  }

  // Check if string matches YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawStr)) {
    return { dateString: rawStr, raw: rawStr, isValid: true };
  }

  // Check if string matches DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = rawStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return { dateString: `${y}-${m}-${d}`, raw: rawStr, isValid: true };
  }

  // Check if string matches MM/DD/YYYY
  const mdyMatch = rawStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdyMatch) {
    // Try standard JS Date parsing
    const parsed = new Date(rawStr);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return { dateString: `${y}-${m}-${d}`, raw: rawStr, isValid: true };
    }
  }

  // General Date parse attempt
  const parsed = new Date(rawStr);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return { dateString: `${y}-${m}-${d}`, raw: rawStr, isValid: true };
  }

  return { dateString: '', raw: rawStr, isValid: false };
}

/**
 * Clean currency/number string (removes ₹, commas, spaces)
 */
export function cleanNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Find header field name regardless of case / variations
 */
function findKey(obj: any, matches: string[]): string | undefined {
  const keys = Object.keys(obj);
  for (const match of matches) {
    const found = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === match.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (found) return found;
  }
  return undefined;
}

/**
 * Parse Excel file array buffer into ImportParsedRow objects
 */
export async function parseExcelFile(
  file: File,
  existingSales: SalesRecord[]
): Promise<{ rows: ImportParsedRow[]; totalRows: number; validCount: number; duplicateCount: number; error?: string }> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: false });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { rows: [], totalRows: 0, validCount: 0, duplicateCount: 0, error: 'The uploaded Excel file contains no sheets.' };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (jsonRows.length === 0) {
      return { rows: [], totalRows: 0, validCount: 0, duplicateCount: 0, error: 'The uploaded sheet has no data rows.' };
    }

    const existingMap = new Map<string, SalesRecord>();
    existingSales.forEach((r) => existingMap.set(r.date, r));

    const parsedRows: ImportParsedRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;

    jsonRows.forEach((row, index) => {
      // Find Date column
      const dateKey = findKey(row, ['date', 'datesale', 'salesdate', 'entrydate', 'day']);
      // Find Cash column
      const cashKey = findKey(row, ['cash', 'cashsales', 'cashsale', 'cashinr', 'cashamount']);
      // Find Online column
      const onlineKey = findKey(row, ['online', 'onlinesales', 'onlinesale', 'upi', 'gpay', 'paytm', 'card', 'onlineinr', 'digital']);
      // Find Notes column
      const notesKey = findKey(row, ['notes', 'note', 'remarks', 'comment', 'description']);

      const rawDateVal = dateKey ? row[dateKey] : '';
      const rawCashVal = cashKey ? row[cashKey] : 0;
      const rawOnlineVal = onlineKey ? row[onlineKey] : 0;
      const rawNotesVal = notesKey ? String(row[notesKey]).trim() : '';

      const { dateString, raw: rawDate, isValid: isDateValid } = normalizeExcelDate(rawDateVal);

      const cash = cleanNumber(rawCashVal);
      const online = cleanNumber(rawOnlineVal);
      const calc = calculateSalesBreakdown(cash, online);

      let isValid = isDateValid;
      let errorMessage = '';

      if (!isDateValid) {
        errorMessage = `Invalid date format (${rawDate || 'empty'})`;
      } else if (cash === 0 && online === 0) {
        // Warning or allowed if closed, but marked valid
      }

      const existingRecord = dateString ? existingMap.get(dateString) : undefined;
      const isDuplicate = !!existingRecord;

      if (isDuplicate) {
        duplicateCount++;
      }
      if (isValid) {
        validCount++;
      }

      parsedRows.push({
        id: `import_${index}_${dateString || 'nodate'}`,
        date: dateString,
        rawDate: rawDate || String(rawDateVal || ''),
        cash: calc.cash,
        online: calc.online,
        total: calc.total,
        profit: calc.profit,
        cogs: calc.cogs,
        notes: rawNotesVal || undefined,
        isDuplicate,
        existingRecord,
        isValid,
        errorMessage: errorMessage || undefined,
        selected: isValid, // By default select valid rows
      });
    });

    return {
      rows: parsedRows,
      totalRows: parsedRows.length,
      validCount,
      duplicateCount,
    };
  } catch (err: any) {
    console.error('Excel parse error:', err);
    return {
      rows: [],
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      error: err?.message || 'Failed to read the Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.',
    };
  }
}

/**
 * Generate and download a sample Excel template for the user
 */
export function downloadSampleExcelTemplate(): void {
  const templateData = [
    {
      'Date': '2026-08-01',
      'Cash Sales': 6000,
      'Online Sales': 4000,
      'Notes': 'Saturday lunch rush'
    },
    {
      'Date': '2026-08-02',
      'Cash Sales': 7500,
      'Online Sales': 5500,
      'Notes': 'Sunday crowd'
    },
    {
      'Date': '2026-08-03',
      'Cash Sales': 4500,
      'Online Sales': 3500,
      'Notes': 'Regular Monday sales'
    },
    {
      'Date': '2026-08-04',
      'Cash Sales': 5000,
      'Online Sales': 4000,
      'Notes': 'Evening snack combo specials'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Date
    { wch: 15 }, // Cash Sales
    { wch: 15 }, // Online Sales
    { wch: 30 }  // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Sales');
  XLSX.writeFile(workbook, 'Pick_N_Eat_Sales_Template.xlsx');
}

/**
 * Export sales records to an Excel file
 */
export function exportSalesToExcel(records: SalesRecord[], fileName = 'Pick_N_Eat_Sales_Report.xlsx'): void {
  const data = records.map((r) => ({
    'Date': r.date,
    'Cash (₹)': r.cash,
    'Online (₹)': r.online,
    'Total Sales (₹)': r.total,
    'Profit 20% (₹)': r.profit,
    'Cost of Goods 80% (₹)': r.cogs,
    'Notes': r.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Records');
  XLSX.writeFile(workbook, fileName);
}
