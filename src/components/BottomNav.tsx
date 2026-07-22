import React from 'react';
import { Award, DollarSign, Users, FileCheck, LayoutDashboard } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'nominasi', label: 'Nominasi', icon: <Award className="w-5 h-5" /> },
    { id: 'keuangan', label: 'Keuangan', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'koordinasi', label: 'Panitia', icon: <Users className="w-5 h-5" /> },
    { id: 'sertifikat', label: 'Sertifikat', icon: <FileCheck className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 text-slate-500 px-3 py-2 shadow-lg">
      <div className="grid grid-cols-5 gap-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
                isActive ? 'text-amber-700 font-bold bg-amber-50 border border-amber-200' : 'hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  isActive ? 'bg-amber-500/20 text-amber-700' : 'bg-transparent'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
