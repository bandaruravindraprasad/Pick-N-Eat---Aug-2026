import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { DuplicateAction, ImportParsedRow, SalesRecord } from '../types';
import {
  parseExcelFile,
  downloadSampleExcelTemplate,
} from '../utils/excelHelper';
import {
  formatINR,
  formatDateWithDay,
  calculateSalesBreakdown,
} from '../utils/formatters';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSales: SalesRecord[];
  onImportComplete: (recordsToAddOrUpdate: SalesRecord[], mode: DuplicateAction) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingSales,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ImportParsedRow[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('skip');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setError('');

    const res = await parseExcelFile(selectedFile, existingSales);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      setParsedRows([]);
    } else {
      setParsedRows(res.rows);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Row field update inside preview
  const handleUpdateRowValue = (id: string, field: 'cash' | 'online', value: number) => {
    setParsedRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const newCash = field === 'cash' ? value : row.cash;
        const newOnline = field === 'online' ? value : row.online;
        const calc = calculateSalesBreakdown(newCash, newOnline);
        return {
          ...row,
          cash: calc.cash,
          online: calc.online,
          total: calc.total,
          profit: calc.profit,
          cogs: calc.cogs,
        };
      })
    );
  };

  const toggleRowSelect = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.isValid ? { ...r, selected: select } : r))
    );
  };

  const duplicatesCount = parsedRows.filter((r) => r.isDuplicate).length;
  const selectedValidRows = parsedRows.filter((r) => r.selected && r.isValid);

  // Compute what will actually be added
  const rowsToProcess = selectedValidRows.filter((r) => {
    if (r.isDuplicate && duplicateAction === 'skip') {
      return false;
    }
    return true;
  });

  const handleConfirmImport = () => {
    if (rowsToProcess.length === 0) {
      setError('No valid rows selected for import.');
      return;
    }

    const records: SalesRecord[] = rowsToProcess.map((r) => ({
      id: r.existingRecord?.id || `rec_${r.date}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: r.date,
      cash: r.cash,
      online: r.online,
      total: r.total,
      profit: r.profit,
      cogs: r.cogs,
      notes: r.notes || (r.isDuplicate ? r.existingRecord?.notes : undefined),
      createdAt: r.existingRecord?.createdAt || `${r.date}T20:00:00.000Z`,
      updatedAt: new Date().toISOString(),
    }));

    onImportComplete(records, duplicateAction);
    onClose();
  };

  const resetUpload = () => {
    setFile(null);
    setParsedRows([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 sm:px-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Import Monthly Sales Excel
              </h2>
              <p className="text-xs text-slate-300">
                Reads Date, Cash, Online &bull; Auto-calculates 20% Profit &amp; 80% COGS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload File or Download Template */}
          {!file && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Click to select or drag &amp; drop Excel file
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports <strong className="text-slate-700">.xlsx, .xls, and .csv</strong> files with Date, Cash, and Online columns.
                </p>
                <div className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-xs">
                  <span>Browse Excel File</span>
                </div>
              </div>

              {/* Template Helper Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Need the standard Excel format?
                    </div>
                    <div className="text-xs text-slate-500">
                      Download our pre-formatted Pick &apos;N&apos; Eat template with Date, Cash, and Online columns.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Sample Template</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Duplicate Handling */}
          {file && (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{file.name}</div>
                    <div className="text-xs text-slate-500">
                      {parsedRows.length} total rows parsed &bull; {selectedValidRows.length} valid
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetUpload}
                  className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2.5 py-1 rounded-md hover:bg-slate-200/60 transition-colors"
                >
                  Choose Different File
                </button>
              </div>

              {/* DUPLICATE HANDLING SECTION (CRITICAL USER MANDATE) */}
              {duplicatesCount > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Duplicate Dates Detected ({duplicatesCount} {duplicatesCount === 1 ? 'entry' : 'entries'})
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Some dates in this Excel file already exist in your database. Choose how to handle them:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Safe Choice: Skip duplicates (Default) */}
                    <label
                      className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                        duplicateAction === 'skip'
                          ? 'border-emerald-600 bg-white shadow-xs'
                          : 'border-amber-200 bg-amber-50/50 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dup_action"
                        checked={duplicateAction === 'skip'}
                        onChange={() => setDuplicateAction('skip')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                          <span>Keep Existing (Skip Duplicates)</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                            Default &bull; Safe
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Do not modify previously recorded sales for matching dates.
                        </p>
                      </div>
                    </label>

                    {/* Specific Choice: Overwrite/Update */}
                    <label
                      className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                        duplicateAction === 'update'
                          ? 'border-amber-600 bg-white shadow-xs'
                          : 'border-amber-200 bg-amber-50/50 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dup_action"
                        checked={duplicateAction === 'update'}
                        onChange={() => setDuplicateAction('update')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Update Existing with Excel Data
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Replace existing sales numbers for matching dates with imported Excel numbers.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Table Toolbar */}
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800">
                    Preview Records ({rowsToProcess.length} will be imported)
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-500">You can edit Cash or Online directly below</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-3 py-2.5 w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedValidRows.length > 0 &&
                            selectedValidRows.length === parsedRows.filter((r) => r.isValid).length
                          }
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                      </th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Cash Sales (₹)</th>
                      <th className="px-3 py-2.5">Online Sales (₹)</th>
                      <th className="px-3 py-2.5">Total Sales</th>
                      <th className="px-3 py-2.5 text-emerald-800">Profit (20%)</th>
                      <th className="px-3 py-2.5 text-blue-800">COGS (80%)</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          !row.isValid
                            ? 'bg-red-50/50'
                            : row.isDuplicate
                            ? 'bg-amber-50/30'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            disabled={!row.isValid}
                            checked={row.selected}
                            onChange={() => toggleRowSelect(row.id)}
                            className="rounded text-emerald-600"
                          />
                        </td>
                        <td className="px-3 py-2 font-bold whitespace-nowrap">
                          {row.date ? formatDateWithDay(row.date) : <span className="text-red-500 font-normal">Invalid: {row.rawDate}</span>}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={row.cash || ''}
                            onChange={(e) => handleUpdateRowValue(row.id, 'cash', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-slate-300 rounded font-semibold focus:ring-1 focus:ring-amber-500 outline-hidden"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={row.online || ''}
                            onChange={(e) => handleUpdateRowValue(row.id, 'online', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-slate-300 rounded font-semibold focus:ring-1 focus:ring-emerald-500 outline-hidden"
                          />
                        </td>
                        <td className="px-3 py-2 font-black whitespace-nowrap">
                          {formatINR(row.total)}
                        </td>
                        <td className="px-3 py-2 font-bold text-emerald-700 whitespace-nowrap">
                          {formatINR(row.profit)}
                        </td>
                        <td className="px-3 py-2 font-bold text-blue-700 whitespace-nowrap">
                          {formatINR(row.cogs)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {!row.isValid ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">
                              Invalid Row
                            </span>
                          ) : row.isDuplicate ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                              {duplicateAction === 'skip' ? 'Exists (Will Skip)' : 'Exists (Will Overwrite)'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-4 sm:px-6 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          {file && (
            <button
              id="btn-confirm-import-excel"
              type="button"
              disabled={rowsToProcess.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import {rowsToProcess.length} Sales Records</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
