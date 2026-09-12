import React, { useState, useEffect, useMemo } from 'react';
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
  getStoredExpenses,
  saveStoredExpenses,
  getStoredPurchases,
  saveStoredPurchases,
} from './utils/storage';
import {
  subscribeToSales,
  subscribeToExpenses,
  subscribeToPurchases,
  saveSaleToFirestore,
  deleteSaleFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  savePurchaseToFirestore,
  deletePurchaseFromFirestore,
  seedSalesBatch,
  resetSalesToPdfInFirestore,
} from './utils/firebaseService';
import { exportComprehensiveReportToExcel } from './utils/excelHelper';
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
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

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
  // Real-time Firestore Subscriptions
  // ----------------------------------------------------
  useEffect(() => {
    setSyncStatus('syncing');

    const unsubSales = subscribeToSales(
      (records) => {
        setSales(records);
        setSyncStatus('synced');
      },
      () => {
        setSyncStatus('offline');
      }
    );

    const unsubExpenses = subscribeToExpenses(
      (records) => {
        setExpenses(records);
      },
      () => {
        setSyncStatus('offline');
      }
    );

    const unsubPurchases = subscribeToPurchases(
      (records) => {
        setPurchases(records);
      },
      () => {
        setSyncStatus('offline');
      }
    );

    return () => {
      unsubSales();
      unsubExpenses();
      unsubPurchases();
    };
  }, []);

  // ----------------------------------------------------
  // Sales Handlers
  // ----------------------------------------------------
  const existingDatesMap = useMemo(() => {
    const map = new Map<string, SalesRecord>();
    sales.forEach((s) => map.set(s.date, s));
    return map;
  }, [sales]);

  const handleSaveSale = async (
    data: Omit<SalesRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    // Requirement 1, 3, 4: NEVER create sales record when Cash <= 0 and Online <= 0
    if ((!data.cash || data.cash <= 0) && (!data.online || data.online <= 0)) {
      showToast('Sales record must have Cash or Online amount greater than 0.', 'error');
      return;
    }

    const now = new Date().toISOString();
    let recordToSave: SalesRecord;

    if (existingId) {
      const existing = sales.find((s) => s.id === existingId);
      recordToSave = {
        id: existingId,
        ...data,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      // Optimistic update
      const updated = sales.map((s) => (s.id === existingId ? recordToSave : s));
      setSales(updated);
      saveStoredSales(updated);
      showToast(`Sales entry for ${data.date} updated successfully!`);
    } else {
      const existingByDate = sales.find((s) => s.date === data.date);
      if (existingByDate) {
        recordToSave = {
          ...existingByDate,
          ...data,
          updatedAt: now,
        };
        const updated = sales.map((s) => (s.date === data.date ? recordToSave : s));
        setSales(updated);
        saveStoredSales(updated);
        showToast(`Sales entry for ${data.date} updated successfully!`);
      } else {
        recordToSave = {
          id: `rec_${data.date}_${Date.now()}`,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [recordToSave, ...sales];
        setSales(updated);
        saveStoredSales(updated);
        showToast(`Daily sale for ${data.date} saved successfully!`);
      }
    }

    try {
      await saveSaleToFirestore(recordToSave);
    } catch (err) {
      console.error('Failed to sync sale to Firestore:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;
    const target = saleToDelete;
    const filtered = sales.filter((s) => s.id !== target.id);
    setSales(filtered);
    saveStoredSales(filtered);
    showToast(`Sales record for ${target.date} was deleted.`);
    setSaleToDelete(null);

    try {
      await deleteSaleFromFirestore(target.id);
    } catch (err) {
      console.error('Failed to delete sale from Firestore:', err);
    }
  };

  const handleImportComplete = async (importedRecords: SalesRecord[], mode: DuplicateAction) => {
    // Filter out any invalid/zero sales records
    const validImported = importedRecords.filter((r) => r.cash > 0 || r.online > 0);
    if (validImported.length === 0) {
      showToast('No valid sales records found to import.', 'error');
      return;
    }

    const map = new Map<string, SalesRecord>();

    if (mode === 'skip') {
      sales.forEach((s) => map.set(s.date, s));
      let addedCount = 0;
      const toAdd: SalesRecord[] = [];
      validImported.forEach((r) => {
        if (!map.has(r.date)) {
          map.set(r.date, r);
          toAdd.push(r);
          addedCount++;
        }
      });
      const combined = Array.from(map.values());
      setSales(combined);
      saveStoredSales(combined);
      showToast(`Successfully imported ${addedCount} new sales records!`);

      if (toAdd.length > 0) {
        seedSalesBatch(toAdd).catch(console.error);
      }
    } else {
      sales.forEach((s) => map.set(s.date, s));
      validImported.forEach((r) => {
        map.set(r.date, r);
      });
      const combined = Array.from(map.values());
      setSales(combined);
      saveStoredSales(combined);
      showToast(`Successfully imported & updated ${validImported.length} records!`);

      seedSalesBatch(validImported).catch(console.error);
    }

    setCurrentView('daily');
  };

  const handleResetData = async () => {
    try {
      const records = await resetSalesToPdfInFirestore();
      setSales(records);
      showToast(`Reset to complete ${records.length} records in Firestore database.`);
    } catch (err) {
      console.error('Failed to reset Firestore sales:', err);
      showToast('Error resetting database', 'error');
    }
  };

  const handleExportAll = () => {
    exportComprehensiveReportToExcel(sales, purchases, expenses);
    showToast('Exported complete financials (Sales, Purchases, Expenses) to Excel!');
  };

  // ----------------------------------------------------
  // Expense Handlers
  // ----------------------------------------------------
  const handleSaveExpense = async (
    data: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    let recordToSave: ExpenseRecord;

    if (existingId) {
      const existing = expenses.find((e) => e.id === existingId);
      recordToSave = {
        id: existingId,
        ...data,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      const updated = expenses.map((e) => (e.id === existingId ? recordToSave : e));
      setExpenses(updated);
      saveStoredExpenses(updated);
      showToast(`Expense "${data.title}" updated successfully!`);
    } else {
      recordToSave = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [recordToSave, ...expenses];
      setExpenses(updated);
      saveStoredExpenses(updated);
      showToast(`Expense "${data.title}" added successfully!`);
    }

    try {
      await saveExpenseToFirestore(recordToSave);
    } catch (err) {
      console.error('Failed to sync expense to Firestore:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const target = expenses.find((e) => e.id === id);
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveStoredExpenses(updated);
    showToast(`Expense "${target?.title || ''}" was deleted.`);

    try {
      await deleteExpenseFromFirestore(id);
    } catch (err) {
      console.error('Failed to delete expense from Firestore:', err);
    }
  };

  // ----------------------------------------------------
  // Purchase Handlers
  // ----------------------------------------------------
  const handleSavePurchase = async (
    data: Omit<PurchaseRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    let recordToSave: PurchaseRecord;

    if (existingId) {
      const existing = purchases.find((p) => p.id === existingId);
      recordToSave = {
        id: existingId,
        ...data,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      const updated = purchases.map((p) => (p.id === existingId ? recordToSave : p));
      setPurchases(updated);
      saveStoredPurchases(updated);
      showToast(`Purchase "${data.title}" updated successfully!`);
    } else {
      recordToSave = {
        id: `pur_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [recordToSave, ...purchases];
      setPurchases(updated);
      saveStoredPurchases(updated);
      showToast(`Purchase "${data.title}" logged successfully!`);
    }

    try {
      await savePurchaseToFirestore(recordToSave);
    } catch (err) {
      console.error('Failed to sync purchase to Firestore:', err);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    const target = purchases.find((p) => p.id === id);
    const updated = purchases.filter((p) => p.id !== id);
    setPurchases(updated);
    saveStoredPurchases(updated);
    showToast(`Purchase "${target?.title || ''}" was deleted.`);

    try {
      await deletePurchaseFromFirestore(id);
    } catch (err) {
      console.error('Failed to delete purchase from Firestore:', err);
    }
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
        onExportAll={handleExportAll}
        onResetData={handleResetData}
        totalRecordsCount={sales.length}
        totalExpensesCount={expenses.length}
        totalPurchasesCount={purchases.length}
        syncStatus={syncStatus}
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
