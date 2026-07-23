import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, logFirestoreError, handleFirestoreError, OperationType } from '../firebase';
import { CommitteeTask, InventoryItem, RundownItem } from '../types';
import { INITIAL_TASKS, INITIAL_INVENTORY, INITIAL_RUNDOWN } from '../data/initialData';

const TASKS_COLLECTION = 'committee_tasks';
const INVENTORY_COLLECTION = 'committee_inventory';
const RUNDOWN_COLLECTION = 'committee_rundown';

// ============================================================================
// COMMITTEE TASKS (Tugas Panitia) Real-time Sync
// ============================================================================
export function subscribeCommitteeTasks(
  onSuccess: (data: CommitteeTask[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, TASKS_COLLECTION);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const initTask of INITIAL_TASKS) {
            const docRef = doc(db, TASKS_COLLECTION, initTask.id);
            await setDoc(docRef, initTask);
          }
        } catch (e) {
          console.warn('Failed to seed initial tasks to Firestore:', e);
        }
        onSuccess(INITIAL_TASKS);
        return;
      }

      const items: CommitteeTask[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Omit<CommitteeTask, 'id'>),
          id: docSnap.id,
        });
      });

      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for tasks:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, TASKS_COLLECTION);
    }
  );
}

export async function addCommitteeTaskToFirestore(
  newTask: Omit<CommitteeTask, 'id'>
): Promise<CommitteeTask> {
  const docId = `task-${Date.now()}`;
  const created: CommitteeTask = {
    ...newTask,
    id: docId,
  };

  const docRef = doc(db, TASKS_COLLECTION, docId);
  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add committee task to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${TASKS_COLLECTION}/${docId}`);
    } catch (e) {}
    throw error;
  }
}

export async function updateCommitteeTaskInFirestore(
  taskOrId: CommitteeTask | string,
  partial?: Partial<CommitteeTask>
): Promise<void> {
  const taskId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  const updateData = typeof taskOrId === 'string' ? partial || {} : taskOrId;
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(updateData)), { merge: true });
  } catch (error) {
    console.error('Failed to update committee task in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${TASKS_COLLECTION}/${taskId}`);
    } catch (e) {}
    throw error;
  }
}

export async function deleteCommitteeTaskFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete committee task from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${TASKS_COLLECTION}/${id}`);
    } catch (e) {}
    throw error;
  }
}

// ============================================================================
// INVENTORY (Logistik & Barang) Real-time Sync
// ============================================================================
export function subscribeInventory(
  onSuccess: (data: InventoryItem[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, INVENTORY_COLLECTION);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const initInv of INITIAL_INVENTORY) {
            const docRef = doc(db, INVENTORY_COLLECTION, initInv.id);
            await setDoc(docRef, initInv);
          }
        } catch (e) {
          console.warn('Failed to seed initial inventory to Firestore:', e);
        }
        onSuccess(INITIAL_INVENTORY);
        return;
      }

      const items: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Omit<InventoryItem, 'id'>),
          id: docSnap.id,
        });
      });

      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for inventory:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, INVENTORY_COLLECTION);
    }
  );
}

export async function addInventoryToFirestore(
  newInv: Omit<InventoryItem, 'id'>
): Promise<InventoryItem> {
  const docId = `inv-${Date.now()}`;
  const created: InventoryItem = {
    ...newInv,
    id: docId,
  };

  const docRef = doc(db, INVENTORY_COLLECTION, docId);
  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add inventory to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${INVENTORY_COLLECTION}/${docId}`);
    } catch (e) {}
    throw error;
  }
}

export async function updateInventoryInFirestore(updatedInv: InventoryItem): Promise<void> {
  const docRef = doc(db, INVENTORY_COLLECTION, updatedInv.id);
  try {
    await setDoc(docRef, JSON.parse(JSON.stringify(updatedInv)), { merge: true });
  } catch (error) {
    console.error('Failed to update inventory in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${INVENTORY_COLLECTION}/${updatedInv.id}`);
    } catch (e) {}
    throw error;
  }
}

export async function deleteInventoryFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, INVENTORY_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete inventory item from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${INVENTORY_COLLECTION}/${id}`);
    } catch (e) {}
    throw error;
  }
}

// ============================================================================
// RUNDOWN ACARA Real-time Sync
// ============================================================================
export function subscribeRundown(
  onSuccess: (data: RundownItem[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, RUNDOWN_COLLECTION);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const initRd of INITIAL_RUNDOWN) {
            const docRef = doc(db, RUNDOWN_COLLECTION, initRd.id);
            await setDoc(docRef, initRd);
          }
        } catch (e) {
          console.warn('Failed to seed initial rundown to Firestore:', e);
        }
        onSuccess(INITIAL_RUNDOWN);
        return;
      }

      const items: RundownItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Omit<RundownItem, 'id'>),
          id: docSnap.id,
        });
      });

      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for rundown:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, RUNDOWN_COLLECTION);
    }
  );
}

export async function updateRundownInFirestore(updatedRundown: RundownItem[]): Promise<void> {
  try {
    for (const item of updatedRundown) {
      const docRef = doc(db, RUNDOWN_COLLECTION, item.id);
      await setDoc(docRef, JSON.parse(JSON.stringify(item)), { merge: true });
    }
  } catch (error) {
    console.error('Failed to update rundown in Firestore:', error);
  }
}
