import { AwardCategory, Nomination, Transaction, CommitteeTask, InventoryItem, RundownItem, CommitteeAccount } from '../types';

export const INITIAL_CATEGORIES: AwardCategory[] = [
  {
    id: 'cat-1',
    title: 'Insan Berprestasi Utama',
    description: 'Penghargaan untuk individu dengan kontribusi akademik/non-akademik tertinggi.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    quota: 3,
  },
  {
    id: 'cat-2',
    title: 'Inovasi & Karya Kreatif',
    description: 'Apresiasi karya gagasan baru yang berdampak positif pada komunitas.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    quota: 2,
  },
  {
    id: 'cat-3',
    title: 'Panitia Duta Dedikasi',
    description: 'Apresiasi kerja keras panitia dengan loyalitas dan efisiensi terbaik.',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    quota: 5,
  },
  {
    id: 'cat-4',
    title: 'Keorganisasian Teladan',
    description: 'Penganugerahan bagi divisi/unit kerja paling responsif dan teratur.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    quota: 1,
  },
];

export const INITIAL_NOMINATIONS: Nomination[] = [
  {
    id: 'nom-1',
    idPps: 'PPS-2026-001',
    candidateName: 'Al Ghufron',
    domisili: 'Jakarta',
    kelas: 'Kelas Utama',
    tingkat: 'Tingkat Nasional',
    alamat: 'Jl. Jendral Sudirman No. 1, Jakarta Pusat',
    department: 'Divisi Teknologi Informasi',
    position: 'Senior Systems Architect',
    nipNik: 'PEG-2026-001',
    phone: '081234567890',
    achievement: 'Pengembangan Portal Digital Penganugerahan & Sistem Otomasi Terpadu',
    categoryId: 'cat-2',
    justification: 'Kontribusi luar biasa dalam sistem penganugerahan digital dan pengembangan fitur otomasi.',
    status: 'Pemenang',
    score: 98,
    nominatorName: 'Panitia Penganugerahan',
    createdAt: '2026-07-10',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-1',
    date: '2026-07-01',
    title: 'Dana Alokasi Pokok Sie Penganugerahan',
    category: 'Kas Organisasi',
    type: 'pemasukan',
    amount: 7500000,
    notes: 'Transfer dari Bendahara Umum Panitia',
    receiptNumber: 'KAS-001',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'trx-2',
    date: '2026-07-05',
    title: 'Sponsorship Utama PT Nusantara Jaya',
    category: 'Sponsor & Donasi',
    type: 'pemasukan',
    amount: 3500000,
    notes: 'Paket Sponsorship Emas',
    receiptNumber: 'SPON-002',
    proofUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'trx-3',
    date: '2026-07-08',
    title: 'Pembuatan Trofi Kristal & Plakat Kayu (10 Pcs)',
    category: 'Trofi & Plakat',
    type: 'pengeluaran',
    amount: 3200000,
    notes: 'DP 50% ke Pengrajin Trofi Surabaya',
    receiptNumber: 'NOT-102',
    proofUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'trx-4',
    date: '2026-07-12',
    title: 'Cetak Sertifikat Premium Gold Foil (50 Lembar)',
    category: 'Cetak Sertifikat',
    type: 'pengeluaran',
    amount: 650000,
    notes: 'Percetakan Digital Express',
    receiptNumber: 'NOT-108',
  },
  {
    id: 'trx-5',
    date: '2026-07-18',
    title: 'Konsumsi Rapat Pleno Penjurian Nominasi',
    category: 'Konsumsi',
    type: 'pengeluaran',
    amount: 450000,
    notes: 'Nasi Kotak 15 porsi',
    receiptNumber: 'NOT-112',
  },
];

