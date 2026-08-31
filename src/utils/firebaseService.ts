import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ExpenseRecord, PurchaseRecord, SalesRecord } from '../types';
import { getInitialPdfSales } from '../data/initialSales';
import {
  getStoredSales,
  saveStoredSales,
  getStoredExpenses,
  saveStoredExpenses,
  getStoredPurchases,
  saveStoredPurchases,
} from './storage';

const SALES_COLLECTION = 'sales';
const EXPENSES_COLLECTION = 'expenses';
const PURCHASES_COLLECTION = 'purchases';

// ==========================================
// SALES SYNC
// ==========================================

export function subscribeToSales(
  onUpdate: (records: SalesRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const q = query(collection(db, SALES_COLLECTION), orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is completely empty, we can check if local storage has data or seed from PDF
          const local = getStoredSales();
          if (local.length > 0) {
            // Seed to firestore in background
            seedSalesBatch(local).catch(console.error);
            onUpdate(local);
          } else {
            const initial = getInitialPdfSales();
            seedSalesBatch(initial).catch(console.error);
            onUpdate(initial);
          }
          return;
        }

        const items: SalesRecord[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as SalesRecord);
        });

        // Ensure sorted by date desc
        items.sort((a, b) => b.date.localeCompare(a.date));
        // Cache to localStorage for instant offline access
        saveStoredSales(items);
        onUpdate(items);
      },
      (error) => {
        console.error('Firestore sales subscription error:', error);
        onError?.(error);
        // Fallback to local storage
        onUpdate(getStoredSales());
      }
    );
  } catch (err: any) {
    console.error('Error starting sales listener:', err);
    onError?.(err);
    onUpdate(getStoredSales());
    return () => {};
  }
}

export async function saveSaleToFirestore(record: SalesRecord): Promise<void> {
  try {
    const docRef = doc(db, SALES_COLLECTION, record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    console.error('Failed to save sale to Firestore:', error);
    throw error;
  }
}

export async function deleteSaleFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, SALES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete sale from Firestore:', error);
    throw error;
  }
}

export async function seedSalesBatch(records: SalesRecord[]): Promise<void> {
  // Split into chunks of 400 (Firestore max is 500)
  const chunkSize = 400;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const item of chunk) {
      const docRef = doc(db, SALES_COLLECTION, item.id);
      batch.set(docRef, item, { merge: true });
    }
    await batch.commit();
  }
}

export async function resetSalesToPdfInFirestore(): Promise<SalesRecord[]> {
  const initial = getInitialPdfSales();
  // Clear old docs or overwrite with initial
  await seedSalesBatch(initial);
  saveStoredSales(initial);
  return initial;
}

// ==========================================
// EXPENSES SYNC
// ==========================================

export function subscribeToExpenses(
  onUpdate: (records: ExpenseRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const q = query(collection(db, EXPENSES_COLLECTION), orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: ExpenseRecord[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ExpenseRecord);
        });

        items.sort((a, b) => b.date.localeCompare(a.date));
        saveStoredExpenses(items);
        onUpdate(items);
      },
      (error) => {
        console.error('Firestore expenses subscription error:', error);
        onError?.(error);
        onUpdate(getStoredExpenses());
      }
    );
  } catch (err: any) {
    console.error('Error starting expenses listener:', err);
    onError?.(err);
    onUpdate(getStoredExpenses());
    return () => {};
  }
}

export async function saveExpenseToFirestore(record: ExpenseRecord): Promise<void> {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    console.error('Failed to save expense to Firestore:', error);
    throw error;
  }
}

export async function deleteExpenseFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete expense from Firestore:', error);
    throw error;
  }
}

// ==========================================
// PURCHASES SYNC
// ==========================================

export function subscribeToPurchases(
  onUpdate: (records: PurchaseRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const q = query(collection(db, PURCHASES_COLLECTION), orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: PurchaseRecord[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as PurchaseRecord);
        });

        items.sort((a, b) => b.date.localeCompare(a.date));
        saveStoredPurchases(items);
        onUpdate(items);
      },
      (error) => {
        console.error('Firestore purchases subscription error:', error);
        onError?.(error);
        onUpdate(getStoredPurchases());
      }
    );
  } catch (err: any) {
    console.error('Error starting purchases listener:', err);
    onError?.(err);
    onUpdate(getStoredPurchases());
    return () => {};
  }
}

export async function savePurchaseToFirestore(record: PurchaseRecord): Promise<void> {
  try {
    const docRef = doc(db, PURCHASES_COLLECTION, record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    console.error('Failed to save purchase to Firestore:', error);
    throw error;
  }
}

export async function deletePurchaseFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, PURCHASES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete purchase from Firestore:', error);
    throw error;
  }
}
