import React from 'react';
import { Award, DollarSign, TrendingDown, Users, ArrowRight, PlusCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ActiveTab, AwardCategory, Nomination, Transaction, CommitteeTask } from '../types';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  transactions: Transaction[];
  nominations: Nomination[];
  categories: AwardCategory[];
  tasks: CommitteeTask[];
  onOpenAddNomination: () => void;
  onOpenAddTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  transactions,
  nominations,
  categories,
  tasks,
  onOpenAddNomination,
  onOpenAddTransaction,
}) => {
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

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-4 pb-8">
      {/* Compact Top Header Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
            🏆
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">
              Dashboard Sie Penganugerahan
            </h1>
            <p className="text-xs text-slate-500">
              Ringkasan kas, status nominasi pemenang, dan operasional panitia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddNomination}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-xl transition text-xs shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Nominasi</span>
          </button>

          <button
            onClick={onOpenAddTransaction}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-1.5 rounded-xl border border-slate-200 transition text-xs cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Catat Kas</span>
          </button>
        </div>
      </div>

      {/* Metric Cards - 4 Columns Compact Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Saldo Kas */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">Saldo Kas</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5">
            <h2 className="text-lg font-black text-slate-900">{formatIDR(saldoSisa)}</h2>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              Masuk: {formatIDR(totalPemasukan)}
            </p>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">Pengeluaran</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1.5">
            <h2 className="text-lg font-black text-slate-900">{formatIDR(totalPengeluaran)}</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Operasional & Logistik</p>
          </div>
        </div>

        {/* Status Nominasi */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">Total Nominasi</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">{totalNominasi} Orang</h2>
              <p className="text-[10px] text-emerald-700 font-semibold">{winnersCount} Pemenang</p>
            </div>
            {pendingCount > 0 && (
              <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md">
                {pendingCount} Review
              </span>
            )}
          </div>
        </div>

        {/* Task Progress */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">Tugas Panitia</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">{taskProgress}%</h2>
              <span className="text-[10px] font-bold text-slate-500">{completedTasks}/{tasks.length} Selesai</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-200">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{ width: `${taskProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid (Chart + Winners & Tasks) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Compact Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Grafik Pengeluaran per Kategori</h3>
            </div>
            <button
              onClick={() => setActiveTab('keuangan')}
              className="text-xs font-bold text-amber-700 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Detail Laporan</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {chartData.length > 0 ? (
            <div className="h-40 w-full">
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
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '11px', padding: '6px 10px' }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl">
              Belum ada data pengeluaran
            </div>
          )}
        </div>

        {/* Right Column: Quick Status & Winners */}
        <div className="space-y-4">
          {/* Recent Winners Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Pemenang Ditetapkan</h3>
              <button
                onClick={() => setActiveTab('nominasi')}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2">
              {nominations.filter((n) => n.status === 'Pemenang').slice(0, 3).map((nom) => {
                const cat = categories.find((c) => c.id === nom.categoryId);
                return (
                  <div key={nom.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="shrink-0">🏆</span>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{nom.candidateName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{cat?.title || 'Kategori'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                      {nom.score} Pts
                    </span>
                  </div>
                );
              })}

              {nominations.filter((n) => n.status === 'Pemenang').length === 0 && (
                <p className="text-center text-slate-400 text-xs italic py-2">
                  Belum ada pemenang
                </p>
              )}
            </div>
          </div>

          {/* Quick Certificate Link Banner */}
          <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 flex items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-xs text-amber-900">Cetak Sertifikat Digital</h4>
              <p className="text-[10px] text-slate-600">Buat sertifikat resmi berstempel emas</p>
            </div>
            <button
              onClick={() => setActiveTab('sertifikat')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm shrink-0 cursor-pointer"
            >
              Cetak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