export const INITIAL_TASKS: CommitteeTask[] = [
  {
    id: 'task-1',
    title: 'Mengarahkan & mengoordinasikan seluruh anggota Sie Penganugerahan serta pengawasan SOP',
    assignee: 'Birril Walid (Ketua)',
    status: 'Berjalan',
    priority: 'Tinggi',
    dueDate: '2026-08-01',
  },
  {
    id: 'task-2',
    title: 'Pengadaan barang sie & jalin komunikasi dengan mitra/affiliate terkait',
    assignee: 'Lailur Mubarok (Wakil Ketua)',
    status: 'Berjalan',
    priority: 'Tinggi',
    dueDate: '2026-07-28',
  },
  {
    id: 'task-3',
    title: 'Surat-menyurat, administrasi, pengadaan ATK & komunikasi dengan IASS',
    assignee: 'Majid (Sekretaris)',
    status: 'Berjalan',
    priority: 'Tinggi',
    dueDate: '2026-07-26',
  },
  {
    id: 'task-4',
    title: 'Notulensi rapat, penyusunan & pengkonsepan rangkaian acara penganugerahan',
    assignee: 'Majid (Sekretaris)',
    status: 'Selesai',
    priority: 'Tinggi',
    dueDate: '2026-07-20',
  },
  {
    id: 'task-5',
    title: 'Membuat & mengembangkan aplikasi pendukung Sie Penganugerahan (Sistem Digital)',
    assignee: 'Muzammil & Gufron',
    status: 'Selesai',
    priority: 'Tinggi',
    dueDate: '2026-07-22',
  },
  {
    id: 'task-6',
    title: 'Koordinasi antar-sie, pengelolaan keuangan sie & penyediaan konsumsi rapat',
    assignee: 'Muzammil & Gufron',
    status: 'Berjalan',
    priority: 'Tinggi',
    dueDate: '2026-07-31',
  },
  {
    id: 'task-7',
    title: 'Penyediaan data Sie Penganugerahan & komunikasi intensif dengan pihak madrasah',
    assignee: 'Ghoni',
    status: 'Berjalan',
    priority: 'Tinggi',
    dueDate: '2026-07-27',
  },
  {
    id: 'task-8',
    title: 'Pencatatan, perawatan & pemeliharaan inventaris barang/trofi sie',
    assignee: 'Farihin & Fitra',
    status: 'Berjalan',
    priority: 'Sedang',
    dueDate: '2026-07-29',
  },
  {
    id: 'task-9',
    title: 'Pengecekan kondisi inventaris sebelum & sesudah kegiatan penganugerahan',
    assignee: 'Farihin & Fitra',
    status: 'Terencana',
    priority: 'Sedang',
    dueDate: '2026-08-01',
  },
  {
    id: 'task-10',
    title: 'Mendesain kebutuhan visual (sertifikat, trofi, banner) Sie Penganugerahan',
    assignee: 'Sultan & Halim',
    status: 'Selesai',
    priority: 'Tinggi',
    dueDate: '2026-07-18',
  },
  {
    id: 'task-11',
    title: 'Mendokumentasikan seluruh rangkaian acara & mengelola arsip hasil dokumentasi',
    assignee: 'Sultan & Halim',
    status: 'Terencana',
    priority: 'Tinggi',
    dueDate: '2026-08-01',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    itemName: 'Trofi Kristal Utama',
    quantity: 10,
    unit: 'Unit',
    status: 'Menunggu Pesanan',
    notes: 'Selesai cetak tanggal 28 Juli',
  },
  {
    id: 'inv-2',
    itemName: 'Kertas Sertifikat Linen 230gsm Gold Foil',
    quantity: 50,
    unit: 'Lembar',
    status: 'Tersedia',
    notes: 'Tersimpan di ruang Sie Penganugerahan',
  },
  {
    id: 'inv-3',
    itemName: 'Map Beludru Merah Emboss Emas',
    quantity: 15,
    unit: 'Pcs',
    status: 'Tersedia',
    notes: 'Untuk penyerahan simbolis',
  },
  {
    id: 'inv-4',
    itemName: 'Stempel Resmi & Pita Satin Merah Putih',
    quantity: 2,
    unit: 'Set',
    status: 'Tersedia',
    notes: 'Kondisi baik',
  },
];

