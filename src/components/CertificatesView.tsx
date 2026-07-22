import React, { useState } from 'react';
import { FileCheck, Printer, Award, Shield, Sparkles, UserCheck } from 'lucide-react';
import { AwardCategory, Nomination } from '../types';

interface CertificatesViewProps {
  nominations: Nomination[];
  categories: AwardCategory[];
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({ nominations, categories }) => {
  const winners = nominations.filter((n) => n.status === 'Pemenang' || n.status === 'Disetujui');

  // Certificate Form State
  const [selectedNominationId, setSelectedNominationId] = useState<string>(winners[0]?.id || '');
  const [recipientName, setRecipientName] = useState<string>(winners[0]?.candidateName || 'Ahmad Fauzi, S.T.');
  const [awardTitle, setAwardTitle] = useState<string>('Penerima Anugerah Inovasi & Karya Kreatif');
  const [department, setDepartment] = useState<string>(winners[0]?.department || 'Divisi Teknologi Informasi');
  const [eventName, setEventName] = useState<string>('Malam Penganugerahan Insan Berprestasi 2026');
  const [issueDate, setIssueDate] = useState<string>('22 Juli 2026');
  const [certNumber, setCertNumber] = useState<string>('084/SIE-ANUGERAH/2026');
  const [signatory1, setSignatory1] = useState<string>('Ahmad Fauzi, S.T.');
  const [signatory1Role, setSignatory1Role] = useState<string>('Ketua Sie Penganugerahan');
  const [signatory2, setSignatory2] = useState<string>('Dr. Hendra Gunawan');
  const [signatory2Role, setSignatory2Role] = useState<string>('Ketua Umum Panitia');

  const handleSelectWinner = (nomId: string) => {
    setSelectedNominationId(nomId);
    const nom = nominations.find((n) => n.id === nomId);
    if (nom) {
      setRecipientName(nom.candidateName);
      setDepartment(nom.department);
      const cat = categories.find((c) => c.id === nom.categoryId);
      if (cat) {
        setAwardTitle(`Penerima Penghargaan ${cat.title}`);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls - Hidden on Print */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-900">Generator & Cetak Sertifikat Digital</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pilih pemenang atau sesuaikan data sertifikat resmi berstempel emas untuk langsung dicetak / diunduh PDF.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-2xl shadow-sm transition text-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {/* Editor Options Panel - Hidden on Print */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-amber-600" />
          <span>Pilih Pemenang / Edit Detail Sertifikat</span>
        </h3>

        {winners.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Pilih Cepat Pemenang:</span>
            {winners.map((nom) => (
              <button
                key={nom.id}
                onClick={() => handleSelectWinner(nom.id)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                  selectedNominationId === nom.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
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
            <label className="block font-bold text-slate-700 mb-1">Nama Penerima *</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Gelar / Kategori Penghargaan *</label>
            <input
              type="text"
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Unit Kerja / Divisi</label>
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
            <label className="block font-bold text-slate-700 mb-1">Nomor Sertifikat Resmi</label>
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
        </div>
      </div>

      {/* Live Certificate Preview Frame (Styled for both Screen & Print) */}
      <div className="space-y-2">
        <div className="md:hidden flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80 font-medium">
          <span>📱 Pratinjau Sertifikat (Geser ke samping untuk melihat penuh)</span>
        </div>
        <div className="overflow-x-auto pb-4 rounded-3xl">
          <div className="min-w-[680px] max-w-4xl mx-auto bg-amber-50/20 p-8 sm:p-12 rounded-3xl border-8 border-amber-500/80 shadow-xl relative text-slate-900 font-serif print:min-w-0 print:border-8 print:p-8 print:shadow-none print:m-0">
          {/* Decorative Corner Filigree Borders */}
          <div className="absolute top-3 left-3 w-16 h-16 border-t-4 border-l-4 border-amber-600"></div>
          <div className="absolute top-3 right-3 w-16 h-16 border-t-4 border-r-4 border-amber-600"></div>
          <div className="absolute bottom-3 left-3 w-16 h-16 border-b-4 border-l-4 border-amber-600"></div>
          <div className="absolute bottom-3 right-3 w-16 h-16 border-b-4 border-r-4 border-amber-600"></div>

          <div className="border-2 border-dashed border-amber-600/40 p-8 sm:p-12 text-center space-y-6 relative z-10 bg-white/90 backdrop-blur-sm rounded-2xl">
            {/* Header Badge Seal */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 rounded-full flex items-center justify-center text-slate-950 font-sans shadow-lg shadow-amber-500/30">
                <Award className="w-10 h-10" />
              </div>
            </div>

            {/* Title */}
            <div>
              <p className="text-xs font-sans uppercase tracking-[0.3em] font-extrabold text-amber-800">
                SIE PENGANUGERAHAN
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-wider mt-1 uppercase font-serif">
                SERTIFIKAT PENGHARGAAN
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-1">No: {certNumber}</p>
            </div>

            {/* Recipient Statement */}
            <div className="space-y-2 py-2">
              <p className="text-sm font-sans italic text-slate-600">Diberikan dengan bangga kepada:</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-900 border-b-2 border-amber-500/40 inline-block px-8 py-1 font-serif">
                {recipientName}
              </h3>
              <p className="text-xs font-sans text-slate-600 font-semibold">{department}</p>
            </div>

            {/* Award Reason */}
            <div className="max-w-xl mx-auto space-y-2">
              <p className="text-sm font-sans leading-relaxed text-slate-800">
                Atas dedikasi, pencapaian, dan kontribusi luar biasa sebagai:
              </p>
              <div className="bg-amber-100/60 text-amber-950 font-sans font-extrabold px-4 py-2 rounded-xl border border-amber-300 text-sm sm:text-base inline-block">
                {awardTitle}
              </div>
              <p className="text-xs font-sans text-slate-500 italic mt-1">
                Dalam ajang <strong className="text-slate-800">{eventName}</strong>.
              </p>
            </div>

            {/* Signatures & Seal Footer */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center font-sans text-xs text-slate-800">
              <div className="space-y-12">
                <p className="text-slate-500">{issueDate}</p>
                <div className="pt-2 border-t border-slate-400 max-w-[200px] mx-auto">
                  <p className="font-extrabold text-slate-900">{signatory1}</p>
                  <p className="text-[11px] text-slate-500">{signatory1Role}</p>
                </div>
              </div>

              <div className="space-y-12">
                <p className="text-slate-500">Mengetahui,</p>
                <div className="pt-2 border-t border-slate-400 max-w-[200px] mx-auto">
                  <p className="font-extrabold text-slate-900">{signatory2}</p>
                  <p className="text-[11px] text-slate-500">{signatory2Role}</p>
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
