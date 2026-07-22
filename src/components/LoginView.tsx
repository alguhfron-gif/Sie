import React, { useState } from 'react';
import { Award, Lock, ShieldCheck, UserCheck, Eye, EyeOff, KeyRound, Sparkles, LogIn, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  defaultPin: string;
  badge: string;
  avatarBg: string;
}

const COMMITTEE_MEMBERS: CommitteeMember[] = [
  { id: '1', name: 'BIRRIL WALID', role: 'KETUA SIE PENGANUGERAHAN', defaultPin: '1234', badge: 'Pimpinan Utama', avatarBg: 'bg-amber-500 text-slate-950' },
  { id: '2', name: 'LAILUR MUBAROK', role: 'WAKIL KETUA', defaultPin: '1234', badge: 'Wakil Pimpinan', avatarBg: 'bg-amber-400 text-slate-900' },
  { id: '3', name: 'MAJID', role: 'SEKRETARIS SIE', defaultPin: '1234', badge: 'Kesekretariatan', avatarBg: 'bg-sky-500 text-white' },
  { id: '4', name: 'MUZAMMIL & GUFRON', role: 'BIDANG SISTEM & KOORDINASI', defaultPin: '1234', badge: 'Sistem & App', avatarBg: 'bg-blue-600 text-white' },
  { id: '5', name: 'GHONI', role: 'BIDANG PENGADAAN & MADRASAH', defaultPin: '1234', badge: 'Pengadaan', avatarBg: 'bg-emerald-600 text-white' },
  { id: '6', name: 'FARIHIN & FITRA', role: 'BIDANG INVENTARIS & LOGISTIK', defaultPin: '1234', badge: 'Inventaris', avatarBg: 'bg-purple-600 text-white' },
  { id: '7', name: 'SULTAN & HALIM', role: 'BIDANG DESAIN & DOKUMENTASI', defaultPin: '1234', badge: 'Desain & Media', avatarBg: 'bg-rose-500 text-white' },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'panitia' | 'credentials'>('panitia');
  
  // Panitia selection state
  const [selectedMember, setSelectedMember] = useState<CommitteeMember>(COMMITTEE_MEMBERS[0]);
  const [pin, setPin] = useState('');
  
  // Credentials mode state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Handle Quick PIN Login
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Default PIN is 1234, but allow empty/demo or 1234
    if (pin.trim() !== '' && pin.trim() !== selectedMember.defaultPin && pin.trim() !== '1234' && pin.trim() !== '0000') {
      setErrorMsg(`PIN salah untuk ${selectedMember.name}. Gunakan PIN default: 1234 (atau klik Masuk 1-Klik).`);
      return;
    }

    const session: UserSession = {
      id: selectedMember.id,
      name: selectedMember.name,
      role: selectedMember.role,
      email: `${selectedMember.name.toLowerCase().replace(/[^a-z]/g, '')}@penganugerahan.id`,
      loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    onLoginSuccess(session);
  };

  // Handle Email / Password Login
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Harap isi Email/Username dan Kata Sandi.');
      return;
    }

    const name = email.split('@')[0].toUpperCase().replace('.', ' ');
    const session: UserSession = {
      id: `usr-${Date.now()}`,
      name: name || 'ANGGOTA PANITIA',
      role: 'PANITIA PENGANUGERAHAN',
      email: email.includes('@') ? email : `${email}@penganugerahan.id`,
      loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    onLoginSuccess(session);
  };

  // Direct 1-Click Fast Login for quick review
  const handleQuickDemoLogin = (member: CommitteeMember) => {
    const session: UserSession = {
      id: member.id,
      name: member.name,
      role: member.role,
      email: `${member.name.toLowerCase().replace(/[^a-z]/g, '')}@penganugerahan.id`,
      loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    onLoginSuccess(session);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header App Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-4 ring-amber-400/30">
            <Award className="w-9 h-9 text-slate-950" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              Portal Otentikasi Resmi
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-2">
              Sie Penganugerahan
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
              Sistem Otomasi Operasional & Keuangan Malam Penganugerahan 2026
            </p>
          </div>
        </div>

        {/* Login Form Container Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('panitia');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                loginMode === 'panitia'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Pilih Panitia</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('credentials');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                loginMode === 'credentials'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Email / Akun</span>
            </button>
          </div>

          {/* Error Alert Box */}
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode 1: Panitia Member Select & PIN */}
          {loginMode === 'panitia' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Pilih Akun Anggota Panitia:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {COMMITTEE_MEMBERS.map((m) => {
                    const isSelected = selectedMember.id === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-slate-900/50 border-slate-700/60 text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${m.avatarBg}`}>
                            {m.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-extrabold text-white leading-tight truncate">{m.name}</p>
                            <p className="text-[10px] text-amber-400/90 font-medium truncate">{m.role}</p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                          isSelected ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {m.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">PIN Keamanan (PIN Default: 1234)</label>
                  <span className="text-[10px] text-amber-400/80">Opsional untuk Demo</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Masukkan 4 digit PIN (misal: 1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Ingat Saya di HP/Perangkat Ini</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <span>Masuk Sebagai {selectedMember.name.split(' ')[0]}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Quick Demo Access */}
              <div className="pt-2 border-t border-slate-700/60 text-center">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(selectedMember)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Atau Masuk Langsung 1-Klik (Tanpa PIN)</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: Custom Email / Password Login */}
          {loginMode === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email / Nama Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: birril@penganugerahan.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Kata Sandi *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Aplikasi</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Sistem Terenkripsi & Terintegrasi HP/Mobile</span>
          </p>
          <p>© 2026 Sie Penganugerahan • Hak Cipta Dilindungi</p>
        </div>
      </div>
    </div>
  );
};
