import React, { useState, useEffect, useMemo } from 'react';
import {
  DuplicateAction,
  SalesRecord,
  ViewMode,
} from './types';
import {
  getStoredSales,
  saveStoredSales,
  resetToPdfData,
} from './utils/storage';
import { exportSalesToExcel } from './utils/excelHelper';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DailySalesView } from './components/DailySalesView';
import { ReportsView } from './components/ReportsView';
import { SalesModal } from './components/SalesModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [sales, setSales] = useState<SalesRecord[]>(() => getStoredSales());
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Modals
  const [isSalesModalOpen, setIsSalesModalOpen] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<SalesRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [saleToDelete, setSaleToDelete] = useState<SalesRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Save to localStorage whenever sales changes
  const updateSalesList = (newSales: SalesRecord[]) => {
    setSales(newSales);
    saveStoredSales(newSales);
  };

  // Quick Map of existing dates for O(1) duplicate lookups
  const existingDatesMap = useMemo(() => {
    const map = new Map<string, SalesRecord>();
    sales.forEach((s) => map.set(s.date, s));
    return map;
  }, [sales]);

  // Handle Save / Edit Sale
  const handleSaveSale = (
    data: Omit<SalesRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();

    if (existingId) {
      // Update existing
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
      // Check if date already exists in list (safety check)
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

  // Handle Delete Sale
  const handleConfirmDelete = () => {
    if (!saleToDelete) return;
    const filtered = sales.filter((s) => s.id !== saleToDelete.id);
    updateSalesList(filtered);
    showToast(`Sales record for ${saleToDelete.date} was deleted.`);
    setSaleToDelete(null);
  };

  // Handle Excel Import
  const handleImportComplete = (importedRecords: SalesRecord[], mode: DuplicateAction) => {
    const map = new Map<string, SalesRecord>();

    if (mode === 'skip') {
      // Existing records take precedence
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
      // Update mode: Existing first, then overwritten by imported
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

  // Reset to original PDF records
  const handleResetData = () => {
    const records = resetToPdfData();
    setSales(records);
    showToast(`Reset to complete ${records.length} records from the PDF ledger.`);
  };

  // Export all data
  const handleExportAll = () => {
    exportSalesToExcel(sales, `Pick_N_Eat_All_Sales_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Exported all sales records to Excel!');
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
              className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2"
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
        onExportAll={handleExportAll}
        onResetData={handleResetData}
        totalRecordsCount={sales.length}
      />

      {/* View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 mb-14 md:mb-0">
        {currentView === 'dashboard' && (
          <DashboardView
            sales={sales}
            onOpenAddModal={() => {
              setEditingSale(null);
              setIsSalesModalOpen(true);
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

        {currentView === 'reports' && <ReportsView sales={sales} />}
      </main>

      {/* Modals */}
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

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSaleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        record={saleToDelete}
      />

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingSales={sales}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
