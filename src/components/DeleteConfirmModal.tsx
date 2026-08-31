import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { SalesRecord } from '../types';
import { formatDateWithDay, formatINR } from '../utils/formatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  record: SalesRecord | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  record,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-center text-slate-900 mb-2">
            Delete Sales Record?
          </h3>

          <p className="text-sm text-slate-600 text-center mb-5">
            Are you sure you want to permanently delete the sales record for{' '}
            <span className="font-semibold text-slate-900">
              {formatDateWithDay(record.date)}
            </span>{' '}
            with total sales of{' '}
            <span className="font-bold text-emerald-700">
              {formatINR(record.total)}
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors w-full"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-delete"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 w-full"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
