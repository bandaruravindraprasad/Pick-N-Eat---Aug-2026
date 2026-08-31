import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  FileSpreadsheet,
  Plus,
  Download,
  FileText,
  RotateCcw,
  Store,
  ChevronDown,
  Receipt,
  ShoppingBag,
} from 'lucide-react';
import { ViewMode } from '../types';
import { downloadSampleExcelTemplate } from '../utils/excelHelper';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenAddSaleModal: () => void;
  onOpenAddExpenseModal: () => void;
  onOpenAddPurchaseModal: () => void;
  onExportAll: () => void;
  onResetData: () => void;
  totalRecordsCount: number;
  totalExpensesCount: number;
  totalPurchasesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenAddSaleModal,
  onOpenAddExpenseModal,
  onOpenAddPurchaseModal,
  onExportAll,
  onResetData,
  totalRecordsCount,
  totalExpensesCount,
  totalPurchasesCount,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onViewChange('dashboard')}
              className="flex items-center space-x-2.5 sm:space-x-3 text-left group focus:outline-hidden cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:bg-amber-600 transition-colors">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base sm:text-xl text-slate-900 tracking-tight">
                    Pick &apos;N&apos; Eat
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Tracker
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Daily Sales, Purchases, Expenses &amp; Profit
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            <button
              id="nav-tab-dashboard"
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-500" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-tab-daily"
              onClick={() => onViewChange('daily')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daily Sales</span>
              {totalRecordsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                  {totalRecordsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-purchases"
              onClick={() => onViewChange('purchases')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'purchases'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Purchases</span>
              {totalPurchasesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                  {totalPurchasesCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-expenses"
              onClick={() => onViewChange('expenses')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'expenses'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
              <span>Expenses</span>
              {totalExpensesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                  {totalExpensesCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => onViewChange('reports')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'reports'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Reports</span>
            </button>

            <button
              id="nav-tab-import"
              onClick={() => onViewChange('import')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'import'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Quick Add Split Menu */}
            <div className="relative">
              <button
                id="btn-add-quick-menu"
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Log Entry</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {showAddMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAddMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        onOpenAddSaleModal();
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-amber-50 flex items-center space-x-2.5 text-slate-800"
                    >
                      <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        ₹
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">Daily Sales</div>
                        <div className="text-[10px] text-slate-500">Cash &amp; Online revenue</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        onOpenAddPurchaseModal();
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 flex items-center space-x-2.5 text-slate-800"
                    >
                      <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">Purchases</div>
                        <div className="text-[10px] text-slate-500">Stock &amp; raw materials</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        onOpenAddExpenseModal();
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center space-x-2.5 text-slate-800"
                    >
                      <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">Expenses</div>
                        <div className="text-[10px] text-slate-500">Shop costs &amp; utilities</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* More Options Dropdown */}
            <div className="relative">
              <button
                id="btn-more-options"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Data Options"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-sm">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        downloadSampleExcelTemplate();
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Download Sales Template</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onExportAll();
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Export All Ledger Data</span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (
                          confirm(
                            'Are you sure you want to restore the original sales records from the PDF ledger? Any custom additions or edits will be re-synchronized.'
                          )
                        ) {
                          onResetData();
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-600 hover:bg-red-50 hover:text-red-700 flex items-center space-x-2.5"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-400" />
                      <span>Reset to PDF Records</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1 shadow-lg">
        <div className="grid grid-cols-6 gap-0.5">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
              currentView === 'dashboard'
                ? 'text-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => onViewChange('daily')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium relative ${
              currentView === 'daily'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4 mb-0.5" />
            <span>Sales</span>
          </button>

          <button
            onClick={() => onViewChange('purchases')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium relative ${
              currentView === 'purchases'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mb-0.5" />
            <span>Purchases</span>
          </button>

          <button
            onClick={() => onViewChange('expenses')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium relative ${
              currentView === 'expenses'
                ? 'text-rose-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4 mb-0.5" />
            <span>Expenses</span>
          </button>

          <button
            onClick={() => onViewChange('reports')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
              currentView === 'reports'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => onViewChange('import')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
              currentView === 'import'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mb-0.5" />
            <span>Import</span>
          </button>
        </div>
      </div>
    </header>
  );
};

