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
  Sparkles,
} from 'lucide-react';
import { ViewMode } from '../types';
import { downloadSampleExcelTemplate } from '../utils/excelHelper';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenAddModal: () => void;
  onExportAll: () => void;
  onResetData: () => void;
  totalRecordsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenAddModal,
  onExportAll,
  onResetData,
  totalRecordsCount,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onViewChange('dashboard')}
              className="flex items-center space-x-3 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:bg-amber-600 transition-colors">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                    Pick &apos;N&apos; Eat
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Sales Tracker
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Daily Sales, 20% Profit &amp; 80% Cost of Goods
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            <button
              id="nav-tab-dashboard"
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-500" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-tab-daily"
              onClick={() => onViewChange('daily')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>Daily Sales</span>
              {totalRecordsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-slate-200 text-slate-700 font-semibold">
                  {totalRecordsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => onViewChange('reports')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'reports'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Reports</span>
            </button>

            <button
              id="nav-tab-import"
              onClick={() => onViewChange('import')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'import'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Quick Add Daily Sale */}
            <button
              id="btn-add-sale-header"
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Daily Sale</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* More Options Dropdown */}
            <div className="relative">
              <button
                id="btn-more-options"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
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
                      <span>Download Excel Template</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onExportAll();
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Export All Data (Excel)</span>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium ${
              currentView === 'dashboard'
                ? 'text-amber-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onViewChange('daily')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium relative ${
              currentView === 'daily'
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-5 h-5 mb-0.5" />
            <span>Sales</span>
          </button>

          <button
            onClick={() => onViewChange('reports')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium ${
              currentView === 'reports'
                ? 'text-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => onViewChange('import')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium ${
              currentView === 'import'
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mb-0.5" />
            <span>Import</span>
          </button>
        </div>
      </div>
    </header>
  );
};
