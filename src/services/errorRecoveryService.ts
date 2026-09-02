/**
 * Error Recovery & Self-Healing Service for Sie Penganugerahan
 * 
 * Provides automated resilience, data normalization, corruption repair,
 * and unhandled error interception so the user is never kicked out of the app.
 */

import {
  Nomination,
  NominationStatus,
  Transaction,
  TransactionCategory,
  TransactionType,
  CommitteeTask,
  TaskStatus,
  TaskPriority,
  InventoryItem,
  OfficialDocument,
  RegulationRule,
} from '../types';

/**
 * Safe JSON parser that automatically heals corrupted or malformed data
 */
export function safeJSONParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    console.warn('[Self-Healing] Corrupted JSON detected and recovered with fallback:', e);
    return fallback;
  }
}

/**
 * Safe LocalStorage setter with quota and error handling
 */
export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.warn(`[Self-Healing] LocalStorage write failed for ${key}, attempting storage cleanup:`, e);
    try {
      // If quota exceeded, clean temporary caches without removing critical session/data
      const nonCriticalKeys = ['sie_temp_preview', 'sie_last_sync_timestamp'];
      nonCriticalKeys.forEach(k => localStorage.removeItem(k));
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }
}

const VALID_NOMINATION_STATUSES: NominationStatus[] = ['Draf', 'Penilaian', 'Disetujui', 'Pemenang'];

/**
 * Normalizes Nomination objects to prevent undefined property errors
 */
export function sanitizeNomination(raw: any, index: number = 0): Nomination {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `nom-auto-${Date.now()}-${index}`,
      candidateName: 'Kandidat (Data Pulih)',
      categoryId: 'cat-1',
      justification: 'Data dipulihkan oleh sistem secara otomatis.',
      status: 'Draf',
      score: 80,
      nominatorName: 'Sistem Panitia',
      createdAt: new Date().toISOString().split('T')[0],
      domisili: 'Pasuruan',
      kelas: '-',
      tingkat: '-',
      alamat: '-',
      department: 'Sie Penganugerahan',
      phone: '-',
    };
  }

  const validStatus: NominationStatus = VALID_NOMINATION_STATUSES.includes(raw.status)
    ? raw.status
    : 'Draf';

  return {
    id: String(raw.id || `nom-${Date.now()}-${index}`),
    idPps: raw.idPps ? String(raw.idPps) : undefined,
    candidateName: String(raw.candidateName || raw.name || 'Tanpa Nama'),
    categoryId: String(raw.categoryId || raw.category || 'cat-1'),
    justification: String(raw.justification || raw.reason || '-'),
    status: validStatus,
    score: typeof raw.score === 'number' && !isNaN(raw.score) ? raw.score : 80,
    nominatorName: String(raw.nominatorName || 'Panitia'),
    createdAt: String(raw.createdAt || new Date().toISOString().split('T')[0]),
    domisili: raw.domisili ? String(raw.domisili) : undefined,
    kelas: raw.kelas ? String(raw.kelas) : undefined,
    tingkat: raw.tingkat ? String(raw.tingkat) : undefined,
    alamat: raw.alamat ? String(raw.alamat) : undefined,
    department: raw.department ? String(raw.department) : undefined,
    position: raw.position ? String(raw.position) : undefined,
    nipNik: raw.nipNik ? String(raw.nipNik) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    achievement: raw.achievement ? String(raw.achievement) : undefined,
    photoUrl: raw.photoUrl ? String(raw.photoUrl) : undefined,
  };
}

const VALID_TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'Sponsor & Donasi',
  'Kas Organisasi',
  'Trofi & Plakat',
  'Cetak Sertifikat',
  'Konsumsi',
  'Dekorasi & Panggung',
  'Dokumentasi & Media',
  'Lain-lain',
];

/**
 * Normalizes Transaction objects
 */
