import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  PackageCheck,
  Wallet,
  Smartphone,
  CalendarDays,
  Filter,
  Layers,
  Award,
  Sparkles,
} from 'lucide-react';
import { ReportType, SalesRecord } from '../types';
import {
  formatINR,
  formatDateDisplay,
  formatDateWithDay,
  getDayName,
  MONTH_NAMES,
  DAYS_OF_WEEK,
} from '../utils/formatters';
import { exportSalesToExcel } from '../utils/excelHelper';

interface ReportsViewProps {
  sales: SalesRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ sales }) => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Extract all available years from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    sales.forEach((s) => {
      const y = s.date.split('-')[0];
      if (y) years.add(y);
    });
    years.add(String(new Date().getFullYear()));
    return Array.from(years).sort().reverse();
  }, [sales]);

  // Filtered sales records according to selected criteria
  const filteredSales = useMemo(() => {
    return sales.filter((record) => {
      // Specific custom date range
      if (startDate && record.date < startDate) return false;
      if (endDate && record.date > endDate) return false;

      // Year filter
      if (selectedYear !== 'all' && !record.date.startsWith(selectedYear)) {
        return false;
      }

      // Month filter
      if (selectedMonth !== 'all') {
        const m = record.date.split('-')[1];
        if (m !== selectedMonth) return false;
      }

      // Day of Week filter
      if (selectedDayOfWeek !== 'all') {
        const [year, month, day] = record.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        if (String(dateObj.getDay()) !== selectedDayOfWeek) return false;
      }

      return true;
    });
  }, [sales, selectedYear, selectedMonth, selectedDayOfWeek, startDate, endDate]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalCash = filteredSales.reduce((acc, s) => acc + s.cash, 0);
    const totalOnline = filteredSales.reduce((acc, s) => acc + s.online, 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
    const totalCogs = filteredSales.reduce((acc, s) => acc + s.cogs, 0);
    const count = filteredSales.length;
    const avgDailySales = count > 0 ? Math.round(totalSales / count) : 0;
    const avgDailyProfit = count > 0 ? Math.round(totalProfit / count) : 0;

    // Peak sales day
    let peakRecord: SalesRecord | null = null;
    filteredSales.forEach((s) => {
      if (!peakRecord || s.total > peakRecord.total) {
        peakRecord = s;
      }
    });

    return {
      totalSales,
      totalCash,
      totalOnline,
      totalProfit,
      totalCogs,
      count,
      avgDailySales,
      avgDailyProfit,
      peakRecord,
    };
  }, [filteredSales]);

  // Monthly Aggregated Data
  const monthlyAggregates = useMemo(() => {
    const map = new Map<string, {
      monthKey: string; // "2026-08"
      year: string;
      monthNum: string;
      monthName: string;
      cash: number;
      online: number;
      total: number;
      profit: number;
      cogs: number;
      daysCount: number;
      records: SalesRecord[];
    }>();

    filteredSales.forEach((r) => {
      const parts = r.date.split('-');
      const y = parts[0];
      const m = parts[1];
      const key = `${y}-${m}`;
      const monthIndex = parseInt(m, 10) - 1;
      const mName = MONTH_NAMES[monthIndex] || m;

      if (!map.has(key)) {
        map.set(key, {
          monthKey: key,
          year: y,
          monthNum: m,
          monthName: mName,
          cash: 0,
          online: 0,
          total: 0,
          profit: 0,
          cogs: 0,
          daysCount: 0,
          records: [],
        });
      }

      const entry = map.get(key)!;
      entry.cash += r.cash;
      entry.online += r.online;
      entry.total += r.total;
      entry.profit += r.profit;
      entry.cogs += r.cogs;
      entry.daysCount += 1;
      entry.records.push(r);
    });

    return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredSales]);

  // Yearly Aggregated Data
  const yearlyAggregates = useMemo(() => {
    const map = new Map<string, {
      year: string;
      cash: number;
      online: number;
      total: number;
      profit: number;
      cogs: number;
      daysCount: number;
      monthlyMap: Map<string, number>;
    }>();

    // In yearly mode, we aggregate all records matching year/day filters
    filteredSales.forEach((r) => {
      const y = r.date.split('-')[0];
      const m = r.date.split('-')[1];

      if (!map.has(y)) {
        map.set(y, {
          year: y,
          cash: 0,
          online: 0,
          total: 0,
          profit: 0,
          cogs: 0,
          daysCount: 0,
          monthlyMap: new Map(),
        });
      }

      const entry = map.get(y)!;
      entry.cash += r.cash;
      entry.online += r.online;
      entry.total += r.total;
      entry.profit += r.profit;
      entry.cogs += r.cogs;
      entry.daysCount += 1;
      entry.monthlyMap.set(m, (entry.monthlyMap.get(m) || 0) + r.total);
    });

    return Array.from(map.values()).sort((a, b) => b.year.localeCompare(a.year));
  }, [filteredSales]);

  const handleExport = () => {
    const filename = `Pick_N_Eat_${reportType.toUpperCase()}_Report_${selectedYear}_${
      selectedMonth !== 'all' ? selectedMonth : 'All'
    }.xlsx`;
    exportSalesToExcel(filteredSales, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Sales &amp; Profit Reports</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Select any Month, Year, Day of Week, or Date to inspect sales, 20% profit, and 80% COGS.
          </p>
        </div>

        {/* Export & Print actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExport}
            disabled={filteredSales.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Report (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs (Daily, Monthly, Yearly) */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 max-w-md">
        <button
          onClick={() => setReportType('daily')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            reportType === 'daily'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Sales Report
        </button>

        <button
          onClick={() => setReportType('monthly')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            reportType === 'monthly'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly Report
        </button>

        <button
          onClick={() => setReportType('yearly')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            reportType === 'yearly'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Yearly Report
        </button>
      </div>

      {/* Filter Bar (Year, Month, Day of Week, Date Range) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-amber-500" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 outline-hidden"
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
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 outline-hidden"
            >
              <option value="all">All Months (Jan-Dec)</option>
              {MONTH_NAMES.map((name, idx) => {
                const val = String(idx + 1).padStart(2, '0');
                return (
                  <option key={val} value={val}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Day of Week Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Day of Week
            </label>
            <select
              value={selectedDayOfWeek}
              onChange={(e) => setSelectedDayOfWeek(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 outline-hidden"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range (Start) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Date Range (Optional)
            </label>
            <div className="flex items-center space-x-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From"
                className="w-1/2 px-2 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 outline-hidden"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To"
                className="w-1/2 px-2 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 outline-hidden"
              />
            </div>
          </div>
        </div>

        {(startDate || endDate || selectedMonth !== 'all' || selectedDayOfWeek !== 'all' || selectedYear !== 'all') && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>
              Showing results for:{' '}
              <strong className="text-slate-800">
                {selectedYear !== 'all' ? `Year ${selectedYear}` : 'All Years'}
                {selectedMonth !== 'all' && ` • ${MONTH_NAMES[parseInt(selectedMonth, 10) - 1]}`}
                {selectedDayOfWeek !== 'all' && ` • ${DAYS_OF_WEEK.find((d) => d.value === selectedDayOfWeek)?.label}`}
                {startDate && ` • From ${startDate}`}
                {endDate && ` • To ${endDate}`}
              </strong>
            </span>
            <button
              onClick={() => {
                setSelectedYear(String(new Date().getFullYear()));
                setSelectedMonth('all');
                setSelectedDayOfWeek('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-amber-600 hover:text-amber-700 font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Report Summary Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Sales
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatINR(summary.totalSales)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Cash: <strong>{formatINR(summary.totalCash)}</strong></span>
            <span>Online: <strong>{formatINR(summary.totalOnline)}</strong></span>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Net Profit (20%)</span>
            </span>
            <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              20%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800">
            {formatINR(summary.totalProfit)}
          </div>
          <div className="mt-2 text-xs text-emerald-700 border-t border-emerald-200/60 pt-2 font-medium">
            Avg Daily Profit: {formatINR(summary.avgDailyProfit)}
          </div>
        </div>

        {/* Cost of Goods */}
        <div className="bg-blue-50/80 p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center space-x-1">
              <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Cost of Goods (80%)</span>
            </span>
            <span className="text-xs font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
              80%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-800">
            {formatINR(summary.totalCogs)}
          </div>
          <div className="mt-2 text-xs text-blue-700 border-t border-blue-200/60 pt-2 font-medium">
            Stock, ingredients &amp; supplies
          </div>
        </div>

        {/* Activity & Peak Day */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Days Logged &amp; Average
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {summary.count} Days
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Daily Avg Sales: <strong className="text-slate-800">{formatINR(summary.avgDailySales)}</strong>
            </div>
          </div>
          {summary.peakRecord && (
            <div className="mt-2 text-[11px] bg-amber-50 p-2 rounded-xl text-amber-900 border border-amber-200/80">
              <span className="font-bold flex items-center space-x-1">
                <Award className="w-3 h-3 text-amber-600" />
                <span>Peak Sales Day:</span>
              </span>
              <span>{formatDateDisplay(summary.peakRecord.date)} ({formatINR(summary.peakRecord.total)})</span>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: DAILY SALES REPORT */}
      {reportType === 'daily' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daily Sales Itemized Report
              </h3>
              <p className="text-xs text-slate-500">
                {filteredSales.length} records matching current filter
              </p>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No sales records match this filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Day</th>
                    <th className="px-4 py-3.5">Cash Sales</th>
                    <th className="px-4 py-3.5">Online Sales</th>
                    <th className="px-4 py-3.5">Total Sales</th>
                    <th className="px-4 py-3.5 text-emerald-800 bg-emerald-50/50">Profit (20%)</th>
                    <th className="px-4 py-3.5 text-blue-800 bg-blue-50/50">Cost of Goods (80%)</th>
                    <th className="px-4 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredSales.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {formatDateDisplay(record.date)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {getDayName(record.date)}
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
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold text-sm">
                  <tr>
                    <td colSpan={2} className="px-5 py-4 text-slate-300">
                      Total ({filteredSales.length} days)
                    </td>
                    <td className="px-4 py-4 text-amber-400 font-bold">
                      {formatINR(summary.totalCash)}
                    </td>
                    <td className="px-4 py-4 text-emerald-400 font-bold">
                      {formatINR(summary.totalOnline)}
                    </td>
                    <td className="px-4 py-4 text-white font-black text-base">
                      {formatINR(summary.totalSales)}
                    </td>
                    <td className="px-4 py-4 text-emerald-300 font-black text-base">
                      {formatINR(summary.totalProfit)}
                    </td>
                    <td className="px-4 py-4 text-blue-300 font-black text-base">
                      {formatINR(summary.totalCogs)}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">20% Profit / 80% COGS</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MONTHLY SALES REPORT */}
      {reportType === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900">
              Monthly Aggregated Sales &amp; Profit Report
            </h3>
            <p className="text-xs text-slate-500">
              Summarized by month with daily averages and profit performance
            </p>
          </div>

          {monthlyAggregates.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No sales data found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Month</th>
                    <th className="px-4 py-3.5">Days Active</th>
                    <th className="px-4 py-3.5">Total Cash</th>
                    <th className="px-4 py-3.5">Total Online</th>
                    <th className="px-4 py-3.5">Total Sales</th>
                    <th className="px-4 py-3.5 text-emerald-800 bg-emerald-50/50">Profit (20%)</th>
                    <th className="px-4 py-3.5 text-blue-800 bg-blue-50/50">Cost of Goods (80%)</th>
                    <th className="px-4 py-3.5">Avg / Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {monthlyAggregates.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>
                            {m.monthName} {m.year}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600">
                        {m.daysCount} {m.daysCount === 1 ? 'Day' : 'Days'}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                        {formatINR(m.cash)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                        {formatINR(m.online)}
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap">
                        {formatINR(m.total)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700 bg-emerald-50/30 whitespace-nowrap">
                        {formatINR(m.profit)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-blue-700 bg-blue-50/30 whitespace-nowrap">
                        {formatINR(m.cogs)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                        {formatINR(m.daysCount > 0 ? Math.round(m.total / m.daysCount) : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: YEARLY SALES REPORT */}
      {reportType === 'yearly' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900">
              Yearly Aggregated Sales &amp; Profit Report
            </h3>
            <p className="text-xs text-slate-500">
              Annual performance review with total sales, 20% profit, and 80% COGS
            </p>
          </div>

          {yearlyAggregates.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No sales data found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Year</th>
                    <th className="px-4 py-3.5">Total Days Logged</th>
                    <th className="px-4 py-3.5">Total Cash</th>
                    <th className="px-4 py-3.5">Total Online</th>
                    <th className="px-4 py-3.5">Total Sales</th>
                    <th className="px-4 py-3.5 text-emerald-800 bg-emerald-50/50">Profit (20%)</th>
                    <th className="px-4 py-3.5 text-blue-800 bg-blue-50/50">Cost of Goods (80%)</th>
                    <th className="px-4 py-3.5">Daily Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {yearlyAggregates.map((y) => (
                    <tr key={y.year} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 text-base whitespace-nowrap">
                        Year {y.year}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600">
                        {y.daysCount} Days
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                        {formatINR(y.cash)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                        {formatINR(y.online)}
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap text-base">
                        {formatINR(y.total)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700 bg-emerald-50/30 whitespace-nowrap text-base">
                        {formatINR(y.profit)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-blue-700 bg-blue-50/30 whitespace-nowrap text-base">
                        {formatINR(y.cogs)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                        {formatINR(y.daysCount > 0 ? Math.round(y.total / y.daysCount) : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
