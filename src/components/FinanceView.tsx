import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Printer,
  FileSpreadsheet,
  Trash2,
  Calendar,
  FileText,
  CheckCircle2,
  Receipt,
  Upload,
  Image as ImageIcon,
  X,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  Loader2,
  Pencil,
  AlertTriangle,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle,
  Hash,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ListPlus,
  ClipboardPaste,
  TableProperties,
  Copy,
  Check,
  FileUp,
  Camera,
  Wallet,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Transaction, TransactionCategory, TransactionType, UserSession, RapbItem } from '../types';
import { DEFAULT_RAPB_ITEMS } from '../data/initialData';
import { uploadReceiptImage, compressImage } from '../services/storageService';
import { exportToCSV } from '../services/webhookService';
import {
  addTransactionToFirestore,
  updateTransactionInFirestore,
  deleteTransactionFromFirestore,
  addRapbItemToFirestore,
  updateRapbItemInFirestore,
  deleteRapbItemFromFirestore,
  bulkAddRapbItemsToFirestore,
  clearAllRapbItemsFromFirestore,
  subscribeRapbItems,
} from '../services/financeService';
import { ContentHeader } from './ContentHeader';
import { CollapsibleSection } from './CollapsibleSection';
import { RapbImportModal } from './RapbImportModal';

