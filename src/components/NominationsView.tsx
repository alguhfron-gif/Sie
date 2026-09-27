import React, { useState } from 'react';
import { Award, Plus, Search, Filter, CheckCircle2, Edit2, Trash2, Trophy, Star, UserCheck, ShieldCheck, LayoutGrid, List, Phone, Briefcase, IdCard, Sparkles, FileSpreadsheet, Download, Loader2, Scale, FileText, Building2, GraduationCap, HeartHandshake, BookOpen, Info, Check, ChevronDown, ChevronUp, Lock, X } from 'lucide-react';
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
  const [isExporting, setIsExporting] = useState(false);

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
    setNominatorName(currentUser?.name || '');
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

    const nomPayload = {
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
                          <div className="flex items-center space-x-2 text-xs text-[#7c7b77] bg-white/80 border border-[rgba(36,33,28,0.1)] px-3 py-1.5 rounded-xl font-medium">
                            <Lock className="w-3.5 h-3.5 text-[#8a7c4c]" />
                            <span>Pedoman Resmi Milad Sidogiri (Petugas Mode Baca)</span>
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

      {/* Main Participants List & Awarding Section (Khusus Admin Saja - Petugas Tidak Ditampilkan) */}
      {isAdmin && (
        <CollapsibleSection
          sectionId="nomination_list_section"
          title="Daftar Peserta Nominasi & Penganugerahan"
          subtitle="Kelola data pendaftaran, pencarian, filter, serta penetapan skor dan pemenang"
          icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
          defaultOpen={false}
          badge={
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {filteredNominations.length} Peserta
            </span>
          }
        >
        <div className="space-y-4">
          {/* Search & Filter Bar + View Toggle */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari ID PPS, nama, domisili, kelas, tingkat, alamat, atau unit kerja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-[#efede7] p-1 rounded-xl border border-[rgba(36,33,28,0.1)] text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#8a7c4c] text-white shadow-2xs' : 'text-[#7c7b77] hover:text-[#24211c]'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-[#8a7c4c] text-white shadow-2xs' : 'text-[#7c7b77] hover:text-[#24211c]'
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
            const category = categories.find((c) => c.id === nom.categoryId) || OFFICIAL_AWARD_RUBRICS.find((r) => r.id === nom.categoryId);
            const isWinner = nom.status === 'Pemenang';

            return (
              <div
                key={nom.id}
                className={`bg-white rounded-3xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                  isWinner
                    ? 'border-emerald-400 ring-1 ring-emerald-400/40 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200`}>
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
                        {isWinner && <Trophy className="w-4 h-4 text-emerald-600 inline shrink-0" />}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 font-medium mt-1">
                        {nom.domisili && <span className="text-emerald-800 font-semibold">📍 {nom.domisili}</span>}
                        {nom.kelas && <span className="text-slate-700 font-medium">• {nom.kelas}</span>}
                        {nom.tingkat && <span className="text-slate-500">• {nom.tingkat}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-xl border ${
                          nom.status === 'Pemenang'
                            ? 'bg-[#00a65a] text-white border-emerald-600 font-black'
                            : nom.status === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : nom.status === 'Penilaian'
                            ? 'bg-teal-100 text-teal-800 border-teal-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {nom.status}
                      </span>
                      <div className="text-xs text-slate-500 font-semibold mt-1">
                        Skor: <span className="text-emerald-700 font-bold">{nom.score}</span>/100
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
                    {isAdmin && !isWinner && (
                      <button
                        onClick={() => handleSetWinner(nom)}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-xl border border-emerald-300 text-[11px] transition cursor-pointer"
                      >
                        🏆 Tetapkan Pemenang
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(nom)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title={isAdmin ? "Edit Peserta" : "Lihat / Edit Detail Peserta"}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onDeleteNomination(nom.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Hapus Peserta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
                  const category = categories.find((c) => c.id === nom.categoryId) || OFFICIAL_AWARD_RUBRICS.find((r) => r.id === nom.categoryId);
                  const isWinner = nom.status === 'Pemenang';

                  return (
                    <tr key={nom.id} className="hover:bg-emerald-50/40 transition">
                      <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-emerald-700 font-bold whitespace-nowrap">
                        {nom.idPps || nom.nipNik || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                          <span>{nom.candidateName}</span>
                          {isWinner && <Trophy className="w-3.5 h-3.5 text-emerald-600 shrink-0 inline" />}
                        </div>
                        {nom.phone && <div className="text-[10px] text-emerald-700 font-mono mt-0.5">📱 {nom.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{nom.domisili || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-slate-900 font-semibold">{nom.kelas || '-'}</div>
                        {nom.tingkat && <div className="text-[10px] text-emerald-700 font-medium">{nom.tingkat}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={nom.alamat || ''}>
                        {nom.alamat || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200 whitespace-nowrap">
                          {category?.title || 'Kategori'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-emerald-700">{nom.score}/100</div>
                        <span
                          className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border mt-0.5 ${
                            nom.status === 'Pemenang'
                              ? 'bg-[#00a65a] text-white border-emerald-600 font-black'
                              : nom.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : nom.status === 'Penilaian'
                              ? 'bg-teal-100 text-teal-800 border-teal-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {nom.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isAdmin && !isWinner && (
                            <button
                              onClick={() => handleSetWinner(nom)}
                              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg border border-emerald-300 text-[10px] transition cursor-pointer"
                              title="Tetapkan Pemenang"
                            >
                              🏆 Pemenang
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(nom)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title={isAdmin ? "Edit Data Peserta" : "Lihat / Edit Detail Peserta"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => onDeleteNomination(nom.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Hapus Peserta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
      </div>
    </CollapsibleSection>
  )}

      {/* Modal Add / Edit Nomination (Form LENGKAP Data Peserta - Khusus Admin) */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 max-h-[90vh] flex flex-col my-auto">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>{editingNomination ? 'Edit Data Peserta & Nominasi' : 'Tambah Peserta / Nominasi Baru'}</span>
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Seksi 1: Data Utama Peserta (6 Field Wajib & Utama) */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
                  <IdCard className="w-3.5 h-3.5 text-emerald-600" />
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-emerald-800 font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / Telepon</label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-emerald-800 font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 3: Kategori Penghargaan & Nilai */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
                  <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kategori Penghargaan & Penilaian</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Penghargaan *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none font-semibold"
                    >
                      {(categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status Penetapan {!isAdmin && <span className="text-[10px] text-emerald-700 font-normal">(Khusus Admin)</span>}
                    </label>
                    <select
                      value={status}
                      disabled={!isAdmin}
                      onChange={(e) => setStatus(e.target.value as NominationStatus)}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-medium ${
                        !isAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none'
                      }`}
                    >
                      <option value="Draf">Draf</option>
                      <option value="Penilaian">Dalam Penilaian</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Pemenang">Pemenang Final 🏆</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nilai / Skor Penjuri (0 - 100): <span className="text-emerald-700 font-bold">{score}</span>
                    {!isAdmin && <span className="text-[10px] text-emerald-700 font-normal ml-1">(Khusus Admin)</span>}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={score}
                    disabled={!isAdmin}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className={`w-full accent-emerald-600 mt-1 ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pengusul / Nominator (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Siti Rahmawati"
                    value={nominatorName}
                    onChange={(e) => setNominatorName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <div>
                  {isAdmin && editingNomination && (
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
                    className="px-5 py-2 bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-extrabold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    {editingNomination ? 'Simpan Perubahan' : 'Tambah Peserta'}
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

