import React, { useState, useRef, useEffect } from 'react';
import {
  Award,
  DollarSign,
  Users,
  FileCheck,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  LogIn,
  User,
  FileSpreadsheet,
  RefreshCw,
  Cloud,
  UserPlus,
  Shield,
  FileText,
  Moon,
  ChevronDown,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';
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

  const formatLoginTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    if (timeStr.includes(':') && !timeStr.includes('-') && !timeStr.includes('T')) {
      return timeStr;
    }
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPetugas = currentUser?.category === 'petugas' || (currentUser?.role ? currentUser.role.toUpperCase().includes('PETUGAS') : false);
  const isAdmin = !isPetugas;

  const allNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'nominasi', label: 'Nominasi', icon: <Award className="w-4 h-4" /> },
    { id: 'sertifikat', label: 'Sertifikat', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'surat', label: 'Surat & SK', icon: <FileText className="w-4 h-4" /> },
    { id: 'keuangan', label: 'Keuangan', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'koordinasi', label: 'Panitia', icon: <Users className="w-4 h-4" /> },
    { id: 'akun', label: 'Akun', icon: <UserPlus className="w-4 h-4" /> },
  ];

  const navItems = isPetugas
    ? allNavItems.filter((item) => item.id === 'dashboard' || item.id === 'nominasi' || item.id === 'surat')
    : allNavItems;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[rgba(36,33,28,0.12)] shadow-2xs">
      {/* Signature Milad Sidogiri Top Decorative Bar */}
      <div aria-hidden="true" className="grid grid-cols-[26%_1fr_8%] h-1.5 w-full shrink-0">
        <span className="bg-[#8a7c4c]"></span>
        <span className="bg-[#e5e2da]"></span>
        <span className="bg-[#7c7b77]"></span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Sidebar toggle icon for quick expand/collapse */}
            <button
              onClick={() => {
                if (onToggleSidebar) onToggleSidebar();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              title="Navigasi Menu"
              className="p-1.5 rounded-lg border border-[rgba(36,33,28,0.15)] bg-[#f7f6f2] hover:bg-[#e5e2da] text-[#24211c] transition cursor-pointer shrink-0 md:hidden active:scale-95"
            >
              <Menu className="w-4 h-4 text-[#24211c]" />
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-2.5">
              {!isPetugas ? (
                <button
                  type="button"
                  onClick={() => setLogoModalOpen(true)}
                  title="Klik untuk Mengatur Logo Milad"
                  className="group relative cursor-pointer focus:outline-none"
                >
                  <MiladLogo size="sm" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition-transform group-hover:scale-105" />
                  <span className="absolute -bottom-1 -right-1 bg-[#8a7c4c] text-white p-0.5 rounded-full text-[8px] opacity-0 group-hover:opacity-100 transition shadow">
                    <ImageIcon className="w-2.5 h-2.5" />
                  </span>
                </button>
              ) : (
                <div className="relative shrink-0">
                  <MiladLogo size="sm" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                </div>
              )}
              <div className="cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-xs sm:text-base tracking-tight text-[#24211c] whitespace-nowrap">
                      SIE PENGANUGERAHAN
                    </span>
                    <span className="hidden xl:inline-flex items-center space-x-1 bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2 py-0.5 rounded text-[9px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8a7c4c] animate-pulse shrink-0 mr-1"></span>
                      MILAD SIDOGIRI
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7c7b77] font-medium hidden sm:block">
                    Pondok Pesantren Sidogiri • 1158 — 1448 H
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Center Navigation Tabs (Direct Quick Access like miladsidogiri.id) */}
          <nav className="hidden lg:flex items-center space-x-1 bg-[#efede7]/80 p-1 rounded-xl border border-[rgba(36,33,28,0.08)]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#8a7c4c] text-white shadow-2xs font-bold'
                      : 'text-[#5a5750] hover:text-[#24211c] hover:bg-[#e5e2da]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Header Actions - Right Desktop */}
          <div className="hidden md:flex items-center space-x-2 shrink-0">
            {/* Hijri Date Pill */}
            <div className="flex items-center space-x-1 bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <Moon className="w-3.5 h-3.5 text-[#8a7c4c]" />
              <span className="text-[11px]">{getHijriDate(currentUser?.loginTime)}</span>
            </div>

            {/* Sync Cloud */}
            <button
              onClick={handleRefresh}
              title="Segarkan & Sinkronkan Data"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#efede7] hover:bg-[#e5e2da] text-[#24211c] border border-[rgba(36,33,28,0.12)] text-xs font-semibold transition cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8a7c4c] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {/* Google Sheets Webhook */}
            {onOpenWebhookModal && (
              <button
                onClick={onOpenWebhookModal}
                title="Integrasi Google Sheets"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#f7f6f2] text-[#24211c] border border-[rgba(36,33,28,0.15)] text-xs font-semibold transition cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#8a7c4c]" />
                <span className="hidden xl:inline">Google Sheets</span>
                <span className="xl:hidden">Sheets</span>
              </button>
            )}

            {/* User Profile Pill & Dropdown */}
            {currentUser ? (
              <div ref={desktopDropdownRef} className="relative shrink-0">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 bg-[#24211c] hover:bg-[#38342c] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-md bg-[#8a7c4c] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="max-w-[110px] truncate text-[11px]">{currentUser.name}</span>
                  <ChevronDown className={`w-3 h-3 text-[#c3b68b] transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[0.5px]" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-[rgba(36,33,28,0.12)] rounded-xl shadow-xl p-3 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-2 text-[#24211c]">
                      <div className="flex items-center space-x-2.5 pb-2 border-b border-[rgba(36,33,28,0.08)]">
                        <div className="w-9 h-9 rounded-lg bg-[#24211c] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-[#24211c] truncate">{currentUser.name}</p>
                          <span className="inline-block text-[9px] font-bold bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2 py-0.5 rounded mt-0.5">
                            {currentUser.role}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] bg-[#f7f6f2] p-2 rounded-lg border border-[rgba(36,33,28,0.08)]">
                        <div className="flex items-center space-x-2 text-[#675c37] font-semibold">
                          <Moon className="w-3.5 h-3.5 text-[#8a7c4c] shrink-0" />
                          <span>Hijriyah: {getHijriDate(currentUser.loginTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[#7c7b77]">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Waktu: {formatLoginTime(currentUser.loginTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[#675c37] font-semibold">
                          <Cloud className="w-3.5 h-3.5 text-[#8a7c4c] shrink-0" />
                          <span>Cloud Firestore Aktif</span>
                        </div>
                      </div>

                      {!isPetugas && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setLogoModalOpen(true);
                          }}
                          className="w-full flex items-center space-x-2 text-xs font-semibold text-[#24211c] hover:bg-[#efede7] p-2 rounded-lg transition cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 text-[#8a7c4c]" />
                          <span>Atur / Unggah Logo</span>
                        </button>
                      )}

                      {onOpenWebhookModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenWebhookModal();
                          }}
                          className="w-full flex items-center space-x-2 text-xs font-semibold text-[#24211c] hover:bg-[#efede7] p-2 rounded-lg transition cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-[#8a7c4c]" />
                          <span>Webhook Google Sheets</span>
                        </button>
                      )}

                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-[#24211c] hover:bg-[#38342c] text-white font-bold text-xs transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-[#c3b68b]" />
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
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#8a7c4c] hover:bg-[#675c37] text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>

          {/* Mobile Header Actions */}
          <div className="md:hidden flex items-center space-x-1.5 shrink-0">
            {/* Sync button */}
            <button
              onClick={handleRefresh}
              title="Segarkan Data"
              className="p-1.5 rounded-lg bg-[#f7f6f2] hover:bg-[#e5e2da] text-[#24211c] border border-[rgba(36,33,28,0.12)] text-xs cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8a7c4c] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Sheets button */}
            {onOpenWebhookModal && (
              <button
                onClick={onOpenWebhookModal}
                title="Google Sheets"
                className="p-1.5 rounded-lg bg-white hover:bg-[#f7f6f2] text-[#24211c] border border-[rgba(36,33,28,0.12)] text-xs cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#8a7c4c]" />
              </button>
            )}

            {/* User Mobile Button */}
            {currentUser ? (
              <div ref={mobileDropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1 bg-[#24211c] text-white px-2 py-1 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <span className="truncate max-w-[65px] text-[11px]">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-[#c3b68b]" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[0.5px]" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-[rgba(36,33,28,0.12)] shadow-xl p-3 z-50 space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center space-x-2 pb-2 border-b border-[rgba(36,33,28,0.08)]">
                        <div className="w-8 h-8 rounded-lg bg-[#24211c] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#24211c] truncate">{currentUser.name}</p>
                          <p className="text-[10px] text-[#7c7b77]">{currentUser.role}</p>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#675c37] bg-[#f2eee3] p-1.5 rounded-lg font-medium">
                        🌙 {getHijriDate(currentUser.loginTime)}
                      </div>

                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full py-1.5 bg-[#24211c] hover:bg-[#38342c] text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3 text-[#c3b68b]" />
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
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#8a7c4c] text-white font-bold text-[11px] shadow-xs cursor-pointer"
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
        <div className="md:hidden bg-white border-b border-[rgba(36,33,28,0.12)] px-4 pt-3 pb-5 space-y-3 shadow-lg">
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
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#8a7c4c] text-white font-bold'
                      : 'text-[#24211c] hover:bg-[#efede7]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[rgba(36,33,28,0.08)] space-y-1.5">
            {!isPetugas && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-lg border border-[rgba(36,33,28,0.15)] bg-[#f7f6f2] text-[#24211c] font-semibold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#8a7c4c]" />
                <span>Atur / Unggah Logo Milad</span>
              </button>
            )}

            {currentUser && onLogout && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#24211c] text-white font-semibold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#c3b68b]" />
                <span>Keluar Akun</span>
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
