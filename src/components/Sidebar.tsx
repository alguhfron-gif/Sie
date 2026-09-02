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
  Shield,
  LogOut,
  X,
  Cloud,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ActiveTab, UserSession } from '../types';

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
          label: 'Data Nominasi', 
          icon: <Award className="w-5 h-5" />, 
          badge: 'Utama',
          badgeColor: 'bg-emerald-600 text-white',
          desc: 'Pengusul & Kategori' 
        },
      ]
    },
    {
      groupName: 'OPERASIONAL',
      items: [
        { 
          id: 'keuangan', 
          label: 'Laporan Keuangan', 
          icon: <DollarSign className="w-5 h-5" />, 
          badge: 'Kas',
          badgeColor: 'bg-emerald-600 text-white',
          desc: 'Kas & Transaksi' 
        },
        { 
          id: 'koordinasi', 
          label: 'Panitia & Tugas', 
          icon: <Users className="w-5 h-5" />, 
          desc: 'Struktur & Inventory' 
        },
        { 
          id: 'sertifikat', 
          label: 'Cetak Sertifikat', 
          icon: <FileCheck className="w-5 h-5" />, 
          badge: 'E-Cert',
          badgeColor: 'bg-teal-600 text-white',
          desc: 'Generator E-Sertifikat' 
        },
        { 
          id: 'surat', 
          label: 'Surat & SK', 
          icon: <FileText className="w-5 h-5" />, 
          desc: 'Arsip Ketentuan & SK' 
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
          desc: 'Manajemen Panitia' 
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
      {/* DESKTOP STICKY SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-[#1e2e25] text-white border-r border-[#16221b] transition-all duration-300 ease-in-out shrink-0 sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] z-30 select-none shadow-lg ${
          collapsed ? 'w-20 p-2.5' : 'w-64 p-3'
        }`}
      >
        {/* Top User Profile Header Card (Expanded) */}
        {!collapsed && currentUser && (
          <div className="flex items-center space-x-3 p-2.5 mb-3 bg-[#16221b] rounded-xl border border-[#23382c] shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black flex items-center justify-center text-base shadow shrink-0 border border-emerald-400/40">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-xs text-white truncate leading-tight">{currentUser.name}</p>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                  isAdmin ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                }`}>
                  {isAdmin ? 'ADMIN' : 'PETUGAS'}
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a65a] animate-pulse"></span>
                  <span className="text-[10px] text-emerald-400 font-bold">Online</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top User Profile Header Card (Collapsed) */}
        {collapsed && currentUser && (
          <div className="flex justify-center mb-3">
            <div 
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black flex items-center justify-center text-sm shadow cursor-pointer relative group border border-emerald-400/40"
              title={`${currentUser.name} (${isAdmin ? 'ADMIN' : 'PETUGAS'})`}
            >
              {currentUser.name.charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00a65a] border-2 border-[#1e2e25] rounded-full"></span>
            </div>
          </div>
        )}

        {/* Sidebar Header Title & Collapse/Expand Toggle Button */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#23382c]">
          {!collapsed && (
            <div className="px-2">
              <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>NAVIGASI UTAMA</span>
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Perluas Sidebar Navigasi' : 'Ciutkan Sidebar Navigasi'}
            aria-label={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            className={`p-1.5 rounded-lg border border-[#23382c] bg-[#16221b] hover:bg-[#23382c] text-emerald-400 transition cursor-pointer shadow-xs active:scale-95 ${
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
                  <span className="text-[9px] font-black tracking-widest text-emerald-300/60 uppercase">
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
                        : 'px-3 py-2.5 space-x-3 text-left rounded-lg'
                    } ${
                      isActive
                        ? 'bg-[#16221b] text-white font-black border-l-4 border-l-[#00a65a] shadow-2xs'
                        : 'text-emerald-100/70 hover:text-white hover:bg-[#16221b] font-semibold border-l-4 border-l-transparent'
                    }`}
                  >
                    <div
                      className={`transition-transform duration-150 shrink-0 ${
                        isActive 
                          ? 'scale-110 text-emerald-400' 
                          : 'group-hover:scale-105 text-emerald-300/70 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </div>

                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate tracking-tight">{item.label}</span>
                          {item.badge && !isActive && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${item.badgeColor || 'bg-emerald-600 text-white'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate leading-tight ${isActive ? 'text-emerald-300 font-medium' : 'text-emerald-200/50'}`}>
                          {item.desc}
                        </p>
                      </div>
                    )}

                    {/* Floating Tooltip preview when collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#16221b] text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-emerald-600/40">
                        <div className="text-emerald-400 font-extrabold">{item.label}</div>
                        <div className="text-[10px] text-emerald-200 font-normal">{item.desc}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-2 border-t border-[#23382c] space-y-2">
          {/* Cloud Integration Quick Button */}
          {onOpenWebhookModal && !collapsed && (
            <button
              type="button"
              onClick={onOpenWebhookModal}
              className="w-full py-1.5 px-2 bg-[#16221b] hover:bg-[#23382c] text-emerald-100 hover:text-white text-[11px] font-bold rounded-lg border border-[#23382c] transition flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Sheets Sync</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#00a65a]" />
            </button>
          )}

          {!collapsed ? (
            <div className="p-2.5 bg-[#16221b] rounded-xl border border-[#23382c] space-y-2">
              <div className="flex items-center justify-between text-[10px] text-emerald-200 font-bold">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#00a65a]" />
                  <span>Firestore Cloud DB</span>
                </span>
                <span className="bg-[#00a65a] text-white px-1.5 py-0.2 rounded text-[9px] font-black">
                  READY
                </span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2 px-3 bg-[#005a2b] hover:bg-[#004220] border border-emerald-600/40 text-white font-extrabold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Keluar Akun (Logout)</span>
                </button>
              )}
            </div>
          ) : (
            onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Keluar Akun (Logout)"
                className="w-full p-2.5 bg-[#005a2b] hover:bg-[#004220] border border-emerald-600/40 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-xs transition active:scale-95"
              >
                <LogOut className="w-4 h-4 text-emerald-300" />
              </button>
            )
          )}

          {!collapsed && (
            <p className="text-[9px] text-center text-emerald-300/50 font-semibold pt-1">
              Sie Penganugerahan • Sidogiri 2026
            </p>
          )}
        </div>
      </aside>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY & NAVIGATION */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Click Outside */}
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-[#1e2e25] text-white h-full shadow-2xl flex flex-col p-4 z-50 animate-in slide-in-from-left duration-250 border-r border-[#16221b]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#23382c]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black shadow border border-emerald-400/40">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white tracking-wide">SIE PENGANUGERAHAN</h3>
                  <p className="text-[10px] text-emerald-400 font-bold">PPS Sidogiri System</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 rounded-lg bg-[#16221b] text-emerald-200 hover:text-white transition cursor-pointer border border-[#23382c]"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile User Profile Banner */}
            {currentUser && (
              <div className="p-3 mb-3 bg-[#16221b] rounded-xl border border-[#23382c] flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 font-black text-white text-base flex items-center justify-center shrink-0 shadow border border-emerald-400/40">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-xs text-white truncate">{currentUser.name}</p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                      isAdmin ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    }`}>
                      {isAdmin ? 'ADMIN' : 'PETUGAS'}
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00a65a] animate-pulse"></span>
                      <span className="text-[10px] text-emerald-400 font-bold">Aktif</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Nav List Mobile Grouped */}
            <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
              {filteredNavGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  <div className="px-2 pb-1">
                    <span className="text-[10px] font-black tracking-widest text-emerald-300/60 uppercase">
                      {group.groupName}
                    </span>
                  </div>
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
                        className={`w-full flex items-center px-3.5 py-3 space-x-3 text-left transition-all duration-150 rounded-xl cursor-pointer ${
                          isActive
                            ? 'bg-[#16221b] text-white font-black border-l-4 border-l-[#00a65a] shadow-xs'
                            : 'text-emerald-100/70 hover:text-white hover:bg-[#16221b] font-semibold border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className={`shrink-0 ${isActive ? 'text-emerald-400 scale-110' : 'text-emerald-300/70'}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs truncate font-extrabold">{item.label}</span>
                            {item.badge && !isActive && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${item.badgeColor || 'bg-emerald-600 text-white'}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] truncate ${isActive ? 'text-emerald-300 font-medium' : 'text-emerald-200/50'}`}>
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Mobile Drawer Footer */}
            <div className="pt-3 border-t border-[#23382c] mt-auto space-y-2">
              {onOpenWebhookModal && (
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onOpenWebhookModal();
                  }}
                  className="w-full py-2 px-3 bg-[#16221b] hover:bg-[#23382c] text-emerald-100 text-xs font-bold rounded-xl border border-[#23382c] transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span>Integrasi Google Sheets</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#00a65a]" />
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onLogout();
                  }}
                  className="w-full py-2.5 bg-[#005a2b] hover:bg-[#004220] border border-emerald-600/40 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center space-x-2 cursor-pointer active:scale-95 transition"
                >
                  <LogOut className="w-4 h-4 text-emerald-300" />
                  <span>Keluar Akun (Logout)</span>
                </button>
              )}

              <p className="text-[9px] text-center text-emerald-300/50 font-semibold pt-1">
                Panitia Sie Penganugerahan • Sidogiri 2026
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
