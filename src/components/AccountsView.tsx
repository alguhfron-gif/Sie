import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { CommitteeAccount, UserSession } from '../types';
import { ContentHeader } from './ContentHeader';
import { subscribeUserPresence, UserPresence } from '../services/presenceService';

interface AccountsViewProps {
  accounts: CommitteeAccount[];
  onAddAccount: (newAcc: Omit<CommitteeAccount, 'id'>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onUpdateAccount: (acc: CommitteeAccount) => Promise<void>;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onSwitchUser?: (acc: CommitteeAccount) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onAddAccount,
  onDeleteAccount,
  onUpdateAccount,
  currentUser,
  onLogout,
  onSwitchUser,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'petugas'>('all');
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

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<CommitteeAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    category: 'petugas' as 'admin' | 'petugas',
    badge: '',
    defaultPin: '1234',
    avatarBg: 'bg-sky-500 text-white font-bold',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [addedAccountToast, setAddedAccountToast] = useState<{
    name: string;
    role: string;
    category: 'admin' | 'petugas';
    defaultPin: string;
  } | null>(null);

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

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesCategory = activeTab === 'all' || acc.category === activeTab;
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const adminCount = accounts.filter((a) => a.category === 'admin').length;
  const petugasCount = accounts.filter((a) => a.category === 'petugas').length;

  const handleOpenAddModal = () => {
    setEditingAcc(null);
    setFormData({
      name: '',
      role: 'PETUGAS LAPANGAN & OPERASIONAL',
      category: 'petugas',
      badge: 'Petugas Operasional',
      defaultPin: '1234',
      avatarBg: 'bg-sky-500 text-white font-bold',
    });
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (acc: CommitteeAccount) => {
    setEditingAcc(acc);
    setFormData({
      name: acc.name,
      role: acc.role,
      category: acc.category,
      badge: acc.badge,
      defaultPin: acc.defaultPin || '1234',
      avatarBg: acc.avatarBg || 'bg-slate-700 text-white font-bold',
    });
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap panitia / petugas wajib diisi.');
      return;
    }
    if (!formData.role.trim()) {
      setErrorMsg('Jabatan / Peran panitia wajib diisi.');
      return;
    }
    if (formData.category === 'admin' && formData.defaultPin.trim().length < 8) {
      setErrorMsg('PIN / Kata Sandi untuk tingkat ADMIN wajib minimal 8 karakter / huruf.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingAcc) {
        const updatedAccData: CommitteeAccount = {
          ...editingAcc,
          name: formData.name.toUpperCase().trim(),
          role: formData.role.toUpperCase().trim(),
          category: formData.category,
          badge: formData.badge || (formData.category === 'admin' ? 'Admin / Panitia' : 'Petugas Lapangan'),
          defaultPin: formData.defaultPin || '1234',
          avatarBg: formData.avatarBg,
        };
        await onUpdateAccount(updatedAccData);

        // Ensure activeTab doesn't filter out the updated account category
        if (activeTab !== 'all' && activeTab !== formData.category) {
          setActiveTab('all');
        }
        setSearchQuery('');
        setSuccessMsg(`Berhasil memperbarui data akun ${formData.name}!`);
      } else {
        const newAccData = {
          name: formData.name.toUpperCase().trim(),
          role: formData.role.toUpperCase().trim(),
          category: formData.category,
          badge: formData.badge || (formData.category === 'admin' ? 'Admin / Panitia' : 'Petugas Lapangan'),
          defaultPin: formData.defaultPin || '1234',
          avatarBg: formData.avatarBg,
        };
        await onAddAccount(newAccData);

        // Ensure activeTab doesn't filter out the new account category
        if (activeTab !== 'all' && activeTab !== formData.category) {
          setActiveTab('all');
        }
        setSearchQuery('');
        setSuccessMsg(`Berhasil menambahkan akun ${newAccData.name} (${newAccData.category.toUpperCase()})!`);
        setAddedAccountToast({
          name: newAccData.name,
          role: newAccData.role,
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

      {/* Top Banner Header Box */}
      <div className="admin-box border-t-4 border-t-[#3c8dbc] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#3c8dbc]" />
            <h1 className="text-base font-extrabold text-gray-800">
              Kelola & Penambahan Akun Panitia
            </h1>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Pengaturan hak akses bertingkat untuk <strong className="text-amber-800">ADMIN (Panitia Inti)</strong> dan <strong className="text-[#3c8dbc]">PETUGAS (Operasional & Lapangan)</strong>. Tambah akun baru untuk memperluas akses tim.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 bg-[#3c8dbc] hover:bg-[#367fa9] text-white font-black rounded shadow transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Akun Baru</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-[#dd4b39] hover:bg-[#c9302c] text-white font-black rounded shadow transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>Keluar Akun</span>
            </button>
          )}
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
              <span className="font-black text-amber-400">{addedAccountToast.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Peran / Jabatan:</span>
              <span className="font-semibold text-slate-200 truncate max-w-[170px]">{addedAccountToast.role}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tingkat Akses:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                addedAccountToast.category === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
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
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
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

        <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Tingkat ADMIN</p>
            <p className="text-2xl font-black text-amber-950 mt-0.5">{adminCount} <span className="text-xs text-amber-800 font-semibold">Pimpinan / Inti</span></p>
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Category Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-none ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-none flex items-center justify-center space-x-1.5 ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin ({adminCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('petugas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-none flex items-center justify-center space-x-1.5 ${
              activeTab === 'petugas'
                ? 'bg-sky-500 text-white font-black shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Petugas ({petugasCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => {
          const isAdmin = acc.category === 'admin';
          const isCurrentActive = currentUser && currentUser.name.toUpperCase().includes(acc.name.toUpperCase());
          const userPresence = presenceMap[acc.id] || presenceMap[acc.name.toLowerCase().trim()];
          const isOnline = userPresence?.status === 'online';

          return (
            <div
              key={acc.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition hover:shadow-md relative flex flex-col justify-between space-y-4 ${
                isAdmin
                  ? 'border-amber-200/80 hover:border-amber-400'
                  : 'border-sky-200/80 hover:border-sky-400'
              }`}
            >
              <div>
                {/* Header Badge & Online Status Indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isAdmin
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-sky-100 text-sky-900 border-sky-300'
                    }`}
                  >
                    {isAdmin ? <Shield className="w-3 h-3 text-amber-700" /> : <Wrench className="w-3 h-3 text-sky-700" />}
                    <span>{isAdmin ? 'Tingkat ADMIN' : 'Tingkat PETUGAS'}</span>
                  </span>

                  <div className="flex items-center space-x-1.5">
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
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-amber-600" />
                        <span>Sesi Anda</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Profile Info */}
                <div className="flex items-start space-x-3.5 mt-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm shrink-0 shadow-sm border border-slate-200/60 ${
                      acc.avatarBg || (isAdmin ? 'bg-amber-500 text-slate-950 font-black' : 'bg-sky-500 text-white font-bold')
                    }`}
                  >
                    {acc.name.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight truncate">{acc.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-snug">{acc.role}</p>
                    <span className="inline-block mt-2 text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Label: {acc.badge}
                    </span>
                  </div>
                </div>

                {/* Default PIN & Details */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center space-x-1 font-mono text-[11px]">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>PIN: {acc.defaultPin || '1234'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">ID: {acc.id}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {onSwitchUser && (
                  <button
                    onClick={() => onSwitchUser(acc)}
                    className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
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

                <button
                  onClick={() => handleDelete(acc.id, acc.name)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                  title="Hapus Akun"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                  formData.category === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-sky-500 text-white'
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
              {/* Category Level Radio Selection */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-2 uppercase tracking-wider text-[11px]">
                  Tingkat Akses / Role:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'admin', badge: 'Panitia / Admin', defaultPin: formData.defaultPin === '1234' ? '12345678' : formData.defaultPin })}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition cursor-pointer ${
                      formData.category === 'admin'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-extrabold text-xs">ADMIN</p>
                      <p className="text-[10px] text-slate-500 font-normal">Panitia Inti (Min. 8 Karakter)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'petugas', badge: 'Petugas Lapangan' })}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition cursor-pointer ${
                      formData.category === 'petugas'
                        ? 'bg-sky-500/10 border-sky-500 text-sky-950 ring-2 ring-sky-500/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Wrench className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <p className="font-extrabold text-xs">PETUGAS</p>
                      <p className="text-[10px] text-slate-500 font-normal">Operasional Lapangan</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">
                  Nama Lengkap / Nama Anggota:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: AHMAD SAFII"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Jabatan / Peran */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">
                  Jabatan / Deskripsi Peran:
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.category === 'admin'
                      ? 'Contoh: BENDAHARA SIE PENGANUGERAHAN'
                      : 'Contoh: PETUGAS KONSUMSI & LOGISTIK'
                  }
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Label Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Label Singkat (Badge):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Petugas Konsumsi"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    PIN Keamanan ({formData.category === 'admin' ? 'Min. 8 Karakter' : '4-6 Digit'}):
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder={formData.category === 'admin' ? 'Default: 12345678' : 'Default: 1234'}
                    value={formData.defaultPin}
                    onChange={(e) => setFormData({ ...formData, defaultPin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Avatar Preset */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Warna Identitas Avatar:</label>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {[
                    { bg: 'bg-amber-500 text-slate-950 font-black', label: 'Emas (Admin)' },
                    { bg: 'bg-sky-500 text-white font-bold', label: 'Biru (Petugas)' },
                    { bg: 'bg-emerald-600 text-white font-bold', label: 'Hijau' },
                    { bg: 'bg-purple-600 text-white font-bold', label: 'Ungu' },
                    { bg: 'bg-rose-500 text-white font-bold', label: 'Merah' },
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
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
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
    </div>
  );
};
