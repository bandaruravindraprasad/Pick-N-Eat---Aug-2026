import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Wallet,
  Smartphone,
  ShoppingBag,
  Truck,
  Layers,
} from 'lucide-react';
import { PurchaseRecord } from '../types';
import {
  formatINR,
  formatDateWithDay,
  MONTH_NAMES,
  getTodayDateString,
} from '../utils/formatters';
import { exportPurchasesToExcel } from '../utils/excelHelper';

interface PurchasesViewProps {
  purchases: PurchaseRecord[];
  onAddPurchase: () => void;
  onEditPurchase: (record: PurchaseRecord) => void;
  onDeletePurchase: (id: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  onAddPurchase,
  onEditPurchase,
  onDeletePurchase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'online'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    purchases.forEach((p) => {
      if (p.date) {
        const y = p.date.split('-')[0];
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [purchases]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (!p.date) return false;
      const [y, m] = p.date.split('-');

      if (selectedYear !== 'all' && y !== selectedYear) return false;
      if (selectedMonth !== 'all' && m !== selectedMonth) return false;
      if (paymentFilter !== 'all' && p.paymentMode !== paymentFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesSupplier = p.supplier ? p.supplier.toLowerCase().includes(query) : false;
        const matchesNotes = p.notes ? p.notes.toLowerCase().includes(query) : false;
        const matchesDate = p.date.includes(query);
        const matchesAmount = String(p.amount).includes(query);
        if (!matchesTitle && !matchesSupplier && !matchesNotes && !matchesDate && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, selectedYear, selectedMonth, paymentFilter, searchTerm]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const today = getTodayDateString();
    let total = 0;
    let cash = 0;
    let online = 0;
    let todayTotal = 0;

    filteredPurchases.forEach((p) => {
      total += p.amount;
      if (p.paymentMode === 'cash') cash += p.amount;
      if (p.paymentMode === 'online') online += p.amount;
      if (p.date === today) todayTotal += p.amount;
    });

    return {
      total,
      cash,
      online,
      todayTotal,
      count: filteredPurchases.length,
    };
  }, [filteredPurchases]);

  const handleExport = () => {
    exportPurchasesToExcel(filteredPurchases, `Pick_N_Eat_Purchases_${selectedYear}_${selectedMonth}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Purchases &amp; Raw Materials
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Track ingredients, chicken, paneer, oil, spices, and packaging purchases
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleExport}
            disabled={filteredPurchases.length === 0}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Export filtered purchases to Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export</span> Excel
          </button>

          <button
            id="btn-add-purchase-main"
            onClick={onAddPurchase}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Purchase</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Purchases
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700">
            {formatINR(metrics.total)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {metrics.count} total purchases
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cash Purchases
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">
            {formatINR(metrics.cash)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            Cash payment
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Online / UPI
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {formatINR(metrics.online)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            UPI / Bank transfer
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today&apos;s Purchases
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700">
            {formatINR(metrics.todayTotal)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            Bought today
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search item, vendor, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
            />
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white"
            >
              <option value="all">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white"
            >
              <option value="all">All Months</option>
              {MONTH_NAMES.map((name, idx) => {
                const monthNum = String(idx + 1).padStart(2, '0');
                return (
                  <option key={monthNum} value={monthNum}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white"
            >
              <option value="all">All Payment Modes</option>
              <option value="cash">Cash Only</option>
              <option value="online">Online / UPI Only</option>
            </select>
          </div>
        </div>

        {/* Reset Active Filters */}
        {(searchTerm || selectedYear !== 'all' || selectedMonth !== 'all' || paymentFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Showing <strong>{filteredPurchases.length}</strong> of{' '}
              <strong>{purchases.length}</strong> purchases
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedYear('all');
                setSelectedMonth('all');
                setPaymentFilter('all');
              }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Purchases Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {filteredPurchases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No purchase records found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {purchases.length === 0
                ? "Start recording your daily raw material and inventory purchases like chicken, paneer, oil, and packaging."
                : "No purchases match your selected search or date filter criteria."}
            </p>
            <button
              onClick={onAddPurchase}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Purchase Entry</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Item Name</th>
                    <th className="py-3.5 px-4">Qty / Unit</th>
                    <th className="py-3.5 px-4">Supplier / Vendor</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPurchases.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {formatDateWithDay(record.date)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {record.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {record.quantity ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {record.quantity}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {record.supplier || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {record.paymentMode === 'cash' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Wallet className="w-3 h-3 mr-1" /> Cash
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Smartphone className="w-3 h-3 mr-1" /> Online
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-indigo-700 whitespace-nowrap text-base">
                        {formatINR(record.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">
                        {record.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onEditPurchase(record)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {deleteConfirmId === record.id ? (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  onDeletePurchase(record.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2 py-1 text-xs font-bold rounded-md bg-red-600 text-white hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-md"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(record.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredPurchases.map((record) => (
                <div key={record.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {record.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {formatDateWithDay(record.date)}
                        {record.quantity && (
                          <span className="ml-2 font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {record.quantity}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-black text-indigo-700 text-lg">
                      {formatINR(record.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center space-x-2">
                      {record.paymentMode === 'cash' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <Wallet className="w-3 h-3 mr-1" /> Cash
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Smartphone className="w-3 h-3 mr-1" /> Online
                        </span>
                      )}
                      {record.supplier && (
                        <span className="text-slate-500 text-[11px] truncate max-w-[120px]">
                          📍 {record.supplier}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEditPurchase(record)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDeletePurchase(record.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {record.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                      {record.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
