import React from 'react';
import {
  TrendingUp,
  PackageCheck,
  IndianRupee,
  Wallet,
  Smartphone,
  Calendar,
  Plus,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
  Edit2,
  PieChart,
  CalendarCheck,
  Store,
} from 'lucide-react';
import { SalesRecord, ViewMode } from '../types';
import {
  formatINR,
  getTodayDateString,
  formatDateWithDay,
  MONTH_NAMES,
} from '../utils/formatters';

interface DashboardViewProps {
  sales: SalesRecord[];
  onOpenAddModal: () => void;
  onEditSale: (record: SalesRecord) => void;
  onNavigate: (view: ViewMode) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  onOpenAddModal,
  onEditSale,
  onNavigate,
}) => {
  const todayStr = getTodayDateString();
  const todayRecord = sales.find((s) => s.date === todayStr);

  // Current Month calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${currentMonthNum}`;
  const currentMonthName = MONTH_NAMES[now.getMonth()];

  const currentMonthSalesList = sales.filter((s) => s.date.startsWith(currentMonthPrefix));

  const currentMonthSales = currentMonthSalesList.reduce((acc, s) => acc + s.total, 0);
  const currentMonthProfit = currentMonthSalesList.reduce((acc, s) => acc + s.profit, 0);
  const currentMonthCogs = currentMonthSalesList.reduce((acc, s) => acc + s.cogs, 0);
  const currentMonthCash = currentMonthSalesList.reduce((acc, s) => acc + s.cash, 0);
  const currentMonthOnline = currentMonthSalesList.reduce((acc, s) => acc + s.online, 0);

  // All-time Totals
  const allTimeSales = sales.reduce((acc, s) => acc + s.total, 0);
  const allTimeCash = sales.reduce((acc, s) => acc + s.cash, 0);
  const allTimeOnline = sales.reduce((acc, s) => acc + s.online, 0);
  const allTimeProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const allTimeCogs = sales.reduce((acc, s) => acc + s.cogs, 0);

  // Percentages for current month
  const cashPercent = currentMonthSales > 0 ? Math.round((currentMonthCash / currentMonthSales) * 100) : 50;
  const onlinePercent = currentMonthSales > 0 ? 100 - cashPercent : 50;

  // Recent 7 days
  const recentDays = sales.slice(0, 7);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome with Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Pick &apos;N&apos; Eat &bull; Live Tracker</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Daily Sales &amp; Profit Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Automatic 20% Profit &amp; 80% Cost of Goods calculated instantly on every Cash &amp; Online sale.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              id="btn-add-today-sale"
              onClick={onOpenAddModal}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{todayRecord ? 'Update Today&apos;s Sale' : '+ Enter Today&apos;s Sale'}</span>
            </button>
            <button
              onClick={() => onNavigate('import')}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: TODAY'S SALES BREAKDOWN (REQUIRED) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Today&apos;s Overview
            </h2>
            <span className="text-xs font-medium text-slate-500">
              ({formatDateWithDay(todayStr)})
            </span>
          </div>
          {todayRecord ? (
            <button
              onClick={() => onEditSale(todayRecord)}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Today</span>
            </button>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200">
              No sales logged yet for today
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Today's Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Today&apos;s Sales
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatINR(todayRecord ? todayRecord.total : 0)}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Cash: <strong className="text-slate-800">{formatINR(todayRecord?.cash || 0)}</strong></span>
              <span>Online: <strong className="text-slate-800">{formatINR(todayRecord?.online || 0)}</strong></span>
            </div>
          </div>

          {/* Today's Profit */}
          <div className="bg-emerald-50/70 rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Today&apos;s Profit (20%)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                20% Net
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
              {formatINR(todayRecord ? todayRecord.profit : 0)}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 text-xs text-emerald-700 font-medium">
              Calculated automatically on ₹{todayRecord ? todayRecord.total : 0} total sales
            </div>
          </div>

          {/* Today's Cost of Goods */}
          <div className="bg-blue-50/70 rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center space-x-1">
                <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Today&apos;s Cost of Goods (80%)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                80% COGS
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-800 tracking-tight">
              {formatINR(todayRecord ? todayRecord.cogs : 0)}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 text-xs text-blue-700 font-medium">
              Food materials, ingredients &amp; packaging
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CURRENT MONTH METRICS (REQUIRED) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Current Month: {currentMonthName} {currentYear}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {currentMonthSalesList.length} Days Recorded
            </span>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>Full Report</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Current Month Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Current Month Sales
              </span>
              <span className="text-xs font-semibold text-slate-400">{currentMonthName}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatINR(currentMonthSales)}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
              <span>Avg/Day:</span>
              <strong className="text-slate-800">
                {formatINR(currentMonthSalesList.length > 0 ? Math.round(currentMonthSales / currentMonthSalesList.length) : 0)}
              </strong>
            </div>
          </div>

          {/* Current Month Profit */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-2xs bg-gradient-to-b from-white to-emerald-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Current Month Profit</span>
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                20%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {formatINR(currentMonthProfit)}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-emerald-100 text-xs text-emerald-700/80 font-medium">
              Net shop earnings for {currentMonthName}
            </div>
          </div>

          {/* Current Month Cost of Goods */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-2xs bg-gradient-to-b from-white to-blue-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center space-x-1">
                <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Current Month Cost of Goods</span>
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                80%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
              {formatINR(currentMonthCogs)}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-blue-100 text-xs text-blue-700/80 font-medium">
              Estimated inventory &amp; product costs
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: TOTAL CASH & TOTAL ONLINE BREAKDOWN (REQUIRED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Methods Split */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Payment Collection Split</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">All Time</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Total Cash */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800 mb-1">
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <span>Total Cash</span>
              </div>
              <div className="text-xl font-extrabold text-amber-900">
                {formatINR(allTimeCash)}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
                {allTimeSales > 0 ? Math.round((allTimeCash / allTimeSales) * 100) : 0}% of all sales
              </div>
            </div>

            {/* Total Online */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Total Online</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-900">
                {formatINR(allTimeOnline)}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                {allTimeSales > 0 ? Math.round((allTimeOnline / allTimeSales) * 100) : 0}% of all sales
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
              <span>Cash ({allTimeSales > 0 ? Math.round((allTimeCash / allTimeSales) * 100) : 0}%)</span>
              <span>Online UPI ({allTimeSales > 0 ? Math.round((allTimeOnline / allTimeSales) * 100) : 0}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{
                  width: `${allTimeSales > 0 ? (allTimeCash / allTimeSales) * 100 : 50}%`,
                }}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{
                  width: `${allTimeSales > 0 ? (allTimeOnline / allTimeSales) * 100 : 50}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Profit vs Cost of Goods Split */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Shop Margin Ratio</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                Fixed 20 / 80 Rule
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="text-xs font-bold text-emerald-800">Total Profit (20%)</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-1">
                  {formatINR(allTimeProfit)}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Across all entries</div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="text-xs font-bold text-blue-800">Total COGS (80%)</div>
                <div className="text-xl font-extrabold text-blue-700 mt-1">
                  {formatINR(allTimeCogs)}
                </div>
                <div className="text-[11px] text-blue-600 mt-0.5">Stock &amp; Ingredients</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
              <span className="text-emerald-700">20% Daily Profit</span>
              <span className="text-blue-700">80% Cost of Goods</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full w-[20%]" />
              <div className="bg-blue-500 h-full w-[80%]" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: RECENT 7 DAYS PERFORMANCE TABLE / CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Sales Log
            </h3>
            <p className="text-xs text-slate-500">
              Latest daily records with instant calculation breakdown
            </p>
          </div>
          <button
            onClick={() => onNavigate('daily')}
            className="text-xs sm:text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
          >
            <span>View All ({sales.length})</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile View: Cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {recentDays.map((record) => (
            <div key={record.id} className="p-4 hover:bg-slate-50/80 transition-colors">
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
                  <div className="font-extrabold text-slate-900 text-base">
                    {formatINR(record.total)}
                  </div>
                  <button
                    onClick={() => onEditSale(record)}
                    className="text-xs font-semibold text-amber-600 hover:underline inline-flex items-center space-x-1 mt-0.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Cash</div>
                  <div className="font-bold text-slate-700">{formatINR(record.cash)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Online</div>
                  <div className="font-bold text-slate-700">{formatINR(record.online)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 uppercase font-semibold">Profit (20%)</div>
                  <div className="font-bold text-emerald-700">{formatINR(record.profit)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-blue-600 uppercase font-semibold">COGS (80%)</div>
                  <div className="font-bold text-blue-700">{formatINR(record.cogs)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Clean Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-4 py-3.5">Cash Sales</th>
                <th className="px-4 py-3.5">Online Sales</th>
                <th className="px-4 py-3.5">Total Sales</th>
                <th className="px-4 py-3.5 text-emerald-700">Profit (20%)</th>
                <th className="px-4 py-3.5 text-blue-700">Cost of Goods (80%)</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {recentDays.map((record) => (
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
                    <button
                      onClick={() => onEditSale(record)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors inline-flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
