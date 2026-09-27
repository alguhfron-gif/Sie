import React from 'react';
import { Award, DollarSign, ArrowRight, PlusCircle, FileSpreadsheet, CheckCircle2, FileCheck, CheckSquare, Sparkles, Trophy } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ActiveTab, AwardCategory, Nomination, Transaction, CommitteeTask, UserSession } from '../types';
import { ContentHeader } from './ContentHeader';
import { MiladLogo } from './MiladLogo';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  transactions: Transaction[];
  nominations: Nomination[];
  categories: AwardCategory[];
  tasks: CommitteeTask[];
  onOpenAddNomination: () => void;
  onOpenAddTransaction: () => void;
  onOpenWebhookModal?: () => void;
  currentUser?: UserSession | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  transactions,
  nominations,
  categories,
  tasks,
  onOpenAddNomination,
  onOpenAddTransaction,
  onOpenWebhookModal,
  currentUser,
}) => {
  const isAdmin = currentUser?.category === 'admin' || (currentUser?.role && currentUser.role.toUpperCase().includes('ADMIN'));
  const isPetugas = !isAdmin && (currentUser?.category === 'petugas' || (currentUser?.role && currentUser.role.toUpperCase().includes('PETUGAS')));

  // Financial Calculations
  const totalPemasukan = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoSisa = totalPemasukan - totalPengeluaran;

  // Nominations Status Counts
  const totalNominasi = nominations.length;
  const winnersCount = nominations.filter((n) => n.status === 'Pemenang').length;
  const pendingCount = nominations.filter((n) => n.status === 'Penilaian' || n.status === 'Draf').length;

  // Task Completion Count
  const completedTasks = tasks.filter((t) => t.status === 'Selesai').length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Format IDR Currency
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Chart Data Preparation (By Category Expenses)
  const expenseByCategoryMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'pengeluaran')
    .forEach((t) => {
      expenseByCategoryMap[t.category] = (expenseByCategoryMap[t.category] || 0) + t.amount;
    });

  const chartData = Object.keys(expenseByCategoryMap).map((cat) => ({
    name: cat,
    total: expenseByCategoryMap[cat],
  }));

  const COLORS = ['#8a7c4c', '#675c37', '#a17830', '#c3b68b', '#24211c', '#7c7b77'];

  return (
    <div className="space-y-5 pb-8">
      {/* Content Header & Breadcrumb */}
      <ContentHeader
        title={isPetugas ? 'Dasbor Petugas Lapangan' : 'Dasbor Utama'}
        subtitle={isPetugas ? 'Portal Input & Verifikasi Nominasi' : 'Ringkasan & Operasional Sie Penganugerahan'}
        activeTab="dashboard"
      />

      {/* Hero Card - Milad Sidogiri Serene Minimal Style */}
      <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative accent in corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#f2eee3]/60 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center space-x-3.5">
            <MiladLogo size="md" className="w-12 h-12 shrink-0 drop-shadow-xs" />
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-[#8a7c4c] tracking-wider uppercase mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MILAD PONDOK PESANTREN SIDOGIRI</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#24211c] tracking-tight">
                {isPetugas ? 'Sistem Input & Verifikasi Calon Penerima' : 'Portal Operasional Sie Penganugerahan'}
              </h2>
              <p className="text-xs text-[#7c7b77] mt-0.5 max-w-xl">
                {isPetugas
                  ? 'Input berkas, periksa kelengkapan administrasi santri/asatidz, dan laporkan verifikasi.'
                  : 'Satu arah dalam penataan nominasi, sertifikat digital, arsip SK, serta keterbukaan kas operasional.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
            {!isPetugas ? (
              <button
                onClick={onOpenAddNomination}
                className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] active:scale-[0.98] text-white font-bold px-3.5 py-2 rounded-xl transition text-xs shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Tambah Nominasi</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('nominasi')}
                className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] active:scale-[0.98] text-white font-bold px-3.5 py-2 rounded-xl transition text-xs shadow-xs cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Ketentuan & Syarat Nominasi</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('sertifikat')}
              className="flex items-center space-x-1.5 bg-[#24211c] hover:bg-[#38342c] active:scale-[0.98] text-white font-bold px-3.5 py-2 rounded-xl transition text-xs shadow-xs cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-[#c3b68b]" />
              <span>Cetak Sertifikat</span>
            </button>

            {!isPetugas && (
              <button
                onClick={onOpenAddTransaction}
                className="flex items-center space-x-1.5 bg-[#efede7] hover:bg-[#e5e2da] active:scale-[0.98] text-[#24211c] font-bold px-3.5 py-2 rounded-xl transition text-xs border border-[rgba(36,33,28,0.12)] cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-[#8a7c4c]" />
                <span>Catat Kas</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Minimalist Stat Cards ala Milad Sidogiri */}
      {!isPetugas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Stat 1: Total Nominasi */}
          <div 
            onClick={() => setActiveTab('nominasi')}
            className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer hover:border-[#8a7c4c]/40 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-[#7c7b77] uppercase">TOTAL NOMINASI</span>
                <span className="p-1.5 rounded-lg bg-[#f2eee3] text-[#8a7c4c]">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-[#24211c]">{totalNominasi}</span>
                <span className="text-xs text-[#7c7b77] ml-1.5 font-medium">Orang</span>
              </div>
              <p className="text-[11px] text-[#7c7b77] mt-1 font-medium">
                {winnersCount} Terpilih • {pendingCount} Verifikasi
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[rgba(36,33,28,0.06)] flex items-center justify-between text-[11px] font-semibold text-[#8a7c4c]">
              <span>Buka Data Nominasi</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Stat 2: Pemenang Terpilih */}
          <div 
            onClick={() => setActiveTab('sertifikat')}
            className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer hover:border-[#8a7c4c]/40 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-[#7c7b77] uppercase">PEMENANG RESMI</span>
                <span className="p-1.5 rounded-lg bg-[#f2eee3] text-[#8a7c4c]">
                  <Trophy className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-[#24211c]">{winnersCount}</span>
                <span className="text-xs text-[#7c7b77] ml-1.5 font-medium">Penerima</span>
              </div>
              <p className="text-[11px] text-[#7c7b77] mt-1 font-medium">
                Piagam & Plakat Siap Dicetak
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[rgba(36,33,28,0.06)] flex items-center justify-between text-[11px] font-semibold text-[#8a7c4c]">
              <span>Cetak Sertifikat</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Stat 3: Saldo Kas */}
          <div 
            onClick={() => setActiveTab('keuangan')}
            className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer hover:border-[#8a7c4c]/40 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-[#7c7b77] uppercase">SALDO KAS OPERASIONAL</span>
                <span className="p-1.5 rounded-lg bg-[#f2eee3] text-[#8a7c4c]">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-[#24211c]">{formatIDR(saldoSisa)}</span>
              </div>
              <p className="text-[11px] text-[#7c7b77] mt-1 font-medium truncate">
                Masuk: {formatIDR(totalPemasukan)}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[rgba(36,33,28,0.06)] flex items-center justify-between text-[11px] font-semibold text-[#8a7c4c]">
              <span>Rincian Buku Kas</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Stat 4: Progress Tugas Panitia */}
          <div 
            onClick={() => setActiveTab('koordinasi')}
            className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer hover:border-[#8a7c4c]/40 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-[#7c7b77] uppercase">TUGAS & LOGISTIK</span>
                <span className="p-1.5 rounded-lg bg-[#f2eee3] text-[#8a7c4c]">
                  <CheckSquare className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline">
                <span className="text-2xl font-black text-[#24211c]">{taskProgress}%</span>
                <span className="text-xs text-[#7c7b77] ml-2 font-medium">
                  ({completedTasks}/{tasks.length})
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#efede7] h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-[#8a7c4c] h-full rounded-full transition-all duration-500"
                  style={{ width: `${taskProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-[rgba(36,33,28,0.06)] flex items-center justify-between text-[11px] font-semibold text-[#8a7c4c]">
              <span>Rundown & Panitia</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Clean & Minimalist ala Milad Sidogiri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Column 1: Pemenang Ditetapkan & Dokumen Resmi */}
        <div className="space-y-4">
          {/* Pemenang Terpilih Card */}
          <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(36,33,28,0.08)]">
              <div>
                <h3 className="font-bold text-sm text-[#24211c]">Pemenang Ditetapkan</h3>
                <p className="text-[11px] text-[#7c7b77]">Penerima anugerah utama</p>
              </div>
              <button
                onClick={() => setActiveTab('sertifikat')}
                className="text-xs font-semibold text-[#8a7c4c] hover:underline cursor-pointer"
              >
                Cetak Semua
              </button>
            </div>

            <div className="space-y-2">
              {nominations.filter((n) => n.status === 'Pemenang').slice(0, 5).map((nom) => {
                const cat = categories.find((c) => c.id === nom.categoryId);
                return (
                  <div key={nom.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#f7f6f2] border border-[rgba(36,33,28,0.06)] text-xs">
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="shrink-0 text-amber-600">🏆</span>
                      <div className="truncate">
                        <p className="font-bold text-[#24211c] truncate">{nom.candidateName}</p>
                        <p className="text-[10px] text-[#7c7b77] truncate">{cat?.title || 'Kategori'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#675c37] bg-[#f2eee3] border border-[#c3b68b]/40 px-2 py-0.5 rounded text-[10px] shrink-0">
                      {nom.score} Pts
                    </span>
                  </div>
                );
              })}

              {nominations.filter((n) => n.status === 'Pemenang').length === 0 && (
                <p className="text-center text-[#7c7b77] text-xs italic py-4">
                  Belum ada calon yang ditetapkan sebagai pemenang.
                </p>
              )}
            </div>
          </div>

          {/* Quick Access Card: Surat & SK */}
          <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#f2eee3] text-[#8a7c4c] flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-[#24211c]">Surat & Ketentuan Resmi</h4>
                <p className="text-[10px] text-[#7c7b77]">SK penetapan pemenang, juknis penganugerahan</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[rgba(36,33,28,0.08)] flex justify-end">
              <button
                onClick={() => setActiveTab('surat')}
                className="text-xs font-semibold text-[#8a7c4c] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Buka Dokumen</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Grafik Keuangan & Sinkronisasi */}
        <div className="space-y-4">
          {/* Chart Section (Khusus Admin) */}
          {!isPetugas && chartData.length > 0 && (
            <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[rgba(36,33,28,0.08)]">
                <div>
                  <h3 className="font-bold text-sm text-[#24211c]">Grafik Pengeluaran per Kategori</h3>
                  <p className="text-[11px] text-[#7c7b77]">Distribusi biaya perlengkapan, konsumsi & piagam</p>
                </div>
                <button
                  onClick={() => setActiveTab('keuangan')}
                  className="text-xs font-semibold text-[#8a7c4c] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Buku Kas</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: '#7c7b77' }}
                      interval={0}
                      angle={-10}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#7c7b77' }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      formatter={(val: number) => [formatIDR(val), 'Biaya']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(36,33,28,0.15)', color: '#24211c', fontSize: '11px', padding: '6px 10px' }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Quick Access Card: Google Sheets */}
          {onOpenWebhookModal && (
            <div className="bg-[#f2eee3]/60 border border-[#c3b68b]/40 rounded-2xl p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 font-bold text-[#675c37]">
                  <FileSpreadsheet className="w-4 h-4 text-[#8a7c4c]" />
                  <span>Google Sheets Sync</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-[#8a7c4c]"></span>
              </div>
              <p className="text-[11px] text-[#7c7b77] mt-1.5">
                Sinkronisasi otomatis seluruh database ke Google Sheets panitia.
              </p>
              <button
                onClick={onOpenWebhookModal}
                className="mt-3 w-full py-1.5 bg-white hover:bg-[#efede7] border border-[rgba(36,33,28,0.15)] rounded-lg text-xs font-semibold text-[#24211c] transition cursor-pointer text-center"
              >
                Atur URL Webhook
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
