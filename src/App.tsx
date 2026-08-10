import React, { useState, useEffect } from 'react';
import { ActiveTab, AwardCategory, Nomination, Transaction, CommitteeTask, InventoryItem, RundownItem, TaskStatus, UserSession, CommitteeAccount, OfficialDocument, RegulationRule } from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_NOMINATIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_TASKS,
  INITIAL_INVENTORY,
  INITIAL_RUNDOWN,
  INITIAL_ACCOUNTS,
  INITIAL_DOCUMENTS,
  INITIAL_REGULATIONS,
} from './data/initialData';

import {
  subscribeNominations,
  addNominationToFirestore,
  updateNominationInFirestore,
  deleteNominationFromFirestore,
} from './services/nominationsService';
import {
  subscribeTransactions,
  addTransactionToFirestore,
  updateTransactionInFirestore,
  deleteTransactionFromFirestore,
} from './services/financeService';
import {
  subscribeCommitteeTasks,
  subscribeInventory,
  subscribeRundown,
  subscribeCommitteeAccounts,
  addCommitteeTaskToFirestore,
  updateCommitteeTaskInFirestore,
  deleteCommitteeTaskFromFirestore,
  addInventoryToFirestore,
  addCommitteeAccountToFirestore,
  updateCommitteeAccountInFirestore,
  deleteCommitteeAccountFromFirestore,
} from './services/committeeService';
import {
  subscribeOfficialDocuments,
  subscribeRegulations,
  addOfficialDocumentToFirestore,
  updateOfficialDocumentInFirestore,
  deleteOfficialDocumentFromFirestore,
  addRegulationToFirestore,
  updateRegulationInFirestore,
  deleteRegulationFromFirestore,
} from './services/documentsService';
import { subscribeToAuthChanges, logoutFirebase } from './services/authService';
import { setUserOnline, setUserOffline } from './services/presenceService';
import { subscribeCertificates, CertificateRecord } from './services/certificatesService';
import { syncAllCollectionsToGoogleSheets, getWebhookUrl } from './services/googleSheets';
import { syncCollectionToSheets } from './services/googleSheetsSync';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { NominationsView } from './components/NominationsView';
import { FinanceView } from './components/FinanceView';
import { CoordinationView } from './components/CoordinationView';
import { CertificatesView } from './components/CertificatesView';
import { DocumentsView } from './components/DocumentsView';
import { AccountsView } from './components/AccountsView';

import { LoginView } from './components/LoginView';
import { WebhookModal } from './components/WebhookModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchWebhookUrlFromFirestore } from './services/webhookService';

