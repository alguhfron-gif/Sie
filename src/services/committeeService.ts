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
import { CommitteeTask, InventoryItem, RundownItem, CommitteeAccount } from '../types';
import { INITIAL_TASKS, INITIAL_INVENTORY, INITIAL_RUNDOWN, INITIAL_ACCOUNTS } from '../data/initialData';

const TASKS_COLLECTION = 'committee_tasks';
const INVENTORY_COLLECTION = 'committee_inventory';
const RUNDOWN_COLLECTION = 'committee_rundown';
const ACCOUNTS_COLLECTION = 'committee_accounts';

// ============================================================================
// COMMITTEE TASKS (Tugas Panitia) Real-time Sync
// ============================================================================
export function subscribeCommitteeTasks(
  onSuccess: (data: CommitteeTask[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, TASKS_COLLECTION);

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onSuccess(INITIAL_TASKS);
        if (!snapshot.metadata?.fromCache && isFirestoreWatchHealthy()) {
          void Promise.all(
            INITIAL_TASKS.map((initTask) =>
              resilientSetDoc(doc(db, TASKS_COLLECTION, initTask.id), initTask)
            )
          ).catch((e) => console.warn('Failed to seed initial tasks to Firestore:', e));
        }
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
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add committee task to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${TASKS_COLLECTION}/${docId}`);
    } catch {}
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
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(updateData)), { merge: true });
  } catch (error) {
    console.error('Failed to update committee task in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${TASKS_COLLECTION}/${taskId}`);
    } catch {}
    throw error;
  }
}

export async function deleteCommitteeTaskFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  try {
    await resilientDeleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete committee task from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${TASKS_COLLECTION}/${id}`);
    } catch {}
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

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onSuccess(INITIAL_INVENTORY);
        if (!snapshot.metadata?.fromCache && isFirestoreWatchHealthy()) {
          void Promise.all(
            INITIAL_INVENTORY.map((initInv) =>
              resilientSetDoc(doc(db, INVENTORY_COLLECTION, initInv.id), initInv)
            )
          ).catch((e) => console.warn('Failed to seed initial inventory to Firestore:', e));
        }
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
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add inventory to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${INVENTORY_COLLECTION}/${docId}`);
    } catch {}
    throw error;
  }
}

export async function updateInventoryInFirestore(updatedInv: InventoryItem): Promise<void> {
  const docRef = doc(db, INVENTORY_COLLECTION, updatedInv.id);
  try {
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(updatedInv)), { merge: true });
  } catch (error) {
    console.error('Failed to update inventory in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${INVENTORY_COLLECTION}/${updatedInv.id}`);
    } catch {}
    throw error;
  }
}

export async function deleteInventoryFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, INVENTORY_COLLECTION, id);
  try {
    await resilientDeleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete inventory item from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${INVENTORY_COLLECTION}/${id}`);
    } catch {}
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

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onSuccess(INITIAL_RUNDOWN);
        if (!snapshot.metadata?.fromCache && isFirestoreWatchHealthy()) {
          void Promise.all(
            INITIAL_RUNDOWN.map((initRd) =>
              resilientSetDoc(doc(db, RUNDOWN_COLLECTION, initRd.id), initRd)
            )
          ).catch((e) => console.warn('Failed to seed initial rundown to Firestore:', e));
        }
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
    await Promise.all(
      updatedRundown.map((item) =>
        resilientSetDoc(doc(db, RUNDOWN_COLLECTION, item.id), JSON.parse(JSON.stringify(item)), { merge: true })
      )
    );
  } catch (error) {
    console.error('Failed to update rundown in Firestore:', error);
  }
}

// ============================================================================
// COMMITTEE ACCOUNTS (Kelola Akun Admin & Petugas) Real-time Sync
// ============================================================================
export function subscribeCommitteeAccounts(
  onSuccess: (data: CommitteeAccount[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, ACCOUNTS_COLLECTION);

  return resilientOnSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onSuccess(INITIAL_ACCOUNTS);
        if (!snapshot.metadata?.fromCache && isFirestoreWatchHealthy()) {
          void Promise.all(
            INITIAL_ACCOUNTS.map((initAcc) =>
              resilientSetDoc(doc(db, ACCOUNTS_COLLECTION, initAcc.id), initAcc)
            )
          ).catch((e) => console.warn('Failed to seed initial accounts to Firestore:', e));
        }
        return;
      }

      const items: CommitteeAccount[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Omit<CommitteeAccount, 'id'>),
          id: docSnap.id,
        });
      });

      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for accounts:', error);
      if (onError) onError(error);
      logFirestoreError(error, OperationType.GET, ACCOUNTS_COLLECTION);
    }
  );
}

export async function addCommitteeAccountToFirestore(
  newAcc: Omit<CommitteeAccount, 'id'>
): Promise<CommitteeAccount> {
  const docId = `acc-${Date.now()}`;
  const created: CommitteeAccount = {
    ...newAcc,
    id: docId,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const docRef = doc(db, ACCOUNTS_COLLECTION, docId);
  try {
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(created)));
    return created;
  } catch (error) {
    console.error('Failed to add committee account to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${ACCOUNTS_COLLECTION}/${docId}`);
    } catch {}
    throw error;
  }
}

export async function updateCommitteeAccountInFirestore(
  updatedAcc: CommitteeAccount
): Promise<void> {
  const docRef = doc(db, ACCOUNTS_COLLECTION, updatedAcc.id);
  try {
    await resilientSetDoc(docRef, JSON.parse(JSON.stringify(updatedAcc)), { merge: true });
  } catch (error) {
    console.error('Failed to update committee account in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${ACCOUNTS_COLLECTION}/${updatedAcc.id}`);
    } catch {}
    throw error;
  }
}

export async function deleteCommitteeAccountFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, ACCOUNTS_COLLECTION, id);
  try {
    await resilientDeleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete committee account from Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${ACCOUNTS_COLLECTION}/${id}`);
    } catch {}
    throw error;
  }
}
