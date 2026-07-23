import React, { useState, useEffect } from 'react';
import { ActiveTab, AwardCategory, Nomination, Transaction, CommitteeTask, InventoryItem, RundownItem, TaskStatus, UserSession } from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_NOMINATIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_TASKS,
  INITIAL_INVENTORY,
  INITIAL_RUNDOWN,
} from './data/initialData';
import {
  subscribeNominations,
  addNominationToFirestore,
  updateNominationInFirestore,
  deleteNominationFromFirestore,
} from './services/nominationsService';
import { subscribeToAuthChanges, logoutFirebase } from './services/authService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { NominationsView } from './components/NominationsView';
import { FinanceView } from './components/FinanceView';
import { CoordinationView } from './components/CoordinationView';
import { CertificatesView } from './components/CertificatesView';
import { LoginView } from './components/LoginView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // User Authentication Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const savedSession = localStorage.getItem('sie_user_session');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error('Failed to parse saved user session', e);
      }
    }
    return null;
  });

  // Subscribe to Firebase Auth real-time state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseSession) => {
      if (firebaseSession) {
        setCurrentUser(firebaseSession);
        localStorage.setItem('sie_user_session', JSON.stringify(firebaseSession));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    localStorage.setItem('sie_user_session', JSON.stringify(user));
  };

  const handleLogout = async () => {
    await logoutFirebase();
    setCurrentUser(null);
    localStorage.removeItem('sie_user_session');
  };

  // LocalStorage helper initialization
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('sie_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [nominations, setNominations] = useState<Nomination[]>(() => {
    const saved = localStorage.getItem('sie_nominations');
    if (saved) {
      try {
        const parsed: Nomination[] = JSON.parse(saved);
        const filtered = parsed.filter((n) => n.candidateName.toLowerCase().includes('ghufron'));
        if (filtered.length > 0) return filtered;
      } catch (e) {
        console.error('Failed to parse saved nominations', e);
      }
    }
    return INITIAL_NOMINATIONS;
  });

  const [categories] = useState<AwardCategory[]>(() => {
    const saved = localStorage.getItem('sie_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [tasks, setTasks] = useState<CommitteeTask[]>(() => {
    const saved = localStorage.getItem('sie_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('sie_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [rundown] = useState<RundownItem[]>(() => {
    const saved = localStorage.getItem('sie_rundown');
    return saved ? JSON.parse(saved) : INITIAL_RUNDOWN;
  });

  // Direct modal trigger states
  const [openAddNominationDirectly, setOpenAddNominationDirectly] = useState(false);
  const [openAddTransactionDirectly, setOpenAddTransactionDirectly] = useState(false);

  // Subscribe to Cloud Firestore Nominations Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeNominations(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length > 0) {
          setNominations(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore synchronization notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('sie_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sie_nominations', JSON.stringify(nominations));
  }, [nominations]);

  useEffect(() => {
    localStorage.setItem('sie_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sie_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Reset Data Handler
  const handleResetData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setNominations(INITIAL_NOMINATIONS);
    setTasks(INITIAL_TASKS);
    setInventory(INITIAL_INVENTORY);
    localStorage.removeItem('sie_transactions');
    localStorage.removeItem('sie_nominations');
    localStorage.removeItem('sie_tasks');
    localStorage.removeItem('sie_inventory');
  };

  // Nomination Handlers with Firestore Integration
  const handleAddNomination = async (newNom: Omit<Nomination, 'id' | 'createdAt'>) => {
    const localCreated: Nomination = {
      ...newNom,
      id: `nom-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Optimistic UI update
    setNominations((prev) => [localCreated, ...prev]);

    // Save to Cloud Firestore
    try {
      await addNominationToFirestore(newNom);
    } catch (err) {
      console.error('Firestore sync failed on add nomination:', err);
    }
  };

  const handleUpdateNomination = async (updatedNom: Nomination) => {
    // Optimistic UI update
    setNominations((prev) => prev.map((n) => (n.id === updatedNom.id ? updatedNom : n)));

    // Save to Cloud Firestore
    try {
      await updateNominationInFirestore(updatedNom);
    } catch (err) {
      console.error('Firestore sync failed on update nomination:', err);
    }
  };

  const handleDeleteNomination = async (id: string) => {
    // Optimistic UI update
    setNominations((prev) => prev.filter((n) => n.id !== id));

    // Delete from Cloud Firestore
    try {
      await deleteNominationFromFirestore(id);
    } catch (err) {
      console.error('Firestore sync failed on delete nomination:', err);
    }
  };

  // Transaction Handlers
  const handleAddTransaction = (newTrx: Omit<Transaction, 'id'>) => {
    const created: Transaction = {
      ...newTrx,
      id: `trx-${Date.now()}`,
    };
    setTransactions([created, ...transactions]);
  };

  const handleUpdateTransaction = (updatedTrx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTrx.id ? updatedTrx : t)));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  // Task Handlers
  const handleAddTask = (newTask: Omit<CommitteeTask, 'id'>) => {
    const created: CommitteeTask = {
      ...newTask,
      id: `task-${Date.now()}`,
    };
    setTasks([...tasks, created]);
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Inventory Handlers
  const handleAddInventory = (newInv: Omit<InventoryItem, 'id'>) => {
    const created: InventoryItem = {
      ...newInv,
      id: `inv-${Date.now()}`,
    };
    setInventory([...inventory, created]);
  };

  // If user is not logged in, render Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased selection:bg-amber-500 selection:text-white relative overflow-x-hidden">
      {/* Soft Ambient Light Glowing Accents */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-1/3 right-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLogin={() => setCurrentUser(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            transactions={transactions}
            nominations={nominations}
            categories={categories}
            tasks={tasks}
            onOpenAddNomination={() => {
              setActiveTab('nominasi');
              setOpenAddNominationDirectly(true);
            }}
            onOpenAddTransaction={() => {
              setActiveTab('keuangan');
              setOpenAddTransactionDirectly(true);
            }}
          />
        )}

        {activeTab === 'nominasi' && (
          <NominationsView
            nominations={nominations}
            categories={categories}
            onAddNomination={handleAddNomination}
            onUpdateNomination={handleUpdateNomination}
            onDeleteNomination={handleDeleteNomination}
            isAddModalOpenOpenDirectly={openAddNominationDirectly}
            onCloseAddModalDirectly={() => setOpenAddNominationDirectly(false)}
          />
        )}

        {activeTab === 'keuangan' && (
          <FinanceView
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isAddModalOpenDirectly={openAddTransactionDirectly}
            onCloseAddModalDirectly={() => setOpenAddTransactionDirectly(false)}
          />
        )}

        {activeTab === 'koordinasi' && (
          <CoordinationView
            tasks={tasks}
            inventory={inventory}
            rundown={rundown}
            onAddTask={handleAddTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onAddInventory={handleAddInventory}
          />
        )}

        {activeTab === 'sertifikat' && (
          <CertificatesView nominations={nominations} categories={categories} />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

