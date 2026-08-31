import React, { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, TrendingUp, PackageCheck, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { SalesRecord } from '../types';
import {
  calculateSalesBreakdown,
  formatINR,
  getTodayDateString,
  getYesterdayDateString,
  formatDateWithDay,
} from '../utils/formatters';

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<SalesRecord, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  initialData?: SalesRecord | null;
  existingDates: Map<string, SalesRecord>;
}

export const SalesModal: React.FC<SalesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingDates,
}) => {
  const [date, setDate] = useState<string>(getTodayDateString());
  const [cash, setCash] = useState<string>('');
  const [online, setOnline] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date);
        setCash(initialData.cash ? String(initialData.cash) : '');
        setOnline(initialData.online ? String(initialData.online) : '');
        setNotes(initialData.notes || '');
      } else {
        setDate(getTodayDateString());
        setCash('');
        setOnline('');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const numCash = parseFloat(cash) || 0;
  const numOnline = parseFloat(online) || 0;
  const calc = calculateSalesBreakdown(numCash, numOnline);

  const existingRecordForDate = !initialData ? existingDates.get(date) : undefined;
  const isEditing = !!initialData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    if (numCash <= 0 && numOnline <= 0) {
      setError('Please enter at least Cash Sales or Online Sales amount.');
      return;
    }

    onSave(
      {
        date,
        cash: calc.cash,
        online: calc.online,
        total: calc.total,
        profit: calc.profit,
        cogs: calc.cogs,
        notes: notes.trim() || undefined,
      },
      initialData?.id || existingRecordForDate?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 sm:px-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-lg font-bold">
              {isEditing ? 'Edit Daily Sales Entry' : 'New Daily Sales Entry'}
            </h2>
            <p className="text-xs text-slate-300">
              Pick &apos;N&apos; Eat &bull; Auto-calculates 20% Profit &amp; 80% Cost of Goods
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Selector with Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Sale Date</span>
              </label>
              <div className="flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDate(getTodayDateString())}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    date === getTodayDateString()
                      ? 'bg-amber-100 text-amber-800 font-semibold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDate(getYesterdayDateString())}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    date === getYesterdayDateString()
                      ? 'bg-amber-100 text-amber-800 font-semibold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>

            <input
              type="date"
              id="input-sale-date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all text-sm"
            />
            {date && (
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {formatDateWithDay(date)}
              </p>
            )}

            {/* Warning if date already exists and creating new */}
            {!isEditing && existingRecordForDate && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Record exists for this date:</span> Currently recorded sales of{' '}
                  <span className="font-bold">{formatINR(existingRecordForDate.total)}</span>. Saving will update this entry.
                </div>
              </div>
            )}
          </div>

          {/* Cash & Online Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cash Sales */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Cash Sales (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold">
                  ₹
                </div>
                <input
                  type="number"
                  id="input-cash-sales"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all placeholder:text-slate-300"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Physical counter cash received</p>
            </div>

            {/* Online Sales */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Online Sales (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold">
                  ₹
                </div>
                <input
                  type="number"
                  id="input-online-sales"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={online}
                  onChange={(e) => setOnline(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all placeholder:text-slate-300"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">UPI, QR Code, GPay, Paytm, Cards</p>
            </div>
          </div>

          {/* Real-time Calculation Panel */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Live Automatic Breakdown</span>
              <span className="text-[11px] text-slate-400 font-normal">Formula: Total = Cash + Online</span>
            </div>

            {/* Total Sales */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Daily Sales</div>
                  <div className="text-xs text-slate-400">Cash ({formatINR(calc.cash)}) + Online ({formatINR(calc.online)})</div>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                {formatINR(calc.total)}
              </div>
            </div>

            {/* Profit & COGS Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Profit 20% */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl">
                <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Profit (20%)</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-700 mt-1">
                  {formatINR(calc.profit)}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  20% of {formatINR(calc.total)}
                </div>
              </div>

              {/* Cost of Goods 80% */}
              <div className="bg-blue-50/80 border border-blue-200/80 p-3 rounded-xl">
                <div className="flex items-center space-x-1.5 text-blue-800 text-xs font-bold">
                  <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cost of Goods (80%)</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-blue-700 mt-1">
                  {formatINR(calc.cogs)}
                </div>
                <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                  80% of {formatINR(calc.total)}
                </div>
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              id="input-notes"
              placeholder="e.g., Weekend lunch rush, rainy day, holiday crowd"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-sale"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-semibold text-sm shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Sale' : 'Save Daily Sale'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