export const INITIAL_RUNDOWN: RundownItem[] = [
  {
    id: 'rd-1',
    timeSlot: '19.00 - 19.15',
    activity: 'Pembukaan Malam Penganugerahan oleh MC',
    pic: 'Divisi Acara',
    notes: 'Menyiapkan musik latar & pencahayaan panggung',
  },
  {
    id: 'rd-2',
    timeSlot: '19.15 - 19.30',
    activity: 'Sambutan Ketua Sie Penganugerahan & Laporan',
    pic: 'Ketua Sie',
    notes: 'Slide tayangan profil nominasi siap',
  },
  {
    id: 'rd-3',
    timeSlot: '19.30 - 20.30',
    activity: 'Pembacaan & Penyerahan Trofi Kategori 1 - 4',
    pic: 'Sie Penganugerahan (Pendamping)',
    notes: 'Penyerah trofi & nampan sertifikat siap di sayap panggung',
  },
  {
    id: 'rd-4',
    timeSlot: '20.30 - 21.00',
    activity: 'Foto Bersama Pemenang & Penutupan',
    pic: 'Dokumentasi & Sie Penganugerahan',
    notes: 'Penyerahan cinderamata pimpinan',
  },
];

export const INITIAL_ACCOUNTS: CommitteeAccount[] = [
  // TINGKAT ADMIN (Panitia Inti / Pimpinan)
  {
    id: '1',
    name: 'BIRRIL WALID',
    role: 'KETUA SIE PENGANUGERAHAN',
    category: 'admin',
    defaultPin: '12345678',
    badge: 'Ketua / Admin',
    avatarBg: 'bg-emerald-600 text-white font-black',
    createdAt: '2026-07-01',
  },
  {
    id: '2',
    name: 'LAILUR MUBAROK',
    role: 'WAKIL KETUA SIE',
    category: 'admin',
    defaultPin: '12345678',
    badge: 'Wakil / Admin',
    avatarBg: 'bg-emerald-700 text-white font-extrabold',
    createdAt: '2026-07-01',
  },
  {
    id: '3',
    name: 'MAJID',
    role: 'SEKRETARIS SIE',
    category: 'admin',
    defaultPin: '12345678',
    badge: 'Sekretaris / Admin',
    avatarBg: 'bg-teal-600 text-white font-bold',
    createdAt: '2026-07-01',
  },

  // TINGKAT PETUGAS (Petugas Lapangan & Operasional)
  {
    id: '4',
    name: 'MUZAMMIL & GUFRON',
    role: 'PETUGAS SISTEM & KOORDINASI',
    category: 'petugas',
    defaultPin: '1234',
    badge: 'Petugas Sistem',
    avatarBg: 'bg-sky-500 text-white font-bold',
    createdAt: '2026-07-01',
  },
  {
    id: '5',
    name: 'GHONI',
    role: 'PETUGAS PENGADAAN & MADRASAH',
    category: 'petugas',
    defaultPin: '1234',
    badge: 'Petugas Pengadaan',
    avatarBg: 'bg-emerald-600 text-white font-bold',
    createdAt: '2026-07-01',
  },
  {
    id: '6',
    name: 'FARIHIN & FITRA',
    role: 'PETUGAS INVENTARIS & LOGISTIK',
    category: 'petugas',
    defaultPin: '1234',
    badge: 'Petugas Logistik',
    avatarBg: 'bg-purple-600 text-white font-bold',
    createdAt: '2026-07-01',
  },
  {
    id: '7',
    name: 'SULTAN & HALIM',
    role: 'PETUGAS DESAIN & DOKUMENTASI',
    category: 'petugas',
    defaultPin: '1234',
    badge: 'Petugas Media',
    avatarBg: 'bg-rose-500 text-white font-bold',
    createdAt: '2026-07-01',
  },
];

