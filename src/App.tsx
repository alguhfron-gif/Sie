import React, { useState, useEffect } from 'react';
import { ActiveTab, AwardCategory, Nomination, Transaction, RapbItem, CommitteeTask, InventoryItem, RundownItem, TaskStatus, UserSession, CommitteeAccount, OfficialDocument, RegulationRule } from './types';
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
  subscribeRapbItems,
  addRapbItemToFirestore,
  updateRapbItemInFirestore,
  deleteRapbItemFromFirestore,
  bulkAddRapbItemsToFirestore,
  clearAllRapbItemsFromFirestore,
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
import { getRoleOptionById, getAllowedCategoryIdsForUser } from './utils/accountRoles';
import { setUserOnline, setUserOffline } from './services/presenceService';
import { subscribeCertificates, CertificateRecord } from './services/certificatesService';
import { subscribeCustomLogo } from './services/logoService';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { MiladLogo } from './components/MiladLogo';
import { DashboardView } from './components/DashboardView';
import { NominationsView } from './components/NominationsView';
import { FinanceView } from './components/FinanceView';
import { CoordinationView } from './components/CoordinationView';
import { CertificatesView } from './components/CertificatesView';
import { AuditReportView } from './components/AuditReportView';
import { AccountsView } from './components/AccountsView';

import { LoginView } from './components/LoginView';
import { ErrorBoundary, ViewErrorBoundary } from './components/ErrorBoundary';
import {
  registerGlobalSelfHealingInterceptor,
  safeJSONParse,
  sanitizeNomination,
  sanitizeTransaction,
  sanitizeTask,
  sanitizeInventory,
  sanitizeDocument,
  sanitizeRegulation,
} from './services/errorRecoveryService';
import { ShieldCheck, CheckCircle, Menu, RefreshCw } from 'lucide-react';

