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

  // 2. Identitas Peserta / Ranting yang Diusulkan
  candidateDomisiliType?: 'PPS' | 'LPPS' | string;

  // 3. Rubrik Penilaian Dinamis (Checklist Centang & Isian Bebas)
  evaluationChecklist?: Record<string, boolean>;
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

export interface UserSession {
  id: string;
  name: string;
  role: string;
  category?: 'admin' | 'petugas';
  authType?: 'committee' | 'firebase';
  email?: string;
  loginTime: string;
}

export interface CommitteeAccount {
  id: string;
  name: string;
  role: string;
  category: 'admin' | 'petugas';
  defaultPin: string;
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

