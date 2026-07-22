import React, { useState } from 'react';
import { Award, DollarSign, Users, FileCheck, LayoutDashboard, Menu, X, RotateCcw, LogOut, LogIn, User } from 'lucide-react';
import { ActiveTab, UserSession } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onResetData: () => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onResetData, currentUser, onLogout, onLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'nominasi', label: 'Nominasi', icon: <Award className="w-4 h-4" /> },
    { id: 'keuangan', label: 'Keuangan', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'koordinasi', label: 'Panitia & Tugas', icon: <Users className="w-4 h-4" /> },
    { id: 'sertifikat', label: 'Cetak Sertifikat', icon: <FileCheck className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl text-slate-800 border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 ring-1 ring-amber-400 shrink-0">
              <Award className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Sie Penganugerahan
                </span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  Operations
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Aplikasi Manajemen Operations & Laporan Keuangan</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Header Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {currentUser ? (
              <>
                <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200/80 text-amber-950 px-3 py-1 rounded-2xl text-xs">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 font-bold text-[10px] flex items-center justify-center text-slate-950 shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left leading-tight">
                    <p className="font-extrabold text-[11px] text-slate-900 truncate max-w-[100px]">{currentUser.name}</p>
                    <p className="text-[9px] text-amber-800 font-bold">{currentUser.role.split(' ')[0]}</p>
                  </div>
                </div>

                <button
                  onClick={onResetData}
                  title="Reset Data Simulasi"
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset</span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Keluar / Logout"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold transition shadow-sm cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Keluar</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </button>
            )}
          </div>

          {/* Header Actions - Mobile Header */}
          <div className="md:hidden flex items-center space-x-1.5">
            {currentUser && (
              <div className="flex items-center space-x-1 bg-amber-100 text-amber-900 px-2 py-1 rounded-xl text-[11px] font-bold border border-amber-200/80">
                <User className="w-3.5 h-3.5 text-amber-700" />
                <span className="truncate max-w-[65px]">{currentUser.name.split(' ')[0]}</span>
              </div>
            )}

            {currentUser && onLogout ? (
              <button
                onClick={onLogout}
                title="Keluar dari Akun"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 font-extrabold text-[11px] shadow-sm cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-700 hover:text-slate-900 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
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
          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onResetData();
              }}
              className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Data</span>
            </button>

            {currentUser && onLogout ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
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
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
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


