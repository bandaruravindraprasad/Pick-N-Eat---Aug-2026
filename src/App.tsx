import React, { useState, useMemo } from 'react';
import {
  DuplicateAction,
  ExpenseRecord,
  PurchaseRecord,
  SalesRecord,
  ViewMode,
} from './types';
import {
  getStoredSales,
  saveStoredSales,
  resetToPdfData,
  getStoredExpenses,
  saveStoredExpenses,
  getStoredPurchases,
  saveStoredPurchases,
} from './utils/storage';
import { exportComprehensiveReportToExcel, exportSalesToExcel } from './utils/excelHelper';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DailySalesView } from './components/DailySalesView';
import { ExpensesView } from './components/ExpensesView';
import { PurchasesView } from './components/PurchasesView';
import { ReportsView } from './components/ReportsView';
import { SalesModal } from './components/SalesModal';
import { ExpenseModal } from './components/ExpenseModal';
import { PurchaseModal } from './components/PurchaseModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function App() {
  // Core State
  const [sales, setSales] = useState<SalesRecord[]>(() => getStoredSales());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => getStoredExpenses());
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => getStoredPurchases());
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Sales Modals
  const [isSalesModalOpen, setIsSalesModalOpen] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<SalesRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [saleToDelete, setSaleToDelete] = useState<SalesRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Expense Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  // Purchase Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ----------------------------------------------------
  // Sales Handlers
  // ----------------------------------------------------
  const updateSalesList = (newSales: SalesRecord[]) => {
    setSales(newSales);
    saveStoredSales(newSales);
  };

  const existingDatesMap = useMemo(() => {
    const map = new Map<string, SalesRecord>();
    sales.forEach((s) => map.set(s.date, s));
    return map;
  }, [sales]);

  const handleSaveSale = (
    data: Omit<SalesRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();

    if (existingId) {
      const updated = sales.map((s) => {
        if (s.id === existingId) {
          return {
            ...s,
            ...data,
            updatedAt: now,
          };
        }
        return s;
      });
      updateSalesList(updated);
      showToast(`Sales entry for ${data.date} updated successfully!`);
    } else {
      const existing = sales.find((s) => s.date === data.date);
      if (existing) {
        const updated = sales.map((s) =>
          s.date === data.date
            ? {
                ...s,
                ...data,
                updatedAt: now,
              }
            : s
        );
        updateSalesList(updated);
        showToast(`Sales entry for ${data.date} updated successfully!`);
      } else {
        const newRecord: SalesRecord = {
          id: `rec_${data.date}_${Date.now()}`,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [newRecord, ...sales];
        updateSalesList(updated);
        showToast(`Daily sale for ${data.date} saved successfully!`);
      }
    }
  };

  const handleConfirmDelete = () => {
    if (!saleToDelete) return;
    const filtered = sales.filter((s) => s.id !== saleToDelete.id);
    updateSalesList(filtered);
    showToast(`Sales record for ${saleToDelete.date} was deleted.`);
    setSaleToDelete(null);
  };

  const handleImportComplete = (importedRecords: SalesRecord[], mode: DuplicateAction) => {
    const map = new Map<string, SalesRecord>();

    if (mode === 'skip') {
      sales.forEach((s) => map.set(s.date, s));
      let addedCount = 0;
      importedRecords.forEach((r) => {
        if (!map.has(r.date)) {
          map.set(r.date, r);
          addedCount++;
        }
      });
      const combined = Array.from(map.values());
      updateSalesList(combined);
      showToast(`Successfully imported ${addedCount} new sales records (duplicates skipped)!`);
    } else {
      sales.forEach((s) => map.set(s.date, s));
      importedRecords.forEach((r) => {
        map.set(r.date, r);
      });
      const combined = Array.from(map.values());
      updateSalesList(combined);
      showToast(`Successfully imported & updated ${importedRecords.length} records!`);
    }

    setCurrentView('daily');
  };

  const handleResetData = () => {
    const records = resetToPdfData();
    setSales(records);
    showToast(`Reset to complete ${records.length} records from the PDF ledger.`);
  };

  const handleExportAll = () => {
    exportComprehensiveReportToExcel(sales, purchases, expenses);
    showToast('Exported complete financials (Sales, Purchases, Expenses) to Excel!');
  };

  // ----------------------------------------------------
  // Expense Handlers
  // ----------------------------------------------------
  const updateExpensesList = (newExpenses: ExpenseRecord[]) => {
    setExpenses(newExpenses);
    saveStoredExpenses(newExpenses);
  };

  const handleSaveExpense = (
    data: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();

    if (existingId) {
      const updated = expenses.map((e) =>
        e.id === existingId ? { ...e, ...data, updatedAt: now } : e
      );
      updateExpensesList(updated);
      showToast(`Expense "${data.title}" updated successfully!`);
    } else {
      const newRecord: ExpenseRecord = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newRecord, ...expenses];
      updateExpensesList(updated);
      showToast(`Expense "${data.title}" added successfully!`);
    }
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    const updated = expenses.filter((e) => e.id !== id);
    updateExpensesList(updated);
    showToast(`Expense "${target?.title || ''}" was deleted.`);
  };

  // ----------------------------------------------------
  // Purchase Handlers
  // ----------------------------------------------------
  const updatePurchasesList = (newPurchases: PurchaseRecord[]) => {
    setPurchases(newPurchases);
    saveStoredPurchases(newPurchases);
  };

  const handleSavePurchase = (
    data: Omit<PurchaseRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();

    if (existingId) {
      const updated = purchases.map((p) =>
        p.id === existingId ? { ...p, ...data, updatedAt: now } : p
      );
      updatePurchasesList(updated);
      showToast(`Purchase "${data.itemName}" updated successfully!`);
    } else {
      const newRecord: PurchaseRecord = {
        id: `pur_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newRecord, ...purchases];
      updatePurchasesList(updated);
      showToast(`Purchase "${data.itemName}" logged successfully!`);
    }
  };

  const handleDeletePurchase = (id: string) => {
    const target = purchases.find((p) => p.id === id);
    const updated = purchases.filter((p) => p.id !== id);
    updatePurchasesList(updated);
    showToast(`Purchase "${target?.itemName || ''}" was deleted.`);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-sm font-medium text-white ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(v) => {
          if (v === 'import') {
            setIsImportModalOpen(true);
          } else {
            setCurrentView(v);
          }
        }}
        onOpenAddModal={() => {
          setEditingSale(null);
          setIsSalesModalOpen(true);
        }}
        onOpenAddExpenseModal={() => {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenAddPurchaseModal={() => {
          setEditingPurchase(null);
          setIsPurchaseModalOpen(true);
        }}
        onExportAll={handleExportAll}
        onResetData={handleResetData}
        totalRecordsCount={sales.length}
        totalExpensesCount={expenses.length}
        totalPurchasesCount={purchases.length}
      />

      {/* View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 mb-14 md:mb-0">
        {currentView === 'dashboard' && (
          <DashboardView
            sales={sales}
            expenses={expenses}
            purchases={purchases}
            onOpenAddSaleModal={() => {
              setEditingSale(null);
              setIsSalesModalOpen(true);
            }}
            onOpenAddExpenseModal={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenAddPurchaseModal={() => {
              setEditingPurchase(null);
              setIsPurchaseModalOpen(true);
            }}
            onEditSale={(sale) => {
              setEditingSale(sale);
              setIsSalesModalOpen(true);
            }}
            onNavigate={(view) => {
              if (view === 'import') {
                setIsImportModalOpen(true);
              } else {
                setCurrentView(view);
              }
            }}
          />
        )}

        {currentView === 'daily' && (
          <DailySalesView
            sales={sales}
            onOpenAddModal={() => {
              setEditingSale(null);
              setIsSalesModalOpen(true);
            }}
            onEditSale={(sale) => {
              setEditingSale(sale);
              setIsSalesModalOpen(true);
            }}
            onDeleteSale={(sale) => {
              setSaleToDelete(sale);
              setIsDeleteModalOpen(true);
            }}
          />
        )}

        {currentView === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            onOpenAddModal={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(expense) => {
              setEditingExpense(expense);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {currentView === 'purchases' && (
          <PurchasesView
            purchases={purchases}
            onOpenAddModal={() => {
              setEditingPurchase(null);
              setIsPurchaseModalOpen(true);
            }}
            onEditPurchase={(purchase) => {
              setEditingPurchase(purchase);
              setIsPurchaseModalOpen(true);
            }}
            onDeletePurchase={handleDeletePurchase}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView
            sales={sales}
            expenses={expenses}
            purchases={purchases}
          />
        )}
      </main>

      {/* Sales Modal */}
      <SalesModal
        isOpen={isSalesModalOpen}
        onClose={() => {
          setIsSalesModalOpen(false);
          setEditingSale(null);
        }}
        onSave={handleSaveSale}
        initialData={editingSale}
        existingDates={existingDatesMap}
      />

      {/* Expense Modal (Free text name input) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
      />

      {/* Purchase Modal (Free text name input) */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setEditingPurchase(null);
        }}
        onSave={handleSavePurchase}
        initialData={editingPurchase}
      />

      {/* Delete Sales Record Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSaleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        record={saleToDelete}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingSales={sales}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
