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
  Sparkles,
  Moon,
  CloudCheck,
  LogOut
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

  const allNavItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string; desc?: string }[] = [
    { id: 'dashboard', label: 'Dasbor Utama', icon: <LayoutDashboard className="w-5 h-5" />, desc: 'Ringkasan & Statistik' },
    { id: 'nominasi', label: 'Data Nominasi', icon: <Award className="w-5 h-5" />, badge: 'Utama', desc: 'Pengusul & Kategori' },
    { id: 'keuangan', label: 'Laporan Keuangan', icon: <DollarSign className="w-5 h-5" />, desc: 'Kas & Transaksi' },
    { id: 'koordinasi', label: 'Panitia & Tugas', icon: <Users className="w-5 h-5" />, desc: 'Struktur & Inventory' },
    { id: 'sertifikat', label: 'Cetak Sertifikat', icon: <FileCheck className="w-5 h-5" />, desc: 'Generator E-Sertifikat' },
    { id: 'surat', label: 'Surat & SK', icon: <FileText className="w-5 h-5" />, desc: 'Arsip Ketentuan & SK' },
    { id: 'akun', label: 'Kelola Akun', icon: <UserPlus className="w-5 h-5" />, desc: 'Manajemen Panitia' },
  ];

  const navItems = isPetugas
    ? allNavItems.filter((item) => item.id === 'dashboard' || item.id === 'nominasi' || item.id === 'surat')
    : allNavItems;

  return (
    <>
      <aside
      className={`hidden md:flex flex-col bg-[#222d32] text-white border-r border-[#1a2226] transition-all duration-300 ease-in-out shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-30 ${
        collapsed ? 'w-20 p-2.5' : 'w-64 p-3'
      }`}
    >
      {/* Sidebar Top User Panel */}
      {!collapsed && currentUser && (
        <div className="flex items-center space-x-3 p-2.5 mb-3 bg-[#1a2226] rounded border border-[#1e282c]">
          <div className="w-9 h-9 rounded bg-[#f39c12] text-slate-950 font-black flex items-center justify-center text-sm shadow shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-xs text-white truncate leading-tight">{currentUser.name}</p>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#00a65a] inline-block animate-pulse"></span>
              <span className="text-[10px] text-gray-300 font-bold">Online</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Header Title & Collapse Toggle */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1a2226]">
        {!collapsed && (
          <div className="px-2">
            <span className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">
              NAVIGASI UTAMA
            </span>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          className={`p-1.5 rounded border border-[#1a2226] bg-[#1e282c] hover:bg-[#1a2226] text-amber-400 transition cursor-pointer ${
            collapsed ? 'mx-auto' : ''
          }`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center transition-all duration-150 rounded-none cursor-pointer group relative ${
                collapsed ? 'justify-center p-3' : 'px-3 py-2.5 space-x-3 text-left'
              } ${
                isActive
                  ? 'bg-[#1e282c] text-white font-black border-l-4 border-l-[#00a65a]'
                  : 'text-[#b8c7ce] hover:text-white hover:bg-[#1e282c] font-semibold border-l-4 border-l-transparent'
              }`}
            >
              <div
                className={`transition-transform duration-150 ${
                  isActive ? 'scale-110 text-amber-400' : 'group-hover:scale-105 text-[#b8c7ce] group-hover:text-white'
                }`}
              >
                {item.icon}
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate tracking-tight">{item.label}</span>
                    {item.badge && !isActive && (
                      <span className="text-[9px] bg-[#f39c12] text-slate-950 px-1.5 py-0.2 rounded font-extrabold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.desc && (
                    <p className={`text-[10px] truncate leading-tight ${isActive ? 'text-amber-400' : 'text-gray-400'}`}>
                      {item.desc}
                    </p>
                  )}
                </div>
              )}

              {/* Collapsed Tooltip Indicator */}
              {collapsed && isActive && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#1a2226] text-amber-400 text-[10px] font-black rounded shadow-xl whitespace-nowrap z-50 pointer-events-none border border-amber-500/30">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer User & Status Card */}
      {currentUser && (
        <div className="mt-auto pt-2 border-t border-[#1a2226]">
          {!collapsed ? (
            <div className="p-2.5 bg-[#1a2226] rounded border border-[#1e282c] space-y-2">
              <div className="flex items-center justify-between text-[10px] text-gray-300 font-bold">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a65a] inline-block animate-pulse" />
                  <span>Firestore Cloud</span>
                </span>
                <span className="bg-[#00a65a] text-white px-1.5 py-0.2 rounded text-[9px]">
                  ONLINE
                </span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-1.5 px-2 bg-[#dd4b39] hover:bg-[#c9302c] text-white font-extrabold text-xs rounded transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-white" />
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
                className="w-full p-2.5 bg-[#dd4b39] hover:bg-[#c9302c] text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
            )
          )}
        </div>
      )}
      </aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Content */}
          <div className="relative w-80 max-w-[85vw] bg-[#222d32] text-white h-full shadow-2xl flex flex-col p-4 z-50 animate-in slide-in-from-left duration-250 border-r border-[#1a2226]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1a2226]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-[#f39c12] flex items-center justify-center text-slate-950 font-black shadow">
                  <Award className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white">SIE PENGANUGERAHAN</h3>
                  <p className="text-[10px] text-amber-400 font-bold">Sidogiri System</p>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded bg-[#1e282c] text-gray-300 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Nav List Mobile */}
            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center px-3 py-2.5 space-x-3 text-left transition-all duration-150 rounded-none cursor-pointer ${
                      isActive
                        ? 'bg-[#1e282c] text-white font-black border-l-4 border-l-[#00a65a]'
                        : 'text-[#b8c7ce] hover:text-white hover:bg-[#1e282c] font-semibold border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={isActive ? 'text-amber-400 scale-110' : 'text-[#b8c7ce]'}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs truncate">{item.label}</span>
                        {item.badge && !isActive && (
                          <span className="text-[9px] bg-[#f39c12] text-slate-950 px-1.5 py-0.2 rounded font-extrabold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.desc && (
                        <p className={`text-[10px] truncate ${isActive ? 'text-amber-400' : 'text-gray-400'}`}>
                          {item.desc}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Mobile Footer User Info & Logout Button */}
            {currentUser && (
              <div className="pt-3 border-t border-[#1a2226] mt-auto space-y-2">
                <div className="p-2.5 bg-[#1a2226] rounded border border-[#1e282c] flex items-center space-x-3">
                  <div className="w-9 h-9 rounded bg-[#f39c12] font-black text-slate-950 text-sm flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-xs text-white truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-amber-400 font-bold truncate">{currentUser.role}</p>
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                      onLogout();
                    }}
                    className="w-full py-2 bg-[#dd4b39] hover:bg-[#c9302c] text-white font-black text-xs rounded shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-white" />
                    <span>Keluar Akun (Logout)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