export function sanitizeTransaction(raw: any, index: number = 0): Transaction {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `trx-auto-${Date.now()}-${index}`,
      date: new Date().toISOString().split('T')[0],
      title: 'Transaksi Pulih',
      category: 'Lain-lain',
      type: 'pengeluaran',
      amount: 0,
      notes: 'Dipulihkan otomatis oleh sistem.',
    };
  }

  const numericAmount = typeof raw.amount === 'number' && !isNaN(raw.amount) 
    ? raw.amount 
    : parseFloat(String(raw.amount || 0).replace(/[^0-9.-]+/g, '')) || 0;

  const validCategory: TransactionCategory = VALID_TRANSACTION_CATEGORIES.includes(raw.category)
    ? raw.category
    : 'Lain-lain';

  const validType: TransactionType = raw.type === 'pemasukan' ? 'pemasukan' : 'pengeluaran';

  return {
    id: String(raw.id || `trx-${Date.now()}-${index}`),
    date: String(raw.date || new Date().toISOString().split('T')[0]),
    title: String(raw.title || 'Transaksi'),
    category: validCategory,
    type: validType,
    amount: Math.max(0, numericAmount),
    notes: raw.notes ? String(raw.notes) : undefined,
    receiptNumber: raw.receiptNumber ? String(raw.receiptNumber) : undefined,
    proofUrl: raw.proofUrl ? String(raw.proofUrl) : undefined,
  };
}

const VALID_TASK_STATUSES: TaskStatus[] = ['Terencana', 'Berjalan', 'Selesai'];
const VALID_TASK_PRIORITIES: TaskPriority[] = ['Rendah', 'Sedang', 'Tinggi'];

/**
 * Normalizes Committee Task objects
 */
export function sanitizeTask(raw: any, index: number = 0): CommitteeTask {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `task-auto-${Date.now()}-${index}`,
      title: 'Tugas Operasional',
      assignee: 'Panitia',
      status: 'Terencana',
      priority: 'Sedang',
      dueDate: new Date().toISOString().split('T')[0],
    };
  }

  const validStatus: TaskStatus = VALID_TASK_STATUSES.includes(raw.status)
    ? raw.status
    : 'Terencana';

  const validPriority: TaskPriority = VALID_TASK_PRIORITIES.includes(raw.priority)
    ? raw.priority
    : 'Sedang';

  return {
    id: String(raw.id || `task-${Date.now()}-${index}`),
    title: String(raw.title || 'Tugas'),
    assignee: String(raw.assignee || 'Panitia'),
    status: validStatus,
    priority: validPriority,
    dueDate: String(raw.dueDate || new Date().toISOString().split('T')[0]),
  };
}

const VALID_INVENTORY_STATUSES: ('Tersedia' | 'Menunggu Pesanan' | 'Perlu Tambah')[] = [
  'Tersedia',
  'Menunggu Pesanan',
  'Perlu Tambah',
];

/**
 * Normalizes Inventory objects
 */
export function sanitizeInventory(raw: any, index: number = 0): InventoryItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `inv-auto-${Date.now()}-${index}`,
      itemName: 'Item Perlengkapan',
      quantity: 1,
      unit: 'Pcs',
      status: 'Tersedia',
      notes: 'Data dipulihkan otomatis.',
    };
  }

  const validStatus = VALID_INVENTORY_STATUSES.includes(raw.status)
    ? raw.status
    : 'Tersedia';

  return {
    id: String(raw.id || `inv-${Date.now()}-${index}`),
    itemName: String(raw.itemName || raw.name || 'Barang Perlengkapan'),
    quantity: typeof raw.quantity === 'number' && !isNaN(raw.quantity) ? raw.quantity : 1,
    unit: String(raw.unit || 'Pcs'),
    status: validStatus,
    notes: raw.notes ? String(raw.notes) : undefined,
  };
}

const VALID_DOC_CATEGORIES: ('SK Panitia' | 'Surat Edaran' | 'Surat Undangan' | 'Surat Permohonan' | 'Lainnya')[] = [
  'SK Panitia',
  'Surat Edaran',
  'Surat Undangan',
  'Surat Permohonan',
  'Lainnya',
];

const VALID_DOC_STATUSES: ('Diterbitkan' | 'Draf' | 'Arsip')[] = [
  'Diterbitkan',
  'Draf',
  'Arsip',
];

