import React, { useState, useEffect } from 'react';
import {
  Award,
  User,
  Lock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Shield,
  Wrench,
  UserPlus,
  X,
  Plus,
  Bell,
  Wifi,
  WifiOff
} from 'lucide-react';
import { UserSession, CommitteeAccount } from '../types';
import { INITIAL_ACCOUNTS } from '../data/initialData';
import { addCommitteeAccountToFirestore } from '../services/committeeService';
import { subscribeUserPresence, UserPresence } from '../services/presenceService';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
  accounts?: CommitteeAccount[];
}

export type RoleCategory = 'admin' | 'petugas' | 'all';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, accounts }) => {
  const memberList = accounts && accounts.length > 0 ? accounts : INITIAL_ACCOUNTS;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time presence state
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});

  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regData, setRegData] = useState({
    name: '',
    role: 'PESERTA / PETUGAS PENGANUGERAHAN',
    category: 'petugas' as 'admin' | 'petugas',
    badge: 'Peserta / Petugas',
    defaultPin: '1234',
    avatarBg: 'bg-sky-500 text-white font-bold',
  });
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<CommitteeAccount | null>(null);

  // Subscribe to realtime presence
  useEffect(() => {
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


  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setErrorMsg('Kolom Username / User ID tidak boleh kosong.');
      return;
    }

    // Search for existing account in Firestore / INITIAL_ACCOUNTS memberList
    const foundMember = memberList.find(
      (m) =>
        m.name.toLowerCase() === trimmedUser.toLowerCase() ||
        m.id.toLowerCase() === trimmedUser.toLowerCase() ||
        m.name.toLowerCase().includes(trimmedUser.toLowerCase()) ||
        trimmedUser.toLowerCase().includes(m.name.toLowerCase())
    );

    let resolvedCategory: 'admin' | 'petugas' = 'petugas';
    let resolvedRole = 'PETUGAS LAPANGAN / OPERASIONAL';
    let resolvedName = trimmedUser;
    let resolvedId = `user-${Date.now()}`;

    if (foundMember) {
      resolvedCategory = foundMember.category;
      resolvedRole = foundMember.role;
      resolvedName = foundMember.name;
      resolvedId = foundMember.id;

      // Validate password if admin with specific PIN
      const isAdminAcc = foundMember.category === 'admin';
      if (
        isAdminAcc &&
        trimmedPass !== '' &&
        trimmedPass !== foundMember.defaultPin &&
        trimmedPass !== '12345678' &&
        trimmedPass !== '1234' &&
        trimmedPass !== 'admin' &&
        trimmedPass !== 'admin123' &&
        trimmedPass !== 'password'
      ) {
        setErrorMsg(`Kata sandi/PIN tidak cocok untuk akun ADMIN (${foundMember.name}). Default password: ${foundMember.defaultPin || '12345678'}`);
        return;
      }
    } else {
      // Automatic detection for custom / new usernames
      const userLower = trimmedUser.toLowerCase();
      if (userLower === 'admin' || userLower.includes('admin') || userLower.includes('panitia') || trimmedPass === 'admin123') {
        resolvedCategory = 'admin';
        resolvedRole = 'ADMINISTRATOR (PANITIA INTI)';
      } else {
        resolvedCategory = 'petugas';
        resolvedRole = 'PETUGAS LAPANGAN / OPERASIONAL';
      }
    }

    const session: UserSession = {
      id: resolvedId,
      name: resolvedName,
      role: `${resolvedRole} (${resolvedCategory === 'admin' ? 'ADMIN' : 'PETUGAS'})`,
      category: resolvedCategory,
      authType: 'committee',
      email: `${resolvedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@penganugerahan.id`,
      loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    onLoginSuccess(session);
  };

  // Direct 1-Click Fast Login
  const handleQuickDemoLogin = (targetMember?: CommitteeAccount) => {
    const trimmedUser = username.trim();
    const foundMember =
      targetMember ||
      memberList.find(
        (m) =>
          m.name.toLowerCase() === trimmedUser.toLowerCase() ||
          m.id.toLowerCase() === trimmedUser.toLowerCase() ||
          m.name.toLowerCase().includes(trimmedUser.toLowerCase())
      ) ||
      memberList[0];

    const session: UserSession = {
      id: foundMember.id,
      name: foundMember.name,
      role: `${foundMember.role} (${foundMember.category === 'admin' ? 'ADMIN' : 'PETUGAS'})`,
      category: foundMember.category,
      authType: 'committee',
      email: `${foundMember.name.toLowerCase().replace(/[^a-z]/g, '')}@penganugerahan.id`,
      loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    onLoginSuccess(session);
  };

  // Register New Account
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name.trim()) {
      setErrorMsg('Nama lengkap peserta / pengguna wajib diisi.');
      return;
    }
    if (regData.category === 'admin' && regData.defaultPin.trim().length < 8) {
      setErrorMsg('PIN / Password untuk tingkat ADMIN minimal 8 karakter.');
      return;
    }

    setIsSubmittingReg(true);
    setErrorMsg(null);

    try {
      const createdAcc = await addCommitteeAccountToFirestore({
        name: regData.name.toUpperCase().trim(),
        role: regData.role.toUpperCase().trim(),
        category: regData.category,
        badge: regData.badge || (regData.category === 'admin' ? 'Panitia / Admin' : 'Peserta / Petugas'),
        defaultPin: regData.defaultPin || '1234',
        avatarBg: regData.avatarBg,
      });

      setRegSuccessMsg(`Akun ${createdAcc.name} berhasil didaftarkan & tersimpan ke Cloud Firestore!`);
      setAddedToast(createdAcc);
      setUsername(createdAcc.name);
      setIsRegisterModalOpen(false);

      setTimeout(() => setRegSuccessMsg(null), 8000);
      setTimeout(() => setAddedToast(null), 10000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mendaftarkan akun baru. Pastikan koneksi internet aktif.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // Count online users
  const onlineCount = Object.values(presenceMap).filter((p: UserPresence) => p.status === 'online').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Instant Notification Popup Banner when Account Added */}
      {addedToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:w-96 z-50 bg-slate-900 border-2 border-emerald-500 text-white p-4 rounded-3xl shadow-2xl space-y-3 animate-bounce-once">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2 text-emerald-400">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider block text-emerald-400">Notifikasi: Akun Didaftarkan!</span>
                <span className="text-[10px] text-slate-400 font-medium">Tersimpan di Cloud Firestore</span>
              </div>
            </div>
            <button
              onClick={() => setAddedToast(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Nama User:</span>
              <span className="font-black text-amber-400">{addedToast.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Hak Akses:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                addedToast.category === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}>
                {addedToast.category === 'admin' ? 'ADMIN (Semua Fitur)' : 'PETUGAS (Dasbor, Nominasi, Surat)'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">PIN / Password:</span>
              <span className="font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {addedToast.defaultPin}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              handleQuickDemoLogin(addedToast);
              setAddedToast(null);
            }}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Masuk Langsung Sekarang Sebagai {addedToast.name}</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Header App Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-4 ring-amber-400/30">
            <Award className="w-9 h-9 text-slate-950" />
          </div>

          <div>
            <div className="flex items-center justify-center space-x-2">
              <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Terhubung Firestore Realtime</span>
              </span>

              {onlineCount > 0 && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{onlineCount} Online</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mt-2">
              Sie Penganugerahan
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
              Wadah Login Terintegrasi & Monitoring Status Online
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          
          {/* Registration Success Banner */}
          {regSuccessMsg && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-2xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{regSuccessMsg}</span>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Kolom User / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kolom User / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan Username / Nama User"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Kolom Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Kolom Password / PIN
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Sandi / PIN Akun
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  maxLength={24}
                  placeholder="Masukkan Password / PIN"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Tombol Submit Login */}
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 text-sm cursor-pointer mt-2"
            >
              <span>Masuk ke Aplikasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Opsi Tambah Akun Baru (Subtle) */}
            <div className="pt-2 text-center border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Belum terdaftar?</span>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-extrabold flex items-center space-x-1 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Registrasi Akun Baru</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tersimpan di Firestore • Status Online Realtime Sync</span>
          </p>
          <p>© 2026 Sie Penganugerahan • Hak Cipta Dilindungi</p>
        </div>
      </div>

      {/* Modal Penambahan / Pendaftaran Akun Peserta / Login Baru */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-slate-100 animate-scale-up">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 font-black">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Tambah Akun Peserta / User Login</h3>
                <p className="text-xs text-slate-400">Data tersimpan di Cloud Firestore untuk login</p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Nama Lengkap Peserta / Panitia:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MUHAMMAD FARHAN"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Jabatan / Deskripsi Peran:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PETUGAS LAPANGAN / PESERTA ACARA"
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tingkat Akses:</label>
                  <select
                    value={regData.category}
                    onChange={(e) =>
                      setRegData({
                        ...regData,
                        category: e.target.value as 'admin' | 'petugas',
                        defaultPin: e.target.value === 'admin' ? '12345678' : '1234',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="petugas">PETUGAS (Operasional)</option>
                    <option value="admin">ADMIN (Panitia Inti)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    PIN / Password:
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={regData.defaultPin}
                    onChange={(e) => setRegData({ ...regData, defaultPin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingReg ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Simpan & Daftarkan</span>
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