export const INITIAL_DOCUMENTS: import('../types').OfficialDocument[] = [
  {
    id: 'doc-1',
    docNumber: 'SK/001/PENG/VII/2026',
    title: 'Surat Keputusan Pembentukan & Susunan Panitia Sie Penganugerahan 2026',
    category: 'SK Panitia',
    date: '2026-07-01',
    sender: 'Ketua Panitia Pelaksana',
    content: `MEMUTUSKAN:
1. Menetapkan Susunan Panitia Khusus Sie Penganugerahan Tahun 2026.
2. Memberikan wewenang penuh kepada Sie Penganugerahan untuk mengelola penjurian, administrasi nominasi, pengadaan trofi, serta pelaksanaan penganugerahan.
3. Surat Keputusan ini berlaku sejak tanggal ditetapkan hingga seluruh rangkaian kegiatan usai.`,
    status: 'Diterbitkan',
  },
  {
    id: 'doc-2',
    docNumber: '002/PENG-EDR/VII/2026',
    title: 'Surat Edaran Panduan & Tata Cara Pengusulan Calon Nominasi Penerima Anugerah',
    category: 'Surat Edaran',
    date: '2026-07-05',
    sender: 'Sekretaris Sie Penganugerahan',
    content: `Diberitahukan kepada seluruh pimpinan unit, pengurus, dan PPS bahwa pengusulan kandidat nominasi telah dibuka.
Persyaratan:
- Mengisi formulir usulan nominasi secara digital/manual.
- Melampirkan berkas bukti rekam jejak & prestasi.
- Batas akhir pengiriman berkas: 25 Juli 2026.`,
    status: 'Diterbitkan',
  },
  {
    id: 'doc-3',
    docNumber: '003/PENG-UND/VII/2026',
    title: 'Surat Undangan Perhelatan Malam Penganugerahan & Penyerahan Trofi',
    category: 'Surat Undangan',
    date: '2026-07-15',
    sender: 'Panitia Sie Penganugerahan',
    content: `Mengharap kehadiran Bapak/Ibu/Saudara pada Malam Anugerah Penganugerahan yang akan dilaksanakan pada:
Hari/Tanggal: Sabtu, 1 Agustus 2026
Waktu: Pukul 19.00 WIB - Selesai
Tempat: Gedung Utama Penganugerahan
Pakaian: Busana Resmi / Batik / Jas Organisasi`,
    status: 'Diterbitkan',
  },
  {
    id: 'doc-4',
    docNumber: '004/PENG-PMH/VII/2026',
    title: 'Surat Permohonan Verifikasi Data PPS & Madrasah Pendukung',
    category: 'Surat Permohonan',
    date: '2026-07-18',
    sender: 'Sie Penganugerahan (Bagian Data)',
    content: `Permohonan sinkronisasi dan verifikasi keabsahan data para calon penerima penghargaan dari unit madrasah & PPS terkait demi kelancaran penjurian.`,
    status: 'Diterbitkan',
  },
];

export const INITIAL_REGULATIONS: import('../types').RegulationRule[] = [
  {
    id: 'reg-1',
    section: 'Ketentuan Umum',
    title: 'Persyaratan Dasar Calon Penerima Anugerah',
    description: 'Seluruh kandidat penerima penghargaan wajib memenuhi standar kualifikasi etika dan rekam jejak berikut:',
    points: [
      'Memiliki dedikasi, integritas, dan loyalitas yang tinggi terhadap organisasi/lembaga.',
      'Bebas dari sanksi pelanggaran tata tertib dan memiliki rekam jejak positif.',
      'Menyampaikan kelengkapan berkas pendukung prestasi / kontribusi nyata.',
      'Disetujui oleh pimpinan unit atau tim verifikasi teknis.',
    ],
    lastUpdated: '2026-07-10',
  },
  {
    id: 'reg-2',
    section: 'Kriteria Penilaian',
    title: 'Sistem & Bobot Penilaian Penjurian (Scoring)',
    description: 'Proses penjurian menggunakan pembobotan komprehensif dari 3 aspek utama:',
    points: [
      'Bobot Prestasi / Karya Nyata (40%): Tingkat dampak, inovasi, dan pengakuan publik.',
      'Bobot Dedikasi & Loyalitas (35%): Keaktifan, keikutsertaan, dan konsistensi pengabdian.',
      'Bobot Etika & Rekomendasi (25%): Penilaian sikap, persetujuan pimpinan, dan verifikasi berkas.',
      'Skor akhir minimal untuk ditetapkan sebagai Pemenang adalah 85.',
    ],
    lastUpdated: '2026-07-12',
  },
  {
    id: 'reg-3',
    section: 'Tata Tertib Acara',
    title: 'Prosedur & Protokol Panggung Penyerahan Anugerah',
    description: 'Tata cara wajib yang dipatuhi saat prosesi penganugerahan berlangung di atas panggung:',
    points: [
      'Pemenang wajib hadir di ruang transit 30 menit sebelum acara dimulai.',
      'Pemenang dipanggil secara berurutan sesuai nomor urut kategori.',
      'Pendamping penganugerahan menyerahkan trofi dan sertifikat di atas panggung utama.',
      'Prosesi dilanjutkan dengan sesi foto resmi bersama pimpinan & dokumentasi media.',
    ],
    lastUpdated: '2026-07-15',
  },
];