export default function App() {
  // Self-Healing toast message state for non-intrusive recovery notice
  const [recoveryToast, setRecoveryToast] = useState<string | null>(null);

  useEffect(() => {
    // Initialize global unhandled error interceptor
    registerGlobalSelfHealingInterceptor((msg) => {
      setRecoveryToast(msg);
      setTimeout(() => setRecoveryToast(null), 3500);
    });
  }, []);

  // Safe initialization of activeTab from localStorage (Petugas defaults to 'nominasi')
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const savedUserStr = localStorage.getItem('sie_user_session') || sessionStorage.getItem('sie_user_session');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        const isPetugasUser = parsed && (parsed.category === 'petugas' || (parsed.role && parsed.role.toUpperCase().includes('PETUGAS')));
        if (isPetugasUser) return 'nominasi';
      }
      const savedTab = localStorage.getItem('sie_active_tab');
      if (savedTab && ['dashboard', 'nominasi', 'keuangan', 'koordinasi', 'sertifikat', 'laporan', 'akun'].includes(savedTab)) {
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

  // User Authentication Session State - Hanya me-restore sesi jika pengguna telah login sebelumnya
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    // 1. Coba restore dari localStorage
    const savedLocal = localStorage.getItem('sie_user_session');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed && parsed.name && parsed.id) return parsed;
      } catch (e) {
        console.error('Failed to parse saved user session from localStorage', e);
      }
    }
    // 2. Coba restore dari sessionStorage
    const savedSession = sessionStorage.getItem('sie_user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.name && parsed.id) return parsed;
      } catch (e) {
        console.error('Failed to parse saved user session from sessionStorage', e);
      }
    }
    // Tanpa sesi tersimpan: tampilkan halaman Login resmi
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

  // Enforce access control: Admin sees everything; Petugas strictly limited to Ketentuan Nominasi (Dasbor disembunyikan)
  const isAdmin = currentUser?.category === 'admin' || (currentUser?.role && currentUser.role.toUpperCase().includes('ADMIN'));
  const isPetugas = !isAdmin && (currentUser?.category === 'petugas' || (currentUser?.role && currentUser.role.toUpperCase().includes('PETUGAS')));

  useEffect(() => {
    if (isPetugas && activeTab !== 'nominasi') {
      setActiveTab('nominasi');
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
    const isLoggingInPetugas = user.category === 'petugas' || (user.role && user.role.toUpperCase().includes('PETUGAS'));
    if (isLoggingInPetugas) {
      setActiveTab('nominasi');
    }
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

  // LocalStorage helper initialization with try...catch and automated self-healing
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('sie_transactions');
      const parsed = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
      return Array.isArray(parsed) ? parsed.map(sanitizeTransaction) : INITIAL_TRANSACTIONS;
    } catch (e) {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [rapbItems, setRapbItems] = useState<RapbItem[]>(() => {
    try {
      const saved = localStorage.getItem('sie_rapb_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [nominations, setNominations] = useState<Nomination[]>(() => {
    try {
      const saved = localStorage.getItem('sie_nominations');
      const parsed = saved ? JSON.parse(saved) : INITIAL_NOMINATIONS;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeNomination);
      }
      return INITIAL_NOMINATIONS;
    } catch (e) {
      return INITIAL_NOMINATIONS;
    }
  });

  const [categories, setCategories] = useState<AwardCategory[]>(() => {
    try {
      const saved = localStorage.getItem('sie_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6 && parsed.some((c: AwardCategory) => c.title.includes('Khidmah'))) {
          return parsed;
        }
      }
      // Migrate to new 6 official Sidogiri award categories
      localStorage.setItem('sie_categories', JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    } catch (e) {
      return INITIAL_CATEGORIES;
    }
  });

  const [tasks, setTasks] = useState<CommitteeTask[]>(() => {
    try {
      const saved = localStorage.getItem('sie_tasks');
      const parsed = saved ? JSON.parse(saved) : INITIAL_TASKS;
      return Array.isArray(parsed) ? parsed.map(sanitizeTask) : INITIAL_TASKS;
    } catch (e) {
      return INITIAL_TASKS;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sie_inventory');
      const parsed = saved ? JSON.parse(saved) : INITIAL_INVENTORY;
      return Array.isArray(parsed) ? parsed.map(sanitizeInventory) : INITIAL_INVENTORY;
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
      const parsed = saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
      return Array.isArray(parsed) ? parsed.map(sanitizeDocument) : INITIAL_DOCUMENTS;
    } catch (e) {
      return INITIAL_DOCUMENTS;
    }
  });

  const [regulations, setRegulations] = useState<RegulationRule[]>(() => {
    try {
      const saved = localStorage.getItem('sie_regulations');
      const parsed = saved ? JSON.parse(saved) : INITIAL_REGULATIONS;
      return Array.isArray(parsed) ? parsed.map(sanitizeRegulation) : INITIAL_REGULATIONS;
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

  // Subscribe to Cloud Firestore Nominations Real-time Updates with Auto-Sanitization
  useEffect(() => {
    const unsubscribe = subscribeNominations(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setNominations(firestoreItems.map(sanitizeNomination));
        }
      },
      (error) => {
        console.warn('Realtime Firestore nominations notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Transactions Real-time Updates with Auto-Sanitization
  useEffect(() => {
    const unsubscribe = subscribeTransactions(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setTransactions(firestoreItems.map(sanitizeTransaction));
        }
      },
      (error) => {
        console.warn('Realtime Firestore transactions notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore RAPB Items Real-time Updates
  useEffect(() => {
    const unsubscribe = subscribeRapbItems(
      (firestoreItems) => {
        if (firestoreItems && Array.isArray(firestoreItems)) {
          setRapbItems(firestoreItems);
        }
      },
      (error) => {
        console.warn('Realtime Firestore RAPB items notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Committee Tasks Real-time Updates with Auto-Sanitization
  useEffect(() => {
    const unsubscribe = subscribeCommitteeTasks(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setTasks(firestoreItems.map(sanitizeTask));
        }
      },
      (error) => {
        console.warn('Realtime Firestore tasks notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Inventory Real-time Updates with Auto-Sanitization
  useEffect(() => {
    const unsubscribe = subscribeInventory(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setInventory(firestoreItems.map(sanitizeInventory));
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

  // Subscribe to Cloud Firestore Official Documents Real-time Updates with Auto-Sanitization
  useEffect(() => {
    const unsubscribe = subscribeOfficialDocuments(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setDocuments(firestoreItems.map(sanitizeDocument));
        }
      },
      (error) => {
        console.warn('Realtime Firestore official documents notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Regulations Real-time Updates with Auto-Sanitization
  useEffect(() => {
    const unsubscribe = subscribeRegulations(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length >= 0) {
          setRegulations(firestoreItems.map(sanitizeRegulation));
        }
      },
      (error) => {
        console.warn('Realtime Firestore regulations notice:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore Milad Logo Real-time Updates across all devices
  useEffect(() => {
    const unsubscribe = subscribeCustomLogo(() => {});
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

  // Update Category Handler
  const handleUpdateCategory = (updatedCat: AwardCategory) => {
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === updatedCat.id ? updatedCat : c));
      try {
        localStorage.setItem('sie_categories', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Nomination Handlers with Firestore Real-time Integration
  const handleAddNomination = async (newNom: Omit<Nomination, 'id' | 'createdAt'>) => {
    const docId = `nom-${Date.now()}`;
    const createdAt = new Date().toISOString().split('T')[0];
    const createdNom: Nomination = {
      ...newNom,
      id: docId,
      createdAt,
    };
    // Optimistic update locally immediately
    setNominations((prev) => [sanitizeNomination(createdNom), ...prev.filter((p) => p.id !== docId)]);
    try {
      await addNominationToFirestore(newNom, docId);
    } catch (err) {
      console.error('Firestore sync failed on add nomination:', err);
    }
  };

  const handleUpdateNomination = async (updatedNom: Nomination) => {
    // Optimistic update locally immediately
    setNominations((prev) => prev.map((n) => (n.id === updatedNom.id ? sanitizeNomination(updatedNom) : n)));
    try {
      await updateNominationInFirestore(updatedNom);
    } catch (err) {
      console.error('Firestore sync failed on update nomination:', err);
    }
  };

  const handleDeleteNomination = async (id: string) => {
    // Optimistic delete locally immediately
    setNominations((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNominationFromFirestore(id);
    } catch (err) {
      console.error('Firestore sync failed on delete nomination:', err);
    }
  };

  // Transaction Handlers with Firestore Real-time Integration
  const handleAddTransaction = async (newTrx: Omit<Transaction, 'id'>) => {
    try {
      const created = await addTransactionToFirestore(newTrx);
      return created;
    } catch (err) {
      console.error('Firestore sync failed on add transaction:', err);
      throw err;
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

  // RAPB Handlers with Firestore Real-time Integration
  const handleAddRapbItem = async (item: Omit<RapbItem, 'id'> | RapbItem) => {
    try {
      const created = await addRapbItemToFirestore(item);
      setRapbItems((prev) => [...prev.filter((p) => p.id !== created.id), created]);
      return created;
    } catch (err) {
      console.error('Firestore sync failed on add RAPB item:', err);
    }
  };

  const handleUpdateRapbItem = async (item: RapbItem) => {
    try {
      await updateRapbItemInFirestore(item);
      setRapbItems((prev) => prev.map((p) => (p.id === item.id ? item : p)));
    } catch (err) {
      console.error('Firestore sync failed on update RAPB item:', err);
    }
  };

  const handleDeleteRapbItem = async (id: string) => {
    try {
      await deleteRapbItemFromFirestore(id);
      setRapbItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Firestore sync failed on delete RAPB item:', err);
    }
  };

  const handleBulkAddRapb = async (items: RapbItem[], mode: 'append' | 'replace') => {
    try {
      if (mode === 'replace') {
        await clearAllRapbItemsFromFirestore();
        await bulkAddRapbItemsToFirestore(items);
        setRapbItems(items);
      } else {
        await bulkAddRapbItemsToFirestore(items);
        setRapbItems((prev) => [...prev, ...items]);
      }
    } catch (err) {
      console.error('Firestore sync failed on bulk add RAPB items:', err);
    }
  };

  const handleClearAllRapb = async () => {
    try {
      await clearAllRapbItemsFromFirestore();
      setRapbItems([]);
    } catch (err) {
      console.error('Firestore sync failed on clear RAPB items:', err);
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

  const handleAddBatchAccounts = async (newAccs: Array<Omit<CommitteeAccount, 'id'>>) => {
    for (const newAcc of newAccs) {
      await handleAddAccount(newAcc);
    }
  };

  const handleUpdateAccount = async (updatedAcc: CommitteeAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === updatedAcc.id || a.name.toUpperCase().trim() === updatedAcc.name.toUpperCase().trim() ? updatedAcc : a))
    );

    if (currentUser && (currentUser.id === updatedAcc.id || currentUser.name.toUpperCase().trim() === updatedAcc.name.toUpperCase().trim())) {
      const roleOpt = getRoleOptionById(updatedAcc.accountType || (updatedAcc.category === 'admin' ? 'panitia' : 'madrasah'));
      const updatedSession: UserSession = {
        ...currentUser,
        id: updatedAcc.id,
        idPersonalia: updatedAcc.idPersonalia,
        name: updatedAcc.name,
        role: `${updatedAcc.role} (${roleOpt.name.toUpperCase()})`,
        category: updatedAcc.category,
        accountType: roleOpt.id,
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

  // User Role Category Filtering sesuai 5 Pilihan Akun
  const allowedCategoryIds = React.useMemo(() => {
    return getAllowedCategoryIdsForUser(currentUser);
  }, [currentUser]);

  const userVisibleCategories = React.useMemo(() => {
    if (currentUser?.category === 'admin') return categories;
    return categories.filter((c) => allowedCategoryIds.includes(c.id));
  }, [categories, allowedCategoryIds, currentUser]);

  const userVisibleNominations = React.useMemo(() => {
    if (currentUser?.category === 'admin') return nominations;
    return nominations.filter((n) => {
      if (allowedCategoryIds.includes(n.categoryId)) return true;
      const cat = categories.find((c) => c.id === n.categoryId);
      return cat ? allowedCategoryIds.includes(cat.id) : false;
    });
  }, [nominations, allowedCategoryIds, categories, currentUser]);

  return (
    <div className="min-h-screen bg-[#efede7] text-[#24211c] font-sans flex flex-col antialiased selection:bg-[#8a7c4c] selection:text-white relative overflow-x-hidden">
      {/* Mobile Top Header (Hanya di layar ponsel/tablet kecil untuk buka drawer menu) */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[rgba(36,33,28,0.12)] px-3 py-2 flex items-center justify-between shadow-2xs print:hidden">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            title="Buka Menu Navigasi"
            className="p-1.5 rounded-lg border border-[rgba(36,33,28,0.15)] bg-[#f7f6f2] hover:bg-[#e5e2da] text-[#24211c] transition cursor-pointer active:scale-95"
          >
            <Menu className="w-5 h-5 text-[#24211c]" />
          </button>
          <MiladLogo size="sm" className="w-7 h-7 shrink-0" />
          <div className="flex flex-col">
            <span className="font-extrabold text-xs tracking-tight text-[#24211c] leading-none">
              SIE PENGANUGERAHAN
            </span>
            <span className="text-[9px] text-[#8a7c4c] font-bold">MILAD SIDOGIRI</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => window.location.reload()}
            title="Segarkan Data"
            className="p-1.5 rounded-lg bg-[#f7f6f2] hover:bg-[#e5e2da] text-[#24211c] border border-[rgba(36,33,28,0.12)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#8a7c4c]" />
          </button>
          {currentUser && (
            <div className="w-7 h-7 rounded-lg bg-[#8a7c4c] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout Area with Left Sidebar & Content */}
      <div className="w-full mx-auto flex flex-1 min-h-screen">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onRefreshData={() => window.location.reload()}
          collapsed={isSidebarCollapsed}
          setCollapsed={setIsSidebarCollapsed}
          mobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area wrapped in ErrorBoundary & View-specific boundaries */}
        <main className="flex-1 p-3 sm:p-6 pb-28 md:pb-12 min-w-0">
          {/* Non-intrusive self-healing auto-repair toast */}
          {recoveryToast && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/95 backdrop-blur-md text-emerald-100 text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400/50 flex items-center space-x-2.5 animate-bounce">
              <ShieldCheck className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>{recoveryToast}</span>
            </div>
          )}

          <ErrorBoundary>
            {activeTab === 'dashboard' && !isPetugas && (
              <ViewErrorBoundary viewName="Dasbor Utama">
                <DashboardView
                  setActiveTab={setActiveTab}
                  transactions={transactions}
                  nominations={userVisibleNominations}
                  categories={userVisibleCategories}
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
                />
              </ViewErrorBoundary>
            )}

            {activeTab === 'nominasi' && (
              <ViewErrorBoundary viewName="Data Nominasi">
                <NominationsView
                  nominations={userVisibleNominations}
                  categories={userVisibleCategories}
                  onUpdateCategory={handleUpdateCategory}
                  onAddNomination={handleAddNomination}
                  onUpdateNomination={handleUpdateNomination}
                  onDeleteNomination={handleDeleteNomination}
                  isAddModalOpenOpenDirectly={openAddNominationDirectly}
                  onCloseAddModalDirectly={() => setOpenAddNominationDirectly(false)}
                  currentUser={currentUser}
                />
              </ViewErrorBoundary>
            )}

            {activeTab === 'keuangan' && (
              <ViewErrorBoundary viewName="Laporan Keuangan">
                <FinanceView
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  onUpdateTransaction={handleUpdateTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  isAddModalOpenDirectly={openAddTransactionDirectly}
                  onCloseAddModalDirectly={() => setOpenAddTransactionDirectly(false)}
                  currentUser={currentUser}
                  rapbItems={rapbItems}
                  onAddRapbItem={handleAddRapbItem}
                  onUpdateRapbItem={handleUpdateRapbItem}
                  onDeleteRapbItem={handleDeleteRapbItem}
                  onBulkAddRapb={handleBulkAddRapb}
                  onClearAllRapb={handleClearAllRapb}
                />
              </ViewErrorBoundary>
            )}

            {activeTab === 'koordinasi' && (
              <ViewErrorBoundary viewName="Koordinasi & Tugas">
                <CoordinationView
                  tasks={tasks}
                  inventory={inventory}
                  rundown={rundown}
                  onAddTask={handleAddTask}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onDeleteTask={handleDeleteTask}
                  onAddInventory={handleAddInventory}
                  currentUser={currentUser}
                />
              </ViewErrorBoundary>
            )}

            {activeTab === 'sertifikat' && (
              <ViewErrorBoundary viewName="Cetak Sertifikat">
                <CertificatesView nominations={nominations} categories={categories} currentUser={currentUser} />
              </ViewErrorBoundary>
            )}

            {activeTab === 'laporan' && (
              <ViewErrorBoundary viewName="Laporan Pengisian">
                <AuditReportView
                  accounts={accounts}
                  nominations={nominations}
                  categories={categories}
                  currentUser={currentUser}
                  setActiveTab={setActiveTab}
                />
              </ViewErrorBoundary>
            )}

            {activeTab === 'akun' && (
              <ViewErrorBoundary viewName="Manajemen Akun">
                <AccountsView
                  accounts={accounts}
                  onAddAccount={handleAddAccount}
                  onAddBatchAccounts={handleAddBatchAccounts}
                  onDeleteAccount={handleDeleteAccount}
                  onUpdateAccount={handleUpdateAccount}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onSwitchUser={(acc) => {
                    const roleOpt = getRoleOptionById(acc.accountType || (acc.category === 'admin' ? 'panitia' : 'madrasah'));
                    const session: UserSession = {
                      id: acc.id,
                      idPersonalia: acc.idPersonalia,
                      name: acc.name,
                      role: `${acc.role} (${roleOpt.name.toUpperCase()})`,
                      category: acc.category,
                      accountType: roleOpt.id,
                      email: `${acc.name.toLowerCase().replace(/[^a-z]/g, '')}@penganugerahan.id`,
                      loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    };
                    handleLoginSuccess(session);
                  }}
                />
              </ViewErrorBoundary>
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Official Milad Sidogiri Footer */}
      <footer className="mt-auto border-t border-[rgba(36,33,28,0.12)] bg-white/70 py-5 px-4 sm:px-8 text-xs text-[#7c7b77] pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <span className="font-bold text-[#24211c]">Panitia Milad Pondok Pesantren Sidogiri</span>
            <span>•</span>
            <span>Ikhtibar Madrasah Miftahul Ulum</span>
          </div>
          <div className="text-[11px] text-[#8a7c4c] font-bold">
            Sie Penganugerahan | 1158 — 1448 H
          </div>
        </div>
      </footer>

      {/* Signature Milad Sidogiri Bottom Decorative Bar */}
      <div aria-hidden="true" className="grid grid-cols-[8%_1fr_26%] h-2 w-full shrink-0 print:hidden">
        <span className="bg-[#7c7b77]"></span>
        <span className="bg-[#e5e2da]"></span>
        <span className="bg-[#8a7c4c]"></span>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />
    </div>
  );
}


