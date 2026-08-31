import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  TrendingUp,
  PackageCheck,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { SalesRecord } from '../types';
import {
  formatINR,
  formatDateWithDay,
  MONTH_NAMES,
} from '../utils/formatters';
import { exportSalesToExcel } from '../utils/excelHelper';

interface DailySalesViewProps {
  sales: SalesRecord[];
  onOpenAddModal: () => void;
  onEditSale: (record: SalesRecord) => void;
  onDeleteSale: (record: SalesRecord) => void;
}

export const DailySalesView: React.FC<DailySalesViewProps> = ({
  sales,
  onOpenAddModal,
  onEditSale,
  onDeleteSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Extract available years from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    sales.forEach((s) => {
      const y = s.date.split('-')[0];
      if (y) years.add(y);
    });
    // Add current year if not present
    years.add(String(new Date().getFullYear()));
    return Array.from(years).sort().reverse();
  }, [sales]);

  // Filtered sales records
  const filteredSales = useMemo(() => {
    return sales
      .filter((record) => {
        // Year filter
        if (selectedYear !== 'all' && !record.date.startsWith(selectedYear)) {
          return false;
        }

        // Month filter
        if (selectedMonth !== 'all') {
          const m = record.date.split('-')[1];
          if (m !== selectedMonth) return false;
        }

        // Search term (Date or Notes)
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchesDate = record.date.toLowerCase().includes(query);
          const matchesNotes = record.notes ? record.notes.toLowerCase().includes(query) : false;
          if (!matchesDate && !matchesNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return b.date.localeCompare(a.date);
        } else {
          return a.date.localeCompare(b.date);
        }
      });
  }, [sales, selectedYear, selectedMonth, searchTerm, sortOrder]);

  // Filtered summary calculations
  const totals = useMemo(() => {
    const cash = filteredSales.reduce((acc, s) => acc + s.cash, 0);
    const online = filteredSales.reduce((acc, s) => acc + s.online, 0);
    const total = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const profit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
    const cogs = filteredSales.reduce((acc, s) => acc + s.cogs, 0);
    return { cash, online, total, profit, cogs, count: filteredSales.length };
  }, [filteredSales]);

  const handleExport = () => {
    const filename = `Pick_N_Eat_Daily_Sales_${selectedYear !== 'all' ? selectedYear : 'All'}_${
      selectedMonth !== 'all' ? selectedMonth : 'All'
    }.xlsx`;
    exportSalesToExcel(filteredSales, filename);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMonth('all');
    setSelectedYear('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedMonth !== 'all' || selectedYear !== 'all';

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            <span>Daily Sales Log</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter, edit, or delete daily cash and online sales with auto profit calculations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            disabled={filteredSales.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export ({filteredSales.length})</span>
          </button>

          <button
            id="btn-add-daily-sale-page"
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Daily Sale</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip for Filtered View */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">Days Logged</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
            {totals.count} {totals.count === 1 ? 'Day' : 'Days'}
          </div>
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80">
          <div className="text-[11px] text-amber-400 font-medium">Cash Sales</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
            {formatINR(totals.cash)}
          </div>
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80">
          <div className="text-[11px] text-emerald-400 font-medium">Online Sales</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
            {formatINR(totals.online)}
          </div>
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500 text-slate-950 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-900">Total Sales</div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">
            {formatINR(totals.total)}
          </div>
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/40 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-emerald-300 font-bold flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Profit (20%)</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">
            {formatINR(totals.profit)}
          </div>
          <div className="text-[10px] text-emerald-400">COGS: {formatINR(totals.cogs)}</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search date (e.g. 2026-08) or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Year select */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 outline-hidden"
          >
            <option value="all">All Years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          {/* Month select */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 outline-hidden"
          >
            <option value="all">All Months</option>
            {MONTH_NAMES.map((name, idx) => {
              const num = String(idx + 1).padStart(2, '0');
              return (
                <option key={num} value={num}>
                  {name}
                </option>
              );
            })}
          </select>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Date: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Record Cards (Mobile) / Table (Desktop) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No Sales Records Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting or clearing your filters to see entries.'
                : 'Start tracking daily sales by clicking the "Add Daily Sale" button above.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-200 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onOpenAddModal}
                className="mt-4 px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 transition-colors"
              >
                + Add First Sale
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredSales.map((record) => (
                <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {formatDateWithDay(record.date)}
                      </div>
                      {record.notes && (
                        <div className="text-xs text-slate-500 italic mt-0.5">
                          &ldquo;{record.notes}&rdquo;
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900 text-base">
                        {formatINR(record.total)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-bold">
                        Profit: {formatINR(record.profit)}
                      </div>
                    </div>
                  </div>

                  {/* Numbers grid */}
                  <div className="grid grid-cols-4 gap-1 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 mb-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Cash</div>
                      <div className="font-bold text-slate-700">{formatINR(record.cash)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Online</div>
                      <div className="font-bold text-slate-700">{formatINR(record.online)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-600 uppercase font-semibold">Profit 20%</div>
                      <div className="font-bold text-emerald-700">{formatINR(record.profit)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-600 uppercase font-semibold">COGS 80%</div>
                      <div className="font-bold text-blue-700">{formatINR(record.cogs)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => onEditSale(record)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteSale(record)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Cash Sales</th>
                    <th className="px-4 py-3.5">Online Sales</th>
                    <th className="px-4 py-3.5">Total Sales</th>
                    <th className="px-4 py-3.5 text-emerald-800 bg-emerald-50/50">
                      Profit (20%)
                    </th>
                    <th className="px-4 py-3.5 text-blue-800 bg-blue-50/50">
                      Cost of Goods (80%)
                    </th>
                    <th className="px-4 py-3.5">Notes</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredSales.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {formatDateWithDay(record.date)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                        {formatINR(record.cash)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                        {formatINR(record.online)}
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap">
                        {formatINR(record.total)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700 bg-emerald-50/30 whitespace-nowrap">
                        {formatINR(record.profit)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-blue-700 bg-blue-50/30 whitespace-nowrap">
                        {formatINR(record.cogs)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                        {record.notes || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onEditSale(record)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteSale(record)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
