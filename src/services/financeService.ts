import {
  collection,
  doc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import {
  db,
  resilientOnSnapshot,
  ensureFirestoreOnline,
  isFirestoreWatchHealthy,
  fetchSnapshotViaRest,
  resilientFirestoreWrite,
  resilientSetDoc,
  resilientDeleteDoc,
  logFirestoreError,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { Transaction, RapbItem } from '../types';
import { INITIAL_TRANSACTIONS } from '../data/initialData';

const TRANSACTIONS_COLLECTION = 'transactions';
const RAPB_COLLECTION = 'rapb_items';

/**
 * Strips undefined properties to ensure Firestore compatibility
 */
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/* ==========================================================================
   TRANSACTIONS (ARUS KAS KEUANGAN) FIRESTORE SERVICES
   ========================================================================== */

/**
 * Subscribe to real-time updates in the 'transactions' collection in Firestore.
 * If the collection is completely empty, populates initial default transactions.
 */
export function subscribeTransactions(
  onSuccess: (data: Transaction[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, TRANSACTIONS_COLLECTION);

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onSuccess(INITIAL_TRANSACTIONS);
        if (!snapshot.metadata?.fromCache && isFirestoreWatchHealthy()) {
          void Promise.all(
            INITIAL_TRANSACTIONS.map((initTrx) =>
              resilientSetDoc(doc(db, TRANSACTIONS_COLLECTION, initTrx.id), cleanForFirestore(initTrx))
            )
          ).catch((e) => console.warn('Failed to seed initial transactions to Firestore:', e));
        }
        return;
      }

      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Transaction, 'id'>;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });

      // Sort by date descending
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for transactions:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, TRANSACTIONS_COLLECTION);
    }
  );
}

/**
 * Add a new financial transaction to Firestore.
 * Saves date, title/uraian, posCode, qty, unit, amount/nominal, remainingBudget, and proofUrl.
 */
export async function addTransactionToFirestore(
  newTrx: Omit<Transaction, 'id'>
): Promise<Transaction> {
  const colRef = collection(db, TRANSACTIONS_COLLECTION);
  const newDocRef = doc(colRef);
  const docId = newDocRef.id;

  const payload = cleanForFirestore({
    date: newTrx.date || new Date().toISOString().split('T')[0],
    title: newTrx.title || '',
    category: newTrx.category || 'SEKSI PENGANUGERAHAN',
    type: newTrx.type || 'pengeluaran',
    amount: Number(newTrx.amount) || 0,
    posCode: newTrx.posCode || '',
    programName: newTrx.programName || '',
    qty: newTrx.qty !== undefined ? Number(newTrx.qty) : (newTrx.type === 'pengeluaran' ? 1 : undefined),
    unit: newTrx.unit || '',
    unitPrice: newTrx.unitPrice !== undefined ? Number(newTrx.unitPrice) : Number(newTrx.amount) || 0,
    remainingBudget: newTrx.remainingBudget !== undefined ? Number(newTrx.remainingBudget) : undefined,
    proofUrl: newTrx.proofUrl || '',
    receiptNumber: newTrx.receiptNumber || '',
    recipient: newTrx.recipient || '',
    notes: newTrx.notes || '',
    createdAt: new Date().toISOString(),
  });

  const created: Transaction = {
    ...(payload as any),
    id: docId,
  };

  try {
    await resilientSetDoc(newDocRef, payload);
    return created;
  } catch (error) {
    console.warn('Firestore setDoc notice, queued locally:', error);
    return created;
  }
}

/**
 * Update an existing financial transaction in Firestore.
 */
export async function updateTransactionInFirestore(updatedTrx: Transaction): Promise<void> {
  const docRef = doc(db, TRANSACTIONS_COLLECTION, updatedTrx.id);
  const firestoreData = cleanForFirestore(updatedTrx);

  try {
    await resilientSetDoc(docRef, firestoreData, { merge: true });
  } catch (error) {
    console.error('Failed to update transaction in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${TRANSACTIONS_COLLECTION}/${updatedTrx.id}`);
    } catch {}
    throw error;
  }
}

/**
 * Delete a financial transaction from Firestore.
 */
export async function deleteTransactionFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
  try {
    await resilientDeleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete transaction from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${TRANSACTIONS_COLLECTION}/${id}`);
    } catch {}
    throw error;
  }
}

/* ==========================================================================
   RAPB (RENCANA ANGGARAN & BELANJA) FIRESTORE SERVICES
   ========================================================================== */

/**
 * Subscribe to real-time updates for RAPB items in Firestore.
 * Automatically migrates existing localStorage RAPB items if Firestore is empty.
 */
export function subscribeRapbItems(
  onSuccess: (data: RapbItem[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, RAPB_COLLECTION);

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        try {
          const savedLocal = localStorage.getItem('sie_rapb_items');
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            if (Array.isArray(parsed) && parsed.length > 0) {
              onSuccess(parsed);
              if (!snapshot.metadata?.fromCache && isFirestoreWatchHealthy()) {
                void Promise.all(
                  parsed.map((item: RapbItem) => {
                    const id = item.id || `rapb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    const ref = doc(db, RAPB_COLLECTION, id);
                    return resilientSetDoc(ref, cleanForFirestore({ ...item, id }));
                  })
                ).catch((e) =>
                  console.warn('Migration of localStorage RAPB items to Firestore skipped:', e)
                );
              }
              return;
            }
          }
        } catch (e) {
          console.warn('Migration of localStorage RAPB items to Firestore skipped:', e);
        }

        onSuccess([]);
        return;
      }

      const items: RapbItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<RapbItem, 'id'>;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });

      // Sort by posCode ascending, then programName
      items.sort((a, b) => (a.posCode || '').localeCompare(b.posCode || '', undefined, { numeric: true }));

      // Also mirror to localStorage for offline cache
      try {
        localStorage.setItem('sie_rapb_items', JSON.stringify(items));
      } catch {}

      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for rapb_items:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, RAPB_COLLECTION);
    }
  );
}

