import React, { useState } from 'react';
import { FileCheck, Printer, Award, Shield, Sparkles, UserCheck, FileSpreadsheet, Check, ChevronDown } from 'lucide-react';
import { AwardCategory, Nomination } from '../types';
import { sendWebhookPayload, exportToCSV } from '../services/webhookService';
import { addCertificateRecordToFirestore } from '../services/certificatesService';
import { ContentHeader } from './ContentHeader';

export const AWARD_LETTER_OPTIONS = [
  'Penghargaan Khidmah (Ranting)',
  'Penghargaan Khidmah (Guru)',
  'Penghargaan Khidmah (Alumni)',
  'Penghargaan Pengurus Terbaik',
  'Penghargaan Santri Terbaik',
  'Penghargaan Murid Terbaik',
];

interface CertificatesViewProps {
  nominations: Nomination[];
  categories: AwardCategory[];
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({ nominations, categories }) => {
  const winners = nominations.filter((n) => n.status === 'Pemenang' || n.status === 'Disetujui');

  // Certificate Form State
  const [selectedNominationId, setSelectedNominationId] = useState<string>(winners[0]?.id || '');
  const [recipientName, setRecipientName] = useState<string>(winners[0]?.candidateName || 'Ahmad Fauzi, S.T.');
  const [awardTitle, setAwardTitle] = useState<string>(AWARD_LETTER_OPTIONS[0]);
  const [customAwardTitle, setCustomAwardTitle] = useState<string>('');
  const [department, setDepartment] = useState<string>(winners[0]?.department || 'Divisi Teknologi Informasi / Ranting Sidogiri');
  const [eventName, setEventName] = useState<string>('Malam Penganugerahan Insan Berprestasi 2026');
  const [issueDate, setIssueDate] = useState<string>('22 Juli 2026');
  const [certNumber, setCertNumber] = useState<string>('084/SIE-ANUGERAH/2026');
  const [signatory1, setSignatory1] = useState<string>('Ahmad Fauzi, S.T.');
  const [signatory1Role, setSignatory1Role] = useState<string>('Ketua Sie Penganugerahan');
  const [signatory2, setSignatory2] = useState<string>('Dr. Hendra Gunawan');
  const [signatory2Role, setSignatory2Role] = useState<string>('Ketua Umum Panitia');

  // Display toggles
  const [showKopHeader, setShowKopHeader] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [showStamp, setShowStamp] = useState<boolean>(true);

  const activeAwardName = awardTitle === 'Lainnya' ? customAwardTitle || 'Penghargaan Khusus' : awardTitle;

  const handleSelectWinner = (nomId: string) => {
    setSelectedNominationId(nomId);
    const nom = nominations.find((n) => n.id === nomId);
    if (nom) {
      setRecipientName(nom.candidateName);
      setDepartment(nom.department);
      const cat = categories.find((c) => c.id === nom.categoryId);
      if (cat) {
        // Try to match or set title
        const matched = AWARD_LETTER_OPTIONS.find(opt => opt.toLowerCase().includes(cat.title.toLowerCase()));
        if (matched) {
          setAwardTitle(matched);
        } else {
          setAwardTitle('Lainnya');
          setCustomAwardTitle(`Penghargaan ${cat.title}`);
        }
      }
    }
  };

  const handlePrintAndSync = async () => {
    const certPayload = {
      recipientName,
      awardTitle: activeAwardName,
      certNumber,
      issueDate,
      department,
      signatory1,
      signatory2,
    };

    try {
      await addCertificateRecordToFirestore(certPayload);
      sendWebhookPayload('certificate_generated', certPayload);
    } catch (e) {
      console.warn('Certificate sync notice:', e);
    }

    window.print();
  };

  const handleExportCertificates = async () => {
    const headers = ['NO', 'NAMA PENERIMA', 'GELAR / PENGHARGAAN', 'INSTANSI / DEPARTEMEN', 'NO SERTIFIKAT', 'TANGGAL PENERBITAN'];
    const rows = winners.map((nom, idx) => [
      idx + 1,
      nom.candidateName,
      activeAwardName,
      nom.department || '-',
      `08${idx + 1}/SIE-ANUGERAH/2026`,
      issueDate,
    ]);

    exportToCSV('Data_Penerima_Sertifikat_Penganugerahan.csv', headers, rows);

    await sendWebhookPayload('bulk_export', {
      module: 'Sertifikat',
      totalWinners: winners.length,
      winners,
    });
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Content Header & Breadcrumb */}
      <div className="print:hidden">
        <ContentHeader
          title="Cetak E-Sertifikat & Surat Penghargaan"
          subtitle="Penerbitan Dokumen Penghargaan Resmi Ber-Kop, Watermark, & Stempel Sidogiri"
          activeTab="sertifikat"
        />
      </div>

      {/* Header & Controls - Hidden on Print */}
      <div className="admin-box border-t-4 border-t-[#dd4b39] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-[#dd4b39]" />
            <h1 className="text-base font-extrabold text-gray-800">Generator & Cetak Surat Penghargaan / Sertifikat</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pilih opsi jenis penghargaan resmi, sesuaikan data penerima, dan unduh/cetak PDF dengan Kop, Watermark, serta TTD Panitia lengkap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCertificates}
            title="Ekspor Data Sertifikat & Pemenang ke CSV & Google Sheets"
            className="flex items-center space-x-1.5 bg-[#00a65a] hover:bg-[#008d4c] text-white font-bold px-3.5 py-1.5 rounded text-xs transition shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Ekspor ke Sheets / CSV</span>
          </button>

