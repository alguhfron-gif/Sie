import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Nomination } from '../types';

const COLLECTION_NAME = 'nominations';

/**
 * Test initial server connection to Firestore
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firestore client appears offline or misconfigured.");
    }
    return false;
  }
}

/**
 * Subscribe to real-time changes in the 'nominations' collection in Firestore.
 */
export function subscribeNominations(
  onSuccess: (data: Nomination[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, COLLECTION_NAME);
  
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Nomination[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Nomination, 'id'>;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort by createdAt descending or fallback
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onSuccess(items);
    },
    (error) => {
      console.error("Firestore onSnapshot error for nominations:", error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      } catch (e) {
        // Logged structured error
      }
    }
  );
}

/**
 * Add a new candidate/nomination to Firestore.
 */
export async function addNominationToFirestore(
  newNom: Omit<Nomination, 'id' | 'createdAt'>
): Promise<Nomination> {
  const docId = `nom-${Date.now()}`;
  const createdAt = new Date().toISOString().split('T')[0];
  
  const created: Nomination = {
    ...newNom,
    id: docId,
    createdAt,
  };

  const docRef = doc(db, COLLECTION_NAME, docId);
  try {
    await setDoc(docRef, created);
    return created;
  } catch (error) {
    console.error("Failed to add nomination to Firestore:", error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${docId}`);
    } catch (e) {
      // rethrow or pass along
    }
    throw error;
  }
}

/**
 * Update an existing candidate/nomination in Firestore.
 */
export async function updateNominationInFirestore(updatedNom: Nomination): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, updatedNom.id);
  try {
    await setDoc(docRef, updatedNom, { merge: true });
  } catch (error) {
    console.error("Failed to update nomination in Firestore:", error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${updatedNom.id}`);
    } catch (e) {
      // rethrow
    }
    throw error;
  }
}

/**
 * Delete a candidate/nomination from Firestore.
 */
export async function deleteNominationFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed to delete nomination from Firestore:", error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    } catch (e) {
      // rethrow
    }
    throw error;
  }
}
