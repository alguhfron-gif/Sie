import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db, logFirestoreError, handleFirestoreError, OperationType } from '../firebase';
import { Nomination } from '../types';
import { INITIAL_NOMINATIONS } from '../data/initialData';

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
 * If empty, seeds default INITIAL_NOMINATIONS to Firestore.
 */
export function subscribeNominations(
  onSuccess: (data: Nomination[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, COLLECTION_NAME);
  
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const initNom of INITIAL_NOMINATIONS) {
            const docRef = doc(db, COLLECTION_NAME, initNom.id);
            await setDoc(docRef, initNom);
          }
        } catch (e) {
          console.warn('Failed to seed initial nominations to Firestore:', e);
        }
        onSuccess(INITIAL_NOMINATIONS);
        return;
      }

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
      console.warn("Firestore onSnapshot notice for nominations:", error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, COLLECTION_NAME);
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

  const firestoreData = JSON.parse(JSON.stringify(created));
  const docRef = doc(db, COLLECTION_NAME, docId);
  try {
    await setDoc(docRef, firestoreData);
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
  const firestoreData = JSON.parse(JSON.stringify(updatedNom));
  try {
    await setDoc(docRef, firestoreData, { merge: true });
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
