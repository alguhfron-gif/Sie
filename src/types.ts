export type TransactionType = 'pemasukan' | 'pengeluaran';

export type TransactionCategory =
  | 'Sponsor & Donasi'
  | 'Kas Organisasi'
  | 'Trofi & Plakat'
  | 'Cetak Sertifikat'
  | 'Konsumsi'
  | 'Dekorasi & Panggung'
  | 'Dokumentasi & Media'
  | 'Lain-lain';

export interface Transaction {
  id: string;
  date: string;
  title: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  notes?: string;
  receiptNumber?: string;
  proofUrl?: string;
}

export type NominationStatus = 'Draf' | 'Penilaian' | 'Disetujui' | 'Pemenang';

export interface AwardCategoryCriterion {
  name: string;
  weight: number;
}

export interface AwardCategory {
  id: string;
  title: string;
  description: string;
  badgeColor: string;
  quota: number;
  requirements?: string[];
  criteria?: AwardCategoryCriterion[];
}

export interface GuruIdentityItem {
  idPersonalia: string;
  nama: string;
  domisiliAlamat: string;
  jabatan: string;
  checklist?: Record<string, boolean>;
  lainLainNote?: string;
}

export interface SantriMuridIdentityItem {
  idPersonalia: string;
  nama: string;
  domisiliAlamat: string;
  jenjangTingkat?: 'Aliyah' | 'Tsanawiyah' | 'Ibtidaiyah' | 'Idadiyah' | string;
  nilaiImda1: string;
  nilaiImda2: string;
  nilaiSemester1Aly: string;
  presensiKehadiran: string;
  checklist?: Record<string, boolean>;
  alasanPenilaian?: string;
  lainLainNote?: string;
  kriteriaReasons?: Record<string, string>;
}

export interface Nomination {
  id: string;
  idPps?: string;
  candidateName: string; // Nama
  domisili?: string;
  kelas?: string;
  tingkat?: string;
  alamat?: string;
  department?: string;
  position?: string;
  nipNik?: string;
  phone?: string;
  achievement?: string;
  categoryId: string;
  justification: string;
  status: NominationStatus;
  score: number;
  photoUrl?: string;
  nominatorName: string;
  createdAt: string;

  // 1. Identitas Pengusul
  pengusulNama?: string;
  pengusulJabatan?: string;
  pengusulDomisili?: 'PPS' | 'LPPS' | string;
  pengusulAlamat?: string;
  pengusulPhone?: string;

  // 2. Identitas Peserta / Ranting yang Diusulkan
  candidateDomisiliType?: 'PPS' | 'LPPS' | string;

  // Identitas Khusus Penghargaan Khidmah (Guru): 5 Identitas Terstruktur
  guruIdentitas?: GuruIdentityItem[];

  // Identitas Khusus Penghargaan Santri Terbaik & Murid Terbaik: 2 Identitas Terstruktur
  santriMuridIdentitas?: SantriMuridIdentityItem[];

  // 3. Rubrik Penilaian Dinamis (Checklist Centang & Isian Bebas)
  evaluationChecklist?: Record<string, boolean>;
  alumniCriteriaReasons?: Record<string, string>;
  alasanLain?: string;
  integritasNote?: string;
  transparansiLaporanNote?: string;
  lainLainNote?: string;
}

export type TaskStatus = 'Terencana' | 'Berjalan' | 'Selesai';
export type TaskPriority = 'Rendah' | 'Sedang' | 'Tinggi';

export interface CommitteeTask {
  id: string;
  title: string;
  assignee: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: 'Tersedia' | 'Menunggu Pesanan' | 'Perlu Tambah';
  notes?: string;
}

export interface RundownItem {
  id: string;
  timeSlot: string;
  activity: string;
  pic: string;
  notes?: string;
}

export type AccountRoleType =
  | 'panitia'
  | 'madrasah'
  | 'alumni'
  | 'pengurus_instansi'
  | 'pengurus_daerah';

export interface UserSession {
  id: string;
  idPersonalia?: string;
  name: string;
  role: string;
  category?: 'admin' | 'petugas';
  accountType?: AccountRoleType;
  authType?: 'committee' | 'firebase';
  email?: string;
  loginTime: string;
  domisili?: 'PPS' | 'LPPS' | string;
  alamat?: string;
  phone?: string;
}

export interface CommitteeAccount {
  id: string;
  idPersonalia?: string; // ID Personalia resmi panitia (contoh: PERS-001)
  name: string;
  role: string; // Jabatan resmi
  category: 'admin' | 'petugas';
  accountType?: AccountRoleType; // 5 Pilihan: panitia | madrasah | alumni | pengurus_instansi | pengurus_daerah
  defaultPin: string; // Password / PIN lebih dari 6 angka
  badge: string;
  avatarBg?: string;
  createdAt?: string;
}

export interface OfficialDocument {
  id: string;
  docNumber: string;
  title: string;
  category: 'SK Panitia' | 'Surat Edaran' | 'Surat Undangan' | 'Surat Permohonan' | 'Lainnya';
  date: string;
  sender: string;
  content: string;
  status: 'Diterbitkan' | 'Draf' | 'Arsip';
  fileUrl?: string;
}

export interface RegulationRule {
  id: string;
  section: string; // e.g. 'Ketentuan Umum', 'Kriteria Penilaian', 'Tata Tertib Acara'
  title: string;
  description: string;
  points: string[];
  lastUpdated: string;
}

export type ActiveTab = 'dashboard' | 'nominasi' | 'keuangan' | 'koordinasi' | 'sertifikat' | 'surat' | 'akun';

