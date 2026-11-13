import {
  collection,
  doc,
} from 'firebase/firestore';
import {
  db,
  resilientOnSnapshot,
  resilientSetDoc,
  resilientDeleteDoc,
  logFirestoreError,
  handleFirestoreError,
  OperationType,
} from '../firebase';

export interface CertificateRecord {
  id: string;
  recipientName: string;
  awardTitle: string;
  certNumber: string;
  issueDate: string;
  department?: string;
  generatedAt: string;
  signatory1?: string;
  signatory2?: string;
}

const CERTIFICATES_COLLECTION = 'certificates';

/**
 * Subscribe to real-time certificates log from Firestore
 */
export function subscribeCertificates(
  onSuccess: (data: CertificateRecord[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, CERTIFICATES_COLLECTION);

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      const items: CertificateRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Omit<CertificateRecord, 'id'>),
          id: docSnap.id,
        });
      });

      items.sort((a, b) => (b.generatedAt || '').localeCompare(a.generatedAt || ''));
      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for certificates:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, CERTIFICATES_COLLECTION);
    }
  );
}

/**
 * Log a newly generated certificate to Firestore
 */
export async function addCertificateRecordToFirestore(
  certData: Omit<CertificateRecord, 'id' | 'generatedAt'>
): Promise<CertificateRecord> {
  const docId = `cert-${Date.now()}`;
  const record: CertificateRecord = {
    ...certData,
    id: docId,
    generatedAt: new Date().toISOString(),
  };

  const docRef = doc(db, CERTIFICATES_COLLECTION, docId);
  try {
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(record)));
    return record;
  } catch (error) {
    console.error('Failed to log certificate record to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${CERTIFICATES_COLLECTION}/${docId}`);
    } catch {}
    throw error;
  }
}

/**
 * Delete a certificate record from Firestore
 */
export async function deleteCertificateRecordFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, CERTIFICATES_COLLECTION, id);
  try {
    await resilientDeleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete certificate record from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${CERTIFICATES_COLLECTION}/${id}`);
    } catch {}
    throw error;
  }
}
