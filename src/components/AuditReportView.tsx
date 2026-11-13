import React, { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  Users,
  Send,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Award,
  Sparkles,
  Phone,
  AlertTriangle,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import { CommitteeAccount, Nomination, AwardCategory, UserSession } from '../types';
import { ContentHeader } from './ContentHeader';
import { getRoleOptionById } from '../utils/accountRoles';

interface AuditReportViewProps {
  accounts: CommitteeAccount[];
  nominations: Nomination[];
  categories: AwardCategory[];
  currentUser: UserSession | null;
  setActiveTab: (tab: any) => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  accounts,
  nominations,
  categories,
  currentUser,
  setActiveTab,
}) => {
  const isAdmin = currentUser?.category === 'admin' || (currentUser?.role && currentUser.role.toUpperCase().includes('ADMIN'));

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Audit data mapping for each account (placed above early return to satisfy Rules of Hooks)
  const auditList = useMemo(() => {
    return accounts.map((acc) => {
      const accRoleOpt = getRoleOptionById(acc.accountType || (acc.category === 'admin' ? 'panitia' : 'madrasah'));
      const accNameClean = acc.name.trim().toLowerCase();
      const accIdClean = (acc.idPersonalia || '').trim().toLowerCase();
      const accUsernameClean = (acc.username || '').trim().toLowerCase();

      // Find nominations submitted by this account
      const submittedNoms = nominations.filter((nom) => {
        const nomPengusul = (nom.pengusulNama || nom.nominatorName || '').trim().toLowerCase();
        const nomIdPers = ((nom as any).pengusulIdPersonalia || nom.idPps || '').trim().toLowerCase();
        const nomUsername = ((nom as any).pengusulUsername || '').trim().toLowerCase();
        const nomAccountId = ((nom as any).pengusulAccountId || '').trim();

        return (
          (nomAccountId && nomAccountId === acc.id) ||
          (nomUsername && accUsernameClean && nomUsername === accUsernameClean) ||
          (nomIdPers && accIdClean && nomIdPers === accIdClean) ||
          nomPengusul === accNameClean ||
          (accIdClean && nomPengusul.includes(accIdClean)) ||
          (accUsernameClean && nomPengusul.includes(accUsernameClean)) ||
          (accNameClean.length > 4 && nomPengusul.includes(accNameClean))
        );
      });

      const count = submittedNoms.length;
      const hasFilled = count > 0;

      // Extract candidate names and categories
      const candidateNames = submittedNoms.map((n) => n.candidateName);
      const usedCategories = submittedNoms.map((n) => {
        const cat = categories.find((c) => c.id === n.categoryId);
        return cat?.title || n.categoryId;
      });

      // Latest submission timestamp
      const latestNom = [...submittedNoms].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )[0];

      return {
        account: acc,
        roleOption: accRoleOpt,
        hasFilled,
        count,
        submittedNoms,
        candidateNames,
        usedCategories: Array.from(new Set(usedCategories)),
        latestDate: latestNom?.createdAt || null,
      };
    });
  }, [accounts, nominations, categories]);

  // Overall Statistics
  const totalAccounts = auditList.length;
  const filledAccounts = auditList.filter((a) => a.hasFilled).length;
  const pendingAccounts = totalAccounts - filledAccounts;
  const compliancePercentage = totalAccounts > 0 ? Math.round((filledAccounts / totalAccounts) * 100) : 0;
  const totalNominationsSubmitted = nominations.length;

  // Filtered accounts for display
  const filteredAuditList = useMemo(() => {
    return auditList.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'filled' && !item.hasFilled) return false;
      if (statusFilter === 'pending' && item.hasFilled) return false;

      // 2. Role Filter
      if (roleFilter !== 'all' && item.roleOption.id !== roleFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.account.name.toLowerCase().includes(q);
        const matchUsername = (item.account.username || '').toLowerCase().includes(q);
        const matchId = (item.account.idPersonalia || '').toLowerCase().includes(q);
        const matchRole = item.account.role.toLowerCase().includes(q);
        const matchCandidates = item.candidateNames.some((c) => c.toLowerCase().includes(q));

        if (!matchName && !matchUsername && !matchId && !matchRole && !matchCandidates) {
          return false;
        }
      }

      return true;
    });
  }, [auditList, statusFilter, roleFilter, searchQuery]);

  // If not admin, access is strictly forbidden
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#24211c]">Akses Terbatas: Khusus Panitia (Admin)</h2>
          <p className="text-xs text-[#7c7b77] leading-relaxed">
            Halaman Statistik &amp; Laporan Monitoring Pengisian Nominasi ini hanya dapat diakses oleh Administrator/Panitia Inti Penganugerahan untuk keperluan audit kepatuhan pengisian data.
          </p>
          <button
            onClick={() => setActiveTab('nominasi')}
            className="w-full py-2.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
          >
            Kembali ke Formulir Nominasi
          </button>
        </div>
      </div>
    );
  }

  // Handle Export Audit Report to Excel
  const handleExportAuditExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sie Penganugerahan Milad Sidogiri';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Monitoring Pengisian', {
        pageSetup: { orientation: 'landscape', paperSize: 9 },
        views: [{ showGridLines: true }],
      });

      // Header Brand
      sheet.addRow(['LAPORAN AUDIT & MONITORING PENGISIAN NOMINASI']);
      sheet.addRow(['SIE PENGANUGERAHAN - MILAD PONDOK PESANTREN SIDOGIRI']);
      sheet.addRow([`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | Total Akun: ${totalAccounts} | Sudah Mengisi: ${filledAccounts} (${compliancePercentage}%) | Belum Mengisi: ${pendingAccounts}`]);
      sheet.addRow([]);

      sheet.getRow(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1C1917' } };
      sheet.getRow(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF8A7C4C' } };
      sheet.getRow(3).font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF57534E' } };

      const tableHeaders = [
        'NO',
        'ID PERSONALIA',
        'NAMA LENGKAP',
        'USERNAME',
        'TINGKAT AKSES / ROLE',
        'STATUS PENGISIAN',
        'JUMLAH USULAN',
        'KATEGORI YANG DIISI',
        'DAFTAR KANDIDAT YANG DIUSULKAN',
        'TANGGAL TERAKHIR PENGISIAN',
      ];

      const headerRow = sheet.addRow(tableHeaders);
      headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF8A7C4C' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDCD7CB' } },
          bottom: { style: 'medium', color: { argb: 'FF675C37' } },
          left: { style: 'thin', color: { argb: 'FFDCD7CB' } },
          right: { style: 'thin', color: { argb: 'FFDCD7CB' } },
        };
      });

      sheet.columns = [
        { key: 'no', width: 6 },
        { key: 'idPers', width: 16 },
        { key: 'nama', width: 32 },
        { key: 'username', width: 20 },
        { key: 'role', width: 28 },
        { key: 'status', width: 18 },
        { key: 'jumlah', width: 15 },
        { key: 'kategori', width: 30 },
        { key: 'kandidat', width: 40 },
        { key: 'tanggal', width: 24 },
      ];

      filteredAuditList.forEach((item, idx) => {
        const rowData = [
          idx + 1,
          item.account.idPersonalia || '-',
          item.account.name,
          item.account.username || '-',
          item.roleOption.label,
          item.hasFilled ? 'SUDAH MENGISI' : 'BELUM MENGISI',
          item.count > 0 ? `${item.count} Usulan` : '0 Usulan',
          item.usedCategories.join(', ') || '-',
          item.candidateNames.join(', ') || '-',
          item.latestDate ? new Date(item.latestDate).toLocaleString('id-ID') : '-',
        ];

        const row = sheet.addRow(rowData);
        row.font = { name: 'Arial', size: 9 };
        row.alignment = { vertical: 'middle' };

        // Highlight status cell
        const statusCell = row.getCell(6);
        statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (item.hasFilled) {
          statusCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF065F46' } };
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        } else {
          statusCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF991B1B' } };
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }

        row.eachCell((c) => {
          c.border = {
            top: { style: 'thin', color: { argb: 'FFE7E5E4' } },
            bottom: { style: 'thin', color: { argb: 'FFE7E5E4' } },
            left: { style: 'thin', color: { argb: 'FFE7E5E4' } },
            right: { style: 'thin', color: { argb: 'FFE7E5E4' } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `Laporan_Monitoring_Pengisian_Nominasi_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export Excel failed:', err);
      alert('Gagal mengekspor laporan monitoring ke Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp reminder generator for accounts that haven't submitted yet
  const handleSendReminderWA = (accountName: string, roleName: string) => {
    const message = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb.\n\nYth. *${accountName}* (${roleName}),\n\nMengingatkan kembali dari Panitia Sie Penganugerahan Milad Pondok Pesantren Sidogiri. Berdasarkan rekap sistem, akun Anda tercatat *belum mengisi / mengajukan usulan penganugerahan*.\n\nMohon untuk segera masuk ke aplikasi penganugerahan dan mengisi nama calon yang diusulkan sebelum batas waktu berakhir.\n\nLink Aplikasi: https://ais-pre-2t5jjthayj7e4yawbgduqv-162480341949.asia-southeast1.run.app\n\nTerima kasih atas kerja samanya.\nWassalamu'alaikum Wr. Wb.`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Breadcrumb & Header */}
      <ContentHeader
        title="Laporan & Statistik Pengisian Nominasi"
        subtitle="Monitoring Kepatuhan Pengisian Akun Panitia & Petugas Lapangan"
        activeTab="laporan"
      />

      {/* Main Top Header Banner */}
      <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#f2eee3]/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-1.5 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#f2eee3] text-[#8a7c4c] flex items-center justify-center border border-[#c3b68b]/40 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-[#24211c] tracking-tight">
                  Audit &amp; Monitoring Kepatuhan Pengisian
                </h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Khusus Admin
                </span>
              </div>
              <p className="text-xs text-[#7c7b77] mt-0.5">
                Pantau secara langsung siapa saja panitia/petugas yang <strong>sudah mengisi</strong> usulan nominasi dan siapa yang <strong>belum mengisi</strong> dari masing-masing akun.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={handleExportAuditExcel}
            disabled={isExporting}
            className="flex items-center space-x-2 bg-white hover:bg-[#f7f6f2] text-[#24211c] border border-[rgba(36,33,28,0.15)] font-bold px-4 py-2.5 rounded-2xl shadow-2xs transition text-xs cursor-pointer disabled:opacity-50"
            title="Download Rekap Monitoring ke Excel"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#8a7c4c]" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            )}
            <span>{isExporting ? 'Mengekspor...' : 'Ekspor Laporan Excel'}</span>
          </button>

          <button
            onClick={() => setActiveTab('nominasi')}
            className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-bold px-4 py-2.5 rounded-2xl shadow-xs transition text-xs cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Lihat Data Nominasi</span>
          </button>
        </div>
      </div>

      {/* Standalone Direct App Link Banner for Distribution (Permintaan Pengguna #3) */}
      <div className="bg-[#faf8f4] border border-[#dcd7cb] rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#8a7c4c]/10 text-[#8a7c4c]">
              <Share2 className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#24211c]">
              Tautan Langsung Aplikasi Untuk Disebarkan (Langsung ke Aplikasi &amp; Wajib Login)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Tanpa AI Studio
            </span>
          </div>
          <p className="text-[11px] text-[#7c7b77] leading-relaxed">
            Sebarkan tautan resmi ini kepada para petugas/madrasah. Siapapun yang mengeklik link ini akan langsung membuka aplikasi mandiri di peramban (browser) dan <strong>diwajibkan login</strong> menggunakan Username / ID Personalia serta Password masing-masing.
          </p>
          <div className="font-mono text-xs text-[#675c37] font-bold bg-white px-3 py-1.5 rounded-xl border border-[#dcd7cb] break-all inline-block select-all">
            https://ais-pre-2t5jjthayj7e4yawbgduqv-162480341949.asia-southeast1.run.app
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const url = 'https://ais-pre-2t5jjthayj7e4yawbgduqv-162480341949.asia-southeast1.run.app';
            navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 3000);
          }}
          className={`shrink-0 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer shadow-xs ${
            copiedLink
              ? 'bg-emerald-700 text-white'
              : 'bg-[#8a7c4c] hover:bg-[#675c37] text-white'
          }`}
        >
          {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copiedLink ? 'Tautan Berhasil Disalin!' : 'Salin Tautan Aplikasi'}</span>
        </button>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Akun Terdaftar */}
        <div className="bg-white border border-[#e8e4da] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7c7b77] uppercase tracking-wider">Total Akun</span>
            <span className="p-2 rounded-xl bg-[#f2eee3] text-[#8a7c4c]">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-[#24211c]">{totalAccounts}</span>
            <span className="text-xs text-[#7c7b77] ml-1.5 font-medium">Akun Panitia &amp; Petugas</span>
          </div>
          <div className="text-[11px] text-[#7c7b77] pt-1 border-t border-[#f2eee3]">
            {accounts.filter((a) => a.category === 'admin').length} Admin • {accounts.filter((a) => a.category === 'petugas').length} Petugas
          </div>
        </div>

        {/* Metric 2: Sudah Mengisi (Sukses) */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Sudah Mengisi</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">{filledAccounts}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-full">
              {compliancePercentage}% Selesai
            </span>
          </div>
          <div className="w-full bg-emerald-200/50 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${compliancePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Belum Mengisi (Pending) */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Belum Mengisi</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-900">{pendingAccounts}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
              {totalAccounts > 0 ? Math.round((pendingAccounts / totalAccounts) * 100) : 0}% Pending
            </span>
          </div>
          <div className="text-[11px] text-amber-800 font-medium pt-1 border-t border-amber-200/60 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Perlu diingatkan sebelum batas waktu</span>
          </div>
        </div>

        {/* Metric 4: Total Usulan Terdaftar */}
        <div className="bg-[#fcfbf9] border border-[#c3b68b]/70 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8a7c4c] uppercase tracking-wider">Total Usulan Masuk</span>
            <span className="p-2 rounded-xl bg-[#f2eee3] text-[#8a7c4c]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-[#675c37]">{totalNominationsSubmitted}</span>
            <span className="text-xs text-[#7c7b77] ml-1.5 font-medium">Kandidat / Ranting</span>
          </div>
          <div className="text-[11px] text-[#675c37] font-semibold pt-1 border-t border-[#e8e4da]">
            Rata-rata: {filledAccounts > 0 ? (totalNominationsSubmitted / filledAccounts).toFixed(1) : 0} usulan / akun
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pill Tabs: Semua, Sudah Mengisi, Belum Mengisi */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Semua Akun</span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
              {totalAccounts}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('filled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'filled'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <span>✓ Sudah Mengisi</span>
            <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === 'filled' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {filledAccounts}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <span>⏳ Belum Mengisi</span>
            <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingAccounts}
            </span>
          </button>
        </div>

        {/* Right side: Role Dropdown & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Role Filter */}
          <div className="w-full sm:w-56">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]/30 cursor-pointer"
            >
              <option value="all">Semua Role / Tingkat Akses</option>
              <option value="panitia">1. Panitia (admin)</option>
              <option value="madrasah">2. Madrasah (petugas - 5 Kategori)</option>
              <option value="alumni">3. Alumni (petugas - Khidmah Alumni)</option>
              <option value="pengurus_instansi">4. Pengurus Instansi (petugas)</option>
              <option value="pengurus_daerah">5. Pengurus Daerah (petugas)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, username, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]/30 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Monitoring Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-sm text-[#24211c] uppercase tracking-wider flex items-center space-x-2">
              <span>Daftar Audit Pengisian Akun</span>
              <span className="text-[11px] font-bold text-[#8a7c4c] bg-[#f2eee3] px-2.5 py-0.5 rounded-full">
                {filteredAuditList.length} Akun
              </span>
            </h3>
          </div>

          {/* Quick Info */}
          <span className="text-[11px] text-[#7c7b77] font-medium bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
            Kepatuhan: <strong className="text-emerald-700 font-bold">{compliancePercentage}%</strong> ({filledAccounts} dari {totalAccounts} Akun)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 font-black uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Akun &amp; Username</th>
                <th className="py-3 px-4">Role &amp; Kategori</th>
                <th className="py-3 px-4 text-center">Status Pengisian</th>
                <th className="py-3 px-4 text-center">Usulan</th>
                <th className="py-3 px-4">Kandidat yang Diusulkan</th>
                <th className="py-3 px-4">Terakhir Mengisi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAuditList.map((item, idx) => {
                const acc = item.account;
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                    {/* No */}
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Nama & Username */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-2xs shrink-0 ${acc.avatarBg || 'bg-[#8a7c4c] text-white'}`}>
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-[#24211c] text-xs sm:text-sm">
                            {acc.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {acc.idPersonalia && (
                              <span className="font-mono text-[10px] font-bold text-[#8a7c4c] bg-[#faf8f4] px-1.5 py-0.2 rounded border border-[#dcd7cb]">
                                {acc.idPersonalia}
                              </span>
                            )}
                            {acc.username && (
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                @{acc.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Kategori */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold border ${
                        acc.category === 'admin'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-[#faf8f4] text-[#675c37] border-[#c3b68b]/50'
                      }`}>
                        {item.roleOption.label}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                        {acc.role}
                      </p>
                    </td>

                    {/* Status Pengisian */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.hasFilled ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[11px] border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sudah Mengisi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-800 font-black text-[11px] border border-amber-300 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>Belum Mengisi</span>
                        </span>
                      )}
                    </td>

                    {/* Jumlah Usulan */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg ${
                        item.count > 0 ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400'
                      }`}>
                        {item.count} Usulan
                      </span>
                    </td>

                    {/* Kandidat yang Diusulkan */}
                    <td className="py-3.5 px-4">
                      {item.candidateNames.length > 0 ? (
                        <div className="space-y-1">
                          {item.candidateNames.slice(0, 3).map((cName, ci) => (
                            <span
                              key={ci}
                              className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-md bg-[#faf8f4] text-[#24211c] text-[10.5px] font-semibold border border-[#e8e4da]"
                            >
                              • {cName}
                            </span>
                          ))}
                          {item.candidateNames.length > 3 && (
                            <span className="text-[10px] text-slate-400 italic font-medium ml-1">
                              +{item.candidateNames.length - 3} lainnya
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum ada usulan</span>
                      )}
                    </td>

                    {/* Terakhir Mengisi */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[10.5px]">
                      {item.latestDate ? (
                        new Date(item.latestDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {!item.hasFilled ? (
                        <button
                          type="button"
                          onClick={() => handleSendReminderWA(acc.name, item.roleOption.name)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer shadow-2xs"
                          title="Kirim pengingat sopan via WhatsApp"
                        >
                          <Send className="w-3 h-3" />
                          <span>Ingatkan WA</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveTab('nominasi')}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                          title="Buka data usulan di tab Nominasi"
                        >
                          <span>Lihat Usulan</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredAuditList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ditemukan akun yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
