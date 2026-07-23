import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction } from '../types';
import { INITIAL_TRANSACTIONS } from '../data/initialData';

const COLLECTION_NAME = 'transactions';

/**
 * Subscribe to real-time updates in the 'transactions' collection in Firestore.
 * If the collection is completely empty, populates initial default transactions.
 */
export function subscribeTransactions(
  onSuccess: (data: Transaction[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, COLLECTION_NAME);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial transaction data to Firestore if completely empty
        try {
          for (const initTrx of INITIAL_TRANSACTIONS) {
            const docRef = doc(db, COLLECTION_NAME, initTrx.id);
            await setDoc(docRef, initTrx);
          }
        } catch (e) {
          console.warn('Failed to seed initial transactions to Firestore:', e);
        }
        onSuccess(INITIAL_TRANSACTIONS);
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
      console.error('Firestore onSnapshot error for transactions:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      } catch (e) {
        // Handled or logged
      }
    }
  );
}

/**
 * Add a new financial transaction to Firestore.
 */
export async function addTransactionToFirestore(
  newTrx: Omit<Transaction, 'id'>
): Promise<Transaction> {
  const docId = `trx-${Date.now()}`;
  const created: Transaction = {
    ...newTrx,
    id: docId,
  };

  // Clean undefined fields for Firestore
  const firestoreData = JSON.parse(JSON.stringify(created));

  const docRef = doc(db, COLLECTION_NAME, docId);
  try {
    await setDoc(docRef, firestoreData);
    return created;
  } catch (error) {
    console.error('Failed to add transaction to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${docId}`);
    } catch (e) {
      // rethrow
    }
    throw error;
  }
}

/**
 * Update an existing financial transaction in Firestore.
 */
export async function updateTransactionInFirestore(updatedTrx: Transaction): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, updatedTrx.id);
  const firestoreData = JSON.parse(JSON.stringify(updatedTrx));

  try {
    await setDoc(docRef, firestoreData, { merge: true });
  } catch (error) {
    console.error('Failed to update transaction in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${updatedTrx.id}`);
    } catch (e) {
      // rethrow
    }
    throw error;
  }
}

/**
 * Delete a financial transaction from Firestore.
 */
export async function deleteTransactionFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete transaction from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    } catch (e) {
      // rethrow
    }
    throw error;
  }
}
