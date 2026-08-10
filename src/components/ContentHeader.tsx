import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { ActiveTab } from '../types';

interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  activeTab: ActiveTab;
}

const tabLabels: Record<ActiveTab, string> = {
  dashboard: 'Dasbor Utama',
  nominasi: 'Data Nominasi',
  keuangan: 'Laporan Keuangan',
  koordinasi: 'Panitia & Tugas',
  sertifikat: 'Cetak Sertifikat',
  surat: 'Surat & SK',
  akun: 'Kelola Akun',
};

export const ContentHeader: React.FC<ContentHeaderProps> = ({ title, subtitle, activeTab }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b border-gray-300/70 gap-2">
      <div>
        <h1 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
          {title}
          {subtitle && (
            <small className="text-xs font-normal text-gray-500 hidden sm:inline">
              | {subtitle}
            </small>
          )}
        </h1>
      </div>

      {/* Breadcrumb Navigation */}
      <ol className="flex items-center text-xs text-gray-600 bg-white/70 px-3 py-1.5 rounded border border-gray-200 shadow-2xs space-x-1.5">
        <li className="flex items-center text-[#3c8dbc] font-bold">
          <Home className="w-3.5 h-3.5 mr-1 text-[#3c8dbc]" />
          <span>Beranda</span>
        </li>
        <li className="text-gray-400">
          <ChevronRight className="w-3 h-3" />
        </li>
        <li className="text-gray-600 font-semibold">Sie Penganugerahan</li>
        <li className="text-gray-400">
          <ChevronRight className="w-3 h-3" />
        </li>
        <li className="text-emerald-700 font-black">{tabLabels[activeTab] || 'Dashboard'}</li>
      </ol>
    </div>
  );
};