          <button
            onClick={handlePrintAndSync}
            className="flex items-center justify-center space-x-2 bg-[#f39c12] hover:bg-[#e08e0b] text-slate-950 font-black px-4 py-1.5 rounded shadow-2xs transition text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Editor Options Panel - Hidden on Print */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Konfigurasi Surat & Jenis Penghargaan</span>
          </span>

          <div className="flex items-center space-x-3 text-xs font-semibold text-slate-600">
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showKopHeader}
                onChange={(e) => setShowKopHeader(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Kop Surat</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Watermark</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showStamp}
                onChange={(e) => setShowStamp(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Stempel TTD</span>
            </label>
          </div>
        </h3>

        {/* 1. Quick Select Award Options (Required Categories) */}
        <div className="space-y-1.5 pb-2 border-b border-slate-100">
          <label className="block text-xs font-bold text-slate-700">Pilihan Jenis Surat Penghargaan Resmi *</label>
          <div className="flex flex-wrap gap-1.5">
            {AWARD_LETTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAwardTitle(opt)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer flex items-center space-x-1 ${
                  awardTitle === opt
                    ? 'bg-[#005a2b] text-white border-[#005a2b] shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {awardTitle === opt && <Check className="w-3.5 h-3.5 text-amber-300" />}
                <span>{opt}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAwardTitle('Lainnya')}
              className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                awardTitle === 'Lainnya'
                  ? 'bg-[#005a2b] text-white border-[#005a2b] shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              + Lainnya / Custom
            </button>
          </div>
        </div>

        {/* Quick Select Winner */}
        {winners.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Pilih Pemenang Nominasi:</span>
            {winners.map((nom) => (
              <button
                key={nom.id}
                onClick={() => handleSelectWinner(nom.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                  selectedNominationId === nom.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
              >
                🏆 {nom.candidateName}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Penerima Penghargaan *</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Kategori / Opsi Penghargaan *</label>
            <select
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
            >
              {AWARD_LETTER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="Lainnya">Lainnya / Custom Title</option>
            </select>
            {awardTitle === 'Lainnya' && (
              <input
                type="text"
                placeholder="Ketik judul penghargaan kustom..."
                value={customAwardTitle}
                onChange={(e) => setCustomAwardTitle(e.target.value)}
                className="w-full mt-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Unit Kerja / Ranting / Instansi</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Acara Penganugerahan</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor Surat / Sertifikat Resmi</label>
            <input
              type="text"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-amber-800 font-mono text-xs focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Penerbitan</label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Penandatangan 1 (Ketua Sie)</label>
            <input
              type="text"
              value={signatory1}
              onChange={(e) => setSignatory1(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Penandatangan 2 (Ketua Umum/Pengurus)</label>
            <input
              type="text"
              value={signatory2}
              onChange={(e) => setSignatory2(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Official Certificate / Award Letter Preview Frame */}
      <div className="space-y-2">
        <div className="md:hidden flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80 font-medium">
          <span>📱 Pratinjau Surat Penghargaan (Geser kesamping untuk melihat penuh)</span>
        </div>

        <div className="overflow-x-auto pb-4 rounded-3xl">
          <div className="printable-cert min-w-[700px] max-w-4xl mx-auto bg-amber-50/20 p-6 sm:p-10 rounded-3xl border-8 border-amber-500/80 shadow-xl relative text-slate-900 font-serif my-2">
            
            {/* BACKGROUND WATERMARK (BEGRON BELAKANG LOGO EMBLEM PPS) */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.08]">
                <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-full border-[8px] border-[#005a2b] flex items-center justify-center relative p-6">
                  <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-[#005a2b] flex flex-col items-center justify-center text-center p-4">
                    <div className="text-4xl sm:text-5xl font-extrabold text-[#005a2b] font-serif">P.P.S</div>
                    <div className="text-[12px] font-black uppercase tracking-widest text-[#005a2b] mt-2">
                      PONDOK PESANTREN SIDOGIRI
                    </div>
                    <div className="text-[10px] font-bold text-[#005a2b] uppercase tracking-wider mt-1">
                      PASURUAN JAWA TIMUR
                    </div>
                    <div className="text-2xl mt-1 text-[#005a2b]">★ ★ ★</div>
                  </div>
                </div>
              </div>
            )}

            {/* Decorative Corner Filigree Borders */}
            <div className="absolute top-3 left-3 w-16 h-16 border-t-4 border-l-4 border-amber-600"></div>
            <div className="absolute top-3 right-3 w-16 h-16 border-t-4 border-r-4 border-amber-600"></div>
            <div className="absolute bottom-3 left-3 w-16 h-16 border-b-4 border-l-4 border-amber-600"></div>
            <div className="absolute bottom-3 right-3 w-16 h-16 border-b-4 border-r-4 border-amber-600"></div>

            {/* Inner Content Card */}
            <div className="border-2 border-dashed border-amber-600/40 p-6 sm:p-10 text-center space-y-5 relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl">
              
              {/* 1. KOP SURAT / HEADER ATAS DENGAN LOGO RESMI */}
              {showKopHeader && (
                <div className="border-b-2 border-amber-600/60 pb-4 mb-2">
                  <div className="flex items-center justify-between space-x-4">
                    {/* Logo Emblem Sidogiri */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#005a2b] to-[#003d1d] p-2 shadow-md shrink-0 flex flex-col items-center justify-center text-center text-white border-2 border-[#f39c12]">
                      <div className="text-[11px] font-black tracking-widest text-[#f39c12] leading-none">PPS</div>
                      <div className="text-xs font-black my-0.5 leading-none">SIDOGIRI</div>
                      <div className="text-[8px] text-amber-200 leading-none">1745 H</div>
                    </div>

                    {/* Title Header text & Calligraphy */}
                    <div className="min-w-0 flex-1 text-center space-y-0.5">
                      <div className="text-xl sm:text-2xl font-bold font-serif text-[#005a2b] tracking-wider">
                        مشاورة وتعليم الكتاب
                      </div>
                      <h2 className="text-xs sm:text-sm font-extrabold text-[#005a2b] tracking-wider uppercase font-sans">
                        PANITIA SIE PENGANUGERAHAN
                      </h2>
                      <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-widest font-sans">
                        PONDOK PESANTREN SIDOGIRI
                      </h3>
                      <p className="text-[10px] font-sans text-slate-500">
                        Sidogiri Kraton Pasuruan Jawa Timur PO Box 22 Pasuruan 67101 | Telp. 0343-410444
                      </p>
                    </div>

                    {/* Badge Gold Seal */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 rounded-full flex items-center justify-center text-slate-950 font-sans shadow-md border border-amber-300 shrink-0">
                      <Award className="w-8 h-8 text-amber-950" />
                    </div>
                  </div>
                </div>
              )}

              {/* Title Section */}
              <div>
                <p className="text-xs font-sans uppercase tracking-[0.3em] font-extrabold text-amber-800">
                  SIE PENGANUGERAHAN SIDOGIRI
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider mt-1 uppercase font-serif">
                  SURAT KETERANGAN PENGHARGAAN
                </h2>
                <p className="text-xs font-mono text-slate-600 mt-0.5">Nomor: {certNumber}</p>
              </div>

              {/* Recipient Statement */}
              <div className="space-y-1.5 py-1">
                <p className="text-xs sm:text-sm font-sans italic text-slate-600">Panitia Sie Penganugerahan memberikan penghargaan resmi kepada:</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#005a2b] border-b-2 border-amber-500/50 inline-block px-8 py-1 font-serif">
                  {recipientName}
                </h3>
                <p className="text-xs font-sans text-slate-700 font-bold">{department}</p>
              </div>

              {/* Award Category & Reason */}
              <div className="max-w-xl mx-auto space-y-2">
                <p className="text-xs sm:text-sm font-sans text-slate-800">
                  Atas dedikasi, prestasi, dan pengabdian luar biasa dengan predikat:
                </p>
                
                {/* Highlighted Selected Award Choice */}
                <div className="bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 text-emerald-950 font-sans font-black px-6 py-2.5 rounded-2xl border-2 border-amber-400 shadow-xs text-sm sm:text-lg inline-block tracking-wide">
                  🎗️ {activeAwardName}
                </div>

                <p className="text-xs font-sans text-slate-500 italic mt-1">
                  Diberikan dalam acara <strong className="text-slate-800">{eventName}</strong>.
                </p>
              </div>

              {/* Signatures & Seal Footer (Kolom TTD Panitia) */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center font-sans text-xs text-slate-800 relative">
                
                {/* Column TTD 1 */}
                <div className="space-y-10 relative">
                  <p className="text-slate-500">Sidogiri, {issueDate}</p>
                  
                  <div className="pt-2 border-t border-slate-400 max-w-[200px] mx-auto">
                    <p className="font-extrabold text-slate-900 uppercase">{signatory1}</p>
                    <p className="text-[11px] text-slate-600">{signatory1Role}</p>
                  </div>
                </div>

                {/* Column TTD 2 with Oval Stamp */}
                <div className="space-y-10 relative">
                  <p className="text-slate-500">Mengetahui,</p>

                  {/* STEMPEL RESMI SIE PENGANUGERAHAN OVER SIGNATURE */}
                  {showStamp && (
                    <div className="absolute -top-1 left-2 sm:left-6 pointer-events-none select-none z-20 opacity-85 rotate-[-12deg]">
                      <div className="w-28 h-18 rounded-[50%] border-2 border-[#1e3a8a] p-1 flex flex-col items-center justify-center text-center text-[#1e3a8a] bg-white/20 backdrop-blur-3xs">
                        <span className="text-[7px] font-black uppercase tracking-tighter leading-none text-[#1e3a8a]">PONDOK PESANTREN</span>
                        <span className="text-[9px] font-black uppercase text-[#1e3a8a] my-0.5 leading-none">SIDOGIRI</span>
                        <span className="text-[6.5px] font-bold text-[#1e3a8a] leading-none">SIE PENGANUGERAHAN</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-400 max-w-[200px] mx-auto">
                    <p className="font-extrabold text-slate-900 uppercase">{signatory2}</p>
                    <p className="text-[11px] text-slate-600">{signatory2Role}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
