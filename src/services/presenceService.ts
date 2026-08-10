import {
  collection,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, logFirestoreError, OperationType } from '../firebase';
import { UserSession } from '../types';

export interface UserPresence {
  id: string;
  name: string;
  role: string;
  category: 'admin' | 'petugas';
  status: 'online' | 'offline';
  lastSeen: string; // ISO String
  loginTime: string;
}

const PRESENCE_COLLECTION = 'user_presence';

/**
 * Update user status to online in Firestore
 */
export async function setUserOnline(user: UserSession): Promise<void> {
  if (!user || !user.id) return;
  const docRef = doc(db, PRESENCE_COLLECTION, user.id);
  const nowIso = new Date().toISOString();
  
  const presenceData: UserPresence = {
    id: user.id,
    name: user.name,
    role: user.role || 'Petugas',
    category: user.category || 'petugas',
    status: 'online',
    lastSeen: nowIso,
    loginTime: user.loginTime || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };

  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(presenceData)), { merge: true });
  } catch (error) {
    console.warn('Failed to update user presence online in Firestore:', error);
    logFirestoreError(error, OperationType.WRITE, `${PRESENCE_COLLECTION}/${user.id}`);
  }
}

/**
 * Update user status to offline in Firestore
 */
export async function setUserOffline(userId: string): Promise<void> {
  if (!userId) return;
  const docRef = doc(db, PRESENCE_COLLECTION, userId);
  const nowIso = new Date().toISOString();

  try {
    await setDoc(docRef, { status: 'offline', lastSeen: nowIso }, { merge: true });
  } catch (error) {
    console.warn('Failed to update user presence offline in Firestore:', error);
    logFirestoreError(error, OperationType.UPDATE, `${PRESENCE_COLLECTION}/${userId}`);
  }
}

/**
 * Real-time subscription to user presence data
 */
export function subscribeUserPresence(
  onSuccess: (data: UserPresence[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, PRESENCE_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: UserPresence[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as UserPresence;
        items.push({
          ...d,
          id: docSnap.id,
        });
      });
      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for user presence:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, PRESENCE_COLLECTION);
    }
  );
}