interface FinanceViewProps {
  transactions: Transaction[];
  onAddTransaction: (trx: Omit<Transaction, 'id'>) => Promise<Transaction | void> | void;
  onUpdateTransaction?: (trx: Transaction) => Promise<void> | void;
  onDeleteTransaction: (id: string) => Promise<void> | void;
  isAddModalOpenDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
  currentUser?: UserSession | null;
  rapbItems?: RapbItem[];
  onAddRapbItem?: (item: Omit<RapbItem, 'id'> | RapbItem) => Promise<RapbItem | void>;
  onUpdateRapbItem?: (item: RapbItem) => Promise<void>;
  onDeleteRapbItem?: (id: string) => Promise<void>;
  onBulkAddRapb?: (items: RapbItem[], mode: 'append' | 'replace') => Promise<void>;
  onClearAllRapb?: () => Promise<void>;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  isAddModalOpenDirectly = false,
  onCloseAddModalDirectly,
  currentUser,
  rapbItems: propRapbItems,
  onAddRapbItem,
  onUpdateRapbItem,
  onDeleteRapbItem,
  onBulkAddRapb,
  onClearAllRapb,
}) => {
  const isPetugas = currentUser?.category === 'petugas' || (currentUser?.role ? currentUser.role.toUpperCase().includes('PETUGAS') : false);
  // Seluruh panitia dan petugas aktif Sie Penganugerahan memiliki hak kelola RAPB & keuangan
  const isAdmin = true;

  // In-App Confirmation Dialog State (Tanpa window.confirm yang terblokir)
  const [rapbToDelete, setRapbToDelete] = useState<RapbItem | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [trxToDelete, setTrxToDelete] = useState<Transaction | null>(null);

  // In-App Toast Notification State (Success / Error / Info)
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Loading state when submitting transaction to Firestore
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);

  // RAPB State (persisted in Cloud Firestore with localStorage offline cache)
  const [localRapbItems, setLocalRapbItems] = useState<RapbItem[]>(() => {
    try {
      const saved = localStorage.getItem('sie_rapb_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse RAPB items from storage:', e);
    }
    return [];
  });

  // Subscribe to Cloud Firestore rapb_items collection if not passed from parent
  useEffect(() => {
    if (propRapbItems !== undefined) return;
    const unsub = subscribeRapbItems((items) => {
      setLocalRapbItems(items);
    });
    return () => unsub();
  }, [propRapbItems]);

  const rapbItems = propRapbItems !== undefined ? propRapbItems : localRapbItems;

  const saveRapbItems = async (items: RapbItem[], mode: 'append' | 'replace' = 'replace') => {
    setLocalRapbItems(items);
    try {
      localStorage.setItem('sie_rapb_items', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save RAPB items locally:', e);
    }

    try {
      if (onBulkAddRapb) {
        await onBulkAddRapb(items, mode);
      } else {
        if (mode === 'replace') {
          await clearAllRapbItemsFromFirestore();
          await bulkAddRapbItemsToFirestore(items);
        } else {
          await bulkAddRapbItemsToFirestore(items);
        }
      }
    } catch (err) {
      console.error('Failed to sync RAPB items to Firestore:', err);
    }
  };

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>('ALL');

  // Toggle Sembunyikan/Tampilkan Tabel Rekapitulasi Kategori (5 Pos Induk)
  const [showCategoryRecap, setShowCategoryRecap] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sie_show_category_recap');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleCategoryRecap = () => {
    setShowCategoryRecap((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sie_show_category_recap', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenDirectly);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Proof Image Preview Modal State
  const [selectedProofTrx, setSelectedProofTrx] = useState<Transaction | null>(null);

  // Modal Form State (Smart Input Form)
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('pengeluaran');
  const [category, setCategory] = useState<TransactionCategory>('SEKSI PENGANUGERAHAN');
  const [programName, setProgramName] = useState('');
  const [posCode, setPosCode] = useState('');
  const [qty, setQty] = useState<number | string>(1);
  const [unit, setUnit] = useState('buah');
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [amount, setAmount] = useState<number>(0);
  const [recipient, setRecipient] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Autocomplete Suggestions State
  const [autocompleteInput, setAutocompleteInput] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  // Proof Upload State & Mobile Input Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofUrlInput, setProofUrlInput] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // In-App Live Camera State
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startLiveCamera = async () => {
    try {
      setIsLiveCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Live camera stream notice, falling back to file input:', err);
      setIsLiveCameraOpen(false);
      const el = document.getElementById('camera-photo-input') as HTMLInputElement | null;
      if (el) el.click();
    }
  };

  const captureLiveFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(800, video.videoWidth || 640);
    canvas.height = Math.round(canvas.width * ((video.videoHeight || 480) / (video.videoWidth || 640)));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setProofPreviewUrl(dataUrl);
    }
    stopLiveCamera();
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
  };

  useEffect(() => {
    if (isLiveCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [isLiveCameraOpen, cameraStream]);

  // Saldo Kas Fisik (Penerimaan / Top-Up Kas) State
  const [isAddPemasukanModalOpen, setIsAddPemasukanModalOpen] = useState(false);
  const [showPemasukanListModal, setShowPemasukanListModal] = useState(false);
  const [pemasukanAmount, setPemasukanAmount] = useState<number | string>(1000000);
  const [pemasukanDate, setPemasukanDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pemasukanSource, setPemasukanSource] = useState('Dropping Kas Bendahara Milad');
  const [pemasukanPenyetor, setPemasukanPenyetor] = useState('Bendahara Umum Milad');
  const [pemasukanPenerima, setPemasukanPenerima] = useState(currentUser?.name || 'Bendahara Sie Penganugerahan');
  const [pemasukanNotes, setPemasukanNotes] = useState('');
  const [isSavingPemasukan, setIsSavingPemasukan] = useState(false);
  const [confirmDeletePemasukanId, setConfirmDeletePemasukanId] = useState<string | null>(null);

  // RAPB Management Modal (Single)
  const [isRapbModalOpen, setIsRapbModalOpen] = useState(false);
  const [editingRapb, setEditingRapb] = useState<RapbItem | null>(null);
  const [rapbPosInput, setRapbPosInput] = useState('');
  const [rapbNameInput, setRapbNameInput] = useState('');
  const [rapbQtmInput, setRapbQtmInput] = useState<number | string>(1);
  const [rapbQtmKetInput, setRapbQtmKetInput] = useState('Buah');
  const [rapbVolInput, setRapbVolInput] = useState<number | string>(1);
  const [rapbVolKetInput, setRapbVolKetInput] = useState('Kegiatan');
  const [rapbUnitPriceInput, setRapbUnitPriceInput] = useState<number | string>(1000000);
  const [rapbBudgetInput, setRapbBudgetInput] = useState<number>(1000000);
  const [rapbCatInput, setRapbCatInput] = useState<TransactionCategory>('SEKSI PENGANUGERAHAN');
  const [rapbDescInput, setRapbDescInput] = useState('');

  // Bulk RAPB Management Modal (Multi-Row / Paste / File Upload)
  const [isBulkRapbModalOpen, setIsBulkRapbModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'grid' | 'paste' | 'file'>('grid');
  const [bulkRows, setBulkRows] = useState<
    {
      id: string;
      posCode: string;
      programName: string;
      allocatedBudget: number | string;
      category: TransactionCategory;
      description: string;
    }[]
  >([]);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [uploadedRapbFileName, setUploadedRapbFileName] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [bulkSuccessNotice, setBulkSuccessNotice] = useState<string | null>(null);

  // Format Rupiah
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Financial Summary Calculations
  const totalPemasukan = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'pemasukan')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalPengeluaran = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const saldoSisa = totalPemasukan - totalPengeluaran;

  const totalPaguRapb = useMemo(() => {
    return rapbItems.reduce((sum, item) => sum + (Number(item.allocatedBudget) || 0), 0);
  }, [rapbItems]);

  // Per-Program Spending & Real-time Remaining Budget Mapping
  const rapbStats = useMemo(() => {
    return rapbItems.map((item) => {
      // Find transactions matching this RAPB item by posCode or programName with category validation
      const spent = transactions
        .filter((t) => {
          if (t.type !== 'pengeluaran') return false;
          // 1. Explicit posCode match
          if (t.posCode && item.posCode && t.posCode.trim().toUpperCase() === item.posCode.trim().toUpperCase()) {
            return true;
          }
          // 2. Program Name match with same Category
          if (
            t.programName &&
            item.programName &&
            t.programName.trim().toLowerCase() === item.programName.trim().toLowerCase() &&
            normalizeCategory(t.category) === normalizeCategory(item.category)
          ) {
            return true;
          }
          return false;
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const remaining = item.allocatedBudget - spent;
      const percentageUsed = item.allocatedBudget > 0 ? (spent / item.allocatedBudget) * 100 : 0;

      let statusText = 'Aman';
      let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      if (remaining < 0) {
        statusText = 'Defisit (Over Realita)';
        statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
      } else if (remaining === 0) {
        statusText = 'Habis';
        statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      } else if (percentageUsed >= 85) {
        statusText = 'Menipis';
        statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      }

      return {
        ...item,
        spent,
        remaining,
        percentageUsed: Math.min(percentageUsed, 100),
        rawPercentage: percentageUsed,
        statusText,
        statusColor,
      };
    });
  }, [rapbItems, transactions]);

  const totalSisaRapb = totalPaguRapb - totalPengeluaran;
  const totalRapbPenyerapan = totalPaguRapb > 0 ? (totalPengeluaran / totalPaguRapb) * 100 : 0;

  // Autocomplete matching: search keywords, program names, or pos codes
  const filteredSuggestions = useMemo(() => {
    const q = autocompleteInput.trim().toLowerCase();
    if (!q) return rapbItems;
    return rapbItems.filter((item) => {
      const matchName = item.programName.toLowerCase().includes(q);
      const matchPos = item.posCode.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(q));
      const matchCat = item.category.toLowerCase().includes(q);
      return matchName || matchPos || matchKeywords || matchCat;
    });
  }, [autocompleteInput, rapbItems]);

  // Selected Program Statistics for Live Form Preview
  const selectedProgramStat = useMemo(() => {
    if (!posCode && !programName) return null;
    return rapbStats.find(
      (s) =>
        (posCode && s.posCode.trim().toUpperCase() === posCode.trim().toUpperCase()) ||
        (programName && s.programName.trim().toLowerCase() === programName.trim().toLowerCase())
    ) || null;
  }, [posCode, programName, rapbStats]);

  // Handle Selection of Autocomplete Item
  const handleSelectProgram = (item: RapbItem) => {
    setProgramName(item.programName);
    setPosCode(item.posCode);
    const resolvedCat = resolveCategoryFromPos(item.posCode) || normalizeCategory(item.category);
    setCategory(resolvedCat);
    setAutocompleteInput(item.programName);
    setIsAutocompleteOpen(false);

    // Provide default title if empty
    if (!title.trim()) {
      setTitle(item.programName);
    }
  };

  // Recalculate Total Amount on Qty or Unit Price change
  const handleQtyChange = (val: string) => {
    setQty(val);
    const numQty = parseFloat(val) || 0;
    const numUnitPrice = typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice) || 0;
    if (numQty > 0 && numUnitPrice > 0) {
      setAmount(Math.round(numQty * numUnitPrice));
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const numUnitPrice = parseFloat(val) || 0;
    const numQty = typeof qty === 'number' ? qty : parseFloat(qty) || 1;
    if (numQty > 0 && numUnitPrice > 0) {
      setAmount(Math.round(numQty * numUnitPrice));
    }
  };

  // Open Add Transaction Modal (supports prefilledPos and prefilledCat)
  const handleOpenAdd = (prefilledPos?: string, prefilledCat?: TransactionCategory) => {
    setEditingTransaction(null);
    setType('pengeluaran');
    setDate(new Date().toISOString().split('T')[0]);
    setReceiptNumber(`NOT-${Math.floor(100 + Math.random() * 900)}`);
    setQty(1);
    setUnit('buah');
    setUnitPrice('');
    setAmount(0);
    setRecipient('');
    setNotes('');
    setProofFile(null);
    setProofPreviewUrl(null);
    setIsUploadingProof(false);

    if (prefilledPos) {
      const cleanPos = prefilledPos.trim().toUpperCase();
      const matched = rapbItems.find((r) => r.posCode && r.posCode.trim().toUpperCase() === cleanPos);
      if (matched) {
        setProgramName(matched.programName);
        setPosCode(matched.posCode);
        const resolved = resolveCategoryFromPos(matched.posCode) || normalizeCategory(matched.category);
        setCategory(resolved);
        setTitle(matched.programName);
        setAutocompleteInput(matched.programName);
      } else {
        setProgramName('');
        setPosCode(prefilledPos);
        const resolved = resolveCategoryFromPos(prefilledPos) || prefilledCat || 'SEKSI PENGANUGERAHAN';
        setCategory(resolved);
        setTitle('');
        setAutocompleteInput('');
      }
    } else {
      setProgramName('');
      setPosCode('');
      setCategory(prefilledCat || 'SEKSI PENGANUGERAHAN');
      setTitle('');
      setAutocompleteInput('');
    }

    setIsModalOpen(true);
  };

  // Open Edit Transaction Modal
  const handleOpenEdit = (trx: Transaction) => {
    setEditingTransaction(trx);
    setTitle(trx.title);
    setType(trx.type);
    setCategory(getEffectiveCategory(trx) as TransactionCategory);
    setDate(trx.date);
    setProgramName(trx.programName || '');
    setPosCode(trx.posCode || '');
    setQty(trx.qty !== undefined ? trx.qty : 1);
    setUnit(trx.unit || 'buah');
    setUnitPrice(trx.unitPrice !== undefined ? trx.unitPrice : trx.amount);
    setAmount(trx.amount);
    setRecipient(trx.recipient || '');
    setNotes(trx.notes || '');
    setReceiptNumber(trx.receiptNumber || '');
    setAutocompleteInput(trx.programName || '');
    setProofFile(null);
    setProofPreviewUrl(trx.proofUrl || null);
    setIsUploadingProof(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    stopLiveCamera();
    setIsModalOpen(false);
    setEditingTransaction(null);
    setProofFile(null);
    setProofPreviewUrl(null);
    setProofUrlInput('');
    setIsUploadingProof(false);
    setIsAutocompleteOpen(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setIsUploadingProof(true);
      try {
        const compressed = await compressImage(file, 1000, 0.75);
        setProofPreviewUrl(compressed);
      } catch (err) {
        console.warn('Canvas compression notice, falling back to direct reader:', err);
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setProofPreviewUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingProof(false);
      }
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreviewUrl(null);
    setProofUrlInput('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Simpan Penambahan Saldo Kas Fisik (Penerimaan / Top-Up Kas) langsung ke Firestore
  const handleSavePemasukan = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof pemasukanAmount === 'number' ? pemasukanAmount : parseFloat(pemasukanAmount) || 0;
    if (numAmount <= 0) {
      setToast({
        type: 'error',
        title: 'Nominal Tidak Valid',
        message: 'Nominal saldo masuk harus lebih besar dari Rp 0.',
      });
      return;
    }

    setIsSavingPemasukan(true);
    try {
      const payload: Omit<Transaction, 'id'> = {
        title: pemasukanSource.trim() || 'Penerimaan Kas Panitia',
        type: 'pemasukan',
        category: 'SEKSI PENGANUGERAHAN',
        amount: numAmount,
        date: pemasukanDate || new Date().toISOString().split('T')[0],
        recipient: pemasukanPenerima.trim() || currentUser?.name || 'Bendahara Sie Penganugerahan',
        notes: `Penyetor: ${pemasukanPenyetor.trim() || 'Bendahara Umum'}${pemasukanNotes ? ` • ${pemasukanNotes.trim()}` : ''}`,
        programName: 'Penerimaan Saldo Kas Fisik',
        receiptNumber: `KAS-IN-${Date.now().toString().slice(-4)}`,
        proofUrl: '',
      };

      const created = await addTransactionToFirestore(payload);
      if (onAddTransaction) {
        await onAddTransaction(created);
      }

      setToast({
        type: 'success',
        title: 'Saldo Berhasil Ditambahkan',
        message: `Saldo kas sebesar ${formatIDR(numAmount)} berhasil ditambahkan ke Saldo Fisik!`,
      });

      setIsAddPemasukanModalOpen(false);
      setPemasukanAmount(1000000);
      setPemasukanNotes('');
    } catch (err: any) {
      console.error('Gagal menyimpan saldo kas fisik:', err);
      setToast({
        type: 'error',
        title: 'Gagal Menambah Saldo',
        message: err?.message || 'Gagal menambahkan saldo kas ke Firebase Firestore. Silakan coba lagi.',
      });
    } finally {
      setIsSavingPemasukan(false);
    }
  };

  // 5 Kategori Akun Induk Resmi Sie Penganugerahan
  const categoriesList: TransactionCategory[] = [
    'SEKSI PENGANUGERAHAN',
    'PENGANUGERAHAN (25.200)',
    'HADIAH LOMBA (25.300)',
    'JUARAWAN MMU DAN DAERAH (25.400)',
    'LAIN-LAIN (25.500)',
  ];

  /**
   * Deteksi pasti kategori resmi berdasarkan pola kode pos RAPB.
   * 251xx -> SEKSI PENGANUGERAHAN
   * 252xx -> PENGANUGERAHAN (25.200)
   * 253xx -> HADIAH LOMBA (25.300)
   * 254xx -> JUARAWAN MMU DAN DAERAH (25.400)
   * 255xx -> LAIN-LAIN (25.500)
   */
  const resolveCategoryFromPos = (pos?: string): TransactionCategory | null => {
    if (!pos) return null;
    const clean = pos.trim().toUpperCase();
    const digits = clean.replace(/[^0-9]/g, '');
    if (digits.startsWith('251') || clean.startsWith('POS-01') || clean.startsWith('POS-07')) {
      return 'SEKSI PENGANUGERAHAN';
    }
    if (digits.startsWith('252') || clean.startsWith('POS-02') || clean.startsWith('POS-03') || clean.startsWith('POS-04')) {
      return 'PENGANUGERAHAN (25.200)';
    }
    if (digits.startsWith('253') || clean.startsWith('POS-05')) {
      return 'HADIAH LOMBA (25.300)';
    }
    if (digits.startsWith('254') || clean.startsWith('POS-06')) {
      return 'JUARAWAN MMU DAN DAERAH (25.400)';
    }
    if (digits.startsWith('255')) {
      return 'LAIN-LAIN (25.500)';
    }
    return null;
  };

  /**
   * Normalisasi kategori ke 1 dari 5 kategori resmi.
   * Jangan pernah mengembalikan 'LAIN-LAIN' jika tidak ada pos/kategori 255!
   */
  const normalizeCategory = (cat?: string): TransactionCategory => {
    if (!cat) return 'SEKSI PENGANUGERAHAN';
    const clean = cat.trim();
    if (categoriesList.includes(clean as TransactionCategory)) return clean as TransactionCategory;
    const upper = clean.toUpperCase();

    if (
      upper.includes('251') ||
      upper.includes('25.1') ||
      upper.includes('SEKSI') ||
      upper.includes('RAPAT') ||
      upper.includes('RAKER') ||
      upper.includes('KONSUMSI') ||
      upper.includes('KAS') ||
      upper.includes('SPONSOR') ||
      upper.includes('PENGANUGRAHAN') ||
      upper.includes('PENGANUGERAHAN')
    ) {
      return 'SEKSI PENGANUGERAHAN';
    }
    if (
      upper.includes('252') ||
      upper.includes('25.2') ||
      upper.includes('25.200') ||
      upper.includes('TROFI') ||
      upper.includes('PLAKAT') ||
      upper.includes('SERTIFIKAT') ||
      upper.includes('MEDALI') ||
      upper.includes('SELEMPANG') ||
      upper.includes('SURBAN')
    ) {
      return 'PENGANUGERAHAN (25.200)';
    }
    if (
      upper.includes('253') ||
      upper.includes('25.3') ||
      upper.includes('25.300') ||
      upper.includes('HADIAH LOMBA') ||
      upper.includes('LOMBA') ||
      upper.includes('MQK') ||
      upper.includes('MTQ')
    ) {
      return 'HADIAH LOMBA (25.300)';
    }
    if (
      upper.includes('254') ||
      upper.includes('25.4') ||
      upper.includes('25.400') ||
      upper.includes('JUARAWAN') ||
      upper.includes('MMU') ||
      upper.includes('DAERAH')
    ) {
      return 'JUARAWAN MMU DAN DAERAH (25.400)';
    }
    if (
      upper.includes('255') ||
      upper.includes('25.5') ||
      upper.includes('25.500') ||
      upper.includes('LAIN-LAIN')
    ) {
      return 'LAIN-LAIN (25.500)';
    }
    return 'SEKSI PENGANUGERAHAN';
  };

  /**
   * Dapatkan kategori efektif dari transaksi:
   * 1. Cek kode pos langsung (251xx -> Seksi Penganugerahan, dsb)
   * 2. Cek kecocokan di RAPB items (posCode, programName, keywords)
   * 3. Analisis kata kunci judul / nama program
   * 4. Kategori yang disimpan
   */
  const getEffectiveCategory = (t: { category?: string; posCode?: string; programName?: string; title?: string }): TransactionCategory => {
    // 1. Cek dari kode pos langsung (akurasi 100%)
    if (t.posCode) {
      const fromPos = resolveCategoryFromPos(t.posCode);
      if (fromPos) return fromPos;
    }

    // 2. Cek dari referensi item RAPB
    const cleanPos = (t.posCode || '').trim().toUpperCase();
    const normPos = cleanPos.replace(/[^0-9A-Z]/g, '');
    const cleanProg = (t.programName || '').trim().toLowerCase();
    const cleanTitle = (t.title || '').trim().toLowerCase();

    if (cleanPos || cleanProg || cleanTitle) {
      const matched = rapbItems.find((r) => {
        const rPos = (r.posCode || '').trim().toUpperCase();
        const rNormPos = rPos.replace(/[^0-9A-Z]/g, '');
        const rName = (r.programName || '').trim().toLowerCase();

        if (cleanPos && rPos && cleanPos === rPos) return true;
        if (normPos && rNormPos && normPos === rNormPos) return true;
        if (cleanProg && rName && (cleanProg === rName || cleanProg.includes(rName) || rName.includes(cleanProg))) return true;
        if (cleanTitle && rName && (cleanTitle === rName || cleanTitle.includes(rName) || rName.includes(cleanTitle))) return true;
        if (r.keywords && r.keywords.some((kw) => cleanTitle.includes(kw.toLowerCase()) || cleanProg.includes(kw.toLowerCase()))) return true;
        return false;
      });

      if (matched && matched.category) {
        return resolveCategoryFromPos(matched.posCode) || normalizeCategory(matched.category);
      }
    }

    // 3. Analisis semantik dari Judul atau Program Name
    const combinedText = `${cleanTitle} ${cleanProg}`.toUpperCase();
    if (
      combinedText.includes('251') ||
      combinedText.includes('RAPAT') ||
      combinedText.includes('RAKER') ||
      combinedText.includes('KONSUMSI') ||
      combinedText.includes('SEKSI') ||
      combinedText.includes('PENGANUGRAHAN') ||
      combinedText.includes('PENGANUGERAHAN')
    ) {
      return 'SEKSI PENGANUGERAHAN';
    }
    if (
      combinedText.includes('252') ||
      combinedText.includes('TROFI') ||
      combinedText.includes('PLAKAT') ||
      combinedText.includes('SERTIFIKAT') ||
      combinedText.includes('MEDALI') ||
      combinedText.includes('SELEMPANG') ||
      combinedText.includes('SURBAN')
    ) {
      return 'PENGANUGERAHAN (25.200)';
    }
    if (
      combinedText.includes('253') ||
      combinedText.includes('HADIAH') ||
      combinedText.includes('LOMBA') ||
      combinedText.includes('MQK') ||
      combinedText.includes('MTQ')
    ) {
      return 'HADIAH LOMBA (25.300)';
    }
    if (
      combinedText.includes('254') ||
      combinedText.includes('JUARAWAN') ||
      combinedText.includes('MMU') ||
      combinedText.includes('DAERAH')
    ) {
      return 'JUARAWAN MMU DAN DAERAH (25.400)';
    }
    if (combinedText.includes('255') || combinedText.includes('LAIN-LAIN')) {
      return 'LAIN-LAIN (25.500)';
    }

    // 4. Cek kategori transaksi tersimpan jika valid
    if (t.category && categoriesList.includes(t.category as TransactionCategory)) {
      return t.category as TransactionCategory;
    }

    return normalizeCategory(t.category);
  };

  // Handle Form Submit: langsung simpan ke koleksi 'transactions' di Firebase Firestore menggunakan addDoc
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    let uploadedProofUrl: string | undefined = editingTransaction?.proofUrl;

    if (proofPreviewUrl && proofPreviewUrl.startsWith('data:')) {
      // Foto telah terkompresi di memori: gunakan langsung untuk penyimpanan instan (0.1 detik)
      uploadedProofUrl = proofPreviewUrl;
    } else if (proofFile) {
      setIsUploadingProof(true);
      try {
        uploadedProofUrl = await uploadReceiptImage(proofFile);
      } catch (err) {
        console.error('Gagal mengunggah foto kuitansi:', err);
      } finally {
        setIsUploadingProof(false);
      }
    } else if (proofUrlInput && proofUrlInput.trim()) {
      uploadedProofUrl = proofUrlInput.trim();
    } else if (proofPreviewUrl === null) {
      uploadedProofUrl = undefined;
    }

    const numQty = typeof qty === 'number' ? qty : parseFloat(qty) || 1;
    const numUnitPrice = typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice) || amount;

    // Resolve matching RAPB item
    const matchedRapb = rapbItems.find(
      (r) =>
        (posCode && r.posCode && r.posCode.trim().toUpperCase() === posCode.trim().toUpperCase()) ||
        (posCode && r.posCode && r.posCode.replace(/[^0-9A-Z]/g, '') === posCode.replace(/[^0-9A-Z]/g, '')) ||
        (programName && r.programName && r.programName.trim().toLowerCase() === programName.trim().toLowerCase()) ||
        (title && r.programName && title.trim().toLowerCase() === r.programName.trim().toLowerCase())
    );

    // Kategori pasti: prioritas dari posCode, kemudian dari item RAPB, atau pilihan form pengguna
    let finalCategory: TransactionCategory = category;
    const fromPos = resolveCategoryFromPos(posCode);
    if (fromPos) {
      finalCategory = fromPos;
    } else if (matchedRapb && matchedRapb.category) {
      finalCategory = normalizeCategory(matchedRapb.category);
    } else {
      finalCategory = normalizeCategory(category);
    }

    // Hitung sisa anggaran real-time saat transaksi disimpan
    let calculatedRemaining: number | undefined = undefined;
    if (selectedProgramStat) {
      calculatedRemaining = Math.max(0, selectedProgramStat.remaining - amount);
    } else if (matchedRapb) {
      const currentSpent = transactions
        .filter((t) => t.type === 'pengeluaran' && (t.posCode === matchedRapb.posCode || t.programName === matchedRapb.programName))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      calculatedRemaining = Math.max(0, matchedRapb.allocatedBudget - (currentSpent + amount));
    }

    const trxPayload: Omit<Transaction, 'id'> = {
      title: title.trim(),
      type,
      category: finalCategory,
      amount,
      date,
      notes: notes.trim() || undefined,
      receiptNumber: receiptNumber.trim() || `NOT-${Date.now().toString().slice(-4)}`,
      proofUrl: uploadedProofUrl || '',
      programName: programName.trim() || title.trim(),
      posCode: posCode.trim() || undefined,
      qty: type === 'pengeluaran' ? numQty : undefined,
      unit: type === 'pengeluaran' ? unit.trim() || undefined : undefined,
      unitPrice: type === 'pengeluaran' ? numUnitPrice : undefined,
      recipient: recipient.trim() || undefined,
      remainingBudget: calculatedRemaining,
    };

    setIsSubmittingTransaction(true);

    try {
      if (editingTransaction && onUpdateTransaction) {
        // Mode Edit: update data di Firestore
        const updatedObj: Transaction = {
          ...editingTransaction,
          ...trxPayload,
        };
        await updateTransactionInFirestore(updatedObj);
        await onUpdateTransaction(updatedObj);
        setToast({
          type: 'success',
          title: 'Perubahan Berhasil Disimpan',
          message: `Transaksi "${title}" telah diperbarui di Firebase Firestore.`,
        });
      } else {
        // Mode Tambah: langsung simpan ke koleksi 'transactions' via addDoc
        const created = await addTransactionToFirestore(trxPayload);
        if (onAddTransaction) {
          await onAddTransaction(created);
        }
        setToast({
          type: 'success',
          title: 'Berhasil Disimpan ke Firebase Firestore!',
          message: `Transaksi "${title}" (Nominal: ${formatIDR(amount)}, Pos: ${posCode || '-'}, Kategori: ${finalCategory}) berhasil disimpan ke koleksi 'transactions' via addDoc().`,
        });
      }

      closeModal();
    } catch (err: any) {
      console.error('Gagal menyimpan transaksi ke Firebase Firestore:', err);
      setToast({
        type: 'error',
        title: 'Gagal Menyimpan ke Firebase Firestore',
        message: err?.message || 'Terjadi kendala saat menyimpan transaksi. Silakan coba kembali.',
      });
    } finally {
      setIsSubmittingTransaction(false);
    }
  };

  // Export CSV Handler
  const handleExportFinance = async () => {
    const headers = [
      'Tanggal',
      'No. Bukti / Nota',
      'Kode Pos',
      'Nama Kegiatan / Program',
      'Kategori',
      'Jenis Arus Kas',
      'Qty',
      'Satuan',
      'Harga Satuan (Rp)',
      'Total Nominal (Rp)',
      'Sisa Anggaran (Rp)',
      'Penerima / Rekanan',
      'Keterangan Tambahan',
    ];

    const rows = transactions.map((t) => [
      t.date,
      t.receiptNumber || '-',
      t.posCode || '-',
      t.programName || t.title,
      t.category,
      t.type === 'pemasukan' ? 'Pemasukan (+)' : 'Pengeluaran (-)',
      t.qty !== undefined ? t.qty : '-',
      t.unit || '-',
      t.unitPrice !== undefined ? t.unitPrice : '-',
      t.amount,
      t.remainingBudget !== undefined ? t.remainingBudget : '-',
      t.recipient || '-',
      t.notes || '-',
    ]);

    exportToCSV('Laporan_Keuangan_RAPB_Sie_Penganugerahan.csv', headers, rows);
  };

  // Sinkronisasi otomatis mandiri (Self-healing): perbaiki transaksi di Firestore yang tersimpan dengan kategori keliru
  useEffect(() => {
    if (!rapbItems || rapbItems.length === 0) return;
    transactions.forEach((t) => {
      if (t.type === 'pengeluaran' && (t.posCode || t.programName)) {
        const eff = getEffectiveCategory(t);
        if (t.category !== eff && onUpdateTransaction) {
          onUpdateTransaction({
            ...t,
            category: eff,
          });
        }
      }
    });
  }, [transactions.length, rapbItems.length]);

  // Rekapitulasi Realisasi per Kategori (Pagu, Pengeluaran, Sisa Dana)
  const categoryStats = useMemo(() => {
    return categoriesList.map((cat, idx) => {
      const matchedRapb = rapbItems.filter(
        (i) => (resolveCategoryFromPos(i.posCode) || normalizeCategory(i.category)) === cat
      );
      const pagu = matchedRapb.reduce((sum, item) => sum + (Number(item.allocatedBudget) || 0), 0);
      const posCount = matchedRapb.length;

      const matchedTrx = transactions.filter(
        (t) => t.type === 'pengeluaran' && getEffectiveCategory(t) === cat
      );
      const spent = matchedTrx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const trxCount = matchedTrx.length;

      const remaining = pagu - spent;
      const percentageUsed = pagu > 0 ? (spent / pagu) * 100 : spent > 0 ? 100 : 0;

      let statusText = 'Aman';
      let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      if (remaining < 0) {
        statusText = 'Defisit';
        statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
      } else if (remaining === 0 && pagu > 0) {
        statusText = 'Habis';
        statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      } else if (percentageUsed >= 85) {
        statusText = 'Menipis';
        statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      }

      return {
        number: idx + 1,
        category: cat,
        pagu,
        posCount,
        spent,
        trxCount,
        remaining,
        percentageUsed: Math.min(percentageUsed, 100),
        rawPercentage: percentageUsed,
        statusText,
        statusColor,
      };
    });
  }, [categoriesList, rapbItems, transactions]);

  const totalCategoryPagu = useMemo(() => {
    return categoryStats.reduce((sum, c) => sum + c.pagu, 0);
  }, [categoryStats]);

  const totalCategorySpent = useMemo(() => {
    return categoryStats.reduce((sum, c) => sum + c.spent, 0);
  }, [categoryStats]);

  const totalCategoryRemaining = totalCategoryPagu - totalCategorySpent;
  const totalCategorySerap = totalCategoryPagu > 0 ? (totalCategorySpent / totalCategoryPagu) * 100 : 0;

  const pieData = categoriesList
    .map((cat) => {
      const sum = transactions
        .filter((t) => getEffectiveCategory(t) === cat && t.type === 'pengeluaran')
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      return { name: cat, value: sum };
    })
    .filter((d) => d.value > 0);

  const COLORS = ['#8a7c4c', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

  // Filtered Transactions
  const filteredTransactions = transactions.filter((t) => {
    const q = searchTerm.toLowerCase();
    const effCat = getEffectiveCategory(t);
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      effCat.toLowerCase().includes(q) ||
      (t.programName && t.programName.toLowerCase().includes(q)) ||
      (t.posCode && t.posCode.toLowerCase().includes(q)) ||
      (t.recipient && t.recipient.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q));

    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || effCat === categoryFilter;
    const matchesPos = selectedPosFilter === 'ALL' || t.posCode === selectedPosFilter;

    return matchesSearch && matchesType && matchesCategory && matchesPos;
  });

  // Receipts List for LPJ Appendix
  const receiptTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'pengeluaran' && t.proofUrl);
  }, [transactions]);

  // Auto-recalculate RAPB Budget: JUMLAH = QTM * VOL * SATUAN
  const handleRapbQtmChange = (val: string) => {
    setRapbQtmInput(val);
    const q = parseFloat(val) || 0;
    const v = typeof rapbVolInput === 'number' ? rapbVolInput : parseFloat(String(rapbVolInput)) || 1;
    const u = typeof rapbUnitPriceInput === 'number' ? rapbUnitPriceInput : parseFloat(String(rapbUnitPriceInput)) || 0;
    if (q > 0 && v > 0 && u > 0) {
      setRapbBudgetInput(Math.round(q * v * u));
    }
  };

  const handleRapbVolChange = (val: string) => {
    setRapbVolInput(val);
    const q = typeof rapbQtmInput === 'number' ? rapbQtmInput : parseFloat(String(rapbQtmInput)) || 1;
    const v = parseFloat(val) || 0;
    const u = typeof rapbUnitPriceInput === 'number' ? rapbUnitPriceInput : parseFloat(String(rapbUnitPriceInput)) || 0;
    if (q > 0 && v > 0 && u > 0) {
      setRapbBudgetInput(Math.round(q * v * u));
    }
  };

  const handleRapbUnitPriceChange = (val: string) => {
    setRapbUnitPriceInput(val);
    const q = typeof rapbQtmInput === 'number' ? rapbQtmInput : parseFloat(String(rapbQtmInput)) || 1;
    const v = typeof rapbVolInput === 'number' ? rapbVolInput : parseFloat(String(rapbVolInput)) || 1;
    const u = parseFloat(val) || 0;
    if (q > 0 && v > 0 && u > 0) {
      setRapbBudgetInput(Math.round(q * v * u));
    }
  };

  // Save / Update RAPB Program directly to Firestore
  const handleSaveRapbItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rapbPosInput.trim() || !rapbNameInput.trim()) return;

    const numQtm = typeof rapbQtmInput === 'number' ? rapbQtmInput : parseFloat(String(rapbQtmInput)) || 1;
    const numVol = typeof rapbVolInput === 'number' ? rapbVolInput : parseFloat(String(rapbVolInput)) || 1;
    const numUnitPrice = typeof rapbUnitPriceInput === 'number' ? rapbUnitPriceInput : parseFloat(String(rapbUnitPriceInput)) || rapbBudgetInput;
    const computedBudget = Number(rapbBudgetInput) > 0 ? Number(rapbBudgetInput) : Math.round(numQtm * numVol * numUnitPrice);

    if (editingRapb) {
      const updated: RapbItem = {
        ...editingRapb,
        posCode: rapbPosInput.trim().toUpperCase(),
        programName: rapbNameInput.trim(),
        qtm: numQtm,
        qtmKet: rapbQtmKetInput.trim() || undefined,
        vol: numVol,
        volKet: rapbVolKetInput.trim() || undefined,
        unitPrice: numUnitPrice,
        allocatedBudget: computedBudget,
        category: rapbCatInput,
        description: rapbDescInput.trim() || undefined,
      };

      setLocalRapbItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      try {
        if (onUpdateRapbItem) {
          await onUpdateRapbItem(updated);
        } else {
          await updateRapbItemInFirestore(updated);
        }
        setBulkSuccessNotice(`Pos anggaran ${updated.posCode} berhasil diperbarui di Cloud Firebase.`);
      } catch (err) {
        console.error('Gagal memperbarui pos di Firestore:', err);
      }
    } else {
      const newItem: RapbItem = {
        id: `rapb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        posCode: rapbPosInput.trim().toUpperCase(),
        programName: rapbNameInput.trim(),
        qtm: numQtm,
        qtmKet: rapbQtmKetInput.trim() || undefined,
        vol: numVol,
        volKet: rapbVolKetInput.trim() || undefined,
        unitPrice: numUnitPrice,
        allocatedBudget: computedBudget,
        category: rapbCatInput,
        description: rapbDescInput.trim() || undefined,
        keywords: [rapbNameInput.toLowerCase(), rapbPosInput.toLowerCase()],
      };

      setLocalRapbItems((prev) => [...prev, newItem]);
      try {
        if (onAddRapbItem) {
          await onAddRapbItem(newItem);
        } else {
          await addRapbItemToFirestore(newItem);
        }
        setBulkSuccessNotice(`Pos anggaran ${newItem.posCode} berhasil disimpan ke Cloud Firebase.`);
      } catch (err) {
        console.error('Gagal menambah pos ke Firestore:', err);
      }
    }
    setIsRapbModalOpen(false);
    setEditingRapb(null);
    setTimeout(() => setBulkSuccessNotice(null), 3500);
  };

  const handleOpenEditRapb = (item: RapbItem) => {
    setEditingRapb(item);
    setRapbPosInput(item.posCode);
    setRapbNameInput(item.programName);
    setRapbQtmInput(item.qtm ?? 1);
    setRapbQtmKetInput(item.qtmKet || 'Buah');
    setRapbVolInput(item.vol ?? 1);
    setRapbVolKetInput(item.volKet || 'Kegiatan');
    setRapbUnitPriceInput(item.unitPrice ?? item.allocatedBudget);
    setRapbBudgetInput(item.allocatedBudget);
    setRapbCatInput(item.category);
    setRapbDescInput(item.description || '');
    setIsRapbModalOpen(true);
  };

  const handleDeleteRapb = (id: string) => {
    const target = rapbItems.find((i) => i.id === id);
    if (target) {
      setRapbToDelete(target);
    }
  };

  const executeConfirmDeleteRapb = async () => {
    if (!rapbToDelete) return;
    const target = rapbToDelete;
    const updated = rapbItems.filter((i) => i.id !== target.id);
    setLocalRapbItems(updated);
    setRapbToDelete(null);
    if (editingRapb?.id === target.id) {
      setIsRapbModalOpen(false);
    }

    try {
      if (onDeleteRapbItem) {
        await onDeleteRapbItem(target.id);
      } else {
        await deleteRapbItemFromFirestore(target.id);
      }
      setBulkSuccessNotice(`Pos anggaran ${target.posCode} (${target.programName}) berhasil dihapus dari Cloud Firebase.`);
    } catch (err) {
      console.error('Gagal menghapus pos dari Firestore:', err);
    }
    setTimeout(() => setBulkSuccessNotice(null), 3000);
  };

  const handleClearAllRapb = () => {
    setShowClearAllConfirm(true);
  };

  const executeConfirmClearAllRapb = async () => {
    setLocalRapbItems([]);
    setShowClearAllConfirm(false);
    try {
      if (onClearAllRapb) {
        await onClearAllRapb();
      } else {
        await clearAllRapbItemsFromFirestore();
      }
      setBulkSuccessNotice('Seluruh data realita RAPB berhasil dikosongkan dari Cloud Firebase.');
    } catch (err) {
      console.error('Gagal mengosongkan pos di Firestore:', err);
    }
    setTimeout(() => setBulkSuccessNotice(null), 3500);
  };

  const executeConfirmDeleteTrx = () => {
    if (!trxToDelete) return;
    onDeleteTransaction(trxToDelete.id);
    const trxTitle = trxToDelete.title;
    setTrxToDelete(null);
    setBulkSuccessNotice(`Transaksi "${trxTitle}" berhasil dihapus.`);
    setTimeout(() => setBulkSuccessNotice(null), 3000);
  };

  // Open Bulk RAPB Modal with Auto-Incremented Starter Rows
  const openBulkRapbModal = () => {
    const nextNum = rapbItems.length + 1;
    setBulkRows([
      {
        id: `row-${Date.now()}-1`,
        posCode: `POS-${String(nextNum).padStart(2, '0')}`,
        programName: '',
        allocatedBudget: 1500000,
        category: 'SEKSI PENGANUGERAHAN',
        description: '',
      },
      {
        id: `row-${Date.now()}-2`,
        posCode: `POS-${String(nextNum + 1).padStart(2, '0')}`,
        programName: '',
        allocatedBudget: 2000000,
        category: 'PENGANUGERAHAN (25.200)',
        description: '',
      },
      {
        id: `row-${Date.now()}-3`,
        posCode: `POS-${String(nextNum + 2).padStart(2, '0')}`,
        programName: '',
        allocatedBudget: 1000000,
        category: 'HADIAH LOMBA (25.300)',
        description: '',
      },
    ]);
    setBulkPasteText('');
    setUploadedRapbFileName(null);
    setBulkMode('grid');
    setIsBulkRapbModalOpen(true);
  };

  const handleRapbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadedRapbFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      // JSON parser
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const formatted = parsed
              .map((item: any, idx: number) => {
                const code = item.posCode || item.code || `POS-${String(rapbItems.length + idx + 1).padStart(2, '0')}`;
                const name = item.programName || item.title || item.name || '';
                const budget = Number(item.allocatedBudget || item.budget || item.amount || 0);
                const cat = item.category || 'Lain-lain';
                const desc = item.description || item.notes || '';
                return `${code} | ${name} | ${budget} | ${cat} | ${desc}`;
              })
              .join('\n');
            setBulkPasteText(formatted);
            setBulkMode('file');
            return;
          }
        } catch (err) {
          console.warn('Failed to parse RAPB JSON, falling back to text:', err);
        }
      }

      // Plain text, CSV, TSV
      setBulkPasteText(content);
      setBulkMode('file');
    };
    reader.readAsText(file);
  };

  const addBulkRow = () => {
    const nextIndex = rapbItems.length + bulkRows.length + 1;
    setBulkRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length + 1}`,
        posCode: `POS-${String(nextIndex).padStart(2, '0')}`,
        programName: '',
        allocatedBudget: 1000000,
        category: 'LAIN-LAIN (25.500)',
        description: '',
      },
    ]);
  };

  const removeBulkRow = (id: string) => {
    setBulkRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const updateBulkRow = (id: string, field: string, value: any) => {
    setBulkRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Parser for Paste / Spreadsheet Copy Mode
  const parsedPasteRows = useMemo(() => {
    if (!bulkPasteText.trim()) return [];
    const lines = bulkPasteText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return lines.map((line, idx) => {
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim());
      } else if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim());
      } else if (line.includes(';')) {
        parts = line.split(';').map((p) => p.trim());
      } else {
        parts = line.split(',').map((p) => p.trim());
      }

      let code = '';
      let name = '';
      let budget = 0;
      let cat: TransactionCategory = 'LAIN-LAIN (25.500)';
      let desc = '';

      if (parts[0] && parts[0].toUpperCase().startsWith('POS')) {
        code = parts[0].toUpperCase();
        name = parts[1] || '';
        const budgetRaw = parts[2] ? parts[2].replace(/[^0-9]/g, '') : '0';
        budget = parseInt(budgetRaw, 10) || 0;
        const matchedCat = categoriesList.find((c) => parts[3] && c.toLowerCase() === parts[3].toLowerCase());
        cat = matchedCat || 'LAIN-LAIN (25.500)';
        desc = parts[4] || '';
      } else {
        code = `POS-${String(rapbItems.length + idx + 1).padStart(2, '0')}`;
        name = parts[0] || '';
        const budgetRaw = parts[1] ? parts[1].replace(/[^0-9]/g, '') : '0';
        budget = parseInt(budgetRaw, 10) || 0;
        const matchedCat = categoriesList.find((c) => parts[2] && c.toLowerCase() === parts[2].toLowerCase());
        cat = matchedCat || 'LAIN-LAIN (25.500)';
        desc = parts[3] || '';
      }

      return {
        id: `parsed-${idx}`,
        posCode: code,
        programName: name,
        allocatedBudget: budget,
        category: cat,
        description: desc,
        isValid: name.trim().length > 0 && budget > 0,
      };
    });
  }, [bulkPasteText, rapbItems.length, categoriesList]);

  const handleSaveBulkRapb = async () => {
    let rowsToProcess: {
      posCode: string;
      programName: string;
      allocatedBudget: number;
      category: TransactionCategory;
      description?: string;
    }[] = [];

    if (bulkMode === 'grid') {
      rowsToProcess = bulkRows
        .filter((r) => r.programName.trim().length > 0 && Number(r.allocatedBudget) > 0)
        .map((r) => ({
          posCode: r.posCode.trim().toUpperCase() || 'POS-XX',
          programName: r.programName.trim(),
          allocatedBudget: Number(r.allocatedBudget),
          category: r.category,
          description: r.description?.trim() || undefined,
        }));
    } else {
      rowsToProcess = parsedPasteRows
        .filter((r) => r.isValid)
        .map((r) => ({
          posCode: r.posCode,
          programName: r.programName,
          allocatedBudget: r.allocatedBudget,
          category: r.category,
          description: r.description?.trim() || undefined,
        }));
    }

    if (rowsToProcess.length === 0) {
      setBulkSuccessNotice('Mohon isi minimal satu baris program RAPB dengan nama kegiatan dan realita anggaran.');
      setTimeout(() => setBulkSuccessNotice(null), 3000);
      return;
    }

    const newRapbItems: RapbItem[] = rowsToProcess.map((r, i) => ({
      id: `rapb-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      posCode: r.posCode,
      programName: r.programName,
      allocatedBudget: r.allocatedBudget,
      category: r.category,
      description: r.description,
      keywords: [r.programName.toLowerCase(), r.posCode.toLowerCase()],
    }));

    const updated = [...rapbItems, ...newRapbItems];
    await saveRapbItems(updated, 'append');
    setIsBulkRapbModalOpen(false);
    setBulkSuccessNotice(`Berhasil menyimpan ${newRapbItems.length} pos RAPB ke Cloud Firebase!`);
    setTimeout(() => setBulkSuccessNotice(null), 4000);
  };

  // Bulk Add handler from RapbImportModal (Excel / CSV)
  const handleBulkAddRapb = async (newItems: RapbItem[], mode: 'append' | 'replace') => {
    let updated: RapbItem[] = [];
    if (mode === 'replace') {
      updated = newItems;
    } else {
      updated = [...rapbItems, ...newItems];
    }
    await saveRapbItems(updated, mode);
    setBulkSuccessNotice(
      mode === 'replace'
        ? `Berhasil memperbarui seluruh data realita (${newItems.length} pos) di Cloud Firebase!`
        : `Berhasil mengimpor ${newItems.length} pos RAPB ke Cloud Firebase!`
    );
    setTimeout(() => setBulkSuccessNotice(null), 4500);
  };

  return (
    <div className="space-y-6 pb-14 text-[#24211c]">
      {/* =========================================================================
          PRINT / EXPORT LPJ VIEW MODE (STANDAR RESMI MILAD SIDOGIRI)
          ========================================================================= */}
      {showPrintReport ? (
        <div className="bg-white rounded-3xl border border-[rgba(36,33,28,0.15)] p-6 sm:p-10 shadow-sm text-slate-800 space-y-8 max-w-5xl mx-auto print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
          {/* Action Bar (Hidden when printing) */}
          <div className="flex items-center justify-between border-b pb-4 border-slate-200 print:hidden">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600">Mode Pratinjau Laporan Pertanggungjawaban (LPJ) Resmi</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                onClick={() => setShowPrintReport(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Kembali ke Aplikasi
              </button>
            </div>
          </div>

          {/* Kop Dokumen Resmi Pondok Pesantren Sidogiri */}
          <div className="text-center border-b-4 border-double border-slate-900 pb-5 pt-2">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-12 h-12 rounded-full border-2 border-[#8a7c4c] flex items-center justify-center bg-[#fdfbf7] text-[#8a7c4c] font-black text-lg">
                PPS
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-950 uppercase">
                  PONDOK PESANTREN SIDOGIRI
                </h1>
                <p className="text-xs sm:text-sm font-extrabold text-[#8a7c4c] uppercase tracking-wide">
                  PANITIA MILAD SIDOGIRI & IKHTIBAR MADRASAH MIFTAHUL ULUM
                </p>
                <p className="text-[11px] font-bold text-slate-700 uppercase">
                  SEKSI PENGANUGERAHAN & PENGHARGAAN
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Sekretariat: Gedung Sidogiri Corp Lt. 2, Sidogiri, Kraton, Pasuruan, Jawa Timur 67101
            </p>
          </div>

          {/* Judul Dokumen LPJ */}
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 underline underline-offset-4">
              LAPORAN PERTANGGUNGJAWABAN (LPJ) REALISASI RAPB & PENGELUARAN KAS
            </h2>
            <p className="text-xs text-slate-600 font-semibold">
              Malam Penganugerahan Insan Berprestasi & Khidmah Terpilih • Tahun 2026 M. / 1447 H.
            </p>
          </div>

          {/* Ringkasan Kas & Anggaran */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs print:bg-slate-50">
            <div>
              <p className="text-slate-500 font-medium">Total RAPB:</p>
              <p className="text-sm font-black text-slate-900">{formatIDR(totalPaguRapb)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Total Penerimaan Kas:</p>
              <p className="text-sm font-black text-emerald-700">{formatIDR(totalPemasukan)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Total Realisasi Belanja:</p>
              <p className="text-sm font-black text-rose-700">{formatIDR(totalPengeluaran)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Sisa Kas Fisik:</p>
              <p className="text-sm font-black text-[#8a7c4c]">{formatIDR(saldoSisa)}</p>
            </div>
          </div>

          {/* BAGIAN 1: TABEL REKAPITULASI MONITORING RAPB */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#8a7c4c]" />
              <span>I. Rekapitulasi Realisasi Realita Anggaran (RAPB) per Program</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] text-left border-collapse border border-slate-300 print:text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300 text-center">
                    <th className="p-2 border border-slate-300 w-8">No</th>
                    <th className="p-2 border border-slate-300 w-16">POS</th>
                    <th className="p-2 border border-slate-300 text-left">URAIAN</th>
                    <th className="p-2 border border-slate-300 w-12 text-center">QTM</th>
                    <th className="p-2 border border-slate-300 w-16 text-center">KET</th>
                    <th className="p-2 border border-slate-300 w-12 text-center">VOL</th>
                    <th className="p-2 border border-slate-300 w-16 text-center">KET</th>
                    <th className="p-2 border border-slate-300 text-right w-24">SATUAN (Rp)</th>
                    <th className="p-2 border border-slate-300 text-right w-28 bg-[#8a7c4c]/5">JUMLAH (Rp)</th>
                    <th className="p-2 border border-slate-300 text-right w-28">REALISASI (Rp)</th>
                    <th className="p-2 border border-slate-300 text-right w-28">SISA ANGGARAN</th>
                    <th className="p-2 border border-slate-300 w-14 text-center">% SERAP</th>
                  </tr>
                </thead>
                <tbody>
                  {rapbStats.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-4 text-center text-slate-500 italic border border-slate-300">
                        Belum ada pos anggaran RAPB yang terdaftar
                      </td>
                    </tr>
                  ) : (
                    rapbStats.map((item, idx) => {
                    const qtmVal = item.qtm ?? 1;
                    const qtmKetVal = item.qtmKet || '-';
                    const volVal = item.vol ?? 1;
                    const volKetVal = item.volKet || '-';
                    const unitPriceVal = item.unitPrice ?? Math.round(item.allocatedBudget / Math.max(1, qtmVal * volVal));
                    return (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-1.5 border border-slate-300 font-mono font-bold text-center text-[#8a7c4c]">
                          {item.posCode}
                        </td>
                        <td className="p-1.5 border border-slate-300">
                          <span className="font-bold text-slate-900">{item.programName}</span>
                          <span className="block text-[9.5px] text-slate-500">{item.category}</span>
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-700">
                          {qtmVal}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center text-slate-600">
                          {qtmKetVal}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-700">
                          {volVal}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center text-slate-600">
                          {volKetVal}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right font-medium text-slate-700">
                          {formatIDR(unitPriceVal)}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right font-bold text-slate-900 bg-[#8a7c4c]/5">
                          {formatIDR(item.allocatedBudget)}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right font-bold text-rose-700">
                          {formatIDR(item.spent)}
                        </td>
                        <td
                          className={`p-1.5 border border-slate-300 text-right font-black ${
                            item.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {formatIDR(item.remaining)}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold">
                          {item.rawPercentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={8} className="p-2.5 text-center uppercase border border-slate-300 tracking-wider">
                      Total Keseluruhan RAPB
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-slate-900 bg-[#8a7c4c]/10">
                      {formatIDR(totalPaguRapb)}
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-rose-700">
                      {formatIDR(totalPengeluaran)}
                    </td>
                    <td
                      className={`p-2.5 text-right border border-slate-300 ${
                        totalSisaRapb < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatIDR(totalSisaRapb)}
                    </td>
                    <td className="p-2.5 text-center border border-slate-300">
                      {totalRapbPenyerapan.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BAGIAN 2: TABEL REKAPITULASI REALISASI PER KATEGORI AKUN INDUK */}
          <div className="space-y-2 pt-2">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#8a7c4c]" />
              <span>II. Rekapitulasi Realisasi Realita per Kategori Akun (5 Pos Induk)</span>
            </h3>
            <div className="overflow-x-auto border border-slate-300">
              <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300 text-center">
                    <th className="p-2 border border-slate-300 w-8">No</th>
                    <th className="p-2 border border-slate-300 text-left">Kategori Akun Induk</th>
                    <th className="p-2 border border-slate-300 text-right w-36 bg-[#8a7c4c]/5">
                      Jumlah Keuangan (Realita)
                    </th>
                    <th className="p-2 border border-slate-300 text-right w-36 text-rose-700">
                      Pengeluaran (Realisasi)
                    </th>
                    <th className="p-2 border border-slate-300 text-right w-36">
                      Sisa Anggaran (Dana)
                    </th>
                    <th className="p-2 border border-slate-300 text-center w-24">
                      % Serap
                    </th>
                    <th className="p-2 border border-slate-300 text-center w-20">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats.map((catStat) => (
                    <tr key={catStat.category} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 text-center font-bold">{catStat.number}</td>
                      <td className="p-2 border border-slate-300">
                        <span className="font-extrabold text-slate-900">{catStat.category}</span>
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-bold text-slate-900 bg-[#8a7c4c]/5">
                        {formatIDR(catStat.pagu)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-bold text-rose-700">
                        {formatIDR(catStat.spent)}
                      </td>
                      <td
                        className={`p-2 border border-slate-300 text-right font-black ${
                          catStat.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatIDR(catStat.remaining)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {catStat.percentageUsed.toFixed(1)}%
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            catStat.remaining < 0
                              ? 'text-rose-700 bg-rose-50 border border-rose-200'
                              : catStat.percentageUsed >= 85
                              ? 'text-amber-700 bg-amber-50 border border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {catStat.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={2} className="p-2.5 text-center uppercase border border-slate-300 tracking-wider">
                      Total Rekapitulasi 5 Kategori
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-slate-900 bg-[#8a7c4c]/10">
                      {formatIDR(totalCategoryPagu)}
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-rose-700">
                      {formatIDR(totalCategorySpent)}
                    </td>
                    <td
                      className={`p-2.5 text-right border border-slate-300 ${
                        totalCategoryRemaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatIDR(totalCategoryRemaining)}
                    </td>
                    <td className="p-2.5 text-center border border-slate-300">
                      {totalCategorySerap.toFixed(1)}%
                    </td>
                    <td className="p-2.5 text-center border border-slate-300">
                      -
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BAGIAN 3: TABEL RINCIAN TRANSAKSI PENGELUARAN KAS */}
          <div className="space-y-2 pt-2">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#8a7c4c]" />
              <span>III. Rincian Buku Kas Transaksi Pengeluaran & Pembelanjaan</span>
            </h3>
            <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300 text-center">
                  <th className="p-2 border border-slate-300 w-8">No</th>
                  <th className="p-2 border border-slate-300 w-20">Tanggal</th>
                  <th className="p-2 border border-slate-300 w-20">No. Nota</th>
                  <th className="p-2 border border-slate-300 w-16">Pos</th>
                  <th className="p-2 border border-slate-300 text-left">Uraian / Kegiatan</th>
                  <th className="p-2 border border-slate-300 text-left">Penerima / Toko</th>
                  <th className="p-2 border border-slate-300 text-center w-20">Qty & Satuan</th>
                  <th className="p-2 border border-slate-300 text-right w-24">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .filter((t) => t.type === 'pengeluaran')
                  .map((t, idx) => (
                    <tr key={t.id} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-[10px]">{t.date}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-[#8a7c4c]">
                        {t.receiptNumber || '-'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">
                        {t.posCode || '-'}
                      </td>
                      <td className="p-2 border border-slate-300 font-medium">
                        <span className="font-bold text-slate-900">{t.title}</span>
                        {t.programName && t.programName !== t.title && (
                          <span className="block text-[10px] text-slate-500 italic">{t.programName}</span>
                        )}
                        {t.notes && <span className="block text-[10px] text-slate-600">Ket: {t.notes}</span>}
                      </td>
                      <td className="p-2 border border-slate-300 text-slate-800 font-medium">
                        {t.recipient || '-'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-slate-700">
                        {t.qty !== undefined ? `${t.qty} ${t.unit || ''}` : '-'}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-black text-rose-700">
                        {formatIDR(t.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={7} className="p-2.5 text-right uppercase border border-slate-300">
                    Total Pengeluaran Kas
                  </td>
                  <td className="p-2.5 text-right border border-slate-300 text-rose-700">
                    {formatIDR(totalPengeluaran)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tanda Tangan Pengesahan Panitia */}
          <div className="pt-6 grid grid-cols-2 text-center text-xs text-slate-800 break-inside-avoid">
            <div>
              <p className="text-slate-500">Pasuruan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold mt-1 mb-16">Mengetahui,<br />Ketua Sie Penganugerahan</p>
              <p className="font-black text-slate-900 underline text-sm">Birril Walid</p>
              <p className="text-[10px] text-slate-500">NIP: PAN-MLD-2026-004</p>
            </div>
            <div>
              <p className="text-slate-500">Sie Penganugerahan Milad Sidogiri</p>
              <p className="font-bold mt-1 mb-16">Disusun & Dipertanggungjawabkan Oleh,<br />Bendahara Sie Penganugerahan</p>
              <p className="font-black text-slate-900 underline text-sm">Moh Ali Ghufron</p>
              <p className="text-[10px] text-slate-500">NIP: PAN-MLD-2026-018</p>
            </div>
          </div>

          {/* BAGIAN 4: HALAMAN LAMPIRAN FOTO NOTA & BUKTI FISIK (PRINT PDF APPENDIX) */}
          <div className="pt-8 border-t-2 border-dashed border-slate-300 print:break-before-page">
            <div className="text-center mb-6">
              <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 underline underline-offset-4">
                LAMPIRAN: BUKTI FISIK NOTA & KUITANSI PENGELUARAN
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Dokumentasi Asli Kwitansi Pembelanjaan Logistik & Operasional Sie Penganugerahan
              </p>
            </div>

            {receiptTransactions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {receiptTransactions.map((trx, idx) => (
                  <div
                    key={trx.id}
                    className="border border-slate-300 rounded-2xl p-4 bg-white shadow-2xs space-y-3 break-inside-avoid"
                  >
                    <div className="flex items-start justify-between border-b pb-2 border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-[#8a7c4c] font-mono text-[11px] block">
                          Lampiran #{idx + 1} • {trx.receiptNumber || 'NOTA'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-xs">{trx.title}</h4>
                      </div>
                      <span className="font-black text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        {formatIDR(trx.amount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 text-[10px] text-slate-600 gap-1 bg-slate-50 p-2 rounded-xl">
                      <div>
                        <span className="text-slate-400">Tanggal: </span>
                        <strong>{trx.date}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Pos RAPB: </span>
                        <strong>{trx.posCode || '-'}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">Penerima/Toko: </span>
                        <strong>{trx.recipient || '-'}</strong>
                      </div>
                    </div>

                    {/* Receipt Image Display */}
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-1 max-h-72">
                      <img
                        src={trx.proofUrl}
                        alt={`Nota ${trx.receiptNumber}`}
                        className="max-h-68 w-auto object-contain rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic border border-dashed border-slate-300 rounded-2xl">
                Belum ada berkas foto nota transaksi yang diunggah.
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* TOAST NOTIFICATION REAL-TIME (SUCCESS / ERROR / INFO) */}
          {toast && (
            <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-white rounded-2xl shadow-2xl border border-[rgba(36,33,28,0.18)] p-4 flex items-start space-x-3 animate-in slide-in-from-top-4 duration-300">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  toast.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : toast.type === 'error'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : toast.type === 'error' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                ) : (
                  <Sparkles className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-900">{toast.title}</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* =========================================================================
              HEADER & TOP ACTION BAR (SIDOGIRI DESIGN SYSTEM)
              ========================================================================= */}
          <ContentHeader
            title="Pengelolaan RAPB & Realisasi Kas Keuangan"
            activeTab="keuangan"
          />

          {/* Action Toolbar Box */}
          <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#8a7c4c]/10 text-[#8a7c4c] flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h1 className="text-base font-extrabold text-[#24211c]">
                  Sistem Realisasi Anggaran RAPB & Kas Sie Penganugerahan
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportFinance}
                title="Ekspor Seluruh Data Keuangan ke Format CSV"
                className="flex items-center space-x-1.5 bg-white hover:bg-[#f7f6f2] text-[#24211c] border border-[rgba(36,33,28,0.15)] font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#8a7c4c]" />
                <span>Ekspor CSV</span>
              </button>

              <button
                onClick={() => setShowPrintReport(true)}
                title="Pratinjau & Cetak Laporan LPJ Resmi Lengkap dengan Lampiran Nota"
                className="flex items-center space-x-1.5 bg-[#24211c] hover:bg-[#38342c] text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-2xs cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#c3b68b]" />
                <span>Cetak LPJ & Lampiran</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                title="Unggah dan Parsing File Excel (.xlsx/.xls) atau CSV RAPB"
                className="flex items-center space-x-1.5 bg-white hover:bg-[#fdfbf7] text-[#8a7c4c] border border-[#8a7c4c]/40 font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#8a7c4c]" />
                <span>Unggah File RAPB (Excel/CSV)</span>
              </button>

              <button
                onClick={() => handleOpenAdd()}
                className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold px-4 py-2 rounded-xl shadow-xs transition text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Pengeluaran Pintar</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              FITUR 2: SECTION MONITORING ANGGARAN & SISA DANA REAL-TIME (RAPB)
              ========================================================================= */}
          <CollapsibleSection
            sectionId="finance_rapb_monitoring"
            title="Monitoring Realita Anggaran (RAPB) & Sisa Dana"
            icon={<Building2 className="w-4 h-4 text-[#8a7c4c]" />}
            badge={
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                totalSisaRapb < 0 ? 'bg-rose-100 text-rose-900 border-rose-200' : 'bg-emerald-100 text-emerald-900 border-emerald-200'
              }`}>
                Sisa Anggaran: {formatIDR(totalSisaRapb)}
              </span>
            }
          >
            <div className="space-y-4">
              {/* Bento Metric Cards for RAPB & Kas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-[rgba(36,33,28,0.12)] shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Total RAPB</span>
                    <Layers className="w-4 h-4 text-[#8a7c4c]" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-2">{formatIDR(totalPaguRapb)}</h3>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-[rgba(36,33,28,0.12)] shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Total Anggaran</span>
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-black text-rose-700 mt-2">{formatIDR(totalPengeluaran)}</h3>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-1">
                    <span>Serapan:</span>
                    <span className="font-bold text-slate-800">{totalRapbPenyerapan.toFixed(1)}%</span>
                  </div>
                </div>

                <div className={`p-4.5 rounded-2xl border shadow-xs ${
                  totalSisaRapb < 0 ? 'bg-rose-50/70 border-rose-200 text-rose-900' : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span>Sisa Anggaran</span>
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h3 className={`text-xl font-black mt-2 ${totalSisaRapb < 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                    {formatIDR(totalSisaRapb)}
                  </h3>
                </div>

                <div className="bg-[#fdfbf7] p-4.5 rounded-2xl border border-[rgba(138,124,76,0.25)] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8a7c4c]">
                      <span className="flex items-center space-x-1.5">
                        <Wallet className="w-4 h-4" />
                        <span>Saldo Kas Fisik</span>
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-[#24211c] mt-2">{formatIDR(saldoSisa)}</h3>
                  </div>

                  <div className="pt-3 mt-2.5 border-t border-[rgba(138,124,76,0.15)] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddPemasukanModalOpen(true)}
                      className="flex-1 py-1.5 px-3 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold text-xs rounded-xl shadow-2xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                      title="Tambah Saldo Kas Fisik"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Tambah Saldo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPemasukanListModal(true)}
                      className="py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center cursor-pointer"
                      title="Lihat Riwayat Penerimaan Saldo Kas"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#8a7c4c]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Serapan Global */}
              <div className="bg-white p-4 rounded-2xl border border-[rgba(36,33,28,0.12)] shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <Percent className="w-3.5 h-3.5 text-[#8a7c4c]" />
                    <span>Tingkat Penyerapan Anggaran (RAPB):</span>
                  </span>
                  <span className="font-extrabold text-[#8a7c4c]">{totalRapbPenyerapan.toFixed(1)}% Terpakai</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      totalRapbPenyerapan > 90 ? 'bg-rose-500' : totalRapbPenyerapan > 70 ? 'bg-amber-500' : 'bg-[#8a7c4c]'
                    }`}
                    style={{ width: `${Math.min(totalRapbPenyerapan, 100)}%` }}
                  />
                </div>
              </div>

              {/* TABEL REKAPITULASI REALISASI & SISA ANGGARAN PER KATEGORI (5 POS INDUK) - BISA DISEMBUNYIKAN / DITAMPILKAN */}
              <div className="bg-white rounded-2xl border border-[rgba(36,33,28,0.12)] shadow-xs overflow-hidden transition-all duration-300">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fcfbf9]">
                  <div
                    onClick={toggleCategoryRecap}
                    className="flex items-center space-x-2.5 cursor-pointer select-none group flex-1"
                    title={showCategoryRecap ? 'Klik untuk sembunyikan tabel rekapitulasi kategori' : 'Klik untuk tampilkan tabel rekapitulasi kategori'}
                  >
                    <div className="p-2 rounded-xl bg-[#8a7c4c]/10 text-[#8a7c4c] group-hover:bg-[#8a7c4c]/20 transition shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#8a7c4c] transition">
                          Rekapitulasi Anggaran & Realisasi per Kategori
                        </h3>
                        {!showCategoryRecap && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                            Disembunyikan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                    {categoryFilter !== 'ALL' && (
                      <button
                        onClick={() => setCategoryFilter('ALL')}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-[#8a7c4c] bg-white border border-[#8a7c4c]/30 rounded-xl hover:bg-[#8a7c4c]/10 transition flex items-center space-x-1 cursor-pointer"
                        title="Hapus filter kategori"
                      >
                        <span>Reset Filter ({categoryFilter})</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={toggleCategoryRecap}
                      className="px-3 py-1.5 bg-[#f7f6f2] hover:bg-[#edece6] text-[#24211c] border border-[rgba(36,33,28,0.15)] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title={showCategoryRecap ? 'Sembunyikan Tabel Rekapitulasi' : 'Tampilkan Tabel Rekapitulasi'}
                    >
                      {showCategoryRecap ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                          <span>Sembunyikan</span>
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-[#8a7c4c]" />
                          <span className="text-[#8a7c4c]">Tampilkan Rekapitulasi</span>
                          <ChevronDown className="w-3.5 h-3.5 text-[#8a7c4c]" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {showCategoryRecap && (
                  <div className="overflow-x-auto animate-in fade-in duration-200">
                    <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                      <thead className="bg-[#f7f6f2] text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-center w-10">No</th>
                          <th className="p-3 min-w-[240px]">Kategori Anggaran</th>
                          <th className="p-3 text-right w-36 bg-[#8a7c4c]/5 font-black text-slate-900">
                            Realita Anggaran
                          </th>
                          <th className="p-3 text-right w-36 font-bold text-rose-700">
                            Realisasi Belanja
                          </th>
                          <th className="p-3 text-right w-40 font-black">
                            Sisa Anggaran
                          </th>
                          <th className="p-3 text-center w-36">
                            Serapan & Status
                          </th>
                          <th className="p-3 text-center w-28">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {categoryStats.map((catStat) => {
                          const isFiltered = categoryFilter === catStat.category;

                          return (
                            <tr
                              key={catStat.category}
                              className={`transition hover:bg-slate-50/80 ${
                                isFiltered ? 'bg-[#8a7c4c]/10 border-l-4 border-l-[#8a7c4c]' : ''
                              }`}
                            >
                              <td className="p-3 text-center font-bold text-slate-500">
                                {catStat.number}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <span className="font-extrabold text-slate-900 text-xs">
                                    {catStat.category}
                                  </span>
                                  {isFiltered && (
                                    <span className="text-[10px] font-bold text-white bg-[#8a7c4c] px-1.5 py-0.2 rounded">
                                      Aktif
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-right font-black text-slate-900 bg-[#8a7c4c]/5 font-mono text-xs">
                                {formatIDR(catStat.pagu)}
                              </td>
                              <td className="p-3 text-right font-bold text-rose-700 font-mono text-xs">
                                {formatIDR(catStat.spent)}
                              </td>
                              <td
                                className={`p-3 text-right font-black font-mono text-xs ${
                                  catStat.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                                }`}
                              >
                                {formatIDR(catStat.remaining)}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[11px] font-bold text-slate-700">
                                    {catStat.percentageUsed.toFixed(1)}%
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catStat.statusColor}`}
                                  >
                                    {catStat.statusText}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      catStat.remaining < 0
                                        ? 'bg-rose-500'
                                        : catStat.percentageUsed >= 85
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-600'
                                    }`}
                                    style={{ width: `${Math.min(catStat.percentageUsed, 100)}%` }}
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => handleOpenAdd(undefined, catStat.category as TransactionCategory)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#8a7c4c]/15 hover:bg-[#8a7c4c] text-[#8a7c4c] hover:text-white transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                                    title={`Catat pengeluaran baru untuk kategori ${catStat.category}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>+ Belanja</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (categoryFilter === catStat.category) {
                                        setCategoryFilter('ALL');
                                      } else {
                                        setCategoryFilter(catStat.category);
                                      }
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                      isFiltered
                                        ? 'bg-[#8a7c4c] text-white hover:bg-[#6f633a]'
                                        : 'bg-[#f7f6f2] hover:bg-[#edece6] text-slate-700 border border-slate-200'
                                    }`}
                                    title="Filter transaksi berdasarkan kategori ini"
                                  >
                                    {isFiltered ? 'Lepas' : 'Filter'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-[#fcfbf9] font-black text-slate-900 border-t-2 border-slate-300 text-xs">
                        <tr>
                          <td colSpan={2} className="p-3.5 text-center uppercase tracking-wider text-slate-800">
                            Total Seluruh Kategori (5 Pos Induk)
                          </td>
                          <td className="p-3.5 text-right bg-[#8a7c4c]/10 text-slate-900 font-mono text-xs">
                            {formatIDR(totalCategoryPagu)}
                          </td>
                          <td className="p-3.5 text-right text-rose-700 font-mono text-xs">
                            {formatIDR(totalCategorySpent)}
                          </td>
                          <td
                            className={`p-3.5 text-right font-mono text-xs ${
                              totalCategoryRemaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {formatIDR(totalCategoryRemaining)}
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-800">
                            {totalCategorySerap.toFixed(1)}% Terpakai
                          </td>
                          <td className="p-3.5 text-center text-slate-400">
                            -
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* TABEL MONITORING & SISA DANA REAL-TIME PER PROGRAM */}
              <div className="bg-white rounded-2xl border border-[rgba(36,33,28,0.12)] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Tabel Monitoring Realita & Sisa Anggaran
                    </h3>
                  </div>

                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3.5 py-1.5 bg-[#24211c] hover:bg-[#38342c] text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                        title="Unggah dan Parsing File Excel (.xlsx/.xls) atau CSV RAPB"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#c3b68b]" />
                        <span>Impor Excel / CSV</span>
                      </button>

                      <button
                        onClick={openBulkRapbModal}
                        className="px-3.5 py-1.5 bg-[#8a7c4c] hover:bg-[#6f633a] text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                        title="Tambah Banyak Pos RAPB Sekaligus dalam Sekali Input"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>+ Tambah Pos Serentak</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingRapb(null);
                          setRapbPosInput(`POS-${String(rapbItems.length + 1).padStart(2, '0')}`);
                          setRapbNameInput('');
                          setRapbQtmInput(1);
                          setRapbQtmKetInput('Buah');
                          setRapbVolInput(1);
                          setRapbVolKetInput('Kegiatan');
                          setRapbUnitPriceInput(1000000);
                          setRapbBudgetInput(1000000);
                          setRapbCatInput('SEKSI PENGANUGERAHAN');
                          setRapbDescInput('');
                          setIsRapbModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-[#f7f6f2] hover:bg-[#edece6] text-[#24211c] border border-[rgba(36,33,28,0.15)] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                        title="Tambah Satu Pos RAPB Secara Manual"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#8a7c4c]" />
                        <span>+ Pos Tunggal</span>
                      </button>

                      {rapbItems.length > 0 && (
                        <button
                          onClick={handleClearAllRapb}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                          title="Kosongkan Semua Pos Realita RAPB"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Semua Realita</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bulk Success Notice Toast */}
                {bulkSuccessNotice && (
                  <div className="mx-4 my-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{bulkSuccessNotice}</span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                    <thead className="bg-[#fcfbf9] text-slate-600 uppercase tracking-wider font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-center w-10">No</th>
                        <th className="p-3 w-20">POS</th>
                        <th className="p-3 min-w-[220px]">URAIAN KEGIATAN</th>
                        <th className="p-3 text-center w-12">QTY</th>
                        <th className="p-3 text-center w-16">SATUAN</th>
                        <th className="p-3 text-center w-12">VOL</th>
                        <th className="p-3 text-center w-16">JENIS</th>
                        <th className="p-3 text-right w-28">HARGA SATUAN</th>
                        <th className="p-3 text-right w-28 bg-[#8a7c4c]/5 font-black text-slate-900">REALITA ANGGARAN</th>
                        <th className="p-3 text-right w-28 font-bold text-rose-700">REALISASI</th>
                        <th className="p-3 text-right w-32 font-black">SISA ANGGARAN</th>
                        <th className="p-3 text-center w-28">STATUS</th>
                        <th className="p-3 text-center w-28">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rapbStats.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="p-8 text-center text-slate-500 bg-[#fcfbf9]/60">
                            <Building2 className="w-10 h-10 mx-auto text-[#8a7c4c]/40 mb-2" />
                            <p className="font-extrabold text-sm text-slate-700">Data Realita RAPB Kosong</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto whitespace-normal">
                              Seluruh pos realita RAPB telah dikosongkan. Anda dapat mengimpor berkas Excel / CSV atau menambahkan pos baru secara manual.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                              <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-3.5 py-1.5 bg-[#24211c] hover:bg-[#38342c] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-[#c3b68b]" />
                                <span>Impor Excel / CSV</span>
                              </button>
                              <button
                                onClick={openBulkRapbModal}
                                className="px-3.5 py-1.5 bg-[#8a7c4c] hover:bg-[#6f633a] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                              >
                                <ListPlus className="w-3.5 h-3.5" />
                                <span>+ Tambah Pos Serentak</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRapb(null);
                                  setRapbPosInput('POS-01');
                                  setRapbNameInput('');
                                  setRapbQtmInput(1);
                                  setRapbQtmKetInput('Buah');
                                  setRapbVolInput(1);
                                  setRapbVolKetInput('Kegiatan');
                                  setRapbUnitPriceInput(1000000);
                                  setRapbBudgetInput(1000000);
                                  setRapbCatInput('SEKSI PENGANUGERAHAN');
                                  setRapbDescInput('');
                                  setIsRapbModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-[#f7f6f2] hover:bg-[#edece6] text-[#24211c] border border-[rgba(36,33,28,0.15)] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#8a7c4c]" />
                                <span>+ Pos Tunggal</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        rapbStats.map((item, idx) => {
                        const qtmVal = item.qtm ?? 1;
                        const qtmKetVal = item.qtmKet || '-';
                        const volVal = item.vol ?? 1;
                        const volKetVal = item.volKet || '-';
                        const unitPriceVal = item.unitPrice ?? Math.round(item.allocatedBudget / Math.max(1, qtmVal * volVal));
                        return (
                          <tr key={item.id} className="hover:bg-[#fcfbf9] transition group">
                            <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-[#8a7c4c] bg-[#8a7c4c]/10 px-2 py-0.5 rounded-lg text-[11px]">
                                {item.posCode}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 text-xs">{item.programName}</div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-800">
                              {qtmVal}
                            </td>
                            <td className="p-3 text-center text-slate-600 text-[11px]">
                              {qtmKetVal}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-800">
                              {volVal}
                            </td>
                            <td className="p-3 text-center text-slate-600 text-[11px]">
                              {volKetVal}
                            </td>
                            <td className="p-3 text-right font-medium text-slate-700">
                              {formatIDR(unitPriceVal)}
                            </td>
                            <td className="p-3 text-right font-black text-slate-900 bg-[#8a7c4c]/5">
                              {formatIDR(item.allocatedBudget)}
                            </td>
                            <td className="p-3 text-right font-extrabold text-rose-700">
                              {formatIDR(item.spent)}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`font-black text-xs px-2.5 py-1 rounded-lg inline-block ${
                                  item.remaining < 0
                                    ? 'text-rose-700 bg-rose-50 border border-rose-200'
                                    : item.remaining === 0
                                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                }`}
                              >
                                {formatIDR(item.remaining)}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${item.statusColor}`}>
                                {item.statusText}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1 font-mono font-semibold">
                                {item.rawPercentage.toFixed(0)}% serap
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdd(item.posCode)}
                                  className="p-1.5 text-[#8a7c4c] hover:bg-[#8a7c4c]/10 rounded-lg transition cursor-pointer"
                                  title="Catat Pengeluaran untuk Pos Ini"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRapb(item)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Edit Pos Realita RAPB"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRapb(item.id)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus Pos Realita RAPB Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* =========================================================================
              FITUR 3: RIWAYAT TRANSAKSI, THUMBNAIL FOTO NOTA & TABEL KAS
              ========================================================================= */}
          <CollapsibleSection
            sectionId="finance_transactions_list"
            title="Riwayat Transaksi & Bukti Nota Fisik"
            icon={<Receipt className="w-4 h-4 text-[#8a7c4c]" />}
            badge={
              <span className="text-[10px] font-extrabold bg-[#8a7c4c]/15 text-[#6f633a] border border-[#8a7c4c]/30 px-2.5 py-0.5 rounded-full">
                {filteredTransactions.length} Transaksi
              </span>
            }
          >
            <div className="space-y-4">
              {/* Search & Filter Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-[rgba(36,33,28,0.12)] shadow-xs flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kegiatan, pos RAPB, rekanan toko, no. bukti..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]/50 text-slate-900 placeholder-slate-400 font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Pos RAPB Filter */}
                  <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                    <Layers className="w-3.5 h-3.5 text-[#8a7c4c]" />
                    <select
                      value={selectedPosFilter}
                      onChange={(e) => setSelectedPosFilter(e.target.value)}
                      className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="ALL">Semua Pos RAPB</option>
                      {rapbItems.map((r) => (
                        <option key={r.posCode} value={r.posCode}>
                          {r.posCode} - {r.programName.slice(0, 24)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jenis Kas Filter */}
                  <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="ALL">Semua Jenis Kas</option>
                      <option value="pengeluaran">Pengeluaran (-)</option>
                      <option value="pemasukan">Pemasukan (+)</option>
                    </select>
                  </div>

                  {/* Kategori Filter */}
                  <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="ALL">Semua Kategori</option>
                      {categoriesList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table Container with Receipt Thumbnails */}
              <div className="bg-white rounded-2xl border border-[rgba(36,33,28,0.12)] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Daftar Transaksi Kas ({filteredTransactions.length})
                  </h3>
                </div>

                {/* Mobile View: Cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {filteredTransactions.map((t) => (
                    <div key={t.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            {t.posCode && (
                              <span className="font-mono text-[10px] font-bold text-[#8a7c4c] bg-[#8a7c4c]/10 px-1.5 py-0.5 rounded">
                                {t.posCode}
                              </span>
                            )}
                            <p className="font-extrabold text-slate-900 text-xs truncate">{t.title}</p>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1">
                            <span>{t.date}</span>
                            <span>•</span>
                            <span className="font-mono font-bold text-[#8a7c4c]">{t.receiptNumber || '-'}</span>
                            {t.recipient && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 truncate">{t.recipient}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                              {getEffectiveCategory(t)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`font-black text-xs shrink-0 ${
                            t.type === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {t.type === 'pemasukan' ? '+' : '-'} {formatIDR(t.amount)}
                        </span>
                      </div>

                      {/* Detail Qty & Catatan */}
                      {(t.qty !== undefined || t.notes) && (
                        <div className="text-[11px] text-slate-600 bg-[#fbfaf8] p-2 rounded-xl flex items-center justify-between">
                          <span>
                            {t.qty !== undefined && (
                              <strong>
                                {t.qty} {t.unit || 'buah'}{' '}
                                {t.unitPrice ? `@ ${formatIDR(t.unitPrice)}` : ''}
                              </strong>
                            )}
                          </span>
                          {t.notes && <span className="italic text-slate-500 text-[10px]">{t.notes}</span>}
                        </div>
                      )}

                      {/* Thumbnail & Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2">
                          {t.proofUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProofTrx(t)}
                              className="flex items-center space-x-1.5 p-1 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                              title="Buka Foto Nota"
                            >
                              <img
                                src={t.proofUrl}
                                alt="Thumbnail"
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                              />
                              <span className="text-[10px] font-bold text-[#8a7c4c] pr-1">Lihat Nota</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic bg-slate-50 px-2 py-1 rounded-lg">
                              Tanpa Bukti
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-[#8a7c4c]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTrxToDelete(t)}
                            className="p-1 text-rose-600 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      Belum ada transaksi yang sesuai kriteria pencarian.
                    </div>
                  )}
                </div>

                {/* Desktop View: Table with Direct Receipt Thumbnails */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-[#fcfbf9] text-slate-600 uppercase tracking-wider font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5 w-28">Tanggal & Bukti</th>
                        <th className="p-3.5 w-20">Kode Pos</th>
                        <th className="p-3.5">Kegiatan / Program</th>
                        <th className="p-3.5">Penerima</th>
                        <th className="p-3.5 text-center w-24">Qty & Satuan</th>
                        <th className="p-3.5 text-center w-28">Bukti Nota</th>
                        <th className="p-3.5 text-right w-32">Nominal (Rp)</th>
                        <th className="p-3.5 text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-[#fcfbf9] transition">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{t.date}</div>
                            <div className="text-[10px] text-[#8a7c4c] font-mono font-bold">
                              {t.receiptNumber || '-'}
                            </div>
                          </td>

                          <td className="p-3.5">
                            {t.posCode ? (
                              <span className="font-mono font-extrabold text-[#8a7c4c] bg-[#8a7c4c]/10 px-2 py-0.5 rounded-lg text-[11px]">
                                {t.posCode}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900 text-xs">{t.title}</div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-semibold text-slate-800">{t.recipient || '-'}</div>
                          </td>

                          <td className="p-3.5 text-center font-medium">
                            {t.qty !== undefined ? (
                              <div>
                                <span className="font-bold text-slate-900">
                                  {t.qty} {t.unit || 'buah'}
                                </span>
                                {t.unitPrice ? (
                                  <span className="block text-[10px] text-slate-400">
                                    @{formatIDR(t.unitPrice)}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* THUMBNAIL FOTO NOTA LANGSUNG DI BARIS TABEL */}
                          <td className="p-3.5 text-center">
                            {t.proofUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedProofTrx(t)}
                                className="group relative inline-block rounded-xl overflow-hidden border border-slate-200 hover:border-[#8a7c4c] shadow-2xs transition transform hover:scale-105 cursor-pointer"
                                title="Klik untuk Pratinjau Nota Penuh"
                              >
                                <img
                                  src={t.proofUrl}
                                  alt={`Nota ${t.receiptNumber}`}
                                  className="w-12 h-12 object-cover rounded-xl"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic bg-slate-50 px-2.5 py-1 rounded-xl">
                                Tanpa Foto
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right font-black text-sm">
                            <span className={t.type === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}>
                              {t.type === 'pemasukan' ? '+' : '-'} {formatIDR(t.amount)}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 text-slate-600 hover:text-[#8a7c4c] hover:bg-[#8a7c4c]/10 rounded-lg transition cursor-pointer"
                                title="Edit Transaksi"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTrxToDelete(t)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-400 italic">
                            Belum ada data transaksi yang sesuai filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* =========================================================================
          MODAL: PRATINJAU FOTO NOTA BUKTI FISIK (LIGHTBOX MODAL)
          ========================================================================= */}
      {selectedProofTrx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[rgba(36,33,28,0.15)] overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#24211c] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#38342c]">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#8a7c4c] text-white flex items-center justify-center font-bold shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                    Bukti Fisik: {selectedProofTrx.title}
                  </h3>
                  <p className="text-[11px] text-[#c3b68b] font-mono font-bold">
                    No. Nota: {selectedProofTrx.receiptNumber || '-'} • {selectedProofTrx.date}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProofTrx(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Nominal:</span>
                  <span className="font-black text-rose-700 text-sm">{formatIDR(selectedProofTrx.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Pos RAPB:</span>
                  <span className="font-mono font-bold text-[#8a7c4c]">{selectedProofTrx.posCode || '-'}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px]">Penerima / Rekanan:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {selectedProofTrx.recipient || '-'}
                  </span>
                </div>
              </div>

              {/* Rincian Qty */}
              {selectedProofTrx.qty !== undefined && (
                <div className="text-xs bg-[#fdfbf7] border border-[#8a7c4c]/20 p-2.5 rounded-xl flex items-center justify-between text-slate-800">
                  <span>
                    Rincian Kuantitas: <strong>{selectedProofTrx.qty} {selectedProofTrx.unit || 'buah'}</strong>
                  </span>
                  {selectedProofTrx.unitPrice ? (
                    <span>Harga Satuan: <strong>{formatIDR(selectedProofTrx.unitPrice)}</strong></span>
                  ) : null}
                </div>
              )}

              {/* High-res Image Preview */}
              {selectedProofTrx.proofUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 max-h-[420px] flex items-center justify-center p-2 group">
                  <img
                    src={selectedProofTrx.proofUrl}
                    alt={`Bukti ${selectedProofTrx.title}`}
                    className="max-h-[400px] w-auto object-contain rounded-xl shadow-md transition transform group-hover:scale-[1.01]"
                  />
                </div>
              ) : (
                <div className="p-10 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs italic border border-dashed border-slate-200">
                  Tidak ada foto kuitansi terlampir.
                </div>
              )}

              {selectedProofTrx.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl italic">
                  <strong>Catatan Verifikasi:</strong> {selectedProofTrx.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                {selectedProofTrx.proofUrl && (
                  <a
                    href={selectedProofTrx.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Gambar Asli</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedProofTrx(null)}
                  className="ml-auto px-5 py-2 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-xs"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FITUR 1: MODAL INPUT TRANSAKSI PINTAR (AUTOCOMPLETE & SISA ANGGARAN REAL-TIME)
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[rgba(36,33,28,0.15)] overflow-hidden text-slate-800 max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#fcfbf9] px-5 py-4 border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#8a7c4c]/10 text-[#8a7c4c] flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    {editingTransaction ? 'Edit Transaksi' : 'Input Transaksi Keuangan'}
                  </h3>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Jenis Arus Kas & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Arus Kas *</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as TransactionType;
                      setType(newType);
                      if (newType === 'pemasukan') {
                        setCategory('SEKSI PENGANUGERAHAN');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-bold focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                  >
                    <option value="pengeluaran">Pengeluaran (-)</option>
                    <option value="pemasukan">Pemasukan (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* AUTOCOMPLETE PINTAR: NAMA KEGIATAN / PROGRAM RAPB (Hanya jika pengeluaran) */}
              {type === 'pengeluaran' && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#8a7c4c]" />
                      <span>Nama Kegiatan / Program (RAPB) *</span>
                    </label>
                    <span className="text-[10px] text-[#8a7c4c] font-semibold">Autocomplete Otomatis</span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ketik kata kunci: 'trofi', 'plakat', 'sertifikat', 'konsumsi'..."
                      value={autocompleteInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAutocompleteInput(val);
                        setProgramName(val);
                        if (!title.trim() || title === programName) {
                          setTitle(val);
                        }
                        const directMatch = rapbItems.find(
                          (r) =>
                            r.programName.trim().toLowerCase() === val.trim().toLowerCase() ||
                            r.posCode.trim().toUpperCase() === val.trim().toUpperCase()
                        );
                        if (directMatch) {
                          setPosCode(directMatch.posCode);
                          setCategory(normalizeCategory(directMatch.category));
                        }
                        setIsAutocompleteOpen(true);
                      }}
                      onFocus={() => setIsAutocompleteOpen(true)}
                      className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isAutocompleteOpen && filteredSuggestions.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredSuggestions.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectProgram(item)}
                          className="p-2.5 hover:bg-[#fcfbf9] cursor-pointer transition flex items-center justify-between text-left"
                        >
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-[10px] font-black text-[#8a7c4c] bg-[#8a7c4c]/10 px-1.5 py-0.5 rounded">
                                {item.posCode}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">{item.programName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Realita RAPB: {formatIDR(item.allocatedBudget)} • {item.category}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8a7c4c] font-bold shrink-0">Pilih Pos</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* REAL-TIME REMAINING BUDGET MONITORING CARD FOR SELECTED PROGRAM */}
                  {selectedProgramStat && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-[#fdfbf7] border border-[#8a7c4c]/25 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#6f633a]">
                          Monitoring Realita Pos {selectedProgramStat.posCode}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${selectedProgramStat.statusColor}`}>
                          {selectedProgramStat.statusText}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Realita RAPB:</span>
                          <strong className="text-slate-800">{formatIDR(selectedProgramStat.allocatedBudget)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sudah Terpakai:</span>
                          <strong className="text-rose-700">{formatIDR(selectedProgramStat.spent)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sisa Anggaran:</span>
                          <strong
                            className={`font-black ${
                              selectedProgramStat.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {formatIDR(selectedProgramStat.remaining)}
                          </strong>
                        </div>
                      </div>

                      {/* Warning if current amount exceeds remaining */}
                      {amount > 0 && selectedProgramStat.remaining - amount < 0 && (
                        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Nominal ini melebihi sisa plafon realita (Defisit{' '}
                            {formatIDR(Math.abs(selectedProgramStat.remaining - amount))}).
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Kategori Akun Induk */}
              <div className="p-3 bg-amber-50/40 border border-[#8a7c4c]/30 rounded-2xl space-y-1.5">
                <label className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#8a7c4c]" />
                  <span>Kategori Anggaran *</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="w-full px-3 py-2 bg-white border border-[#8a7c4c]/40 text-slate-900 rounded-xl font-bold text-xs focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                >
                  {categoriesList.map((cat, idx) => (
                    <option key={cat} value={cat}>
                      {idx + 1}. {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kode Pos & Judul / Uraian Transaksi */}
              <div className="grid grid-cols-3 gap-3">
                {type === 'pengeluaran' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Pos *</label>
                    <input
                      type="text"
                      placeholder="e.g. POS-01"
                      value={posCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPosCode(val);
                        const resolved = resolveCategoryFromPos(val);
                        if (resolved) {
                          setCategory(resolved);
                        }
                        const matchByPos = rapbItems.find(
                          (r) =>
                            r.posCode.trim().toUpperCase() === val.trim().toUpperCase() ||
                            r.posCode.replace(/[^0-9A-Z]/g, '') === val.replace(/[^0-9A-Z]/g, '')
                        );
                        if (matchByPos) {
                          const cat = resolveCategoryFromPos(matchByPos.posCode) || normalizeCategory(matchByPos.category);
                          setCategory(cat);
                          if (!programName) {
                            setProgramName(matchByPos.programName);
                            setAutocompleteInput(matchByPos.programName);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-[#8a7c4c] focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none uppercase"
                    />
                  </div>
                )}

                <div className={type === 'pengeluaran' ? 'col-span-2' : 'col-span-3'}>
                  <label className="block font-bold text-slate-700 mb-1">
                    {type === 'pemasukan' ? 'Sumber Pemasukan / Uraian *' : 'Judul Transaksi Belanja *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pengadaan 10 Trofi Kristal / Konsumsi Dewan Juri"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* QTY, SATUAN, HARGA SATUAN, & TOTAL NOMINAL (KALKULASI OTOMATIS) */}
              {type === 'pengeluaran' ? (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kuantitas (Qty) *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={qty}
                        onChange={(e) => handleQtyChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Satuan *</label>
                      <input
                        type="text"
                        placeholder="buah, rim, paket, set"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Harga Satuan (Rp) *</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="Harga / pcs"
                        value={unitPrice}
                        onChange={(e) => handleUnitPriceChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Total Nominal Pengeluaran (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-[#8a7c4c]/40 rounded-xl text-slate-900 font-black text-sm focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Kalkulasi Otomatis: Qty × Harga Satuan = <strong>{formatIDR(amount)}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Pemasukan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>
              )}

              {/* URAIAN KETERANGAN / PENERIMA & NOMOR NOTA */}
              {type === 'pengeluaran' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Penerima / Toko / Vendor *</label>
                    <input
                      type="text"
                      placeholder="Contoh: CV Crystalindo Art / Toko Al-Ikhlas"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor Kuitansi / Bukti Nota *</label>
                    <input
                      type="text"
                      placeholder="Contoh: NOT-2026-105"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#8a7c4c] font-mono font-bold focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* UNGGAH FOTO NOTA (BUKTI FISIK) */}
              {type === 'pengeluaran' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 text-xs">
                      Foto Nota / Kuitansi Fisik (Kamera HP / Berkas)
                    </label>
                    {isUploadingProof && (
                      <span className="inline-flex items-center space-x-1 text-[10.5px] text-[#8a7c4c] font-bold animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Mengompres foto...</span>
                      </span>
                    )}
                  </div>

                  {proofPreviewUrl ? (
                    <div className="relative rounded-2xl border border-emerald-300 bg-emerald-50/50 p-3 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={proofPreviewUrl}
                          alt="Preview Nota"
                          className="w-14 h-14 object-cover rounded-xl border border-emerald-200 shrink-0 shadow-xs"
                        />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {proofFile ? proofFile.name : 'Foto Nota Terlampir'}
                          </p>
                          <span className="inline-flex items-center space-x-1 text-[10.5px] text-emerald-800 font-extrabold mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Foto Aktif & Siap Disimpan</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const w = window.open('');
                            if (w) w.document.write(`<img src="${proofPreviewUrl}" style="max-width:100%;height:auto;"/>`);
                          }}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition cursor-pointer"
                          title="Perbesar Foto"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveProof}
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                          title="Hapus / Ganti Foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Hidden File Inputs for Native Camera & Gallery */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                        tabIndex={-1}
                      />
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        tabIndex={-1}
                      />

                      {/* Live In-App Camera Viewfinder */}
                      {isLiveCameraOpen && (
                        <div className="p-3 bg-slate-900 rounded-2xl space-y-2.5 border border-slate-700 animate-in fade-in duration-200">
                          <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-rose-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              <span>LIVE KAMERA</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-center space-x-2 pt-0.5">
                            <button
                              type="button"
                              onClick={captureLiveFrame}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-md transition active:scale-95 cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Ambil Foto Nota Sekarang</span>
                            </button>
                            <button
                              type="button"
                              onClick={stopLiveCamera}
                              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons for Mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Tombol Kamera HP Langsung */}
                        <button
                          type="button"
                          onClick={() => {
                            if (cameraInputRef.current) {
                              cameraInputRef.current.value = '';
                              cameraInputRef.current.click();
                            }
                          }}
                          className="flex items-center justify-center space-x-2 p-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs shadow-xs transition cursor-pointer active:scale-95 text-center"
                        >
                          <Camera className="w-4 h-4 text-emerald-200 shrink-0" />
                          <span>Buka Kamera HP</span>
                        </button>

                        {/* Tombol Pilih dari Galeri */}
                        <button
                          type="button"
                          onClick={() => {
                            if (galleryInputRef.current) {
                              galleryInputRef.current.value = '';
                              galleryInputRef.current.click();
                            }
                          }}
                          className="flex items-center justify-center space-x-2 p-3 bg-white hover:bg-slate-50 text-slate-800 font-extrabold rounded-xl text-xs border border-slate-200 shadow-xs transition cursor-pointer active:scale-95 text-center"
                        >
                          <Upload className="w-4 h-4 text-[#8a7c4c] shrink-0" />
                          <span>Pilih dari Galeri / Berkas</span>
                        </button>
                      </div>

                      {/* Tombol Alternatif Live Viewfinder Kamera In-App */}
                      {!isLiveCameraOpen && (
                        <div className="flex items-center justify-center pt-0.5">
                          <button
                            type="button"
                            onClick={startLiveCamera}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1.5 hover:underline cursor-pointer py-1"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Atau aktifkan Kamera Langsung di Layar</span>
                          </button>
                        </div>
                      )}

                      {/* Atau Input Link / URL Bukti Foto */}
                      <div className="pt-0.5">
                        <input
                          type="url"
                          placeholder="Atau tempel link URL foto nota jika ada..."
                          value={proofUrlInput}
                          onChange={(e) => {
                            setProofUrlInput(e.target.value);
                            if (e.target.value.trim().startsWith('http') || e.target.value.trim().startsWith('data:')) {
                              setProofPreviewUrl(e.target.value.trim());
                            }
                          }}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8a7c4c]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Catatan Tambahan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Catatan pelunasan, nomor invoice, atau kontak vendor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isUploadingProof || isSubmittingTransaction}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingProof || isSubmittingTransaction}
                  className="px-5 py-2.5 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingProof ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah Nota...</span>
                    </>
                  ) : isSubmittingTransaction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Firebase Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi Kas (addDoc)'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH SALDO KAS FISIK (PENERIMAAN / TOP-UP KAS MILAD)
          ========================================================================= */}
      {isAddPemasukanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[rgba(138,124,76,0.3)] overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#fcfbf9] px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8a7c4c]/15 text-[#8a7c4c] flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#24211c]">Tambah Saldo Kas Fisik</h3>
                  <p className="text-[11px] text-[#7c7b77]">
                    Penerimaan dana kas tunai / dropping anggaran masuk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPemasukanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePemasukan} className="p-6 space-y-4 text-xs">
              {/* Input Nominal Saldo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal Tambah Saldo (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Contoh: 5000000"
                    value={pemasukanAmount}
                    onChange={(e) => setPemasukanAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 font-mono focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                  />
                </div>

                {/* Quick Nominal Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[500000, 1000000, 2500000, 5000000, 10000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPemasukanAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                        Number(pemasukanAmount) === preset
                          ? 'bg-[#8a7c4c] text-white border-[#8a7c4c]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {formatIDR(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanggal Penerimaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Masuk Kas *</label>
                <input
                  type="date"
                  required
                  value={pemasukanDate}
                  onChange={(e) => setPemasukanDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                />
              </div>

              {/* Sumber / Uraian Penerimaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sumber / Uraian Penerimaan Dana *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dropping Kas Bendahara Milad"
                  value={pemasukanSource}
                  onChange={(e) => setPemasukanSource(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                />

                {/* Quick Source Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Dropping Kas Bendahara Milad',
                    'Pencairan Anggaran Tahap 1',
                    'Pencairan Anggaran Tahap 2',
                    'Kas Awal Operasional Sie',
                    'Infaq / Bantuan Tambahan',
                  ].map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setPemasukanSource(src)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8a7c4c]/10 text-[#6f633a] hover:bg-[#8a7c4c]/20 transition cursor-pointer"
                    >
                      + {src}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Penyetor / Sumber */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diserahkan Oleh</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bendahara Umum"
                    value={pemasukanPenyetor}
                    onChange={(e) => setPemasukanPenyetor(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                  />
                </div>

                {/* Penerima Kas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diterima Oleh</label>
                  <input
                    type="text"
                    placeholder="Nama Penerima"
                    value={pemasukanPenerima}
                    onChange={(e) => setPemasukanPenerima(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Catatan tambahan jika ada..."
                  value={pemasukanNotes}
                  onChange={(e) => setPemasukanNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPemasukanModalOpen(false)}
                  disabled={isSavingPemasukan}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPemasukan}
                  className="px-5 py-2.5 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPemasukan ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Saldo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan ke Saldo Fisik</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RIWAYAT PENERIMAAN SALDO KAS FISIK
          ========================================================================= */}
      {showPemasukanListModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-[#fcfbf9] px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#24211c]">
                    Riwayat Penerimaan Saldo Kas
                  </h3>
                  <p className="text-[11px] text-[#7c7b77]">
                    Total Penerimaan: <span className="font-bold text-emerald-700">{formatIDR(totalPemasukan)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPemasukanListModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-2.5">
              {transactions.filter((t) => t.type === 'pemasukan').length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-xs">Belum Ada Riwayat Penerimaan Saldo</p>
                </div>
              ) : (
                transactions
                  .filter((t) => t.type === 'pemasukan')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 text-xs truncate">{item.title}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
                            <span>{item.date}</span>
                            {item.recipient && <span>• Penerima: {item.recipient}</span>}
                            {item.notes && <span className="truncate">• {item.notes}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="font-black text-emerald-700 font-mono text-sm">
                          +{formatIDR(item.amount)}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {confirmDeletePemasukanId === item.id ? (
                            <div className="flex items-center space-x-1 animate-in fade-in duration-150">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deleteTransactionFromFirestore(item.id);
                                    if (onDeleteTransaction) {
                                      await onDeleteTransaction(item.id);
                                    }
                                    setConfirmDeletePemasukanId(null);
                                    setToast({
                                      type: 'success',
                                      title: 'Saldo Dihapus',
                                      message: `Penerimaan kas "${item.title}" sebesar ${formatIDR(item.amount)} berhasil dihapus dari Saldo Fisik.`,
                                    });
                                  } catch (e: any) {
                                    console.error('Gagal menghapus saldo:', e);
                                    setToast({
                                      type: 'error',
                                      title: 'Gagal Menghapus',
                                      message: e?.message || 'Gagal menghapus data dari Firestore.',
                                    });
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition cursor-pointer"
                              >
                                Ya, Hapus!
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePemasukanId(null)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] rounded-lg transition cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePemasukanId(item.id)}
                              className="px-2 py-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center space-x-1"
                              title="Hapus Penerimaan Saldo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[10.5px] font-bold">Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#fcfbf9] px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowPemasukanListModal(false);
                  setIsAddPemasukanModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold text-xs rounded-xl shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tambah Saldo Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPemasukanListModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KELOLA POS ANGGARAN RAPB (TAMBAH / EDIT POS RAPB)
          ========================================================================= */}
      {isRapbModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in duration-200">
            <div className="bg-[#fcfbf9] px-6 py-4.5 border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#8a7c4c]" />
                <span>{editingRapb ? 'Edit Pos RAPB' : 'Tambah Pos RAPB Baru'}</span>
              </h3>
              <button
                onClick={() => setIsRapbModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRapbItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">POS (Kode) *</label>
                  <input
                    type="text"
                    required
                    placeholder="POS-01"
                    value={rapbPosInput}
                    onChange={(e) => setRapbPosInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-[#8a7c4c] uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Kategori Program *</label>
                  <select
                    value={rapbCatInput}
                    onChange={(e) => setRapbCatInput(e.target.value as TransactionCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URAIAN (Nama Kegiatan / Program) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembuatan Trofi Kristal & Plakat Juara"
                  value={rapbNameInput}
                  onChange={(e) => setRapbNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              {/* Rincian Komponen Perhitungan Anggaran (QTM, KET, VOL, KET, SATUAN) */}
              <div className="bg-[#fcfbf9] p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wide">
                    Rincian Perhitungan Realita Anggaran
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Rumus: QTM × VOL × SATUAN = JUMLAH
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">QTM (Qty 1) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="Contoh: 25"
                      value={rapbQtmInput}
                      onChange={(e) => handleRapbQtmChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">KET (Satuan QTM)</label>
                    <input
                      type="text"
                      placeholder="Buah / Pcs"
                      value={rapbQtmKetInput}
                      onChange={(e) => setRapbQtmKetInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">VOL (Volume 2) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="Contoh: 1"
                      value={rapbVolInput}
                      onChange={(e) => handleRapbVolChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">KET (Satuan VOL)</label>
                    <input
                      type="text"
                      placeholder="Kegiatan / Kali"
                      value={rapbVolKetInput}
                      onChange={(e) => setRapbVolKetInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">SATUAN (Harga Satuan Rp) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      placeholder="Contoh: 500000"
                      value={rapbUnitPriceInput}
                      onChange={(e) => handleRapbUnitPriceChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {formatIDR(Number(rapbUnitPriceInput) || 0)} / satuan
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#8a7c4c] mb-1 text-[11px]">JUMLAH (Total RAPB Rp) *</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={rapbBudgetInput}
                      onChange={(e) => setRapbBudgetInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-[#8a7c4c]/40 rounded-xl font-black text-sm text-[#8a7c4c]"
                    />
                    <div className="text-[10px] font-bold text-[#8a7c4c] mt-0.5">
                      {formatIDR(Number(rapbBudgetInput) || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi / Spesifikasi Kebutuhan</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan rincian barang/jasa yang akan diadakan..."
                  value={rapbDescInput}
                  onChange={(e) => setRapbDescInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                {editingRapb && (
                  <button
                    type="button"
                    onClick={() => {
                      setRapbToDelete(editingRapb);
                    }}
                    className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    Hapus Pos
                  </button>
                )}
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsRapbModalOpen(false)}
                    className="px-3.5 py-1.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                  >
                    Simpan Pos RAPB
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH POS RAPB SERENTAK (SEKALIGUS BANYAK)
          ========================================================================= */}
      {isBulkRapbModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#fcfbf9] px-6 py-4 border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8a7c4c]/10 text-[#8a7c4c] flex items-center justify-center font-bold">
                  <ListPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Tambah Pos Anggaran RAPB Serentak (Banyak)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tambahkan beberapa pos kegiatan belanja RAPB sekaligus dengan formulir multi-baris atau salin dari Excel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkRapbModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setBulkMode('grid')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    bulkMode === 'grid'
                      ? 'bg-white text-[#8a7c4c] shadow-xs border border-[#8a7c4c]/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TableProperties className="w-3.5 h-3.5" />
                  <span>Formulir Tabel Multi-Baris (Grid)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkMode('paste')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    bulkMode === 'paste'
                      ? 'bg-white text-[#8a7c4c] shadow-xs border border-[#8a7c4c]/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Tempel Teks (Paste)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkMode('file')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    bulkMode === 'file'
                      ? 'bg-white text-[#8a7c4c] shadow-xs border border-[#8a7c4c]/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Unggah Berkas File (.csv / .txt / .json)</span>
                </button>
              </div>

              {bulkMode === 'paste' && (
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = rapbItems.length + 1;
                    const sample = [
                      `POS-${String(nextNum).padStart(2, '0')} | Pembuatan Trofi & Plakat Juara | 3500000 | PENGANUGERAHAN (25.200) | 25 set piala kristal`,
                      `POS-${String(nextNum + 1).padStart(2, '0')} | Hadiah Uang Pembinaan Juara Umum | 5000000 | HADIAH LOMBA (25.300) | Uang pembinaan lomba`,
                      `POS-${String(nextNum + 2).padStart(2, '0')} | Bisyarah Juarawan Daerah Teladan | 4000000 | JUARAWAN MMU DAN DAERAH (25.400) | Santri MMU daerah`,
                    ].join('\n');
                    setBulkPasteText(sample);
                  }}
                  className="text-[11px] font-bold text-[#8a7c4c] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Muat Contoh Format</span>
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* MODE 1: GRID MULTI-BARIS */}
              {bulkMode === 'grid' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>
                      Isi rincian setiap pos kegiatan belanja. Baris kosong dengan nama kosong tidak akan disimpan.
                    </span>
                    <span className="font-bold text-slate-700">{bulkRows.length} Baris Formulir</span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-[50vh]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#fcfbf9] text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="p-2.5 text-center w-10">No</th>
                            <th className="p-2.5 w-24">Kode Pos *</th>
                            <th className="p-2.5 min-w-[200px]">Nama Program / Kegiatan *</th>
                            <th className="p-2.5 min-w-[140px]">Kategori Pos *</th>
                            <th className="p-2.5 w-36 text-right">Realita RAPB (Rp) *</th>
                            <th className="p-2.5 min-w-[160px]">Keterangan</th>
                            <th className="p-2.5 text-center w-12">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {bulkRows.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-slate-50/70 transition">
                              <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={row.posCode}
                                  onChange={(e) => updateBulkRow(row.id, 'posCode', e.target.value.toUpperCase())}
                                  placeholder="POS-XX"
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-[#8a7c4c] text-xs focus:ring-1 focus:ring-[#8a7c4c]/50 focus:outline-none"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={row.programName}
                                  onChange={(e) => updateBulkRow(row.id, 'programName', e.target.value)}
                                  placeholder="Contoh: Pengadaan Seragam Panitia..."
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium text-xs focus:ring-1 focus:ring-[#8a7c4c]/50 focus:outline-none"
                                />
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={row.category}
                                  onChange={(e) => updateBulkRow(row.id, 'category', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-[#8a7c4c]/50 focus:outline-none"
                                >
                                  {categoriesList.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="50000"
                                  value={row.allocatedBudget}
                                  onChange={(e) => updateBulkRow(row.id, 'allocatedBudget', e.target.value)}
                                  placeholder="Realita Rp"
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-slate-900 text-xs focus:ring-1 focus:ring-[#8a7c4c]/50 focus:outline-none"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={row.description}
                                  onChange={(e) => updateBulkRow(row.id, 'description', e.target.value)}
                                  placeholder="Keterangan singkat..."
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs focus:ring-1 focus:ring-[#8a7c4c]/50 focus:outline-none"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeBulkRow(row.id)}
                                  disabled={bulkRows.length <= 1}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Hapus Baris Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={addBulkRow}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#8a7c4c] border border-dashed border-[#8a7c4c]/40 rounded-xl font-extrabold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Baris Baru</span>
                    </button>

                    <div className="text-right text-xs text-slate-600">
                      <span>Baris Terisi Valid: </span>
                      <strong className="text-slate-900">
                        {bulkRows.filter((r) => r.programName.trim().length > 0 && Number(r.allocatedBudget) > 0).length} Pos
                      </strong>
                      <span className="mx-2">•</span>
                      <span>Total RAPB Tambahan: </span>
                      <strong className="text-emerald-700">
                        {formatIDR(
                          bulkRows
                            .filter((r) => r.programName.trim().length > 0)
                            .reduce((sum, r) => sum + (Number(r.allocatedBudget) || 0), 0)
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: PASTE DARI EXCEL / SPREADSHEET */}
              {bulkMode === 'paste' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">
                      💡 Panduan Tempel Data (Copy-Paste):
                    </p>
                    <p>
                      Anda bisa langsung menyalin beberapa baris kolom dari <strong>Microsoft Excel</strong>, <strong>Google Sheets</strong>, atau menulis baris teks dengan pemisah pipa (<code>|</code>), tab, atau titik koma (<code>;</code>).
                    </p>
                    <p className="font-mono text-[10px] text-[#8a7c4c]">
                      Format: Kode Pos | Nama Program / Kegiatan | Realita Anggaran (Rp) | Kategori | Keterangan
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tempel Teks Baris Pos RAPB di Bawah Ini:
                    </label>
                    <textarea
                      rows={6}
                      value={bulkPasteText}
                      onChange={(e) => setBulkPasteText(e.target.value)}
                      placeholder={`Contoh:\nPOS-01 | Pembuatan Trofi & Plakat | 3500000 | PENGANUGERAHAN (25.200) | 25 set piala\nPOS-02 | Hadiah Juara Lomba | 5000000 | HADIAH LOMBA (25.300) | Uang tunai\nPOS-03 | Bisyarah Santri Teladan | 4000000 | JUARAWAN MMU DAN DAERAH (25.400) | Santri MMU`}
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/50 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Live Preview of Parsed Rows */}
                  {parsedPasteRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">
                          Hasil Deteksi Parsing ({parsedPasteRows.filter((r) => r.isValid).length} Valid dari {parsedPasteRows.length} Baris):
                        </span>
                        <span className="text-emerald-700">
                          Total RAPB: {formatIDR(parsedPasteRows.filter((r) => r.isValid).reduce((sum, r) => sum + r.allocatedBudget, 0))}
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-[#fcfbf9] text-slate-700 font-extrabold border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="p-2 text-center w-8">No</th>
                              <th className="p-2 w-20">Kode Pos</th>
                              <th className="p-2">Nama Program</th>
                              <th className="p-2">Kategori</th>
                              <th className="p-2 text-right">Realita RAPB</th>
                              <th className="p-2 text-center w-20">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {parsedPasteRows.map((row, idx) => (
                              <tr key={row.id} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                                <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-2 font-mono font-bold text-[#8a7c4c]">{row.posCode}</td>
                                <td className="p-2 font-bold text-slate-900">
                                  {row.programName || <span className="text-rose-500 italic">Nama kosong</span>}
                                </td>
                                <td className="p-2 text-slate-600">{row.category}</td>
                                <td className="p-2 text-right font-black text-slate-800">
                                  {formatIDR(row.allocatedBudget)}
                                </td>
                                <td className="p-2 text-center">
                                  {row.isValid ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200 text-[10px]">
                                      Siap Input
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                                      Tidak Lengkap
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: UNGGAH BERKAS FILE (.CSV, .TXT, .JSON) */}
              {bulkMode === 'file' && (
                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-[#8a7c4c]/40 hover:border-[#8a7c4c] bg-[#fdfbf7] rounded-2xl flex flex-col items-center justify-center text-center group transition">
                    <FileUp className="w-10 h-10 text-[#8a7c4c] mb-2 group-hover:scale-110 transition" />
                    <span className="font-extrabold text-slate-800 text-sm">
                      {uploadedRapbFileName ? `Berkas Terpilih: ${uploadedRapbFileName}` : 'Pilih Berkas RAPB (.csv, .txt, .tsv, .json)'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 max-w-md">
                      Unggah berkas spreadsheet/tabel Anda. Sistem akan langsung mengekstrak pos belanja dan realita anggaran secara otomatis.
                    </span>
                    <label className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl text-xs transition shadow-2xs cursor-pointer">
                      <FileUp className="w-4 h-4" />
                      <span>{uploadedRapbFileName ? 'Ganti Berkas Lain' : 'Pilih Berkas dari Komputer'}</span>
                      <input
                        type="file"
                        accept=".csv,.txt,.tsv,.json"
                        onChange={handleRapbFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Hasil Deteksi Berkas */}
                  {parsedPasteRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">
                          Hasil Ekstraksi ({parsedPasteRows.filter((r) => r.isValid).length} Pos Terdeteksi Siap Simpan):
                        </span>
                        <span className="text-emerald-700">
                          Total RAPB Tambahan: {formatIDR(parsedPasteRows.filter((r) => r.isValid).reduce((sum, r) => sum + r.allocatedBudget, 0))}
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-[#fcfbf9] text-slate-700 font-extrabold border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="p-2 text-center w-8">No</th>
                              <th className="p-2 w-20">Kode Pos</th>
                              <th className="p-2">Nama Program</th>
                              <th className="p-2">Kategori</th>
                              <th className="p-2 text-right">Realita RAPB</th>
                              <th className="p-2 text-center w-20">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {parsedPasteRows.map((row, idx) => (
                              <tr key={row.id} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                                <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-2 font-mono font-bold text-[#8a7c4c]">{row.posCode}</td>
                                <td className="p-2 font-bold text-slate-900">{row.programName}</td>
                                <td className="p-2 text-slate-600">{row.category}</td>
                                <td className="p-2 text-right font-black text-slate-800">
                                  {formatIDR(row.allocatedBudget)}
                                </td>
                                <td className="p-2 text-center">
                                  {row.isValid ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200 text-[10px]">
                                      Siap Input
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                                      Tidak Lengkap
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-[#fcfbf9] flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500">
                {bulkMode === 'grid' ? (
                  <span>
                    Siap menambahkan{' '}
                    <strong className="text-slate-900">
                      {bulkRows.filter((r) => r.programName.trim().length > 0 && Number(r.allocatedBudget) > 0).length} Pos
                    </strong>{' '}
                    RAPB ke sistem
                  </span>
                ) : (
                  <span>
                    Siap menambahkan{' '}
                    <strong className="text-slate-900">
                      {parsedPasteRows.filter((r) => r.isValid).length} Pos
                    </strong>{' '}
                    RAPB dari teks tempelan
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBulkRapbModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkRapb}
                  className="px-5 py-2 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {bulkMode === 'grid'
                      ? `Simpan ${bulkRows.filter((r) => r.programName.trim().length > 0 && Number(r.allocatedBudget) > 0).length} Pos Sekaligus`
                      : `Simpan ${parsedPasteRows.filter((r) => r.isValid).length} Pos Sekaligus`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL KONFIRMASI HAPUS POS RAPB (IN-APP DIALOG - BEBAS WINDOW.CONFIRM)
          ========================================================================= */}
      {rapbToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Hapus Pos Anggaran?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Apakah Anda yakin ingin menghapus pos anggaran{' '}
              <strong className="text-slate-900 font-mono font-bold">{rapbToDelete.posCode}</strong> (
              <span className="font-bold text-slate-800">{rapbToDelete.programName}</span>) dengan realita{' '}
              <strong className="text-[#8a7c4c] font-black">{formatIDR(rapbToDelete.allocatedBudget)}</strong>?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-3 text-[11px] text-amber-800 text-left">
              💡 <strong>Catatan:</strong> Transaksi kas keluar yang sudah dicatat sebelumnya tetap aman dan tidak akan terhapus.
            </div>
            <div className="flex items-center justify-center space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setRapbToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmDeleteRapb}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Pos Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL KONFIRMASI KOSONGKAN SEMUA POS RAPB
          ========================================================================= */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Kosongkan Semua Pos RAPB?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Tindakan ini akan menghapus seluruh <strong className="text-slate-900">{rapbItems.length} pos anggaran</strong> yang saat ini terdaftar di tabel realita.
            </p>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 mt-3 text-[11px] text-rose-800 text-left">
              ⚠️ <strong>Peringatan:</strong> Data realita akan dikosongkan. Anda dapat mengimpor kembali melalui berkas Excel/CSV atau menambah pos baru kapan saja.
            </div>
            <div className="flex items-center justify-center space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmClearAllRapb}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Kosongkan Semua Pos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL KONFIRMASI HAPUS TRANSAKSI KAS
          ========================================================================= */}
      {trxToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Hapus Transaksi Kas?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Hapus transaksi <strong className="text-slate-900">{trxToDelete.title}</strong>{' '}
              (<span className="font-mono text-[#8a7c4c] font-bold">{trxToDelete.receiptNumber || trxToDelete.date}</span>) sejumlah{' '}
              <strong className="text-rose-700 font-black">{formatIDR(trxToDelete.amount)}</strong>?
            </p>
            <div className="flex items-center justify-center space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setTrxToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmDeleteTrx}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: UNGGAH & PARSING BERKAS RAPB (EXCEL / CSV)
          ========================================================================= */}
      <RapbImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onBulkAddRapb={handleBulkAddRapb}
        existingCount={rapbItems.length}
      />
    </div>
  );
};
