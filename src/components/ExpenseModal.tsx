import React, { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, AlertCircle, Save, Receipt, Wallet, Smartphone } from 'lucide-react';
import { ExpenseRecord, PaymentMode } from '../types';
import {
  formatINR,
  getTodayDateString,
  getYesterdayDateString,
  formatDateWithDay,
} from '../utils/formatters';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  initialData?: ExpenseRecord | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [date, setDate] = useState<string>(getTodayDateString());
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date);
        setTitle(initialData.title);
        setAmount(initialData.amount ? String(initialData.amount) : '');
        setPaymentMode(initialData.paymentMode || 'cash');
        setNotes(initialData.notes || '');
      } else {
        setDate(getTodayDateString());
        setTitle('');
        setAmount('');
        setPaymentMode('cash');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const isEditing = !!initialData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an expense name / item description.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    onSave(
      {
        date,
        title: title.trim(),
        amount: Math.round(numAmount * 100) / 100,
        paymentMode,
        notes: notes.trim() || undefined,
      },
      initialData?.id
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
        <div className="bg-rose-900 px-5 py-4 sm:px-6 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-800 flex items-center justify-center text-rose-200">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? 'Edit Expense Entry' : 'Add Daily Expense'}
              </h2>
              <p className="text-xs text-rose-200">
                Log any daily shop expense with custom name (no dropdown restrictions)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-rose-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Free-text Expense Name (NO DROPDOWN) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Expense Item / Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              id="input-expense-title"
              required
              autoFocus
              placeholder="Enter any name (e.g. Electricity bill, Gas cylinder, Staff tea, Rent, Cleaning...)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all text-sm placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Type any free-text name or description for today&apos;s expense
            </p>
          </div>

          {/* Date Selector with Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>Expense Date</span>
              </label>
              <div className="flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDate(getTodayDateString())}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    date === getTodayDateString()
                      ? 'bg-rose-100 text-rose-800 font-semibold'
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
                      ? 'bg-rose-100 text-rose-800 font-semibold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>

            <input
              type="date"
              id="input-expense-date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all text-sm"
            />
            {date && (
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {formatDateWithDay(date)}
              </p>
            )}
          </div>

          {/* Amount & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount (₹) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  ₹
                </div>
                <input
                  type="number"
                  id="input-expense-amount"
                  min="0"
                  step="any"
                  required
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-base focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all placeholder:text-slate-300"
                />
              </div>
              {numAmount > 0 && (
                <p className="text-[11px] text-rose-700 font-semibold mt-1">
                  {formatINR(numAmount)}
                </p>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Paid Via
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    paymentMode === 'cash'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-400/40'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('online')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    paymentMode === 'online'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400/40'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Online / UPI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes / Receipt Details (Optional)
            </label>
            <input
              type="text"
              id="input-expense-notes"
              placeholder="e.g., Paid to electrician, Bill #420, Cylinder replacement"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-expense"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold text-sm shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Expense' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
