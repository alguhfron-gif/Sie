import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Wrench,
  Search,
  KeyRound,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Bell,
  LogOut,
  Infinity as InfinityIcon,
  FileSpreadsheet,
  Download,
  Upload,
  Copy,
  Check,
  Zap,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
  IdCard,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { CommitteeAccount, UserSession, AccountRoleType } from '../types';
import { ContentHeader } from './ContentHeader';
import { subscribeUserPresence, UserPresence } from '../services/presenceService';
import {
  ACCOUNT_ROLE_OPTIONS,
  AccountRoleOption,
  getRoleOptionById,
} from '../utils/accountRoles';

interface AccountsViewProps {
  accounts: CommitteeAccount[];
  onAddAccount: (newAcc: Omit<CommitteeAccount, 'id'>) => Promise<void>;
  onAddBatchAccounts?: (newAccs: Array<Omit<CommitteeAccount, 'id'>>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onUpdateAccount: (acc: CommitteeAccount) => Promise<void>;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onSwitchUser?: (acc: CommitteeAccount) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onAddAccount,
  onAddBatchAccounts,
  onDeleteAccount,
  onUpdateAccount,
  currentUser,
  onLogout,
  onSwitchUser,
}) => {
  const isPetugas = currentUser?.category === 'petugas' || (currentUser?.role ? currentUser.role.toLowerCase().includes('petugas') : false);
  const isAdmin = !isPetugas;

  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'petugas' | AccountRoleType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});

  // Real-time user presence subscription
  React.useEffect(() => {
    const unsubscribe = subscribeUserPresence((presences) => {
      const pMap: Record<string, UserPresence> = {};
      presences.forEach((p) => {
        pMap[p.id] = p;
        pMap[p.name.toLowerCase().trim()] = p;
      });
      setPresenceMap(pMap);
    });
    return () => unsubscribe();
  }, []);

  // Modal State Single
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<CommitteeAccount | null>(null);

  // Form State Single (ID Personalia, Nama, Jabatan, Pilihan Role Resmi, Password > 6 Angka)
  const [formData, setFormData] = useState({
    idPersonalia: '',
    name: '',
    role: '',
    accountType: 'madrasah' as AccountRoleType,
    category: 'petugas' as 'admin' | 'petugas',
    badge: 'Madrasah (Petugas)',
    defaultPin: '12345678', // Wajib > 6 angka (default 8 angka)
    avatarBg: 'bg-sky-500 text-white font-bold',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [addedAccountToast, setAddedAccountToast] = useState<{
    idPersonalia?: string;
    name: string;
    role: string;
    accountType?: AccountRoleType;
    category: 'admin' | 'petugas';
    defaultPin: string;
  } | null>(null);

  // Bulk Import State (Menampung 150+ Akun Sekaligus Tanpa Batasan)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<'paste' | 'generator'>('paste');
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkDefaultRole, setBulkDefaultRole] = useState('PETUGAS PENILAIAN LAPANGAN');
  const [bulkDefaultAccountType, setBulkDefaultAccountType] = useState<AccountRoleType>('madrasah');
  const [bulkDefaultCategory, setBulkDefaultCategory] = useState<'admin' | 'petugas'>('petugas');
  const [bulkPinMode, setBulkPinMode] = useState<'same' | 'random'>('same');
  const [bulkCustomPin, setBulkCustomPin] = useState('12345678'); // Default > 6 angka
  const [genPrefix, setGenPrefix] = useState('Petugas Penilai');
  const [genCount, setGenCount] = useState(25);
  const [genStartNumber, setGenStartNumber] = useState(1);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Safe toast dismissals with cleanup
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (addedAccountToast) {
      timer = setTimeout(() => setAddedAccountToast(null), 8000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [addedAccountToast]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (successMsg) {
      timer = setTimeout(() => setSuccessMsg(null), 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [successMsg]);

  // Filter accounts by category and search (Nama, ID Personalia, Jabatan)
  const filteredAccounts = accounts.filter((acc) => {
    const matchesCategory = activeTab === 'all' || acc.category === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      acc.name.toLowerCase().includes(q) ||
      (acc.idPersonalia && acc.idPersonalia.toLowerCase().includes(q)) ||
      acc.role.toLowerCase().includes(q) ||
      acc.badge.toLowerCase().includes(q) ||
      acc.id.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const adminCount = accounts.filter((a) => a.category === 'admin').length;
  const petugasCount = accounts.filter((a) => a.category === 'petugas').length;
  const onlineCount = accounts.filter(
    (a) => presenceMap[a.id]?.isOnline || presenceMap[a.name.toLowerCase().trim()]?.isOnline
  ).length;

  // Parsed bulk accounts from text paste (Format: ID Personalia, Nama, Jabatan, Password > 6 Angka)
  const parsedBulkAccounts = useMemo(() => {
    if (!bulkRawText.trim()) return [];
    const lines = bulkRawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const defaultRoleOpt = getRoleOptionById(bulkDefaultAccountType);

    return lines
      .map((line, idx) => {
        const parts = line.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
        let idPersonalia = '';
        let name = '';
        let role = bulkDefaultRole;
        let accountType: AccountRoleType = bulkDefaultAccountType;
        let category: 'admin' | 'petugas' = defaultRoleOpt.category;
        let badge = defaultRoleOpt.badge;
        let pin = bulkCustomPin || '12345678';

        if (parts.length >= 4) {
          // Format 4 kolom: ID Personalia, Nama, Jabatan, Password
          idPersonalia = parts[0];
          name = parts[1];
          role = parts[2];
          pin = parts[3];
        } else if (parts.length === 3) {
          // Format 3 kolom: Nama, Jabatan, Password
          name = parts[0];
          role = parts[1];
          pin = parts[2];
        } else if (parts.length === 2) {
          // Format 2 kolom: Nama, Jabatan
          name = parts[0];
          role = parts[1];
        } else if (parts.length === 1) {
          // Format 1 kolom: Nama
          name = parts[0];
        }

        if (!idPersonalia) {
          idPersonalia = `PERS-${String(accounts.length + 1 + idx).padStart(3, '0')}`;
        }

        // Pastikan password / PIN > 6 angka
        if (bulkPinMode === 'random') {
          pin = String(Math.floor(10000000 + Math.random() * 90000000)); // 8 angka
        } else if (pin.length <= 6) {
          pin = '12345678'; // fallback to valid 8-digit password
        }

        const isExisting = accounts.some(
          (a) =>
            a.name.toUpperCase().trim() === name.toUpperCase().trim() ||
            (a.idPersonalia && a.idPersonalia.toUpperCase().trim() === idPersonalia.toUpperCase().trim())
        );

        return {
          idPersonalia: idPersonalia.toUpperCase(),
          name: name.toUpperCase(),
          role: role.toUpperCase(),
          accountType,
          category,
          badge,
          defaultPin: pin,
          avatarBg:
            accountType === 'panitia'
              ? 'bg-emerald-600 text-white font-bold'
              : accountType === 'madrasah'
              ? 'bg-sky-500 text-white font-bold'
              : accountType === 'alumni'
              ? 'bg-teal-600 text-white font-bold'
              : accountType === 'pengurus_instansi'
              ? 'bg-purple-600 text-white font-bold'
              : 'bg-amber-600 text-white font-bold',
          isExisting,
        };
      })
      .filter((item) => item.name.length > 0);
  }, [bulkRawText, bulkDefaultRole, bulkDefaultAccountType, bulkPinMode, bulkCustomPin, accounts]);

  // Generated bulk accounts (Otomatis generate ID Personalia, Nama, Jabatan, dan Password > 6 Angka)
  const generatedBulkAccounts = useMemo(() => {
    const count = Math.min(Math.max(genCount || 1, 1), 200);
    const items = [];
    const defaultRoleOpt = getRoleOptionById(bulkDefaultAccountType);

    for (let i = 0; i < count; i++) {
      const num = genStartNumber + i;
      const numStr = num < 10 ? `0${num}` : `${num}`;
      const idPersonalia = `PERS-${String(num).padStart(3, '0')}`;
      const name = `${genPrefix.trim()} ${numStr}`.toUpperCase();
      const pin =
        bulkPinMode === 'random'
          ? String(Math.floor(10000000 + Math.random() * 90000000)) // 8 angka (> 6 angka)
          : (bulkCustomPin.trim().length > 6 ? bulkCustomPin.trim() : '12345678');
      const isExisting = accounts.some(
        (a) =>
          a.name.toUpperCase().trim() === name ||
          (a.idPersonalia && a.idPersonalia.toUpperCase().trim() === idPersonalia)
      );

      items.push({
        idPersonalia,
        name,
        role: bulkDefaultRole.toUpperCase(),
        accountType: bulkDefaultAccountType,
        category: defaultRoleOpt.category,
        badge: defaultRoleOpt.badge,
        defaultPin: pin,
        avatarBg:
          bulkDefaultAccountType === 'panitia'
            ? 'bg-emerald-600 text-white font-bold'
            : bulkDefaultAccountType === 'madrasah'
            ? 'bg-sky-500 text-white font-bold'
            : bulkDefaultAccountType === 'alumni'
            ? 'bg-teal-600 text-white font-bold'
            : bulkDefaultAccountType === 'pengurus_instansi'
            ? 'bg-purple-600 text-white font-bold'
            : 'bg-amber-600 text-white font-bold',
        isExisting,
      });
    }
    return items;
  }, [genPrefix, genCount, genStartNumber, bulkDefaultRole, bulkDefaultAccountType, bulkPinMode, bulkCustomPin, accounts]);

  // Handle saving bulk accounts to Firestore
  const handleSaveBulk = async () => {
    const targetList = bulkTab === 'paste' ? parsedBulkAccounts : generatedBulkAccounts;
    const validList = targetList.filter((item) => !item.isExisting);

    if (validList.length === 0) {
      alert('Tidak ada akun baru yang dapat ditambahkan (semua nama akun pada daftar sudah terdaftar di sistem).');
      return;
    }

    setIsBulkSubmitting(true);
    setBulkProgress({ current: 0, total: validList.length });

    try {
      if (onAddBatchAccounts) {
        await onAddBatchAccounts(validList);
      } else {
        for (let i = 0; i < validList.length; i++) {
          await onAddAccount(validList[i]);
          setBulkProgress({ current: i + 1, total: validList.length });
        }
      }
      setSuccessMsg(`Alhamdulillah! Berhasil menambahkan ${validList.length} akun panitia baru ke database Cloud!`);
      setIsBulkModalOpen(false);
      setBulkRawText('');
    } catch (err) {
      console.error('Failed bulk add accounts:', err);
      alert('Gagal menyimpan sebagian akun. Pastikan koneksi internet stabil.');
    } finally {
      setIsBulkSubmitting(false);
      setBulkProgress(null);
    }
  };

  // Export full accounts list to Excel (.xlsx)
  const handleExportAccountsExcel = async () => {
    setIsExportingExcel(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Panitia Milad Sidogiri';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Rekap Akun Panitia', {
        views: [{ showGridLines: true }],
      });

      sheet.columns = [
        { header: 'NO', key: 'no', width: 6 },
        { header: 'ID PERSONALIA', key: 'idPersonalia', width: 18 },
        { header: 'NAMA PANITIA / PETUGAS', key: 'name', width: 34 },
        { header: 'JABATAN RESMI', key: 'role', width: 30 },
        { header: 'PILIHAN ROLE (5 PILIHAN)', key: 'roleOption', width: 28 },
        { header: 'HAK AKSES KATEGORI PENILAIAN', key: 'allowedCategories', width: 48 },
        { header: 'PASSWORD / PIN (> 6 ANGKA)', key: 'pin', width: 26 },
        { header: 'STATUS REALTIME', key: 'status', width: 18 },
        { header: 'TERAKHIR AKTIF', key: 'lastActive', width: 24 },
      ];

      // Title Row 1
      sheet.spliceRows(1, 0, []);
      sheet.spliceRows(1, 0, []);
      sheet.mergeCells('A1:I1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'DAFTAR REKAPITULASI RESMI AKUN PANITIA & PETUGAS PENILAIAN';
      titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A29' }, // Sidogiri Green
      };
      sheet.getRow(1).height = 28;

      // Subtitle Row 2
      sheet.mergeCells('A2:I2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Milad & Ikhtibar Pondok Pesantren Sidogiri • Format: ID Personalia, Nama, Jabatan, Role (5 Pilihan), Password (> 6 Angka) • Total Akun: ${accounts.length}`;
      subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      subCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2D5A3F' },
      };
      sheet.getRow(2).height = 20;

      // Header Row 3
      const headerRow = sheet.getRow(3);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF8A7C4C' }, // Sidogiri Gold / Olive
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF473C24' } },
          bottom: { style: 'medium', color: { argb: 'FF473C24' } },
          left: { style: 'thin', color: { argb: 'FF473C24' } },
          right: { style: 'thin', color: { argb: 'FF473C24' } },
        };
      });

      // Data Rows
      accounts.forEach((acc, index) => {
        const presence = presenceMap[acc.id] || presenceMap[acc.name.toLowerCase().trim()];
        const isOnline = presence?.isOnline;
        const lastActive = presence?.lastActiveAt ? new Date(presence.lastActiveAt).toLocaleString('id-ID') : '-';
        const roleOpt = getRoleOptionById(acc.accountType || (acc.category === 'admin' ? 'panitia' : 'madrasah'));

        const row = sheet.addRow({
          no: index + 1,
          idPersonalia: acc.idPersonalia || `PERS-${String(index + 1).padStart(3, '0')}`,
          name: acc.name,
          role: acc.role,
          roleOption: roleOpt.label,
          allowedCategories: roleOpt.categoryNames.join(', '),
          pin: acc.defaultPin || '12345678',
          status: isOnline ? '🟢 ONLINE' : '⚪ OFFLINE',
          lastActive,
        });

        row.height = 20;
        const isEven = index % 2 === 0;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = {
            vertical: 'middle',
            horizontal:
              colNumber === 1 || colNumber === 2 || colNumber === 5 || colNumber === 7 || colNumber === 8
                ? 'center'
                : 'left',
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9F9F8' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekap_Akun_Panitia_Milad_Sidogiri_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export accounts:', err);
      alert('Gagal membuat file rekap Excel akun.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAcc(null);
    const defaultOpt = ACCOUNT_ROLE_OPTIONS[1]; // 2. Madrasah (petugas)
    setFormData({
      idPersonalia: `PERS-${String(accounts.length + 1).padStart(3, '0')}`,
      name: '',
      role: 'PETUGAS MADRASAH & PENILAIAN',
      accountType: 'madrasah',
      category: 'petugas',
      badge: defaultOpt.badge,
      defaultPin: '12345678', // Default 8 angka (> 6 angka)
      avatarBg: 'bg-sky-500 text-white font-bold',
    });
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (acc: CommitteeAccount) => {
    setEditingAcc(acc);
    const resolved = getRoleOptionById(acc.accountType || (acc.category === 'admin' ? 'panitia' : 'madrasah'));
    setFormData({
      idPersonalia: acc.idPersonalia || acc.id,
      name: acc.name,
      role: acc.role,
      accountType: resolved.id,
      category: acc.category,
      badge: acc.badge || resolved.badge,
      defaultPin: acc.defaultPin || '12345678',
      avatarBg: acc.avatarBg || (acc.category === 'admin' ? 'bg-[#00a65a] text-white font-bold' : 'bg-sky-500 text-white font-bold'),
    });
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedRole = formData.role.trim();
    const trimmedPin = formData.defaultPin.trim();
    const trimmedIdPersonalia = (
      formData.idPersonalia.trim() ||
      editingAcc?.idPersonalia ||
      `PERS-${String(accounts.length + 1).padStart(3, '0')}`
    ).toUpperCase();

    if (!trimmedName) {
      setErrorMsg('Nama lengkap panitia / petugas wajib diisi.');
      return;
    }
    if (!trimmedRole) {
      setErrorMsg('Jabatan resmi panitia / petugas wajib diisi.');
      return;
    }
    if (!trimmedPin) {
      setErrorMsg('Password / PIN akun wajib diisi.');
      return;
    }

    // SYARAT MUTLAK: PASSWORD LEBIH DARI 6 ANGKA
    if (trimmedPin.length <= 6) {
      setErrorMsg(
        `Password / PIN akun WAJIB LEBIH DARI 6 ANGKA (minimal 7 atau 8 angka)! Saat ini baru ${trimmedPin.length} karakter.`
      );
      return;
    }

    const resolvedRole = getRoleOptionById(formData.accountType);

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingAcc) {
        const updatedAccData: CommitteeAccount = {
          ...editingAcc,
          idPersonalia: trimmedIdPersonalia,
          name: trimmedName.toUpperCase(),
          role: trimmedRole.toUpperCase(),
          accountType: resolvedRole.id,
          category: resolvedRole.category,
          badge: resolvedRole.badge,
          defaultPin: trimmedPin,
          avatarBg: formData.avatarBg,
        };
        await onUpdateAccount(updatedAccData);

        // Ensure activeTab doesn't filter out the updated account category
        if (activeTab !== 'all' && activeTab !== resolvedRole.category && activeTab !== resolvedRole.id) {
          setActiveTab('all');
        }
        setSearchQuery('');
        setSuccessMsg(`Berhasil memperbarui data akun ${trimmedName} (${trimmedIdPersonalia}) - Role: ${resolvedRole.name}!`);
      } else {
        const newAccData = {
          idPersonalia: trimmedIdPersonalia,
          name: trimmedName.toUpperCase(),
          role: trimmedRole.toUpperCase(),
          accountType: resolvedRole.id,
          category: resolvedRole.category,
          badge: resolvedRole.badge,
          defaultPin: trimmedPin,
          avatarBg: formData.avatarBg,
        };
        await onAddAccount(newAccData);

        // Ensure activeTab doesn't filter out the new account category
        if (activeTab !== 'all' && activeTab !== resolvedRole.category && activeTab !== resolvedRole.id) {
          setActiveTab('all');
        }
        setSearchQuery('');
        setSuccessMsg(`Berhasil menambahkan akun ${newAccData.name} (${trimmedIdPersonalia}) - ${resolvedRole.name}!`);
        setAddedAccountToast({
          idPersonalia: trimmedIdPersonalia,
          name: newAccData.name,
          role: newAccData.role,
          accountType: resolvedRole.id,
          category: newAccData.category,
          defaultPin: newAccData.defaultPin,
        });
      }

      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menyimpan data akun. Pastikan koneksi internet terhubung.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${name}?`)) {
      try {
        await onDeleteAccount(id);
        setSuccessMsg(`Akun ${name} berhasil dihapus.`);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus akun.');
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Content Header & Breadcrumbs */}
      <ContentHeader
        title="Manajemen Akun Operator & Petugas"
        subtitle="Pengaturan Hak Akses User, Role Panitia, PIN Login, dan Status Akses"
        activeTab="akun"
      />

      {/* Top Banner Header Box with Unlimited Capacity Explanation & Action Buttons */}
      <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 text-[#8a7c4c]">
                <ShieldCheck className="w-5 h-5 text-[#8a7c4c]" />
                <h1 className="text-base font-extrabold text-[#24211c]">
                  Kelola Akun Operator & Penilai
                </h1>
              </div>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                <InfinityIcon className="w-3.5 h-3.5 mr-0.5 text-emerald-700" />
                <span>Kapasitas Bebas Tanpa Batas (Unlimited)</span>
              </span>
            </div>
            <p className="text-xs text-[#5c5a55] leading-relaxed">
              Sistem berbasis Google Cloud Firestore realtime: <strong>Tidak ada batasan akun</strong> (siap menampung <strong>150+ akun</strong> panitia & petugas penilai lapangan). Setiap petugas dapat login secara bersamaan dari HP maupun laptop masing-masing tanpa konflik sesi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shrink-0"
              title="Tambah 1 akun baru"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Akun</span>
            </button>

            <button
              onClick={() => {
                setIsBulkModalOpen(true);
                setBulkRawText('');
              }}
              className="px-3.5 py-2 bg-[#1e3a29] hover:bg-[#2d5a3f] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shrink-0"
              title="Tambah hingga puluhan / 150 akun sekaligus"
            >
              <Layers className="w-4 h-4 text-emerald-300" />
              <span>📥 Tambah Massal (150+ Akun)</span>
            </button>

            <button
              onClick={handleExportAccountsExcel}
              disabled={isExportingExcel}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shrink-0 disabled:opacity-50"
              title="Unduh seluruh akun dan PIN ke file Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isExportingExcel ? 'Mengekspor...' : 'Unduh Rekap (.xlsx)'}</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-2 bg-[#24211c] hover:bg-[#38342c] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4 text-[#c3b68b]" />
                <span>Keluar</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[rgba(36,33,28,0.08)]">
          <div className="bg-[#fcfbf9] border border-[rgba(36,33,28,0.08)] rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7c7b77] uppercase">Total Akun Terdaftar:</span>
            <span className="text-sm font-black text-[#24211c] font-mono">{accounts.length} Akun</span>
          </div>
          <div className="bg-[#fcfbf9] border border-[rgba(36,33,28,0.08)] rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7c7b77] uppercase">Admin / Panitia Inti:</span>
            <span className="text-sm font-black text-emerald-700 font-mono">{adminCount} Akun</span>
          </div>
          <div className="bg-[#fcfbf9] border border-[rgba(36,33,28,0.08)] rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7c7b77] uppercase">Petugas Penilai:</span>
            <span className="text-sm font-black text-sky-700 font-mono">{petugasCount} Akun</span>
          </div>
          <div className="bg-[#fcfbf9] border border-[rgba(36,33,28,0.08)] rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7c7b77] uppercase">Sedang Online:</span>
            <span className="text-sm font-black text-emerald-600 flex items-center font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
              {onlineCount} Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Floating Toast Popup Notification for Newly Added Account */}
      {addedAccountToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:w-80 z-50 bg-slate-900 border-2 border-emerald-500 text-white p-4 rounded-3xl shadow-2xl flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2 text-emerald-400">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div>
                <span className="font-black text-xs uppercase tracking-wider block leading-tight text-emerald-400">Notifikasi Akun Baru</span>
                <span className="text-[10px] text-slate-400 font-medium">Penambahan Akun Telah Selesai</span>
              </div>
            </div>
            <button
              onClick={() => setAddedAccountToast(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Nama Akun:</span>
              <span className="font-black text-emerald-400">{addedAccountToast.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Peran / Jabatan:</span>
              <span className="font-semibold text-slate-200 truncate max-w-[170px]">{addedAccountToast.role}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tingkat Akses:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                addedAccountToast.category === 'admin' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              }`}>
                {addedAccountToast.category}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Password / PIN:</span>
              <span className="font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {addedAccountToast.defaultPin}
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 p-1.5 rounded border border-emerald-800/60 text-center flex items-center justify-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Otomatis tersinkron & aktif untuk login!</span>
            </div>
          </div>

          <div className="space-y-2">
            {onSwitchUser && (
              <button
                onClick={() => {
                  const targetAcc = accounts.find((a) => a.name.toUpperCase().trim() === addedAccountToast.name.toUpperCase().trim()) || {
                    id: `acc-${Date.now()}`,
                    name: addedAccountToast.name,
                    role: addedAccountToast.role,
                    category: addedAccountToast.category,
                    badge: addedAccountToast.category === 'admin' ? 'Admin / Panitia' : 'Petugas Lapangan',
                    defaultPin: addedAccountToast.defaultPin,
                  };
                  onSwitchUser(targetAcc);
                  setAddedAccountToast(null);
                }}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>⚡ Beralih & Masuk Akun Baru Ini</span>
              </button>
            )}

            <button
              onClick={() => {
                navigator.clipboard.writeText(`Nama: ${addedAccountToast.name}\nPIN: ${addedAccountToast.defaultPin}\nKategori: ${addedAccountToast.category.toUpperCase()}`);
                alert('Info Login akun baru berhasil disalin!');
              }}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-[11px] transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>📋 Salin Info Login (PIN & Nama)</span>
            </button>

            <button
              onClick={() => setAddedAccountToast(null)}
              className="w-full py-1 text-slate-400 hover:text-white font-medium text-[11px] transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between space-x-3 shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-extrabold">{successMsg}</span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
            Selesai Ditambahkan
          </span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Akun Terdaftar</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{accounts.length} <span className="text-xs text-slate-500 font-medium">Panitia</span></p>
          </div>
        </div>

        <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00a65a] text-white font-black flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Tingkat ADMIN</p>
            <p className="text-2xl font-black text-emerald-950 mt-0.5">{adminCount} <span className="text-xs text-emerald-800 font-semibold">Pimpinan / Inti</span></p>
          </div>
        </div>

        <div className="bg-sky-50/80 p-5 rounded-2xl border border-sky-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white font-black flex items-center justify-center shrink-0 shadow-sm">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-sky-800 uppercase tracking-wider">Tingkat PETUGAS</p>
            <p className="text-2xl font-black text-sky-950 mt-0.5">{petugasCount} <span className="text-xs text-sky-800 font-semibold">Petugas Lapangan</span></p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Filter Category Tabs (Mendukung Semua 5 Pilihan Akun) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-none ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({accounts.length})
          </button>
          {ACCOUNT_ROLE_OPTIONS.map((opt) => {
            const count = accounts.filter(
              (a) => (a.accountType || (a.category === 'admin' ? 'panitia' : 'madrasah')) === opt.id
            ).length;
            const isTabActive = activeTab === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveTab(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  isTabActive
                    ? opt.category === 'admin'
                      ? 'bg-emerald-600 text-white font-black shadow-sm'
                      : 'bg-[#8a7c4c] text-white font-black shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{opt.label.split(' ')[1] || opt.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isTabActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari ID, nama atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => {
          const roleOpt = getRoleOptionById(acc.accountType || (acc.category === 'admin' ? 'panitia' : 'madrasah'));
          const isAdminAcc = roleOpt.category === 'admin';
          const isCurrentActive =
            currentUser &&
            ((currentUser.idPersonalia && acc.idPersonalia && currentUser.idPersonalia.toUpperCase() === acc.idPersonalia.toUpperCase()) ||
              currentUser.name.toUpperCase().includes(acc.name.toUpperCase()) ||
              currentUser.id === acc.id);
          const userPresence = presenceMap[acc.id] || presenceMap[acc.name.toLowerCase().trim()];
          const isOnline = userPresence?.status === 'online';

          return (
            <div
              key={acc.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition hover:shadow-md relative flex flex-col justify-between space-y-4 ${
                isAdminAcc
                  ? 'border-emerald-200/90 hover:border-emerald-400'
                  : 'border-slate-200/90 hover:border-[#8a7c4c]/50'
              }`}
            >
              <div>
                {/* Header Badge & Online Status Indicator */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isAdminAcc
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : roleOpt.id === 'madrasah'
                        ? 'bg-sky-100 text-sky-900 border-sky-300'
                        : roleOpt.id === 'alumni'
                        ? 'bg-teal-100 text-teal-900 border-teal-300'
                        : roleOpt.id === 'pengurus_instansi'
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {isAdminAcc ? <Shield className="w-3 h-3 text-emerald-700" /> : <Wrench className="w-3 h-3" />}
                    <span>{roleOpt.label}</span>
                  </span>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {isOnline ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>ONLINE</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        OFFLINE
                      </span>
                    )}

                    {isCurrentActive && (
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>Sesi Anda</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Profile Info (ID Personalia, Nama, Jabatan) */}
                <div className="flex items-start space-x-3.5 mt-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm shrink-0 shadow-sm border border-slate-200/60 ${
                      acc.avatarBg || (isAdminAcc ? 'bg-[#00a65a] text-white font-bold' : 'bg-sky-500 text-white font-bold')
                    }`}
                  >
                    {acc.name.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="inline-flex items-center space-x-1 font-mono text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <IdCard className="w-3 h-3 text-emerald-600 mr-0.5" />
                        <span>ID: {acc.idPersonalia || acc.id}</span>
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight truncate mt-1">
                      {acc.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5 leading-snug">
                      Jabatan: <span className="text-slate-800 font-bold">{acc.role}</span>
                    </p>
                  </div>
                </div>

                {/* Hak Akses Kategori Penilaian Sesuai Role Akun */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10.5px]">
                  <span className="font-bold text-slate-600 block uppercase tracking-wider text-[9.5px] mb-1">
                    Hak Akses Kategori Penilaian:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {roleOpt.categoryNames.map((cName, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[9.5px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium"
                      >
                        ✓ {cName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Password / PIN & Details */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center space-x-1.5 font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold">Password: {acc.defaultPin || '12345678'}</span>
                    <span className="text-[9px] text-emerald-700 font-sans font-extrabold ml-1">(&gt; 6 angka)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Doc: {acc.id}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {onSwitchUser && (
                  <button
                    onClick={() => onSwitchUser(acc)}
                    className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Switch Login</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenEditModal(acc)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                  title="Edit Akun"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(acc.id, acc.name)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                    title="Hapus Akun"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-700">Tidak ada akun ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada akun yang sesuai dengan pencarian atau kategori filter yang dipilih.
          </p>
        </div>
      )}

      {/* Modal Add / Edit Account */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex justify-center items-start sm:items-center min-h-screen">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full my-auto p-5 sm:p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pr-8 shrink-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                  formData.category === 'admin' ? 'bg-[#00a65a] text-white' : 'bg-sky-500 text-white'
                }`}
              >
                {formData.category === 'admin' ? <Shield className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {editingAcc ? 'Edit Akun Panitia' : 'Penambahan Akun Baru'}
                </h2>
                <p className="text-xs text-slate-500 truncate">
                  {editingAcc ? 'Ubah informasi hak akses & peran' : 'Tambahkan anggota panitia atau petugas baru'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs flex items-center space-x-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs min-h-0">
              {/* Pilihan 5 Kategori / Tingkat Akses Akun Resmi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-black text-slate-800 uppercase tracking-wider text-[11px]">
                    Pilihan Role & Hak Akses Akun:
                  </label>
                  <span className="text-[10px] font-bold text-[#8a7c4c] bg-[#f2eee3] px-2.5 py-0.5 rounded-full border border-[#c3b68b]/40">
                    5 Pilihan Resmi
                  </span>
                </div>

                <div className="space-y-2">
                  {ACCOUNT_ROLE_OPTIONS.map((opt) => {
                    const isSelected = formData.accountType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            accountType: opt.id,
                            category: opt.category,
                            badge: opt.badge,
                            defaultPin:
                              opt.category === 'admin' && formData.defaultPin === '1234'
                                ? '12345678'
                                : formData.defaultPin,
                            avatarBg:
                              opt.id === 'panitia'
                                ? 'bg-emerald-600 text-white font-bold'
                                : opt.id === 'madrasah'
                                ? 'bg-sky-500 text-white font-bold'
                                : opt.id === 'alumni'
                                ? 'bg-teal-600 text-white font-bold'
                                : opt.id === 'pengurus_instansi'
                                ? 'bg-purple-600 text-white font-bold'
                                : 'bg-amber-600 text-white font-bold',
                          })
                        }
                        className={`w-full p-3 rounded-2xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#fcfbf9] border-[#8a7c4c] ring-2 ring-[#8a7c4c]/30 shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100/90'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-[#8a7c4c] text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {opt.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-black text-xs ${isSelected ? 'text-[#8a7c4c]' : 'text-slate-800'}`}>
                              {opt.label}
                            </p>
                            <span
                              className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0 ${
                                opt.category === 'admin'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-sky-50 text-sky-800 border-sky-300'
                              }`}
                            >
                              {opt.category === 'admin' ? 'Admin' : 'Petugas'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            {opt.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {opt.categoryNames.map((cName, cIdx) => (
                              <span
                                key={cIdx}
                                className="text-[9.5px] px-1.5 py-0.2 rounded bg-white/90 border border-slate-200 text-slate-600 font-medium"
                              >
                                • {cName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ID Personalia */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">
                  ID Personalia: <span className="text-slate-400 font-normal">(Identitas resmi & bisa digunakan untuk login)</span>
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Contoh: PERS-001"
                    value={formData.idPersonalia}
                    onChange={(e) => setFormData({ ...formData, idPersonalia: e.target.value.toUpperCase() })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">
                  Nama Lengkap Panitia:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: AHMAD SAFII"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Jabatan Resmi */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">
                  Jabatan Resmi:
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.category === 'admin'
                      ? 'Contoh: KETUA SIE PENGANUGERAHAN'
                      : 'Contoh: PETUGAS PENILAIAN LAPANGAN'
                  }
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Password / PIN Lebih Dari 6 Angka */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-extrabold text-slate-700">
                    Password / PIN Masuk: <span className="text-rose-600 font-bold">*Wajib &gt; 6 Angka</span>
                  </label>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      formData.defaultPin.trim().length > 6
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {formData.defaultPin.trim().length > 6
                      ? `✅ Valid (> 6 angka: ${formData.defaultPin.trim().length} karakter)`
                      : `❌ Kurang (${formData.defaultPin.trim().length}/7 karakter)`}
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    maxLength={24}
                    placeholder="Minimal 7 atau 8 angka (Contoh: 12345678)"
                    value={formData.defaultPin}
                    onChange={(e) => setFormData({ ...formData, defaultPin: e.target.value })}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 ${
                      formData.defaultPin.trim().length > 6
                        ? 'border-emerald-300 focus:ring-emerald-500'
                        : 'border-rose-300 focus:ring-rose-500'
                    }`}
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ketentuan: Password akun wajib memiliki panjang <strong>lebih dari 6 angka</strong> (minimal 7 atau 8 digit angka).
                </p>
              </div>

              {/* Avatar Preset */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Warna Identitas Avatar:</label>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {[
                    { bg: 'bg-[#00a65a] text-white font-bold', label: 'Hijau (Admin)' },
                    { bg: 'bg-sky-500 text-white font-bold', label: 'Biru (Petugas)' },
                    { bg: 'bg-teal-600 text-white font-bold', label: 'Teal' },
                    { bg: 'bg-emerald-700 text-white font-bold', label: 'Hijau Tua' },
                    { bg: 'bg-slate-700 text-white font-bold', label: 'Slate' },
                  ].map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarBg: color.bg })}
                      className={`w-8 h-8 rounded-xl ${color.bg} flex items-center justify-center text-xs transition cursor-pointer shrink-0 ring-offset-2 ${
                        formData.avatarBg === color.bg ? 'ring-2 ring-slate-900 scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={color.label}
                    >
                      A
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 font-black rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer ${
                    formData.category === 'admin'
                      ? 'bg-[#00a65a] hover:bg-[#008d4c] text-white shadow-emerald-900/20'
                      : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{editingAcc ? 'Simpan Perubahan' : 'Tambah Akun'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import / Batch Generator Modal (Siap Menampung 150+ Akun Tanpa Batas) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-emerald-800" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Tambah / Impor Massal Akun Panitia
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Kapasitas Bebas (150+ Akun)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Tambahkan puluhan hingga 150 akun panitia sekaligus secara instan. Data tersimpan permanen di Cloud Firestore.
                </p>
              </div>
              <button
                onClick={() => !isBulkSubmitting && setIsBulkModalOpen(false)}
                disabled={isBulkSubmitting}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-200 shrink-0 mt-3">
              <button
                type="button"
                onClick={() => setBulkTab('paste')}
                className={`flex-1 py-2.5 px-4 font-bold text-xs flex items-center justify-center space-x-2 border-b-2 transition cursor-pointer ${
                  bulkTab === 'paste'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>📋 Tempel Daftar Nama (Copy-Paste)</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('generator')}
                className={`flex-1 py-2.5 px-4 font-bold text-xs flex items-center justify-center space-x-2 border-b-2 transition cursor-pointer ${
                  bulkTab === 'generator'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Generator Penomoran Akun Otomatis</span>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* Tab 1: Paste Text */}
              {bulkTab === 'paste' && (
                <div className="space-y-3">
                  <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl text-amber-900 text-[11px] leading-relaxed">
                    <strong>Format Data Akun:</strong> Terdiri dari <strong>(ID Personalia, Nama, Jabatan, Password)</strong>. Tempelkan daftar panitia di bawah ini (1 akun per baris). Password wajib <strong>lebih dari 6 angka</strong> (minimal 7 atau 8 digit angka).
                    <div className="mt-1.5 font-mono text-[10px] text-amber-800 bg-amber-100/70 p-2 rounded-xl">
                      Format fleksibel yang didukung: <br />
                      • Lengkap 4 kolom: <code className="bg-white px-1 py-0.5 rounded font-bold">PERS-01, Ust. M. Ridwan, Penilai Ranting, 12345678</code><br />
                      • 3 kolom (Nama, Jabatan, Password): <code className="bg-white px-1 py-0.5 rounded font-bold">Ust. Hasan Basri, Penilai Tahap I, 12345678</code><br />
                      • 2 kolom (Nama, Jabatan): <code className="bg-white px-1 py-0.5 rounded font-bold">Ust. Ali Wafa, Petugas Lapangan</code><br />
                      • Cukup Nama saja: <code className="bg-white px-1 py-0.5 rounded font-bold">Ust. Kholilurrahman</code> (ID Personalia & Password &gt; 6 angka otomatis dibuat)
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 mb-1">
                      Daftar Nama Panitia (Satu nama per baris):
                    </label>
                    <textarea
                      rows={6}
                      value={bulkRawText}
                      onChange={(e) => setBulkRawText(e.target.value)}
                      placeholder={`PERS-01, Ust. Ahmad Dahlan, Penilai Ranting, 12345678\nPERS-02, Ust. M. Syukron, Petugas Lapangan, 12345678\nPERS-03, Ust. Abdul Wahab, Koordinator, 12345678\n... (bisa hingga 150+ baris akun)`}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Generator */}
              {bulkTab === 'generator' && (
                <div className="space-y-3">
                  <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl text-sky-900 text-[11px] leading-relaxed">
                    <strong>Generator Cepat:</strong> Cocok jika Anda ingin menyiapkan 50, 100, atau 150 akun bernomor urut untuk dibagikan kepada para penilai / pemeriksa lapangan.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-extrabold text-slate-700 mb-1">Awalan Nama Akun:</label>
                      <input
                        type="text"
                        value={genPrefix}
                        onChange={(e) => setGenPrefix(e.target.value)}
                        placeholder="Contoh: Petugas Penilai"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Akan menjadi: {genPrefix || 'Akun'} 01, {genPrefix || 'Akun'} 02, dst.
                      </span>
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-700 mb-1">Jumlah Akun:</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={genCount}
                        onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Bisa hingga 150+ akun
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Settings For Batch */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-700 block uppercase tracking-wider text-[10px]">
                  ⚙️ Pengaturan Default untuk Akun yang Dibuat:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      Default Jabatan / Peran:
                    </label>
                    <input
                      type="text"
                      value={bulkDefaultRole}
                      onChange={(e) => setBulkDefaultRole(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      Pilihan Role & Akses:
                    </label>
                    <select
                      value={bulkDefaultAccountType}
                      onChange={(e) => {
                        const val = e.target.value as AccountRoleType;
                        setBulkDefaultAccountType(val);
                        const opt = getRoleOptionById(val);
                        setBulkDefaultCategory(opt.category);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {ACCOUNT_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      Pola PIN Masuk:
                    </label>
                    <div className="flex items-center space-x-1">
                      <select
                        value={bulkPinMode}
                        onChange={(e) => setBulkPinMode(e.target.value as 'same' | 'random')}
                        className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="same">PIN Sama</option>
                        <option value="random">PIN Acak (Unik)</option>
                      </select>
                      {bulkPinMode === 'same' && (
                        <input
                          type="text"
                          maxLength={16}
                          value={bulkCustomPin}
                          onChange={(e) => setBulkCustomPin(e.target.value)}
                          placeholder="1234"
                          className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview List */}
              {(() => {
                const targetList = bulkTab === 'paste' ? parsedBulkAccounts : generatedBulkAccounts;
                const newCount = targetList.filter((t) => !t.isExisting).length;
                const existingCount = targetList.filter((t) => t.isExisting).length;

                return (
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-800">
                          Pratinjau Akun ({targetList.length} Terdeteksi)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {newCount} Akun Baru Siap Dibuat
                        </span>
                        {existingCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            {existingCount} Sudah Terdaftar (Dilewati)
                          </span>
                        )}
                      </div>
                    </div>

                    {targetList.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        {bulkTab === 'paste'
                          ? 'Belum ada nama yang dimasukkan. Ketik atau tempelkan daftar nama di atas.'
                          : 'Tentukan jumlah akun yang ingin digenerate.'}
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50">
                        {targetList.slice(0, 15).map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 flex items-center justify-between text-xs ${
                              item.isExisting ? 'bg-amber-50/60 opacity-60' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span className="font-mono text-slate-400 text-[10px] w-5 text-right shrink-0">
                                {idx + 1}.
                              </span>
                              <span className="font-mono text-[10px] font-black bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                {item.idPersonalia}
                              </span>
                              <span className="font-bold text-slate-900 truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-500 truncate">• {item.role}</span>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold border border-slate-200">
                                Password: {item.defaultPin}
                              </span>
                              {item.isExisting ? (
                                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                                  Sudah Ada
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded flex items-center">
                                  <Check className="w-3 h-3 mr-0.5" />
                                  Siap Dibuat
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {targetList.length > 15 && (
                          <div className="p-2 text-center text-[10px] font-bold text-slate-500 bg-slate-100">
                            ... dan {targetList.length - 15} akun lainnya siap diproses sekaligus.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer Buttons & Progress */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-white">
              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Koneksi Realtime Cloud Firestore • Siap 150+ Multi-User</span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  disabled={isBulkSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer disabled:opacity-30"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulk}
                  disabled={
                    isBulkSubmitting ||
                    (bulkTab === 'paste' ? parsedBulkAccounts : generatedBulkAccounts).filter((t) => !t.isExisting).length === 0
                  }
                  className="px-5 py-2 bg-[#1e3a29] hover:bg-[#2d5a3f] text-white font-black rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-40"
                >
                  {isBulkSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                      <span>
                        Menyimpan ke Cloud ({bulkProgress?.current || 0} / {bulkProgress?.total || 0})...
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>
                        Simpan Semua ke Cloud (
                        {(bulkTab === 'paste' ? parsedBulkAccounts : generatedBulkAccounts).filter((t) => !t.isExisting).length}{' '}
                        Akun)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
