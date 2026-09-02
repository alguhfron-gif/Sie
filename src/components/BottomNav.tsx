import React from 'react';
import { Award, DollarSign, Users, FileCheck, LayoutDashboard, UserPlus, FileText } from 'lucide-react';
import { ActiveTab, UserSession } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser?: UserSession | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, currentUser }) => {
  const isAdmin = currentUser?.category === 'admin' || (currentUser?.role && currentUser.role.toUpperCase().includes('ADMIN'));
  const isPetugas = !isAdmin && (currentUser?.category === 'petugas' || (currentUser?.role && currentUser.role.toUpperCase().includes('PETUGAS')));

  const allNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'nominasi', label: 'Nominasi', icon: <Award className="w-4 h-4" /> },
    { id: 'keuangan', label: 'Keuangan', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'koordinasi', label: 'Panitia', icon: <Users className="w-4 h-4" /> },
    { id: 'sertifikat', label: 'Sertifikat', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'surat', label: 'Surat', icon: <FileText className="w-4 h-4" /> },
    { id: 'akun', label: 'Akun', icon: <UserPlus className="w-4 h-4" /> },
  ];

  const navItems = isPetugas
    ? allNavItems.filter((item) => item.id === 'dashboard' || item.id === 'nominasi' || item.id === 'surat')
    : allNavItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-emerald-100 text-slate-500 px-1.5 py-1 shadow-lg">
      <div className={`flex items-center overflow-x-auto touch-scroll-x no-scrollbar space-x-1 px-0.5 py-0.5 ${
        isPetugas ? 'justify-around max-w-md mx-auto' : 'justify-between sm:justify-around'
      }`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-w-[56px] max-w-[80px] shrink-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer ${
                isActive ? 'text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 shadow-2xs' : 'hover:text-emerald-900'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition ${
                  isActive ? 'bg-emerald-500/20 text-emerald-700' : 'bg-transparent'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[9px] tracking-tight mt-0.5 whitespace-nowrap font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
