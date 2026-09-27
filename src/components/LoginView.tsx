import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
  X,
  Plus,
  Bell,
  Image as ImageIcon,
} from 'lucide-react';
import { UserSession, CommitteeAccount } from '../types';
import { INITIAL_ACCOUNTS } from '../data/initialData';
import { addCommitteeAccountToFirestore } from '../services/committeeService';
import { subscribeUserPresence, UserPresence } from '../services/presenceService';
import { MiladLogo } from './MiladLogo';
import { LogoManagerModal } from './LogoManagerModal';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
  accounts?: CommitteeAccount[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, accounts }) => {
  const memberList = accounts && accounts.length > 0 ? accounts : INITIAL_ACCOUNTS;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time presence state
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});

  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [regData, setRegData] = useState({
    name: '',
    role: 'PESERTA / PETUGAS PENGANUGERAHAN',
    category: 'petugas' as 'admin' | 'petugas',
    badge: 'Peserta / Petugas',
    defaultPin: '1234',
    avatarBg: 'bg-[#8a7c4c] text-white font-bold',
  });
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<CommitteeAccount | null>(null);

  useEffect(() => {
    let t1: NodeJS.Timeout;
    if (regSuccessMsg) {
      t1 = setTimeout(() => setRegSuccessMsg(null), 8000);
    }
    return () => {
      if (t1) clearTimeout(t1);
    };
  }, [regSuccessMsg]);

  useEffect(() => {
    let t2: NodeJS.Timeout;
    if (addedToast) {
      t2 = setTimeout(() => setAddedToast(null), 10000);
    }
    return () => {
      if (t2) clearTimeout(t2);
    };
  }, [addedToast]);

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setErrorMsg('Silakan isi Kolom User / Username Anda.');
      return;
    }

    const foundMember = memberList.find(
      (m) =>
        m.name.toLowerCase().trim() === trimmedUser.toLowerCase() ||
        m.id.toLowerCase().trim() === trimmedUser.toLowerCase()
    );

    let resolvedId = foundMember ? foundMember.id : `usr-${Date.now()}`;
    let resolvedName = foundMember ? foundMember.name : trimmedUser.toUpperCase();
    let resolvedRole = foundMember ? foundMember.role : 'OPERASIONAL';
    let resolvedCategory: 'admin' | 'petugas' = foundMember ? foundMember.category : 'petugas';

    if (foundMember) {
      const validPin = foundMember.defaultPin || '1234';
      if (trimmedPass && trimmedPass !== validPin && trimmedPass !== '12345678' && trimmedPass !== '1234') {
        setErrorMsg(`Kata sandi/PIN tidak cocok untuk akun (${foundMember.name}). Default password: ${validPin}`);
        return;
      }
    } else {
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

  const handleQuickDemoLogin = (targetMember?: CommitteeAccount) => {
    const foundMember = targetMember || memberList[0];
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name.trim()) {
      setErrorMsg('Nama lengkap pengguna wajib diisi.');
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
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mendaftarkan akun baru. Pastikan koneksi internet aktif.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const onlineCount = Object.values(presenceMap).filter((p: UserPresence) => p.status === 'online').length;

  return (
    <div className="min-h-screen bg-[#efede7] text-[#24211c] flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Top Sidogiri Tricolor Accent */}
      <div aria-hidden="true" className="grid grid-cols-[26%_1fr_8%] h-2 w-full shrink-0">
        <span className="bg-[#8a7c4c]"></span>
        <span className="bg-[#e5e2da]"></span>
        <span className="bg-[#7c7b77]"></span>
      </div>

      {/* Instant Notification Popup Banner */}
      {addedToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:w-96 z-50 bg-white border border-[#8a7c4c] text-[#24211c] p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between border-b border-[rgba(36,33,28,0.1)] pb-2">
            <div className="flex items-center space-x-2 text-[#8a7c4c]">
              <Bell className="w-4 h-4 shrink-0" />
              <span className="font-bold text-xs">Akun Berhasil Didaftarkan</span>
            </div>
            <button onClick={() => setAddedToast(null)} className="text-[#7c7b77] hover:text-[#24211c]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-semibold">{addedToast.name}</p>
        </div>
      )}

      {/* Main Login Center Card */}
      <div className="flex-1 flex items-center justify-center p-4 my-auto">
        <div className="w-full max-w-md space-y-5">
          {/* Header Brand */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                title="Logo Milad Sidogiri"
                className="group relative cursor-pointer focus:outline-none p-1 rounded-2xl hover:bg-white/60 transition"
              >
                <MiladLogo size="xl" className="w-20 h-20 drop-shadow-md transition-transform group-hover:scale-105" />
                <span className="absolute bottom-0 right-0 bg-[#8a7c4c] text-white p-1 rounded-full text-[8px] font-bold shadow-xs">
                  <ImageIcon className="w-2.5 h-2.5" />
                </span>
              </button>
            </div>

            <div>
              <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-[#675c37] bg-[#f2eee3] border border-[#c3b68b]/40 px-3 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-[#8a7c4c]" />
                <span>MILAD PONDOK PESANTREN SIDOGIRI</span>
              </span>
              <h1 className="text-2xl font-black text-[#24211c] tracking-tight mt-1.5">
                SIE PENGANUGERAHAN
              </h1>
              <p className="text-xs text-[#7c7b77] font-medium mt-0.5">
                Masuk ke Portal Panitia & Verifikasi
              </p>
            </div>
          </div>

          {/* White Card Container */}
          <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            {regSuccessMsg && (
              <div className="bg-[#f2eee3] border border-[#8a7c4c]/40 text-[#675c37] p-3 rounded-xl text-xs flex items-center space-x-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#8a7c4c] shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                  Username / Nama Akun
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7c7b77] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: H. Ahmad Arif Bahruddin"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f7f6f2] border border-[rgba(36,33,28,0.15)] rounded-xl text-xs text-[#24211c] placeholder-[#a9a7a2] focus:outline-none focus:ring-2 focus:ring-[#8a7c4c] font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#24211c]">
                    Password / PIN
                  </label>
                  <span className="text-[10px] text-[#7c7b77]">
                    Default: 1234
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7c7b77] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    maxLength={24}
                    placeholder="Masukkan PIN"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f7f6f2] border border-[rgba(36,33,28,0.15)] rounded-xl text-xs text-[#24211c] placeholder-[#a9a7a2] focus:outline-none focus:ring-2 focus:ring-[#8a7c4c] font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#8a7c4c] hover:bg-[#675c37] active:scale-[0.98] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2 text-sm cursor-pointer mt-2"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Accounts */}
            <div className="pt-3 border-t border-[rgba(36,33,28,0.08)]">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#7c7b77] block mb-2">
                Masuk Cepat 1-Klik:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {memberList.slice(0, 2).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(m)}
                    className="p-2 rounded-xl bg-[#f7f6f2] hover:bg-[#efede7] border border-[rgba(36,33,28,0.1)] text-left transition cursor-pointer"
                  >
                    <p className="text-[11px] font-bold text-[#24211c] truncate">{m.name.split(' ')[0]}</p>
                    <p className="text-[9px] text-[#7c7b77] font-semibold">{m.category === 'admin' ? 'Admin' : 'Petugas'}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Register link */}
            <div className="pt-2 text-center flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#7c7b77]">Akun baru?</span>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="text-[11px] text-[#8a7c4c] hover:text-[#675c37] font-bold flex items-center space-x-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Daftar Akun</span>
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-[#7c7b77] space-y-1">
            <p className="flex items-center justify-center space-x-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8a7c4c]" />
              <span>Sistem Operasional Sie Penganugerahan</span>
            </p>
            <p>© Panitia Milad Pondok Pesantren Sidogiri</p>
          </div>
        </div>
      </div>

      {/* Bottom Sidogiri Tricolor Accent */}
      <div aria-hidden="true" className="grid grid-cols-[8%_1fr_26%] h-2 w-full shrink-0">
        <span className="bg-[#7c7b77]"></span>
        <span className="bg-[#e5e2da]"></span>
        <span className="bg-[#8a7c4c]"></span>
      </div>

      {/* Modal Register Akun */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs p-4 flex items-center justify-center">
          <div className="bg-white border border-[rgba(36,33,28,0.15)] rounded-2xl max-w-md w-full p-6 shadow-xl relative space-y-4 text-[#24211c]">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[#7c7b77] hover:text-[#24211c] rounded-lg hover:bg-[#efede7] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-[rgba(36,33,28,0.1)] pb-3">
              <div className="w-10 h-10 rounded-xl bg-[#f2eee3] text-[#8a7c4c] flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#24211c]">Daftar Akun Pengguna Baru</h3>
                <p className="text-[11px] text-[#7c7b77]">Tersimpan di Cloud Firestore</p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#24211c] mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MUHAMMAD FARHAN"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[rgba(36,33,28,0.15)] rounded-xl text-[#24211c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#24211c] mb-1">
                  Jabatan / Peran:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PETUGAS LAPANGAN"
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[rgba(36,33,28,0.15)] rounded-xl text-[#24211c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-bold text-[#24211c] mb-1">Tingkat Akses:</label>
                  <select
                    value={regData.category}
                    onChange={(e) =>
                      setRegData({
                        ...regData,
                        category: e.target.value as 'admin' | 'petugas',
                        defaultPin: e.target.value === 'admin' ? '12345678' : '1234',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#f7f6f2] border border-[rgba(36,33,28,0.15)] rounded-xl text-[#24211c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]"
                  >
                    <option value="petugas">PETUGAS</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#24211c] mb-1">PIN:</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={regData.defaultPin}
                    onChange={(e) => setRegData({ ...regData, defaultPin: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f7f6f2] border border-[rgba(36,33,28,0.15)] rounded-xl text-[#24211c] font-mono focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-[#efede7] hover:bg-[#e5e2da] text-[#24211c] rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="px-5 py-2 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Logo */}
      <LogoManagerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
      />
    </div>
  );
};
