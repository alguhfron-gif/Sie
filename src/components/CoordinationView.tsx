import React, { useState } from 'react';
import { Users, CheckCircle2, Clock, Plus, PackageCheck, AlertCircle, Edit2, Trash2, ShieldCheck, UserCheck, FileText, Code, Box, Image, ChevronRight } from 'lucide-react';
import { CommitteeTask, InventoryItem, RundownItem, TaskStatus } from '../types';

interface CoordinationViewProps {
  tasks: CommitteeTask[];
  inventory: InventoryItem[];
  rundown: RundownItem[];
  onAddTask: (task: Omit<CommitteeTask, 'id'>) => void;
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onAddInventory: (inv: Omit<InventoryItem, 'id'>) => void;
}

interface CommitteeRole {
  id: string;
  name: string;
  title: string;
  field?: string;
  badge: string;
  color: string;
  responsibilities: string[];
}

const COMMITTEE_STRUCTURE: CommitteeRole[] = [
  {
    id: 'role-1',
    name: 'BIRRIL WALID',
    title: 'KETUA',
    badge: 'Pimpinan Utama',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    responsibilities: [
      'Mengarahkan dan mengoordinasikan seluruh anggota Sie Penganugerahan.',
      'Memastikan seluruh tugas berjalan sesuai dengan SOP Sie Penganugerahan.',
      'Bertanggung jawab atas pelaksanaan tugas dan koordinasi internal sie.',
      'Mengawasi dan mengevaluasi pelaksanaan tugas setiap anggota.',
      'Mengambil keputusan terkait pelaksanaan tugas dan kegiatan sie.',
    ],
  },
  {
    id: 'role-2',
    name: 'LAILUR MUBAROK',
    title: 'WAKIL KETUA',
    badge: 'Wakil Pimpinan',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    responsibilities: [
      'Membantu Ketua dalam mengoordinasikan pelaksanaan tugas sie.',
      'Bertanggung jawab atas pengadaan barang yang dibutuhkan oleh sie.',
      'Menjalin komunikasi dan koordinasi dengan pihak affiliate/mitra terkait.',
      'Membantu mengawasi pelaksanaan tugas anggota sie.',
      'Menggantikan tugas Ketua apabila berhalangan.',
    ],
  },
  {
    id: 'role-3',
    name: 'MAJID',
    title: 'SEKRETARIS',
    badge: 'Kesekretariatan & Acara',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    responsibilities: [
      'Bertanggung jawab atas seluruh urusan kesekretariatan sie.',
      'Menangani surat-menyurat dan administrasi Sie Penganugerahan.',
      'Mengurus pengadaan Alat Tulis Kantor (ATK) yang dibutuhkan.',
      'Menjalin komunikasi intensif dengan pihak luar, seperti IASS dan pihak terkait lainnya.',
      'Mengarsipkan dokumen-dokumen penting Sie Penganugerahan.',
      'Menjadi notulen dalam setiap rapat Sie Penganugerahan.',
      'Menyusun dan mengonsep rangkaian acara penganugerahan.',
    ],
  },
  {
    id: 'role-4',
    name: 'MUZAMMIL & GUFRON',
    title: 'ANGGOTA',
    field: 'BIDANG KOORDINASI ANTAR-SIE DAN PENGEMBANGAN SISTEM',
    badge: 'Sistem & Operasional',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    responsibilities: [
      'Menjalin komunikasi dan koordinasi dengan sie-sie yang berkaitan dengan Sie Penganugerahan.',
      'Menyampaikan informasi dan kebutuhan Sie Penganugerahan kepada sie terkait.',
      'Memastikan koordinasi antar-sie berjalan dengan baik.',
      'Mengawal kebutuhan Sie Penganugerahan yang melibatkan sie lain.',
      'Membuat dan mengembangkan aplikasi yang dapat menunjang kegiatan Sie Penganugerahan.',
      'Mengelola dan melakukan pemeliharaan terhadap aplikasi yang digunakan oleh Sie Penganugerahan.',
      'Mengembangkan sistem yang dapat membantu pengelolaan data, koordinasi, administrasi, dan kebutuhan teknis lainnya.',
      'Mengelola keuangan sie serta menyusun laporan keuangan.',
      'Menyediakan konsumsi untuk rapat dan kegiatan kerja serta menyusun laporan konsumsinya.',
    ],
  },
  {
    id: 'role-5',
    name: 'GHONI',
    title: 'ANGGOTA',
    field: 'BIDANG PENGADAAN DAN KOORDINASI ANTAR-MADRASAH',
    badge: 'Pengadaan & Madrasah',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    responsibilities: [
      'Menyediakan dan mengelola data yang dibutuhkan oleh Sie Penganugerahan.',
      'Menjalin komunikasi intensif dengan pihak internal, seperti madrasah dan pihak terkait lainnya.',
      'Membantu pengadaan barang yang dibutuhkan oleh sie.',
      'Menjalin komunikasi dan koordinasi dengan pihak affiliate/mitra terkait.',
    ],
  },
  {
    id: 'role-6',
    name: 'FARIHIN & FITRA',
    title: 'ANGGOTA',
    field: 'BIDANG INVENTARIS',
    badge: 'Inventaris & Logistik',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    responsibilities: [
      'Membuat dan mengelola inventaris Sie Penganugerahan.',
      'Bertanggung jawab atas perawatan dan pemeliharaan inventaris sie.',
      'Memastikan seluruh inventaris tercatat dengan baik.',
      'Memastikan ketersediaan inventaris sesuai dengan kebutuhan kegiatan.',
      'Melakukan pengecekan kondisi inventaris sebelum dan setelah kegiatan.',
      'Melaporkan kondisi dan kebutuhan inventaris kepada Ketua Sie Penganugerahan.',
    ],
  },
  {
    id: 'role-7',
    name: 'SULTAN & HALIM',
    title: 'ANGGOTA',
    field: 'BIDANG DESAIN DAN DOKUMENTASI',
    badge: 'Desain & Dokumentasi',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    responsibilities: [
      'Mendesain segala kebutuhan visual Sie Penganugerahan.',
      'Menyiapkan desain yang diperlukan untuk mendukung pelaksanaan kegiatan penganugerahan.',
      'Mendokumentasikan setiap kegiatan dan acara penganugerahan.',
      'Mengelola dan menyimpan hasil dokumentasi kegiatan.',
      'Berkoordinasi dengan Ketua dan anggota sie terkait kebutuhan desain serta dokumentasi.',
      'Memastikan hasil desain dan dokumentasi tersedia sesuai kebutuhan dan waktu yang telah ditentukan.',
    ],
  },
];

