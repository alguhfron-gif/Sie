import React, { useState } from 'react';
import { DollarSign, Plus, Search, Filter, TrendingUp, TrendingDown, Printer, FileSpreadsheet, Trash2, Calendar, FileText, CheckCircle2, Receipt, Upload, Image as ImageIcon, X, Eye, Download, ExternalLink, Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Transaction, TransactionCategory, TransactionType } from '../types';
import { uploadReceiptImage } from '../services/storageService';

interface FinanceViewProps {
  transactions: Transaction[];
  onAddTransaction: (trx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  isAddModalOpenDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  isAddModalOpenDirectly = false,
  onCloseAddModalDirectly,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenDirectly);
  const [showPrintReport, setShowPrintReport] = useState(false);

  // Proof Image Pop-up Preview State
  const [selectedProofTrx, setSelectedProofTrx] = useState<Transaction | null>(null);

  // Modal Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('pengeluaran');
  const [category, setCategory] = useState<TransactionCategory>('Trofi & Plakat');
  const [amount, setAmount] = useState<number>(500000);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Image Upload State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Financial Calculations
  const totalPemasukan = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoSisa = totalPemasukan - totalPengeluaran;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenAdd = () => {
    setTitle('');
    setType('pengeluaran');
    setCategory('Trofi & Plakat');
    setAmount(250000);
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setReceiptNumber(`NOT-${Math.floor(100 + Math.random() * 900)}`);
    setProofFile(null);
    setProofPreviewUrl(null);
    setIsUploadingProof(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setProofFile(null);
    setProofPreviewUrl(null);
    setIsUploadingProof(false);
    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProofPreviewUrl(previewUrl);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    let uploadedProofUrl: string | undefined = undefined;

    if (proofFile) {
      setIsUploadingProof(true);
      try {
        uploadedProofUrl = await uploadReceiptImage(proofFile);
      } catch (err) {
        console.error("Gagal mengunggah foto kuitansi:", err);
      } finally {
        setIsUploadingProof(false);
      }
    }

    onAddTransaction({
      title,
      type,
      category,
      amount,
      date,
      notes,
      receiptNumber: receiptNumber || `TRX-${Date.now().toString().slice(-4)}`,
      proofUrl: uploadedProofUrl,
    });

    closeModal();
  };

  // Chart Data
  const categoriesList: TransactionCategory[] = [
    'Sponsor & Donasi',
    'Kas Organisasi',
    'Trofi & Plakat',
    'Cetak Sertifikat',
    'Konsumsi',
    'Dekorasi & Panggung',
    'Dokumentasi & Media',
    'Lain-lain',
  ];

  const pieData = categoriesList
    .map((cat) => {
      const sum = transactions
        .filter((t) => t.category === cat)
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: cat, value: sum };
    })
    .filter((d) => d.value > 0);

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b', '#f43f5e'];

