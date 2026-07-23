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

export interface AwardCategory {
  id: string;
  title: string;
  description: string;
  badgeColor: string;
  quota: number;
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
  email?: string;
  loginTime: string;
}

export type ActiveTab = 'dashboard' | 'nominasi' | 'keuangan' | 'koordinasi' | 'sertifikat';
