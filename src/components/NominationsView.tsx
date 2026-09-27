import React, { useState, useEffect } from 'react';
import { Award, Plus, Search, Filter, CheckCircle2, Edit2, Trash2, Trophy, Star, UserCheck, ShieldCheck, LayoutGrid, List, Phone, Briefcase, IdCard, Sparkles, FileSpreadsheet, Download, Loader2, Scale, FileText, Building2, GraduationCap, HeartHandshake, BookOpen, Info, Check, ChevronDown, ChevronUp, Lock, X, CheckSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import ExcelJS from 'exceljs';
import { AwardCategory, Nomination, NominationStatus, UserSession } from '../types';
import { sendWebhookPayload, exportToCSV } from '../services/webhookService';
import { ContentHeader } from './ContentHeader';
import { CollapsibleSection } from './CollapsibleSection';

export interface AssessmentRubric {
  number: number;
  id: string;
  title: string;
  badgeLabel: string;
  quota: number;
  description: string;
  syarat: string[];
  kriteria: { name: string; weight: number }[];
  fokusTema?: string[];
  mekanisme?: string[];
  hadiah?: { rank: string; detail: string }[];
}

export const OFFICIAL_AWARD_RUBRICS: AssessmentRubric[] = [
  {
    number: 1,
    id: 'cat-1',
    title: 'Penghargaan Khidmah (Ranting)',
    badgeLabel: 'MMU / IASS Ranting',
    quota: 3,
    description: 'Penganugerahan dedikasi pengurus ranting MMU/IASS dalam memajukan dakwah, pembinaan thalabah, dan keorganisasian almamater di daerah.',
    syarat: [
      'Pengurus aktif Ranting MMU / IASS Cabang & Ranting minimal 2 tahun masa khidmah.',
      'Tertib administrasi, laporan berkala tepat waktu, dan keaktifan kegiatan dakwah ranting.',
      'Kontribusi nyata dalam pembinaan thalabah daerah dan penguatan jaringan almamater.',
    ],
    kriteria: [
      { name: 'Keaktifan Program Ranting', weight: 35 },
      { name: 'Tertib Administrasi & Laporan', weight: 30 },
      { name: 'Loyalitas & Khidmah Dakwah', weight: 35 },
    ],
    fokusTema: [
      'Konsolidasi dakwah Ahlussunnah wal Jamaah di wilayah ranting daerah.',
      'Kemandirian finansial dan ketertiban pelaporan administrasi ranting berkala.',
      'Penguatan ikatan thalabah daerah dan loyalitas khidmah kepada Masyayikh Sidogiri.',
    ],
    mekanisme: [
      'Pengusulan melalui angket resmi Pengurus Wilayah/Cabang IASS atau formulir ranting.',
      'Batas pengusulan: Sabtu, 29 Jumadats Tsaniyah 1447 H | 20 Desember 2025 M.',
      'Verifikasi data keaktifan dan rekam jejak kepengurusan oleh Sie Penganugerahan.',
      'Penetapan pemenang sah melalui sidang pleno panitia dan SK Pengasuh PPS.',
    ],
    hadiah: [
      { rank: 'JUARA I', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
      { rank: 'JUARA II', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
      { rank: 'JUARA III', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
    ],
  },
  {
    number: 2,
    id: 'cat-2',
    title: 'Penghargaan Khidmah (Guru)',
    badgeLabel: 'Asatidz / Guru MMU',
    quota: 3,
    description: 'Apresiasi pengabdian asatidz/guru madrasah dengan masa khidmah, keteladanan akhlak, kedisiplinan mengajar, dan integritas tinggi.',
    syarat: [
      'Guru/Asatidz aktif MMU / Madrasah Sidogiri minimal 3 tahun berturut-turut.',
      'Memiliki keteladanan akhlak mulia dan kedisiplinan presensi mengajar 100%.',
      'Dedikasi tinggi dalam membina dan mentransfer ilmu kepada thalabah.',
    ],
    kriteria: [
      { name: 'Presensi & Keistiqamahan Mengajar', weight: 40 },
      { name: 'Keteladanan Akhlak & Adab', weight: 30 },
      { name: 'Dedikasi & Kualitas Pengajaran', weight: 30 },
    ],
    fokusTema: [
      'Keistiqamahan mentransfer ilmu dan menjaga mata rantai sanad keilmuan pesantren.',
      'Keteladanan akhlak mulia, kewibawaan pendidik, dan kasih sayang kepada murid.',
      'Disiplin presensi mengajar 100% dan loyalitas penuh terhadap manhaj MMU Sidogiri.',
    ],
    mekanisme: [
      'Rekomendasi tertulis dari Kepala Madrasah MMU / Koordinator Daerah MMU.',
      'Pemeriksaan buku rekap presensi mengajar dan catatan ketertiban madrasah.',
      'Penilaian sidang juri berdasarkan bobot presensi (40%), adab (30%), dan dedikasi (30%).',
      'Penganugerahan trofi dan piagam di panggung utama Malam Puncak Milad.',
    ],
    hadiah: [
      { rank: 'JUARA I', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
      { rank: 'JUARA II', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
      { rank: 'JUARA III', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
    ],
  },
  {
    number: 3,
    id: 'cat-3',
    title: 'Penghargaan Khidmah (Alumni)',
    badgeLabel: 'Alumni IASS',
    quota: 3,
    description: 'Penghargaan bagi alumni IASS yang istiqamah berkhidmah kepada almamater, umat, dan pesantren di berbagai pelosok nusantara.',
    syarat: [
      'Terdaftar sah sebagai anggota Ikatan Alumni Santri Sidogiri (IASS).',
      'Berperan aktif dalam program dakwah, sosial, dan memuliakan almamater.',
      'Memiliki integritas pribadi terpuji dan tidak mencemarkan nama baik pesantren.',
    ],
    kriteria: [
      { name: 'Kontribusi Sosial & Dakwah', weight: 40 },
      { name: 'Loyalitas kepada Masyayikh & Pondok', weight: 30 },
      { name: 'Integritas & Rekam Jejak Almamater', weight: 30 },
    ],
    fokusTema: [
      'Menjaga nama baik dan marwah Pondok Pesantren Sidogiri di tengah masyarakat.',
      'Kontribusi dakwah sosial, pemberdayaan ekonomi keumatan, dan kepedulian almamater.',
      'Ketaatan dan loyalitas tanpa batas terhadap arahan dan dawuh Masyayikh.',
    ],
    mekanisme: [
      'Pengusulan melalui rekomendasi Pengurus Wilayah/Cabang IASS setempat.',
      'Validasi data keanggotaan sah Ikatan Alumni Santri Sidogiri (IASS).',
      'Verifikasi lapangan rekam jejak kiprah dakwah dan integritas pribadi.',
      'Sidang pleno penetapan penganugerahan bersama Pengurus Harian PPS.',
    ],
    hadiah: [
      { rank: 'JUARA I', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
      { rank: 'JUARA II', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
      { rank: 'JUARA III', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
    ],
  },
  {
    number: 4,
    id: 'cat-4',
    title: 'Penghargaan Khidmah (Pengurus)',
    badgeLabel: 'Pengurus PPS & Panitia',
    quota: 3,
    description: 'Apresiasi etos kerja kepengurusan pesantren dan kepanitiaan dengan loyalitas, kedisiplinan harian, dan amanah tertinggi.',
    syarat: [
      'Pengurus aktif struktur kepengurusan PPS atau Panitia Milad Sidogiri.',
      'Menunjukkan etos kerja tinggi, disiplin dalam bertugas harian, dan amanah.',
      'Kepatuhan dan sinergi penuh terhadap arahan pimpinan / Pengurus Harian.',
    ],
    kriteria: [
      { name: 'Realisasi Program & Tanggung Jawab', weight: 40 },
      { name: 'Kedisiplinan & Presensi Tugas', weight: 30 },
      { name: 'Keteladanan & Loyalitas Khidmah', weight: 30 },
    ],
    fokusTema: [
      'Realisasi target program kerja bagian dengan hasil optimal dan tepat waktu.',
      'Kedisiplinan tugas harian, presensi piket, dan amanah memegang inventaris.',
      'Keteladanan sikap, kepatuhan struktural, dan sinergi bersama Pengurus Harian.',
    ],
    mekanisme: [
      'Penilaian komprehensif berdasarkan rapor kinerja bulanan kepengurusan PPS.',
      'Rekomendasi dari Ketua Bagian / Instansi terkait dan presensi harian.',
      'Skor kelulusan penjurian minimal 85 poin dari total pembobotan.',
      'Penetapan melalui Surat Keputusan (SK) resmi Pengasuh PPS.',
    ],
    hadiah: [
      { rank: 'JUARA I', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
      { rank: 'JUARA II', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
      { rank: 'JUARA III', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
    ],
  },
  {
    number: 5,
    id: 'cat-5',
    title: 'Penghargaan Santri Terbaik',
    badgeLabel: 'Santri Mukim',
    quota: 3,
    description: 'Penganugerahan bagi santri mukim berakhlakul karimah, istiqamah shalat jamaah di saf awal, wiridan bersama, dan berdisiplin tinggi.',
    syarat: [
      'Santri aktif mukim Pondok Pesantren Sidogiri.',
      'Bebas dari catatan pelanggaran tata tertib pesantren (bebas ta\'zir).',
      'Istiqamah shalat berjamaah 5 waktu saf awal, wiridan, dan taklim asrama.',
    ],
    kriteria: [
      { name: 'Akhlakul Karimah & Keteladanan', weight: 40 },
      { name: 'Kedisiplinan Shalat Jamaah & Wirid', weight: 35 },
      { name: 'Ketertiban Asrama & Kegiatan Pondok', weight: 25 },
    ],
    fokusTema: [
      'Keistiqamahan shalat berjamaah 5 waktu di saf awal masjid dan wirid bersama.',
      'Kebersihan catatan ketertiban asrama, bebas dari ta\'zir atau pelanggaran.',
      'Keluhuran adab sopan santun terhadap Masyayikh, asatidz, dan sesama thalabah.',
    ],
    mekanisme: [
      'Penyaringan data ketertiban santri melalui Buku Pelanggaran & Ta\'zir.',
      'Validasi keistiqamahan jamaah melalui kartu kontrol presensi shalat 5 waktu.',
      'Penilaian adab dan keterlibatan taklim asrama oleh Pembina Asrama.',
      'Penganugerahan langsung oleh Pengasuh pada Malam Puncak Milad.',
    ],
    hadiah: [
      { rank: 'JUARA I', detail: 'Trofi Kehormatan + Piagam Santri Teladan + Paket Kitab Kuning' },
      { rank: 'JUARA II', detail: 'Trofi Kehormatan + Piagam Santri Teladan + Paket Kitab Kuning' },
      { rank: 'JUARA III', detail: 'Trofi Kehormatan + Piagam Santri Teladan + Paket Kitab Kuning' },
    ],
  },
  {
    number: 6,
    id: 'cat-6',
    title: 'Penghargaan Murid terbaik',
    badgeLabel: 'Murid Madrasah MMU',
    quota: 3,
    description: 'Penghargaan prestasi akademik madrasah MMU dengan perolehan nilai ikhtibar tertinggi, catatan maknani terlengkap, dan ketekunan belajar.',
    syarat: [
      'Murid aktif Madrasah Miftahul Ulum (MMU) Sidogiri.',
      'Peringkat kelas unggul dan perolehan nilai ujian (ikhtibar) terbaik.',
      'Kehadiran kelas lengkap, rajin mencatat, dan aktif dalam musyawarah/fathul qorib.',
    ],
    kriteria: [
      { name: 'Prestasi Akademik & Nilai Ujian', weight: 45 },
      { name: 'Presensi & Kelengkapan Catatan Kitab', weight: 30 },
      { name: 'Keaktifan Musyawarah & Adab Belajar', weight: 25 },
    ],
    fokusTema: [
      'Perolehan nilai ujian (ikhtibar) caturwulan dan semester tertinggi di MMU.',
      'Kelengkapan, kerapian catatan kitab kuning (makna gandul), dan presensi mutlak.',
      'Keaktifan dalam musyawarah ilmiyah fathul qorib dan kedisiplinan belajar.',
    ],
    mekanisme: [
      'Rekapitulasi resmi nilai ujian madrasah oleh Bagian Pengajaran MMU.',
      'Pemeriksaan kelengkapan catatan kitab oleh dewan asatidz musyawarah.',
      'Pembobotan nilai: Ujian (45%), Presensi/Kitab (30%), Musyawarah (25%).',
      'Penganugerahan piagam murid teladan di panggung Malam Puncak Milad.',
    ],
    hadiah: [
      { rank: 'JUARA I', detail: 'Trofi Kehormatan + Piagam Murid Teladan MMU + Beasiswa Pendidikan' },
      { rank: 'JUARA II', detail: 'Trofi Kehormatan + Piagam Murid Teladan MMU + Beasiswa Pendidikan' },
      { rank: 'JUARA III', detail: 'Trofi Kehormatan + Piagam Murid Teladan MMU + Beasiswa Pendidikan' },
    ],
  },
];

interface NominationsViewProps {
  nominations: Nomination[];
  categories: AwardCategory[];
  onUpdateCategory?: (category: AwardCategory) => void;
  onAddNomination: (nom: Omit<Nomination, 'id' | 'createdAt'>) => void;
  onUpdateNomination: (nom: Nomination) => void;
  onDeleteNomination: (id: string) => void;
  isAddModalOpenOpenDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
  currentUser?: UserSession | null;
}

export const NominationsView: React.FC<NominationsViewProps> = ({
  nominations,
  categories,
  onUpdateCategory,
  onAddNomination,
  onUpdateNomination,
  onDeleteNomination,
  isAddModalOpenOpenDirectly = false,
  onCloseAddModalDirectly,
  currentUser,
}) => {
  const isPetugas = currentUser?.category === 'petugas' || (currentUser?.role ? currentUser.role.toUpperCase().includes('PETUGAS') : false);
  const isAdmin = !isPetugas;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(isAdmin ? isAddModalOpenOpenDirectly : false);
  const [editingNomination, setEditingNomination] = useState<Nomination | null>(null);

  // Active rubric tab ID for full view (defaults to 1st category: Penghargaan Khidmah Ranting)
  const [activeRubricId, setActiveRubricId] = useState<string>('cat-1');

  // Accordion state for 6 award category columns (expand on click to reveal syarat & ketentuan)
  const [expandedRubricIds, setExpandedRubricIds] = useState<Record<string, boolean>>({});

  const toggleRubricExpand = (id: string) => {
    setExpandedRubricIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // State for Editing Category Syarat & Ketentuan (Admin only)
  const [editingRubric, setEditingRubric] = useState<AssessmentRubric | null>(null);
  const [editRubricTitle, setEditRubricTitle] = useState('');
  const [editRubricBadge, setEditRubricBadge] = useState('');
  const [editRubricQuota, setEditRubricQuota] = useState(3);
  const [editRubricDesc, setEditRubricDesc] = useState('');
  const [editRubricSyarat, setEditRubricSyarat] = useState<string[]>([]);
  const [editRubricKriteria, setEditRubricKriteria] = useState<{ name: string; weight: number }[]>([]);

  // Open modal to edit rubric (Admin only)
  const handleOpenEditRubric = (rubric: AssessmentRubric, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingRubric(rubric);
    setEditRubricTitle(rubric.title);
    setEditRubricBadge(rubric.badgeLabel);
    setEditRubricQuota(rubric.quota);
    setEditRubricDesc(rubric.description);
    setEditRubricSyarat([...rubric.syarat]);
    setEditRubricKriteria(rubric.kriteria.map((k) => ({ ...k })));
  };

  // Save edited rubric
  const handleSaveRubric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRubric) return;

    // Update in local OFFICIAL_AWARD_RUBRICS in-memory
    const idx = OFFICIAL_AWARD_RUBRICS.findIndex((r) => r.id === editingRubric.id);
    if (idx !== -1) {
      OFFICIAL_AWARD_RUBRICS[idx] = {
        ...OFFICIAL_AWARD_RUBRICS[idx],
        title: editRubricTitle,
        badgeLabel: editRubricBadge,
        quota: editRubricQuota,
        description: editRubricDesc,
        syarat: editRubricSyarat.filter((s) => s.trim().length > 0),
        kriteria: editRubricKriteria.filter((k) => k.name.trim().length > 0),
      };
    }

    // Also sync to AwardCategory in parent state if onUpdateCategory exists
    const matchedCat = categories.find(
      (c) =>
        c.id === editingRubric.id ||
        c.title.toLowerCase().replace(/\s+/g, '') === editingRubric.title.toLowerCase().replace(/\s+/g, '')
    );
    if (matchedCat && onUpdateCategory) {
      onUpdateCategory({
        ...matchedCat,
        title: editRubricTitle,
        description: editRubricDesc,
        quota: editRubricQuota,
        requirements: editRubricSyarat.filter((s) => s.trim().length > 0),
        criteria: editRubricKriteria.filter((k) => k.name.trim().length > 0),
      });
    }

    // Keep active rubric tab on the saved rubric so changes are immediately visible
    setActiveRubricId(editingRubric.id);
    setExpandedRubricIds((prev) => ({ ...prev, [editingRubric.id]: true }));
    setEditingRubric(null);
  };

  // Form states: 1. Identitas Pengusul (Otomatis terisi sesuai nama dan login akun aktif)
  const initialPengusulName = currentUser?.name || currentUser?.email || 'Panitia Sie Penganugerahan';
  const initialPengusulRole = currentUser?.role || (isAdmin ? 'Panitia Inti Penganugerahan' : 'Petugas Lapangan');
  const [pengusulNama, setPengusulNama] = useState(initialPengusulName);
  const [pengusulJabatan, setPengusulJabatan] = useState(initialPengusulRole);
  const [pengusulDomisili, setPengusulDomisili] = useState<'PPS' | 'LPPS'>('PPS');
  const [pengusulAlamat, setPengusulAlamat] = useState('Pondok Pesantren Sidogiri, Kraton, Pasuruan');

  // Auto-sync identitas pengusul saat sesi login berubah atau tersedia
  useEffect(() => {
    if (!editingNomination && currentUser) {
      const activeName = currentUser.name || currentUser.email || '';
      const activeRole = currentUser.role || '';
      if (activeName) setPengusulNama(activeName);
      if (activeRole) setPengusulJabatan(activeRole);
    }
  }, [currentUser, editingNomination]);

  // 2. Identitas Peserta / Ranting yang Diusulkan
  const [idPps, setIdPps] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateDomisiliType, setCandidateDomisiliType] = useState<'PPS' | 'LPPS'>('PPS');
  const [domisili, setDomisili] = useState('');
  const [kelas, setKelas] = useState('');
  const [tingkat, setTingkat] = useState('');
  const [alamat, setAlamat] = useState('');
  const [nipNik, setNipNik] = useState('');

  // 3. Kategori Penganugerahan & Kontak
  const [department, setDepartment] = useState(''); // Jabatan Peserta pada 2 Tahun Terakhir
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [achievement, setAchievement] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-1');
  const [justification, setJustification] = useState('');
  const [status, setStatus] = useState<NominationStatus>('Penilaian');
  const [score, setScore] = useState<number>(85);
  const [nominatorName, setNominatorName] = useState(initialPengusulName);
  const [isExporting, setIsExporting] = useState(false);

  // 4. Kriteria Rubrik Dinamis (Checklist Centang & Isian Bebas)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [alasanLain, setAlasanLain] = useState('');
  const [integritasNote, setIntegritasNote] = useState('');
  const [transparansiLaporanNote, setTransparansiLaporanNote] = useState('');
  const [lainLainNote, setLainLainNote] = useState('');

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle Modal Open (Otomatis mengisi identitas pengusul dari akun login)
  const handleOpenAdd = () => {
    setEditingNomination(null);
    const resolvedName = currentUser?.name || currentUser?.email || 'Panitia Sie Penganugerahan';
    const resolvedRole = currentUser?.role || (isAdmin ? 'Panitia Inti Penganugerahan' : 'Petugas Lapangan');

    setPengusulNama(resolvedName);
    setPengusulJabatan(resolvedRole);
    setPengusulDomisili('PPS');
    setPengusulAlamat('Pondok Pesantren Sidogiri, Kraton, Pasuruan');

    setIdPps('');
    setCandidateName('');
    setCandidateDomisiliType('PPS');
    setDomisili('');
    setKelas('');
    setTingkat('');
    setAlamat('');
    setNipNik('');

    setDepartment('');
    setPosition('');
    setPhone('');
    setAchievement('');
    setCategoryId(activeRubricId || categories[0]?.id || 'cat-1');
    setJustification('');
    setStatus('Penilaian');
    setScore(85);
    setNominatorName(resolvedName);

    setChecklist({});
    setAlasanLain('');
    setIntegritasNote('');
    setTransparansiLaporanNote('');
    setLainLainNote('');

    setIsModalOpen(true);
  };

  // Sync saat trigger buka modal langsung dari halaman luar
  useEffect(() => {
    if (isAddModalOpenOpenDirectly) {
      handleOpenAdd();
    }
  }, [isAddModalOpenOpenDirectly]);

  const handleOpenEdit = (nom: Nomination) => {
    setEditingNomination(nom);
    setPengusulNama(nom.pengusulNama || nom.nominatorName || currentUser?.name || '');
    setPengusulJabatan(nom.pengusulJabatan || currentUser?.role || '');
    setPengusulDomisili((nom.pengusulDomisili as 'PPS' | 'LPPS') || 'PPS');
    setPengusulAlamat(nom.pengusulAlamat || 'Pondok Pesantren Sidogiri, Kraton, Pasuruan');

    setIdPps(nom.idPps || nom.nipNik || '');
    setCandidateName(nom.candidateName);
    setCandidateDomisiliType((nom.candidateDomisiliType as 'PPS' | 'LPPS') || 'PPS');
    setDomisili(nom.domisili || '');
    setKelas(nom.kelas || '');
    setTingkat(nom.tingkat || '');
    setAlamat(nom.alamat || '');
    setNipNik(nom.nipNik || '');

    setDepartment(nom.department || '');
    setPosition(nom.position || '');
    setPhone(nom.phone || '');
    setAchievement(nom.achievement || '');
    setCategoryId(nom.categoryId);
    setJustification(nom.justification || '');
    setStatus(nom.status);
    setScore(nom.score);
    setNominatorName(nom.nominatorName || nom.pengusulNama || '');

    setChecklist(nom.evaluationChecklist || {});
    setAlasanLain(nom.alasanLain || '');
    setIntegritasNote(nom.integritasNote || '');
    setTransparansiLaporanNote(nom.transparansiLaporanNote || '');
    setLainLainNote(nom.lainLainNote || '');

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
    if (!candidateName.trim()) return;

    const nomPayload = {
      idPps: idPps || `PPS-2026-00${nominations.length + 1}`,
      candidateName,
      candidateDomisiliType,
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
      justification: justification.trim() || alasanLain.trim() || lainLainNote.trim() || 'Diusulkan secara resmi untuk Penganugerahan Milad Sidogiri.',
      status,
      score,
      nominatorName: pengusulNama || nominatorName || 'Panitia Sie Penganugerahan',

      pengusulNama,
      pengusulJabatan,
      pengusulDomisili,
      pengusulAlamat,

      evaluationChecklist: checklist,
      alasanLain,
      integritasNote,
      transparansiLaporanNote,
      lainLainNote,
    };

    if (editingNomination) {
      onUpdateNomination({
        ...editingNomination,
        ...nomPayload,
      });
      if (status === 'Pemenang') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      onAddNomination(nomPayload);
      if (status === 'Pemenang') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }

    sendWebhookPayload('nomination_update', nomPayload);

    closeModal();
  };

  const handleSetWinner = (nom: Nomination) => {
    const updated = { ...nom, status: 'Pemenang' as NominationStatus };
    onUpdateNomination(updated);
    sendWebhookPayload('nomination_update', updated);
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

    const matchesCategory =
      selectedCategory === 'ALL' ||
      nom.categoryId === selectedCategory ||
      (selectedCategory === 'cat-1' && (nom.categoryId === 'cat-1' || categories.find((c) => c.id === nom.categoryId)?.title.toLowerCase().includes('ranting'))) ||
      (selectedCategory === 'cat-2' && (nom.categoryId === 'cat-2' || categories.find((c) => c.id === nom.categoryId)?.title.toLowerCase().includes('guru'))) ||
      (selectedCategory === 'cat-3' && (nom.categoryId === 'cat-3' || categories.find((c) => c.id === nom.categoryId)?.title.toLowerCase().includes('alumni'))) ||
      (selectedCategory === 'cat-4' && (nom.categoryId === 'cat-4' || categories.find((c) => c.id === nom.categoryId)?.title.toLowerCase().includes('pengurus'))) ||
      (selectedCategory === 'cat-5' && (nom.categoryId === 'cat-5' || categories.find((c) => c.id === nom.categoryId)?.title.toLowerCase().includes('santri'))) ||
      (selectedCategory === 'cat-6' && (nom.categoryId === 'cat-6' || categories.find((c) => c.id === nom.categoryId)?.title.toLowerCase().includes('murid')));
    const matchesStatus = selectedStatus === 'ALL' || nom.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle Export Data to Excel (.xlsx)
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sie Penganugerahan App';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Daftar Peserta');

      // Define Columns
      worksheet.columns = [
        { header: 'NO', key: 'no', width: 6 },
        { header: 'ID PPS', key: 'idPps', width: 14 },
        { header: 'NAMA PESERTA', key: 'candidateName', width: 28 },
        { header: 'NIP / NIK', key: 'nipNik', width: 18 },
        { header: 'KATEGORI PENGANUGERAHAN', key: 'categoryTitle', width: 30 },
        { header: 'STATUS', key: 'status', width: 14 },
        { header: 'SKOR / NILAI', key: 'score', width: 14 },
        { header: 'JABATAN / POSISI', key: 'position', width: 22 },
        { header: 'INSTANSI / DEPARTEMEN', key: 'department', width: 24 },
        { header: 'DOMISILI', key: 'domisili', width: 18 },
        { header: 'KELAS', key: 'kelas', width: 12 },
        { header: 'TINGKAT', key: 'tingkat', width: 12 },
        { header: 'NO. HANDPHONE / WA', key: 'phone', width: 18 },
        { header: 'ALAMAT LENGKAP', key: 'alamat', width: 32 },
        { header: 'KARYA / PRESTASI UTAMA', key: 'achievement', width: 32 },
        { header: 'ALASAN / JUSTIFIKASI', key: 'justification', width: 32 },
        { header: 'PENGUSUL / PANITIA', key: 'nominatorName', width: 22 },
        { header: 'TANGGAL INPUT', key: 'createdAt', width: 16 },
      ];

      // Styling Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }, // Dark navy slate
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Determine items to export (use filtered list if filters active, otherwise full list)
      const dataToExport = filteredNominations.length > 0 ? filteredNominations : nominations;

      dataToExport.forEach((nom, index) => {
        const categoryObj = categories.find((c) => c.id === nom.categoryId);
        const catTitle = categoryObj ? categoryObj.title : nom.categoryId;

        const row = worksheet.addRow({
          no: index + 1,
          idPps: nom.idPps || '-',
          candidateName: nom.candidateName || '-',
          nipNik: nom.nipNik || '-',
          categoryTitle: catTitle,
          status: nom.status || '-',
          score: nom.score || 0,
          position: nom.position || '-',
          department: nom.department || '-',
          domisili: nom.domisili || '-',
          kelas: nom.kelas || '-',
          tingkat: nom.tingkat || '-',
          phone: nom.phone || '-',
          alamat: nom.alamat || '-',
          achievement: nom.achievement || '-',
          justification: nom.justification || '-',
          nominatorName: nom.nominatorName || '-',
          createdAt: nom.createdAt || '-',
        });

        row.height = 22;
        row.alignment = { vertical: 'middle', horizontal: 'left' };

        // Alignments for specific columns
        row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('idPps').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('score').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('createdAt').alignment = { vertical: 'middle', horizontal: 'center' };

        // Alternating row background
        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });

      // Write Buffer and trigger browser download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `Data_Peserta_Penganugerahan_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Trigger CSV export backup & Webhook sync
      const csvHeaders = ['NO', 'ID PPS', 'NAMA PESERTA', 'NIP/NIK', 'KATEGORI', 'STATUS', 'SKOR', 'JABATAN', 'DEPARTEMEN', 'NO HP', 'PRESTASI', 'PENGUSUL'];
      const csvRows = dataToExport.map((nom, idx) => [
        idx + 1,
        nom.idPps || '-',
        nom.candidateName,
        nom.nipNik || '-',
        categories.find((c) => c.id === nom.categoryId)?.title || nom.categoryId,
        nom.status,
        nom.score,
        nom.position || '-',
        nom.department || '-',
        nom.phone || '-',
        nom.achievement || '-',
        nom.nominatorName,
      ]);
      exportToCSV(`Data_Peserta_Nominasi_${dateStr}.csv`, csvHeaders, csvRows);

      await sendWebhookPayload('bulk_export', {
        module: 'Nominasi',
        totalItems: dataToExport.length,
        nominations: dataToExport,
      });
    } catch (error) {
      console.error('Export Excel Error:', error);
      alert('Gagal mengekspor data ke Excel. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumb & Title */}
      <ContentHeader
        title={isAdmin ? "Nominasi & Peserta Penganugerahan" : "Ketentuan & Syarat Penilaian Nominasi"}
        subtitle={isAdmin ? "Sistem Pendaftaran, Penilaian, dan Penetapan Pemenang" : "Standar Kualifikasi dan Syarat Resmi 6 Kategori Penghargaan"}
        activeTab="nominasi"
      />

      {/* Top Header Box in Milad Sidogiri Clean Style (Khusus Admin) */}
      {isAdmin && (
        <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Trophy className="w-5 h-5 text-[#8a7c4c]" />
              <h1 className="text-base font-extrabold text-[#24211c]">
                Daftar Peserta & Nominasi Penganugerahan
              </h1>
              <span className="flex items-center space-x-1 text-[10px] font-bold bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8a7c4c] animate-pulse"></span>
                <span>Firestore Realtime</span>
              </span>
            </div>
            <p className="text-xs text-[#7c7b77] mt-1">
              Manajemen data lengkap peserta, penambahan atribut identitas (NIP/NIK, Jabatan, Kontak, Karya), penilaian, hingga penetapan pemenang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center justify-center space-x-1.5 bg-white hover:bg-[#f7f6f2] text-[#24211c] border border-[rgba(36,33,28,0.15)] font-bold px-3.5 py-2 rounded-xl shadow-2xs transition text-xs cursor-pointer disabled:opacity-50"
              title="Ekspor seluruh data peserta ke file Excel (.xlsx)"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#8a7c4c]" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-[#8a7c4c]" />
              )}
              <span>{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center justify-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Peserta Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* Ketentuan dan Syarat Penilaian Nominasi (6 Kategori Resmi Penganugerahan) */}
      <CollapsibleSection
        sectionId="nomination_assessment_guidelines"
        title="Ketentuan dan Syarat Penilaian Nominasi"
        subtitle="Standar kualifikasi, syarat kelayakan, serta kriteria dan bobot penilaian resmi untuk 6 kategori penganugerahan"
        icon={<Scale className="w-4 h-4 text-[#8a7c4c]" />}
        badge={
          <span className="text-[10px] font-extrabold bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
            6 Kategori Penghargaan
          </span>
        }
      >
        {/* Active Rubric Resolution & Full-Screen Category Display ala Screenshot */}
        {(() => {
          const activeRubric = OFFICIAL_AWARD_RUBRICS.find((r) => r.id === activeRubricId) || OFFICIAL_AWARD_RUBRICS[0];
          const matchedCat = categories.find(
            (c) =>
              c.id === activeRubric.id ||
              c.title.toLowerCase().replace(/\s+/g, '') === activeRubric.title.toLowerCase().replace(/\s+/g, '') ||
              (activeRubric.id === 'cat-1' && c.title.toLowerCase().includes('ranting')) ||
              (activeRubric.id === 'cat-2' && c.title.toLowerCase().includes('guru')) ||
              (activeRubric.id === 'cat-3' && c.title.toLowerCase().includes('alumni')) ||
              (activeRubric.id === 'cat-4' && c.title.toLowerCase().includes('pengurus')) ||
              (activeRubric.id === 'cat-5' && c.title.toLowerCase().includes('santri')) ||
              (activeRubric.id === 'cat-6' && c.title.toLowerCase().includes('murid'))
          );

          const activeCatId = matchedCat ? matchedCat.id : activeRubric.id;
          const matchingNoms = nominations.filter(
            (n) =>
              n.categoryId === activeRubric.id ||
              (matchedCat && n.categoryId === matchedCat.id) ||
              (activeRubric.id === 'cat-1' && n.categoryId.toLowerCase().includes('ranting')) ||
              (activeRubric.id === 'cat-2' && n.categoryId.toLowerCase().includes('guru')) ||
              (activeRubric.id === 'cat-3' && n.categoryId.toLowerCase().includes('alumni')) ||
              (activeRubric.id === 'cat-4' && n.categoryId.toLowerCase().includes('pengurus')) ||
              (activeRubric.id === 'cat-5' && n.categoryId.toLowerCase().includes('santri')) ||
              (activeRubric.id === 'cat-6' && n.categoryId.toLowerCase().includes('murid'))
          );
          const count = matchingNoms.length;

          const displayTitle = matchedCat?.title || activeRubric.title;
          const displayDesc = matchedCat?.description || activeRubric.description;
          const displayQuota = matchedCat?.quota || activeRubric.quota;
          const displayBadge = activeRubric.badgeLabel;
          const displaySyarat = (matchedCat?.requirements && matchedCat.requirements.length > 0)
            ? matchedCat.requirements
            : activeRubric.syarat;
          const displayKriteria = (matchedCat?.criteria && matchedCat.criteria.length > 0)
            ? matchedCat.criteria
            : activeRubric.kriteria;
          const displayIndikator = activeRubric.fokusTema || [
            'Rekam jejak akhlak terpuji dan kepatuhan pada tata tertib Sidogiri.',
            'Kontribusi nyata dan loyalitas tanpa pamrih dalam khidmah dakwah.',
            'Integritas pribadi dan konsistensi dalam mengemban amanah.',
          ];
          const displayMekanisme = activeRubric.mekanisme || [
            'Pengisian dan penyerahan angket usulan resmi kepada Sie Penganugerahan.',
            'Batas akhir penyetoran berkas: Sabtu, 29 Jumadats Tsaniyah 1447 H | 20 Desember 2025 M.',
            'Verifikasi berkas, validasi rekam jejak, dan sidang pleno penjurian.',
            'Penetapan resmi melalui Surat Keputusan (SK) Pengasuh Pondok Pesantren Sidogiri.',
          ];
          const displayHadiah = activeRubric.hadiah || [
            { rank: 'JUARA I', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
            { rank: 'JUARA II', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
            { rank: 'JUARA III', detail: 'Trofi Kehormatan + Piagam Pengasuh PPS + Tali Asih Khidmah' },
          ];

          return (
            <div className="space-y-4">
              {/* Header Sesuai Tangkapan Layar: Judul Besar Kiri & Deskripsi Pengantar Kanan */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#8a7c4c] tracking-tight uppercase">
                    CABANG PENGANUGERAHAN
                  </h2>
                </div>
                <p className="text-xs text-[#7c7b77] sm:text-right max-w-md leading-relaxed">
                  Pilih cabang untuk membaca persyaratan, teknis pelaksanaan, kriteria penilaian, dan ketentuannya.
                </p>
              </div>

              {/* Baris Tombol Tab Kategori Horizontal (01, 02, 03, ...) Sesuai Tangkapan Layar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {OFFICIAL_AWARD_RUBRICS.map((rubric) => {
                  const isActive = rubric.id === activeRubricId;
                  const matched = categories.find(
                    (c) =>
                      c.id === rubric.id ||
                      c.title.toLowerCase().replace(/\s+/g, '') === rubric.title.toLowerCase().replace(/\s+/g, '')
                  );
                  const title = matched?.title || rubric.title;

                  return (
                    <button
                      key={rubric.id}
                      type="button"
                      onClick={() => setActiveRubricId(rubric.id)}
                      className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer select-none font-bold ${
                        isActive
                          ? 'bg-[#8a7c4c] text-white shadow-xs ring-1 ring-[#675c37]'
                          : 'bg-[#efede7] hover:bg-[#e4e0d4] text-[#24211c] border border-[rgba(36,33,28,0.12)]'
                      }`}
                    >
                      <span className={`font-mono text-xs font-black ${isActive ? 'text-[#f2eee3]' : 'text-[#7c7b77]'}`}>
                        {String(rubric.number).padStart(2, '0')}
                      </span>
                      <span>{title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Layar Penuh Menampilkan Isi Syarat & Ketentuan Sesuai Desain Tangkapan Layar */}
              <div className="bg-[#f5f2eb] border border-[#dcd7cb] rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
                {/* Aksen kisi-kisi latar halus ala tangkapan layar di pojok kanan atas */}
                <div
                  aria-hidden="true"
                  className="absolute right-0 top-0 w-64 h-64 opacity-25 pointer-events-none [background:radial-gradient(#8a7c4c_1px,transparent_1px)] [background-size:16px_16px]"
                />

                <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Kolom Kiri (Judul, Sasaran, Deskripsi, Batas Waktu/Kuota, Juara I/II/III, Aksi Admin) */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a7c4c] block mb-1">
                        SASARAN: {displayBadge}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#24211c] leading-tight tracking-tight">
                        {displayTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5c5b57] leading-relaxed mt-2.5">
                        {displayDesc}
                      </p>

                      {/* Kotak Batas Waktu / Kuota ala Tangkapan Layar */}
                      <div className="mt-3.5 inline-block border border-[#c3b68b] bg-[#ede9df] px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#675c37]">
                        Batas Pengusulan: 29 Jumadats Tsaniyah 1447 H • Kuota: {displayQuota} Orang
                      </div>
                    </div>

                    {/* Garis Pembatas */}
                    <div className="pt-2 border-t border-[rgba(36,33,28,0.15)]">
                      {/* Breakdown Penganugerahan / Juara I, II, III */}
                      <div className="space-y-2.5 text-xs">
                        {displayHadiah.map((h, i) => (
                          <div key={i} className="flex items-baseline justify-between gap-3 pb-2 border-b border-[rgba(36,33,28,0.08)] last:border-0 last:pb-0">
                            <span className="font-extrabold text-[#24211c] uppercase tracking-wide shrink-0">
                              {h.rank}
                            </span>
                            <span className="text-[#5c5b57] text-right font-medium">
                              {h.detail}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Tombol Aksi Admin vs Petugas */}
                      <div className="pt-4 flex flex-wrap items-center gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) =>
                                handleOpenEditRubric(
                                  {
                                    ...activeRubric,
                                    title: displayTitle,
                                    description: displayDesc,
                                    quota: displayQuota,
                                    syarat: displaySyarat,
                                    kriteria: displayKriteria,
                                  },
                                  e
                                )
                              }
                              className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                              title="Edit Ketentuan & Bobot Penilaian"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Ketentuan & Bobot</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedCategory(selectedCategory === activeCatId ? 'ALL' : activeCatId)}
                              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs border ${
                                selectedCategory === activeCatId
                                  ? 'bg-[#24211c] text-white border-[#24211c]'
                                  : 'bg-white hover:bg-[#f7f6f2] text-[#24211c] border-[rgba(36,33,28,0.15)]'
                              }`}
                              title="Filter daftar peserta di tabel bawah"
                            >
                              {selectedCategory === activeCatId ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Filter Aktif ({count})</span>
                                </>
                              ) : (
                                <>
                                  <Filter className="w-3.5 h-3.5 text-[#8a7c4c]" />
                                  <span>Filter Peserta ({count})</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleOpenAdd}
                              className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                              title="Isi Formulir Usulan Calon Penerima Anugerah"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Isi Formulir Usulan Peserta</span>
                            </button>
                            <div className="flex items-center space-x-2 text-xs text-[#7c7b77] bg-white/80 border border-[rgba(36,33,28,0.1)] px-3 py-1.5 rounded-xl font-medium">
                              <Lock className="w-3.5 h-3.5 text-[#8a7c4c]" />
                              <span>Petugas: Mode Usulan & Centang Kriteria</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bagian Kanan (Grid 4 Blok: Peserta, Sudut Pandang Tema, Format/Kriteria, Mekanisme) */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    {/* Blok 1: PESERTA & KELAYAKAN (Sesuai kolom "PESERTA" di tangkapan layar) */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#24211c] pb-2 border-b border-[rgba(36,33,28,0.2)]">
                        PESERTA & KELAYAKAN
                      </h4>
                      <ul className="space-y-2 text-xs text-[#5c5b57] leading-relaxed">
                        {displaySyarat.map((s, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-[#8a7c4c] font-black text-sm leading-none mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Blok 2: SUDUT PANDANG TEMA / INDIKATOR (Sesuai kolom "SUDUT PANDANG TEMA" di tangkapan layar) */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#24211c] pb-2 border-b border-[rgba(36,33,28,0.2)]">
                        SUDUT PANDANG TEMA
                      </h4>
                      <ul className="space-y-2 text-xs text-[#5c5b57] leading-relaxed">
                        {displayIndikator.map((ind, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-[#8a7c4c] font-black text-sm leading-none mt-0.5">•</span>
                            <span>{ind}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Blok 3: FORMAT & KETENTUAN PENILAIAN (Sesuai kolom "FORMAT & KETENTUAN" di tangkapan layar) */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#24211c] pb-2 border-b border-[rgba(36,33,28,0.2)]">
                        FORMAT & KETENTUAN
                      </h4>
                      <div className="space-y-2.5 pt-1 text-xs">
                        {displayKriteria.map((k, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-[#24211c] font-medium text-xs">
                              <span>{k.name}</span>
                              <span className="font-extrabold text-[#8a7c4c] bg-[#ede9df] px-1.5 py-0.5 rounded text-[11px] border border-[#c3b68b]/30">
                                {k.weight}%
                              </span>
                            </div>
                            <div className="w-full bg-[#ded9cb] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#8a7c4c] h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${k.weight}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        <p className="text-[11px] text-[#7c7b77] italic pt-1">
                          * Standar skor kelulusan minimal penganugerahan: 85/100.
                        </p>
                      </div>
                    </div>

                    {/* Blok 4: MEKANISME & PENILAIAN (Sesuai kolom "MEKANISME & PENILAIAN" di tangkapan layar) */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#24211c] pb-2 border-b border-[rgba(36,33,28,0.2)]">
                        MEKANISME & PENILAIAN
                      </h4>
                      <ul className="space-y-2 text-xs text-[#5c5b57] leading-relaxed">
                        {displayMekanisme.map((m, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-[#8a7c4c] font-black text-sm leading-none mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </CollapsibleSection>

      {/* Main Participants List & Awarding Section (KHUSUS AKSES ADMIN - ELEGAN & PRESTISIUS) */}
      {isAdmin && (
        <CollapsibleSection
          sectionId="nomination_list_section"
          title="Daftar Peserta Nominasi & Penganugerahan"
          subtitle="Kelola data pendaftaran calon penerima, verifikasi kelayakan, rekap skor penjurian, dan penetapan pemenang resmi Milad Sidogiri"
          icon={<Trophy className="w-4 h-4 text-[#8a7c4c]" />}
          defaultOpen={true}
          badge={
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8a7c4c] animate-pulse"></span>
                <span>Khusus Admin</span>
              </span>
              <span className="text-[10px] font-extrabold bg-white text-[#24211c] border border-[#dcd7cb] px-2.5 py-0.5 rounded-full shadow-2xs">
                {filteredNominations.length} Peserta
              </span>
            </div>
          }
        >
          <div className="space-y-4">
            {/* 1. Executive Summary Cards (Metrik Ringkas Khusus Admin) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-[#e8e4da] rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10.5px] font-bold text-[#7c7b77] uppercase tracking-wider block">Total Peserta</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-[#24211c]">{nominations.length}</span>
                  <span className="text-[10.5px] font-semibold text-[#8a7c4c] bg-[#f2eee3] px-2 py-0.5 rounded-md">Terdaftar</span>
                </div>
              </div>

              <div className="bg-white border border-[#e8e4da] rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10.5px] font-bold text-[#7c7b77] uppercase tracking-wider block">Dalam Penilaian</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-[#24211c]">
                    {nominations.filter((n) => n.status === 'Penilaian' || n.status === 'Draf').length}
                  </span>
                  <span className="text-[10.5px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Proses
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#e8e4da] rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10.5px] font-bold text-[#7c7b77] uppercase tracking-wider block">Disetujui Panitia</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-[#24211c]">
                    {nominations.filter((n) => n.status === 'Disetujui').length}
                  </span>
                  <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Lolos
                  </span>
                </div>
              </div>

              <div className="bg-[#fcfbf9] border border-[#c3b68b]/60 rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10.5px] font-bold text-[#8a7c4c] uppercase tracking-wider block">Pemenang Final</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-[#675c37]">
                    {nominations.filter((n) => n.status === 'Pemenang').length}
                  </span>
                  <span className="text-[10.5px] font-extrabold text-white bg-[#8a7c4c] px-2 py-0.5 rounded-md shadow-2xs flex items-center space-x-1">
                    <span>🏆 SK</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Category Filter Pill Tabs (Pilihan Cepat Filter Kategori) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer select-none ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#8a7c4c] text-white shadow-xs'
                    : 'bg-white hover:bg-[#f7f6f2] text-[#24211c] border border-[#e8e4da]'
                }`}
              >
                Semua Cabang ({nominations.length})
              </button>
              {(categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).map((cat) => {
                const count = nominations.filter(
                  (n) =>
                    n.categoryId === cat.id ||
                    (cat.id === 'cat-1' && (n.categoryId.toLowerCase().includes('ranting') || cat.title.toLowerCase().includes('ranting'))) ||
                    (cat.id === 'cat-2' && (n.categoryId.toLowerCase().includes('guru') || cat.title.toLowerCase().includes('guru'))) ||
                    (cat.id === 'cat-3' && (n.categoryId.toLowerCase().includes('alumni') || cat.title.toLowerCase().includes('alumni'))) ||
                    (cat.id === 'cat-4' && (n.categoryId.toLowerCase().includes('pengurus') || cat.title.toLowerCase().includes('pengurus'))) ||
                    (cat.id === 'cat-5' && (n.categoryId.toLowerCase().includes('santri') || cat.title.toLowerCase().includes('santri'))) ||
                    (cat.id === 'cat-6' && (n.categoryId.toLowerCase().includes('murid') || cat.title.toLowerCase().includes('murid')))
                ).length;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer select-none flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-[#8a7c4c] text-white shadow-xs'
                        : 'bg-white hover:bg-[#f7f6f2] text-[#5c5b57] hover:text-[#24211c] border border-[#e8e4da]'
                    }`}
                  >
                    <span>{cat.title}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#f2eee3] text-[#675c37]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3. Search & Control Bar Elegan */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e8e4da] shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#7c7b77]" />
                <input
                  type="text"
                  placeholder="Cari ID PPS, nama calon, domisili, kelas, tingkat, alamat, atau jabatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8a7c4c]/30 focus:border-[#8a7c4c] focus:bg-white text-[#24211c] placeholder-[#a39f96] font-medium transition shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-[#7c7b77] hover:text-[#24211c] p-0.5 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter & Mode Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Select */}
                <div className="flex items-center space-x-1.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl px-3 py-1.5 text-xs text-[#24211c] shadow-2xs">
                  <Filter className="w-3.5 h-3.5 text-[#8a7c4c]" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent focus:outline-none font-bold text-[#24211c] cursor-pointer text-xs"
                  >
                    <option value="ALL">Semua Status Penetapan</option>
                    <option value="Pemenang">🏆 Pemenang Final Terpilih</option>
                    <option value="Disetujui">Disetujui Panitia</option>
                    <option value="Penilaian">Dalam Penilaian</option>
                    <option value="Draf">Draf Usulan</option>
                  </select>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center bg-[#f2eee3] p-1 rounded-xl border border-[#c3b68b]/40 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-extrabold transition cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#8a7c4c] text-white shadow-2xs' : 'text-[#675c37] hover:text-[#24211c]'
                    }`}
                    title="Tampilan Kartu Elegan"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Kartu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-extrabold transition cursor-pointer ${
                      viewMode === 'table' ? 'bg-[#8a7c4c] text-white shadow-2xs' : 'text-[#675c37] hover:text-[#24211c]'
                    }`}
                    title="Tampilan Tabel Rinci"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Tabel Rinci</span>
                  </button>
                </div>

                {/* Quick Add Participant Button for Admin */}
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-extrabold px-3 py-2 rounded-xl shadow-xs transition text-xs cursor-pointer shrink-0"
                  title="Tambah Peserta / Usulkan Calon Baru"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Peserta</span>
                </button>

                {/* Reset Filters */}
                {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedStatus('ALL');
                      setSearchTerm('');
                    }}
                    className="text-xs text-[#8a7c4c] hover:text-[#675c37] font-bold underline px-2 py-1 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* 4. Main Content: Grid vs Table View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNominations.map((nom) => {
                  const category =
                    categories.find((c) => c.id === nom.categoryId) ||
                    OFFICIAL_AWARD_RUBRICS.find((r) => r.id === nom.categoryId);
                  const isWinner = nom.status === 'Pemenang';
                  const checklistCount = nom.evaluationChecklist
                    ? Object.values(nom.evaluationChecklist).filter(Boolean).length
                    : 0;

                  return (
                    <div
                      key={nom.id}
                      className={`bg-white rounded-3xl border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                        isWinner
                          ? 'border-[#8a7c4c] ring-1 ring-[#8a7c4c]/40 bg-[#fcfbf9]'
                          : 'border-[#e8e4da] hover:border-[#c3b68b]'
                      }`}
                    >
                      {/* Pemenang Banner Strip jika status Pemenang */}
                      {isWinner && (
                        <div className="bg-gradient-to-r from-[#8a7c4c] to-[#675c37] text-white px-4 py-1.5 text-xs font-black flex items-center justify-between shadow-2xs">
                          <div className="flex items-center space-x-1.5">
                            <Trophy className="w-3.5 h-3.5 text-[#f2eee3]" />
                            <span className="tracking-wide uppercase text-[10.5px]">Pemenang Anugerah Milad Sidogiri</span>
                          </div>
                          <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-md font-mono">
                            SK Pengasuh
                          </span>
                        </div>
                      )}

                      <div className="p-4 sm:p-5 space-y-3.5">
                        {/* Baris Atas: Kategori, ID PPS, dan Status & Skor */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-lg border bg-[#f2eee3] text-[#675c37] border-[#c3b68b]/40">
                                {category?.title || 'Kategori'}
                              </span>
                              {(nom.idPps || nom.nipNik) && (
                                <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#faf8f4] text-[#8a7c4c] border border-[#dcd7cb]">
                                  {nom.idPps || nom.nipNik}
                                </span>
                              )}
                            </div>

                            <h3 className="font-black text-[#24211c] text-base sm:text-lg flex items-center space-x-1.5 pt-0.5">
                              <span>{nom.candidateName}</span>
                              {isWinner && <Trophy className="w-4 h-4 text-[#8a7c4c] shrink-0 inline" />}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5c5b57] font-medium">
                              <span className="text-[#675c37] font-extrabold bg-[#ede9df] px-2 py-0.5 rounded-md border border-[#c3b68b]/30 text-[10px]">
                                {nom.candidateDomisiliType || 'PPS'}
                              </span>
                              {nom.domisili && <span className="text-[#24211c] font-semibold">📍 {nom.domisili}</span>}
                              {nom.kelas && <span className="text-[#5c5b57]">• {nom.kelas}</span>}
                              {nom.tingkat && <span className="text-[#7c7b77]">• {nom.tingkat}</span>}
                            </div>
                          </div>

                          {/* Skor & Status Badge */}
                          <div className="text-right shrink-0">
                            <div className="inline-flex items-center space-x-1 bg-[#8a7c4c] text-white px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs">
                              <span>{nom.score}</span>
                              <span className="text-[10px] text-[#f2eee3] font-normal">/100</span>
                            </div>

                            <div className="mt-1">
                              <span
                                className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
                                  nom.status === 'Pemenang'
                                    ? 'bg-[#00a65a] text-white border-emerald-600'
                                    : nom.status === 'Disetujui'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : nom.status === 'Penilaian'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-[#faf8f4] text-[#7c7b77] border-[#dcd7cb]'
                                }`}
                              >
                                {nom.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Extra Details: Jabatan 2 Tahun Terakhir, Checklist Kriteria, Kontak */}
                        <div className="space-y-2 pt-1 border-t border-[#f2eee3]">
                          {/* Jabatan Peserta pada 2 Tahun Terakhir */}
                          {nom.department && (
                            <div className="text-xs bg-[#faf8f4] p-2.5 rounded-xl border border-[#dcd7cb]">
                              <span className="font-extrabold text-[#675c37] block text-[10.5px] uppercase tracking-wider mb-0.5">
                                Jabatan Peserta pada 2 Tahun Terakhir:
                              </span>
                              <p className="font-bold text-[#24211c]">{nom.department}</p>
                            </div>
                          )}

                          {/* Kriteria Terpenuhi Badge */}
                          {checklistCount > 0 && (
                            <div className="flex items-center space-x-1.5 text-xs text-[#675c37] bg-[#ede9df] px-3 py-1 rounded-xl border border-[#c3b68b]/40 w-fit">
                              <CheckSquare className="w-3.5 h-3.5 text-[#8a7c4c]" />
                              <span className="font-extrabold">{checklistCount} Poin Sub-Kriteria Terpenuhi</span>
                            </div>
                          )}

                          {/* Alamat */}
                          {nom.alamat && (
                            <div className="text-xs text-[#5c5b57] bg-[#faf8f4] p-2.5 rounded-xl border border-[#e8e4da]">
                              <span className="font-bold text-[#7c7b77] block text-[10px] uppercase mb-0.5">Alamat Lengkap:</span>
                              <p className="line-clamp-2 text-[#24211c]">{nom.alamat}</p>
                            </div>
                          )}

                          {/* Kontak WhatsApp */}
                          {nom.phone && (
                            <div className="flex items-center space-x-1.5 text-xs text-[#675c37] bg-[#f2eee3] px-3 py-1 rounded-xl border border-[#c3b68b]/40 w-fit">
                              <Phone className="w-3 h-3 text-[#8a7c4c]" />
                              <span className="font-mono font-bold">{nom.phone}</span>
                            </div>
                          )}

                          {/* Alasan / Justifikasi Pengusulan */}
                          {nom.justification && (
                            <div className="p-3 rounded-2xl bg-[#faf8f4] border border-[#e8e4da] text-xs text-[#5c5b57] leading-relaxed">
                              <span className="font-bold text-[#7c7b77] block text-[10.5px] uppercase tracking-wider mb-0.5">
                                Alasan / Rekomendasi Pengusulan:
                              </span>
                              <p className="italic text-[#24211c]">"{nom.justification}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Pengusul & Tombol Aksi Admin */}
                      <div className="px-4 sm:px-5 py-3 bg-[#faf8f4] border-t border-[#e8e4da] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[11px] text-[#7c7b77]">
                          <span>Pengusul: </span>
                          <strong className="text-[#24211c] font-bold">
                            {nom.pengusulNama || nom.nominatorName || 'Panitia'}
                          </strong>
                          {nom.pengusulJabatan && (
                            <span className="text-[#8a7c4c] ml-1">({nom.pengusulJabatan})</span>
                          )}
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center space-x-1.5 ml-auto">
                          {!isWinner && (
                            <button
                              type="button"
                              onClick={() => handleSetWinner(nom)}
                              className="px-3 py-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-extrabold rounded-xl border border-[#675c37] text-[11px] transition cursor-pointer shadow-2xs flex items-center space-x-1"
                              title="Tetapkan sebagai Pemenang Resmi"
                            >
                              <span>🏆 Tetapkan Pemenang</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(nom)}
                            className="p-1.5 text-[#5c5b57] hover:text-[#24211c] bg-white hover:bg-[#f7f6f2] border border-[#dcd7cb] rounded-xl transition cursor-pointer shadow-2xs"
                            title="Edit Data Peserta & Rubrik"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNomination(nom.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
                            title="Hapus Data Peserta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredNominations.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-[#e8e4da] shadow-2xs">
                    <UserCheck className="w-10 h-10 text-[#c3b68b] mx-auto mb-2" />
                    <p className="text-[#24211c] font-bold text-sm">Tidak ada data peserta ditemukan.</p>
                    <p className="text-xs text-[#7c7b77] mt-1">
                      Coba sesuaikan kata kunci pencarian, filter kategori, atau klik tombol Tambah Peserta.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* TABEL KOLOM PESERTA (Table View Layout Elegan Khusus Admin) */
              <div className="bg-white rounded-3xl border border-[#e8e4da] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#faf8f4] border-b border-[#e8e4da] text-[#675c37] font-black uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 text-center">No</th>
                        <th className="px-4 py-3.5">ID PPS</th>
                        <th className="px-4 py-3.5">Nama Peserta</th>
                        <th className="px-4 py-3.5">Domisili</th>
                        <th className="px-4 py-3.5">Kelas & Tingkat</th>
                        <th className="px-4 py-3.5">Jabatan (2 Thn)</th>
                        <th className="px-4 py-3.5">Kategori Penghargaan</th>
                        <th className="px-4 py-3.5 text-center">Skor & Status</th>
                        <th className="px-4 py-3.5 text-right">Aksi Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2eee3] text-[#24211c] font-medium">
                      {filteredNominations.map((nom, idx) => {
                        const category =
                          categories.find((c) => c.id === nom.categoryId) ||
                          OFFICIAL_AWARD_RUBRICS.find((r) => r.id === nom.categoryId);
                        const isWinner = nom.status === 'Pemenang';

                        return (
                          <tr key={nom.id} className="hover:bg-[#faf8f4] transition">
                            <td className="px-4 py-3.5 font-bold text-[#7c7b77] text-center">{idx + 1}</td>
                            <td className="px-4 py-3.5 font-mono text-[#8a7c4c] font-bold whitespace-nowrap">
                              {nom.idPps || nom.nipNik || '-'}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-black text-[#24211c] text-sm flex items-center space-x-1.5">
                                <span>{nom.candidateName}</span>
                                {isWinner && <Trophy className="w-3.5 h-3.5 text-[#8a7c4c] shrink-0 inline" />}
                              </div>
                              {nom.phone && (
                                <div className="text-[10px] text-[#8a7c4c] font-mono mt-0.5">📱 {nom.phone}</div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="text-[10px] font-bold bg-[#ede9df] text-[#675c37] px-2 py-0.5 rounded-md mr-1.5 border border-[#c3b68b]/30">
                                {nom.candidateDomisiliType || 'PPS'}
                              </span>
                              <span className="text-[#24211c]">{nom.domisili || '-'}</span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="text-[#24211c] font-semibold">{nom.kelas || '-'}</div>
                              {nom.tingkat && <div className="text-[10px] text-[#7c7b77] font-medium">{nom.tingkat}</div>}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-[#5c5b57] max-w-[180px] truncate" title={nom.department || ''}>
                              {nom.department || '-'}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-[#f2eee3] text-[#675c37] border-[#c3b68b]/40 whitespace-nowrap">
                                {category?.title || 'Kategori'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <div className="font-black text-[#8a7c4c] text-xs">{nom.score}/100</div>
                              <span
                                className={`inline-block text-[9.5px] font-black px-2 py-0.5 rounded-md border mt-0.5 uppercase tracking-wider ${
                                  nom.status === 'Pemenang'
                                    ? 'bg-[#00a65a] text-white border-emerald-600'
                                    : nom.status === 'Disetujui'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : nom.status === 'Penilaian'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-[#faf8f4] text-[#7c7b77] border-[#dcd7cb]'
                                }`}
                              >
                                {nom.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1.5">
                                {!isWinner && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetWinner(nom)}
                                    className="px-2.5 py-1 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-extrabold rounded-lg border border-[#675c37] text-[10px] transition cursor-pointer shadow-2xs"
                                    title="Tetapkan Pemenang"
                                  >
                                    🏆 Pemenang
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(nom)}
                                  className="p-1.5 text-[#5c5b57] hover:text-[#24211c] bg-[#faf8f4] hover:bg-[#f2eee3] border border-[#dcd7cb] rounded-lg transition cursor-pointer shadow-2xs"
                                  title="Edit Data Peserta"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteNomination(nom.id)}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
                                  title="Hapus Peserta"
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
                          <td colSpan={9} className="py-8 text-center text-[#7c7b77]">
                            Tidak ada data peserta dalam tabel.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Modal Add / Edit Nomination (Form LENGKAP Data Peserta & Rubrik Dinamis Sesuai Kategori) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#24211c]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl sm:max-w-3xl rounded-3xl shadow-2xl border border-[rgba(36,33,28,0.15)] overflow-hidden text-[#24211c] max-h-[92vh] flex flex-col my-auto">
            {/* Signature Milad Sidogiri 3-Stripes Accent */}
            <div aria-hidden="true" className="grid grid-cols-[26%_1fr_8%] h-1.5 w-full shrink-0">
              <span className="bg-[#8a7c4c]"></span>
              <span className="bg-[#e5e2da]"></span>
              <span className="bg-[#7c7b77]"></span>
            </div>

            {/* Header Modal */}
            <div className="bg-[#fcfbf9] px-5 sm:px-7 py-4 border-b border-[rgba(36,33,28,0.1)] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f2eee3] border border-[#c3b68b]/50 flex items-center justify-center text-[#8a7c4c] shadow-2xs shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-[#24211c] tracking-tight">
                      {editingNomination
                        ? (isAdmin ? 'Edit Data Peserta & Penilaian Nominasi' : 'Detail Usulan Calon Penerima Anugerah')
                        : (isAdmin ? 'Tambah Peserta & Nominasi Baru' : 'Formulir Pengusulan Calon Penerima Anugerah')}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40">
                      Milad ke-290 Sidogiri
                    </span>
                  </div>
                  <p className="text-xs text-[#7c7b77] mt-0.5">
                    {isAdmin
                      ? 'Formulir resmi pendaftaran, kualifikasi identitas, verifikasi, dan penilaian calon penerima anugerah'
                      : 'Formulir pengusulan resmi: isi identitas pengusul, calon yang diusulkan, dan centang kriteria kelayakan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-xl bg-white border border-[rgba(36,33,28,0.15)] hover:bg-[#f7f6f2] text-[#7c7b77] hover:text-[#24211c] flex items-center justify-center transition cursor-pointer shrink-0"
                title="Tutup Formulir"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
              {/* Seksi 1: Identitas Pengusul (Otomatis Terisi Sesuai Login Akun) */}
              <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between border-b border-[#e8e4da] pb-2.5 gap-2">
                  <div className="flex items-center space-x-2 text-[#8a7c4c]">
                    <UserCheck className="w-4 h-4" />
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      1. Identitas Pengusul
                    </h4>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8a7c4c] inline-block animate-pulse"></span>
                      <span>Otomatis Akun Login: <strong>{currentUser?.name || currentUser?.email || 'Aktif'}</strong></span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* A. Nama Pengusul (Otomatis Sesuai Login) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#24211c]">
                        A. Nama Pengusul <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                        (Otomatis sesuai nama login)
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap pengusul..."
                      value={pengusulNama}
                      readOnly={!isAdmin && !!editingNomination}
                      onChange={(e) => setPengusulNama(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] font-semibold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  {/* B. Jabatan Pengusul (Otomatis Sesuai Role Akun) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#24211c]">
                        B. Jabatan Pengusul
                      </label>
                      <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                        (Otomatis sesuai jabatan akun)
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Contoh: Pengurus Cabang / Ketua Ranting / Asatidz"
                      value={pengusulJabatan}
                      readOnly={!isAdmin && !!editingNomination}
                      onChange={(e) => setPengusulJabatan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {/* C. Domisili Pengusul (Pilihan PPS & LPPS) */}
                  <div>
                    <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                      C. Domisili Pengusul
                    </label>
                    <div className="flex items-center gap-3">
                      <label className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        pengusulDomisili === 'PPS'
                          ? 'bg-[#8a7c4c] text-white border-[#8a7c4c] shadow-2xs'
                          : 'bg-white text-[#24211c] border-[#dcd7cb] hover:bg-[#f7f6f2]'
                      }`}>
                        <input
                          type="radio"
                          name="pengusulDomisiliRadio"
                          value="PPS"
                          checked={pengusulDomisili === 'PPS'}
                          disabled={!isAdmin && !!editingNomination}
                          onChange={() => {
                            setPengusulDomisili('PPS');
                            if (!pengusulAlamat || pengusulAlamat.trim() === '' || pengusulAlamat.includes('Luar')) {
                              setPengusulAlamat('Pondok Pesantren Sidogiri, Kraton, Pasuruan');
                            }
                          }}
                          className="sr-only"
                        />
                        <span>PPS (Pondok Pesantren Sidogiri)</span>
                      </label>

                      <label className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        pengusulDomisili === 'LPPS'
                          ? 'bg-[#8a7c4c] text-white border-[#8a7c4c] shadow-2xs'
                          : 'bg-white text-[#24211c] border-[#dcd7cb] hover:bg-[#f7f6f2]'
                      }`}>
                        <input
                          type="radio"
                          name="pengusulDomisiliRadio"
                          value="LPPS"
                          checked={pengusulDomisili === 'LPPS'}
                          disabled={!isAdmin && !!editingNomination}
                          onChange={() => {
                            setPengusulDomisili('LPPS');
                            if (pengusulAlamat === 'Pondok Pesantren Sidogiri, Kraton, Pasuruan') {
                              setPengusulAlamat('');
                            }
                          }}
                          className="sr-only"
                        />
                        <span>LPPS (Luar Pondok Pesantren Sidogiri)</span>
                      </label>
                    </div>
                  </div>

                  {/* D. Alamat Pengusul */}
                  <div>
                    <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                      D. Alamat Pengusul
                    </label>
                    <input
                      type="text"
                      placeholder="Alamat domisili lengkap pengusul..."
                      value={pengusulAlamat}
                      readOnly={!isAdmin && !!editingNomination}
                      onChange={(e) => setPengusulAlamat(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 2: Identitas Ranting / Peserta yang Diusulkan */}
              <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#e8e4da] pb-2.5">
                  <div className="flex items-center space-x-2 text-[#8a7c4c]">
                    <IdCard className="w-4 h-4" />
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      2. Identitas Ranting / Peserta yang Diusulkan
                    </h4>
                  </div>
                  <span className="text-[10.5px] font-bold text-[#7c7b77]">
                    A. ID PPS • B. Nama • C. Domisili • D. Kelas • E. Tingkat • F. Alamat
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* A. ID PPS / ID PERSONALIA */}
                  <div>
                    <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                      A. ID PPS / ID Personalia (kalau ada)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PPS-2026-001 / ID Personalia"
                      value={idPps}
                      readOnly={!isAdmin && !!editingNomination}
                      onChange={(e) => setIdPps(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#8a7c4c] font-mono font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  {/* B. Nama yang Diusulkan */}
                  <div>
                    <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                      B. Nama Ranting / Nama Peserta <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap ranting atau figur calon yang diusulkan"
                      value={candidateName}
                      readOnly={!isAdmin && !!editingNomination}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] font-semibold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {/* C. Domisili yang Diusulkan (Pilihan PPS & LPPS) */}
                  <div>
                    <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                      C. Domisili Calon / Ranting
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          candidateDomisiliType === 'PPS'
                            ? 'bg-[#8a7c4c] text-white border-[#8a7c4c] shadow-2xs'
                            : 'bg-white text-[#24211c] border-[#dcd7cb] hover:bg-[#f7f6f2]'
                        }`}>
                          <input
                            type="radio"
                            name="candidateDomisiliRadio"
                            value="PPS"
                            checked={candidateDomisiliType === 'PPS'}
                            disabled={!isAdmin && !!editingNomination}
                            onChange={() => setCandidateDomisiliType('PPS')}
                            className="sr-only"
                          />
                          <span>PPS</span>
                        </label>

                        <label className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          candidateDomisiliType === 'LPPS'
                            ? 'bg-[#8a7c4c] text-white border-[#8a7c4c] shadow-2xs'
                            : 'bg-white text-[#24211c] border-[#dcd7cb] hover:bg-[#f7f6f2]'
                        }`}>
                          <input
                            type="radio"
                            name="candidateDomisiliRadio"
                            value="LPPS"
                            checked={candidateDomisiliType === 'LPPS'}
                            disabled={!isAdmin && !!editingNomination}
                            onChange={() => setCandidateDomisiliType('LPPS')}
                            className="sr-only"
                          />
                          <span>LPPS</span>
                        </label>
                      </div>

                      <div className="flex-1 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="Wilayah / Kota / Daerah asal (misal: Pasuruan, Madura, Surabaya)"
                          value={domisili}
                          readOnly={!isAdmin && !!editingNomination}
                          onChange={(e) => setDomisili(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* D. Kelas & E. Tingkat */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                        D. Kelas
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kelas 3 Aliyah / MMU"
                        value={kelas}
                        readOnly={!isAdmin && !!editingNomination}
                        onChange={(e) => setKelas(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                        E. Tingkat
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Ulya / Tsanawiyah / Asatidz / Pengurus"
                        value={tingkat}
                        readOnly={!isAdmin && !!editingNomination}
                        onChange={(e) => setTingkat(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* F. Alamat Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                      F. Alamat Lengkap
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Alamat lengkap calon / ranting yang diusulkan..."
                      value={alamat}
                      readOnly={!isAdmin && !!editingNomination}
                      onChange={(e) => setAlamat(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 3: Kategori Penganugerahan & Kontak */}
              <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center space-x-2 text-[#8a7c4c] border-b border-[#e8e4da] pb-2.5">
                  <Award className="w-4 h-4" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    3. Kategori Penganugerahan & Kontak
                  </h4>
                </div>

                {/* Pilihan Kategori */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#24211c]">
                      Pilihan Kategori Penghargaan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10.5px] font-bold text-[#8a7c4c] flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Sub-kriteria menyesuaikan otomatis</span>
                    </span>
                  </div>
                  <select
                    value={categoryId}
                    disabled={!isAdmin && !!editingNomination}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#dcd7cb] text-[#24211c] rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs cursor-pointer"
                  >
                    {(categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  {/* Dynamic Category Preview Badge */}
                  {(() => {
                    const activeCat = (categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).find((c) => c.id === categoryId) || categories.find((c) => c.id === categoryId) || OFFICIAL_AWARD_RUBRICS[0];
                    return (
                      <div className="mt-2 p-2.5 rounded-xl bg-[#ede9df]/60 border border-[#c3b68b]/40 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-[#8a7c4c] shrink-0" />
                          <span className="font-extrabold text-[#675c37]">{activeCat?.title}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#7c7b77] bg-white px-2 py-0.5 rounded-md border border-[#dcd7cb]">
                          Sub-kriteria aktif dimuat di Seksi 4
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                      Jabatan Peserta pada 2 Tahun Terakhir
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Ketua Ranting MMU / Asatidz Senior / Koordinator Sie"
                      value={department}
                      readOnly={!isAdmin && !!editingNomination}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                      No. WhatsApp / Kontak
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      readOnly={!isAdmin && !!editingNomination}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#8a7c4c] font-mono font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 4: Rubrik Penilaian Dinamis Sesuai Kategori yang Dipilih */}
              {(() => {
                const selectedCatObj = (categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).find((c) => c.id === categoryId) || categories.find((c) => c.id === categoryId) || OFFICIAL_AWARD_RUBRICS[0];
                const catTitleLower = (selectedCatObj?.title || categoryId || '').toLowerCase();

                const isRanting = categoryId === 'cat-1' || catTitleLower.includes('ranting');
                const isGuru = categoryId === 'cat-2' || catTitleLower.includes('guru');
                const isAlumni = categoryId === 'cat-3' || catTitleLower.includes('alumni');
                const isPengurus = categoryId === 'cat-4' || catTitleLower.includes('pengurus');
                const isSantri = categoryId === 'cat-5' || catTitleLower.includes('santri');
                const isMurid = categoryId === 'cat-6' || catTitleLower.includes('murid');

                const rantingKeys = [
                  'ranting_prestasi_imda',
                  'ranting_prestasi_almiftah',
                  'ranting_prestasi_muammar',
                  'ranting_loyalitas_laporan_bulanan',
                  'ranting_loyalitas_laporan_lisan_triwulan',
                  'ranting_loyalitas_kurikulum',
                  'ranting_loyalitas_pedoman_kerantingan',
                  'ranting_loyalitas_akreditasi_batartama',
                  'ranting_loyalitas_rapim',
                  'ranting_loyalitas_keaktifan_pembinaan',
                  'ranting_lain_kejujuran',
                ];
                const guruKeys = [
                  'guru_dedikasi',
                  'guru_disiplin_tatatertib',
                  'guru_teladan_akhlak',
                  'guru_materi_aswaja',
                  'guru_penjelasan_lugas',
                  'guru_hadir_kbm',
                  'guru_bimbing_disiplin',
                  'guru_tegur_sanksi',
                  'guru_tamrin_masal',
                  'guru_kegiatan_madrasah',
                  'guru_ramah_senyum',
                  'guru_bersahabat_muruah',
                  'guru_bersih_rapi',
                ];
                const alumniKeys = [
                  'alumni_dedikasi',
                  'alumni_ketaatan',
                  'alumni_kapabilitas',
                  'alumni_kapasitas',
                  'alumni_kreativitas',
                  'alumni_karakter',
                  'alumni_kredibilitas',
                  'alumni_komitmen',
                ];
                const pengurusKeys = [
                  'pengurus_dedikasi',
                  'pengurus_ketaatan',
                  'pengurus_kapabilitas',
                  'pengurus_kreativitas',
                  'pengurus_karakter',
                  'pengurus_kredibilitas',
                  'pengurus_komitmen',
                ];
                const santriKeys = ['santri_jamaah', 'santri_akhlak', 'santri_tatatertib', 'santri_taklim'];
                const muridKeys = ['murid_ujian', 'murid_maknani', 'murid_musyawarah'];

                const currentCategoryKeys = isRanting
                  ? rantingKeys
                  : isGuru
                  ? guruKeys
                  : isAlumni
                  ? alumniKeys
                  : isPengurus
                  ? pengurusKeys
                  : isSantri
                  ? santriKeys
                  : muridKeys;

                const checkAllCurrent = () => {
                  setChecklist((prev) => {
                    const next = { ...prev };
                    currentCategoryKeys.forEach((k) => {
                      next[k] = true;
                    });
                    return next;
                  });
                };

                const uncheckAllCurrent = () => {
                  setChecklist((prev) => {
                    const next = { ...prev };
                    currentCategoryKeys.forEach((k) => {
                      next[k] = false;
                    });
                    return next;
                  });
                };

                const checkedCount = currentCategoryKeys.filter((k) => !!checklist[k]).length;

                return (
                  <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between border-b border-[#e8e4da] pb-2.5 gap-2">
                      <div className="flex items-center space-x-2 text-[#8a7c4c]">
                        <CheckSquare className="w-4 h-4" />
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          4. Kriteria & Alasan Penilaian Resmi: <span className="text-[#24211c]">{selectedCatObj?.title}</span>
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isAdmin && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={checkAllCurrent}
                              className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-[#ede9df] hover:bg-[#e2ded2] text-[#675c37] border border-[#c3b68b]/40 cursor-pointer transition shadow-2xs"
                              title="Centang semua kriteria aktif ini"
                            >
                              ✓ Centang Semua
                            </button>
                            <button
                              type="button"
                              onClick={uncheckAllCurrent}
                              className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 cursor-pointer transition shadow-2xs"
                              title="Reset semua centang"
                            >
                              ✕ Reset
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] font-bold bg-[#ede9df] text-[#675c37] border border-[#c3b68b]/30 px-2.5 py-0.5 rounded-full">
                          Tercentang: {checkedCount} / {currentCategoryKeys.length} Poin
                        </span>
                      </div>
                    </div>

                    {/* KONDISI A: PENGHARGAAN KHIDMAH (RANTING) */}
                    {isRanting && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="text-xs font-extrabold text-[#675c37] bg-[#ede9df] px-3.5 py-1.5 rounded-xl border border-[#c3b68b]/30 flex items-center justify-between">
                          <span>Sub-Kriteria Resmi: Penghargaan Khidmah (Ranting)</span>
                          <span className="text-[10px] font-semibold text-[#8a7c4c]">Prestasi • Loyalitas • Integritas • Lain-lain</span>
                        </div>

                        {/* 1. PRESTASI */}
                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2">
                          <span className="font-extrabold text-xs text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                            1. PRESTASI
                          </span>
                          <div className="space-y-2 pt-1 text-xs">
                            {[
                              { id: 'ranting_prestasi_imda', label: 'a. Nilai Imda/Imni' },
                              { id: 'ranting_prestasi_almiftah', label: 'b. Nilai Ujian al-Miftah' },
                              { id: 'ranting_prestasi_muammar', label: 'c. Nilai Muammar' },
                            ].map((item) => (
                              <label key={item.id} className="flex items-center space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!checklist[item.id]}
                                  onChange={() => toggleChecklist(item.id)}
                                  className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer"
                                />
                                <span className="text-slate-800 font-medium">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* 2. LOYALITAS */}
                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2.5">
                          <span className="font-extrabold text-xs text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                            2. LOYALITAS
                          </span>
                          <div className="space-y-2 pt-1 text-xs">
                            {[
                              { id: 'ranting_loyalitas_laporan_bulanan', label: 'a. Laporan Bulanan' },
                              { id: 'ranting_loyalitas_laporan_lisan_triwulan', label: 'b. Laporan Lisan Triwulan' },
                              { id: 'ranting_loyalitas_kurikulum', label: 'c. Pelaksanaan Kurikulum' },
                              { id: 'ranting_loyalitas_pedoman_kerantingan', label: 'd. Pelaksanaan Pedoman Kerantingan' },
                              { id: 'ranting_loyalitas_akreditasi_batartama', label: 'e. Hasil akreditasi Batartama' },
                              { id: 'ranting_loyalitas_rapim', label: 'f. Rapim I & II' },
                              { id: 'ranting_loyalitas_keaktifan_pembinaan', label: 'g. Keaktifan ikut Pembinaan' },
                            ].map((item) => (
                              <label key={item.id} className="flex items-center space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!checklist[item.id]}
                                  onChange={() => toggleChecklist(item.id)}
                                  className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer"
                                />
                                <span className="text-slate-800 font-medium">{item.label}</span>
                              </label>
                            ))}
                          </div>

                          {/* h. ALASAN LAIN (diisi sendiri / bebas diedit oleh admin) */}
                          <div className="pt-2 border-t border-[#f2eee3]">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-bold text-[#24211c]">
                                h. ALASAN LAIN (diisi sendiri):
                              </label>
                              <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                                Kolom isian bebas (dapat diedit oleh admin)
                              </span>
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Tuliskan alasan lain loyalitas ranting jika ada..."
                              value={alasanLain}
                              onChange={(e) => setAlasanLain(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                            />
                            <p className="text-[11px] text-[#7c7b77] italic mt-1 leading-relaxed">
                              * Keterangan: Centang pada kolom yang ada di samping sesuai dengan kepribadian yang diusulkan. Jika alasan yang dikehendaki tidak tercantum pada pilihan di atas, maka bisa diisi di kolom alasan lain.
                            </p>
                          </div>
                        </div>

                        {/* 3. INTEGRITAS (mengisi sendiri / bebas diedit oleh admin) */}
                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-extrabold text-xs text-[#24211c]">
                              3. INTEGRITAS (mengisi sendiri):
                            </label>
                            <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                              Kolom isian bebas (dapat diedit oleh admin)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Tuliskan catatan dan bukti integritas ranting..."
                            value={integritasNote}
                            onChange={(e) => setIntegritasNote(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                          />
                        </div>

                        {/* 4. LAIN-LAIN */}
                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2">
                          <span className="font-extrabold text-xs text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                            4. LAIN-LAIN
                          </span>
                          <div className="text-xs space-y-2">
                            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!checklist['ranting_lain_kejujuran']}
                                onChange={() => toggleChecklist('ranting_lain_kejujuran')}
                                className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer"
                              />
                              <span className="text-slate-800 font-medium">a. Kejujuran</span>
                            </label>

                            <div className="pt-1">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold text-[#24211c]">
                                  b. Transparansi Laporan (mengisi sendiri):
                                </label>
                                <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                                  Kolom isian bebas (dapat diedit oleh admin)
                                </span>
                              </div>
                              <textarea
                                rows={2}
                                placeholder="Catatan transparansi laporan administrasi dan keuangan..."
                                value={transparansiLaporanNote}
                                onChange={(e) => setTransparansiLaporanNote(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* KONDISI B: PENGHARGAAN KHIDMAH (GURU) */}
                    {isGuru && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="text-xs font-extrabold text-[#675c37] bg-[#ede9df] px-3.5 py-1.5 rounded-xl border border-[#c3b68b]/30 flex items-center justify-between">
                          <span>Sub-Kriteria Resmi: Penghargaan Khidmah (Guru)</span>
                          <span className="text-[10px] font-semibold text-[#8a7c4c]">13 Kriteria Khidmah & Dedikasi Pengajaran</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2.5">
                          <span className="font-extrabold text-xs text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                            1. KRITERIA / ALASAN YANG DINILAI
                          </span>
                          <div className="space-y-2.5 pt-1 text-xs">
                            {[
                              { id: 'guru_dedikasi', label: 'a. Memiliki dedikasi yang tinggi pada Agama, Dakwah, Pondok Pesantren Sidogiri dan/atau Madrasah Miftahul Ulum' },
                              { id: 'guru_disiplin_tatatertib', label: 'b. Selalu disiplin dan taat pada tata tertib Madrasah dan Pondok Pesantren Sidogiri' },
                              { id: 'guru_teladan_akhlak', label: 'c. Menjadi teladan bagi murid dalam bertutur kata, bersikap, berperilaku, beribadah serta penerapan Akhlaq al Karimah' },
                              { id: 'guru_materi_aswaja', label: 'd. Menguasai materi pembelajaran dari berbagai sumber yang sesuai dengan ajaran Ahlussunnah wal jamaah dengan sangat baik' },
                              { id: 'guru_penjelasan_lugas', label: 'e. Mampu memberikan penjelasan dengan baik, jelas, lugas, dan tepat setiap kali murid bertanya, serta selalu berusaha keras agar semua murid tuntas dalam belajar' },
                              { id: 'guru_hadir_kbm', label: 'f. Selalu hadir/keluar tepat waktu pada proses KBM di kelas, serta tidak pernah meninggalkan kelas selama proses KBM tanpa alasan yang penting' },
                              { id: 'guru_bimbing_disiplin', label: 'g. Selalu gigih mengingatkan dan membimbing murid untuk selalu berperilaku baik dan disiplin' },
                              { id: 'guru_tegur_sanksi', label: 'h. Selalu menegur atau memberikan sanksi kepada murid yang dianggap melanggar peraturan Madrasah seperti tidak memakai lencana, terlambat masuk kelas dll' },
                              { id: 'guru_tamrin_masal', label: 'i. Selalu melaksanakan tamrin masal dengan tertib dan tepat waktu' },
                              { id: 'guru_kegiatan_madrasah', label: 'j. Selalu hadir pada kegiatan-kegiatan Madrasah lainnya, seperti kegiatan gerak batin yang diadakan oleh Ketua I setiap malam Jumat pon' },
                              { id: 'guru_ramah_senyum', label: 'k. Ramah dan enak diajak bicara serta murah senyum' },
                              { id: 'guru_bersahabat_muruah', label: 'l. Dekat dan bersahabat dengan murid dengan tetap menjaga wibawa dan muru’ah seorang guru' },
                              { id: 'guru_bersih_rapi', label: 'm. Selalu berpenampilan bersih, rapi, wangi, serasi, dan enak dipandang sesuai dengan ajaran Islam' },
                            ].map((item) => (
                              <label key={item.id} className="flex items-start space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!checklist[item.id]}
                                  onChange={() => toggleChecklist(item.id)}
                                  className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer mt-0.5 shrink-0"
                                />
                                <span className="text-slate-800 leading-snug font-medium">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-extrabold text-xs text-[#24211c]">
                              2. LAIN-LAIN (mengisi sendiri):
                            </label>
                            <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                              Kolom isian bebas (dapat diedit oleh admin)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Catatan tambahan pertimbangan untuk asatidz/guru..."
                            value={lainLainNote}
                            onChange={(e) => setLainLainNote(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* KONDISI C: PENGHARGAAN KHIDMAH (ALUMNI) */}
                    {isAlumni && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="text-xs font-extrabold text-[#675c37] bg-[#ede9df] px-3.5 py-1.5 rounded-xl border border-[#c3b68b]/30 flex items-center justify-between">
                          <span>Sub-Kriteria Resmi: Penghargaan Khidmah (Alumni)</span>
                          <span className="text-[10px] font-semibold text-[#8a7c4c]">8 Kriteria Utama Pengabdian & Karakter</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2.5">
                          <span className="font-extrabold text-xs text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                            1. KRITERIA YANG DINILAI
                          </span>
                          <div className="space-y-2.5 pt-1 text-xs">
                            {[
                              { id: 'alumni_dedikasi', title: 'a. Dedikasi', desc: 'Memiliki dedikasi yang tinggi pada Agama, Dakwah, Pondok Pesantren Sidogiri dan/atau Madrasah Miftahul Ulum' },
                              { id: 'alumni_ketaatan', title: 'b. Ketaatan', desc: 'Ketaatan ditunjukkan dengan ketundukan serta kepatuhan secara penuh pada titah Masyayikh dan Pengurus atasan, serta aturan yang telah ditetapkan, meskipun tidak searah dengan pandangan pribadinya. Termasuk juga keaktifan mengikuti kegiatan IASS' },
                              { id: 'alumni_kapabilitas', title: 'c. Kapabilitas', desc: 'Yaitu kemampuan dan keahlian yang dibutuhkan untuk melakukan pekerjaannya, seperti mengajar, berniaga, bertani, dls. Biasanya hal ini berkaitan dengan kemampuan di bidangnya, nalar, kecerdasan, serta cara berpikir sistematis' },
                              { id: 'alumni_kapasitas', title: 'd. Kapasitas', desc: 'Yaitu kapasitas maksimum atau potensi kemampuan seseorang yang ditunjukkan dengan keahlian memecahkan masalah (problem solving skill) di tengah-tengah masyarakatnya' },
                              { id: 'alumni_kreativitas', title: 'e. Kreativitas', desc: 'Kreativitas ditunjukan dengan karya atau pekerjaaan yang tidak biasa dilakukan oleh orang banyak, yang manfaatnya dapat dirasakan oleh agama, masyarakat dan atau Ikatan Alumni Santri Sidogiri' },
                              { id: 'alumni_karakter', title: 'f. Karakter', desc: 'Karakter yang baik yaitu watak dasar manusia yang ditunjukkan dalam perilaku sehari-hari, seperti sikap tawadhu’, kemampuan mengendalikan emosi, dan bagaimana merespon sebuah kejadian' },
                              { id: 'alumni_kredibilitas', title: 'g. Kredibilitas', desc: 'Ditunjukkan dengan kejujuran dan integritas yang tinggi, sehingga dapat dipercaya dan diandalkan untuk memikul amanah dan tanggung jawab dengan benar' },
                              { id: 'alumni_komitmen', title: 'h. Komitmen', desc: 'Ditunjukkan dengan kesungguhan menyelesaikan tugas dan kewajiban, walaupun dalam kondisi yang sulit dan tidak menguntungkan' },
                            ].map((item) => (
                              <label key={item.id} className="flex items-start space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!checklist[item.id]}
                                  onChange={() => toggleChecklist(item.id)}
                                  className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer mt-0.5 shrink-0"
                                />
                                <div className="leading-snug">
                                  <strong className="text-[#24211c]">{item.title}: </strong>
                                  <span className="text-slate-700">{item.desc}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-extrabold text-xs text-[#24211c]">
                              2. LAIN-LAIN (mengisi sendiri):
                            </label>
                            <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                              Kolom isian bebas (dapat diedit oleh admin)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Catatan tambahan kiprah pengabdian alumni..."
                            value={lainLainNote}
                            onChange={(e) => setLainLainNote(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* KONDISI D: PENGHARGAAN KHIDMAH (PENGURUS) */}
                    {isPengurus && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="text-xs font-extrabold text-[#675c37] bg-[#ede9df] px-3.5 py-1.5 rounded-xl border border-[#c3b68b]/30 flex items-center justify-between">
                          <span>Sub-Kriteria Resmi: Penghargaan Khidmah (Pengurus)</span>
                          <span className="text-[10px] font-semibold text-[#8a7c4c]">7 Kriteria Amanah Kepengurusan</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2.5">
                          <span className="font-extrabold text-xs text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                            1. KRITERIA DAN ALASAN YANG DINILAI
                          </span>
                          <div className="space-y-2.5 pt-1 text-xs">
                            {[
                              { id: 'pengurus_dedikasi', title: 'a. Dedikasi', desc: 'Memiliki dedikasi yang tinggi pada Agama, Dakwah, Pondok Pesantren Sidogiri dan/atau Madrasah Miftahul Ulum' },
                              { id: 'pengurus_ketaatan', title: 'b. Ketaatan', desc: 'Ketaatan ditunjukkan melalui ketundukan serta kepatuhan secara penuh pada titah Masyayikh dan Pengurus atasan meskipun berbeda dengan pandangan pribadinya' },
                              { id: 'pengurus_kapabilitas', title: 'c. Kapabilitas', desc: 'Yaitu kemampuan dan keahlian yang dibutuhkan untuk melakukan pekerjaannya. Biasanya berkaitan dengan kemampuan di bidangnya, nalar, kecerdasan, serta kemampuan berpikir sistematis' },
                              { id: 'pengurus_kreativitas', title: 'd. Kreativitas', desc: 'Kreativitas ditunjukkan dalam kemampuan memecahkan masalah di luar kebiasaan sehingga menjadi lebih efektif, lebih efisien, lebih cepat, dan lebih menguntungkan' },
                              { id: 'pengurus_karakter', title: 'e. Karakter', desc: 'Karakter yang baik yaitu watak dasar manusia yang ditunjukkan dalam perilaku sehari-hari, sikap, tawadhu’, kemampuan mengendalikan emosi, dan bagaimana merespon sebuah kejadian' },
                              { id: 'pengurus_kredibilitas', title: 'f. Kredibilitas', desc: 'Ditunjukkan melalui kejujuran dan integritas yang tinggi, sehingga dapat dipercaya dan diandalkan untuk memikul amanah dan tanggung jawab dengan benar' },
                              { id: 'pengurus_komitmen', title: 'g. Komitmen', desc: 'Ditunjukkan melalui kesungguhan dalam menyelesaikan tugas, walaupun dalam kondisi yang sulit dan tidak menguntungkan' },
                            ].map((item) => (
                              <label key={item.id} className="flex items-start space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!checklist[item.id]}
                                  onChange={() => toggleChecklist(item.id)}
                                  className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer mt-0.5 shrink-0"
                                />
                                <div className="leading-snug">
                                  <strong className="text-[#24211c]">{item.title}: </strong>
                                  <span className="text-slate-700">{item.desc}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-extrabold text-xs text-[#24211c]">
                              2. LAIN-LAIN (mengisi sendiri):
                            </label>
                            <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                              Kolom isian bebas (dapat diedit oleh admin)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Catatan tambahan etos kerja dan amanah kepengurusan..."
                            value={lainLainNote}
                            onChange={(e) => setLainLainNote(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* KONDISI E: SANTRI TERBAIK */}
                    {isSantri && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="text-xs font-extrabold text-[#675c37] bg-[#ede9df] px-3.5 py-1.5 rounded-xl border border-[#c3b68b]/30 flex items-center justify-between">
                          <span>Sub-Kriteria Resmi: Penghargaan Santri Terbaik</span>
                          <span className="text-[10px] font-semibold text-[#8a7c4c]">4 Kriteria Ketertiban & Adab Santri Mukim</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2">
                          <span className="font-extrabold text-xs text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                            1. KRITERIA & KETERTIBAN SANTRI
                          </span>
                          <div className="space-y-2.5 pt-1 text-xs">
                            {[
                              { id: 'santri_jamaah', label: 'a. Istiqamah shalat berjamaah 5 waktu di saf awal masjid dan wirid bersama' },
                              { id: 'santri_akhlak', label: 'b. Keluhuran akhlak, adab sopan santun terhadap Masyayikh, asatidz, dan sesama thalabah' },
                              { id: 'santri_tatatertib', label: 'c. Kebersihan catatan ketertiban asrama, bebas dari ta\'zir atau pelanggaran' },
                              { id: 'santri_taklim', label: 'd. Keaktifan dalam pengajian kitab (taklim asrama) dan kegiatan pondok' },
                            ].map((item) => (
                              <label key={item.id} className="flex items-start space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!checklist[item.id]}
                                  onChange={() => toggleChecklist(item.id)}
                                  className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer mt-0.5 shrink-0"
                                />
                                <span className="text-slate-800 leading-snug font-medium">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-extrabold text-xs text-[#24211c]">
                              2. LAIN-LAIN (mengisi sendiri):
                            </label>
                            <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                              Kolom isian bebas (dapat diedit oleh admin)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Catatan keteladanan santri mukim..."
                            value={lainLainNote}
                            onChange={(e) => setLainLainNote(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* KONDISI F: MURID TERBAIK */}
                    {isMurid && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="text-xs font-extrabold text-[#675c37] bg-[#ede9df] px-3.5 py-1.5 rounded-xl border border-[#c3b68b]/30 flex items-center justify-between">
                          <span>Sub-Kriteria Resmi: Penghargaan Murid Terbaik</span>
                          <span className="text-[10px] font-semibold text-[#8a7c4c]">3 Kriteria Prestasi Akademik MMU</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2">
                          <span className="font-extrabold text-xs text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                            1. PRESTASI AKADEMIK MADRASAH MMU
                          </span>
                          <div className="space-y-2.5 pt-1 text-xs">
                            {[
                              { id: 'murid_ujian', label: 'a. Perolehan nilai ujian (ikhtibar) caturwulan dan semester tertinggi di MMU' },
                              { id: 'murid_maknani', label: 'b. Kelengkapan, kerapian catatan kitab kuning (makna gandul), dan presensi mutlak' },
                              { id: 'murid_musyawarah', label: 'c. Keaktifan dalam musyawarah ilmiyah fathul qorib dan kedisiplinan belajar' },
                            ].map((item) => (
                              <label key={item.id} className="flex items-start space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!checklist[item.id]}
                                  onChange={() => toggleChecklist(item.id)}
                                  className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer mt-0.5 shrink-0"
                                />
                                <span className="text-slate-800 leading-snug font-medium">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-extrabold text-xs text-[#24211c]">
                              2. LAIN-LAIN (mengisi sendiri):
                            </label>
                            <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                              Kolom isian bebas (dapat diedit oleh admin)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Catatan prestasi belajar murid MMU..."
                            value={lainLainNote}
                            onChange={(e) => setLainLainNote(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Seksi 5: Skor Penilaian & Pertimbangan Khusus */}
              <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center space-x-2 text-[#8a7c4c] border-b border-[#e8e4da] pb-2.5">
                  <Scale className="w-4 h-4" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    5. Rekomendasi & Penilaian
                  </h4>
                </div>

                {isAdmin ? (
                  /* Nilai / Skor Penjuri Khusus Admin */
                  <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#24211c]">
                        Skor / Bobot Penilaian Calon (Khusus Admin Panitia)
                      </label>
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-[#8a7c4c] text-white font-black text-xs shadow-2xs">
                        <span>{score}</span>
                        <span className="text-[10px] text-[#f2eee3] font-normal">/ 100</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-full accent-[#8a7c4c] cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10.5px] text-[#7c7b77]">
                      <span>Minimal Layak (50)</span>
                      <span className="font-semibold text-[#8a7c4c]">Ambang Batas Pemenang (85)</span>
                      <span>Sempurna (100)</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-[#dcd7cb] text-xs text-[#7c7b77] flex items-center space-x-2">
                    <Info className="w-4 h-4 text-[#8a7c4c] shrink-0" />
                    <span>
                      Verifikasi skor angka dan penetapan pemenang sah dilakukan secara terpusat oleh Sidang Pleno Panitia & SK Pengasuh PPS.
                    </span>
                  </div>
                )}

                {/* Justifikasi Ringkas */}
                <div>
                  <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                    Catatan Ringkas / Rekomendasi Umum
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan catatan rekomendasi atau pertimbangan umum calon penerima..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Tombol Aksi Bawah */}
              <div className="pt-2 border-t border-[rgba(36,33,28,0.12)] flex items-center justify-between gap-3">
                <div>
                  {isAdmin && editingNomination && (
                    <button
                      type="button"
                      onClick={handleDeleteInModal}
                      className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
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
                    className="px-4 py-2.5 border border-[rgba(36,33,28,0.15)] text-[#24211c] text-xs font-bold rounded-xl hover:bg-[#f7f6f2] transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-5 py-2.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingNomination ? 'Simpan Perubahan' : (isAdmin ? 'Tambah Peserta' : 'Kirim Usulan Peserta')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Syarat & Ketentuan Kategori (Khusus Admin) */}
      {isAdmin && editingRubric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#f2eee3] text-[#8a7c4c] flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Edit Ketentuan & Syarat Penilaian
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kategori: <span className="font-bold text-[#8a7c4c]">{editingRubric.title}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRubric(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRubric} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kategori Penghargaan
                </label>
                <input
                  type="text"
                  required
                  value={editRubricTitle}
                  onChange={(e) => setEditRubricTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/40 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Label Sasaran / Badge
                  </label>
                  <input
                    type="text"
                    required
                    value={editRubricBadge}
                    onChange={(e) => setEditRubricBadge(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/40 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kuota Pemenang
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={editRubricQuota}
                    onChange={(e) => setEditRubricQuota(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/40 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Singkat Kategori
                </label>
                <textarea
                  rows={2}
                  value={editRubricDesc}
                  onChange={(e) => setEditRubricDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/40 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Edit Syarat & Ketentuan (Poin-Poin) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Ketentuan & Syarat Kelayakan ({editRubricSyarat.length} Poin)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditRubricSyarat([...editRubricSyarat, ''])}
                    className="text-[11px] font-bold text-[#8a7c4c] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Syarat</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editRubricSyarat.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-[#f2eee3] text-[#8a7c4c] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item}
                        placeholder={`Poin syarat ${idx + 1}`}
                        onChange={(e) => {
                          const updated = [...editRubricSyarat];
                          updated[idx] = e.target.value;
                          setEditRubricSyarat(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/40 focus:bg-white focus:outline-none"
                      />
                      {editRubricSyarat.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditRubricSyarat(editRubricSyarat.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Hapus poin syarat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Kriteria & Bobot Penilaian */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kriteria & Bobot Penilaian
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditRubricKriteria([...editRubricKriteria, { name: '', weight: 10 }])}
                    className="text-[11px] font-bold text-[#8a7c4c] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Kriteria</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {editRubricKriteria.map((krit, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={krit.name}
                        placeholder="Nama kriteria..."
                        onChange={(e) => {
                          const updated = [...editRubricKriteria];
                          updated[idx].name = e.target.value;
                          setEditRubricKriteria(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#8a7c4c]/40 focus:bg-white focus:outline-none"
                      />
                      <div className="flex items-center space-x-1 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={krit.weight}
                          onChange={(e) => {
                            const updated = [...editRubricKriteria];
                            updated[idx].weight = Number(e.target.value);
                            setEditRubricKriteria(updated);
                          }}
                          className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-bold text-[#8a7c4c] focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                      {editRubricKriteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditRubricKriteria(editRubricKriteria.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Hapus kriteria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingRubric(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8a7c4c] hover:bg-[#675c37] text-white text-xs font-extrabold rounded-xl shadow-sm transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

