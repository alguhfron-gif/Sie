import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, logFirestoreError, handleFirestoreError, OperationType } from '../firebase';
import { OfficialDocument, RegulationRule } from '../types';
import { INITIAL_DOCUMENTS, INITIAL_REGULATIONS } from '../data/initialData';

const DOCUMENTS_COLLECTION = 'official_documents';
const REGULATIONS_COLLECTION = 'regulations';

// ============================================================================
// OFFICIAL DOCUMENTS Real-time Firestore Sync
// ============================================================================
export function subscribeOfficialDocuments(
  onSuccess: (data: OfficialDocument[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, DOCUMENTS_COLLECTION);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const initDoc of INITIAL_DOCUMENTS) {
            const docRef = doc(db, DOCUMENTS_COLLECTION, initDoc.id);
            await setDoc(docRef, initDoc);
          }
        } catch (e) {
          console.warn('Failed to seed initial official documents to Firestore:', e);
        }
        onSuccess(INITIAL_DOCUMENTS);
        return;
      }

      const items: OfficialDocument[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Omit<OfficialDocument, 'id'>),
          id: docSnap.id,
        });
      });

      // Sort by date descending
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for official documents:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, DOCUMENTS_COLLECTION);
    }
  );
}

export async function addOfficialDocumentToFirestore(
  newDoc: Omit<OfficialDocument, 'id'>
): Promise<OfficialDocument> {
  const docId = `doc-${Date.now()}`;
  const created: OfficialDocument = {
    ...newDoc,
    id: docId,
  };

  const docRef = doc(db, DOCUMENTS_COLLECTION, docId);
  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add official document to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${DOCUMENTS_COLLECTION}/${docId}`);
    } catch (e) {}
    throw error;
  }
}

export async function updateOfficialDocumentInFirestore(
  updatedDoc: OfficialDocument
): Promise<void> {
  const docRef = doc(db, DOCUMENTS_COLLECTION, updatedDoc.id);
  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(updatedDoc)), { merge: true });
  } catch (error) {
    console.error('Failed to update official document in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${DOCUMENTS_COLLECTION}/${updatedDoc.id}`);
    } catch (e) {}
    throw error;
  }
}

export async function deleteOfficialDocumentFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, DOCUMENTS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete official document from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${DOCUMENTS_COLLECTION}/${id}`);
    } catch (e) {}
    throw error;
  }
}

// ============================================================================
// REGULATIONS RULES Real-time Firestore Sync
// ============================================================================
export function subscribeRegulations(
  onSuccess: (data: RegulationRule[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, REGULATIONS_COLLECTION);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const initReg of INITIAL_REGULATIONS) {
            const docRef = doc(db, REGULATIONS_COLLECTION, initReg.id);
            await setDoc(docRef, initReg);
          }
        } catch (e) {
          console.warn('Failed to seed initial regulations to Firestore:', e);
        }
        onSuccess(INITIAL_REGULATIONS);
        return;
      }

      const items: RegulationRule[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Omit<RegulationRule, 'id'>),
          id: docSnap.id,
        });
      });

      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for regulations:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, REGULATIONS_COLLECTION);
    }
  );
}

export async function addRegulationToFirestore(
  newReg: Omit<RegulationRule, 'id'>
): Promise<RegulationRule> {
  const docId = `reg-${Date.now()}`;
  const created: RegulationRule = {
    ...newReg,
    id: docId,
  };

  const docRef = doc(db, REGULATIONS_COLLECTION, docId);
  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add regulation to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${REGULATIONS_COLLECTION}/${docId}`);
    } catch (e) {}
    throw error;
  }
}

export async function updateRegulationInFirestore(
  updatedReg: RegulationRule
): Promise<void> {
  const docRef = doc(db, REGULATIONS_COLLECTION, updatedReg.id);
  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(updatedReg)), { merge: true });
  } catch (error) {
    console.error('Failed to update regulation in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${REGULATIONS_COLLECTION}/${updatedReg.id}`);
    } catch (e) {}
    throw error;
  }
}

export async function deleteRegulationFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, REGULATIONS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete regulation from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${REGULATIONS_COLLECTION}/${id}`);
    } catch (e) {}
    throw error;
  }
}