/**
 * Add a new RAPB item to Firestore.
 */
export async function addRapbItemToFirestore(
  item: Omit<RapbItem, 'id'> | RapbItem
): Promise<RapbItem> {
  const docId = 'id' in item && item.id ? item.id : `rapb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const created: RapbItem = {
    ...item,
    id: docId,
  };

  const firestoreData = cleanForFirestore(created);
  const docRef = doc(db, RAPB_COLLECTION, docId);

  try {
    await resilientSetDoc(docRef, firestoreData);
    return created;
  } catch (error) {
    console.error('Failed to add RAPB item to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${RAPB_COLLECTION}/${docId}`);
    } catch {}
    throw error;
  }
}

/**
 * Update an existing RAPB item in Firestore.
 */
export async function updateRapbItemInFirestore(updatedItem: RapbItem): Promise<void> {
  const docRef = doc(db, RAPB_COLLECTION, updatedItem.id);
  const firestoreData = cleanForFirestore(updatedItem);

  try {
    await resilientSetDoc(docRef, firestoreData, { merge: true });
  } catch (error) {
    console.error('Failed to update RAPB item in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${RAPB_COLLECTION}/${updatedItem.id}`);
    } catch {}
    throw error;
  }
}

/**
 * Delete a single RAPB item from Firestore.
 */
export async function deleteRapbItemFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, RAPB_COLLECTION, id);
  try {
    await resilientDeleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete RAPB item from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${RAPB_COLLECTION}/${id}`);
    } catch {}
    throw error;
  }
}

/**
 * Bulk add or import RAPB items to Firestore using batch operations (handles 500 item batches safely).
 */
export async function bulkAddRapbItemsToFirestore(items: RapbItem[]): Promise<void> {
  if (!items || items.length === 0) return;

  const BATCH_SIZE = 450;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const prepared = chunk.map((item) => {
      const docId = item.id || `rapb-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      return {
        docRef: doc(db, RAPB_COLLECTION, docId),
        data: cleanForFirestore({ ...item, id: docId }),
      };
    });

    try {
      if (isFirestoreWatchHealthy()) {
        const batch = writeBatch(db);
        prepared.forEach(({ docRef, data }) => batch.set(docRef, data));
        await resilientFirestoreWrite(() => batch.commit(), 5000);
      } else {
        await Promise.all(prepared.map(({ docRef, data }) => resilientSetDoc(docRef, data)));
      }
    } catch (error) {
      try {
        await Promise.all(prepared.map(({ docRef, data }) => resilientSetDoc(docRef, data)));
      } catch (fallbackErr) {
        console.error('Failed to commit bulk RAPB batch to Firestore:', fallbackErr);
        try {
          handleFirestoreError(fallbackErr, OperationType.WRITE, RAPB_COLLECTION);
        } catch {}
        throw fallbackErr;
      }
    }
  }
}

/**
 * Clear all RAPB items in Firestore.
 */
export async function clearAllRapbItemsFromFirestore(): Promise<void> {
  try {
    if (!(await ensureFirestoreOnline())) {
      return;
    }
    const colRef = collection(db, RAPB_COLLECTION);
    const snapshot = isFirestoreWatchHealthy()
      ? await getDocs(colRef).catch(() => fetchSnapshotViaRest(colRef))
      : await fetchSnapshotViaRest(colRef);
    if (!snapshot || snapshot.empty) return;

    const BATCH_SIZE = 450;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const chunk = docs.slice(i, i + BATCH_SIZE);
      const refs = chunk.map((d: any) => d.ref || doc(db, RAPB_COLLECTION, d.id));
      try {
        if (isFirestoreWatchHealthy()) {
          const batch = writeBatch(db);
          refs.forEach((ref: any) => batch.delete(ref));
          await resilientFirestoreWrite(() => batch.commit(), 5000);
        } else {
          await Promise.all(refs.map((ref: any) => resilientDeleteDoc(ref)));
        }
      } catch {
        await Promise.all(refs.map((ref: any) => resilientDeleteDoc(ref)));
      }
    }
  } catch (error) {
    console.error('Failed to clear all RAPB items from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, RAPB_COLLECTION);
    } catch {}
    throw error;
  }
}