export default function App() {
  // Safe initialization of activeTab from localStorage
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const savedTab = localStorage.getItem('sie_active_tab');
      if (savedTab && ['dashboard', 'nominasi', 'keuangan', 'koordinasi', 'sertifikat', 'surat', 'akun'].includes(savedTab)) {
        return savedTab as ActiveTab;
      }
    } catch (e) {
      console.warn('Failed to parse active tab from storage:', e);
    }
    return 'dashboard';
  });

  // Save activeTab to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('sie_active_tab', activeTab);
    } catch (e) {
      console.warn('Failed to save active tab to storage:', e);
    }
  }, [activeTab]);

  // User Authentication Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    // 1. Try localStorage
    const savedLocal = localStorage.getItem('sie_user_session');
    if (savedLocal) {
      try {
        return JSON.parse(savedLocal);
      } catch (e) {
        console.error('Failed to parse saved user session from localStorage', e);
      }
    }
    // 2. Fallback to sessionStorage
    const savedSession = sessionStorage.getItem('sie_user_session');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error('Failed to parse saved user session from sessionStorage', e);
      }
    }
    return null;
  });

  // Global App Lifecycle & Background Visibility Handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background: mark offline or pause active tasks
        if (currentUser?.id) {
          setUserOffline(currentUser.id).catch(() => {});
        }
      } else {
        // App resumed from background: restore session and set online
        const savedSession = localStorage.getItem('sie_user_session') || sessionStorage.getItem('sie_user_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed && parsed.id) {
              setCurrentUser(parsed);
              setUserOnline(parsed).catch(() => {});
            }
          } catch (e) {
            console.warn('Error restoring user session on resume:', e);
          }
        } else if (currentUser) {
          setUserOnline(currentUser).catch(() => {});
        }
      }
    };

    const handlePageHide = () => {
      if (currentUser?.id) {
        setUserOffline(currentUser.id).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [currentUser]);

  // Subscribe to Firebase Auth real-time state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseSession) => {
      if (firebaseSession) {
        // Protect active local Committee / Petugas session from being unexpectedly overwritten
        const rawSaved = localStorage.getItem('sie_user_session') || sessionStorage.getItem('sie_user_session');
        let isCommitteeOrPetugasSession = false;
        if (rawSaved) {
          try {
            const parsed = JSON.parse(rawSaved);
            if (parsed?.authType === 'committee' || parsed?.category === 'petugas' || parsed?.category === 'admin') {
              isCommitteeOrPetugasSession = true;
            }
          } catch (e) {}
        }

        // Only update if not currently using a local Committee/Petugas login session
        if (!isCommitteeOrPetugasSession) {
          const sessionData: UserSession = {
            ...firebaseSession,
            authType: 'firebase',
          };
          setCurrentUser(sessionData);
          try {
            localStorage.setItem('sie_user_session', JSON.stringify(sessionData));
            sessionStorage.setItem('sie_user_session', JSON.stringify(sessionData));
          } catch (e) {}
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Enforce access control: Admin sees everything; Petugas strictly limited to Dasbor, Nominasi, and Surat
  const isAdmin = currentUser?.category === 'admin' || (currentUser?.role && currentUser.role.toUpperCase().includes('ADMIN'));
  const isPetugas = !isAdmin && (currentUser?.category === 'petugas' || (currentUser?.role && currentUser.role.toUpperCase().includes('PETUGAS')));

  useEffect(() => {
    if (isPetugas && activeTab !== 'dashboard' && activeTab !== 'nominasi' && activeTab !== 'surat') {
      setActiveTab('dashboard');
    }
  }, [isPetugas, activeTab]);

  // Automatic real-time presence heartbeat when user is logged in
  useEffect(() => {
    if (!currentUser) return;

    // Immediately set online if document is visible
    if (!document.hidden) {
      setUserOnline(currentUser).catch(() => {});
    }

    // Heartbeat every 20 seconds only when document is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        setUserOnline(currentUser).catch(() => {});
      }
    }, 20000);

    // Mark offline on window unload
    const handleBeforeUnload = () => {
      if (currentUser?.id) {
        setUserOffline(currentUser.id).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    setUserOnline(user).catch(() => {});
    try {
      localStorage.setItem('sie_user_session', JSON.stringify(user));
      sessionStorage.setItem('sie_user_session', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save session to browser storage:', e);
    }
  };

  const handleLogout = async () => {
    const userId = currentUser?.id;
    // Immediately clear current user state so application routes instantly to Login view
    setCurrentUser(null);
    try {
      localStorage.removeItem('sie_user_session');
      sessionStorage.removeItem('sie_user_session');
    } catch (e) {
      console.warn('Failed to clear local session storage:', e);
    }

    // Background presence & Firebase auth cleanup
    if (userId) {
      setUserOffline(userId).catch((err) => console.warn('Failed to update offline status:', err));
    }
    logoutFirebase().catch((err) => console.warn('Failed to logout Firebase:', err));
  };

  // LocalStorage helper initialization with try...catch
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('sie_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch (e) {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [nominations, setNominations] = useState<Nomination[]>(() => {
    try {
      const saved = localStorage.getItem('sie_nominations');
      return saved ? JSON.parse(saved) : INITIAL_NOMINATIONS;
    } catch (e) {
      return INITIAL_NOMINATIONS;
    }
  });

  const [categories] = useState<AwardCategory[]>(() => {
    try {
      const saved = localStorage.getItem('sie_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch (e) {
      return INITIAL_CATEGORIES;
    }
  });

  const [tasks, setTasks] = useState<CommitteeTask[]>(() => {
    try {
      const saved = localStorage.getItem('sie_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch (e) {
      return INITIAL_TASKS;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sie_inventory');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
    } catch (e) {
      return INITIAL_INVENTORY;
    }
  });

  const [rundown, setRundown] = useState<RundownItem[]>(() => {
    try {
      const saved = localStorage.getItem('sie_rundown');
      return saved ? JSON.parse(saved) : INITIAL_RUNDOWN;
    } catch (e) {
      return INITIAL_RUNDOWN;
    }
  });

  const [accounts, setAccounts] = useState<CommitteeAccount[]>(() => {
    try {
      const saved = localStorage.getItem('sie_accounts');
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch (e) {
      return INITIAL_ACCOUNTS;
    }
  });

  const [documents, setDocuments] = useState<OfficialDocument[]>(() => {
    try {
      const saved = localStorage.getItem('sie_documents');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch (e) {
      return INITIAL_DOCUMENTS;
    }
  });

  const [regulations, setRegulations] = useState<RegulationRule[]>(() => {
    try {
      const saved = localStorage.getItem('sie_regulations');
      return saved ? JSON.parse(saved) : INITIAL_REGULATIONS;
    } catch (e) {
      return INITIAL_REGULATIONS;
    }
  });

  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);

  // Save documents & regulations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sie_documents', JSON.stringify(documents));
    } catch (e) {}
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('sie_regulations', JSON.stringify(regulations));
    } catch (e) {}
  }, [regulations]);

  const handleAddDocument = async (newDoc: Omit<OfficialDocument, 'id'>) => {
    try {
      await addOfficialDocumentToFirestore(newDoc);
    } catch (err) {
      console.error('Firestore sync failed on add document:', err);
    }
  };

  const handleUpdateDocument = async (updatedDoc: OfficialDocument) => {
    try {
      await updateOfficialDocumentInFirestore(updatedDoc);
    } catch (err) {
      console.error('Firestore sync failed on update document:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteOfficialDocumentFromFirestore(id);
    } catch (err) {
      console.error('Firestore sync failed on delete document:', err);
    }
  };

  const handleAddRegulation = async (newReg: Omit<RegulationRule, 'id'>) => {
    try {
      await addRegulationToFirestore(newReg);
    } catch (err) {
      console.error('Firestore sync failed on add regulation:', err);
    }
  };

  const handleUpdateRegulation = async (updatedReg: RegulationRule) => {
    try {
      await updateRegulationInFirestore(updatedReg);
    } catch (err) {
      console.error('Firestore sync failed on update regulation:', err);
    }
  };

  const handleDeleteRegulation = async (id: string) => {
    try {
      await deleteRegulationFromFirestore(id);
    } catch (err) {
      console.error('Firestore sync failed on delete regulation:', err);
    }
  };

  // Direct modal trigger states
  const [openAddNominationDirectly, setOpenAddNominationDirectly] = useState(false);
  const [openAddTransactionDirectly, setOpenAddTransactionDirectly] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  // Subscribe to Cloud Firestore Nominations Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeNominations(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setNominations(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore nominations synchronization notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Transactions Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeTransactions(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setTransactions(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore transactions synchronization notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Committee Tasks Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeCommitteeTasks(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setTasks(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore tasks notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Inventory Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeInventory(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setInventory(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore inventory notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Rundown Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeRundown(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setRundown(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore rundown notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Committee Accounts Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeCommitteeAccounts(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setAccounts(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore accounts notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Official Documents Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeOfficialDocuments(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setDocuments(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore official documents notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Regulations Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeRegulations(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setRegulations(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore regulations notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Certificates Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeCertificates(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setCertificates(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore certificates notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Webhook URL from Firestore on mount
  useEffect(() => {
    fetchWebhookUrlFromFirestore();
  }, []);

  // Automatic Background Sync to Google Sheets when datasets update
  useEffect(() => {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl || document.hidden) return;

    const timer = setTimeout(() => {
      if (document.hidden) return;

      // Sync batch payload
      syncAllCollectionsToGoogleSheets({
        nominations,
        transactions,
        tasks,
        rundown,
        inventory,
        certificates,
        documents,
        regulations,
        accounts,
      });

      // Also sync individual collections using syncCollectionToSheets helper
      if (nominations.length > 0) syncCollectionToSheets('Nominasi', nominations);
      if (transactions.length > 0) syncCollectionToSheets('Keuangan', transactions);
      if (tasks.length > 0) syncCollectionToSheets('Tugas Panitia', tasks);
      if (rundown.length > 0) syncCollectionToSheets('Rundown Acara', rundown);
      if (inventory.length > 0) syncCollectionToSheets('Inventaris', inventory);
      if (certificates.length > 0) syncCollectionToSheets('Sertifikat', certificates);
      if (documents.length > 0) syncCollectionToSheets('Surat & Dokumen', documents);
      if (accounts.length > 0) syncCollectionToSheets('Akun Petugas', accounts);
    }, 4000); // 4 second debounce to prevent spamming webhooks during typing/bulk operations

    return () => clearTimeout(timer);
  }, [nominations, transactions, tasks, rundown, inventory, certificates, documents, regulations, accounts]);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('sie_transactions', JSON.stringify(transactions));
    } catch (e) {}
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('sie_nominations', JSON.stringify(nominations));
    } catch (e) {}
  }, [nominations]);

  useEffect(() => {
    try {
      localStorage.setItem('sie_tasks', JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('sie_inventory', JSON.stringify(inventory));
    } catch (e) {}
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem('sie_accounts', JSON.stringify(accounts));
    } catch (e) {}
  }, [accounts]);

  // Reset Data Handler
  const handleResetData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setNominations(INITIAL_NOMINATIONS);
    setTasks(INITIAL_TASKS);
    setInventory(INITIAL_INVENTORY);
    try {
      localStorage.removeItem('sie_transactions');
      localStorage.removeItem('sie_nominations');
      localStorage.removeItem('sie_tasks');
      localStorage.removeItem('sie_inventory');
    } catch (e) {}
  };

  // Nomination Handlers with Firestore Real-time Integration
  const handleAddNomination = async (newNom: Omit<Nomination, 'id' | 'createdAt'>) => {
    try {
      await addNominationToFirestore(newNom);
    } catch (err) {
      console.error('Firestore sync failed on add nomination:', err);
    }
  };

  const handleUpdateNomination = async (updatedNom: Nomination) => {
    try {
      await updateNominationInFirestore(updatedNom);
    } catch (err) {
      console.error('Firestore sync failed on update nomination:', err);
    }
  };

  const handleDeleteNomination = async (id: string) => {
    try {
      await deleteNominationFromFirestore(id);
    } catch (err) {
      console.error('Firestore sync failed on delete nomination:', err);
    }
  };

  // Transaction Handlers with Firestore Real-time Integration
  const handleAddTransaction = async (newTrx: Omit<Transaction, 'id'>) => {
    try {
      await addTransactionToFirestore(newTrx);
    } catch (err) {
      console.error('Firestore sync failed on add transaction:', err);
    }
  };

  const handleUpdateTransaction = async (updatedTrx: Transaction) => {
    try {
      await updateTransactionInFirestore(updatedTrx);
    } catch (err) {
      console.error('Firestore sync failed on update transaction:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransactionFromFirestore(id);
    } catch (err) {
      console.error('Firestore sync failed on delete transaction:', err);
    }
  };

  // Task Handlers with Firestore Real-time Integration
  const handleAddTask = async (newTask: Omit<CommitteeTask, 'id'>) => {
    try {
      await addCommitteeTaskToFirestore(newTask);
    } catch (err) {
      console.error('Firestore sync failed on add task:', err);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: TaskStatus) => {
    try {
      await updateCommitteeTaskInFirestore(id, { status });
    } catch (err) {
      console.error('Firestore sync failed on update task status:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteCommitteeTaskFromFirestore(id);
    } catch (err) {
      console.error('Firestore sync failed on delete task:', err);
    }
  };

  // Inventory Handlers with Firestore Real-time Integration
  const handleAddInventory = async (newInv: Omit<InventoryItem, 'id'>) => {
    try {
      await addInventoryToFirestore(newInv);
    } catch (err) {
      console.error('Firestore sync failed on add inventory:', err);
    }
  };

  // Account Handlers with Firestore Real-time Integration & Optimistic State
  const handleAddAccount = async (newAcc: Omit<CommitteeAccount, 'id'>) => {
    const tempId = `acc-${Date.now()}`;
    const created: CommitteeAccount = {
      ...newAcc,
      id: tempId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAccounts((prev) => {
      const existingIdx = prev.findIndex((a) => a.name.toUpperCase().trim() === created.name.toUpperCase().trim());
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...created };
        return copy;
      }
      return [...prev, created];
    });

    try {
      await addCommitteeAccountToFirestore(newAcc);
    } catch (err) {
      console.error('Firestore sync failed on add account:', err);
    }
  };

  const handleUpdateAccount = async (updatedAcc: CommitteeAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === updatedAcc.id || a.name.toUpperCase().trim() === updatedAcc.name.toUpperCase().trim() ? updatedAcc : a))
    );

    if (currentUser && (currentUser.id === updatedAcc.id || currentUser.name.toUpperCase().trim() === updatedAcc.name.toUpperCase().trim())) {
      const updatedSession: UserSession = {
        ...currentUser,
        id: updatedAcc.id,
        name: updatedAcc.name,
        role: `${updatedAcc.role} (${updatedAcc.category === 'admin' ? 'ADMIN' : 'PETUGAS'})`,
        category: updatedAcc.category,
      };
      setCurrentUser(updatedSession);
      try {
        localStorage.setItem('sie_user_session', JSON.stringify(updatedSession));
        sessionStorage.setItem('sie_user_session', JSON.stringify(updatedSession));
      } catch (e) {}
    }

    try {
      await updateCommitteeAccountInFirestore(updatedAcc);
    } catch (err) {
      console.error('Firestore sync failed on update account:', err);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));

    try {
      await deleteCommitteeAccountFromFirestore(id);
    } catch (err) {
      console.error('Firestore sync failed on delete account:', err);
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If user is not logged in, render Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} accounts={accounts} />;
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
        onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
        onRefreshData={() => window.location.reload()}
        onToggleSidebar={() => {
          setIsSidebarCollapsed((prev) => !prev);
          setIsMobileSidebarOpen((prev) => !prev);
        }}
      />

      {/* Google Sheets Webhook Configuration Modal */}
      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
      />

      {/* Main Layout Area with Left Sidebar & Content */}
      <div className="max-w-7xl w-full mx-auto flex flex-1 min-h-[calc(100vh-4rem)]">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          collapsed={isSidebarCollapsed}
          setCollapsed={setIsSidebarCollapsed}
          mobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
        />

        {/* Main Content Area wrapped in ErrorBoundary */}
        <main className="flex-1 p-3 sm:p-6 pb-28 md:pb-12 min-w-0">
          <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <DashboardView
                setActiveTab={setActiveTab}
                transactions={transactions}
                nominations={nominations}
                categories={categories}
                tasks={tasks}
                currentUser={currentUser}
                onOpenAddNomination={() => {
                  setActiveTab('nominasi');
                  setOpenAddNominationDirectly(true);
                }}
                onOpenAddTransaction={() => {
                  setActiveTab('keuangan');
                  setOpenAddTransactionDirectly(true);
                }}
                onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
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
                currentUser={currentUser}
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

            {activeTab === 'surat' && (
              <DocumentsView
                documents={documents}
                regulations={regulations}
                onAddDocument={handleAddDocument}
                onUpdateDocument={handleUpdateDocument}
                onDeleteDocument={handleDeleteDocument}
                onAddRegulation={handleAddRegulation}
                onUpdateRegulation={handleUpdateRegulation}
                onDeleteRegulation={handleDeleteRegulation}
                currentUser={currentUser}
                onNavigateToNominees={() => {
                  setActiveTab('nominasi');
                  setOpenAddNominationDirectly(true);
                }}
              />
            )}

            {activeTab === 'akun' && (
              <AccountsView
                accounts={accounts}
                onAddAccount={handleAddAccount}
                onDeleteAccount={handleDeleteAccount}
                onUpdateAccount={handleUpdateAccount}
                currentUser={currentUser}
                onLogout={handleLogout}
                onSwitchUser={(acc) => {
                  const session: UserSession = {
                    id: acc.id,
                    name: acc.name,
                    role: `${acc.role} (${acc.category === 'admin' ? 'ADMIN' : 'PETUGAS'})`,
                    category: acc.category,
                    email: `${acc.name.toLowerCase().replace(/[^a-z]/g, '')}@penganugerahan.id`,
                    loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                  };
                  handleLoginSuccess(session);
                }}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />
    </div>
  );
}


