import React, { useState, useEffect } from 'react';
import { Award, Plus, Search, Filter, CheckCircle2, Edit2, Trash2, Trophy, Star, UserCheck, ShieldCheck, LayoutGrid, List, Phone, Briefcase, IdCard, Sparkles, FileSpreadsheet, Download, Loader2, Scale, FileText, FileCheck, Building2, GraduationCap, HeartHandshake, BookOpen, Info, Check, ChevronDown, ChevronUp, Lock, X, CheckSquare, Users, ClipboardCheck, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import ExcelJS from 'exceljs';
import { AwardCategory, Nomination, NominationStatus, UserSession, GuruIdentityItem, SantriMuridIdentityItem } from '../types';
import { sendWebhookPayload, exportToCSV } from '../services/webhookService';
import { ContentHeader } from './ContentHeader';
import { CollapsibleSection } from './CollapsibleSection';
import { getAllowedCategoryIdsForUser, getRoleOptionById } from '../utils/accountRoles';

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

export const GURU_CRITERIA_LIST = [
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
];

export const ALUMNI_CRITERIA_LIST = [
  { id: 'alumni_dedikasi', title: 'a. Dedikasi', desc: 'Memiliki dedikasi yang tinggi pada Agama, Dakwah, Pondok Pesantren Sidogiri dan/atau Madrasah Miftahul Ulum' },
  { id: 'alumni_ketaatan', title: 'b. Ketaatan', desc: 'Ketaatan ditunjukkan dengan ketundukan serta kepatuhan secara penuh pada titah Masyayikh dan Pengurus atasan, serta aturan yang telah ditetapkan, meskipun tidak searah dengan pandangan pribadinya. Termasuk juga keaktifan mengikuti kegiatan IASS' },
  { id: 'alumni_kapabilitas', title: 'c. Kapabilitas', desc: 'Yaitu kemampuan dan keahlian yang dibutuhkan untuk melakukan pekerjaannya, seperti mengajar, berniaga, bertani, dls. Biasanya hal ini berkaitan dengan kemampuan di bidangnya, nalar, kecerdasan, serta cara berpikir sistematis' },
  { id: 'alumni_kapasitas', title: 'd. Kapasitas', desc: 'Yaitu kapasitas maksimum atau potensi kemampuan seseorang yang ditunjukkan dengan keahlian memecahkan masalah (problem solving skill) di tengah-tengah masyarakatnya' },
  { id: 'alumni_kreativitas', title: 'e. Kreativitas', desc: 'Kreativitas ditunjukan dengan karya atau pekerjaaan yang tidak biasa dilakukan oleh orang banyak, yang manfaatnya dapat dirasakan oleh agama, masyarakat dan atau Ikatan Alumni Santri Sidogiri' },
  { id: 'alumni_karakter', title: 'f. Karakter', desc: 'Karakter yang baik yaitu watak dasar manusia yang ditunjukkan dalam perilaku sehari-hari, seperti sikap tawadhu’, kemampuan mengendalikan emosi, dan bagaimana merespon sebuah kejadian' },
  { id: 'alumni_kredibilitas', title: 'g. Kredibilitas', desc: 'Ditunjukkan dengan kejujuran dan integritas yang tinggi, sehingga dapat dipercaya dan diandalkan untuk memikul amanah dan tanggung jawab dengan benar' },
  { id: 'alumni_komitmen', title: 'h. Komitmen', desc: 'Ditunjukkan dengan kesungguhan menyelesaikan tugas dan kewajiban, walaupun dalam kondisi yang sulit dan tidak menguntungkan' },
];

export const PENGURUS_CRITERIA_LIST = [
  { id: 'pengurus_dedikasi', title: 'a. Dedikasi', desc: 'Memiliki dedikasi yang tinggi pada Agama, Dakwah, Pondok Pesantren Sidogiri dan/atau Madrasah Miftahul Ulum' },
  { id: 'pengurus_ketaatan', title: 'b. Ketaatan', desc: 'Ketaatan ditunjukkan melalui ketundukan serta kepatuhan secara penuh pada titah Masyayikh dan Pengurus atasan meskipun berbeda dengan pandangan pribadinya' },
  { id: 'pengurus_kapabilitas', title: 'c. Kapabilitas', desc: 'Kemampuan dan keahlian yang dibutuhkan untuk melakukan pekerjaannya (bidang keahlian, nalar, kecerdasan, berpikir sistematis)' },
  { id: 'pengurus_kreativitas', title: 'd. Kreativitas', desc: 'Kemampuan memecahkan masalah di luar kebiasaan sehingga lebih efektif, efisien, cepat, dan menguntungkan' },
  { id: 'pengurus_karakter', title: 'e. Karakter', desc: 'Watak dasar manusia dalam perilaku sehari-hari, sikap, tawadhu’, kemampuan mengendalikan emosi, dan merespon kejadian' },
  { id: 'pengurus_kredibilitas', title: 'f. Kredibilitas', desc: 'Kejujuran dan integritas yang tinggi, sehingga dapat dipercaya dan diandalkan memikul amanah' },
  { id: 'pengurus_komitmen', title: 'g. Komitmen', desc: 'Kesungguhan dalam menyelesaikan tugas, walaupun dalam kondisi yang sulit dan tidak menguntungkan' },
];

export const SANTRI_CRITERIA_LIST = [
  { id: 'santri_jamaah', label: 'a. Istiqamah shalat berjamaah 5 waktu di saf awal masjid dan wirid bersama' },
  { id: 'santri_akhlak', label: 'b. Keluhuran akhlak, adab sopan santun terhadap Masyayikh, asatidz, dan sesama thalabah' },
  { id: 'santri_tatatertib', label: 'c. Kebersihan catatan ketertiban asrama, bebas dari ta\'zir atau pelanggaran' },
  { id: 'santri_taklim', label: 'd. Keaktifan dalam pengajian kitab (taklim asrama) dan kegiatan pondok' },
];

export const MURID_CRITERIA_LIST = [
  { id: 'murid_ujian', label: 'a. Perolehan nilai ujian (ikhtibar) caturwulan dan semester tertinggi di MMU' },
  { id: 'murid_maknani', label: 'b. Kelengkapan, kerapian catatan kitab kuning (makna gandul), dan presensi mutlak' },
  { id: 'murid_musyawarah', label: 'c. Keaktifan dalam musyawarah ilmiyah fathul qorib dan kedisiplinan belajar' },
];

export const RANTING_PRESTASI_MAP: Record<string, string> = {
  ranting_prestasi_imda: 'Nilai Imda/Imni',
  ranting_prestasi_almiftah: 'Nilai Ujian al-Miftah',
  ranting_prestasi_muammar: 'Nilai Muammar',
};

export const RANTING_LOYALITAS_MAP: Record<string, string> = {
  ranting_loyalitas_laporan_bulanan: 'Laporan Bulanan',
  ranting_loyalitas_laporan_lisan_triwulan: 'Laporan Lisan Triwulan',
  ranting_loyalitas_kurikulum: 'Pelaksanaan Kurikulum',
  ranting_loyalitas_pedoman_kerantingan: 'Pelaksanaan Pedoman Kerantingan',
  ranting_loyalitas_akreditasi_batartama: 'Hasil Akreditasi Batartama',
  ranting_loyalitas_rapim: 'Rapim I & II',
  ranting_loyalitas_keaktifan_pembinaan: 'Keaktifan Ikut Pembinaan',
};

export const GURU_CRITERIA_MAP: Record<string, string> = {
  guru_dedikasi: 'Memiliki dedikasi yang tinggi pada Agama, Dakwah, PP Sidogiri & MMU',
  guru_disiplin_tatatertib: 'Selalu disiplin dan taat pada tata tertib Madrasah & Pondok Pesantren Sidogiri',
  guru_teladan_akhlak: 'Menjadi teladan bagi murid dalam bertutur kata, bersikap, beribadah serta akhlak karimah',
  guru_materi_aswaja: 'Menguasai materi pembelajaran Ahlussunnah wal Jamaah dengan sangat baik',
  guru_penjelasan_lugas: 'Mampu memberikan penjelasan dengan baik, jelas, lugas, dan tepat',
  guru_hadir_kbm: 'Selalu hadir/keluar tepat waktu pada proses KBM di kelas',
  guru_bimbing_disiplin: 'Selalu gigih mengingatkan dan membimbing murid untuk selalu berperilaku baik dan disiplin',
  guru_tegur_sanksi: 'Selalu menegur atau memberikan sanksi kepada murid yang melanggar tata tertib',
  guru_tamrin_masal: 'Selalu melaksanakan tamrin masal dengan tertib dan tepat waktu',
  guru_kegiatan_madrasah: 'Selalu hadir pada kegiatan madrasah lainnya (gerak batin dll)',
  guru_ramah_senyum: 'Ramah dan enak diajak bicara serta murah senyum',
  guru_bersahabat_muruah: 'Dekat dan bersahabat dengan murid dengan tetap menjaga wibawa dan muru’ah guru',
  guru_bersih_rapi: 'Selalu berpenampilan bersih, rapi, wangi, serasi, dan enak dipandang',
};

export const SANTRI_CRITERIA_MAP: Record<string, string> = {
  santri_jamaah: 'Istiqamah shalat berjamaah 5 waktu di saf awal masjid dan wirid bersama',
  santri_akhlak: 'Keluhuran akhlak, adab sopan santun terhadap Masyayikh, asatidz, dan sesama thalabah',
  santri_tatatertib: 'Kebersihan catatan ketertiban asrama, bebas dari ta\'zir atau pelanggaran',
  santri_taklim: 'Keaktifan dalam pengajian kitab (taklim asrama) dan kegiatan pondok',
};

export const MURID_CRITERIA_MAP: Record<string, string> = {
  murid_ujian: 'Perolehan nilai ujian (ikhtibar) caturwulan dan semester tertinggi di MMU',
  murid_maknani: 'Kelengkapan, kerapian catatan kitab kuning (makna gandul), dan presensi mutlak',
  murid_musyawarah: 'Keaktifan dalam musyawarah ilmiyah fathul qorib dan kedisiplinan belajar',
};

export const ALUMNI_CRITERIA_MAP: Record<string, string> = {
  alumni_dedikasi: 'Dedikasi tinggi pada Agama, Dakwah, PP Sidogiri / MMU',
  alumni_ketaatan: 'Ketaatan penuh pada titah Masyayikh dan Pengurus atasan',
  alumni_kapabilitas: 'Kapabilitas dan keahlian di bidangnya, nalar, dan berpikir sistematis',
  alumni_kapasitas: 'Kapasitas dan keahlian memecahkan masalah di tengah masyarakat',
  alumni_kreativitas: 'Kreativitas pekerjaan yang manfaatnya dirasakan masyarakat / IASS',
  alumni_karakter: 'Karakter baik, tawadhu’, dan mengendalikan emosi',
  alumni_kredibilitas: 'Kredibilitas, kejujuran dan integritas tinggi',
  alumni_komitmen: 'Komitmen kesungguhan menyelesaikan tugas dalam kondisi sulit',
};

export const PENGURUS_CRITERIA_MAP: Record<string, string> = {
  pengurus_dedikasi: 'Dedikasi tinggi pada Agama, Dakwah, PP Sidogiri / MMU',
  pengurus_ketaatan: 'Ketaatan penuh pada titah Masyayikh dan Pengurus atasan',
  pengurus_kapabilitas: 'Kapabilitas dan keahlian di bidangnya',
  pengurus_kreativitas: 'Kreativitas dalam memecahkan masalah',
  pengurus_karakter: 'Karakter baik, tawadhu’, dan mengendalikan emosi',
  pengurus_kredibilitas: 'Kredibilitas, kejujuran dan integritas tinggi',
  pengurus_komitmen: 'Komitmen kesungguhan menyelesaikan tugas',
};

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

// Konversi aman nilai apapun ke lowercase string agar tidak pernah throw "toLowerCase is not a function"
const toSafeLower = (val: unknown): string => {
  if (typeof val === 'string') return val.toLowerCase().trim();
  if (typeof val === 'number') return String(val).toLowerCase().trim();
  return '';
};

// Helper ketat untuk memastikan HANYA Penghargaan Khidmah (Guru) yang memuat 5 identitas
// Kata "pengurus" mengandung substring "guru" (penGURUs), sehingga wajib diproteksi agar Pengurus TETAP 1 identitas
export const isGuruCategoryItem = (id?: unknown, title?: unknown): boolean => {
  const safeId = toSafeLower(id);
  const safeTitle = toSafeLower(title);

  // Pengurus (cat-4) dan kategori lain BUKAN Guru, wajib cuma 1 identitas!
  if (safeId === 'cat-4' || safeId === '4' || safeId.includes('pengurus') || safeTitle.includes('pengurus')) {
    return false;
  }

  // Khusus Penghargaan Khidmah (Guru)
  return (
    safeId === 'cat-2' ||
    safeId === '2' ||
    safeId === 'guru' ||
    /\bguru\b/i.test(safeTitle) ||
    /\basatidz\b/i.test(safeTitle)
  );
};

export const isPengurusCategoryItem = (id?: unknown, title?: unknown): boolean => {
  const safeId = toSafeLower(id);
  const safeTitle = toSafeLower(title);
  return safeId === 'cat-4' || safeId === '4' || safeId.includes('pengurus') || safeTitle.includes('pengurus');
};

export const isSantriMuridCategoryItem = (id?: unknown, title?: unknown): boolean => {
  const safeId = toSafeLower(id);
  const safeTitle = toSafeLower(title);
  return (
    safeId === 'cat-5' ||
    safeId === '5' ||
    safeId === 'cat-6' ||
    safeId === '6' ||
    safeId.includes('santri') ||
    safeTitle.includes('santri') ||
    safeId.includes('murid') ||
    safeTitle.includes('murid')
  );
};

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

  // Allowed categories based on the 5 Account Role Options
  const allowedCategoryIds = React.useMemo(() => {
    return getAllowedCategoryIdsForUser(currentUser);
  }, [currentUser]);

  const visibleAwardRubrics = React.useMemo(() => {
    if (isAdmin) return OFFICIAL_AWARD_RUBRICS;
    return OFFICIAL_AWARD_RUBRICS.filter((r) => allowedCategoryIds.includes(r.id));
  }, [isAdmin, allowedCategoryIds]);

  const userRoleOption = React.useMemo(() => {
    return getRoleOptionById(currentUser?.accountType || (currentUser?.category === 'admin' ? 'panitia' : 'madrasah'));
  }, [currentUser]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenOpenDirectly);
  const [editingNomination, setEditingNomination] = useState<Nomination | null>(null);

  // Active rubric tab ID for full view (defaults to user's first allowed category)
  const [activeRubricId, setActiveRubricId] = useState<string>(() => {
    const allowed = getAllowedCategoryIdsForUser(currentUser);
    return allowed[0] || 'cat-1';
  });

  useEffect(() => {
    const allowed = getAllowedCategoryIdsForUser(currentUser);
    if (allowed.length > 0 && !allowed.includes(activeRubricId)) {
      setActiveRubricId(allowed[0]);
    }
  }, [currentUser, activeRubricId]);

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
  const [pengusulPhone, setPengusulPhone] = useState(currentUser?.phone || '');

  // Auto-sync identitas pengusul saat sesi login berubah atau tersedia
  useEffect(() => {
    if (!editingNomination && currentUser) {
      const activeName = currentUser.name || currentUser.email || '';
      const activeRole = currentUser.role || '';
      if (activeName) setPengusulNama(activeName);
      if (activeRole) setPengusulJabatan(activeRole);
      if (currentUser.domisili) setPengusulDomisili(currentUser.domisili === 'LPPS' ? 'LPPS' : 'PPS');
      if (currentUser.alamat) setPengusulAlamat(currentUser.alamat);
      if (currentUser.phone) setPengusulPhone(currentUser.phone);
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

  // Identitas Khusus Penghargaan Khidmah (Guru): 5 Identitas Terstruktur (id personalia, nama, dom/alamat, jabatan, checklist, lainLainNote)
  const defaultGuruIdentitas: GuruIdentityItem[] = [
    { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
    { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
    { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
    { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
    { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
  ];
  const [guruIdentitas, setGuruIdentitas] = useState<GuruIdentityItem[]>(defaultGuruIdentitas);

  const updateGuruIdentitas = (index: number, field: keyof GuruIdentityItem, value: any) => {
    setGuruIdentitas((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleGuruChecklist = (guruIndex: number, criterionId: string) => {
    setGuruIdentitas((prev) => {
      const copy = [...prev];
      const curChecklist = copy[guruIndex]?.checklist || {};
      copy[guruIndex] = {
        ...copy[guruIndex],
        checklist: {
          ...curChecklist,
          [criterionId]: !curChecklist[criterionId],
        },
      };
      return copy;
    });
  };

  const checkAllGuru = (guruIndex: number) => {
    setGuruIdentitas((prev) => {
      const copy = [...prev];
      const allChecked: Record<string, boolean> = {};
      GURU_CRITERIA_LIST.forEach((c) => {
        allChecked[c.id] = true;
      });
      copy[guruIndex] = {
        ...copy[guruIndex],
        checklist: allChecked,
      };
      return copy;
    });
  };

  const uncheckAllGuru = (guruIndex: number) => {
    setGuruIdentitas((prev) => {
      const copy = [...prev];
      copy[guruIndex] = {
        ...copy[guruIndex],
        checklist: {},
      };
      return copy;
    });
  };

  // Identitas Khusus Penghargaan Santri Terbaik & Murid Terbaik: 2 Identitas Terstruktur
  const defaultSantriMuridIdentitas: SantriMuridIdentityItem[] = [
    { idPersonalia: '', nama: '', domisiliAlamat: '', nilaiImda1: '', nilaiImda2: '', nilaiSemester1Aly: '', presensiKehadiran: '', checklist: {}, lainLainNote: '' },
    { idPersonalia: '', nama: '', domisiliAlamat: '', nilaiImda1: '', nilaiImda2: '', nilaiSemester1Aly: '', presensiKehadiran: '', checklist: {}, lainLainNote: '' },
  ];
  const [santriMuridIdentitas, setSantriMuridIdentitas] = useState<SantriMuridIdentityItem[]>(defaultSantriMuridIdentitas);

  const updateSantriMuridIdentitas = (index: number, field: keyof SantriMuridIdentityItem, value: any) => {
    setSantriMuridIdentitas((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleSantriMuridChecklist = (index: number, criterionId: string) => {
    setSantriMuridIdentitas((prev) => {
      const copy = [...prev];
      const curChecklist = copy[index]?.checklist || {};
      copy[index] = {
        ...copy[index],
        checklist: {
          ...curChecklist,
          [criterionId]: !curChecklist[criterionId],
        },
      };
      return copy;
    });
  };

  const checkAllSantriMurid = (index: number, criteriaList: { id: string }[]) => {
    setSantriMuridIdentitas((prev) => {
      const copy = [...prev];
      const allChecked: Record<string, boolean> = {};
      criteriaList.forEach((c) => {
        allChecked[c.id] = true;
      });
      copy[index] = {
        ...copy[index],
        checklist: allChecked,
      };
      return copy;
    });
  };

  const uncheckAllSantriMurid = (index: number) => {
    setSantriMuridIdentitas((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        checklist: {},
      };
      return copy;
    });
  };

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
  const [alumniCriteriaReasons, setAlumniCriteriaReasons] = useState<Record<string, string>>({});

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle Modal Open (Otomatis mengisi identitas pengusul dari akun login)
  const handleOpenAdd = (preferredCatId?: string) => {
    setEditingNomination(null);
    const resolvedName = currentUser?.name || currentUser?.email || 'Panitia Sie Penganugerahan';
    const resolvedRole = currentUser?.role || (isAdmin ? 'Panitia Inti Penganugerahan' : 'Petugas Lapangan');

    setPengusulNama(resolvedName);
    setPengusulJabatan(resolvedRole);
    setPengusulDomisili('PPS');
    setPengusulAlamat('Pondok Pesantren Sidogiri, Kraton, Pasuruan');
    setPengusulPhone(currentUser?.phone || '');

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
    setCategoryId(preferredCatId || activeRubricId || categories[0]?.id || 'cat-1');
    setJustification('');
    setStatus('Penilaian');
    setScore(85);
    setNominatorName(resolvedName);

    setChecklist({});
    setAlasanLain('');
    setIntegritasNote('');
    setTransparansiLaporanNote('');
    setLainLainNote('');
    setAlumniCriteriaReasons({});
    setGuruIdentitas([
      { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
      { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
      { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
      { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
      { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
    ]);
    setSantriMuridIdentitas([
      { idPersonalia: '', nama: '', domisiliAlamat: '', jenjangTingkat: 'Aliyah', nilaiImda1: '', nilaiImda2: '', nilaiSemester1Aly: '', presensiKehadiran: '', checklist: {}, alasanPenilaian: '', lainLainNote: '' },
      { idPersonalia: '', nama: '', domisiliAlamat: '', jenjangTingkat: 'Aliyah', nilaiImda1: '', nilaiImda2: '', nilaiSemester1Aly: '', presensiKehadiran: '', checklist: {}, alasanPenilaian: '', lainLainNote: '' },
    ]);

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
    setPengusulPhone(nom.pengusulPhone || currentUser?.phone || '');

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
    setAlumniCriteriaReasons(nom.alumniCriteriaReasons || {});

    // Restore 5 Guru identities if available, otherwise blank 5 items
    if (nom.guruIdentitas && nom.guruIdentitas.length > 0) {
      const merged: GuruIdentityItem[] = [0, 1, 2, 3, 4].map((i) => ({
        idPersonalia: nom.guruIdentitas?.[i]?.idPersonalia || '',
        nama: nom.guruIdentitas?.[i]?.nama || '',
        domisiliAlamat: nom.guruIdentitas?.[i]?.domisiliAlamat || '',
        jabatan: nom.guruIdentitas?.[i]?.jabatan || '',
        checklist: nom.guruIdentitas?.[i]?.checklist || (i === 0 ? nom.evaluationChecklist || {} : {}),
        lainLainNote: nom.guruIdentitas?.[i]?.lainLainNote || (i === 0 ? nom.lainLainNote || '' : ''),
      }));
      setGuruIdentitas(merged);
    } else {
      setGuruIdentitas([
        { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
        { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
        { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
        { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
        { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '', checklist: {}, lainLainNote: '' },
      ]);
    }

    // Restore 2 Santri/Murid identities if available, otherwise blank 2 items
    if (nom.santriMuridIdentitas && nom.santriMuridIdentitas.length > 0) {
      const mergedSM: SantriMuridIdentityItem[] = [0, 1].map((i) => ({
        idPersonalia: nom.santriMuridIdentitas?.[i]?.idPersonalia || '',
        nama: nom.santriMuridIdentitas?.[i]?.nama || '',
        domisiliAlamat: nom.santriMuridIdentitas?.[i]?.domisiliAlamat || '',
        jenjangTingkat: nom.santriMuridIdentitas?.[i]?.jenjangTingkat || 'Aliyah',
        nilaiImda1: nom.santriMuridIdentitas?.[i]?.nilaiImda1 || '',
        nilaiImda2: nom.santriMuridIdentitas?.[i]?.nilaiImda2 || '',
        nilaiSemester1Aly: nom.santriMuridIdentitas?.[i]?.nilaiSemester1Aly || '',
        presensiKehadiran: nom.santriMuridIdentitas?.[i]?.presensiKehadiran || '',
        checklist: nom.santriMuridIdentitas?.[i]?.checklist || (i === 0 ? nom.evaluationChecklist || {} : {}),
        alasanPenilaian: nom.santriMuridIdentitas?.[i]?.alasanPenilaian || '',
        lainLainNote: nom.santriMuridIdentitas?.[i]?.lainLainNote || (i === 0 ? nom.lainLainNote || '' : ''),
      }));
      setSantriMuridIdentitas(mergedSM);
    } else {
      setSantriMuridIdentitas([
        { idPersonalia: '', nama: '', domisiliAlamat: '', jenjangTingkat: 'Aliyah', nilaiImda1: '', nilaiImda2: '', nilaiSemester1Aly: '', presensiKehadiran: '', checklist: {}, alasanPenilaian: '', lainLainNote: '' },
        { idPersonalia: '', nama: '', domisiliAlamat: '', jenjangTingkat: 'Aliyah', nilaiImda1: '', nilaiImda2: '', nilaiSemester1Aly: '', presensiKehadiran: '', checklist: {}, alasanPenilaian: '', lainLainNote: '' },
      ]);
    }

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

    // Check if Guru category (HANYA Penghargaan Khidmah (Guru), Pengurus tetap cuma 1 identitas)
    const isGuruCategory = isGuruCategoryItem(
      categoryId,
      categories.find((c) => c.id === categoryId)?.title
    );

    // Check if Santri/Murid category (HANYA Penghargaan Santri Terbaik & Murid Terbaik)
    const isSantriMuridCategory = isSantriMuridCategoryItem(
      categoryId,
      categories.find((c) => c.id === categoryId)?.title
    );

    const effectiveCandidateName = isGuruCategory
      ? candidateName.trim() ||
        guruIdentitas.find((g) => g.nama.trim().length > 0)?.nama.trim() ||
        'Nominasi 5 Guru Teladan MMU'
      : isSantriMuridCategory
      ? candidateName.trim() ||
        santriMuridIdentitas.find((s) => s.nama.trim().length > 0)?.nama.trim() ||
        'Nominasi 2 Santri / Murid Terbaik'
      : candidateName.trim();

    if (!effectiveCandidateName) return;

    const isAlumniCategory = categoryId === 'cat-3' || toSafeLower(categoryId).includes('alumni');
    if (isAlumniCategory) {
      for (const item of ALUMNI_CRITERIA_LIST) {
        if (checklist[item.id] && !alumniCriteriaReasons[item.id]?.trim()) {
          alert(`Mohon lengkapi kolom alasan sebagai pembuktian untuk kriteria "${item.title}". Kolom ini wajib diisi.`);
          return;
        }
      }
    }

    const nomPayload = {
      idPps: idPps || (isGuruCategory && guruIdentitas[0]?.idPersonalia ? guruIdentitas[0].idPersonalia : isSantriMuridCategory && santriMuridIdentitas[0]?.idPersonalia ? santriMuridIdentitas[0].idPersonalia : `PPS-2026-00${nominations.length + 1}`),
      candidateName: effectiveCandidateName,
      candidateDomisiliType,
      domisili: domisili || (isGuruCategory ? guruIdentitas[0]?.domisiliAlamat : isSantriMuridCategory ? santriMuridIdentitas[0]?.domisiliAlamat : ''),
      kelas,
      tingkat,
      alamat: alamat || (isGuruCategory ? guruIdentitas[0]?.domisiliAlamat : isSantriMuridCategory ? santriMuridIdentitas[0]?.domisiliAlamat : ''),
      nipNik: nipNik || idPps || (isGuruCategory ? guruIdentitas[0]?.idPersonalia : isSantriMuridCategory ? santriMuridIdentitas[0]?.idPersonalia : ''),
      department: department || (isGuruCategory ? guruIdentitas[0]?.jabatan : ''),
      position,
      phone,
      achievement: achievement || (isSantriMuridCategory && santriMuridIdentitas[0]?.nilaiImda1 ? `Imda I: ${santriMuridIdentitas[0].nilaiImda1}, Imda II: ${santriMuridIdentitas[0].nilaiImda2}, Sem 1 'Aly: ${santriMuridIdentitas[0].nilaiSemester1Aly}, Presensi: ${santriMuridIdentitas[0].presensiKehadiran}` : ''),
      categoryId,
      justification: justification.trim() || alasanLain.trim() || lainLainNote.trim() || 'Diusulkan secara resmi untuk Penganugerahan Milad Sidogiri.',
      status,
      score,
      nominatorName: pengusulNama || nominatorName || 'Panitia Sie Penganugerahan',

      pengusulNama,
      pengusulJabatan,
      pengusulDomisili,
      pengusulAlamat,
      pengusulPhone,

      // Simpan 5 Identitas Guru
      guruIdentitas: isGuruCategory ? guruIdentitas : undefined,

      // Simpan 2 Identitas Santri / Murid
      santriMuridIdentitas: isSantriMuridCategory ? santriMuridIdentitas : undefined,

      evaluationChecklist: isGuruCategory ? (guruIdentitas[0]?.checklist || checklist) : isSantriMuridCategory ? (santriMuridIdentitas[0]?.checklist || checklist) : checklist,
      alumniCriteriaReasons: isAlumniCategory ? alumniCriteriaReasons : undefined,
      alasanLain,
      integritasNote,
      transparansiLaporanNote,
      lainLainNote: isGuruCategory ? (guruIdentitas[0]?.lainLainNote || lainLainNote) : isSantriMuridCategory ? (santriMuridIdentitas[0]?.lainLainNote || lainLainNote) : lainLainNote,
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

    const isCategoryAllowedForUserRole =
      isAdmin ||
      allowedCategoryIds.includes(nom.categoryId) ||
      (allowedCategoryIds.includes('cat-1') && (nom.categoryId === 'cat-1' || toSafeLower(categories.find((c) => c.id === nom.categoryId)?.title).includes('ranting'))) ||
      (allowedCategoryIds.includes('cat-2') && (nom.categoryId === 'cat-2' || isGuruCategoryItem(nom.categoryId, categories.find((c) => c.id === nom.categoryId)?.title))) ||
      (allowedCategoryIds.includes('cat-3') && (nom.categoryId === 'cat-3' || toSafeLower(categories.find((c) => c.id === nom.categoryId)?.title).includes('alumni'))) ||
      (allowedCategoryIds.includes('cat-4') && (nom.categoryId === 'cat-4' || isPengurusCategoryItem(nom.categoryId, categories.find((c) => c.id === nom.categoryId)?.title))) ||
      (allowedCategoryIds.includes('cat-5') && (nom.categoryId === 'cat-5' || toSafeLower(categories.find((c) => c.id === nom.categoryId)?.title).includes('santri'))) ||
      (allowedCategoryIds.includes('cat-6') && (nom.categoryId === 'cat-6' || toSafeLower(categories.find((c) => c.id === nom.categoryId)?.title).includes('murid')));

    if (!isCategoryAllowedForUserRole) return false;

    const matchesCategory =
      selectedCategory === 'ALL' ||
      nom.categoryId === selectedCategory ||
      (selectedCategory === 'cat-1' && (nom.categoryId === 'cat-1' || toSafeLower(categories.find((c) => c.id === nom.categoryId)?.title).includes('ranting'))) ||
      (selectedCategory === 'cat-2' && (nom.categoryId === 'cat-2' || isGuruCategoryItem(nom.categoryId, categories.find((c) => c.id === nom.categoryId)?.title))) ||
      (selectedCategory === 'cat-3' && (nom.categoryId === 'cat-3' || toSafeLower(categories.find((c) => c.id === nom.categoryId)?.title).includes('alumni'))) ||
      (selectedCategory === 'cat-4' && (nom.categoryId === 'cat-4' || isPengurusCategoryItem(nom.categoryId, categories.find((c) => c.id === nom.categoryId)?.title))) ||
      (selectedCategory === 'cat-5' && (nom.categoryId === 'cat-5' || toSafeLower(categories.find((c) => c.id === nom.categoryId)?.title).includes('santri'))) ||
      (selectedCategory === 'cat-6' && (nom.categoryId === 'cat-6' || toSafeLower(categories.find((c) => c.id === nom.categoryId)?.title).includes('murid')));
    const matchesStatus = selectedStatus === 'ALL' || nom.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Helper formatters for Excel export (menghasilkan teks rapi, bernomor, dan TIDAK berbentuk kode)
  const formatRantingPrestasiExport = (checklist?: Record<string, boolean>): string => {
    if (!checklist) return '-';
    const checked = Object.entries(checklist)
      .filter(([k, v]) => v && k.startsWith('ranting_prestasi_'))
      .map(([k]) => RANTING_PRESTASI_MAP[k] || k);
    if (checked.length === 0) return '-';
    return checked.map((c, i) => `${i + 1}. ${c}`).join('\n');
  };

  const formatRantingLoyalitasExport = (checklist?: Record<string, boolean>): string => {
    if (!checklist) return '-';
    const checked = Object.entries(checklist)
      .filter(([k, v]) => v && k.startsWith('ranting_loyalitas_'))
      .map(([k]) => RANTING_LOYALITAS_MAP[k] || k);
    if (checked.length === 0) return '-';
    return checked.map((c, i) => `${i + 1}. ${c}`).join('\n');
  };

  const formatRantingAllCriteriaExport = (checklist?: Record<string, boolean>): string => {
    if (!checklist) return '-';
    const lines: string[] = [];
    // 1. Prestasi
    Object.entries(checklist)
      .filter(([k, v]) => v && k.startsWith('ranting_prestasi_'))
      .forEach(([k]) => {
        lines.push(`Prestasi: ${RANTING_PRESTASI_MAP[k] || k}`);
      });
    // 2. Loyalitas
    Object.entries(checklist)
      .filter(([k, v]) => v && k.startsWith('ranting_loyalitas_'))
      .forEach(([k]) => {
        lines.push(`Loyalitas: ${RANTING_LOYALITAS_MAP[k] || k}`);
      });
    // 3. Lainnya
    Object.entries(checklist)
      .filter(([k, v]) => v && !k.startsWith('ranting_prestasi_') && !k.startsWith('ranting_loyalitas_'))
      .forEach(([k]) => {
        lines.push(k === 'ranting_lain_kejujuran' ? 'Integritas: Kejujuran & Integritas Ranting' : k);
      });
    if (lines.length === 0) return '-';
    return lines.map((c, i) => `${i + 1}. ${c}`).join('\n');
  };

  const formatPengurusCriteriaExport = (checklist?: Record<string, boolean>): string => {
    if (!checklist) return '-';
    const lines: string[] = [];
    PENGURUS_CRITERIA_LIST.forEach((c) => {
      if (checklist[c.id]) {
        lines.push(`${c.title}: ${c.desc}`);
      }
    });
    Object.entries(checklist).forEach(([k, v]) => {
      if (v && !PENGURUS_CRITERIA_LIST.some((c) => c.id === k)) {
        lines.push(PENGURUS_CRITERIA_MAP[k] || k);
      }
    });
    if (lines.length === 0) return '-';
    return lines.map((c, i) => `${i + 1}. ${c}`).join('\n');
  };

  const formatGuruCriteriaExport = (checklist?: Record<string, boolean>): string => {
    if (!checklist) return '-';
    const checkedItems: string[] = [];
    // 1. Periksa kriteria resmi standar Guru (13 kriteria)
    GURU_CRITERIA_LIST.forEach((c) => {
      if (checklist[c.id]) {
        checkedItems.push(c.label);
      }
    });
    // 2. Periksa kriteria tambahan / dinamis jika ada centang selain 13 kriteria standar
    Object.entries(checklist).forEach(([key, val]) => {
      if (val && !GURU_CRITERIA_LIST.some((c) => c.id === key)) {
        checkedItems.push(key);
      }
    });
    if (checkedItems.length === 0) return '-';
    return checkedItems.map((c, i) => `${i + 1}. ${c}`).join('\n');
  };

  const formatAlumniCriteriaExport = (
    checklist?: Record<string, boolean>,
    reasons?: Record<string, string>
  ): string => {
    if (!checklist) return '-';
    const lines: string[] = [];
    ALUMNI_CRITERIA_LIST.forEach((c) => {
      if (checklist[c.id]) {
        const r = reasons?.[c.id]?.trim();
        lines.push(`${c.title}${r ? ` [Alasan: ${r}]` : ''}`);
      }
    });
    Object.entries(checklist).forEach(([k, v]) => {
      if (v && !ALUMNI_CRITERIA_LIST.some((c) => c.id === k)) {
        const r = reasons?.[k]?.trim();
        lines.push(`${k}${r ? ` [Alasan: ${r}]` : ''}`);
      }
    });
    if (lines.length === 0) return '-';
    return lines.map((c, i) => `${i + 1}. ${c}`).join('\n');
  };

  const formatSantriCriteriaExport = (checklist?: Record<string, boolean>): string => {
    if (!checklist) return '-';
    const lines: string[] = [];
    SANTRI_CRITERIA_LIST.forEach((c) => {
      if (checklist[c.id]) lines.push(c.label);
    });
    Object.entries(checklist).forEach(([k, v]) => {
      if (v && !SANTRI_CRITERIA_LIST.some((c) => c.id === k)) lines.push(k);
    });
    if (lines.length === 0) return '-';
    return lines.map((c, i) => `${i + 1}. ${c}`).join('\n');
  };

  const formatMuridCriteriaExport = (checklist?: Record<string, boolean>): string => {
    if (!checklist) return '-';
    const lines: string[] = [];
    MURID_CRITERIA_LIST.forEach((c) => {
      if (checklist[c.id]) lines.push(c.label);
    });
    Object.entries(checklist).forEach(([k, v]) => {
      if (v && !MURID_CRITERIA_LIST.some((c) => c.id === k)) lines.push(k);
    });
    if (lines.length === 0) return '-';
    return lines.map((c, i) => `${i + 1}. ${c}`).join('\n');
  };

  // Handle Export Data to Excel (.xlsx) dengan struktur rapi per kategori tanpa kode
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sie Penganugerahan Milad Sidogiri';
      workbook.created = new Date();

      const dataToExport = filteredNominations.length > 0 ? filteredNominations : nominations;

      // Styling standard untuk header dan cells
      const applySheetHeaderStyle = (row: ExcelJS.Row, bgArgb = 'FF0F172A') => {
        row.height = 32;
        row.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgArgb },
        };
        row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      };

      const styleDataRow = (row: ExcelJS.Row, isEven: boolean) => {
        row.height = 36;
        row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        row.font = { name: 'Calibri', size: 10 };
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
          if (isEven) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          }
        });
      };

      // 1. SHEET KHIDMAH RANTING TERBAIK
      // Format Standar Rapi: Barisan pertama adalah nama pengusul, barisan kedua kolom tabel, data urut ke bawah
      const rantingData = dataToExport.filter(
        (n) => n.categoryId === 'cat-1' || toSafeLower(categories.find((c) => c.id === n.categoryId)?.title).includes('ranting')
      );
      const rantingSheet = workbook.addWorksheet('Khidmah Ranting');
      rantingSheet.getColumn(1).width = 8;   // NO
      rantingSheet.getColumn(2).width = 20;  // ID PPS / PERSONALIA
      rantingSheet.getColumn(3).width = 32;  // NAMA RANTING
      rantingSheet.getColumn(4).width = 36;  // DOM / ALAMAT
      rantingSheet.getColumn(5).width = 26;  // JABATAN
      rantingSheet.getColumn(6).width = 18;  // KELAS / TINGKAT
      rantingSheet.getColumn(7).width = 18;  // NO. WATSAP
      rantingSheet.getColumn(8).width = 50;  // KRITERIA YANG DICENTANG
      rantingSheet.getColumn(9).width = 32;  // ALASAN
      rantingSheet.getColumn(10).width = 28; // LAIN-LAIN

      if (rantingData.length === 0) {
        const emptyRow = rantingSheet.addRow(['NAMA PENGUSUL: (Belum ada data pengusulan khidmah ranting tercatat)', '', '', '', '', '', '', '', '', '']);
        rantingSheet.mergeCells(emptyRow.number, 1, emptyRow.number, 10);
        emptyRow.height = 30;
        emptyRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        emptyRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        for (let c = 1; c <= 10; c++) {
          emptyRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
        }

        const hRow = rantingSheet.addRow([
          'NO', 'ID PPS / PERSONALIA', 'NAMA RANTING', 'DOM / ALAMAT', 'JABATAN', 'KELAS / TINGKAT', 'NO. WATSAP', 'KRITERIA YANG DICENTANG', 'ALASAN', 'LAIN-LAIN'
        ]);
        hRow.height = 28;
        hRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        hRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        for (let c = 1; c <= 10; c++) {
          hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        }
      } else {
        rantingData.forEach((nom, nomIdx) => {
          if (nomIdx > 0) {
            const sepRow = rantingSheet.addRow(['', '', '', '', '', '', '', '', '', '']);
            sepRow.height = 14;
          }

          // BARISAN PERTAMA: NAMA PENGUSUL
          const pengusulParts = [
            `NAMA PENGUSUL: ${nom.pengusulNama || nom.nominatorName || '-'}`,
            nom.pengusulJabatan ? `JABATAN: ${nom.pengusulJabatan}` : '',
            nom.pengusulDomisili ? `DOMISILI: ${nom.pengusulDomisili}` : '',
            nom.pengusulAlamat ? `ALAMAT: ${nom.pengusulAlamat}` : '',
            nom.pengusulPhone ? `NO. HP / WA: ${nom.pengusulPhone}` : '',
            `STATUS: ${nom.status || 'Penilaian'}`,
          ].filter(Boolean);

          const pengusulRow = rantingSheet.addRow([pengusulParts.join('   |   '), '', '', '', '', '', '', '', '', '']);
          const pRowNum = pengusulRow.number;
          rantingSheet.mergeCells(pRowNum, 1, pRowNum, 10);
          pengusulRow.height = 30;
          pengusulRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          pengusulRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          for (let c = 1; c <= 10; c++) {
            const cell = pengusulRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }; // Deep Emerald
            cell.border = {
              top: { style: 'medium', color: { argb: 'FF065F46' } },
              left: { style: 'thin', color: { argb: 'FF065F46' } },
              bottom: { style: 'thin', color: { argb: 'FF065F46' } },
              right: { style: 'thin', color: { argb: 'FF065F46' } },
            };
          }

          // BARISAN KEDUA: HEADER KOLOM
          const colHeaderRow = rantingSheet.addRow([
            'NO',
            'ID PPS / PERSONALIA',
            'NAMA RANTING',
            'DOM / ALAMAT',
            'JABATAN',
            'KELAS / TINGKAT',
            'NO. WATSAP',
            'KRITERIA YANG DICENTANG',
            'ALASAN',
            'LAIN-LAIN',
          ]);
          colHeaderRow.height = 28;
          colHeaderRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
          colHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          for (let c = 1; c <= 10; c++) {
            const cell = colHeaderRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          }

          // BARISAN KE BAWAH: DATA RANTING YANG DIUSULKAN
          const rawLainLain = nom.lainLainNote && nom.lainLainNote.trim() ? nom.lainLainNote.trim() : (nom.alasanLain && nom.alasanLain !== nom.justification ? nom.alasanLain.trim() : '');
          const domAlamatStr = nom.domisili ? `[${nom.candidateDomisiliType || 'PPS'}] ${nom.domisili} - ${nom.alamat || ''}` : (nom.alamat || '-');

          const dataRow = rantingSheet.addRow([
            String(nomIdx + 1).padStart(2, '0'),
            nom.idPps || nom.nipNik || '-',
            nom.candidateName || '-',
            domAlamatStr,
            nom.department || nom.position || '-',
            [nom.kelas, nom.tingkat].filter(Boolean).join(' / ') || '-',
            nom.phone || '-',
            formatRantingAllCriteriaExport(nom.evaluationChecklist),
            nom.justification || nom.alasanLain || '-',
            rawLainLain ? rawLainLain : '-',
          ]);

          styleDataRow(dataRow, nomIdx % 2 === 1);
          dataRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
          dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
          dataRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          dataRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
        });
      }

      // 2. SHEET KHIDMAH (GURU)
      // Format Rapi: Barisan pertama adalah nama pengusul, barisan kedua kolom tabel, identitas 01-05 urut ke bawah bukan kesamping
      const guruData = dataToExport.filter(
        (n) => n.categoryId === 'cat-2' || isGuruCategoryItem(n.categoryId, categories.find((c) => c.id === n.categoryId)?.title)
      );
      const guruSheet = workbook.addWorksheet('Khidmah Guru');

      guruSheet.getColumn(1).width = 8;   // NO (01 s/d 05)
      guruSheet.getColumn(2).width = 22;  // ID PERSONALIA
      guruSheet.getColumn(3).width = 32;  // NAMA GURU
      guruSheet.getColumn(4).width = 34;  // DOM / ALAMAT
      guruSheet.getColumn(5).width = 26;  // JABATAN
      guruSheet.getColumn(6).width = 56;  // KRITERIA YANG DICENTANG
      guruSheet.getColumn(7).width = 32;  // LAIN-LAIN

      if (guruData.length === 0) {
        const emptyPengusulRow = guruSheet.addRow([
          'NAMA PENGUSUL: (Belum ada data pengusulan khidmah guru tercatat)',
          '', '', '', '', '', ''
        ]);
        guruSheet.mergeCells(emptyPengusulRow.number, 1, emptyPengusulRow.number, 7);
        emptyPengusulRow.height = 30;
        emptyPengusulRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        emptyPengusulRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        for (let c = 1; c <= 7; c++) {
          emptyPengusulRow.getCell(c).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E3A8A' },
          };
        }

        const colHeaderRow = guruSheet.addRow([
          'NO',
          'ID PERSONALIA',
          'NAMA GURU',
          'DOM / ALAMAT',
          'JABATAN',
          'KRITERIA YANG DICENTANG',
          'LAIN-LAIN',
        ]);
        colHeaderRow.height = 28;
        colHeaderRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        colHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        for (let c = 1; c <= 7; c++) {
          colHeaderRow.getCell(c).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF334155' },
          };
        }
      } else {
        guruData.forEach((nom, nomIdx) => {
          if (nomIdx > 0) {
            const sepRow = guruSheet.addRow(['', '', '', '', '', '', '']);
            sepRow.height = 14;
          }

          // BARISAN PERTAMA: NAMA PENGUSUL
          const pengusulParts = [
            `NAMA PENGUSUL: ${nom.pengusulNama || nom.nominatorName || '-'}`,
            nom.pengusulJabatan ? `JABATAN: ${nom.pengusulJabatan}` : '',
            nom.pengusulDomisili ? `DOMISILI: ${nom.pengusulDomisili}` : '',
            nom.pengusulAlamat ? `ALAMAT: ${nom.pengusulAlamat}` : '',
            nom.pengusulPhone ? `NO. HP / WA: ${nom.pengusulPhone}` : '',
            `STATUS: ${nom.status || 'Penilaian'}`,
          ].filter(Boolean);

          const pengusulRow = guruSheet.addRow([
            pengusulParts.join('   |   '),
            '', '', '', '', '', ''
          ]);
          const pRowNum = pengusulRow.number;
          guruSheet.mergeCells(pRowNum, 1, pRowNum, 7);
          pengusulRow.height = 30;
          pengusulRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          pengusulRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          for (let c = 1; c <= 7; c++) {
            const cell = pengusulRow.getCell(c);
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF1E3A8A' }, // Deep Navy Blue
            };
            cell.border = {
              top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
              left: { style: 'thin', color: { argb: 'FF1E3A8A' } },
              bottom: { style: 'thin', color: { argb: 'FF1E3A8A' } },
              right: { style: 'thin', color: { argb: 'FF1E3A8A' } },
            };
          }

          // BARISAN KEDUA: KOLOM NAMA YANG DIUSULKAN
          const colHeaderRow = guruSheet.addRow([
            'NO',
            'ID PERSONALIA',
            'NAMA GURU',
            'DOM / ALAMAT',
            'JABATAN',
            'KRITERIA YANG DICENTANG',
            'LAIN-LAIN',
          ]);
          colHeaderRow.height = 28;
          colHeaderRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
          colHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          for (let c = 1; c <= 7; c++) {
            const cell = colHeaderRow.getCell(c);
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF334155' },
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          }

          // BARISAN KE BAWAH: IDENTITAS 01 S/D 05 SECARA BERURUTAN KE BAWAH
          const gList = nom.guruIdentitas || [];
          for (let gIdx = 0; gIdx < 5; gIdx++) {
            const numStr = String(gIdx + 1).padStart(2, '0');
            const gItem = gList[gIdx] || (gIdx === 0 ? {
              idPersonalia: nom.idPps || nom.nipNik || '',
              nama: nom.candidateName || '',
              domisiliAlamat: nom.alamat || nom.domisili || '',
              jabatan: nom.department || nom.position || '',
              checklist: nom.evaluationChecklist || {},
              lainLainNote: nom.lainLainNote || '',
            } : null);

            // Seluruh kriteria yang dicentang di aplikasi tercatat rapi
            const formattedKriteria = formatGuruCriteriaExport(
              gItem?.checklist || (gIdx === 0 && !gItem ? nom.evaluationChecklist : undefined)
            );

            // Kolom Lain-lain (jika ada isinya di aplikasi maka masuk di excel)
            const rawLainLain = (gItem?.lainLainNote && gItem.lainLainNote.trim())
              ? gItem.lainLainNote.trim()
              : (gIdx === 0 && nom.lainLainNote && nom.lainLainNote.trim())
                ? nom.lainLainNote.trim()
                : (gIdx === 0 && nom.justification && !nom.justification.includes('Diusulkan secara resmi') ? nom.justification.trim() : '');

            const dataRow = guruSheet.addRow([
              numStr,
              gItem?.idPersonalia || '-',
              gItem?.nama || '-',
              gItem?.domisiliAlamat || '-',
              gItem?.jabatan || '-',
              formattedKriteria,
              rawLainLain ? rawLainLain : '-',
            ]);

            styleDataRow(dataRow, gIdx % 2 === 1);
            dataRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          }
        });
      }

      // 3. SHEET KHIDMAH (ALUMNI)
      // Format Standar Rapi: Barisan pertama adalah nama pengusul, barisan kedua kolom tabel, data urut ke bawah
      const alumniData = dataToExport.filter(
        (n) => n.categoryId === 'cat-3' || toSafeLower(categories.find((c) => c.id === n.categoryId)?.title).includes('alumni')
      );
      const alumniSheet = workbook.addWorksheet('Khidmah Alumni');
      alumniSheet.getColumn(1).width = 8;   // NO
      alumniSheet.getColumn(2).width = 20;  // ID PPS / PERSONALIA
      alumniSheet.getColumn(3).width = 30;  // NAMA CALON (ALUMNI)
      alumniSheet.getColumn(4).width = 36;  // DOM / ALAMAT
      alumniSheet.getColumn(5).width = 26;  // JABATAN
      alumniSheet.getColumn(6).width = 18;  // NO. WHATSAPP
      alumniSheet.getColumn(7).width = 54;  // KRITERIA & ALASAN RESMI PENILAIAN
      alumniSheet.getColumn(8).width = 34;  // ALASAN LAIN / JUSTIFIKASI
      alumniSheet.getColumn(9).width = 28;  // LAIN-LAIN

      if (alumniData.length === 0) {
        const emptyRow = alumniSheet.addRow(['NAMA PENGUSUL: (Belum ada data pengusulan khidmah alumni tercatat)', '', '', '', '', '', '', '', '']);
        alumniSheet.mergeCells(emptyRow.number, 1, emptyRow.number, 9);
        emptyRow.height = 30;
        emptyRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        emptyRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        for (let c = 1; c <= 9; c++) {
          emptyRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF115E59' } };
        }

        const hRow = alumniSheet.addRow([
          'NO', 'ID PPS / PERSONALIA', 'NAMA CALON (ALUMNI)', 'DOM / ALAMAT', 'JABATAN', 'NO. WHATSAPP', 'KRITERIA & ALASAN RESMI PENILAIAN', 'ALASAN LAIN / JUSTIFIKASI', 'LAIN-LAIN'
        ]);
        hRow.height = 28;
        hRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        hRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        for (let c = 1; c <= 9; c++) {
          hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        }
      } else {
        alumniData.forEach((nom, nomIdx) => {
          if (nomIdx > 0) {
            const sepRow = alumniSheet.addRow(['', '', '', '', '', '', '', '', '']);
            sepRow.height = 14;
          }

          // BARISAN PERTAMA: NAMA PENGUSUL
          const pengusulParts = [
            `NAMA PENGUSUL: ${nom.pengusulNama || nom.nominatorName || '-'}`,
            nom.pengusulJabatan ? `JABATAN: ${nom.pengusulJabatan}` : '',
            nom.pengusulDomisili ? `DOMISILI: ${nom.pengusulDomisili}` : '',
            nom.pengusulAlamat ? `ALAMAT: ${nom.pengusulAlamat}` : '',
            nom.pengusulPhone ? `NO. HP / WA: ${nom.pengusulPhone}` : '',
            `STATUS: ${nom.status || 'Penilaian'}`,
          ].filter(Boolean);

          const pengusulRow = alumniSheet.addRow([pengusulParts.join('   |   '), '', '', '', '', '', '', '', '']);
          const pRowNum = pengusulRow.number;
          alumniSheet.mergeCells(pRowNum, 1, pRowNum, 9);
          pengusulRow.height = 30;
          pengusulRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          pengusulRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          for (let c = 1; c <= 9; c++) {
            const cell = pengusulRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF115E59' } }; // Deep Teal
            cell.border = {
              top: { style: 'medium', color: { argb: 'FF115E59' } },
              left: { style: 'thin', color: { argb: 'FF115E59' } },
              bottom: { style: 'thin', color: { argb: 'FF115E59' } },
              right: { style: 'thin', color: { argb: 'FF115E59' } },
            };
          }

          // BARISAN KEDUA: HEADER KOLOM
          const colHeaderRow = alumniSheet.addRow([
            'NO',
            'ID PPS / PERSONALIA',
            'NAMA CALON (ALUMNI)',
            'DOM / ALAMAT',
            'JABATAN',
            'NO. WHATSAPP',
            'KRITERIA & ALASAN RESMI PENILAIAN',
            'ALASAN LAIN / JUSTIFIKASI',
            'LAIN-LAIN',
          ]);
          colHeaderRow.height = 28;
          colHeaderRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
          colHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          for (let c = 1; c <= 9; c++) {
            const cell = colHeaderRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          }

          // BARISAN KE BAWAH: DATA ALUMNI YANG DIUSULKAN
          const rawLainLain = nom.lainLainNote && nom.lainLainNote.trim() ? nom.lainLainNote.trim() : '';

          const dataRow = alumniSheet.addRow([
            String(nomIdx + 1).padStart(2, '0'),
            nom.idPps || nom.nipNik || '-',
            nom.candidateName || '-',
            nom.alamat || nom.domisili || '-',
            nom.department || nom.position || '-',
            nom.phone || '-',
            formatAlumniCriteriaExport(nom.evaluationChecklist, nom.alumniCriteriaReasons),
            nom.justification || nom.alasanLain || '-',
            rawLainLain ? rawLainLain : '-',
          ]);

          styleDataRow(dataRow, nomIdx % 2 === 1);
          dataRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
          dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
          dataRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          dataRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
        });
      }

      // 4. SHEET KHIDMAH (PENGURUS)
      // Format Standar Rapi: Barisan pertama adalah nama pengusul, barisan kedua kolom tabel, data urut ke bawah
      const pengurusData = dataToExport.filter(
        (n) => n.categoryId === 'cat-4' || isPengurusCategoryItem(n.categoryId, categories.find((c) => c.id === n.categoryId)?.title)
      );
      const pengurusSheet = workbook.addWorksheet('Khidmah Pengurus');
      pengurusSheet.getColumn(1).width = 8;   // NO
      pengurusSheet.getColumn(2).width = 20;  // ID PPS / PERSONALIA
      pengurusSheet.getColumn(3).width = 32;  // NAMA PENGURUS
      pengurusSheet.getColumn(4).width = 36;  // DOM / ALAMAT
      pengurusSheet.getColumn(5).width = 26;  // JABATAN
      pengurusSheet.getColumn(6).width = 18;  // NO. WHATSAPP
      pengurusSheet.getColumn(7).width = 54;  // KRITERIA YANG DICENTANG
      pengurusSheet.getColumn(8).width = 34;  // ALASAN / JUSTIFIKASI
      pengurusSheet.getColumn(9).width = 28;  // LAIN-LAIN

      if (pengurusData.length === 0) {
        const emptyRow = pengurusSheet.addRow(['NAMA PENGUSUL: (Belum ada data pengusulan khidmah pengurus tercatat)', '', '', '', '', '', '', '', '']);
        pengurusSheet.mergeCells(emptyRow.number, 1, emptyRow.number, 9);
        emptyRow.height = 30;
        emptyRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        emptyRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        for (let c = 1; c <= 9; c++) {
          emptyRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
        }

        const hRow = pengurusSheet.addRow([
          'NO', 'ID PPS / PERSONALIA', 'NAMA PENGURUS', 'DOM / ALAMAT', 'JABATAN', 'NO. WHATSAPP', 'KRITERIA YANG DICENTANG', 'ALASAN / JUSTIFIKASI', 'LAIN-LAIN'
        ]);
        hRow.height = 28;
        hRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        hRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        for (let c = 1; c <= 9; c++) {
          hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        }
      } else {
        pengurusData.forEach((nom, nomIdx) => {
          if (nomIdx > 0) {
            const sepRow = pengurusSheet.addRow(['', '', '', '', '', '', '', '', '']);
            sepRow.height = 14;
          }

          // BARISAN PERTAMA: NAMA PENGUSUL
          const pengusulParts = [
            `NAMA PENGUSUL: ${nom.pengusulNama || nom.nominatorName || '-'}`,
            nom.pengusulJabatan ? `JABATAN: ${nom.pengusulJabatan}` : '',
            nom.pengusulDomisili ? `DOMISILI: ${nom.pengusulDomisili}` : '',
            nom.pengusulAlamat ? `ALAMAT: ${nom.pengusulAlamat}` : '',
            nom.pengusulPhone ? `NO. HP / WA: ${nom.pengusulPhone}` : '',
            `STATUS: ${nom.status || 'Penilaian'}`,
          ].filter(Boolean);

          const pengusulRow = pengurusSheet.addRow([pengusulParts.join('   |   '), '', '', '', '', '', '', '', '']);
          const pRowNum = pengusulRow.number;
          pengurusSheet.mergeCells(pRowNum, 1, pRowNum, 9);
          pengusulRow.height = 30;
          pengusulRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          pengusulRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          for (let c = 1; c <= 9; c++) {
            const cell = pengusulRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } }; // Deep Indigo
            cell.border = {
              top: { style: 'medium', color: { argb: 'FF3730A3' } },
              left: { style: 'thin', color: { argb: 'FF3730A3' } },
              bottom: { style: 'thin', color: { argb: 'FF3730A3' } },
              right: { style: 'thin', color: { argb: 'FF3730A3' } },
            };
          }

          // BARISAN KEDUA: HEADER KOLOM
          const colHeaderRow = pengurusSheet.addRow([
            'NO',
            'ID PPS / PERSONALIA',
            'NAMA PENGURUS',
            'DOM / ALAMAT',
            'JABATAN',
            'NO. WHATSAPP',
            'KRITERIA YANG DICENTANG',
            'ALASAN / JUSTIFIKASI',
            'LAIN-LAIN',
          ]);
          colHeaderRow.height = 28;
          colHeaderRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
          colHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          for (let c = 1; c <= 9; c++) {
            const cell = colHeaderRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          }

          // BARISAN KE BAWAH: DATA PENGURUS YANG DIUSULKAN
          const rawLainLain = nom.lainLainNote && nom.lainLainNote.trim() ? nom.lainLainNote.trim() : '';
          const domAlamatStr = nom.domisili ? `[${nom.domisili}] ${nom.alamat || '-'}` : (nom.alamat || '-');

          const dataRow = pengurusSheet.addRow([
            String(nomIdx + 1).padStart(2, '0'),
            nom.idPps || nom.nipNik || '-',
            nom.candidateName || '-',
            domAlamatStr,
            nom.position || nom.department || '-',
            nom.phone || '-',
            formatPengurusCriteriaExport(nom.evaluationChecklist),
            nom.justification || nom.alasanLain || '-',
            rawLainLain ? rawLainLain : '-',
          ]);

          styleDataRow(dataRow, nomIdx % 2 === 1);
          dataRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
          dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
          dataRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          dataRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
        });
      }

      // 5. SHEET SANTRI TERBAIK
      // Format Standar Rapi: Barisan pertama adalah nama pengusul, barisan kedua kolom tabel, figur 01 dan 02 urut ke bawah bukan kesamping
      const santriData = dataToExport.filter(
        (n) => n.categoryId === 'cat-5' || toSafeLower(categories.find((c) => c.id === n.categoryId)?.title).includes('santri')
      );
      const santriSheet = workbook.addWorksheet('Santri Terbaik');
      santriSheet.getColumn(1).width = 8;   // NO (01, 02)
      santriSheet.getColumn(2).width = 20;  // ID PERSONALIA
      santriSheet.getColumn(3).width = 30;  // NAMA SANTRI
      santriSheet.getColumn(4).width = 32;  // DOM / ALAMAT
      santriSheet.getColumn(5).width = 14;  // JENJANG
      santriSheet.getColumn(6).width = 22;  // NILAI SEMESTER I 'ALY
      santriSheet.getColumn(7).width = 16;  // NILAI IMDA I
      santriSheet.getColumn(8).width = 16;  // NILAI IMDA II
      santriSheet.getColumn(9).width = 18;  // PRESENSI HADIR
      santriSheet.getColumn(10).width = 48; // KRITERIA YANG DICENTANG
      santriSheet.getColumn(11).width = 36; // ALASAN PENILAIAN RESMI
      santriSheet.getColumn(12).width = 28; // LAIN-LAIN

      if (santriData.length === 0) {
        const emptyRow = santriSheet.addRow(['NAMA PENGUSUL: (Belum ada data pengusulan santri terbaik tercatat)', '', '', '', '', '', '', '', '', '', '', '']);
        santriSheet.mergeCells(emptyRow.number, 1, emptyRow.number, 12);
        emptyRow.height = 30;
        emptyRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        emptyRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        for (let c = 1; c <= 12; c++) {
          emptyRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };
        }

        const hRow = santriSheet.addRow([
          'NO', 'ID PERSONALIA', 'NAMA SANTRI', 'DOM / ALAMAT', 'JENJANG', "NILAI SEMESTER I 'ALY", 'NILAI IMDA I', 'NILAI IMDA II', 'PRESENSI HADIR', 'KRITERIA YANG DICENTANG', 'ALASAN PENILAIAN RESMI', 'LAIN-LAIN'
        ]);
        hRow.height = 28;
        hRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        hRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        for (let c = 1; c <= 12; c++) {
          hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        }
      } else {
        santriData.forEach((nom, nomIdx) => {
          if (nomIdx > 0) {
            const sepRow = santriSheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '']);
            sepRow.height = 14;
          }

          // BARISAN PERTAMA: NAMA PENGUSUL
          const pengusulParts = [
            `NAMA PENGUSUL: ${nom.pengusulNama || nom.nominatorName || '-'}`,
            'KATEGORI: Penghargaan Santri Terbaik',
            nom.pengusulJabatan ? `JABATAN: ${nom.pengusulJabatan}` : '',
            nom.pengusulDomisili ? `DOMISILI: ${nom.pengusulDomisili}` : '',
            nom.pengusulAlamat ? `ALAMAT: ${nom.pengusulAlamat}` : '',
            nom.pengusulPhone ? `NO. HP / WA: ${nom.pengusulPhone}` : '',
            `STATUS: ${nom.status || 'Penilaian'}`,
          ].filter(Boolean);

          const pengusulRow = santriSheet.addRow([pengusulParts.join('   |   '), '', '', '', '', '', '', '', '', '', '', '']);
          const pRowNum = pengusulRow.number;
          santriSheet.mergeCells(pRowNum, 1, pRowNum, 12);
          pengusulRow.height = 30;
          pengusulRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          pengusulRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          for (let c = 1; c <= 12; c++) {
            const cell = pengusulRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } }; // Warm Amber
            cell.border = {
              top: { style: 'medium', color: { argb: 'FFB45309' } },
              left: { style: 'thin', color: { argb: 'FFB45309' } },
              bottom: { style: 'thin', color: { argb: 'FFB45309' } },
              right: { style: 'thin', color: { argb: 'FFB45309' } },
            };
          }

          // BARISAN KEDUA: HEADER KOLOM
          const colHeaderRow = santriSheet.addRow([
            'NO',
            'ID PERSONALIA',
            'NAMA SANTRI',
            'DOM / ALAMAT',
            'JENJANG',
            "NILAI SEMESTER I 'ALY",
            'NILAI IMDA I',
            'NILAI IMDA II',
            'PRESENSI HADIR',
            'KRITERIA YANG DICENTANG',
            'ALASAN PENILAIAN RESMI',
            'LAIN-LAIN',
          ]);
          colHeaderRow.height = 28;
          colHeaderRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
          colHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          for (let c = 1; c <= 12; c++) {
            const cell = colHeaderRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          }

          // BARISAN KE BAWAH: FIGUR 01 DAN FIGUR 02 URUT KE BAWAH
          const sList = nom.santriMuridIdentitas || [];
          for (let fIdx = 0; fIdx < 2; fIdx++) {
            const numStr = String(fIdx + 1).padStart(2, '0');
            const sItem = sList[fIdx] || (fIdx === 0 ? {
              idPersonalia: nom.idPps || nom.nipNik || '',
              nama: nom.candidateName || '',
              domisiliAlamat: nom.alamat || nom.domisili || '',
              jenjangTingkat: 'Aliyah',
              nilaiSemester1Aly: '',
              nilaiImda1: '',
              nilaiImda2: '',
              presensiKehadiran: '',
              checklist: nom.evaluationChecklist || {},
              alasanPenilaian: nom.justification || '',
              lainLainNote: nom.lainLainNote || '',
            } : null);

            const isAly = (sItem?.jenjangTingkat || 'Aliyah') === 'Aliyah';
            const kriteriaText = formatSantriCriteriaExport(sItem?.checklist || (fIdx === 0 ? nom.evaluationChecklist : undefined));

            const rawLainLain = (sItem?.lainLainNote && sItem.lainLainNote.trim())
              ? sItem.lainLainNote.trim()
              : (fIdx === 0 && nom.lainLainNote && nom.lainLainNote.trim())
                ? nom.lainLainNote.trim()
                : '';

            const dataRow = santriSheet.addRow([
              numStr,
              sItem?.idPersonalia || '-',
              sItem?.nama || '-',
              sItem?.domisiliAlamat || '-',
              sItem?.jenjangTingkat || 'Aliyah',
              isAly ? (sItem?.nilaiSemester1Aly || '-') : 'N/A (Bukan Aliyah)',
              !isAly ? (sItem?.nilaiImda1 || '-') : "N/A (Khusus Non-'Aly)",
              !isAly ? (sItem?.nilaiImda2 || '-') : "N/A (Khusus Non-'Aly)",
              sItem?.presensiKehadiran || '-',
              kriteriaText,
              sItem?.alasanPenilaian || (fIdx === 0 ? nom.justification : '') || '-',
              rawLainLain ? rawLainLain : '-',
            ]);

            styleDataRow(dataRow, fIdx % 2 === 1);
            dataRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
            dataRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
      }

      // 6. SHEET MURID TERBAIK
      // Format Standar Rapi: Barisan pertama adalah nama pengusul, barisan kedua kolom tabel, figur 01 dan 02 urut ke bawah bukan kesamping
      const muridData = dataToExport.filter(
        (n) => n.categoryId === 'cat-6' || toSafeLower(categories.find((c) => c.id === n.categoryId)?.title).includes('murid')
      );
      const muridSheet = workbook.addWorksheet('Murid Terbaik');
      muridSheet.getColumn(1).width = 8;   // NO (01, 02)
      muridSheet.getColumn(2).width = 20;  // ID PERSONALIA
      muridSheet.getColumn(3).width = 30;  // NAMA MURID
      muridSheet.getColumn(4).width = 32;  // DOM / ALAMAT
      muridSheet.getColumn(5).width = 14;  // JENJANG
      muridSheet.getColumn(6).width = 22;  // NILAI SEMESTER I 'ALY
      muridSheet.getColumn(7).width = 16;  // NILAI IMDA I
      muridSheet.getColumn(8).width = 16;  // NILAI IMDA II
      muridSheet.getColumn(9).width = 18;  // PRESENSI HADIR
      muridSheet.getColumn(10).width = 48; // KRITERIA YANG DICENTANG
      muridSheet.getColumn(11).width = 36; // ALASAN PENILAIAN RESMI
      muridSheet.getColumn(12).width = 28; // LAIN-LAIN

      if (muridData.length === 0) {
        const emptyRow = muridSheet.addRow(['NAMA PENGUSUL: (Belum ada data pengusulan murid terbaik tercatat)', '', '', '', '', '', '', '', '', '', '', '']);
        muridSheet.mergeCells(emptyRow.number, 1, emptyRow.number, 12);
        emptyRow.height = 30;
        emptyRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        emptyRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        for (let c = 1; c <= 12; c++) {
          emptyRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBE123C' } };
        }

        const hRow = muridSheet.addRow([
          'NO', 'ID PERSONALIA', 'NAMA MURID', 'DOM / ALAMAT', 'JENJANG', "NILAI SEMESTER I 'ALY", 'NILAI IMDA I', 'NILAI IMDA II', 'PRESENSI HADIR', 'KRITERIA YANG DICENTANG', 'ALASAN PENILAIAN RESMI', 'LAIN-LAIN'
        ]);
        hRow.height = 28;
        hRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        hRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        for (let c = 1; c <= 12; c++) {
          hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        }
      } else {
        muridData.forEach((nom, nomIdx) => {
          if (nomIdx > 0) {
            const sepRow = muridSheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '']);
            sepRow.height = 14;
          }

          // BARISAN PERTAMA: NAMA PENGUSUL
          const pengusulParts = [
            `NAMA PENGUSUL: ${nom.pengusulNama || nom.nominatorName || '-'}`,
            'KATEGORI: Penghargaan Murid Terbaik',
            nom.pengusulJabatan ? `JABATAN: ${nom.pengusulJabatan}` : '',
            nom.pengusulDomisili ? `DOMISILI: ${nom.pengusulDomisili}` : '',
            nom.pengusulAlamat ? `ALAMAT: ${nom.pengusulAlamat}` : '',
            nom.pengusulPhone ? `NO. HP / WA: ${nom.pengusulPhone}` : '',
            `STATUS: ${nom.status || 'Penilaian'}`,
          ].filter(Boolean);

          const pengusulRow = muridSheet.addRow([pengusulParts.join('   |   '), '', '', '', '', '', '', '', '', '', '', '']);
          const pRowNum = pengusulRow.number;
          muridSheet.mergeCells(pRowNum, 1, pRowNum, 12);
          pengusulRow.height = 30;
          pengusulRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          pengusulRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          for (let c = 1; c <= 12; c++) {
            const cell = pengusulRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBE123C' } }; // Deep Rose
            cell.border = {
              top: { style: 'medium', color: { argb: 'FFBE123C' } },
              left: { style: 'thin', color: { argb: 'FFBE123C' } },
              bottom: { style: 'thin', color: { argb: 'FFBE123C' } },
              right: { style: 'thin', color: { argb: 'FFBE123C' } },
            };
          }

          // BARISAN KEDUA: HEADER KOLOM
          const colHeaderRow = muridSheet.addRow([
            'NO',
            'ID PERSONALIA',
            'NAMA MURID',
            'DOM / ALAMAT',
            'JENJANG',
            "NILAI SEMESTER I 'ALY",
            'NILAI IMDA I',
            'NILAI IMDA II',
            'PRESENSI HADIR',
            'KRITERIA YANG DICENTANG',
            'ALASAN PENILAIAN RESMI',
            'LAIN-LAIN',
          ]);
          colHeaderRow.height = 28;
          colHeaderRow.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
          colHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          for (let c = 1; c <= 12; c++) {
            const cell = colHeaderRow.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          }

          // BARISAN KE BAWAH: FIGUR 01 DAN FIGUR 02 URUT KE BAWAH
          const sList = nom.santriMuridIdentitas || [];
          for (let fIdx = 0; fIdx < 2; fIdx++) {
            const numStr = String(fIdx + 1).padStart(2, '0');
            const sItem = sList[fIdx] || (fIdx === 0 ? {
              idPersonalia: nom.idPps || nom.nipNik || '',
              nama: nom.candidateName || '',
              domisiliAlamat: nom.alamat || nom.domisili || '',
              jenjangTingkat: 'Aliyah',
              nilaiSemester1Aly: '',
              nilaiImda1: '',
              nilaiImda2: '',
              presensiKehadiran: '',
              checklist: nom.evaluationChecklist || {},
              alasanPenilaian: nom.justification || '',
              lainLainNote: nom.lainLainNote || '',
            } : null);

            const isAly = (sItem?.jenjangTingkat || 'Aliyah') === 'Aliyah';
            const kriteriaText = formatMuridCriteriaExport(sItem?.checklist || (fIdx === 0 ? nom.evaluationChecklist : undefined));

            const rawLainLain = (sItem?.lainLainNote && sItem.lainLainNote.trim())
              ? sItem.lainLainNote.trim()
              : (fIdx === 0 && nom.lainLainNote && nom.lainLainNote.trim())
                ? nom.lainLainNote.trim()
                : '';

            const dataRow = muridSheet.addRow([
              numStr,
              sItem?.idPersonalia || '-',
              sItem?.nama || '-',
              sItem?.domisiliAlamat || '-',
              sItem?.jenjangTingkat || 'Aliyah',
              isAly ? (sItem?.nilaiSemester1Aly || '-') : 'N/A (Bukan Aliyah)',
              !isAly ? (sItem?.nilaiImda1 || '-') : "N/A (Khusus Non-'Aly)",
              !isAly ? (sItem?.nilaiImda2 || '-') : "N/A (Khusus Non-'Aly)",
              sItem?.presensiKehadiran || '-',
              kriteriaText,
              sItem?.alasanPenilaian || (fIdx === 0 ? nom.justification : '') || '-',
              rawLainLain ? rawLainLain : '-',
            ]);

            styleDataRow(dataRow, fIdx % 2 === 1);
            dataRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
            dataRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
            dataRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
      }

      // 7. SHEET MASTER LENGKAP (Semua Peserta)
      const masterSheet = workbook.addWorksheet('Semua Peserta (Master)');
      masterSheet.columns = [
        { header: 'NO', key: 'no', width: 6 },
        { header: 'ID PPS / PERSONALIA', key: 'idPps', width: 20 },
        { header: 'NAMA PESERTA / FIGUR', key: 'candidateName', width: 30 },
        { header: 'KATEGORI PENGANUGERAHAN', key: 'categoryTitle', width: 28 },
        { header: 'STATUS', key: 'status', width: 14 },
        { header: 'SKOR', key: 'score', width: 10 },
        { header: 'JABATAN / POSISI', key: 'position', width: 24 },
        { header: 'DOMISILI', key: 'domisili', width: 18 },
        { header: 'KELAS / TINGKAT', key: 'kelasTingkat', width: 18 },
        { header: 'NO. WHATSAPP', key: 'phone', width: 18 },
        { header: 'ALAMAT LENGKAP', key: 'alamat', width: 34 },
        { header: 'PRESTASI / NILAI IMDA', key: 'achievement', width: 32 },
        { header: 'ALASAN / JUSTIFIKASI', key: 'justification', width: 32 },
        { header: 'DATA PENGUSUL', key: 'pengusulInfo', width: 30 },
        { header: 'TANGGAL INPUT', key: 'createdAt', width: 16 },
      ];
      applySheetHeaderStyle(masterSheet.getRow(1), 'FF0F172A'); // Slate Navy

      dataToExport.forEach((nom, index) => {
        const categoryObj = categories.find((c) => c.id === nom.categoryId);
        const catTitle = categoryObj ? categoryObj.title : nom.categoryId;

        let extraDetails = nom.achievement || '';
        if (nom.santriMuridIdentitas && nom.santriMuridIdentitas.some((s) => s.nama || s.idPersonalia)) {
          const smDetails = nom.santriMuridIdentitas
            .filter((s) => s.nama || s.idPersonalia)
            .map((s, i) => `Figur 0${i + 1}: ${s.nama} (${s.jenjangTingkat || 'Aliyah'} - ${s.idPersonalia || '-'}) [Presensi: ${s.presensiKehadiran || '-'}]`)
            .join(' | ');
          extraDetails = extraDetails ? `${extraDetails} | ${smDetails}` : smDetails;
        } else if (nom.guruIdentitas && nom.guruIdentitas.some((g) => g.nama || g.idPersonalia)) {
          const gDetails = nom.guruIdentitas
            .filter((g) => g.nama || g.idPersonalia)
            .map((g, i) => `Guru 0${i + 1}: ${g.nama} (${g.idPersonalia || '-'}) [${g.jabatan || '-'}]`)
            .join(' | ');
          extraDetails = extraDetails ? `${extraDetails} | ${gDetails}` : gDetails;
        }

        const pengusulDetail = [
          nom.pengusulNama || nom.nominatorName || '-',
          nom.pengusulJabatan ? `(${nom.pengusulJabatan})` : '',
          nom.pengusulPhone ? `WA: ${nom.pengusulPhone}` : '',
        ]
          .filter(Boolean)
          .join(' ');

        const row = masterSheet.addRow({
          no: index + 1,
          idPps: nom.idPps || nom.nipNik || '-',
          candidateName: nom.candidateName || '-',
          categoryTitle: catTitle,
          status: nom.status || '-',
          score: nom.score || 0,
          position: nom.position || nom.department || '-',
          domisili: nom.domisili || '-',
          kelasTingkat: [nom.kelas, nom.tingkat].filter(Boolean).join(' / ') || '-',
          phone: nom.phone || '-',
          alamat: nom.alamat || '-',
          achievement: extraDetails || '-',
          justification: nom.justification || nom.alasanLain || '-',
          pengusulInfo: pengusulDetail,
          createdAt: nom.createdAt || '-',
        });
        styleDataRow(row, index % 2 === 1);
        row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('idPps').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('score').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('createdAt').alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Atur tab aktif Excel sesuai filter kategori yang dipilih pengguna
      let activeTabIndex = 0;
      if (selectedCategory === 'cat-1' || selectedCategory.includes('ranting')) {
        activeTabIndex = 0;
      } else if (selectedCategory === 'cat-2' || selectedCategory.includes('guru')) {
        activeTabIndex = 1;
      } else if (selectedCategory === 'cat-3' || selectedCategory.includes('alumni')) {
        activeTabIndex = 2;
      } else if (selectedCategory === 'cat-4' || selectedCategory.includes('pengurus')) {
        activeTabIndex = 3;
      } else if (selectedCategory === 'cat-5' || selectedCategory.includes('santri')) {
        activeTabIndex = 4;
      } else if (selectedCategory === 'cat-6' || selectedCategory.includes('murid')) {
        activeTabIndex = 5;
      }

      workbook.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: activeTabIndex, visibility: 'visible' }];

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
      const csvHeaders = ['NO', 'ID PPS', 'NAMA PESERTA', 'KATEGORI', 'STATUS', 'SKOR', 'JABATAN', 'NO HP', 'PENGUSUL'];
      const csvRows = dataToExport.map((nom, idx) => [
        idx + 1,
        nom.idPps || '-',
        nom.candidateName,
        categories.find((c) => c.id === nom.categoryId)?.title || nom.categoryId,
        nom.status,
        nom.score,
        nom.position || nom.department || '-',
        nom.phone || '-',
        nom.pengusulNama || nom.nominatorName || '-',
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

      {/* Top Header Box in Milad Sidogiri Clean Style (Mendukung Admin & Seluruh 5 Role Akun Petugas) */}
      <div className="bg-white border border-[rgba(36,33,28,0.12)] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Trophy className="w-5 h-5 text-[#8a7c4c]" />
            <h1 className="text-base font-extrabold text-[#24211c]">
              {isAdmin ? "Daftar Peserta & Nominasi Penganugerahan" : `Portal Pengusulan & Penilaian: ${userRoleOption.name}`}
            </h1>
            <span className="flex items-center space-x-1 text-[10px] font-bold bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8a7c4c] animate-pulse"></span>
              <span>{userRoleOption.badge}</span>
            </span>
          </div>
          <p className="text-xs text-[#7c7b77] mt-1">
            {isAdmin
              ? "Manajemen data lengkap peserta, penambahan atribut identitas (NIP/NIK, Jabatan, Kontak, Karya), penilaian, hingga penetapan pemenang."
              : `Hak akses penganugerahan khusus: ${userRoleOption.description}.`}
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
            onClick={() => handleOpenAdd()}
            className="flex items-center justify-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdmin ? 'Tambah Peserta Baru' : 'Ajukan Usulan Baru'}</span>
          </button>
        </div>
      </div>

      {/* Ketentuan dan Syarat Penilaian Nominasi (Dinamis Sesuai Kategori yang Diizinkan) */}
      <CollapsibleSection
        sectionId="nomination_assessment_guidelines"
        title="Ketentuan dan Syarat Penilaian Nominasi"
        subtitle={isAdmin ? "Standar kualifikasi, syarat kelayakan, serta kriteria dan bobot penilaian resmi untuk 6 kategori penganugerahan" : `Standar kualifikasi dan syarat resmi untuk ${visibleAwardRubrics.length} kategori yang ditugaskan`}
        icon={<Scale className="w-4 h-4 text-[#8a7c4c]" />}
        badge={
          <span className="text-[10px] font-extrabold bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
            {visibleAwardRubrics.length} Kategori Ditampilkan
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
              (activeRubric.id === 'cat-2' && isGuruCategoryItem(c.id, c.title)) ||
              (activeRubric.id === 'cat-3' && c.title.toLowerCase().includes('alumni')) ||
              (activeRubric.id === 'cat-4' && isPengurusCategoryItem(c.id, c.title)) ||
              (activeRubric.id === 'cat-5' && c.title.toLowerCase().includes('santri')) ||
              (activeRubric.id === 'cat-6' && c.title.toLowerCase().includes('murid'))
          );

          const activeCatId = matchedCat ? matchedCat.id : activeRubric.id;
          const matchingNoms = nominations.filter((n) => {
            const nomCatId = typeof n.categoryId === 'string' ? n.categoryId.toLowerCase() : '';
            return (
              n.categoryId === activeRubric.id ||
              (matchedCat && n.categoryId === matchedCat.id) ||
              (activeRubric.id === 'cat-1' && nomCatId.includes('ranting')) ||
              (activeRubric.id === 'cat-2' && isGuruCategoryItem(n.categoryId, '')) ||
              (activeRubric.id === 'cat-3' && nomCatId.includes('alumni')) ||
              (activeRubric.id === 'cat-4' && isPengurusCategoryItem(n.categoryId, '')) ||
              (activeRubric.id === 'cat-5' && nomCatId.includes('santri')) ||
              (activeRubric.id === 'cat-6' && nomCatId.includes('murid'))
            );
          });
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
                {visibleAwardRubrics.map((rubric) => {
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
                      onClick={() => {
                        setActiveRubricId(rubric.id);
                        setCategoryId(rubric.id);
                      }}
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

                            <button
                              type="button"
                              onClick={() => handleOpenAdd(activeCatId)}
                              className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                              title="Tambah peserta baru untuk kategori ini"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Tambah Peserta Kategori Ini</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAdd(activeCatId)}
                              className="flex items-center space-x-1.5 bg-[#8a7c4c] hover:bg-[#675c37] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                              title="Isi Formulir Usulan Calon Penerima Anugerah"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Isi Usulan ({displayTitle})</span>
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

      {/* Main Participants List & Awarding Section (Mendukung Admin & Seluruh 5 Role Akun Petugas) */}
      <CollapsibleSection
        sectionId="nomination_list_section"
        title={isAdmin ? "Daftar Peserta Nominasi & Penganugerahan" : "Daftar Usulan & Peserta Nominasi"}
        subtitle={isAdmin ? "Kelola data pendaftaran calon penerima, verifikasi kelayakan, rekap skor penjurian, dan penetapan pemenang resmi Milad Sidogiri" : `Daftar usulan calon penerima anugerah untuk kewenangan: ${userRoleOption.description}`}
        icon={<Trophy className="w-4 h-4 text-[#8a7c4c]" />}
        defaultOpen={true}
        badge={
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold bg-[#f2eee3] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8a7c4c] animate-pulse"></span>
              <span>{userRoleOption.badge}</span>
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
              {(categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS)
                .filter((cat) => isAdmin || allowedCategoryIds.includes(cat.id))
                .map((cat) => {
                const count = nominations.filter((n) => {
                  const nomCatId = toSafeLower(n.categoryId);
                  const catTitleLower = toSafeLower(cat.title);
                  return (
                    n.categoryId === cat.id ||
                    (cat.id === 'cat-1' && (nomCatId.includes('ranting') || catTitleLower.includes('ranting'))) ||
                    (cat.id === 'cat-2' && (isGuruCategoryItem(n.categoryId, '') || isGuruCategoryItem(cat.id, cat.title))) ||
                    (cat.id === 'cat-3' && (nomCatId.includes('alumni') || catTitleLower.includes('alumni'))) ||
                    (cat.id === 'cat-4' && (isPengurusCategoryItem(n.categoryId, '') || isPengurusCategoryItem(cat.id, cat.title))) ||
                    (cat.id === 'cat-5' && (nomCatId.includes('santri') || catTitleLower.includes('santri'))) ||
                    (cat.id === 'cat-6' && (nomCatId.includes('murid') || catTitleLower.includes('murid')))
                  );
                }).length;
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

                          {/* 5 Identitas Guru MMU jika ada */}
                          {nom.guruIdentitas && nom.guruIdentitas.some((g) => g.nama || g.idPersonalia) && (
                            <div className="bg-[#faf8f4] border border-[#dcd7cb] rounded-2xl p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between border-b border-[#e8e4da] pb-1.5">
                                <span className="font-extrabold text-[#675c37] text-[10.5px] uppercase tracking-wider flex items-center space-x-1.5">
                                  <Users className="w-3.5 h-3.5 text-[#8a7c4c]" />
                                  <span>5 Identitas Guru yang Tercantum:</span>
                                </span>
                                <span className="text-[10px] font-bold text-[#8a7c4c] bg-white px-2 py-0.5 rounded-md border border-[#dcd7cb]">
                                  {nom.guruIdentitas.filter((g) => g.nama || g.idPersonalia).length} Terdata
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {nom.guruIdentitas.map((g, gi) => {
                                  if (!g.nama && !g.idPersonalia) return null;
                                  return (
                                    <div key={gi} className="text-xs bg-white p-2 rounded-xl border border-[#e8e4da] flex flex-wrap items-center justify-between gap-1.5 shadow-2xs">
                                      <div className="flex items-center space-x-2">
                                        <span className="w-5 h-5 rounded-lg bg-[#8a7c4c] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                          0{gi + 1}
                                        </span>
                                        <span className="font-bold text-[#24211c]">{g.nama || '-'}</span>
                                        {g.idPersonalia && (
                                          <span className="text-[10px] font-mono font-bold text-[#8a7c4c] bg-[#faf8f4] px-1.5 py-0.2 rounded border border-[#dcd7cb]">
                                            {g.idPersonalia}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-[#5c5b57] flex flex-wrap items-center gap-1.5">
                                        {g.domisiliAlamat && <span>📍 {g.domisiliAlamat}</span>}
                                        {g.jabatan && <span className="font-semibold text-[#8a7c4c]">• {g.jabatan}</span>}
                                        {g.checklist && Object.values(g.checklist).filter(Boolean).length > 0 && (
                                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                            ✓ {Object.values(g.checklist).filter(Boolean).length}/13 Kriteria
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 2 Identitas Santri / Murid Terbaik jika ada */}
                          {nom.santriMuridIdentitas && nom.santriMuridIdentitas.some((s) => s.nama || s.idPersonalia) && (
                            <div className="bg-[#faf8f4] border border-[#dcd7cb] rounded-2xl p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between border-b border-[#e8e4da] pb-1.5">
                                <span className="font-extrabold text-[#675c37] text-[10.5px] uppercase tracking-wider flex items-center space-x-1.5">
                                  <GraduationCap className="w-3.5 h-3.5 text-[#8a7c4c]" />
                                  <span>2 Identitas Santri / Murid Tercantum:</span>
                                </span>
                                <span className="text-[10px] font-bold text-[#8a7c4c] bg-white px-2 py-0.5 rounded-md border border-[#dcd7cb]">
                                  {nom.santriMuridIdentitas.filter((s) => s.nama || s.idPersonalia).length} Terdata
                                </span>
                              </div>
                              <div className="space-y-2">
                                {nom.santriMuridIdentitas.map((s, si) => {
                                  if (!s.nama && !s.idPersonalia) return null;
                                  return (
                                    <div key={si} className="text-xs bg-white p-2.5 rounded-xl border border-[#e8e4da] space-y-1.5 shadow-2xs">
                                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                                        <div className="flex items-center space-x-2">
                                          <span className="w-5 h-5 rounded-lg bg-[#8a7c4c] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                            0{si + 1}
                                          </span>
                                          <span className="font-bold text-[#24211c]">{s.nama || '-'}</span>
                                          {s.idPersonalia && (
                                            <span className="text-[10px] font-mono font-bold text-[#8a7c4c] bg-[#faf8f4] px-1.5 py-0.2 rounded border border-[#dcd7cb]">
                                              {s.idPersonalia}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {s.domisiliAlamat && (
                                            <span className="text-[11px] text-[#5c5b57]">📍 {s.domisiliAlamat}</span>
                                          )}
                                          {s.checklist && Object.values(s.checklist).filter(Boolean).length > 0 && (
                                            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                              ✓ {Object.values(s.checklist).filter(Boolean).length} Kriteria Terpenuhi
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-[#f2eee3] text-[10.5px]">
                                        <div className="bg-[#faf8f4] px-2 py-1 rounded border border-[#e8e4da]">
                                          <span className="text-[#7c7b77] block text-[9.5px]">Imda I:</span>
                                          <span className="font-bold text-[#24211c]">{s.nilaiImda1 || '-'}</span>
                                        </div>
                                        <div className="bg-[#faf8f4] px-2 py-1 rounded border border-[#e8e4da]">
                                          <span className="text-[#7c7b77] block text-[9.5px]">Imda II:</span>
                                          <span className="font-bold text-[#24211c]">{s.nilaiImda2 || '-'}</span>
                                        </div>
                                        <div className="bg-[#faf8f4] px-2 py-1 rounded border border-[#e8e4da]">
                                          <span className="text-[#7c7b77] block text-[9.5px]">Sem 1 'Aly:</span>
                                          <span className="font-bold text-[#24211c]">{s.nilaiSemester1Aly || '-'}</span>
                                        </div>
                                        <div className="bg-[#faf8f4] px-2 py-1 rounded border border-[#e8e4da]">
                                          <span className="text-[#7c7b77] block text-[9.5px]">Presensi:</span>
                                          <span className="font-bold text-emerald-700">{s.presensiKehadiran || '-'}</span>
                                        </div>
                                      </div>
                                      {s.lainLainNote && (
                                        <div className="text-[10.5px] text-[#5c5b57] italic bg-[#faf8f4] p-1.5 rounded-lg border border-[#e8e4da]">
                                          <span className="font-bold not-italic text-[#7c7b77]">Catatan: </span>
                                          {s.lainLainNote}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Bukti & Alasan Kriteria Alumni */}
                          {nom.alumniCriteriaReasons && Object.keys(nom.alumniCriteriaReasons).length > 0 && (
                            <div className="bg-[#faf8f4] border border-[#dcd7cb] rounded-2xl p-3 space-y-2">
                              <span className="font-extrabold text-[#675c37] text-[10.5px] uppercase tracking-wider flex items-center space-x-1.5 border-b border-[#e8e4da] pb-1">
                                <FileCheck className="w-3.5 h-3.5 text-[#8a7c4c]" />
                                <span>Alasan Pembuktian Kriteria Alumni:</span>
                              </span>
                              <div className="space-y-1.5 text-xs">
                                {Object.entries(nom.alumniCriteriaReasons).map(([critId, reason]) => {
                                  const critObj = ALUMNI_CRITERIA_LIST.find((c) => c.id === critId);
                                  return (
                                    <div key={critId} className="bg-white p-2.5 rounded-xl border border-[#e8e4da] shadow-2xs">
                                      <strong className="text-[#8a7c4c] block text-[11px]">
                                        {critObj?.title || critId}:
                                      </strong>
                                      <p className="text-[#24211c] text-xs mt-0.5 leading-relaxed">{reason}</p>
                                    </div>
                                  );
                                })}
                              </div>
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

                        {/* Admin / Petugas Action Buttons */}
                        <div className="flex items-center space-x-1.5 ml-auto">
                          {isAdmin && !isWinner && (
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
                            title={isAdmin ? "Edit Data Peserta & Rubrik" : "Lihat / Edit Detail Usulan"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => onDeleteNomination(nom.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
                              title="Hapus Data Peserta"
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
                              {nom.guruIdentitas && nom.guruIdentitas.some((g) => g.nama || g.idPersonalia) && (
                                <div className="text-[9.5px] font-extrabold text-[#675c37] bg-[#ede9df] px-1.5 py-0.2 rounded border border-[#c3b68b]/30 w-fit mt-0.5 flex items-center space-x-1">
                                  <Users className="w-3 h-3 text-[#8a7c4c]" />
                                  <span>5 Guru Terdaftar</span>
                                </div>
                              )}
                              {nom.santriMuridIdentitas && nom.santriMuridIdentitas.some((s) => s.nama || s.idPersonalia) && (
                                <div className="text-[9.5px] font-extrabold text-[#675c37] bg-[#ede9df] px-1.5 py-0.2 rounded border border-[#c3b68b]/30 w-fit mt-0.5 flex items-center space-x-1">
                                  <GraduationCap className="w-3 h-3 text-[#8a7c4c]" />
                                  <span>2 Santri/Murid Terdaftar</span>
                                </div>
                              )}
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
                                {isAdmin && !isWinner && (
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
                                  title={isAdmin ? "Edit Data Peserta" : "Lihat / Edit Detail Usulan"}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteNomination(nom.id)}
                                    className="p-1.5 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
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

      {/* Modal Add / Edit Nomination (Form LENGKAP Data Peserta & Rubrik Dinamis Sesuai Kategori) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#24211c]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl sm:max-w-4xl rounded-3xl shadow-2xl border border-[rgba(36,33,28,0.15)] overflow-hidden text-[#24211c] max-h-[92vh] flex flex-col my-auto">
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
              {/* Info Cabang Penganugerahan (Ditentukan Langsung dari Kolom CABANG PENGANUGERAHAN, Tanpa Perlu Klik Pilihan Lagi di Form) */}
              {(() => {
                const activeFormCat = (categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).find((c) => c.id === categoryId) || categories.find((c) => c.id === categoryId) || OFFICIAL_AWARD_RUBRICS[0];
                const isGuru = isGuruCategoryItem(categoryId, activeFormCat?.title);
                const isSantriMurid = isSantriMuridCategoryItem(categoryId, activeFormCat?.title);

                return (
                  <div className="bg-[#ede9df]/75 border border-[#c3b68b]/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#8a7c4c] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#8a7c4c]">
                            Cabang Penganugerahan
                          </span>
                        </div>
                        <select
                          value={categoryId}
                          disabled={!isAdmin && !!editingNomination}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setCategoryId(newId);
                            setActiveRubricId(newId);
                          }}
                          className="mt-1 block text-sm sm:text-base font-black text-[#24211c] bg-white border border-[#c3b68b]/70 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-[#8a7c4c]/20 focus:outline-none cursor-pointer shadow-2xs"
                        >
                          {(categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS)
                            .filter((cat) => isAdmin || allowedCategoryIds.includes(cat.id))
                            .map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs font-bold text-[#675c37] bg-white px-3 py-1.5 rounded-xl border border-[#dcd7cb] shadow-2xs">
                        {isGuru
                          ? '⚡ Format Khusus: 5 Identitas Guru Terstruktur'
                          : isSantriMurid
                          ? "⚡ Format Khusus: 2 Identitas & Nilai Imda I, II, Semester I 'Aly & Presensi"
                          : '⚡ Format Standar: 1 Identitas Calon Penerima Anugerah'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Seksi 1: Identitas Pengusul (Otomatis Terisi Sesuai Login Akun) */}
              {(() => {
                const activeFormCat = (categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).find((c) => c.id === categoryId) || categories.find((c) => c.id === categoryId) || OFFICIAL_AWARD_RUBRICS[0];
                const isRantingCategory = categoryId === 'cat-1' || toSafeLower(activeFormCat?.title).includes('ranting');
                const isAlumniCategory = categoryId === 'cat-3' || toSafeLower(activeFormCat?.title).includes('alumni');

                return (
                  <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between border-b border-[#e8e4da] pb-2.5 gap-2">
                      <div className="flex items-center space-x-2 text-[#8a7c4c]">
                        <UserCheck className="w-4 h-4" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#24211c]">
                          1. Identitas Pengusul {isRantingCategory ? '(Ranting: Nama, Jabatan, Domisili, Alamat)' : isAlumniCategory ? '(Alumni: Nama, Jabatan, Domisili, Alamat, No HP)' : ''}
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

                      <div className={`grid grid-cols-1 ${isRantingCategory ? 'sm:grid-cols-1' : 'sm:grid-cols-2'} gap-3.5`}>
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
                            className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                          />
                        </div>

                        {/* E. No. HP / WhatsApp Pengusul (Wajib untuk Alumni, tidak diperlukan di form Ranting) */}
                        {!isRantingCategory && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-[#24211c]">
                                E. No. HP / WhatsApp Pengusul {isAlumniCategory && <span className="text-rose-500">*</span>}
                              </label>
                              <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                                (Otomatis sesuai akun login / aktif)
                              </span>
                            </div>
                            <input
                              type="text"
                              required={isAlumniCategory}
                              placeholder="Nomor WhatsApp pengusul (contoh: 08123456789)..."
                              value={pengusulPhone}
                              readOnly={!isAdmin && !!editingNomination}
                              onChange={(e) => setPengusulPhone(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] font-mono focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Seksi 2: Identitas Peserta yang Diusulkan (Kondisional: HANYA 5 Identitas Guru ATAU 1 Identitas Tunggal untuk Pengurus, Ranting, dll) */}
              {(() => {
                const activeCatObj = (categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).find((c) => c.id === categoryId) || categories.find((c) => c.id === categoryId) || OFFICIAL_AWARD_RUBRICS[0];
                const isGuruSelected = isGuruCategoryItem(categoryId, activeCatObj?.title);

                if (isGuruSelected) {
                  return (
                    <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between border-b border-[#e8e4da] pb-2.5 gap-2">
                        <div className="flex items-center space-x-2 text-[#8a7c4c]">
                          <IdCard className="w-4 h-4" />
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            2. Identitas Pengusulan Guru (Mencakup 5 Identitas Lengkap)
                          </h4>
                        </div>
                        <span className="text-[10.5px] font-extrabold bg-[#ede9df] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
                          Peraturan Resmi: Wajib 5 Identitas Terstruktur
                        </span>
                      </div>

                      <p className="text-xs text-[#5c5b57] leading-relaxed">
                        Sesuai peraturan untuk penghargaan guru: mencantumkan <strong>5 identitas</strong> yang dari masing-masing identitas mencakup (<strong>id personalia</strong>, <strong>nama</strong>, <strong>dom/alamat</strong>, <strong>Jabatan</strong>). Seluruh kolom diurut dari atas ke bawah dengan panjang dan lebar kolom yang sama.
                      </p>

                      {/* 5 Identitas Guru Diurut dari Atas ke Bawah */}
                      <div className="space-y-4">
                        {[0, 1, 2, 3, 4].map((idx) => {
                          const numStr = String(idx + 1).padStart(2, '0');
                          const item = guruIdentitas[idx] || { idPersonalia: '', nama: '', domisiliAlamat: '', jabatan: '' };

                          return (
                            <div
                              key={idx}
                              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#dcd7cb] shadow-2xs space-y-4 transition hover:border-[#8a7c4c]/60"
                            >
                              {/* Header Identitas Sesuai Format Permintaan User: identitas 0X. mencakup ( id personalia , nama, dom/alamat, Jabatan ) */}
                              <div className="flex items-center justify-between border-b border-[#f2eee3] pb-2.5">
                                <div className="flex items-center space-x-2.5">
                                  <span className="w-7 h-7 rounded-xl bg-[#8a7c4c] text-white text-xs font-black flex items-center justify-center shadow-2xs shrink-0">
                                    {numStr}
                                  </span>
                                  <h5 className="text-xs sm:text-sm font-extrabold text-[#24211c] tracking-tight">
                                    identitas {numStr}. mencakup ( id personalia , nama, dom/alamat, Jabatan )
                                  </h5>
                                </div>
                                <span className="text-[10px] font-bold text-[#8a7c4c] bg-[#faf8f4] px-2.5 py-0.5 rounded-md border border-[#e8e4da] hidden sm:inline-block">
                                  Figur Guru {numStr}
                                </span>
                              </div>

                              {/* Kolom-kolom diurut dari atas ke bawah dengan panjang kolom dan lebarnya sama persis */}
                              <div className="space-y-3.5">
                                {/* 1. Kolom ID Personalia */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#24211c]">
                                      ID Personalia {idx === 0 && <span className="text-rose-500">*</span>}
                                    </label>
                                    <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                      Kolom ID Personalia (Panjang & lebar sama)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    required={idx === 0}
                                    placeholder={`ID Personalia guru identitas ${numStr}... (contoh: IDP-MMU-${numStr})`}
                                    value={item.idPersonalia}
                                    readOnly={!isAdmin && !!editingNomination}
                                    onChange={(e) => updateGuruIdentitas(idx, 'idPersonalia', e.target.value)}
                                    className="w-full h-11 px-3.5 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-mono font-bold text-[#8a7c4c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:bg-white focus:outline-none transition shadow-2xs"
                                  />
                                </div>

                                {/* 2. Kolom Nama */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#24211c]">
                                      Nama {idx === 0 && <span className="text-rose-500">*</span>}
                                    </label>
                                    <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                      Kolom Nama (Panjang & lebar sama)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    required={idx === 0}
                                    placeholder={`Nama lengkap figur guru identitas ${numStr}...`}
                                    value={item.nama}
                                    readOnly={!isAdmin && !!editingNomination}
                                    onChange={(e) => {
                                      updateGuruIdentitas(idx, 'nama', e.target.value);
                                      if (idx === 0 && (!candidateName || candidateName.startsWith('Nominasi 5 Guru'))) {
                                        setCandidateName(e.target.value);
                                      }
                                    }}
                                    className="w-full h-11 px-3.5 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-semibold text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:bg-white focus:outline-none transition shadow-2xs"
                                  />
                                </div>

                                {/* 3. Kolom Dom/Alamat */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#24211c]">
                                      Dom / Alamat {idx === 0 && <span className="text-rose-500">*</span>}
                                    </label>
                                    <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                      Kolom Dom/Alamat (Panjang & lebar sama)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    required={idx === 0}
                                    placeholder={`Domisili atau alamat lengkap figur guru identitas ${numStr}...`}
                                    value={item.domisiliAlamat}
                                    readOnly={!isAdmin && !!editingNomination}
                                    onChange={(e) => updateGuruIdentitas(idx, 'domisiliAlamat', e.target.value)}
                                    className="w-full h-11 px-3.5 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:bg-white focus:outline-none transition shadow-2xs"
                                  />
                                </div>

                                {/* 4. Kolom Jabatan */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#24211c]">
                                      Jabatan {idx === 0 && <span className="text-rose-500">*</span>}
                                    </label>
                                    <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                      Kolom Jabatan (Panjang & lebar sama)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    required={idx === 0}
                                    placeholder={`Jabatan pengajaran / kepengurusan guru identitas ${numStr}...`}
                                    value={item.jabatan}
                                    readOnly={!isAdmin && !!editingNomination}
                                    onChange={(e) => updateGuruIdentitas(idx, 'jabatan', e.target.value)}
                                    className="w-full h-11 px-3.5 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:bg-white focus:outline-none transition shadow-2xs"
                                  />
                                </div>

                                {/* Kriteria & Alasan Penilaian Resmi Khusus Guru Identitas {numStr} */}
                                <div className="mt-4 pt-3.5 border-t border-[#dcd7cb] bg-[#f7f5ef] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-2xl space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2 text-[#8a7c4c]">
                                      <CheckSquare className="w-4 h-4 shrink-0" />
                                      <h5 className="text-xs font-black uppercase tracking-wider text-[#24211c]">
                                        Kriteria & Alasan Penilaian Resmi: Identitas {numStr} {item.nama ? `(${item.nama})` : ''}
                                      </h5>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                      {isAdmin && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => checkAllGuru(idx)}
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ede9df] hover:bg-[#e2ded2] text-[#675c37] border border-[#c3b68b]/40 cursor-pointer transition shadow-2xs"
                                          >
                                            ✓ Centang Semua
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => uncheckAllGuru(idx)}
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 cursor-pointer transition shadow-2xs"
                                          >
                                            ✕ Reset
                                          </button>
                                        </>
                                      )}
                                      <span className="text-[10.5px] font-bold bg-[#ede9df] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
                                        Tercentang: {GURU_CRITERIA_LIST.filter((c) => !!item.checklist?.[c.id]).length} / 13 Kriteria
                                      </span>
                                    </div>
                                  </div>

                                  {/* 13 Checklist Kriteria Resmi Guru */}
                                  <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2">
                                    <span className="font-extrabold text-[11px] text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                                      1. KRITERIA / ALASAN YANG DINILAI (13 POIN RESMI ASATIDZ / GURU)
                                    </span>
                                    <div className="space-y-2.5 pt-1 text-xs">
                                      {GURU_CRITERIA_LIST.map((crit) => (
                                        <label key={crit.id} className="flex items-start space-x-2.5 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={!!item.checklist?.[crit.id]}
                                            onChange={() => toggleGuruChecklist(idx, crit.id)}
                                            className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer mt-0.5 shrink-0"
                                          />
                                          <span className="text-slate-800 leading-snug font-medium text-xs">
                                            {crit.label}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* 2. LAIN-LAIN (Catatan Tambahan untuk Guru {numStr}) */}
                                  <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="block font-extrabold text-[11px] text-[#24211c]">
                                        2. LAIN-LAIN (Catatan Tambahan untuk Identitas {numStr}):
                                      </label>
                                      <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                                        Kolom isian bebas (dapat diedit)
                                      </span>
                                    </div>
                                    <textarea
                                      rows={2}
                                      placeholder={`Catatan tambahan pertimbangan khusus untuk asatidz/guru identitas ${numStr}...`}
                                      value={item.lainLainNote || ''}
                                      readOnly={!isAdmin && !!editingNomination}
                                      onChange={(e) => updateGuruIdentitas(idx, 'lainLainNote', e.target.value)}
                                      className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const isSantriMuridSelected = isSantriMuridCategoryItem(categoryId, activeCatObj?.title);

                if (isSantriMuridSelected) {
                  const isCurrentSantri = categoryId === 'cat-5' || toSafeLower(activeCatObj?.title).includes('santri');
                  const categoryTitleDisplay = isCurrentSantri ? 'Penghargaan Santri Terbaik' : 'Penghargaan Murid Terbaik';
                  const activeCriteriaList = isCurrentSantri ? SANTRI_CRITERIA_LIST : MURID_CRITERIA_LIST;
                  const criteriaTitleSection = isCurrentSantri
                    ? '1. KRITERIA & KETERTIBAN SANTRI (4 POIN RESMI SANTRI MUKIM)'
                    : '1. PRESTASI AKADEMIK MADRASAH MMU (3 POIN RESMI MURID MMU)';

                  return (
                    <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between border-b border-[#e8e4da] pb-2.5 gap-2">
                        <div className="flex items-center space-x-2 text-[#8a7c4c]">
                          <GraduationCap className="w-4 h-4" />
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            2. Identitas Pengusulan Calon: {categoryTitleDisplay} (Mencakup 2 Identitas Lengkap)
                          </h4>
                        </div>
                        <span className="text-[10.5px] font-extrabold bg-[#ede9df] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
                          Peraturan Resmi: Wajib 2 Identitas Terstruktur
                        </span>
                      </div>

                      <p className="text-xs text-[#5c5b57] leading-relaxed">
                        Sesuai peraturan untuk {categoryTitleDisplay.toLowerCase()}: mencantumkan <strong>2 identitas</strong> yang dari masing-masing identitas mencakup (<strong>id personalia</strong>, <strong>nama</strong>, <strong>dom/alamat</strong>), <strong>nilai imda I, II &amp; semester I untuk tingkat 'Aly</strong>, <strong>presensi kehadiran</strong>, serta <strong>kriteria &amp; alasan penilaian resmi</strong> sebagai syarat dari masing-masing identitas. Seluruh kolom diurut dari atas ke bawah dengan panjang dan lebar kolom yang sama.
                      </p>

                      {/* 2 Identitas Santri / Murid Diurut dari Atas ke Bawah */}
                      <div className="space-y-4">
                        {[0, 1].map((idx) => {
                          const numStr = String(idx + 1).padStart(2, '0');
                          const item = santriMuridIdentitas[idx] || {
                            idPersonalia: '',
                            nama: '',
                            domisiliAlamat: '',
                            nilaiImda1: '',
                            nilaiImda2: '',
                            nilaiSemester1Aly: '',
                            presensiKehadiran: '',
                            checklist: {},
                            lainLainNote: '',
                          };

                          return (
                            <div
                              key={idx}
                              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#dcd7cb] shadow-2xs space-y-4 transition hover:border-[#8a7c4c]/60"
                            >
                              {/* Header Identitas */}
                              <div className="flex items-center justify-between border-b border-[#f2eee3] pb-2.5">
                                <div className="flex items-center space-x-2.5">
                                  <span className="w-7 h-7 rounded-xl bg-[#8a7c4c] text-white text-xs font-black flex items-center justify-center shadow-2xs shrink-0">
                                    {numStr}
                                  </span>
                                  <h5 className="text-xs sm:text-sm font-extrabold text-[#24211c] tracking-tight">
                                    identitas {numStr}. mencakup ( id personalia , nama, dom/alamat ) &amp; syarat prestasi
                                  </h5>
                                </div>
                                <span className="text-[10px] font-bold text-[#8a7c4c] bg-[#faf8f4] px-2.5 py-0.5 rounded-md border border-[#e8e4da] hidden sm:inline-block">
                                  Figur Calon {numStr}
                                </span>
                              </div>

                              {/* Kolom-kolom diurut dari atas ke bawah dengan panjang kolom dan lebarnya sama persis */}
                              <div className="space-y-3.5">
                                {/* 1. Kolom ID Personalia */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#24211c]">
                                      ID Personalia {idx === 0 && <span className="text-rose-500">*</span>}
                                    </label>
                                    <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                      Kolom ID Personalia (Panjang &amp; lebar sama)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    required={idx === 0}
                                    placeholder={`ID Personalia santri/murid identitas ${numStr}... (contoh: IDP-MMU-${numStr})`}
                                    value={item.idPersonalia}
                                    readOnly={!isAdmin && !!editingNomination}
                                    onChange={(e) => updateSantriMuridIdentitas(idx, 'idPersonalia', e.target.value)}
                                    className="w-full h-11 px-3.5 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-mono font-bold text-[#8a7c4c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:bg-white focus:outline-none transition shadow-2xs"
                                  />
                                </div>

                                {/* 2. Kolom Nama */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#24211c]">
                                      Nama {idx === 0 && <span className="text-rose-500">*</span>}
                                    </label>
                                    <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                      Kolom Nama (Panjang &amp; lebar sama)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    required={idx === 0}
                                    placeholder={`Nama lengkap santri/murid identitas ${numStr}...`}
                                    value={item.nama}
                                    readOnly={!isAdmin && !!editingNomination}
                                    onChange={(e) => {
                                      updateSantriMuridIdentitas(idx, 'nama', e.target.value);
                                      if (idx === 0 && (!candidateName || candidateName.startsWith('Nominasi 2 Santri') || candidateName.startsWith('Nominasi 2 Murid'))) {
                                        setCandidateName(e.target.value);
                                      }
                                    }}
                                    className="w-full h-11 px-3.5 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-semibold text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:bg-white focus:outline-none transition shadow-2xs"
                                  />
                                </div>

                                {/* 3. Kolom Dom/Alamat */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#24211c]">
                                      Dom / Alamat {idx === 0 && <span className="text-rose-500">*</span>}
                                    </label>
                                    <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                      Kolom Dom/Alamat (Panjang &amp; lebar sama)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    required={idx === 0}
                                    placeholder={`Domisili atau alamat lengkap santri/murid identitas ${numStr}...`}
                                    value={item.domisiliAlamat}
                                    readOnly={!isAdmin && !!editingNomination}
                                    onChange={(e) => updateSantriMuridIdentitas(idx, 'domisiliAlamat', e.target.value)}
                                    className="w-full h-11 px-3.5 py-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:bg-white focus:outline-none transition shadow-2xs"
                                  />
                                </div>

                                {/* Syarat Nilai Imda I, II & Semester I untuk Tingkat 'Aly serta Presensi Kehadiran & Kriteria Resmi sebagai syarat identitas {numStr} */}
                                <div className="mt-4 pt-3.5 border-t border-[#dcd7cb] bg-[#f7f5ef] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-2xl space-y-3.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2 text-[#8a7c4c]">
                                      <ClipboardCheck className="w-4 h-4 shrink-0" />
                                      <h5 className="text-xs font-black uppercase tracking-wider text-[#24211c]">
                                        Syarat Penilaian: Nilai Imda &amp; Presensi Identitas {numStr} {item.nama ? `(${item.nama})` : ''}
                                      </h5>
                                    </div>
                                    <span className="text-[10px] font-bold bg-[#ede9df] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
                                      Syarat Wajib Identitas {numStr}
                                    </span>
                                  </div>

                                  {/* Pilihan Jenjang Pendidikan: Aliyah vs Tsanawiyah / Ibtidaiyah / Idadiyah */}
                                  <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                                      <label className="block text-xs font-bold text-[#24211c]">
                                        Pilih Jenjang / Tingkat Pendidikan Identitas {numStr}:
                                      </label>
                                      <span className="text-[10px] font-bold text-[#8a7c4c] bg-[#faf8f4] px-2 py-0.5 rounded border border-[#e8e4da]">
                                        Tingkat Aktif: {item.jenjangTingkat || 'Aliyah'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {(['Aliyah', 'Tsanawiyah', 'Ibtidaiyah', 'Idadiyah'] as const).map((jenjang) => {
                                        const isSelected = (item.jenjangTingkat || 'Aliyah') === jenjang;
                                        return (
                                          <button
                                            key={jenjang}
                                            type="button"
                                            disabled={!isAdmin && !!editingNomination}
                                            onClick={() => updateSantriMuridIdentitas(idx, 'jenjangTingkat', jenjang)}
                                            className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-center cursor-pointer shadow-2xs ${
                                              isSelected
                                                ? 'bg-[#8a7c4c] text-white border-[#8a7c4c]'
                                                : 'bg-[#faf8f4] text-[#24211c] border-[#dcd7cb] hover:bg-[#ede9df]'
                                            }`}
                                          >
                                            {jenjang === 'Aliyah' ? "Aliyah (Tingkat 'Aly)" : jenjang}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <p className="text-[10.5px] text-[#7c7b77] italic leading-relaxed pt-0.5">
                                      * Ketentuan Resmi: Jika <strong>Aliyah</strong> maka menampilkan kolom <strong>Nilai Semester I</strong> dan <strong>Presensi Kehadiran</strong>. Jika <strong>Tsanawiyah, Ibtidaiyah, atau Idadiyah</strong> maka menampilkan kolom <strong>Nilai Imda I</strong>, <strong>Nilai Imda II</strong>, serta <strong>Presensi Kehadiran</strong>.
                                    </p>
                                  </div>

                                  {/* Kolom Nilai & Presensi Kondisional Sesuai Jenjang */}
                                  {(item.jenjangTingkat || 'Aliyah') === 'Aliyah' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                      {/* 1. Nilai Semester I untuk Tingkat 'Aly / Aliyah */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <label className="block text-xs font-bold text-[#24211c]">
                                            Nilai Semester I (Tingkat 'Aly / Aliyah) {idx === 0 && <span className="text-rose-500">*</span>}
                                          </label>
                                          <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                            Syarat Aliyah
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          required={idx === 0}
                                          placeholder="Contoh: 95 / 92.5 / Mumtaz"
                                          value={item.nilaiSemester1Aly}
                                          readOnly={!isAdmin && !!editingNomination}
                                          onChange={(e) => updateSantriMuridIdentitas(idx, 'nilaiSemester1Aly', e.target.value)}
                                          className="w-full h-11 px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-semibold text-[#8a7c4c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                                        />
                                      </div>

                                      {/* 2. Presensi Kehadiran */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <label className="block text-xs font-bold text-[#24211c]">
                                            Presensi Kehadiran {idx === 0 && <span className="text-rose-500">*</span>}
                                          </label>
                                          <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                            Kehadiran / Presensi
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          required={idx === 0}
                                          placeholder="Contoh: 100% / Nihil Absen"
                                          value={item.presensiKehadiran}
                                          readOnly={!isAdmin && !!editingNomination}
                                          onChange={(e) => updateSantriMuridIdentitas(idx, 'presensiKehadiran', e.target.value)}
                                          className="w-full h-11 px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-semibold text-[#8a7c4c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                      {/* 1. Nilai Imda I */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <label className="block text-xs font-bold text-[#24211c]">
                                            Nilai Imda I {idx === 0 && <span className="text-rose-500">*</span>}
                                          </label>
                                          <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                            Syarat Imda I
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          required={idx === 0}
                                          placeholder="Contoh: 90 / 89.5"
                                          value={item.nilaiImda1}
                                          readOnly={!isAdmin && !!editingNomination}
                                          onChange={(e) => updateSantriMuridIdentitas(idx, 'nilaiImda1', e.target.value)}
                                          className="w-full h-11 px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-semibold text-[#8a7c4c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                                        />
                                      </div>

                                      {/* 2. Nilai Imda II */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <label className="block text-xs font-bold text-[#24211c]">
                                            Nilai Imda II {idx === 0 && <span className="text-rose-500">*</span>}
                                          </label>
                                          <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                            Syarat Imda II
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          required={idx === 0}
                                          placeholder="Contoh: 92 / 91.5"
                                          value={item.nilaiImda2}
                                          readOnly={!isAdmin && !!editingNomination}
                                          onChange={(e) => updateSantriMuridIdentitas(idx, 'nilaiImda2', e.target.value)}
                                          className="w-full h-11 px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-semibold text-[#8a7c4c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                                        />
                                      </div>

                                      {/* 3. Presensi Hadir */}
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <label className="block text-xs font-bold text-[#24211c]">
                                            Presensi Hadir {idx === 0 && <span className="text-rose-500">*</span>}
                                          </label>
                                          <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                            Presensi Hadir
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          required={idx === 0}
                                          placeholder="Contoh: 100% / Nihil Absen"
                                          value={item.presensiKehadiran}
                                          readOnly={!isAdmin && !!editingNomination}
                                          onChange={(e) => updateSantriMuridIdentitas(idx, 'presensiKehadiran', e.target.value)}
                                          className="w-full h-11 px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm font-semibold text-[#8a7c4c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Kriteria & Alasan Penilaian Resmi Khusus Identitas {numStr} Sesuai Kategori Santri / Murid */}
                                  <div className="pt-3.5 border-t border-[#dcd7cb] space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center space-x-2 text-[#8a7c4c]">
                                        <CheckSquare className="w-4 h-4 shrink-0" />
                                        <h5 className="text-xs font-black uppercase tracking-wider text-[#24211c]">
                                          Kriteria &amp; Alasan Penilaian Resmi: {categoryTitleDisplay} (Identitas {numStr} {item.nama ? `– ${item.nama}` : ''})
                                        </h5>
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        {isAdmin && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => checkAllSantriMurid(idx, activeCriteriaList)}
                                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ede9df] hover:bg-[#e2ded2] text-[#675c37] border border-[#c3b68b]/40 cursor-pointer transition shadow-2xs"
                                            >
                                              ✓ Centang Semua
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => uncheckAllSantriMurid(idx)}
                                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 cursor-pointer transition shadow-2xs"
                                            >
                                              ✕ Reset
                                            </button>
                                          </>
                                        )}
                                        <span className="text-[10.5px] font-bold bg-[#ede9df] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
                                          Tercentang: {activeCriteriaList.filter((c) => !!item.checklist?.[c.id]).length} / {activeCriteriaList.length} Kriteria
                                        </span>
                                      </div>
                                    </div>

                                    {/* 1. Checklist Kriteria Resmi Sesuai Kategori */}
                                    <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-2">
                                      <span className="font-extrabold text-[11px] text-[#24211c] block border-b border-[#f2eee3] pb-1.5">
                                        {criteriaTitleSection}
                                      </span>
                                      <div className="space-y-2.5 pt-1 text-xs">
                                        {activeCriteriaList.map((crit) => (
                                          <label key={crit.id} className="flex items-start space-x-2.5 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={!!item.checklist?.[crit.id]}
                                              onChange={() => toggleSantriMuridChecklist(idx, crit.id)}
                                              className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer mt-0.5 shrink-0"
                                            />
                                            <span className="text-slate-800 leading-snug font-medium text-xs">
                                              {crit.label}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>

                                    {/* 2. ALASAN PENILAIAN RESMI (Uraian Resmi Sesuai Kategori) */}
                                    <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="block font-extrabold text-[11px] text-[#24211c] flex items-center space-x-1.5">
                                          <FileText className="w-3.5 h-3.5 text-[#8a7c4c]" />
                                          <span>2. ALASAN PENILAIAN RESMI (Syarat Kategori {categoryTitleDisplay} untuk Identitas {numStr}):</span>
                                        </label>
                                        <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                                          Alasan resmi penilaian
                                        </span>
                                      </div>
                                      <textarea
                                        rows={2}
                                        placeholder={`Uraian alasan penilaian resmi kelayakan figur ${isCurrentSantri ? 'santri' : 'murid'} identitas ${numStr} sesuai syarat kategori...`}
                                        value={item.alasanPenilaian || ''}
                                        readOnly={!isAdmin && !!editingNomination}
                                        onChange={(e) => updateSantriMuridIdentitas(idx, 'alasanPenilaian', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                                      />
                                    </div>

                                    {/* 3. LAIN-LAIN (Catatan Tambahan untuk Identitas {numStr}) */}
                                    <div className="bg-white p-3.5 rounded-xl border border-[#dcd7cb] shadow-2xs space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="block font-extrabold text-[11px] text-[#24211c]">
                                          3. LAIN-LAIN (Catatan Tambahan untuk Identitas {numStr}):
                                        </label>
                                        <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                                          Kolom isian bebas (dapat diedit)
                                        </span>
                                      </div>
                                      <textarea
                                        rows={2}
                                        placeholder={`Catatan tambahan pertimbangan khusus ${isCurrentSantri ? 'keteladanan santri mukim' : 'prestasi akademik murid MMU'} identitas ${numStr}...`}
                                        value={item.lainLainNote || ''}
                                        readOnly={!isAdmin && !!editingNomination}
                                        onChange={(e) => updateSantriMuridIdentitas(idx, 'lainLainNote', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Pengecekan Kategori Khusus Ranting & Alumni
                const isRantingCat = categoryId === 'cat-1' || toSafeLower(activeCatObj?.title).includes('ranting');
                const isAlumniCat = categoryId === 'cat-3' || toSafeLower(activeCatObj?.title).includes('alumni');

                if (isRantingCat) {
                  return (
                    <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between border-b border-[#e8e4da] pb-2.5 gap-2">
                        <div className="flex items-center space-x-2 text-[#8a7c4c]">
                          <IdCard className="w-4 h-4" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#24211c]">
                            2. Identitas Ranting yang Diusulkan
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold bg-[#ede9df] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
                          Format Khusus: Nama Ranting &amp; Alamat Lengkap
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {/* B.1. Nama Ranting yang Diusulkan */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-[#24211c]">
                              Nama Ranting yang Diusulkan <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                              (Nama cabang / ranting MMU/IASS)
                            </span>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Ranting MMU Sidogiri Kraton / Ranting MMU Sukorejo"
                            value={candidateName}
                            readOnly={!isAdmin && !!editingNomination}
                            onChange={(e) => setCandidateName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                          />
                        </div>

                        {/* B.2. Alamat Lengkap Ranting */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-[#24211c]">
                              Alamat Lengkap Ranting <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-[#7c7b77] italic font-medium">
                              (Desa/Kelurahan, Kecamatan, Kota/Kabupaten)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            required
                            placeholder="Alamat lengkap lokasi atau sekretariat ranting yang diusulkan..."
                            value={alamat}
                            readOnly={!isAdmin && !!editingNomination}
                            onChange={(e) => setAlamat(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs resize-none"
                          />
                        </div>

                        {/* Data Tambahan Ranting / Pengurus Ranting untuk Ekspor Excel */}
                        <div className="pt-3 border-t border-[#e8e4da] bg-white p-3.5 rounded-xl border shadow-2xs">
                          <span className="text-[11px] font-black text-[#675c37] block mb-2.5">
                            + Data Tambahan Peserta / Pengurus Ranting (Pelengkap Arsip &amp; Ekspor Excel):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-[#24211c] mb-1">
                                ID PPS / Personalia (Opsional)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: PPS-2026-001"
                                value={idPps}
                                readOnly={!isAdmin && !!editingNomination}
                                onChange={(e) => setIdPps(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#8a7c4c] font-mono font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#24211c] mb-1">
                                Kelas (Opsional)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: Kelas 3 / Ranting A"
                                value={kelas}
                                readOnly={!isAdmin && !!editingNomination}
                                onChange={(e) => setKelas(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#24211c] mb-1">
                                Tingkat (Opsional)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: MMU Tsanawiyah / Aliyah"
                                value={tingkat}
                                readOnly={!isAdmin && !!editingNomination}
                                onChange={(e) => setTingkat(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#24211c] mb-1">
                                Jabatan (2 Tahun Terakhir)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: Ketua Ranting MMU"
                                value={department}
                                readOnly={!isAdmin && !!editingNomination}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-[#24211c] mb-1">
                                No. WhatsApp / Kontak Ranting
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: 081234567890"
                                value={phone}
                                readOnly={!isAdmin && !!editingNomination}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-[#dcd7cb] rounded-xl text-xs text-[#8a7c4c] font-mono font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#24211c] mb-1">
                                Domisili Ranting (PPS / LPPS)
                              </label>
                              <div className="flex items-center gap-3 pt-0.5">
                                <label className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                                  candidateDomisiliType === 'PPS' ? 'bg-[#8a7c4c] text-white border-[#8a7c4c]' : 'bg-white text-[#24211c] border-[#dcd7cb]'
                                }`}>
                                  <input
                                    type="radio"
                                    name="rantingDomRadio"
                                    value="PPS"
                                    checked={candidateDomisiliType === 'PPS'}
                                    onChange={() => setCandidateDomisiliType('PPS')}
                                    className="sr-only"
                                  />
                                  <span>PPS</span>
                                </label>
                                <label className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                                  candidateDomisiliType === 'LPPS' ? 'bg-[#8a7c4c] text-white border-[#8a7c4c]' : 'bg-white text-[#24211c] border-[#dcd7cb]'
                                }`}>
                                  <input
                                    type="radio"
                                    name="rantingDomRadio"
                                    value="LPPS"
                                    checked={candidateDomisiliType === 'LPPS'}
                                    onChange={() => setCandidateDomisiliType('LPPS')}
                                    className="sr-only"
                                  />
                                  <span>LPPS</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isAlumniCat) {
                  return (
                    <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between border-b border-[#e8e4da] pb-2.5 gap-2">
                        <div className="flex items-center space-x-2 text-[#8a7c4c]">
                          <IdCard className="w-4 h-4" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#24211c]">
                            2. Identitas Calon / Peserta yang Diusulkan (Alumni)
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold bg-[#ede9df] text-[#675c37] border border-[#c3b68b]/40 px-2.5 py-0.5 rounded-full">
                          Format Khusus: Nama, Jabatan, &amp; Alamat Rumah
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* B.1. Nama Calon / Peserta yang Diusulkan */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-[#24211c]">
                                Nama Calon / Peserta yang Diusulkan <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[10px] text-[#8a7c4c] font-semibold italic">
                                (Nama lengkap alumni)
                              </span>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Nama lengkap alumni yang diusulkan..."
                              value={candidateName}
                              readOnly={!isAdmin && !!editingNomination}
                              onChange={(e) => setCandidateName(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* B.2. Jabatan Calon */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-[#24211c]">
                                Jabatan Calon / Posisi
                              </label>
                              <span className="text-[10px] text-[#7c7b77] italic font-medium">
                                (Profesi / khidmah di masyarakat)
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder="Contoh: Pengurus IASS Cabang / Asatidz / Pengasuh Ponpes"
                              value={department || position}
                              readOnly={!isAdmin && !!editingNomination}
                              onChange={(e) => {
                                setDepartment(e.target.value);
                                setPosition(e.target.value);
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* B.3. Alamat Rumah Lengkap */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-[#24211c]">
                              Alamat Rumah Calon <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-[#7c7b77] italic font-medium">
                              (Alamat tempat tinggal lengkap alumni yang diusulkan)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            required
                            placeholder="Alamat rumah lengkap calon alumni (Desa, Kecamatan, Kota/Kabupaten)..."
                            value={alamat}
                            readOnly={!isAdmin && !!editingNomination}
                            onChange={(e) => setAlamat(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs resize-none"
                          />
                        </div>

                        {/* Data Tambahan Alumni */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#24211c] mb-1">
                              No. WhatsApp / HP Calon (Opsional)
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: 081234567890"
                              value={phone}
                              readOnly={!isAdmin && !!editingNomination}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs text-[#8a7c4c] font-mono font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#24211c] mb-1">
                              ID Personalia / PPS (Opsional)
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: ALUMNI-2026-001"
                              value={idPps}
                              readOnly={!isAdmin && !!editingNomination}
                              onChange={(e) => setIdPps(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs text-[#8a7c4c] font-mono font-bold focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default untuk kategori Pengurus & Lainnya (1 Identitas Tunggal)
                return (
                  <div className="bg-[#faf8f4] border border-[#e8e4da] rounded-2xl p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#e8e4da] pb-2.5">
                      <div className="flex items-center space-x-2 text-[#8a7c4c]">
                        <IdCard className="w-4 h-4" />
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          2. Identitas Calon / Peserta yang Diusulkan
                        </h4>
                      </div>
                      <span className="text-[10.5px] font-bold text-[#7c7b77]">
                        A. ID PPS • B. Nama • C. Domisili • D. Kelas • E. Tingkat • F. Jabatan/Kontak • G. Alamat
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
                          B. Nama yang Diusulkan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nama lengkap calon yang diusulkan"
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
                          C. Domisili Calon
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
                            placeholder="Contoh: Kelas 3 / Pengurus"
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
                            placeholder="Contoh: Pengurus PPS / Bagian"
                            value={tingkat}
                            readOnly={!isAdmin && !!editingNomination}
                            onChange={(e) => setTingkat(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* F. Jabatan & G. No. WhatsApp / Kontak (Opsional) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                            F. Jabatan Peserta pada 2 Tahun Terakhir (Opsional)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Koordinator Sie / Kepala Kamar / Anggota Bagian"
                            value={department}
                            readOnly={!isAdmin && !!editingNomination}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                            G. No. WhatsApp / Kontak (Opsional)
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

                      {/* H. Alamat Lengkap */}
                      <div>
                        <label className="block text-xs font-bold text-[#24211c] mb-1.5">
                          H. Alamat Lengkap
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Alamat lengkap calon yang diusulkan..."
                          value={alamat}
                          readOnly={!isAdmin && !!editingNomination}
                          onChange={(e) => setAlamat(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#dcd7cb] rounded-xl text-xs sm:text-sm text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:border-[#8a7c4c] focus:outline-none transition shadow-2xs resize-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Seksi 3: Rubrik Penilaian Dinamis Sesuai Kategori yang Dipilih */}
              {(() => {
                const selectedCatObj = (categories.length === 6 ? categories : OFFICIAL_AWARD_RUBRICS).find((c) => c.id === categoryId) || categories.find((c) => c.id === categoryId) || OFFICIAL_AWARD_RUBRICS[0];
                const catTitleLower = toSafeLower(selectedCatObj?.title) || toSafeLower(categoryId);

                const isRanting = categoryId === 'cat-1' || catTitleLower.includes('ranting');
                const isGuru = isGuruCategoryItem(categoryId, selectedCatObj?.title);

                // Khusus Penghargaan Khidmah (Guru): 13 Kriteria & Alasan Penilaian Resmi sudah disematkan lengkap langsung di bawah masing-masing 5 identitas guru
                if (isGuru) {
                  return null;
                }

                // Khusus Penghargaan Santri Terbaik & Murid Terbaik: Kriteria & Alasan Penilaian Resmi sudah disematkan lengkap langsung di bawah masing-masing 2 identitas
                const isSantri = categoryId === 'cat-5' || catTitleLower.includes('santri');
                const isMurid = categoryId === 'cat-6' || catTitleLower.includes('murid');
                if (isSantri || isMurid) {
                  return null;
                }

                const isAlumni = categoryId === 'cat-3' || catTitleLower.includes('alumni');
                const isPengurus = isPengurusCategoryItem(categoryId, selectedCatObj?.title);

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
                          3. Kriteria & Alasan Penilaian Resmi: <span className="text-[#24211c]">{selectedCatObj?.title}</span>
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
                            {ALUMNI_CRITERIA_LIST.map((item) => {
                              const isChecked = !!checklist[item.id];
                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-xl border transition ${
                                    isChecked
                                      ? 'bg-[#f7f5ef] border-[#8a7c4c]/50 ring-1 ring-[#8a7c4c]/20'
                                      : 'bg-[#faf8f4]/60 border-[#e8e4da] hover:bg-[#faf8f4]'
                                  }`}
                                >
                                  <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleChecklist(item.id)}
                                      className="w-4 h-4 rounded text-[#8a7c4c] focus:ring-[#8a7c4c] accent-[#8a7c4c] cursor-pointer mt-0.5 shrink-0"
                                    />
                                    <div className="leading-snug flex-1">
                                      <strong className="text-[#24211c]">{item.title}: </strong>
                                      <span className="text-slate-700">{item.desc}</span>
                                    </div>
                                  </label>

                                  {/* Ketika mencentang kriteria yang dinilai maka dibawahnya otomatis menampilkan kolom alasan sebagai pembuktian dan wajib diisi */}
                                  {isChecked && (
                                    <div className="mt-3 ml-6.5 p-3 rounded-xl bg-white border border-[#c3b68b]/70 space-y-1.5 animate-fadeIn shadow-2xs">
                                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                                        <label className="block text-xs font-black text-[#675c37] flex items-center space-x-1.5">
                                          <FileCheck className="w-4 h-4 text-[#8a7c4c] shrink-0" />
                                          <span>Alasan & Pembuktian Nyata ({item.title}) <span className="text-rose-500">*</span></span>
                                        </label>
                                        <span className="text-[9.5px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                          Wajib Diisi sebagai Pembuktian
                                        </span>
                                      </div>
                                      <textarea
                                        rows={2}
                                        required
                                        placeholder={`Tuliskan uraian alasan konkret dan bukti nyata pemenuhan kriteria ${item.title} untuk calon alumni ini...`}
                                        value={alumniCriteriaReasons[item.id] || ''}
                                        readOnly={!isAdmin && !!editingNomination}
                                        onChange={(e) =>
                                          setAlumniCriteriaReasons((prev) => ({
                                            ...prev,
                                            [item.id]: e.target.value,
                                          }))
                                        }
                                        className="w-full px-3 py-2 bg-[#faf8f4] border border-[#dcd7cb] rounded-xl text-xs text-[#24211c] focus:ring-2 focus:ring-[#8a7c4c]/20 focus:bg-white focus:outline-none transition shadow-2xs resize-none font-medium placeholder:text-stone-400"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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

