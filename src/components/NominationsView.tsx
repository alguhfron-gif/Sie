import React, { useState } from 'react';
import { Award, Plus, Search, Filter, CheckCircle2, Edit2, Trash2, Trophy, Star, UserCheck, ShieldCheck, LayoutGrid, List, Phone, Briefcase, IdCard, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AwardCategory, Nomination, NominationStatus } from '../types';

interface NominationsViewProps {
  nominations: Nomination[];
  categories: AwardCategory[];
  onAddNomination: (nom: Omit<Nomination, 'id' | 'createdAt'>) => void;
  onUpdateNomination: (nom: Nomination) => void;
  onDeleteNomination: (id: string) => void;
  isAddModalOpenOpenDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
}

export const NominationsView: React.FC<NominationsViewProps> = ({
  nominations,
  categories,
  onAddNomination,
  onUpdateNomination,
  onDeleteNomination,
  isAddModalOpenOpenDirectly = false,
  onCloseAddModalDirectly,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenOpenDirectly);
  const [editingNomination, setEditingNomination] = useState<Nomination | null>(null);

  // Form states (Termasuk 6 Kolom Utama Peserta: ID PPS, Nama, Domisili, Kelas, Tingkat, Alamat)
  const [idPps, setIdPps] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [domisili, setDomisili] = useState('');
  const [kelas, setKelas] = useState('');
  const [tingkat, setTingkat] = useState('');
  const [alamat, setAlamat] = useState('');
  const [nipNik, setNipNik] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [achievement, setAchievement] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [justification, setJustification] = useState('');
  const [status, setStatus] = useState<NominationStatus>('Penilaian');
  const [score, setScore] = useState<number>(85);
  const [nominatorName, setNominatorName] = useState('');

  // Handle Modal Open
  const handleOpenAdd = () => {
    setEditingNomination(null);
    setIdPps('');
    setCandidateName('');
    setDomisili('');
    setKelas('');
    setTingkat('');
    setAlamat('');
    setNipNik('');
    setDepartment('Umum');
    setPosition('');
    setPhone('');
    setAchievement('');
    setCategoryId(categories[0]?.id || '');
    setJustification('');
    setStatus('Penilaian');
    setScore(85);
    setNominatorName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (nom: Nomination) => {
    setEditingNomination(nom);
    setIdPps(nom.idPps || nom.nipNik || '');
    setCandidateName(nom.candidateName);
    setDomisili(nom.domisili || '');
    setKelas(nom.kelas || '');
    setTingkat(nom.tingkat || '');
    setAlamat(nom.alamat || '');
    setNipNik(nom.nipNik || '');
    setDepartment(nom.department || 'Umum');
    setPosition(nom.position || '');
    setPhone(nom.phone || '');
    setAchievement(nom.achievement || '');
    setCategoryId(nom.categoryId);
    setJustification(nom.justification);
    setStatus(nom.status);
    setScore(nom.score);
    setNominatorName(nom.nominatorName);
    setIsModalOpen(true);
  };

  const handleDeleteInModal = () => {
    if (editingNomination) {
      if (window.confirm(`Hapus data peserta "${editingNomination.candidateName}"?`)) {
        onDeleteNomination(editingNomination.id);
        closeModal();
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !justification.trim()) return;

    if (editingNomination) {
      onUpdateNomination({
        ...editingNomination,
        idPps,
        candidateName,
        domisili,
        kelas,
        tingkat,
        alamat,
        nipNik: nipNik || idPps,
        department,
        position,
        phone,
        achievement,
        categoryId,
        justification,
        status,
        score,
        nominatorName,
      });
      if (status === 'Pemenang') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      onAddNomination({
        idPps: idPps || `PPS-2026-00${nominations.length + 1}`,
        candidateName,
        domisili,
        kelas,
        tingkat,
        alamat,
        nipNik: nipNik || idPps,
        department,
        position,
        phone,
        achievement,
        categoryId,
        justification,
        status,
        score,
        nominatorName: nominatorName || 'Panitia Sie Penganugerahan',
      });
      if (status === 'Pemenang') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }

    closeModal();
  };

  const handleSetWinner = (nom: Nomination) => {
    onUpdateNomination({ ...nom, status: 'Pemenang' });
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
  };

  // Filter nominations
  const filteredNominations = nominations.filter((nom) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (nom.idPps && nom.idPps.toLowerCase().includes(term)) ||
      nom.candidateName.toLowerCase().includes(term) ||
      (nom.domisili && nom.domisili.toLowerCase().includes(term)) ||
      (nom.kelas && nom.kelas.toLowerCase().includes(term)) ||
      (nom.tingkat && nom.tingkat.toLowerCase().includes(term)) ||
      (nom.alamat && nom.alamat.toLowerCase().includes(term)) ||
      (nom.department && nom.department.toLowerCase().includes(term)) ||
      (nom.nipNik && nom.nipNik.toLowerCase().includes(term)) ||
      (nom.phone && nom.phone.toLowerCase().includes(term)) ||
      (nom.achievement && nom.achievement.toLowerCase().includes(term)) ||
      nom.nominatorName.toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'ALL' || nom.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || nom.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-extrabold text-slate-900">Pengelolaan Nominasi & Peserta Penganugerahan</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen data lengkap peserta, penambahan atribut identitas (NIP/NIK, Jabatan, Kontak, Karya), penilaian, hingga penetapan pemenang.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-2xl shadow-sm transition text-xs sm:text-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Peserta Baru</span>
        </button>
      </div>

      {/* Kategori Overview Badges (Bento Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const count = nominations.filter((n) => n.categoryId === cat.id).length;
          const winners = nominations.filter((n) => n.categoryId === cat.id && n.status === 'Pemenang').length;
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'ALL' : cat.id)}
              className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? 'border-amber-500 bg-amber-50/80 shadow-sm ring-1 ring-amber-500/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200`}>
                  {cat.title}
                </span>
                <span className="text-xs font-semibold text-slate-500">Kuota: {cat.quota}</span>
              </div>
              <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">{cat.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-700 font-medium">{count} Peserta Total</span>
                <span className="text-amber-700 font-bold">{winners} Pemenang</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar + View Toggle */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID PPS, nama, domisili, kelas, tingkat, alamat, atau unit kerja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white text-slate-900 placeholder-slate-400 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Kolom"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel Kolom</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Pemenang">Pemenang Final 🏆</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Penilaian">Dalam Penilaian</option>
              <option value="Draf">Draf</option>
            </select>
          </div>

          {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
                setSearchTerm('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Grid vs Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNominations.map((nom) => {
            const category = categories.find((c) => c.id === nom.categoryId);
            const isWinner = nom.status === 'Pemenang';

            return (
              <div
                key={nom.id}
                className={`bg-white rounded-3xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                  isWinner
                    ? 'border-amber-400 ring-1 ring-amber-400/40 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200`}>
                          {category?.title || 'Kategori'}
                        </span>
                        {(nom.idPps || nom.nipNik) && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            ID: {nom.idPps || nom.nipNik}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base mt-2 flex items-center space-x-1.5">
                        <span>{nom.candidateName}</span>
                        {isWinner && <Trophy className="w-4 h-4 text-amber-500 inline shrink-0" />}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 font-medium mt-1">
                        {nom.domisili && <span className="text-amber-800 font-semibold">📍 {nom.domisili}</span>}
                        {nom.kelas && <span className="text-slate-700 font-medium">• {nom.kelas}</span>}
                        {nom.tingkat && <span className="text-slate-500">• {nom.tingkat}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-xl border ${
                          nom.status === 'Pemenang'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : nom.status === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : nom.status === 'Penilaian'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {nom.status}
                      </span>
                      <div className="text-xs text-slate-500 font-semibold mt-1">
                        Skor: <span className="text-amber-600 font-bold">{nom.score}</span>/100
                      </div>
                    </div>
                  </div>

                  {/* Extra Participant Details (Alamat, Kontak) */}
                  <div className="mt-3 space-y-2">
                    {nom.alamat && (
                      <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 block text-[11px] mb-0.5">Alamat:</span>
                        <p className="line-clamp-2">{nom.alamat}</p>
                      </div>
                    )}

                    {nom.phone && (
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-fit">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span className="font-mono font-bold">{nom.phone}</span>
                      </div>
                    )}

                    {/* Justification Box */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-500 block mb-0.5">Alasan/Justifikasi Pencalonan:</span>
                      "{nom.justification}"
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pengusul: <strong className="text-slate-800">{nom.nominatorName}</strong></span>

                  <div className="flex items-center space-x-2">
                    {!isWinner && (
                      <button
                        onClick={() => handleSetWinner(nom)}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl border border-amber-300 text-[11px] transition cursor-pointer"
                      >
                        🏆 Tetapkan Pemenang
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(nom)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Edit Peserta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteNomination(nom.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredNominations.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-700 font-semibold">Tidak ada data peserta ditemukan.</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau klik tombol Tambah Peserta Baru.</p>
            </div>
          )}
        </div>
      ) : (
        /* TABEL KOLOM PESERTA (Table View Layout) */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">No</th>
                  <th className="px-4 py-3.5">ID PPS</th>
                  <th className="px-4 py-3.5">Nama Peserta</th>
                  <th className="px-4 py-3.5">Domisili</th>
                  <th className="px-4 py-3.5">Kelas & Tingkat</th>
                  <th className="px-4 py-3.5">Alamat</th>
                  <th className="px-4 py-3.5">Kategori Penghargaan</th>
                  <th className="px-4 py-3.5">Skor & Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredNominations.map((nom, idx) => {
                  const category = categories.find((c) => c.id === nom.categoryId);
                  const isWinner = nom.status === 'Pemenang';

                  return (
                    <tr key={nom.id} className="hover:bg-amber-50/30 transition">
                      <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-amber-700 font-bold whitespace-nowrap">
                        {nom.idPps || nom.nipNik || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                          <span>{nom.candidateName}</span>
                          {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 inline" />}
                        </div>
                        {nom.phone && <div className="text-[10px] text-emerald-700 font-mono mt-0.5">📱 {nom.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{nom.domisili || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-slate-900 font-semibold">{nom.kelas || '-'}</div>
                        {nom.tingkat && <div className="text-[10px] text-amber-700 font-medium">{nom.tingkat}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={nom.alamat || ''}>
                        {nom.alamat || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200 whitespace-nowrap">
                          {category?.title || 'Kategori'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-amber-700">{nom.score}/100</div>
                        <span
                          className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border mt-0.5 ${
                            nom.status === 'Pemenang'
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                              : nom.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : nom.status === 'Penilaian'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {nom.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {!isWinner && (
                            <button
                              onClick={() => handleSetWinner(nom)}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 text-[10px] transition cursor-pointer"
                              title="Tetapkan Pemenang"
                            >
                              🏆 Pemenang
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(nom)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Edit Data Peserta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteNomination(nom.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredNominations.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada data peserta dalam tabel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Nomination (Form LENGKAP Data Peserta) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 max-h-[90vh] flex flex-col my-auto">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>{editingNomination ? 'Edit Data Peserta & Nominasi' : 'Tambah Peserta / Nominasi Baru'}</span>
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Seksi 1: Data Utama Peserta (6 Field Wajib & Utama) */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <h4 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center space-x-1">
                  <IdCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>Data Utama Peserta</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. ID PPS */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">1. ID PPS</label>
                    <input
                      type="text"
                      placeholder="Contoh: PPS-2026-001"
                      value={idPps}
                      onChange={(e) => setIdPps(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-amber-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* 2. Nama */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">2. Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Fauzi, S.T."
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 3. Domisili */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">3. Domisili</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jakarta Selatan"
                      value={domisili}
                      onChange={(e) => setDomisili(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* 4. Kelas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">4. Kelas</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kelas 10-A"
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* 5. Tingkat */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">5. Tingkat</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pemula / Utama"
                      value={tingkat}
                      onChange={(e) => setTingkat(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* 6. Alamat */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">6. Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Jl. Melati No. 45, RT 02/05, Kebayoran Baru"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Seksi 2: Atribut Tambahan (Opsional) */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Atribut & Informasi Kontak Tambahan</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Divisi / Unit Kerja</label>
                    <input
                      type="text"
                      placeholder="Contoh: Divisi Teknologi Informasi"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / Telepon</label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-emerald-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 3: Kategori Penghargaan & Nilai */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <h4 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center space-x-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kategori Penghargaan & Penilaian</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Penghargaan *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none font-semibold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Penetapan</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as NominationStatus)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none font-medium"
                    >
                      <option value="Draf">Draf</option>
                      <option value="Penilaian">Dalam Penilaian</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Pemenang">Pemenang Final 🏆</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai / Skor Penjuri (0 - 100): <span className="text-amber-700 font-bold">{score}</span></label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full accent-amber-500 mt-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* Seksi 4: Justifikasi & Pengusul */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Justifikasi & Alasan Pencalonan *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Tuliskan catatan pertimbangan, rekam jejak, atau alasan mengapa peserta ini direkomendasikan..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pengusul / Nominator (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Siti Rahmawati"
                    value={nominatorName}
                    onChange={(e) => setNominatorName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/40 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <div>
                  {editingNomination && (
                    <button
                      type="button"
                      onClick={handleDeleteInModal}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                      title="Hapus Data Peserta Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hapus Peserta</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    {editingNomination ? 'Simpan Perubahan' : 'Tambah Peserta'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

