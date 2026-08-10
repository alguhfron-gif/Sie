import React, { useState, useRef, useEffect } from 'react';
import { Award, DollarSign, Users, FileCheck, LayoutDashboard, Menu, X, LogOut, LogIn, User, FileSpreadsheet, RefreshCw, Cloud, UserPlus, Shield, FileText, Moon, ChevronDown, Clock } from 'lucide-react';
import { ActiveTab, UserSession } from '../types';

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      onRefreshData();
    } else {
      window.location.reload();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
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

  const isAdmin = currentUser?.category === 'admin' || (currentUser?.role && currentUser.role.toUpperCase().includes('ADMIN'));
  const isPetugas = !isAdmin && (currentUser?.category === 'petugas' || (currentUser?.role && currentUser.role.toUpperCase().includes('PETUGAS')));

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
    <header className="sticky top-0 z-40 bg-[#222d32] text-white border-b border-[#1a2226] shadow-md">
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
              className="p-2 rounded border border-[#1a2226] bg-[#1e282c] hover:bg-[#1a2226] text-amber-400 transition cursor-pointer shrink-0 shadow-2xs active:scale-95"
            >
              <Menu className="w-5 h-5 text-amber-400" />
            </button>

            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-[#f39c12] flex items-center justify-center text-slate-950 font-black shadow ring-1 ring-amber-300 shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xs sm:text-base tracking-tight text-white whitespace-nowrap">
                    SIE PENGANUGERAHAN
                  </span>
                  <span className="hidden xl:inline-flex items-center space-x-1.5 bg-[#1a2226] text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[9px] font-black tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a65a] animate-pulse shrink-0"></span>
                    <span>SIDOGIRI SYSTEM</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Actions - Desktop Right */}
          <div className="hidden md:flex items-center space-x-2.5 shrink-0">
            {/* Tanggal Hijriyah & Masehi */}
            <div className="flex items-center space-x-1.5 bg-[#1a2226] text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded text-xs font-extrabold shadow-2xs">
              <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
              <span className="text-[11px] font-extrabold tracking-tight">
                {getHijriDate(currentUser?.loginTime)}
              </span>
            </div>

            {/* Sync Cloud */}
            <button
              onClick={handleRefresh}
              title="Segarkan & Sinkronkan Data Cloud Firestore"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-[#367fa9] bg-[#3c8dbc] hover:bg-[#367fa9] text-white text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Data</span>
            </button>

            {/* Tempel Web App URL Button */}
            {onOpenWebhookModal && (
              <button
                onClick={onOpenWebhookModal}
                title="Tempel URL Web App Google Sheets untuk Sinkronisasi Otomatis"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-[#008d4c] bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
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
                  className="flex items-center space-x-2 bg-[#1e282c] hover:bg-[#1a2226] border border-[#1a2226] text-white px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  <div className="w-6 h-6 rounded bg-[#f39c12] font-black text-[11px] flex items-center justify-center text-slate-950 shrink-0 shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <p className="font-extrabold text-[11px] text-white truncate max-w-[120px]">{currentUser.name}</p>
                    <p className="text-[9px] text-amber-400 font-bold">{currentUser.role.split(' ')[0]}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[0.5px]" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-[#222d32] border border-[#1a2226] rounded shadow-2xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 text-white">
                      <div className="flex items-center space-x-3 pb-3 border-b border-[#1a2226]">
                        <div className="w-10 h-10 rounded bg-[#f39c12] font-black text-slate-950 flex items-center justify-center text-sm shadow ring-2 ring-amber-400 shrink-0">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-sm text-white truncate">{currentUser.name}</p>
                          <span className="inline-block text-[10px] font-bold bg-[#00a65a] text-white px-2 py-0.5 rounded mt-0.5">
                            {currentUser.role}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs bg-[#1a2226] p-2.5 rounded border border-[#222d32]">
                        <div className="flex items-center space-x-2 text-amber-400 font-extrabold">
                          <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/20" />
                          <span className="text-[11px]">Hijriyah: {getHijriDate(currentUser.loginTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-[11px]">Waktu Login: {formatLoginTime(currentUser.loginTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[#00c0ef] font-bold">
                          <Cloud className="w-3.5 h-3.5 text-[#00c0ef] shrink-0" />
                          <span className="text-[11px]">Sync: Cloud Firestore Terhubung</span>
                        </div>
                      </div>

                      {onOpenWebhookModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenWebhookModal();
                          }}
                          className="w-full flex items-center space-x-2 text-xs font-bold text-gray-200 hover:text-white bg-[#1e282c] hover:bg-[#1a2226] p-2 rounded transition cursor-pointer"
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
                          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded bg-[#dd4b39] hover:bg-[#c9302c] text-white font-extrabold text-xs transition shadow cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-white" />
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
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-[#f39c12] hover:bg-[#e08e0b] text-slate-950 text-xs font-black shadow transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </button>
            )}
          </div>

          {/* Header Actions - Mobile Header */}
          <div className="md:hidden flex items-center space-x-1.5 shrink-0">
            {/* Tanggal Hijriyah Mobile Pill */}
            <div className="flex items-center space-x-1 bg-[#1a2226] text-amber-400 border border-amber-500/30 px-2 py-1 rounded text-[10px] font-extrabold shadow-2xs">
              <Moon className="w-3 h-3 text-amber-400 fill-amber-400/20 shrink-0" />
              <span className="truncate max-w-[95px]">{getHijriDate(currentUser?.loginTime)}</span>
            </div>

            {/* Sync Cloud Mobile Button */}
            <button
              onClick={handleRefresh}
              title="Segarkan & Sinkronkan Data Cloud"
              className="flex items-center space-x-1 px-2 py-1 rounded bg-[#3c8dbc] text-white font-extrabold text-[10px] shadow-2xs cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3 h-3 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
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
                <span>URL Sheets</span>
              </button>
            )}

            {currentUser ? (
              <div ref={mobileDropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1 bg-[#f39c12] text-slate-950 px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span className="truncate max-w-[65px] font-extrabold">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-amber-800" />
                </button>

                {/* Mobile User Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[0.5px]" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 font-bold text-slate-950 flex items-center justify-center text-xs">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-900 truncate">{currentUser.name}</p>
                          <p className="text-[10px] text-amber-800 font-semibold">{currentUser.role}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100">
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
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
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
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] shadow-sm cursor-pointer"
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
        <div className="md:hidden bg-white/98 border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 backdrop-blur-xl shadow-xl">
          {currentUser ? (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 font-bold text-slate-950 flex items-center justify-center text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-xs">{currentUser.name}</p>
                  <p className="text-[10px] text-amber-800 font-semibold">{currentUser.role}</p>
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
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
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
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons in Drawer */}
          <div className="pt-2 border-t border-slate-200">
            {currentUser && onLogout ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-700" />
                <span>Keluar Akun</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogin) onLogin();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Akun</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};



