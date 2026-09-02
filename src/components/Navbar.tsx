import React, { useState, useRef, useEffect } from 'react';
import { Award, DollarSign, Users, FileCheck, LayoutDashboard, Menu, X, LogOut, LogIn, User, FileSpreadsheet, RefreshCw, Cloud, UserPlus, Shield, FileText, Moon, ChevronDown, Clock, Image as ImageIcon } from 'lucide-react';
import { ActiveTab, UserSession } from '../types';
import { MiladLogo } from './MiladLogo';
import { LogoManagerModal } from './LogoManagerModal';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onResetData?: () => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onLogin?: () => void;
  onOpenWebhookModal?: () => void;
  onRefreshData?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  currentUser,
  onLogout,
  onLogin,
  onOpenWebhookModal,
  onRefreshData,
  onToggleSidebar,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = !desktopDropdownRef.current || !desktopDropdownRef.current.contains(target);
      const isOutsideMobile = !mobileDropdownRef.current || !mobileDropdownRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userDropdownOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRefreshing) {
      timer = setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isRefreshing]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      onRefreshData();
    } else {
      window.location.reload();
    }
  };

  const getHijriDate = (dateSource?: string) => {
    const dateObj = dateSource ? new Date(dateSource) : new Date();
    const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
    try {
      const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      let res = formatter.format(validDate);
      if (!res.toLowerCase().includes('h')) res += ' H';
      return res;
    } catch {
      try {
        const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        let res = formatter.format(validDate);
        if (!res.toLowerCase().includes('h')) res += ' H';
        return res;
      } catch {
        return '1448 H';
      }
    }
  };

  const formatLoginTime = (dateSource?: string) => {
    if (!dateSource) return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const d = new Date(dateSource);
    if (isNaN(d.getTime())) return dateSource;
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPetugas = currentUser?.category === 'petugas' || (currentUser?.role ? currentUser.role.toUpperCase().includes('PETUGAS') : false);
  const isAdmin = !isPetugas;

  const allNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'nominasi', label: 'Nominasi', icon: <Award className="w-4 h-4" /> },
    { id: 'keuangan', label: 'Keuangan', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'koordinasi', label: 'Panitia & Tugas', icon: <Users className="w-4 h-4" /> },
    { id: 'sertifikat', label: 'Cetak Sertifikat', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'surat', label: 'Surat & Ketentuan', icon: <FileText className="w-4 h-4" /> },
    { id: 'akun', label: 'Kelola Akun', icon: <UserPlus className="w-4 h-4" /> },
  ];

  const navItems = isPetugas
    ? allNavItems.filter((item) => item.id === 'dashboard' || item.id === 'nominasi' || item.id === 'surat')
    : allNavItems;

  return (
    <header className="sticky top-0 z-40 bg-[#16221b] text-white border-b border-[#23382c] shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Row 1: Brand Logo, Tanggal Hijriyah, Sync Cloud & User Profile Dropdown */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Name with Hamburger Toggle */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Hamburger Menu Icon */}
            <button
              onClick={() => {
                if (onToggleSidebar) onToggleSidebar();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              title="Buka/Tutup Navigasi Sidebar"
              className="p-2 rounded-lg border border-[#23382c] bg-[#1e2e25] hover:bg-[#283f33] text-emerald-400 transition cursor-pointer shrink-0 shadow-2xs active:scale-95"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
            </button>

            <div className="flex items-center space-x-2.5">
              {!isPetugas ? (
                <button
                  type="button"
                  onClick={() => setLogoModalOpen(true)}
                  title="Klik untuk Mengatur / Mengganti Logo Milad"
                  className="group relative cursor-pointer focus:outline-none"
                >
                  <MiladLogo size="sm" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition-transform group-hover:scale-105" />
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-0.5 rounded-full text-[8px] opacity-0 group-hover:opacity-100 transition shadow">
                    <ImageIcon className="w-2.5 h-2.5" />
                  </span>
                </button>
              ) : (
                <div className="relative shrink-0">
                  <MiladLogo size="sm" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                </div>
              )}
              <div className="cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xs sm:text-base tracking-tight text-white whitespace-nowrap">
                    MILAD SIDOGIRI
                  </span>
                  <span className="hidden xl:inline-flex items-center space-x-1.5 bg-[#1e2e25] text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[9px] font-black tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a65a] animate-pulse shrink-0"></span>
                    <span>SIE PENGANUGERAHAN</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Actions - Desktop Right */}
          <div className="hidden md:flex items-center space-x-2.5 shrink-0">
            {/* Tanggal Hijriyah & Masehi */}
            <div className="flex items-center space-x-1.5 bg-[#1e2e25] text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-2xs">
              <Moon className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 shrink-0" />
              <span className="text-[11px] font-extrabold tracking-tight">
                {getHijriDate(currentUser?.loginTime)}
              </span>
            </div>

            {/* Sync Cloud */}
            <button
              onClick={handleRefresh}
              title="Segarkan & Sinkronkan Data Cloud Firestore"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-emerald-700/60 bg-[#005a2b] hover:bg-[#004220] text-emerald-100 hover:text-white text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Data</span>
            </button>

            {/* Tempel Web App URL Button */}
            {onOpenWebhookModal && (
              <button
                onClick={onOpenWebhookModal}
                title="Tempel URL Web App Google Sheets untuk Sinkronisasi Otomatis"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-emerald-600 bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span className="hidden lg:inline">Tempel Web App URL</span>
                <span className="lg:hidden">URL Sheets</span>
              </button>
            )}

            {/* Nama User & Clickable Dropdown Menu */}
            {currentUser ? (
              <div ref={desktopDropdownRef} className="relative shrink-0">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 bg-[#1e2e25] hover:bg-[#283f33] border border-[#23382c] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-700 font-black text-[11px] flex items-center justify-center text-white shrink-0 shadow-xs border border-emerald-400/40">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <p className="font-extrabold text-[11px] text-white truncate max-w-[120px]">{currentUser.name}</p>
                    <p className="text-[9px] text-emerald-400 font-bold">{currentUser.role.split(' ')[0]}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[0.5px]" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-[#1e2e25] border border-[#23382c] rounded-xl shadow-2xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 text-white">
                      <div className="flex items-center space-x-3 pb-3 border-b border-[#23382c]">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 font-black text-white flex items-center justify-center text-sm shadow ring-2 ring-emerald-400 shrink-0 border border-emerald-400/40">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-sm text-white truncate">{currentUser.name}</p>
                          <span className="inline-block text-[10px] font-bold bg-[#00a65a] text-white px-2 py-0.5 rounded mt-0.5">
                            {currentUser.role}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs bg-[#16221b] p-2.5 rounded-lg border border-[#23382c]">
                        <div className="flex items-center space-x-2 text-emerald-300 font-extrabold">
                          <Moon className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-emerald-400/20" />
                          <span className="text-[11px]">Hijriyah: {getHijriDate(currentUser.loginTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-100/70 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-300/70 shrink-0" />
                          <span className="text-[11px]">Waktu Login: {formatLoginTime(currentUser.loginTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                          <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px]">Sync: Cloud Firestore Terhubung</span>
                        </div>
                      </div>

                      {/* Button Atur / Unggah Logo (Khusus Admin) */}
                      {!isPetugas && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setLogoModalOpen(true);
                          }}
                          className="w-full flex items-center space-x-2 text-xs font-bold text-amber-200 hover:text-amber-100 bg-amber-950/40 hover:bg-amber-950/70 p-2.5 rounded-lg transition cursor-pointer border border-amber-500/30"
                        >
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                          <span>Atur / Unggah Logo Milad</span>
                        </button>
                      )}

                      {onOpenWebhookModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenWebhookModal();
                          }}
                          className="w-full flex items-center space-x-2 text-xs font-bold text-emerald-100 hover:text-white bg-[#16221b] hover:bg-[#283f33] p-2.5 rounded-lg transition cursor-pointer border border-[#23382c]"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-[#00a65a]" />
                          <span>Pengaturan Webhook Sheets</span>
                        </button>
                      )}

                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-[#005a2b] hover:bg-[#004220] border border-emerald-600/40 text-white font-extrabold text-xs transition shadow cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-emerald-300" />
                          <span>Keluar Akun (Logout)</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-black shadow transition cursor-pointer border border-emerald-400/40"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </button>
            )}
          </div>

          {/* Header Actions - Mobile Header */}
          <div className="md:hidden flex items-center space-x-1.5 shrink-0">
            {/* Tanggal Hijriyah Mobile Pill */}
            <div className="flex items-center space-x-1 bg-[#1e2e25] text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-extrabold shadow-2xs">
              <Moon className="w-3 h-3 text-emerald-400 fill-emerald-400/20 shrink-0" />
              <span className="truncate max-w-[95px]">{getHijriDate(currentUser?.loginTime)}</span>
            </div>

            {/* Sync Cloud Mobile Button */}
            <button
              onClick={handleRefresh}
              title="Segarkan & Sinkronkan Data Cloud"
              className="flex items-center space-x-1 px-2 py-1 rounded bg-[#005a2b] text-white font-extrabold text-[10px] shadow-2xs cursor-pointer shrink-0 border border-emerald-600/40"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {/* Tempel Web App URL Mobile Button */}
            {onOpenWebhookModal && (
              <button
                onClick={onOpenWebhookModal}
                title="Tempel URL Web App Google Sheets"
                className="flex items-center space-x-1 px-2 py-1 rounded bg-[#00a65a] text-white font-extrabold text-[10px] shadow-2xs cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-3 h-3 text-white" />
                <span>URL</span>
              </button>
            )}

            {currentUser ? (
              <div ref={mobileDropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1 bg-[#00a65a] text-white px-2 py-1 rounded text-[11px] font-bold cursor-pointer shadow-xs border border-emerald-400/40"
                >
                  <User className="w-3.5 h-3.5 text-white" />
                  <span className="truncate max-w-[65px] font-extrabold">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-white" />
                </button>

                {/* Mobile User Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[0.5px]" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-emerald-100 shadow-2xl p-3 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center space-x-2.5 pb-2 border-b border-emerald-100">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-bold text-white flex items-center justify-center text-xs shadow">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-900 truncate">{currentUser.name}</p>
                          <p className="text-[10px] text-emerald-700 font-semibold">{currentUser.role}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                        <p className="font-extrabold text-emerald-800">🌙 {getHijriDate(currentUser.loginTime)}</p>
                        <p className="text-slate-600 font-medium">🕒 Login: {formatLoginTime(currentUser.loginTime)}</p>
                      </div>

                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 border border-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Keluar (Logout)</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#00a65a] text-white font-black text-[11px] shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 border-b border-emerald-100 px-4 pt-3 pb-5 space-y-3 backdrop-blur-xl shadow-xl">
          {currentUser ? (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-bold text-white flex items-center justify-center text-xs shadow">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-xs">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">{currentUser.role}</p>
                  <p className="text-[10px] text-emerald-800 font-bold mt-0.5">🌙 {getHijriDate(currentUser.loginTime)}</p>
                </div>
              </div>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Online
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <p className="text-xs text-slate-600 font-medium mb-2">Belum masuk ke akun panitia?</p>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogin) onLogin();
                }}
                className="w-full py-2 bg-[#00a65a] hover:bg-[#008d4c] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </button>
            </div>
          )}

          {/* Nav Items */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#00a65a] text-white font-black shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons in Drawer */}
          <div className="pt-2 border-t border-emerald-100 space-y-2">
            {!isPetugas && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>Atur / Unggah Logo Milad</span>
              </button>
            )}

            {currentUser && onLogout ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-emerald-700/40 bg-[#005a2b] hover:bg-[#004220] text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5 text-emerald-300" />
                <span>Keluar Akun</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogin) onLogin();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#00a65a] hover:bg-[#008d4c] text-white font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Akun</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Pengaturan & Upload Logo */}
      <LogoManagerModal
        isOpen={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
      />
    </header>
  );
};
