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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2.5 border-b border-[rgba(36,33,28,0.1)] gap-2">
      <div>
        <h1 className="text-lg sm:text-xl font-extrabold text-[#24211c] tracking-tight flex items-center gap-2">
          {title}
          {subtitle && (
            <small className="text-xs font-normal text-[#7c7b77] hidden sm:inline">
              | {subtitle}
            </small>
          )}
        </h1>
      </div>

      {/* Breadcrumb Navigation in Milad Sidogiri Minimal Style */}
      <ol className="flex items-center text-xs text-[#7c7b77] bg-white/90 px-3 py-1.5 rounded-xl border border-[rgba(36,33,28,0.12)] shadow-2xs space-x-1.5">
        <li className="flex items-center text-[#8a7c4c] font-bold">
          <Home className="w-3.5 h-3.5 mr-1 text-[#8a7c4c]" />
          <span>Beranda</span>
        </li>
        <li className="text-[#a9a7a2]">
          <ChevronRight className="w-3 h-3" />
        </li>
        <li className="text-[#24211c] font-medium">Sie Penganugerahan</li>
        <li className="text-[#a9a7a2]">
          <ChevronRight className="w-3 h-3" />
        </li>
        <li className="text-[#675c37] font-bold">{tabLabels[activeTab] || 'Dashboard'}</li>
      </ol>
    </div>
  );
};
