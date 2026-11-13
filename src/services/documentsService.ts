import {
  collection,
  doc,
} from 'firebase/firestore';
import {
  db,
  resilientOnSnapshot,
  isFirestoreWatchHealthy,
  resilientSetDoc,
  resilientDeleteDoc,
  logFirestoreError,
  handleFirestoreError,
  OperationType,
} from '../firebase';
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

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onSuccess(INITIAL_DOCUMENTS);
        if (!snapshot.metadata?.fromCache && isFirestoreWatchHealthy()) {
          void Promise.all(
            INITIAL_DOCUMENTS.map((initDoc) =>
              resilientSetDoc(doc(db, DOCUMENTS_COLLECTION, initDoc.id), initDoc)
            )
          ).catch((e) => console.warn('Failed to seed initial official documents to Firestore:', e));
        }
        return;
      }

      const items: OfficialDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {};
        items.push({
          id: docSnap.id,
          docNumber: data.docNumber || '000/PENG/2026',
          title: data.title || 'Dokumen Resmi',
          category: data.category || 'Surat Edaran',
          date: data.date || new Date().toISOString().split('T')[0],
          sender: data.sender || 'Panitia Sie Penganugerahan',
          content: data.content || '',
          status: data.status || 'Diterbitkan',
          fileUrl: data.fileUrl,
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
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add official document to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${DOCUMENTS_COLLECTION}/${docId}`);
    } catch {}
    throw error;
  }
}

export async function updateOfficialDocumentInFirestore(
  updatedDoc: OfficialDocument
): Promise<void> {
  const docRef = doc(db, DOCUMENTS_COLLECTION, updatedDoc.id);
  try {
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(updatedDoc)), { merge: true });
  } catch (error) {
    console.error('Failed to update official document in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${DOCUMENTS_COLLECTION}/${updatedDoc.id}`);
    } catch {}
    throw error;
  }
}

export async function deleteOfficialDocumentFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, DOCUMENTS_COLLECTION, id);
  try {
    await resilientDeleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete official document from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${DOCUMENTS_COLLECTION}/${id}`);
    } catch {}
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

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onSuccess(INITIAL_REGULATIONS);
        if (!snapshot.metadata?.fromCache && isFirestoreWatchHealthy()) {
          void Promise.all(
            INITIAL_REGULATIONS.map((initReg) =>
              resilientSetDoc(doc(db, REGULATIONS_COLLECTION, initReg.id), initReg)
            )
          ).catch((e) => console.warn('Failed to seed initial regulations to Firestore:', e));
        }
        return;
      }

      const items: RegulationRule[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const points = Array.isArray(data.points)
          ? data.points
          : typeof data.points === 'string'
          ? data.points.split('\n')
          : [];

        items.push({
          id: docSnap.id,
          section: data.section || 'Ketentuan Umum',
          title: data.title || 'Ketentuan',
          description: data.description || '',
          points: points.map((p: any) => String(p || '')).filter((p: string) => p.trim().length > 0),
          lastUpdated: data.lastUpdated || new Date().toISOString().split('T')[0],
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
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add regulation to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${REGULATIONS_COLLECTION}/${docId}`);
    } catch {}
    throw error;
  }
}

export async function updateRegulationInFirestore(
  updatedReg: RegulationRule
): Promise<void> {
  const docRef = doc(db, REGULATIONS_COLLECTION, updatedReg.id);
  try {
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(updatedReg)), { merge: true });
  } catch (error) {
    console.error('Failed to update regulation in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${REGULATIONS_COLLECTION}/${updatedReg.id}`);
    } catch {}
    throw error;
  }
}

export async function deleteRegulationFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, REGULATIONS_COLLECTION, id);
  try {
    await resilientDeleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete regulation from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${REGULATIONS_COLLECTION}/${id}`);
    } catch {}
    throw error;
  }
}
