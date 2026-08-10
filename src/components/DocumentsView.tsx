import React, { useState } from 'react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set pdfjs worker URL for client side pdf text extraction
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}
import {
  FileText,
  Plus,
  Search,
  Filter,
  BookOpen,
  Copy,
  Printer,
  Check,
  Trash2,
  Edit,
  X,
  Building,
  Calendar,
  ShieldAlert,
  Eye,
  Upload,
  Download,
  FileType,
  FileDown,
  UserCheck,
} from 'lucide-react';
import { OfficialDocument, RegulationRule, UserSession } from '../types';
import { ContentHeader } from './ContentHeader';

export const stripHtml = (str: string) => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

export const readPdfFile = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageLines: string[] = [];

      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          const str = item.str.trim();
          if (str) {
            pageLines.push(str);
          }
        }
      }

      if (pageLines.length > 0) {
        pageTexts.push(pageLines.join(' '));
      }
    }

    return pageTexts.join('\n\n');
  } catch (err) {
    console.warn('PDF extraction error via pdfjs-dist:', err);
    return '';
  }
};

export const readDocumentFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  const isPdf = fileName.endsWith('.pdf') || file.type.includes('pdf');
  const isDocx = fileName.endsWith('.docx') || file.type.includes('wordprocessingml');

  if (isPdf) {
    const pdfText = await readPdfFile(file);
    if (pdfText && pdfText.trim().length > 0) {
      return pdfText;
    }
  }

  if (isDocx) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value;
      }
    } catch (err) {
      console.warn('Mammoth docx extraction error:', err);
    }
  }

  // Prevent raw binary code dump for legacy binary formats (.doc, .xls, scanned PDF)
  if (isPdf || fileName.endsWith('.doc') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    return '';
  }

  // Plain text / HTML / Markdown
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      resolve(text);
    };
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
};

export const readWordFile = readDocumentFile;

export const cleanImportedText = (rawContent: string): { cleanBody: string; points: string[] } => {
  if (!rawContent) return { cleanBody: '', points: [] };

  let text = rawContent;

  // Guard against raw unparsed binary PDF streams or formula-like symbols
  if (
    text.includes('%PDF-') ||
    text.includes('/FlateDecode') ||
    text.includes('/FontDescriptor') ||
    text.includes('endstream') ||
    text.includes('<< /Type') ||
    text.includes('/MediaBox')
  ) {
    return {
      cleanBody: 'Naskah dokumen PDF resmi berhasil diimpor.',
      points: ['Ketentuan dan kriteria sesuai dokumen naskah asli.'],
    };
  }

  // Check if rawContent contains HTML tags or Word HTML export code
  if (/<[a-z][\s\S]*>/i.test(rawContent)) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawContent, 'text/html');

      // Remove unwanted script, style, head, xml tags
      doc.querySelectorAll('script, style, xml, head, meta, link, title').forEach((el) => el.remove());

      // Add linebreaks before/after block level elements to preserve structure
      doc.querySelectorAll('p, div, tr, li, h1, h2, h3, h4, h5, h6, br').forEach((el) => {
        el.before('\n');
        el.after('\n');
      });

      text = doc.body.innerText || doc.body.textContent || '';
    } catch (e) {
      // Fallback regex tag stripping
      text = rawContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, '')
        .replace(/<[^>]+>/g, '\n');
    }
  }

  // Unescape common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/g, '©');

  // Strip non-printable ascii control characters
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // Split lines and trim whitespace
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => line.length > 0);

  if (rawLines.length === 0) {
    return {
      cleanBody: 'Dokumen resmi Penganugerahan Sidogiri.',
      points: ['Sesuai ketentuan panitia yang berlaku.'],
    };
  }

  // Keep ALL lines intact (100% complete text extraction)
  const pointLines: string[] = [];
  const bodyParagraphs: string[] = [];

  rawLines.forEach((line) => {
    // Check if line looks like a bullet item or list point
    const isBullet = /^([0-9]+[\.\)]|[a-zA-Z][\.\)]|[\-•\*\>])\s+/.test(line);
    if (isBullet) {
      pointLines.push(line);
    } else {
      bodyParagraphs.push(line);
    }
  });

  let cleanBody = '';
  let points: string[] = [];

  if (pointLines.length > 0) {
    cleanBody = bodyParagraphs.join('\n\n') || rawLines[0];
    points = pointLines;
  } else if (rawLines.length > 1) {
    cleanBody = rawLines[0];
    points = rawLines.slice(1);
  } else {
    cleanBody = rawLines[0];
    points = [rawLines[0]];
  }

  return {
    cleanBody: cleanBody || 'Dokumen resmi Penganugerahan Sidogiri.',
    points: points.length > 0 ? points : [cleanBody],
  };
};

export const exportOfficialDocToWord = (
  doc: OfficialDocument,
  ketua: string = 'UMAR CHAMDAN',
  sekretaris: string = 'BIRRIL WALID',
  mengetahui: string = 'NAWAWY SADOELLAH'
) => {
  const contentHtml = `
    <div style="font-family: 'Times New Roman', serif; margin: 25px; color: #000;">
      <div style="border-bottom: 3px double #005a2b; padding-bottom: 10px; margin-bottom: 15px; text-align: center;">
        <h2 style="color: #005a2b; margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase;">PONDOK PESANTREN SIDOGIRI</h2>
        <p style="margin: 2px 0; font-size: 11pt; color: #333;">Pasuruan Jawa Timur Indonesia</p>
        <p style="margin: 0; font-size: 10pt; font-weight: bold; color: #005a2b;">Santri Merdeka! #MiladSidogiri289</p>
      </div>

      <table style="width: 100%; font-size: 11pt; margin-bottom: 15px; border-collapse: collapse;">
        <tr><td style="width: 100px; font-weight: bold;">Nomor</td><td style="width: 10px;">:</td><td>${doc.docNumber}</td></tr>
        <tr><td style="font-weight: bold;">Lamp.</td><td>:</td><td>1 (satu) bundel</td></tr>
        <tr><td style="font-weight: bold;">Perihal</td><td>:</td><td><b>${doc.title}</b> (${doc.category})</td></tr>
      </table>

      <div style="font-size: 11pt; margin-bottom: 15px;">
        <p style="margin: 0; font-weight: bold;">Kepada Yang Terhormat:</p>
        <p style="margin: 0; font-weight: bold;">Pengurus Harian dan Pengurus Pelaksana</p>
        <p style="margin: 0; font-weight: bold;">Pondok Pesantren Sidogiri</p>
        <p style="margin: 2px 0 0 0; font-style: italic;">Di tempat</p>
      </div>

      <div style="font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 25px;">
        <p style="font-weight: bold; margin-bottom: 10px;">Assalamualaikum War Wab</p>
        <p style="margin-bottom: 10px;">Segala puji hanya milik Allah SWT, shalawat dan salam-Nya semoga tetap tercurahkan ke haribaan Nabi Muhammad SAW. Amin.</p>
        <div style="white-space: pre-wrap; margin: 15px 0; line-height: 1.6;">${doc.content}</div>
        <p style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">Wasalam,</p>
        <p style="font-weight: bold; margin: 0;">Panitia Peringatan Milad Pondok Pesantren Sidogiri 289 Tahun<br/>Dan Ikhtibar Madrasah Miftahul Ulum 90 Tahun</p>
      </div>

      <table style="width: 100%; margin-top: 35px; font-size: 11pt; text-align: center; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <p style="font-weight: bold; margin-bottom: 50px;">Ketua</p>
            <p style="font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block; padding: 0 10px;">${ketua}</p>
          </td>
          <td style="width: 50%; vertical-align: top;">
            <p style="font-weight: bold; margin-bottom: 50px;">Sekretaris</p>
            <p style="font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block; padding: 0 10px;">${sekretaris}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 25px; text-align: center;">
            <p style="font-weight: bold; margin-bottom: 50px;">Mengetahui<br/>Sekjen Majelis Keluarga Pondok Pesantren Sidogiri</p>
            <p style="font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block; padding: 0 15px;">d. ${mengetahui}</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset='utf-8'><title>${doc.title}</title></head><body>`;
  const footer = "</body></html>";
  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + contentHtml + footer);

  const link = document.createElement('a');
  document.body.appendChild(link);
  link.href = source;
  const safeTitle = doc.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  link.download = `Surat_${safeTitle}_${doc.id}.doc`;
  link.click();
  document.body.removeChild(link);
};

