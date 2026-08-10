import React from 'react';
import { Award, DollarSign, TrendingDown, Users, ArrowRight, PlusCircle, FileSpreadsheet, CheckCircle2, FileCheck, CheckSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ActiveTab, AwardCategory, Nomination, Transaction, CommitteeTask, UserSession } from '../types';
import { getWebhookUrl } from '../services/webhookService';
import { ContentHeader } from './ContentHeader';

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

  const COLORS = ['#f39c12', '#3c8dbc', '#00a65a', '#dd4b39', '#00c0ef', '#393536'];

  return (
    <div className="space-y-4 pb-8">
      {/* Content Header & Breadcrumb */}
      <ContentHeader
        title={isPetugas ? 'Dasbor Petugas Lapangan' : 'Dasbor Utama'}
        subtitle={isPetugas ? 'Portal Input & Verifikasi Candidate' : 'Sistem Informasi Operator Sie Penganugerahan'}
        activeTab="dashboard"
      />

      {/* Action Header Banner */}
      <div className="admin-box border-t-4 border-t-[#3c8dbc] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-[#f39c12] text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow">
            🏆
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-800 leading-tight">
              {isPetugas ? 'Sistem Input Data Petugas Lapangan' : 'Sistem Operator Sie Penganugerahan - Sidogiri'}
            </h2>
            <p className="text-xs text-gray-500">
              {isPetugas
                ? 'Portal Penginputan dan Verifikasi Data Calon Penerima Anugerah.'
                : 'Ringkasan posisi kas, statistik nominasi pemenang, dan koordinasi panitia.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddNomination}
            className="flex items-center space-x-1.5 bg-[#00a65a] hover:bg-[#008d4c] text-white font-extrabold px-3.5 py-1.5 rounded transition text-xs shadow cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Tambah Nominasi</span>
          </button>

          {!isPetugas && (
            <button
              onClick={onOpenAddTransaction}
              className="flex items-center space-x-1.5 bg-[#3c8dbc] hover:bg-[#367fa9] text-white font-extrabold px-3.5 py-1.5 rounded transition text-xs shadow cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Catat Kas</span>
            </button>
          )}
        </div>
      </div>

      {/* Small Box / Info Box Widgets ala AdminLTE */}
      {!isPetugas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Box 1: Saldo Kas (Green) */}
          <div className="small-box bg-[#00a65a]">
            <div className="inner">
              <h3 className="text-xl font-black">{formatIDR(saldoSisa)}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1">SALDO KAS UTAMA</p>
              <p className="text-[10px] text-white/80 mt-1">Pemasukan: {formatIDR(totalPemasukan)}</p>
            </div>
            <DollarSign className="icon-bg" />
            <button
              onClick={() => setActiveTab('keuangan')}
              className="small-box-footer w-full cursor-pointer"
            >
              <span>Lihat Detail Laporan Kas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Box 2: Total Nominasi (Aqua/Blue) */}
          <div className="small-box bg-[#00c0ef]">
            <div className="inner">
              <h3 className="text-xl font-black">{totalNominasi} <span className="text-sm font-normal">Orang</span></h3>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1">TOTAL NOMINASI</p>
              <p className="text-[10px] text-white/80 mt-1">{winnersCount} Pemenang | {pendingCount} Review</p>
            </div>
            <Award className="icon-bg" />
            <button
              onClick={() => setActiveTab('nominasi')}
              className="small-box-footer w-full cursor-pointer"
            >
              <span>Lihat Data Nominasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Box 3: Tugas Panitia (Yellow/Orange) */}
          <div className="small-box bg-[#f39c12]">
            <div className="inner">
              <h3 className="text-xl font-black">{taskProgress}%</h3>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1">TUGAS OPERASIONAL</p>
              <p className="text-[10px] text-white/80 mt-1">{completedTasks} dari {tasks.length} Tugas Selesai</p>
            </div>
            <CheckSquare className="icon-bg" />
            <button
              onClick={() => setActiveTab('koordinasi')}
              className="small-box-footer w-full cursor-pointer"
            >
              <span>Lihat Koordinasi Panitia</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Box 4: Sertifikat Diterbitkan (Red) */}
          <div className="small-box bg-[#dd4b39]">
            <div className="inner">
              <h3 className="text-xl font-black">{winnersCount} <span className="text-sm font-normal">Dokumen</span></h3>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1">E-SERTIFIKAT RESMI</p>
              <p className="text-[10px] text-white/80 mt-1">Siap Cetak & Stamp Stempel Emas</p>
            </div>
            <FileCheck className="icon-bg" />
            <button
              onClick={() => setActiveTab('sertifikat')}
              className="small-box-footer w-full cursor-pointer"
            >
              <span>Buka Generator Sertifikat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        {isPetugas ? (
          <div className="lg:col-span-2 admin-box border-t-4 border-t-[#00a65a] p-5 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-[#00a65a]/10 text-[#00a65a] border border-[#00a65a]/30 px-3 py-1 rounded text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Portal Tugas Petugas Lapangan</span>
            </div>
            <h2 className="text-lg font-extrabold text-gray-800">
              Kelola & Input Data Candidates Nominasi
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Sebagai Petugas, Anda memiliki wewenang untuk menambahkan kandidat nominasi baru, melengkapi dokumen pendukung, serta memantau status pemenang penganugerahan.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenAddNomination}
                className="bg-[#00a65a] hover:bg-[#008d4c] text-white font-black px-4 py-2 rounded text-xs flex items-center space-x-2 shadow transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Input Candidate Nominasi</span>
              </button>
              <button
                onClick={() => setActiveTab('nominasi')}
                className="bg-gray-700 hover:bg-gray-800 text-white font-bold px-4 py-2 rounded text-xs flex items-center space-x-2 transition cursor-pointer"
              >
                <span>Lihat Semua Nominasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 admin-box border-t-4 border-t-[#3c8dbc] p-4 space-y-3">
            <div className="admin-box-header px-0 pt-0 border-b border-gray-200">
              <h3 className="font-extrabold text-gray-800 text-sm">Grafik Pengeluaran per Kategori</h3>
              <button
                onClick={() => setActiveTab('keuangan')}
                className="text-xs font-bold text-[#3c8dbc] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Detail Laporan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {chartData.length > 0 ? (
              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      interval={0}
                      angle={-10}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      formatter={(val: number) => [formatIDR(val), 'Pengeluaran']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '11px', padding: '6px 10px' }}
                    />
                    <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-gray-400 text-xs italic border border-dashed border-gray-200 rounded">
                Belum ada data pengeluaran
              </div>
            )}
          </div>
        )}

        {/* Right Column: Quick Status & Winners */}
        <div className="space-y-4">
          {/* Recent Winners Card */}
          <div className="admin-box border-t-4 border-t-[#f39c12] p-4 space-y-3">
            <div className="admin-box-header px-0 pt-0 border-b border-gray-200">
              <h3 className="font-extrabold text-gray-800 text-sm">Pemenang Ditetapkan</h3>
              <button
                onClick={() => setActiveTab('nominasi')}
                className="text-xs font-bold text-[#f39c12] hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2">
              {nominations.filter((n) => n.status === 'Pemenang').slice(0, 3).map((nom) => {
                const cat = categories.find((c) => c.id === nom.categoryId);
                return (
                  <div key={nom.id} className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200 text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="shrink-0">🏆</span>
                      <div className="truncate">
                        <p className="font-bold text-gray-800 truncate">{nom.candidateName}</p>
                        <p className="text-[10px] text-gray-500 truncate">{cat?.title || 'Kategori'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] shrink-0">
                      {nom.score} Pts
                    </span>
                  </div>
                );
              })}

              {nominations.filter((n) => n.status === 'Pemenang').length === 0 && (
                <p className="text-center text-gray-400 text-xs italic py-2">
                  Belum ada pemenang
                </p>
              )}
            </div>
          </div>

          {/* Quick Certificate / Document Link Banner */}
          <div className="bg-amber-50 rounded border border-amber-300 p-3.5 flex items-center justify-between gap-2 shadow-2xs">
            <div>
              <h4 className="font-extrabold text-xs text-amber-950">
                {isPetugas ? 'Arsip Surat & Ketentuan' : 'Cetak Sertifikat Digital'}
              </h4>
              <p className="text-[10px] text-gray-600">
                {isPetugas ? 'Buka dokumen resmi & SK Anugerah' : 'Buat sertifikat resmi berstempel emas'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab(isPetugas ? 'surat' : 'sertifikat')}
              className="px-3 py-1.5 bg-[#f39c12] hover:bg-[#e08e0b] text-slate-950 font-black text-xs rounded shadow shrink-0 cursor-pointer"
            >
              {isPetugas ? 'Buka' : 'Cetak'}
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Footer Webhook Config Trigger */}
      {onOpenWebhookModal && (
        <div className="pt-2 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-300/60 mt-4">
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a65a] inline-block"></span>
            <span>Firestore Realtime Status: Terhubung</span>
          </span>
          <button
            onClick={onOpenWebhookModal}
            className="text-gray-600 hover:text-gray-900 transition flex items-center space-x-1 cursor-pointer font-bold"
            title="Integrasi Google Sheets"
          >
            <FileSpreadsheet className="w-3 h-3 text-[#00a65a]" />
            <span>Integrasi Webhook Sheets</span>
          </button>
        </div>
      )}
    </div>
  );
};