/**
 * Normalizes Official Document objects
 */
export function sanitizeDocument(raw: any, index: number = 0): OfficialDocument {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `doc-auto-${Date.now()}-${index}`,
      docNumber: `00${index + 1}/PAN-SIE/2026`,
      title: 'Dokumen Pulih',
      category: 'SK Panitia',
      date: new Date().toISOString().split('T')[0],
      sender: 'Panitia Sie Penganugerahan',
      content: 'Isi naskah dokumen resmi.',
      status: 'Diterbitkan',
    };
  }

  const validCategory = VALID_DOC_CATEGORIES.includes(raw.category)
    ? raw.category
    : 'SK Panitia';

  const validStatus = VALID_DOC_STATUSES.includes(raw.status)
    ? raw.status
    : 'Diterbitkan';

  return {
    id: String(raw.id || `doc-${Date.now()}-${index}`),
    docNumber: String(raw.docNumber || `00${index + 1}/PAN-SIE/2026`),
    title: String(raw.title || 'Dokumen Resmi'),
    category: validCategory,
    date: String(raw.date || new Date().toISOString().split('T')[0]),
    sender: String(raw.sender || 'Panitia Sie Penganugerahan'),
    content: String(raw.content || ''),
    status: validStatus,
    fileUrl: raw.fileUrl ? String(raw.fileUrl) : undefined,
  };
}

/**
 * Normalizes Regulation objects
 */
export function sanitizeRegulation(raw: any, index: number = 0): RegulationRule {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `reg-auto-${Date.now()}-${index}`,
      section: 'Ketentuan Umum',
      title: 'Ketentuan Resmi',
      description: 'Deskripsi ketentuan dan kriteria penilaian.',
      points: ['Ketentuan utama berlaku sesuai panduan panitia.'],
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  }

  return {
    id: String(raw.id || `reg-${Date.now()}-${index}`),
    section: String(raw.section || 'Ketentuan Umum'),
    title: String(raw.title || 'Kriteria Penilaian'),
    description: String(raw.description || ''),
    points: Array.isArray(raw.points) ? raw.points.map(String) : ['Ketentuan berlaku sesuai arahan panitia.'],
    lastUpdated: String(raw.lastUpdated || new Date().toISOString().split('T')[0]),
  };
}

/**
 * Global Self-Healing Error Interceptor
 * Prevents unhandled promises, network blips, or background exceptions from crashing the app
 */
let isGlobalInterceptorRegistered = false;

export function registerGlobalSelfHealingInterceptor(onNotify?: (message: string) => void) {
  if (isGlobalInterceptorRegistered || typeof window === 'undefined') return;
  isGlobalInterceptorRegistered = true;

  // Intercept unhandled promise rejections (e.g. Firebase offline timeouts, aborted fetches)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason || '');
    
    // Log for debugging but prevent runtime termination
    console.warn('[Self-Healing] Intercepted unhandled promise rejection:', message);

    // If it's a known non-fatal network/offline error, silently prevent default crash
    if (
      message.includes('offline') ||
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('quic') ||
      message.includes('longpolling') ||
      message.includes('AbortError') ||
      message.includes('cancelled')
    ) {
      event.preventDefault();
      return;
    }

    // Inform user gently if needed without breaking layout
    if (onNotify) {
      onNotify('Koneksi latar belakang diselaraskan kembali oleh sistem.');
    }
    event.preventDefault();
  });

  // Intercept runtime window errors (e.g. extension scripts, third-party script conflicts)
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    console.warn('[Self-Healing] Intercepted runtime window error:', message);

    // Prevent extension errors (like grammarly or translate) from killing the app
    if (
      message.includes('ResizeObserver') ||
      message.includes('Script error') ||
      message.includes('chrome-extension') ||
      message.includes('moz-extension')
    ) {
      event.preventDefault();
    }
  });

  console.log('✓ [Self-Healing] Sistem Pemulihan Otomatis Aktif (Auto-Recovery Active)');
}