export const exportRegulationsToWord = (regulations: RegulationRule[]) => {
  const regsHtml = regulations
    .map(
      (r, i) => `
    <div style="margin-bottom: 25px; border: 1px solid #005a2b; padding: 15px; border-radius: 8px;">
      <h3 style="color: #005a2b; margin-top: 0; font-size: 14pt;">${i + 1}. [${r.section}] ${r.title}</h3>
      <p style="font-size: 10pt; color: #555; margin-bottom: 10px;"><b>Diperbarui:</b> ${r.lastUpdated}</p>
      <p style="font-size: 11pt; line-height: 1.5; margin-bottom: 10px;">${r.description}</p>
      <h4 style="font-size: 11pt; margin-bottom: 5px; color: #222;">Ketentuan Utama:</h4>
      <ol style="margin-top: 5px; font-size: 11pt; line-height: 1.5;">
        ${r.points.map((pt) => `<li style="margin-bottom: 4px;">${pt}</li>`).join('')}
      </ol>
    </div>
  `
    )
    .join('');

  const contentHtml = `
    <div style="font-family: 'Times New Roman', serif; margin: 25px; color: #000;">
      <div style="border-bottom: 3px double #005a2b; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">
        <h2 style="color: #005a2b; margin: 0; font-size: 18pt; text-transform: uppercase;">PONDOK PESANTREN SIDOGIRI</h2>
        <h3 style="margin: 5px 0 0 0; font-size: 14pt;">Ketentuan & Kriteria Resmi Penganugerahan</h3>
        <p style="margin: 2px 0 0 0; font-size: 10pt; color: #005a2b; font-weight: bold;">Panitia Milad Sidogiri 289 & Ikhtibar MMU 90</p>
      </div>
      ${regsHtml}
    </div>
  `;

  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>`;
  const footer = "</body></html>";
  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + contentHtml + footer);

  const link = document.createElement('a');
  document.body.appendChild(link);
  link.href = source;
  link.download = `Ketentuan_dan_Kriteria_Penganugerahan_Sidogiri.doc`;
  link.click();
  document.body.removeChild(link);
};

interface OfficialLetterPaperProps {
  docNumber: string;
  title: string;
  category: string;
  date: string;
  hijriDate?: string;
  sender?: string;
  recipient?: string;
  content: string;
  showKop?: boolean;
  showWatermark?: boolean;
  showStamp?: boolean;
  ketuaName?: string;
  sekretarisName?: string;
  mengetahuiName?: string;
  showAngket?: boolean;
}

export const AngketUsulanPaper: React.FC<{
  showWatermark?: boolean;
  categoryName?: string;
  customPoints?: string[];
  descriptionText?: string;
}> = ({
  showWatermark = true,
  categoryName = 'Kategori Pengurus',
  customPoints = [],
  descriptionText = '',
}) => {
  return (
    <div className="printable-letter bg-white p-6 sm:p-12 rounded-2xl border border-slate-300 shadow-xl text-slate-900 font-sans relative overflow-hidden w-full max-w-3xl mx-auto my-6 min-h-[900px] flex flex-col justify-between page-break-before">
      {/* BACKGROUND WATERMARK */}
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.06]">
          <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-full border-[8px] border-[#005a2b] flex items-center justify-center relative p-6">
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-[#005a2b] flex flex-col items-center justify-center text-center p-4">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#005a2b] font-serif">P.P.S</div>
              <div className="text-[12px] font-black uppercase tracking-widest text-[#005a2b] mt-2">
                PONDOK PESANTREN SIDOGIRI
              </div>
              <div className="text-[10px] font-bold text-[#005a2b] uppercase tracking-wider mt-1">
                PASURUAN JAWA TIMUR
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 space-y-5">
        {/* Title */}
        <div className="text-center space-y-1 border-b pb-3 border-slate-200">
          <h2 className="text-xl sm:text-2xl font-extrabold font-serif text-slate-900">
            Angket Usulan
          </h2>
          <h3 className="text-sm sm:text-base font-bold text-[#005a2b]">
            Instrumen Penilaian Nominasi Penghargaan Khidmah
          </h3>
          <p className="text-xs font-bold text-slate-700">({categoryName})</p>
        </div>

        {/* Petunjuk */}
        <div className="text-xs text-slate-800 space-y-1 leading-relaxed bg-slate-50/90 p-3 rounded-xl border border-slate-200">
          <p>
            <strong>1.</strong> Baca dan cermatilah pernyataan-pernyataan di bawah ini, kemudian berdasarkan pengamatan pada setiap kegiatan dan kedisiplinan dalam semua kegiatan Pondok Pesantren Sidogiri, tulislah 1 (satu) nama Pengurus Harian atau Pengurus Pelaksana yang paling sesuai dengan pernyataan-pernyataan di bawah ini.
          </p>
          <p>
            <strong>2.</strong> Beri centang (✓) pada pernyataan di bawah ini yang sesuai dengan kepribadian pengurus yang hendak diusulkan.
          </p>
        </div>

        {/* a. Identitas Pengusul */}
        <div className="space-y-1.5 text-xs">
          <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-0.5">a. Identitas Pengusul</h4>
          <div className="grid grid-cols-[110px_10px_1fr] items-center gap-y-1">
            <span className="font-semibold text-slate-700">Nama</span>
            <span>:</span>
            <div className="border-b border-dotted border-slate-400 h-4"></div>

            <span className="font-semibold text-slate-700">Jabatan</span>
            <span>:</span>
            <div className="border-b border-dotted border-slate-400 h-4"></div>

            <span className="font-semibold text-slate-700">Domisili</span>
            <span>:</span>
            <div className="text-slate-800 font-medium">PPS ( ______ : ______ ) | LPPS *</div>

            <span className="font-semibold text-slate-700">Alamat Rumah</span>
            <span>:</span>
            <div className="border-b border-dotted border-slate-400 h-4"></div>

            <span className="font-semibold text-slate-700">No Hp</span>
            <span>:</span>
            <div className="border-b border-dotted border-slate-400 h-4"></div>
          </div>
        </div>

        {/* b. Identitas Penerima yang Diusulkan */}
        <div className="space-y-1.5 text-xs pt-1">
          <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-0.5">b. Identitas Penerima yang Diusulkan</h4>
          <div className="grid grid-cols-[110px_10px_1fr] items-center gap-y-1">
            <span className="font-semibold text-slate-700">Nama</span>
            <span>:</span>
            <div className="border-b border-dotted border-slate-400 h-4"></div>

            <span className="font-semibold text-slate-700">Jabatan</span>
            <span>:</span>
            <div className="border-b border-dotted border-slate-400 h-4"></div>

            <span className="font-semibold text-slate-700">Domisili</span>
            <span>:</span>
            <div className="text-slate-800 font-medium">PPS ( ______ : ______ ) | LPPS *</div>

            <span className="font-semibold text-slate-700">Alamat Rumah</span>
            <span>:</span>
            <div className="border-b border-dotted border-slate-400 h-4"></div>
          </div>
        </div>

        {/* Kriteria dan alasan */}
        <div className="space-y-2 text-xs pt-1">
          <h4 className="font-extrabold text-slate-900">Kriteria dan alasan yang dinilai **</h4>

          {descriptionText && (
            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 leading-normal mb-1">
              {descriptionText}
            </p>
          )}

          <div className="space-y-2 text-slate-800 pl-1">
            {customPoints.length > 0 ? (
              customPoints.map((pt, idx) => (
                <label key={idx} className="flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-[#005a2b] focus:ring-[#005a2b]" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-slate-900 mr-1">{idx + 1}.</span>
                    <span>{stripHtml(pt)}</span>
                  </div>
                </label>
              ))
            ) : (
              <>
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-[#005a2b] focus:ring-[#005a2b]" />
                  <div>
                    <strong className="text-slate-900">Dedikasi:</strong> Memiliki dedikasi yang tinggi pada Agama, Dakwah, Pondok Pesantren Sidogiri dan/atau Madrasah Miftahul Ulum.
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-[#005a2b] focus:ring-[#005a2b]" />
                  <div>
                    <strong className="text-slate-900">Ketaatan:</strong> Ditunjukkan melalui ketundukan serta kepatuhan secara penuh pada titah Masyayikh dan Pengurus atasan meskipun berbeda dengan pandangan pribadinya.
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-[#005a2b] focus:ring-[#005a2b]" />
                  <div>
                    <strong className="text-slate-900">Kapabilitas:</strong> Kemampuan dan keahlian yang dibutuhkan untuk melakukan pekerjaannya (berkaitan dengan kemampuan bidang, nalar, kecerdasan, serta kemampuan berpikir sistematis).
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-[#005a2b] focus:ring-[#005a2b]" />
                  <div>
                    <strong className="text-slate-900">Kreativitas:</strong> Ability memecahkan masalah di luar kebiasaan sehingga menjadi lebih efektif, lebih efisien, lebih cepat, dan menguntungkan.
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-[#005a2b] focus:ring-[#005a2b]" />
                  <div>
                    <strong className="text-slate-900">Karakter:</strong> Watak dasar yang ditunjukkan dalam perilaku sehari-hari, sikap, tawadhu', kemampuan mengendalikan emosi, dan respon kejadian.
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-[#005a2b] focus:ring-[#005a2b]" />
                  <div>
                    <strong className="text-slate-900">Kredibilitas:</strong> Kejujuran dan integritas yang tinggi sehingga dapat dipercaya dan diandalkan memikul amanah.
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-[#005a2b] focus:ring-[#005a2b]" />
                  <div>
                    <strong className="text-slate-900">Komitmen:</strong> Kesungguhan dalam menyelesaikan tugas walaupun dalam kondisi yang sulit dan tidak menguntungkan.
                  </div>
                </label>
              </>
            )}

            <div className="space-y-1 pt-1">
              <strong className="text-slate-900">Lain-lain ***</strong>
              <div className="space-y-1.5 pl-2 pt-1">
                <div className="flex items-center space-x-2"><span>1. :</span> <div className="border-b border-slate-300 flex-1 h-3.5"></div></div>
                <div className="flex items-center space-x-2"><span>2. :</span> <div className="border-b border-slate-300 flex-1 h-3.5"></div></div>
                <div className="flex items-center space-x-2"><span>3. :</span> <div className="border-b border-slate-300 flex-1 h-3.5"></div></div>
                <div className="flex items-center space-x-2"><span>4. :</span> <div className="border-b border-slate-300 flex-1 h-3.5"></div></div>
                <div className="flex items-center space-x-2"><span>5. :</span> <div className="border-b border-slate-300 flex-1 h-3.5"></div></div>
              </div>
            </div>
          </div>
        </div>

        {/* TTD Pengusul */}
        <div className="pt-4 flex justify-end text-xs">
          <div className="w-56 text-center space-y-10">
            <p className="text-slate-700">______, ___ - ___ 1447 H<br/><strong>Pengusul,</strong></p>
            <div>
              <p className="text-slate-400">( ____________________ )</p>
              <p className="text-[10px] text-slate-500 italic mt-0.5">Nama terang & tanda tangan</p>
            </div>
          </div>
        </div>

        {/* Footnotes */}
        <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5 italic">
          <p>*) Coret yang tidak perlu.</p>
          <p>**) Centang pada kolom yang ada di samping sesuai dengan kepribadian penerima yang diusulkan.</p>
          <p>***) Jika alasan yang dikehendaki tidak tercantum pada pilihan di atas, maka bisa diisi di kolom kosong.</p>
        </div>
      </div>
    </div>
  );
};

export const OfficialLetterPaper: React.FC<OfficialLetterPaperProps> = ({
  docNumber,
  title,
  category,
  date,
  hijriDate = '02 Jumadats Tsaniyah 1447 H',
  sender = 'Panitia Sie Penganugerahan',
  recipient = 'Pengurus Harian dan Pengurus Pelaksana Pondok Pesantren Sidogiri',
  content,
  showKop = true,
  showWatermark = true,
  showStamp = true,
  ketuaName = 'UMAR CHAMDAN',
  sekretarisName = 'BIRRIL WALID',
  mengetahuiName = 'd. NAWAWY SADOELLAH',
  showAngket = false,
}) => {
  return (
    <div className="space-y-6">
      <div className="printable-letter bg-white p-6 sm:p-12 rounded-2xl border border-slate-300 shadow-xl text-slate-900 font-sans relative overflow-hidden w-full max-w-3xl mx-auto my-2 min-h-[900px] flex flex-col justify-between">
        {/* BACKGROUND WATERMARK */}
        {showWatermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.07]">
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

        {/* MAIN LETTER CONTAINER */}
        <div className="relative z-10 space-y-4">
          {/* 1. KOP SURAT RESMI */}
          {showKop && (
            <div className="border-b-2 border-gray-800 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {/* Logo Emblem Icon Sidogiri */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#005a2b] to-[#003d1d] p-1.5 shadow-sm shrink-0 flex flex-col items-center justify-center text-center text-white border border-[#f39c12]">
                    <div className="text-[10px] font-black tracking-widest text-[#f39c12] leading-none">PPS</div>
                    <div className="text-xs font-black my-0.5 leading-none">SIDOGIRI</div>
                    <div className="text-[8px] text-amber-200 leading-none">1745 H</div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg sm:text-xl font-bold font-serif text-[#005a2b] tracking-wider">
                        sidogiri
                      </span>
                      <span className="text-xs font-black text-emerald-800 tracking-wide">Santri Merdeka!</span>
                    </div>
                    <h2 className="text-xs sm:text-sm font-extrabold text-[#005a2b] tracking-wide uppercase leading-tight mt-0.5">
                      PONDOK PESANTREN SIDOGIRI
                    </h2>
                    <h3 className="text-[10px] sm:text-xs font-bold text-gray-700">
                      Pasuruan Jawa Timur Indonesia
                    </h3>
                  </div>
                </div>

                {/* Hijri Date Display */}
                <div className="text-right text-xs font-serif font-bold text-slate-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/80">
                  {hijriDate}
                </div>
              </div>
            </div>
          )}

          {/* 2. NOMOR, LAMPIRAN, PERIHAL */}
          <div className="text-xs sm:text-sm space-y-1 pt-1 font-sans text-gray-900">
            <div className="grid grid-cols-[80px_10px_1fr] items-baseline">
              <span className="font-semibold text-gray-800">Nomor</span>
              <span>:</span>
              <span className="font-mono font-bold text-gray-900">{docNumber}</span>
            </div>
            <div className="grid grid-cols-[80px_10px_1fr] items-baseline">
              <span className="font-semibold text-gray-800">Lamp.</span>
              <span>:</span>
              <span>1 (satu) bundel</span>
            </div>
            <div className="grid grid-cols-[80px_10px_1fr] items-baseline">
              <span className="font-semibold text-gray-800">Perihal</span>
              <span>:</span>
              <span className="font-bold text-gray-900">{title || category}</span>
            </div>
          </div>

          {/* 3. KEPADA YTH BLOCK */}
          <div className="pt-2 text-xs sm:text-sm text-gray-900 space-y-0.5">
            <p className="font-semibold">Kepada Yang Terhormat:</p>
            <p className="font-bold text-gray-900">{recipient}</p>
            <p className="font-bold text-gray-900">Pondok Pesantren Sidogiri</p>
            <p className="italic text-gray-700 pt-0.5">Di tempat</p>
          </div>

          {/* 4. SALAM PEMBUKA & ISU SURAT */}
          <div className="pt-2 space-y-3 text-xs sm:text-sm text-gray-900 leading-relaxed">
            <p className="font-bold text-gray-900 font-serif text-sm">
              Assalamualaikum War Wab
            </p>

            <p className="text-justify leading-relaxed">
              Segala puji hanya milik Allah <span className="font-serif font-bold text-[#005a2b]">جل جلاله</span>, shalawat dan salam-Nya semoga tetap tercurahkan ke haribaan Nabi Muhammad <span className="font-serif font-bold text-[#005a2b]">صلى الله عليه وسلم</span>. Amin.
            </p>

            <div className="whitespace-pre-wrap leading-relaxed text-gray-900 text-justify">
              {content}
            </div>

            <p className="font-bold text-gray-900 font-serif pt-1">
              Wasalam,
            </p>
            <p className="font-bold text-xs text-slate-800">
              Panitia Peringatan Milad Pondok Pesantren Sidogiri 289 Tahun<br/>
              Dan Ikhtibar Madrasah Miftahul Ulum 90 Tahun
            </p>
          </div>

          {/* 5. TTD PANITIA (2 KOLOM KETUA & SEKRETARIS + MENGETAHUI MAJELIS KELUARGA) */}
          <div className="pt-6 space-y-6 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-8 text-center relative">
              {/* Ketua */}
              <div className="space-y-10">
                <p className="font-bold text-slate-800">Ketua</p>
                <p className="font-extrabold text-slate-900 uppercase border-b border-slate-400 inline-block px-4">
                  {ketuaName || 'UMAR CHAMDAN'}
                </p>
              </div>

              {/* Sekretaris */}
              <div className="space-y-10 relative">
                <p className="font-bold text-slate-800">Sekretaris</p>

                {/* Stempel Over Signature */}
                {showStamp && (
                  <div className="absolute top-2 left-4 pointer-events-none select-none z-20 opacity-80 rotate-[-12deg]">
                    <div className="w-28 h-18 rounded-[50%] border-2 border-[#1e3a8a] p-1 flex flex-col items-center justify-center text-center text-[#1e3a8a] bg-white/20 backdrop-blur-3xs">
                      <span className="text-[7px] font-black uppercase tracking-tighter leading-none text-[#1e3a8a]">PONDOK PESANTREN</span>
                      <span className="text-[9px] font-black uppercase text-[#1e3a8a] my-0.5 leading-none">SIDOGIRI</span>
                      <span className="text-[6.5px] font-bold text-[#1e3a8a] leading-none">PANITIA MILAD 289</span>
                    </div>
                  </div>
                )}

                <p className="font-extrabold text-slate-900 uppercase border-b border-slate-400 inline-block px-4">
                  {sekretarisName || 'BIRRIL WALID'}
                </p>
              </div>
            </div>

            {/* Mengetahui Majelis Keluarga */}
            <div className="text-center pt-2 space-y-8">
              <p className="font-bold text-slate-800">
                Mengetahui<br/>
                Sekjen Majelis Keluarga Pondok Pesantren Sidogiri
              </p>
              <p className="font-extrabold text-slate-900 uppercase border-b border-slate-400 inline-block px-6">
                d. {mengetahuiName || 'NAWAWY SADOELLAH'}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER BAR */}
        <div className="relative z-10 border-t border-gray-300 pt-2 mt-6 text-[9px] text-emerald-950 font-sans leading-tight text-center">
          <p className="font-bold">
            Santri Merdeka! #MiladSidogiri289
          </p>
        </div>
      </div>

      {/* Render Angket Usulan jika diaktifkan */}
      {showAngket && <AngketUsulanPaper showWatermark={showWatermark} />}
    </div>
  );
};

export const OfficialRegulationPaper: React.FC<{
  reg: RegulationRule;
  showKop?: boolean;
  showWatermark?: boolean;
  showStamp?: boolean;
  ketuaName?: string;
  sekretarisName?: string;
  mengetahuiName?: string;
}> = ({
  reg,
  showKop = true,
  showWatermark = true,
  showStamp = true,
  ketuaName = 'UMAR CHAMDAN',
  sekretarisName = 'BIRRIL WALID',
  mengetahuiName = 'd. NAWAWY SADOELLAH',
}) => {
  const permohonanText = `Segala puji hanya milik Allah جل جلاله, shalawat dan salam-Nya semoga tetap tercurahkan ke haribaan Nabi Muhammad صلى الله عليه وسلم. Amin.\n\nSehubungan dengan adanya rencana penganugerahan "Penghargaan Khidmah" oleh Pengasuh Pondok Pesantren Sidogiri di Malam Puncak Peringatan Milad Pondok Pesantren Sidogiri 289 Tahun dan Ikhtibar Madrasah Miftahul Ulum 90 Tahun, maka dengan ini kami berharap agar Bapak berkenan mengisi angket usulan nominator, dengan ketentuan sebagaimana terlampir.\n\nAngket usulan tersebut mohon disetorkan kepada panitia paling lambat pada hari Sabtu, tanggal 29 Jumadats Tsaniyah 1447 H | 20 Desember 2025 M.\n\nDemikian permohonan kami, atas perkenannya kami disampaikan terima kasih teriring doa jazakumullah ahsanal jaza.`;

  return (
    <div className="space-y-6">
      {/* HALAMAN 1: SURAT PERMOHONAN USULAN RESMI SIDOGIRI */}
      <OfficialLetterPaper
        docNumber="081/PPS.900.PMI/Pmh/VI.1447"
        title={`Permohonan Usulan Nominasi "${stripHtml(reg.title)}"`}
        category={stripHtml(reg.section)}
        date="2025-12-20"
        hijriDate="02 Jumadats Tsaniyah 1447 H"
        sender="Panitia Peringatan Milad Pondok Pesantren Sidogiri 289 Tahun Dan Ikhtibar Madrasah Miftahul Ulum 90 Tahun"
        recipient="Pengurus Harian dan Pengurus Pelaksana Pondok Pesantren Sidogiri"
        content={permohonanText}
        showKop={showKop}
        showWatermark={showWatermark}
        showStamp={showStamp}
        ketuaName={ketuaName}
        sekretarisName={sekretarisName}
        mengetahuiName={mengetahuiName}
        showAngket={false}
      />

      {/* HALAMAN 2 & 3: ANGKET USULAN KRITERIA LENGKAP */}
      <AngketUsulanPaper
        showWatermark={showWatermark}
        categoryName={stripHtml(reg.section) || 'Kategori Pengurus'}
        customPoints={reg.points}
        descriptionText={stripHtml(reg.description)}
      />
    </div>
  );
};

interface DocumentsViewProps {
  documents: OfficialDocument[];
  regulations: RegulationRule[];
  onAddDocument: (doc: Omit<OfficialDocument, 'id'>) => void;
  onUpdateDocument: (doc: OfficialDocument) => void;
  onDeleteDocument: (id: string) => void;
  onAddRegulation: (reg: Omit<RegulationRule, 'id'>) => void;
  onUpdateRegulation: (reg: RegulationRule) => void;
  onDeleteRegulation: (id: string) => void;
  currentUser?: UserSession | null;
  onNavigateToNominees?: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  regulations,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onAddRegulation,
  onUpdateRegulation,
  onDeleteRegulation,
  currentUser,
  onNavigateToNominees,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'surat' | 'ketentuan'>('surat');

  const isAdmin = !currentUser || currentUser.category === 'admin' || currentUser.role?.toLowerCase().includes('admin');

  // Search & Filter state for Documents
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');

  // Modals state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<OfficialDocument | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<OfficialDocument | null>(null);
  const [selectedRegForPreview, setSelectedRegForPreview] = useState<RegulationRule | null>(null);

  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<RegulationRule | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Customization Options for Official Letter Rendering
  const [showKop, setShowKop] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showStamp, setShowStamp] = useState(true);
  const [showAngket, setShowAngket] = useState(true);
  const [ketuaName, setKetuaName] = useState('UMAR CHAMDAN');
  const [sekretarisName, setSekretarisName] = useState('BIRRIL WALID');
  const [mengetahuiName, setMengetahuiName] = useState('NAWAWY SADOELLAH');

  // Import Preview Modal State
  const [importPreview, setImportPreview] = useState<{
    isOpen: boolean;
    type: 'surat' | 'ketentuan';
    fileName: string;
    docNumber: string;
    title: string;
    category: OfficialDocument['category'];
    section: string;
    content: string;
    pointsText: string;
  } | null>(null);

  // Form State for Document Modal
  const [docFormData, setDocFormData] = useState({
    docNumber: '',
    title: '',
    category: 'Surat Edaran' as OfficialDocument['category'],
    date: new Date().toISOString().split('T')[0],
    sender: 'Panitia Sie Penganugerahan',
    content: '',
    status: 'Diterbitkan' as OfficialDocument['status'],
  });

  // Form State for Regulation Modal
  const [regFormData, setRegFormData] = useState({
    section: 'Ketentuan Umum',
    title: '',
    description: '',
    pointsText: '',
  });

  const handleOpenAddDoc = () => {
    setEditingDoc(null);
    setDocFormData({
      docNumber: `00${documents.length + 1}/PENG/VII/2026`,
      title: '',
      category: 'Surat Edaran',
      date: new Date().toISOString().split('T')[0],
      sender: 'Panitia Sie Penganugerahan',
      content: '',
      status: 'Diterbitkan',
    });
    setIsDocModalOpen(true);
  };

  const handleOpenEditDoc = (doc: OfficialDocument) => {
    setEditingDoc(doc);
    setDocFormData({
      docNumber: doc.docNumber,
      title: doc.title,
      category: doc.category,
      date: doc.date,
      sender: doc.sender,
      content: doc.content,
      status: doc.status,
    });
    setIsDocModalOpen(true);
  };

  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFormData.title.trim() || !docFormData.docNumber.trim()) return;

    if (editingDoc) {
      onUpdateDocument({
        ...editingDoc,
        ...docFormData,
      });
    } else {
      onAddDocument(docFormData);
    }
    setIsDocModalOpen(false);
  };

  const handleOpenAddReg = () => {
    setEditingReg(null);
    setRegFormData({
      section: 'Ketentuan Umum',
      title: '',
      description: '',
      pointsText: '',
    });
    setIsRegModalOpen(true);
  };

  const handleOpenEditReg = (reg: RegulationRule) => {
    setEditingReg(reg);
    setRegFormData({
      section: reg.section,
      title: reg.title,
      description: reg.description,
      pointsText: reg.points.join('\n'),
    });
    setIsRegModalOpen(true);
  };

  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFormData.title.trim() || !regFormData.section.trim()) return;

    const points = regFormData.pointsText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (editingReg) {
      onUpdateRegulation({
        ...editingReg,
        section: regFormData.section,
        title: regFormData.title,
        description: regFormData.description,
        points,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    } else {
      onAddRegulation({
        section: regFormData.section,
        title: regFormData.title,
        description: regFormData.description,
        points,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }
    setIsRegModalOpen(false);
  };

  // Handle Import Files (Word .doc/.docx, PDF, or Text)
  const handleDocFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const rawText = await readWordFile(file);
    const { cleanBody, points } = cleanImportedText(rawText);

    setImportPreview({
      isOpen: true,
      type: 'surat',
      fileName: file.name,
      docNumber: `0${Math.floor(Math.random() * 80) + 10}/PPS.900/PMI/1447`,
      title: fileNameClean,
      category: 'Surat Edaran',
      section: 'Umum',
      content: cleanBody || `Naskah dokumen resmi berhasil diimpor dari file ${file.name}.`,
      pointsText: points.join('\n'),
    });
    e.target.value = '';
  };

  const handleRegFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const rawText = await readWordFile(file);
    const { cleanBody, points } = cleanImportedText(rawText);

    setImportPreview({
      isOpen: true,
      type: 'ketentuan',
      fileName: file.name,
      docNumber: '',
      title: fileNameClean,
      category: 'Surat Edaran',
      section: 'Kriteria & Ketentuan Penganugerahan',
      content: cleanBody || `Ketentuan dan kriteria resmi yang diimpor dari file ${file.name}.`,
      pointsText: points.join('\n'),
    });
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;

    if (importPreview.type === 'surat') {
      const newDoc: OfficialDocument = {
        id: `doc_${Date.now()}`,
        docNumber: importPreview.docNumber,
        title: stripHtml(importPreview.title),
        category: importPreview.category,
        date: new Date().toISOString().split('T')[0],
        sender: 'Panitia Sie Penganugerahan',
        content: stripHtml(importPreview.content),
        status: 'Diterbitkan',
      };
      onAddDocument(newDoc);
      setSelectedDocForPreview(newDoc);
    } else {
      const points = importPreview.pointsText
        .split('\n')
        .map((p) => stripHtml(p.trim()))
        .filter((p) => p.length > 0);

      const newReg: RegulationRule = {
        id: `reg_${Date.now()}`,
        section: stripHtml(importPreview.section) || 'Ketentuan Umum',
        title: stripHtml(importPreview.title),
        description: stripHtml(importPreview.content),
        points: points.length > 0 ? points : ['Persyaratan dan ketentuan sesuai petunjuk panitia.'],
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      onAddRegulation(newReg);
      setSelectedRegForPreview(newReg);
    }

    setImportPreview(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      doc.docNumber.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchDocQuery.toLowerCase());
    const matchesCat = categoryFilter === 'Semua' || doc.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Content Header & Breadcrumbs */}
      <div className="print:hidden">
        <ContentHeader
          title="Dokumen SK & Ketentuan Resmi"
          subtitle="Arsip Surat Keputusan, Edaran, serta Regulasi Penganugerahan Sidogiri"
          activeTab="dokumen"
        />
      </div>

      {/* Informational Guidance Banner for Applicants & Instansi */}
      <div className="bg-gradient-to-r from-[#004220] via-[#005a2b] to-[#007038] text-white p-4 rounded-xl shadow-md border border-emerald-700/50 space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-emerald-900/80 rounded-xl shrink-0 mt-0.5 border border-emerald-600/40 shadow-xs">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-sm font-black text-amber-300">
                  Panduan & Kriteria Resmi Sie Penganugerahan Sidogiri
                </h2>
                <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Khusus Baca (Read-Only)
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed max-w-3xl">
                Seluruh instansi/pengusul diwajibkan membaca dan memahami naskah kriteria & ketentuan resmi di bawah ini terlebih dahulu agar tidak terjadi kesalahpahaman. Setelah memahami kriteria, Anda dapat langsung mengajukan pendaftaran peserta di kolom nominasi.
              </p>
            </div>
          </div>

          {onNavigateToNominees && (
            <button
              onClick={onNavigateToNominees}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer shrink-0 border border-amber-200"
            >
              <UserCheck className="w-4 h-4 text-slate-950" />
              <span>+ Ajukan Candidate di Kolom Nominasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Banner Box */}
      <div className="admin-box border-t-4 border-t-[#3c8dbc] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-[#3c8dbc]" />
            <h1 className="text-base font-extrabold text-gray-800">
              Surat Keputusan & Ketentuan Resmi Ber-Kop Sidogiri
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pengelolaan Dokumen SK, Surat Edaran, serta Ketentuan & Kriteria Penganugerahan dengan Fitur Impor/Ekspor Word & PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'surat' && (
            <>
              {isAdmin && (
                <>
                  {/* File input for Surat import */}
                  <input
                    id="doc-import-input"
                    type="file"
                    accept=".doc,.docx,.pdf,.txt,.rtf"
                    className="hidden"
                    onChange={handleDocFileSelect}
                  />
                  <button
                    onClick={() => document.getElementById('doc-import-input')?.click()}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3 py-1.5 rounded text-xs flex items-center space-x-1.5 shadow transition cursor-pointer"
                    title="Impor Surat dari File Word (.doc/.docx) atau PDF"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Impor Word/PDF</span>
                  </button>
                </>
              )}

              <button
                onClick={() => exportRegulationsToWord(regulations)}
                className="bg-slate-700 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded text-xs flex items-center space-x-1.5 shadow transition cursor-pointer"
                title="Ekspor Semua Dokumen ke Word"
              >
                <FileDown className="w-4 h-4 text-amber-400" />
                <span>Ekspor Word (.doc)</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleOpenAddDoc}
                  className="bg-[#3c8dbc] hover:bg-[#367fa9] text-white font-extrabold px-3 py-1.5 rounded text-xs flex items-center space-x-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Buat Surat Baru</span>
                </button>
              )}
            </>
          )}

          {activeSubTab === 'ketentuan' && (
            <>
              {isAdmin && (
                <>
                  {/* File input for Ketentuan import */}
                  <input
                    id="reg-import-input"
                    type="file"
                    accept=".doc,.docx,.pdf,.txt,.rtf"
                    className="hidden"
                    onChange={handleRegFileSelect}
                  />
                  <button
                    onClick={() => document.getElementById('reg-import-input')?.click()}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3 py-1.5 rounded text-xs flex items-center space-x-1.5 shadow transition cursor-pointer"
                    title="Impor Ketentuan dari File Word (.doc/.docx) atau PDF"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Impor Ketentuan (Word/PDF)</span>
                  </button>
                </>
              )}

              <button
                onClick={() => exportRegulationsToWord(regulations)}
                className="bg-slate-700 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded text-xs flex items-center space-x-1.5 shadow transition cursor-pointer"
                title="Ekspor Semua Ketentuan ke Word"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Ekspor Ketentuan (.doc)</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleOpenAddReg}
                  className="bg-[#00a65a] hover:bg-[#008d4c] text-white font-extrabold px-3 py-1.5 rounded text-xs flex items-center space-x-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Ketentuan</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs (HANYA SURAT & KETENTUAN) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto touch-scroll-x no-scrollbar print:hidden">
        <button
          onClick={() => setActiveSubTab('surat')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            activeSubTab === 'surat'
              ? 'bg-[#3c8dbc] text-white shadow ring-2 ring-[#3c8dbc]/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Surat & SK Resmi ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ketentuan')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            activeSubTab === 'ketentuan'
              ? 'bg-[#3c8dbc] text-white shadow ring-2 ring-[#3c8dbc]/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ketentuan & Kriteria ({regulations.length})</span>
        </button>
      </div>

      {/* TAB 1: SURAT & SK RESMI */}
      {activeSubTab === 'surat' && (
        <div className="space-y-4">
          {/* Controls: Search & Category Filter */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between print:hidden">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nomor, judul, atau perihal surat..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3c8dbc]"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {['Semua', 'SK Panitia', 'Surat Edaran', 'Surat Undangan', 'Surat Permohonan'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-slate-800 text-amber-400'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold font-mono bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                      {doc.docNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        doc.category === 'SK Panitia'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : doc.category === 'Surat Edaran'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : doc.category === 'Surat Undangan'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {doc.category}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                    {doc.title}
                  </h3>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium pt-0.5">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[150px]">{doc.sender}</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-xs text-slate-700 font-normal leading-relaxed line-clamp-3">
                    {doc.content}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedDocForPreview(doc)}
                      className="text-xs font-bold text-[#3c8dbc] hover:text-[#367fa9] flex items-center space-x-1 cursor-pointer bg-sky-50 px-2.5 py-1 rounded border border-sky-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Cetak Ber-Kop</span>
                    </button>

                    <button
                      onClick={() => exportOfficialDocToWord(doc, ketuaName, sekretarisName, mengetahuiName)}
                      className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1 cursor-pointer bg-amber-50 px-2.5 py-1 rounded border border-amber-200"
                      title="Unduh Dokumen dalam format Word (.doc)"
                    >
                      <FileType className="w-3.5 h-3.5 text-amber-600" />
                      <span>Word (.doc)</span>
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditDoc(doc)}
                        className="p-1.5 text-slate-600 hover:text-[#3c8dbc] hover:bg-sky-50 rounded transition flex items-center space-x-1 text-xs font-bold px-2 py-1 bg-slate-50 border border-slate-200 cursor-pointer"
                        title="Ubah / Edit Tulisan Surat"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#3c8dbc]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition flex items-center space-x-1 text-xs font-bold px-2 py-1 bg-slate-50 border border-slate-200 cursor-pointer"
                        title="Hapus Surat"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div className="md:col-span-2 bg-white rounded-xl p-8 border border-dashed border-slate-200 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">
                  Tidak ditemukan dokumen/surat yang sesuai pencarian.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KETENTUAN & KRITERIA */}
      {activeSubTab === 'ketentuan' && (
        <div className="space-y-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {regulations.map((reg) => (
              <div
                key={reg.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                      {reg.section}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Update: {reg.lastUpdated}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm">{stripHtml(reg.title)}</h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{stripHtml(reg.description)}</p>

                  <div className="space-y-1.5 pt-1">
                    {reg.points.map((pt, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-slate-800 font-medium">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{stripHtml(pt)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Direct Action: Jump to nominations for this category */}
                  {onNavigateToNominees && (
                    <div className="pt-2">
                      <button
                        onClick={onNavigateToNominees}
                        className="w-full py-2 px-3 bg-[#005a2b] hover:bg-[#004220] text-white font-black text-xs rounded-lg shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-amber-300" />
                        <span>Pahami & Tambah Peserta di Kolom Nominasi ➡️</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedRegForPreview(reg)}
                      className="text-xs font-extrabold text-[#005a2b] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded flex items-center space-x-1 cursor-pointer"
                      title="Pratinjau Dokumen Ber-Kop Resmi & Cetak PDF"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Cetak Ber-Kop / PDF</span>
                    </button>

                    <button
                      onClick={() => exportRegulationsToWord([reg])}
                      className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded flex items-center space-x-1 cursor-pointer"
                      title="Unduh File Word (.doc)"
                    >
                      <FileType className="w-3.5 h-3.5 text-amber-600" />
                      <span>Word</span>
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditReg(reg)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition flex items-center space-x-1 text-xs font-bold px-2 py-1 bg-slate-50 border border-slate-200 cursor-pointer"
                        title="Ubah / Edit Tulisan Ketentuan"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#005a2b]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteRegulation(reg.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition flex items-center space-x-1 text-xs font-bold px-2 py-1 bg-slate-50 border border-slate-200 cursor-pointer"
                        title="Hapus Ketentuan"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Import Confirmation */}
      {importPreview && importPreview.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm overflow-y-auto p-4 flex items-center justify-center print:hidden">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setImportPreview(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <Upload className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Konfirmasi Impor File ({importPreview.type === 'surat' ? 'Surat Resmi' : 'Ketentuan & Kriteria'})
                </h2>
                <p className="text-xs text-slate-500">File: {importPreview.fileName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {importPreview.type === 'surat' ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor Surat Auto-Generated:</label>
                    <input
                      type="text"
                      value={importPreview.docNumber}
                      onChange={(e) => setImportPreview({ ...importPreview, docNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Perihal / Judul Surat:</label>
                    <input
                      type="text"
                      value={importPreview.title}
                      onChange={(e) => setImportPreview({ ...importPreview, title: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Dokumen:</label>
                    <select
                      value={importPreview.category}
                      onChange={(e) => setImportPreview({ ...importPreview, category: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900"
                    >
                      <option value="SK Panitia">SK Panitia</option>
                      <option value="Surat Edaran">Surat Edaran</option>
                      <option value="Surat Undangan">Surat Undangan</option>
                      <option value="Surat Permohonan">Surat Permohonan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Isi / Naskah Hasil Impor:</label>
                    <textarea
                      rows={6}
                      value={importPreview.content}
                      onChange={(e) => setImportPreview({ ...importPreview, content: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-relaxed font-sans"
                    ></textarea>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seksi / Kluster Ketentuan:</label>
                    <input
                      type="text"
                      value={importPreview.section}
                      onChange={(e) => setImportPreview({ ...importPreview, section: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Judul Aturan / Ketentuan:</label>
                    <input
                      type="text"
                      value={importPreview.title}
                      onChange={(e) => setImportPreview({ ...importPreview, title: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pendahuluan / Maksud Ketentuan (Hasil Impor Word Penuh):</label>
                    <textarea
                      rows={4}
                      value={importPreview.content}
                      onChange={(e) => setImportPreview({ ...importPreview, content: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-relaxed font-sans"
                      placeholder="Seluruh isi naskah asli dari Word..."
                    ></textarea>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">Poin-Poin Kriteria Utama (Setiap Baris Adalah 1 Poin Kriteria):</label>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {importPreview.pointsText.split('\n').filter((p) => p.trim()).length} Poin Terbaca
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      value={importPreview.pointsText}
                      onChange={(e) => setImportPreview({ ...importPreview, pointsText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 font-sans leading-relaxed text-xs"
                      placeholder="Poin-poin kriteria lengkap dari file Word..."
                    ></textarea>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="px-4 py-1.5 rounded border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Hasil Impor ke Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Document */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 flex items-center justify-center print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsDocModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-black text-slate-900">
              {editingDoc ? 'Ubah Surat Resmi' : 'Buat Surat Resmi Baru'}
            </h2>

            <form onSubmit={handleDocSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Surat:</label>
                <input
                  type="text"
                  required
                  value={docFormData.docNumber}
                  onChange={(e) => setDocFormData({ ...docFormData, docNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded font-mono focus:ring-2 focus:ring-[#3c8dbc] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perihal / Judul Surat:</label>
                <input
                  type="text"
                  required
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#3c8dbc] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori:</label>
                  <select
                    value={docFormData.category}
                    onChange={(e) => setDocFormData({ ...docFormData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#3c8dbc] focus:outline-none font-bold"
                  >
                    <option value="SK Panitia">SK Panitia</option>
                    <option value="Surat Edaran">Surat Edaran</option>
                    <option value="Surat Undangan">Surat Undangan</option>
                    <option value="Surat Permohonan">Surat Permohonan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Surat:</label>
                  <input
                    type="date"
                    value={docFormData.date}
                    onChange={(e) => setDocFormData({ ...docFormData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#3c8dbc] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pengirim / Pengesah:</label>
                <input
                  type="text"
                  value={docFormData.sender}
                  onChange={(e) => setDocFormData({ ...docFormData, sender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#3c8dbc] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Ringkasan / Naskah Surat:</label>
                <textarea
                  rows={4}
                  required
                  value={docFormData.content}
                  onChange={(e) => setDocFormData({ ...docFormData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#3c8dbc] focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#3c8dbc] hover:bg-[#367fa9] text-white font-extrabold shadow"
                >
                  Simpan Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Regulation */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 flex items-center justify-center print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-black text-slate-900">
              {editingReg ? 'Ubah Ketentuan / Kriteria' : 'Tambah Ketentuan Baru'}
            </h2>

            <form onSubmit={handleRegSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seksi / Kluster:</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ketentuan Umum / Kriteria Penilaian"
                  value={regFormData.section}
                  onChange={(e) => setRegFormData({ ...regFormData, section: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#00a65a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Ketentuan:</label>
                <input
                  type="text"
                  required
                  value={regFormData.title}
                  onChange={(e) => setRegFormData({ ...regFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#00a65a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={regFormData.description}
                  onChange={(e) => setRegFormData({ ...regFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#00a65a] focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Poin-poin Ketentuan (1 per baris):</label>
                <textarea
                  rows={4}
                  placeholder="Masukkan tiap poin aturan di baris terpisah"
                  value={regFormData.pointsText}
                  onChange={(e) => setRegFormData({ ...regFormData, pointsText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-[#00a65a] focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#00a65a] hover:bg-[#008d4c] text-white font-extrabold shadow"
                >
                  Simpan Ketentuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Document Full Official Preview */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 flex items-center justify-center">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#3c8dbc]" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Pratinjau Resmi Surat Ber-Kop Sidogiri & TTD
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      const docToEdit = selectedDocForPreview;
                      setSelectedDocForPreview(null);
                      handleOpenEditDoc(docToEdit);
                    }}
                    className="px-3 py-1.5 bg-[#3c8dbc] hover:bg-[#367fa9] text-white font-extrabold rounded text-xs flex items-center space-x-1 cursor-pointer shadow"
                    title="Ubah / Edit Tulisan Surat Ini"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Tulisan</span>
                  </button>
                )}

                <button
                  onClick={() => exportOfficialDocToWord(selectedDocForPreview, ketuaName, sekretarisName, mengetahuiName)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded text-xs flex items-center space-x-1 cursor-pointer shadow"
                >
                  <FileType className="w-4 h-4" />
                  <span>Download Word</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-[#00a65a] hover:bg-[#008d4c] text-white font-bold rounded text-xs flex items-center space-x-1 cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>

                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Render Official Paper in Modal */}
            <OfficialLetterPaper
              docNumber={selectedDocForPreview.docNumber}
              title={selectedDocForPreview.title}
              category={selectedDocForPreview.category}
              date={selectedDocForPreview.date}
              sender={selectedDocForPreview.sender}
              content={selectedDocForPreview.content}
              showKop={true}
              showWatermark={true}
              showStamp={true}
              showAngket={showAngket}
              ketuaName={ketuaName}
              sekretarisName={sekretarisName}
              mengetahuiName={mengetahuiName}
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-2 print:hidden">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `PANITIA SIE PENGANUGERAHAN\nNomor: ${selectedDocForPreview.docNumber}\nJudul: ${selectedDocForPreview.title}\nTanggal: ${selectedDocForPreview.date}\n\n${selectedDocForPreview.content}`,
                      selectedDocForPreview.id
                    )
                  }
                  className="px-3.5 py-1.5 bg-[#f39c12] hover:bg-[#e08e0b] text-slate-950 font-bold rounded text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedId === selectedDocForPreview.id ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Naskah Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Seluruh Naskah</span>
                    </>
                  )}
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        const docToEdit = selectedDocForPreview;
                        setSelectedDocForPreview(null);
                        handleOpenEditDoc(docToEdit);
                      }}
                      className="px-3.5 py-1.5 bg-[#3c8dbc] hover:bg-[#367fa9] text-white font-bold rounded text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title="Edit Tulisan / Isi Surat Ini"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Tulisan Surat</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus surat ini?')) {
                          onDeleteDocument(selectedDocForPreview.id);
                          setSelectedDocForPreview(null);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title="Hapus Surat Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Surat</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="px-4 py-1.5 rounded border border-slate-300 text-slate-700 font-bold text-xs hover:bg-white bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Regulation Official Preview */}
      {selectedRegForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 flex items-center justify-center">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#005a2b]" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Pratinjau Resmi Ketentuan & Kriteria Ber-Kop Sidogiri
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      const regToEdit = selectedRegForPreview;
                      setSelectedRegForPreview(null);
                      handleOpenEditReg(regToEdit);
                    }}
                    className="px-3 py-1.5 bg-[#005a2b] hover:bg-[#004220] text-white font-extrabold rounded text-xs flex items-center space-x-1 cursor-pointer shadow"
                    title="Ubah / Edit Tulisan Ketentuan Ini"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Tulisan</span>
                  </button>
                )}

                <button
                  onClick={() => exportRegulationsToWord([selectedRegForPreview])}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded text-xs flex items-center space-x-1 cursor-pointer shadow"
                >
                  <FileType className="w-4 h-4" />
                  <span>Download Word</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-[#00a65a] hover:bg-[#008d4c] text-white font-bold rounded text-xs flex items-center space-x-1 cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>

                <button
                  onClick={() => setSelectedRegForPreview(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Render Official Regulation Paper in Modal */}
            <OfficialRegulationPaper
              reg={selectedRegForPreview}
              showKop={true}
              showWatermark={true}
              showStamp={true}
              ketuaName={ketuaName}
              sekretarisName={sekretarisName}
              mengetahuiName={mengetahuiName}
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-2 print:hidden">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `PONDOK PESANTREN SIDOGIRI\nKETENTUAN & KRITERIA RESMI\nKluster: ${selectedRegForPreview.section}\nJudul: ${selectedRegForPreview.title}\n\n${selectedRegForPreview.description}\n\nPoin-poin:\n${selectedRegForPreview.points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
                      selectedRegForPreview.id
                    )
                  }
                  className="px-3.5 py-1.5 bg-[#f39c12] hover:bg-[#e08e0b] text-slate-950 font-bold rounded text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedId === selectedRegForPreview.id ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Naskah Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Seluruh Naskah</span>
                    </>
                  )}
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        const regToEdit = selectedRegForPreview;
                        setSelectedRegForPreview(null);
                        handleOpenEditReg(regToEdit);
                      }}
                      className="px-3.5 py-1.5 bg-[#005a2b] hover:bg-[#004220] text-white font-bold rounded text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title="Edit Tulisan / Isi Ketentuan Ini"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Tulisan Ketentuan</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus ketentuan ini?')) {
                          onDeleteRegulation(selectedRegForPreview.id);
                          setSelectedRegForPreview(null);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title="Hapus Ketentuan Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Ketentuan</span>
                    </button>
                  </>
                )}

                {onNavigateToNominees && (
                  <button
                    onClick={() => {
                      setSelectedRegForPreview(null);
                      onNavigateToNominees();
                    }}
                    className="px-3.5 py-1.5 bg-[#005a2b] hover:bg-[#004220] text-white font-extrabold rounded text-xs flex items-center space-x-1.5 cursor-pointer shadow"
                  >
                    <UserCheck className="w-4 h-4 text-amber-300" />
                    <span>Pahami & Ajukan Candidate Nominasi ➡️</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedRegForPreview(null)}
                className="px-4 py-1.5 rounded border border-slate-300 text-slate-700 font-bold text-xs hover:bg-white bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
