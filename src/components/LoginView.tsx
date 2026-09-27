import React, { useState } from 'react';
import {
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldAlert,
  Image as ImageIcon,
} from 'lucide-react';
import { UserSession, CommitteeAccount } from '../types';
import { INITIAL_ACCOUNTS } from '../data/initialData';
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
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setErrorMsg('Silakan masukkan nama akun atau ID terdaftar Anda.');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg('Silakan masukkan kata sandi / PIN akun Anda.');
      return;
    }

    // 1. Verifikasi apakah akun terdaftar dan password/PIN sesuai
    const foundMember = memberList.find(
      (m) =>
        m.name.toLowerCase().trim() === trimmedUser.toLowerCase() ||
        m.id.toLowerCase().trim() === trimmedUser.toLowerCase()
    );

    const registeredPin = foundMember
      ? (foundMember.defaultPin || (foundMember.category === 'admin' ? '12345678' : '1234')).trim()
      : null;

    // Jika akun tidak ditemukan atau password/PIN tidak cocok: Tampilkan pesan aman yang diminta user
    if (!foundMember || trimmedPass !== registeredPin) {
      setErrorMsg('Username dan password Anda salah, mohon diperhatikan lagi cara tulisnya.');
      return;
    }

    // 2. Login berhasil sesuai role resmi yang ditentukan Administrator
    const resolvedCategory: 'admin' | 'petugas' = foundMember.category;
    const session: UserSession = {
      id: foundMember.id,
      name: foundMember.name,
      role: `${foundMember.role} (${resolvedCategory === 'admin' ? 'ADMIN' : 'PETUGAS'})`,
      category: resolvedCategory,
      authType: 'committee',
      email: `${foundMember.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@penganugerahan.id`,
      loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    onLoginSuccess(session);
  };

  return (
    <div className="min-h-screen bg-[#efede7] text-[#24211c] flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Top Sidogiri Tricolor Accent */}
      <div aria-hidden="true" className="grid grid-cols-[26%_1fr_8%] h-2 w-full shrink-0">
        <span className="bg-[#8a7c4c]"></span>
        <span className="bg-[#e5e2da]"></span>
        <span className="bg-[#7c7b77]"></span>
      </div>

      {/* Main Login Center Card */}
      <div className="flex-1 flex items-center justify-center p-4 my-auto">
        <div className="w-full max-w-md space-y-5">
          {/* Header Brand */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                title="Ganti atau Sesuaikan Logo Milad Sidogiri"
                className="group relative cursor-pointer focus:outline-none p-1 rounded-2xl hover:bg-white/60 transition"
              >
                <MiladLogo size="xl" className="w-20 h-20 drop-shadow-md transition-transform group-hover:scale-105" />
                <span className="absolute bottom-0 right-0 bg-[#8a7c4c] text-white p-1 rounded-full text-[8px] font-bold shadow-xs">
                  <ImageIcon className="w-2.5 h-2.5" />
                </span>
              </button>
            </div>

            <div>
              <span className="inline-flex items-center space-x-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#675c37] bg-[#f2eee3] border border-[#c3b68b]/40 px-3 py-0.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-[#8a7c4c]" />
                <span>MILAD PONDOK PESANTREN SIDOGIRI</span>
              </span>
              <h1 className="text-2xl font-black text-[#24211c] tracking-tight mt-1.5">
                SIE PENGANUGERAHAN
              </h1>
              <p className="text-xs text-[#7c7b77] font-medium mt-0.5">
                Portal Autentikasi Panitia & Verifikasi Resmi
              </p>
            </div>
          </div>

          {/* White Card Container (Tampilan Bersih & Terproteksi) */}
          <div className="bg-white border border-[#e8e4da] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-start space-x-2.5 font-medium animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Form Login Mandiri */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                  Nama Akun / Username Terdaftar
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7c7b77] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ketik nama akun yang telah didaftarkan Admin"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] placeholder-[#a9a7a2] focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]/30 focus:border-[#8a7c4c] focus:bg-white font-semibold transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                  Kata Sandi / PIN Akses
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7c7b77] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    maxLength={32}
                    required
                    placeholder="Masukkan kata sandi / PIN"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] placeholder-[#a9a7a2] focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]/30 focus:border-[#8a7c4c] focus:bg-white font-mono transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#7c7b77] hover:text-[#24211c] p-0.5 rounded cursor-pointer"
                    title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#8a7c4c] hover:bg-[#675c37] active:scale-[0.99] text-white font-extrabold rounded-xl shadow-xs transition flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer mt-3"
              >
                <span>Masuk ke Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Protected Security Notice (Tanpa Tombol Cepat / Demo) */}
            <div className="pt-3 border-t border-[#f2eee3]">
              <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs">
                <ShieldAlert className="w-4 h-4 text-[#8a7c4c] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[#675c37] text-[11px]">Akses Terbatas & Terproteksi</p>
                  <p className="text-[10.5px] text-[#7c7b77] leading-relaxed">
                    Hanya panitia dan petugas yang telah didaftarkan langsung oleh Administrator melalui menu{' '}
                    <strong>Kelola Akun</strong> yang berhak masuk ke sistem.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
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

      {/* Modal Logo */}
      <LogoManagerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
      />
    </div>
  );
};
