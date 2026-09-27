import React, { useState } from 'react';
import { 
  Award, 
  DollarSign, 
  Users, 
  FileCheck, 
  LayoutDashboard, 
  FileText, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  X,
  Cloud,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ActiveTab, UserSession } from '../types';
import { MiladLogo } from './MiladLogo';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  collapsed?: boolean;
  setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenWebhookModal?: () => void;
}

interface NavGroup {
  groupName: string;
  items: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    desc: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  collapsed: externalCollapsed,
  setCollapsed: externalSetCollapsed,
  mobileOpen = false,
  onCloseMobile,
  onOpenWebhookModal,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapsed = () => {
    if (externalSetCollapsed) {
      externalSetCollapsed(!collapsed);
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const isAdmin = currentUser?.category === 'admin' || (currentUser?.role && currentUser.role.toUpperCase().includes('ADMIN'));
  const isPetugas = !isAdmin && (currentUser?.category === 'petugas' || (currentUser?.role && currentUser.role.toUpperCase().includes('PETUGAS')));

  const navGroups: NavGroup[] = [
    {
      groupName: 'UTAMA',
      items: [
        { 
          id: 'dashboard', 
          label: 'Dasbor Utama', 
          icon: <LayoutDashboard className="w-5 h-5" />, 
          desc: 'Ringkasan & Statistik' 
        },
        { 
          id: 'nominasi', 
          label: isPetugas ? 'Ketentuan Nominasi' : 'Data Nominasi', 
          icon: <Award className="w-5 h-5" />, 
          badge: isPetugas ? 'Syarat' : 'Utama',
          badgeColor: 'bg-[#8a7c4c] text-white',
          desc: isPetugas ? 'Syarat 6 Kategori' : 'Pengusul & Penerima' 
        },
      ]
    },
    {
      groupName: 'OPERASIONAL',
      items: [
        { 
          id: 'sertifikat', 
          label: 'Cetak Sertifikat', 
          icon: <FileCheck className="w-5 h-5" />, 
          badge: 'Piagam',
          badgeColor: 'bg-[#675c37] text-white',
          desc: 'Generator E-Sertifikat' 
        },
        { 
          id: 'surat', 
          label: 'Surat & SK', 
          icon: <FileText className="w-5 h-5" />, 
          desc: 'Arsip Ketentuan & SK' 
        },
        { 
          id: 'keuangan', 
          label: 'Laporan Keuangan', 
          icon: <DollarSign className="w-5 h-5" />, 
          badge: 'Kas',
          badgeColor: 'bg-[#8a7c4c] text-white',
          desc: 'Kas & Transaksi' 
        },
        { 
          id: 'koordinasi', 
          label: 'Panitia & Tugas', 
          icon: <Users className="w-5 h-5" />, 
          desc: 'Rundown & Logistik' 
        },
      ]
    },
    {
      groupName: 'PENGATURAN',
      items: [
        { 
          id: 'akun', 
          label: 'Kelola Akun', 
          icon: <UserPlus className="w-5 h-5" />, 
          desc: 'Manajemen Akun Panitia' 
        },
      ]
    }
  ];

  // Filter items if user is Petugas (limited view access)
  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: isPetugas 
      ? group.items.filter(item => item.id === 'dashboard' || item.id === 'nominasi' || item.id === 'surat')
      : group.items
  })).filter(group => group.items.length > 0);

  return (
    <>
      {/* DESKTOP STICKY SIDEBAR (Clean Sidogiri Minimal & Transparan) */}
      <aside
        className={`hidden md:flex flex-col bg-white/50 backdrop-blur-md text-[#24211c] transition-all duration-300 ease-in-out shrink-0 sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] z-30 select-none ${
          collapsed ? 'w-20 p-2.5' : 'w-64 p-3'
        }`}
      >
        {/* Top User Profile Header Card (Expanded) */}
        {!collapsed && currentUser && (
          <div className="flex items-center space-x-3 p-2.5 mb-3 bg-white/60 hover:bg-white/80 rounded-xl transition">
            <div className="w-10 h-10 rounded-lg bg-[#8a7c4c] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-[#24211c] truncate leading-tight">{currentUser.name}</p>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#8a7c4c]/15 text-[#675c37]">
                  {isAdmin ? 'ADMIN' : 'PETUGAS'}
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8a7c4c] animate-pulse"></span>
                  <span className="text-[10px] text-[#675c37]">Online</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top User Profile Header Card (Collapsed) */}
        {collapsed && currentUser && (
          <div className="flex justify-center mb-3">
            <div 
              className="w-10 h-10 rounded-lg bg-[#8a7c4c] text-white font-bold flex items-center justify-center text-sm shadow-xs cursor-pointer relative group"
              title={`${currentUser.name} (${isAdmin ? 'ADMIN' : 'PETUGAS'})`}
            >
              {currentUser.name.charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#8a7c4c] border-2 border-[#efede7] rounded-full"></span>
            </div>
          </div>
        )}

        {/* Sidebar Header Title & Collapse/Expand Toggle Button */}
        <div className="flex items-center justify-between pb-2 mb-2">
          {!collapsed && (
            <div className="px-2">
              <span className="text-[10px] font-bold tracking-wider text-[#8a7c4c] uppercase flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#8a7c4c]" />
                <span>NAVIGASI</span>
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Perluas Navigasi' : 'Ciutkan Navigasi'}
            aria-label={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            className={`p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-[#675c37] hover:text-[#24211c] transition cursor-pointer active:scale-95 ${
              collapsed ? 'mx-auto' : ''
            }`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav List Grouped */}
        <nav className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-0.5">
          {filteredNavGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pt-1 pb-0.5">
                  <span className="text-[9px] font-bold tracking-widest text-[#7c786e] uppercase">
                    {group.groupName}
                  </span>
                </div>
              )}

              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    title={collapsed ? `${item.label} (${item.desc})` : undefined}
                    className={`w-full flex items-center transition-all duration-150 cursor-pointer group relative ${
                      collapsed 
                        ? 'justify-center p-3 rounded-xl' 
                        : 'px-3 py-2.5 space-x-3 text-left rounded-xl'
                    } ${
                      isActive
                        ? 'bg-[#8a7c4c] text-white font-bold shadow-xs'
                        : 'text-[#4a463e] hover:text-[#24211c] hover:bg-black/5 font-medium'
                    }`}
                  >
                    <div
                      className={`transition-transform duration-150 shrink-0 ${
                        isActive 
                          ? 'scale-105 text-white' 
                          : 'group-hover:scale-105 text-[#675c37] group-hover:text-[#24211c]'
                      }`}
                    >
                      {item.icon}
                    </div>

                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate tracking-tight">{item.label}</span>
                          {item.badge && !isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#8a7c4c]/15 text-[#675c37]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate leading-tight ${isActive ? 'text-white/90' : 'text-[#7c786e]'}`}>
                          {item.desc}
                        </p>
                      </div>
                    )}

                    {/* Floating Tooltip preview when collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#24211c] text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="text-[#c3b68b] font-bold">{item.label}</div>
                        <div className="text-[10px] text-[#efede7]/70 font-normal">{item.desc}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-2 space-y-2">
          {onOpenWebhookModal && !collapsed && (
            <button
              type="button"
              onClick={onOpenWebhookModal}
              className="w-full py-1.5 px-2 bg-white/60 hover:bg-white/90 text-[#24211c] text-[11px] font-medium rounded-xl transition flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <Cloud className="w-3.5 h-3.5 text-[#8a7c4c]" />
                <span>Google Sheets Sync</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#8a7c4c]" />
            </button>
          )}

          {!collapsed ? (
            <div className="p-2.5 bg-white/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#675c37]">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#8a7c4c]" />
                  <span>Firestore Cloud</span>
                </span>
                <span className="bg-[#8a7c4c]/15 text-[#675c37] px-1.5 py-0.2 rounded text-[9px] font-bold">
                  AKTIF
                </span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2 px-3 bg-black/5 hover:bg-black/10 text-[#675c37] hover:text-[#24211c] font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#8a7c4c]" />
                  <span>Keluar Akun</span>
                </button>
              )}
            </div>
          ) : (
            onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Keluar Akun (Logout)"
                className="w-full p-2.5 bg-black/5 hover:bg-black/10 text-[#675c37] hover:text-[#24211c] rounded-xl flex items-center justify-center cursor-pointer transition active:scale-95"
              >
                <LogOut className="w-4 h-4 text-[#8a7c4c]" />
              </button>
            )
          )}

          {!collapsed && (
            <p className="text-[9px] text-center text-[#7c786e] font-medium pt-1">
              Milad Pondok Pesantren Sidogiri
            </p>
          )}
        </div>
      </aside>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY & NAVIGATION */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          <div className="relative w-80 max-w-[85vw] bg-[#efede7]/95 backdrop-blur-md text-[#24211c] h-full shadow-2xl flex flex-col p-4 z-50 animate-in slide-in-from-left duration-250">
            <div className="flex items-center justify-between pb-3 mb-3">
              <div className="flex items-center space-x-2.5">
                <MiladLogo size="sm" className="w-9 h-9 shrink-0" />
                <div>
                  <h3 className="font-bold text-xs text-[#24211c] tracking-wide">MILAD SIDOGIRI</h3>
                  <p className="text-[10px] text-[#675c37]">Sie Penganugerahan PPS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-black/5 text-[#675c37] hover:text-[#24211c] transition cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {currentUser && (
              <div className="p-3 mb-3 bg-white/70 rounded-xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-[#8a7c4c] font-bold text-white text-base flex items-center justify-center shrink-0 shadow-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-[#24211c] truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-[#675c37] font-medium">{currentUser.role}</p>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
              {filteredNavGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1 mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#7c786e] px-2 block">
                    {group.groupName}
                  </span>
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'bg-[#8a7c4c] text-white shadow-xs font-bold'
                            : 'text-[#4a463e] hover:bg-black/5 hover:text-[#24211c]'
                        }`}
                      >
                        <div className={isActive ? 'text-white' : 'text-[#675c37]'}>
                          {item.icon}
                        </div>
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {currentUser && onLogout && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onLogout();
                  }}
                  className="w-full py-2.5 bg-black/5 hover:bg-black/10 text-[#675c37] hover:text-[#24211c] font-bold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition"
                >
                  <LogOut className="w-4 h-4 text-[#8a7c4c]" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