export const CoordinationView: React.FC<CoordinationViewProps> = ({
  tasks,
  inventory,
  rundown,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onAddInventory,
}) => {
  const [subTab, setSubTab] = useState<'structure' | 'tasks' | 'inventory' | 'rundown'>('structure');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);

  // New Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Terencana');
  const [priority, setPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Tinggi');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  // New Inventory State
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState('Unit');
  const [invStatus, setInvStatus] = useState<'Tersedia' | 'Menunggu Pesanan' | 'Perlu Tambah'>('Tersedia');
  const [invNotes, setInvNotes] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onAddTask({
      title: taskTitle,
      assignee: assignee || 'Panitia Sie',
      status: taskStatus,
      priority,
      dueDate,
    });

    setTaskTitle('');
    setIsTaskModalOpen(false);
  };

  const handleCreateInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    onAddInventory({
      itemName,
      quantity,
      unit,
      status: invStatus,
      notes: invNotes,
    });

    setItemName('');
    setIsInvModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-900">Koordinasi Panitia & Operasional Acara</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Struktur dan pembagian tugas panitia, manajemen papan tugas, inventarisasi trofi & perlengkapan, serta rundown acara.
          </p>
        </div>

        {/* SubTab Toggle */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold gap-1">
          <button
            onClick={() => setSubTab('structure')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              subTab === 'structure' ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Struktur Panitia
          </button>
          <button
            onClick={() => setSubTab('tasks')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              subTab === 'tasks' ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tugas Panitia
          </button>
          <button
            onClick={() => setSubTab('inventory')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              subTab === 'inventory' ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perlengkapan
          </button>
          <button
            onClick={() => setSubTab('rundown')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              subTab === 'rundown' ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rundown Acara
          </button>
        </div>
      </div>

      {/* SubTab 0: Structure */}
      {subTab === 'structure' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-lg">
                Struktur Organisasi Resmi
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-2">
                Pembagian Tugas & Tanggung Jawab Sie Penganugerahan
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Panduan tugas dan lingkup kerja seluruh pengurus dan anggota Sie Penganugerahan.
              </p>
            </div>

            <button
              onClick={() => setSubTab('tasks')}
              className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-2xl text-xs font-extrabold transition shadow-sm shrink-0 cursor-pointer"
            >
              <span>Lihat Papan Tugas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {COMMITTEE_STRUCTURE.map((role, idx) => (
              <div
                key={role.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400">#{idx + 1} SIE PENGANUGERAHAN</span>
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                        {role.name}
                      </h3>
                      <p className="text-xs font-bold text-amber-700 mt-0.5">
                        {role.title} {role.field ? `— ${role.field}` : ''}
                      </p>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${role.color}`}>
                      {role.badge}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rincian Tugas & Wewenang:</p>
                    <ul className="space-y-1.5">
                      {role.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx} className="text-xs text-slate-700 flex items-start space-x-2">
                          <span className="text-amber-500 font-bold shrink-0">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Panitia Sie Penganugerahan</span>
                  <button
                    onClick={() => {
                      setAssignee(role.name);
                      setSubTab('tasks');
                      setIsTaskModalOpen(true);
                    }}
                    className="text-amber-700 font-extrabold hover:underline cursor-pointer"
                  >
                    + Tambah Tugas PIC
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 1: Tasks Board */}
      {subTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Daftar Tugas Panitia Sie Penganugerahan</h3>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-2xl text-xs font-extrabold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['Terencana', 'Berjalan', 'Selesai'] as TaskStatus[]).map((colStatus) => {
              const columnTasks = tasks.filter((t) => t.status === colStatus);
              return (
                <div key={colStatus} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          colStatus === 'Selesai'
                            ? 'bg-emerald-500'
                            : colStatus === 'Berjalan'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      ></span>
                      <span>{colStatus}</span>
                    </span>
                    <span className="bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {columnTasks.map((t) => (
                      <div key={t.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                              t.priority === 'Tinggi'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : t.priority === 'Sedang'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>PIC: <strong className="text-slate-800">{t.assignee}</strong></span>
                          <span>Tenggat: {t.dueDate}</span>
                        </div>

                        {/* Status Quick Switcher */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <select
                            value={t.status}
                            onChange={(e) => onUpdateTaskStatus(t.id, e.target.value as TaskStatus)}
                            className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="Terencana">Terencana</option>
                            <option value="Berjalan">Berjalan</option>
                            <option value="Selesai">Selesai ✓</option>
                          </select>

                          <button
                            onClick={() => onDeleteTask(t.id)}
                            className="text-rose-600 hover:text-rose-700 text-[10px] font-semibold underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}

                    {columnTasks.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 italic">Kosong</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Inventory */}
      {subTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Inventaris & Logistik Sie Penganugerahan</h3>
            <button
              onClick={() => setIsInvModalOpen(true)}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-2xl text-xs font-extrabold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Perlengkapan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((inv) => (
              <div key={inv.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{inv.itemName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jumlah: <strong className="text-amber-800 font-bold">{inv.quantity} {inv.unit}</strong>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      inv.status === 'Tersedia'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : inv.status === 'Menunggu Pesanan'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                {inv.notes && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    "{inv.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: Rundown */}
      {subTab === 'rundown' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Susunan Acara (Rundown) Malam Penganugerahan</h3>
          <div className="space-y-3">
            {rundown.map((rd, idx) => (
              <div key={rd.id} className="flex items-start space-x-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      {rd.timeSlot}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">PIC: <strong className="text-slate-800">{rd.pic}</strong></span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{rd.activity}</h4>
                  {rd.notes && <p className="text-xs text-slate-500 mt-0.5">{rd.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Task */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-slate-800 max-h-[90vh] flex flex-col my-auto">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">Tambah Tugas Panitia Baru</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Inspeksi Cetak Sertifikat Gold Foil"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
                  <input
                    type="text"
                    placeholder="Birril / Majid / Muzammil..."
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Inventory */}
      {isInvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-slate-800 max-h-[90vh] flex flex-col my-auto">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">Tambah Perlengkapan Sie</h3>
              <button onClick={() => setIsInvModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateInventory} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Perlengkapan / Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Map Beludru Emboss Emas"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Pcs / Set / Unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Ketersediaan</label>
                <select
                  value={invStatus}
                  onChange={(e) => setInvStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Menunggu Pesanan">Menunggu Pesanan</option>
                  <option value="Perlu Tambah">Perlu Tambah</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsInvModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