  // Filter Transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.receiptNumber && t.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Printable Report View Mode */}
      {showPrintReport ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-slate-800 space-y-6 max-w-4xl mx-auto print:bg-white print:text-slate-900 print:shadow-none print:border-none">
          <div className="flex items-center justify-between border-b pb-4 border-slate-200 print:border-slate-300">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center font-bold text-slate-950 text-xl shadow-sm">
                🏆
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">LAPORAN KEUANGAN RESMI</h2>
                <p className="text-xs font-bold text-amber-800 print:text-slate-600">Panitia Malam Penganugerahan • Sie Penganugerahan</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-2xl text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / PDF</span>
              </button>
              <button
                onClick={() => setShowPrintReport(false)}
                className="px-3.5 py-2 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs print:bg-slate-50 print:border-slate-300">
            <div>
              <p className="text-slate-500 font-semibold">Total Pemasukan:</p>
              <p className="text-base font-black text-emerald-700">{formatIDR(totalPemasukan)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold">Total Pengeluaran:</p>
              <p className="text-base font-black text-rose-700">{formatIDR(totalPengeluaran)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold">Saldo Akhir:</p>
              <p className="text-base font-black text-slate-900">{formatIDR(saldoSisa)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-3">Rincian Transaksi Pemasukan & Pengeluaran</h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-2.5 border border-slate-200">No</th>
                  <th className="p-2.5 border border-slate-200">Tanggal</th>
                  <th className="p-2.5 border border-slate-200">No. Bukti</th>
                  <th className="p-2.5 border border-slate-200">Keterangan Transaksi</th>
                  <th className="p-2.5 border border-slate-200">Kategori</th>
                  <th className="p-2.5 border border-slate-200 text-right">Debit (Masuk)</th>
                  <th className="p-2.5 border border-slate-200 text-right">Kredit (Keluar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((t, idx) => (
                  <tr key={t.id} className="border-b border-slate-200">
                    <td className="p-2.5 border border-slate-200 text-center">{idx + 1}</td>
                    <td className="p-2.5 border border-slate-200">{t.date}</td>
                    <td className="p-2.5 border border-slate-200 font-mono text-[11px] text-amber-800 font-bold">{t.receiptNumber || '-'}</td>
                    <td className="p-2.5 border border-slate-200 font-medium">{t.title}</td>
                    <td className="p-2.5 border border-slate-200 text-slate-600">{t.category}</td>
                    <td className="p-2.5 border border-slate-200 text-right text-emerald-700 font-semibold">
                      {t.type === 'pemasukan' ? formatIDR(t.amount) : '-'}
                    </td>
                    <td className="p-2.5 border border-slate-200 text-right text-rose-700 font-semibold">
                      {t.type === 'pengeluaran' ? formatIDR(t.amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-700">
            <div>
              <p className="font-semibold mb-12">Mengetahui,<br />Ketua Sie Penganugerahan</p>
              <p className="font-bold text-slate-900 underline">Ahmad Fauzi, S.T.</p>
            </div>
            <div>
              <p className="font-semibold mb-12">Disusun Oleh,<br />Bendahara Sie Penganugerahan</p>
              <p className="font-bold text-slate-900 underline">Siti Rahmawati</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h1 className="text-xl font-bold text-slate-900">Pengelolaan Keuangan & Anggaran Sie</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Catat arus kas masuk/keluar, pertanggungjawaban trofi & sertifikat, serta buat laporan resmi.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPrintReport(true)}
                className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Format Laporan Resmi</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-2xl shadow-sm transition text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Transaksi</span>
              </button>
            </div>
          </div>

          {/* Financial Metrics Cards (Bento Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Pemasukan</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{formatIDR(totalPemasukan)}</h2>
              <p className="text-[11px] text-slate-500 mt-1">Kas Organisasi & Sponsor Donasi</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Pengeluaran</span>
                <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-800 border border-rose-200 flex items-center justify-center font-bold">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{formatIDR(totalPengeluaran)}</h2>
              <p className="text-[11px] text-slate-500 mt-1">Trofi, Cetakan, Konsumsi & Perlengkapan</p>
            </div>

            <div className="bg-amber-50 p-5 rounded-3xl border border-amber-200 shadow-sm text-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">Saldo Akhir Tersedia</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-amber-900 mt-2">{formatIDR(saldoSisa)}</h2>
              <p className="text-[11px] text-slate-600 mt-1">Siap dialokasikan untuk sisa kebutuhan acara</p>
            </div>
          </div>

          {/* Chart & Category Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1 space-y-2">
              <h3 className="font-bold text-slate-900 text-base">Proporsi Alokasi Anggaran</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Persentase pengeluaran Sie Penganugerahan berdasarkan kategori kebutuhan logistik & acara.
              </p>
              <div className="pt-2 text-xs text-slate-600 space-y-1">
                <p>• <strong className="text-amber-800">Trofi & Plakat:</strong> Biaya pengrajin utama</p>
                <p>• <strong className="text-amber-800">Cetak Sertifikat:</strong> Kertas Linen Gold Foil</p>
              </div>
            </div>

            <div className="md:col-span-2 h-52 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatIDR(v), 'Jumlah']} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada data pengeluaran</p>
              )}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi, kuitansi, atau keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Semua Jenis</option>
                  <option value="pemasukan">Pemasukan (+)</option>
                  <option value="pengeluaran">Pengeluaran (-)</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-700">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Riwayat Transaksi Keuangan ({filteredTransactions.length})</h3>
            </div>

            {/* Mobile Card List View (For Mobile HP Screens) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-xs leading-snug truncate">{t.title}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{t.date}</span>
                        <span>•</span>
                        <span className="font-mono text-amber-800 font-bold">{t.receiptNumber || '-'}</span>
                      </div>
                    </div>
                    <span className={`font-black text-xs shrink-0 ${t.type === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {t.type === 'pemasukan' ? '+' : '-'} {formatIDR(t.amount)}
                    </span>
                  </div>

                  {t.notes && <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl italic">{t.notes}</p>}

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                        {t.category}
                      </span>
                      {t.proofUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedProofTrx(t)}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-extrabold flex items-center space-x-1 cursor-pointer transition"
                        >
                          <Receipt className="w-3 h-3 text-emerald-600" />
                          <span>Lihat Bukti</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="p-1 text-rose-600 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  Belum ada data transaksi yang sesuai filter.
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tanggal / No. Bukti</th>
                    <th className="p-3.5">Judul Transaksi</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5 text-center">Bukti Kuitansi</th>
                    <th className="p-3.5 text-right">Jumlah (Rp)</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{t.date}</div>
                        <div className="text-[10px] text-amber-800 font-mono font-bold">{t.receiptNumber || '-'}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{t.title}</div>
                        {t.notes && <div className="text-[11px] text-slate-500 mt-0.5">{t.notes}</div>}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {t.proofUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProofTrx(t)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lihat Bukti</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tidak Ada</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-black text-sm">
                        <span className={t.type === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}>
                          {t.type === 'pemasukan' ? '+' : '-'} {formatIDR(t.amount)}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Belum ada data transaksi yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pop-up Modal View Receipt / Proof Image */}
      {selectedProofTrx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                    {selectedProofTrx.title}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-mono font-bold">
                    No. Bukti: {selectedProofTrx.receiptNumber || '-'} • {selectedProofTrx.date}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProofTrx(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Image Preview */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Nominal: </span>
                  <span className={`font-black ${selectedProofTrx.type === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedProofTrx.type === 'pemasukan' ? '+' : '-'} {formatIDR(selectedProofTrx.amount)}
                  </span>
                </div>
                <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                  {selectedProofTrx.category}
                </span>
              </div>

              {selectedProofTrx.proofUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 max-h-96 flex items-center justify-center p-2 group">
                  <img
                    src={selectedProofTrx.proofUrl}
                    alt={`Bukti ${selectedProofTrx.title}`}
                    className="max-h-80 w-auto object-contain rounded-xl shadow-md transition transform group-hover:scale-[1.02]"
                  />
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs italic border border-dashed border-slate-200">
                  Tidak ada foto kuitansi terlampir.
                </div>
              )}

              {selectedProofTrx.notes && (
                <p className="text-xs text-slate-600 bg-amber-50/50 border border-amber-200 p-3 rounded-xl italic">
                  <strong>Catatan:</strong> {selectedProofTrx.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                {selectedProofTrx.proofUrl && (
                  <a
                    href={selectedProofTrx.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Gambar Asli</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedProofTrx(null)}
                  className="ml-auto px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-slate-800 max-h-[90vh] flex flex-col my-auto">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Catat Transaksi Keuangan</span>
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Arus Kas *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-bold"
                  >
                    <option value="pengeluaran">Pengeluaran (-)</option>
                    <option value="pemasukan">Pemasukan (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Transaksi / Kebutuhan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembelian Trofi Kristal 10 Unit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kuitansi / Bukti Nota</label>
                <input
                  type="text"
                  placeholder="Contoh: NOT-2026-005"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-amber-800 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-mono"
                />
              </div>

              {/* Unggah Foto Bukti Transaksi / Kuitansi (Firebase Storage) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unggah Foto Bukti Transaksi / Kuitansi (Firebase Storage)
                </label>
                {proofPreviewUrl ? (
                  <div className="relative rounded-2xl border border-emerald-300 bg-emerald-50/50 p-2 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={proofPreviewUrl}
                        alt="Preview Bukti"
                        className="w-12 h-12 object-cover rounded-xl border border-emerald-200 shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-900 truncate">
                          {proofFile ? proofFile.name : 'Berkas Terpilih'}
                        </p>
                        <p className="text-[10px] text-emerald-700">Tersimpan untuk diunggah</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveProof}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                      title="Hapus Bukti"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/30 rounded-2xl cursor-pointer transition text-center group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-500 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Klik untuk Pilih Foto Kuitansi/Nota</span>
                    <span className="text-[10px] text-slate-400">Format: JPG, PNG, WEBP (Otomatis ke Firebase Storage)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  placeholder="Catatan pengerjaan atau kontak vendor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isUploadingProof}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingProof}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-sm transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingProof ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah Foto...</span>
                    </>
                  ) : (
                    <span>Simpan Transaksi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
