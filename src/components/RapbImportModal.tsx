import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  X,
  Check,
  AlertCircle,
  FileText,
  Download,
  Layers,
  Sparkles,
  Loader2,
  Trash2,
  RefreshCw,
  Info,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { RapbItem, TransactionCategory } from '../types';

interface RapbImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkAddRapb: (newItems: RapbItem[], mode: 'append' | 'replace') => void;
  existingCount: number;
}

interface ParsedRapbRow {
  id: string;
  posCode: string;
  programName: string;
  qtm?: number;
  qtmKet?: string;
  vol?: number;
  volKet?: string;
  unitPrice?: number;
  allocatedBudget: number;
  category: TransactionCategory;
  description: string;
  selected: boolean;
  isValid: boolean;
  error?: string;
}

const CATEGORIES_LIST: TransactionCategory[] = [
  'SEKSI PENGANUGERAHAN',
  'PENGANUGERAHAN (25.200)',
  'HADIAH LOMBA (25.300)',
  'JUARAWAN MMU DAN DAERAH (25.400)',
  'LAIN-LAIN (25.500)',
];

export const RapbImportModal: React.FC<RapbImportModalProps> = ({
  isOpen,
  onClose,
  onBulkAddRapb,
  existingCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRapbRow[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helper to match category from string
  const detectCategory = (str: string): TransactionCategory => {
    if (!str) return 'LAIN-LAIN (25.500)';
    const lower = str.toLowerCase();
    if (lower.includes('25.200') || (lower.includes('penganugerahan') && !lower.includes('seksi'))) {
      return 'PENGANUGERAHAN (25.200)';
    }
    if (lower.includes('25.300') || lower.includes('hadiah') || lower.includes('lomba')) {
      return 'HADIAH LOMBA (25.300)';
    }
    if (lower.includes('25.400') || lower.includes('juarawan') || lower.includes('mmu') || lower.includes('daerah')) {
      return 'JUARAWAN MMU DAN DAERAH (25.400)';
    }
    if (lower.includes('25.500') || lower.includes('lain')) {
      return 'LAIN-LAIN (25.500)';
    }
    if (lower.includes('seksi')) {
      return 'SEKSI PENGANUGERAHAN';
    }
    const exact = CATEGORIES_LIST.find((c) => c.toLowerCase() === lower);
    return exact || 'LAIN-LAIN (25.500)';
  };

  // Parse CSV Content
  const parseCSV = (csvText: string): ParsedRapbRow[] => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    // Detect delimiter: comma, semicolon, tab, or pipe
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes('|')) delimiter = '|';

    // Check if first line is a header
    const headers = lines[0].split(delimiter).map((h) => h.replace(/["']/g, '').trim().toLowerCase());
    let hasHeader = false;
    let codeCol = -1;
    let nameCol = -1;
    let qtmCol = -1;
    let qtmKetCol = -1;
    let volCol = -1;
    let volKetCol = -1;
    let unitPriceCol = -1;
    let budgetCol = -1;
    let catCol = -1;
    let descCol = -1;

    headers.forEach((h, idx) => {
      if (h.includes('pos') || (h.includes('kode') && !h.includes('kegiatan'))) {
        codeCol = idx;
        hasHeader = true;
      } else if (h.includes('uraian') || h.includes('program') || h.includes('kegiatan') || (h.includes('nama') && !h.includes('kategori'))) {
        nameCol = idx;
        hasHeader = true;
      } else if (h === 'qtm' || h.includes('kuantitas') || h === 'qty') {
        qtmCol = idx;
        hasHeader = true;
      } else if (h === 'vol' || h.includes('volume')) {
        volCol = idx;
        hasHeader = true;
      } else if (h === 'satuan' || h.includes('harga') || h.includes('tarif')) {
        unitPriceCol = idx;
        hasHeader = true;
      } else if (h === 'jumlah' || h.includes('pagu') || h.includes('anggaran') || h.includes('total') || h.includes('nominal')) {
        budgetCol = idx;
        hasHeader = true;
      } else if (h.includes('kategori') || h.includes('jenis')) {
        catCol = idx;
        hasHeader = true;
      } else if (h.includes('ket') || h.includes('keterangan') || h.includes('deskripsi') || h.includes('catatan')) {
        // If there are multiple KET columns, map them contextually
        if (qtmCol !== -1 && qtmKetCol === -1 && idx > qtmCol && (volCol === -1 || idx < volCol)) {
          qtmKetCol = idx;
        } else if (volCol !== -1 && volKetCol === -1 && idx > volCol) {
          volKetCol = idx;
        } else if (descCol === -1) {
          descCol = idx;
        }
        hasHeader = true;
      }
    });

    // Default column fallback if no explicit headers found
    if (!hasHeader) {
      codeCol = 0;
      nameCol = 1;
      qtmCol = 2;
      qtmKetCol = 3;
      volCol = 4;
      volKetCol = 5;
      unitPriceCol = 6;
      budgetCol = 7;
      catCol = 8;
      descCol = 9;
    } else {
      if (nameCol === -1 && codeCol !== 0) nameCol = 0;
      if (nameCol === -1) nameCol = 1;
      if (budgetCol === -1 && unitPriceCol === -1) budgetCol = 2;
    }

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const startIndex = importMode === 'replace' ? 1 : existingCount + 1;

    return dataLines.map((line, idx) => {
      // Split with quotes support
      const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
      
      let code = (codeCol >= 0 && cols[codeCol] ? cols[codeCol] : '').toUpperCase();
      let name = nameCol >= 0 && cols[nameCol] ? cols[nameCol] : '';
      let qtmRaw = qtmCol >= 0 && cols[qtmCol] ? cols[qtmCol] : '1';
      let qtmKet = qtmKetCol >= 0 && cols[qtmKetCol] ? cols[qtmKetCol] : 'Buah';
      let volRaw = volCol >= 0 && cols[volCol] ? cols[volCol] : '1';
      let volKet = volKetCol >= 0 && cols[volKetCol] ? cols[volKetCol] : 'Kegiatan';
      let unitPriceRaw = unitPriceCol >= 0 && cols[unitPriceCol] ? cols[unitPriceCol] : '0';
      let budgetRaw = budgetCol >= 0 && cols[budgetCol] ? cols[budgetCol] : '0';
      let cat = detectCategory(catCol >= 0 && cols[catCol] ? cols[catCol] : '');
      let desc = descCol >= 0 && cols[descCol] ? cols[descCol] : '';

      // If code doesn't start with POS or is numeric, normalize to POS-XX
      if (!code || !code.startsWith('POS')) {
        code = `POS-${String(startIndex + idx).padStart(2, '0')}`;
      }

      const qtm = parseFloat(qtmRaw.replace(/[^0-9.]/g, '')) || 1;
      const vol = parseFloat(volRaw.replace(/[^0-9.]/g, '')) || 1;
      let unitPrice = parseInt(unitPriceRaw.replace(/[^0-9]/g, ''), 10) || 0;
      let numericBudget = parseInt(budgetRaw.replace(/[^0-9]/g, ''), 10) || 0;

      // Auto-compute budget or unit price if one is missing
      if (numericBudget === 0 && unitPrice > 0) {
        numericBudget = Math.round(qtm * vol * unitPrice);
      } else if (unitPrice === 0 && numericBudget > 0) {
        unitPrice = Math.round(numericBudget / Math.max(1, qtm * vol));
      }

      const isValid = name.trim().length > 0 && numericBudget > 0;

      return {
        id: `parsed-${Date.now()}-${idx}`,
        posCode: code,
        programName: name,
        qtm,
        qtmKet,
        vol,
        volKet,
        unitPrice,
        allocatedBudget: numericBudget,
        category: cat,
        description: desc,
        selected: isValid,
        isValid,
        error: !isValid
          ? name.trim().length === 0
            ? 'Nama program kosong'
            : 'Pagu anggaran 0 / tidak valid'
          : undefined,
      };
    });
  };

  // Parse Excel (.xlsx / .xls) with ExcelJS
  const parseExcel = async (file: File): Promise<ParsedRapbRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja (worksheet).');
    }

    const rawRows: string[][] = [];
    worksheet.eachRow((row) => {
      const rowValues = (row.values as any[]).slice(1); // ExcelJS values are 1-indexed
      rawRows.push(
        rowValues.map((v) => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'object' && v.result !== undefined) return String(v.result);
          if (typeof v === 'object' && v.text !== undefined) return String(v.text);
          return String(v);
        })
      );
    });

    if (rawRows.length === 0) return [];

    // Header detection
    const firstRow = rawRows[0].map((c) => c.toLowerCase().trim());
    let codeCol = -1;
    let nameCol = -1;
    let qtmCol = -1;
    let qtmKetCol = -1;
    let volCol = -1;
    let volKetCol = -1;
    let unitPriceCol = -1;
    let budgetCol = -1;
    let catCol = -1;
    let descCol = -1;
    let hasHeader = false;

    firstRow.forEach((h, idx) => {
      if (h.includes('pos') || (h.includes('kode') && !h.includes('kegiatan'))) {
        codeCol = idx;
        hasHeader = true;
      } else if (h.includes('uraian') || h.includes('program') || h.includes('kegiatan') || (h.includes('nama') && !h.includes('kategori'))) {
        nameCol = idx;
        hasHeader = true;
      } else if (h === 'qtm' || h.includes('kuantitas') || h === 'qty') {
        qtmCol = idx;
        hasHeader = true;
      } else if (h === 'vol' || h.includes('volume')) {
        volCol = idx;
        hasHeader = true;
      } else if (h === 'satuan' || h.includes('harga') || h.includes('tarif')) {
        unitPriceCol = idx;
        hasHeader = true;
      } else if (h === 'jumlah' || h.includes('pagu') || h.includes('anggaran') || h.includes('total') || h.includes('nominal')) {
        budgetCol = idx;
        hasHeader = true;
      } else if (h.includes('kategori') || h.includes('jenis')) {
        catCol = idx;
        hasHeader = true;
      } else if (h.includes('ket') || h.includes('keterangan') || h.includes('deskripsi') || h.includes('catatan')) {
        if (qtmCol !== -1 && qtmKetCol === -1 && idx > qtmCol && (volCol === -1 || idx < volCol)) {
          qtmKetCol = idx;
        } else if (volCol !== -1 && volKetCol === -1 && idx > volCol) {
          volKetCol = idx;
        } else if (descCol === -1) {
          descCol = idx;
        }
        hasHeader = true;
      }
    });

    if (!hasHeader) {
      codeCol = 0;
      nameCol = 1;
      qtmCol = 2;
      qtmKetCol = 3;
      volCol = 4;
      volKetCol = 5;
      unitPriceCol = 6;
      budgetCol = 7;
      catCol = 8;
      descCol = 9;
    } else {
      if (nameCol === -1) nameCol = 1;
      if (budgetCol === -1 && unitPriceCol === -1) budgetCol = 2;
    }

    const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
    const startIndex = importMode === 'replace' ? 1 : existingCount + 1;

    return dataRows
      .filter((cols) => cols.some((c) => c.trim().length > 0))
      .map((cols, idx) => {
        let code = (codeCol >= 0 && cols[codeCol] ? cols[codeCol] : '').toUpperCase().trim();
        let name = (nameCol >= 0 && cols[nameCol] ? cols[nameCol] : '').trim();
        let qtmRaw = (qtmCol >= 0 && cols[qtmCol] ? cols[qtmCol] : '1').trim();
        let qtmKet = (qtmKetCol >= 0 && cols[qtmKetCol] ? cols[qtmKetCol] : 'Buah').trim();
        let volRaw = (volCol >= 0 && cols[volCol] ? cols[volCol] : '1').trim();
        let volKet = (volKetCol >= 0 && cols[volKetCol] ? cols[volKetCol] : 'Kegiatan').trim();
        let unitPriceRaw = (unitPriceCol >= 0 && cols[unitPriceCol] ? cols[unitPriceCol] : '0').trim();
        let budgetRaw = (budgetCol >= 0 && cols[budgetCol] ? cols[budgetCol] : '0').trim();
        let cat = detectCategory(catCol >= 0 && cols[catCol] ? cols[catCol] : '');
        let desc = (descCol >= 0 && cols[descCol] ? cols[descCol] : '').trim();

        if (!code || !code.startsWith('POS')) {
          code = `POS-${String(startIndex + idx).padStart(2, '0')}`;
        }

        const qtm = parseFloat(qtmRaw.replace(/[^0-9.]/g, '')) || 1;
        const vol = parseFloat(volRaw.replace(/[^0-9.]/g, '')) || 1;
        let unitPrice = parseInt(unitPriceRaw.replace(/[^0-9]/g, ''), 10) || 0;
        let numericBudget = parseInt(budgetRaw.replace(/[^0-9]/g, ''), 10) || 0;

        if (numericBudget === 0 && unitPrice > 0) {
          numericBudget = Math.round(qtm * vol * unitPrice);
        } else if (unitPrice === 0 && numericBudget > 0) {
          unitPrice = Math.round(numericBudget / Math.max(1, qtm * vol));
        }

        const isValid = name.length > 0 && numericBudget > 0;

        return {
          id: `excel-${Date.now()}-${idx}`,
          posCode: code,
          programName: name,
          qtm,
          qtmKet,
          vol,
          volKet,
          unitPrice,
          allocatedBudget: numericBudget,
          category: cat,
          description: desc,
          selected: isValid,
          isValid,
          error: !isValid
            ? name.length === 0
              ? 'Nama program kosong'
              : 'Pagu anggaran 0 / tidak valid'
            : undefined,
        };
      });
  };

  // Handle File Input Change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    setSelectedFile(file);
    setIsLoading(true);

    try {
      const fileName = file.name.toLowerCase();
      let results: ParsedRapbRow[] = [];

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        results = await parseExcel(file);
      } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.tsv')) {
        const text = await file.text();
        results = parseCSV(text);
      } else {
        throw new Error('Format berkas tidak didukung. Harap pilih berkas .xlsx, .xls, atau .csv');
      }

      if (results.length === 0) {
        throw new Error('Tidak ada baris data pos RAPB yang berhasil diekstrak dari berkas ini.');
      }

      setParsedRows(results);
    } catch (err: any) {
      console.error('Failed to parse RAPB file:', err);
      setErrorMessage(err?.message || 'Gagal memproses berkas. Pastikan format tabel sesuai.');
      setParsedRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection
  const handleToggleRow = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.isValid ? { ...r, selected: select } : r))
    );
  };

  // Update row in preview
  const handleUpdateRow = (id: string, field: keyof ParsedRapbRow, val: any) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        const valid = updated.programName.trim().length > 0 && updated.allocatedBudget > 0;
        return {
          ...updated,
          isValid: valid,
          selected: valid ? updated.selected : false,
        };
      })
    );
  };

  // Delete row from preview
  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Execute Bulk Add
  const handleConfirmImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.isValid);
    if (selectedRows.length === 0) {
      alert('Pilih minimal satu baris pos RAPB yang valid untuk diimpor.');
      return;
    }

    const itemsToImport: RapbItem[] = selectedRows.map((r, idx) => ({
      id: `rapb-${Date.now()}-${idx}`,
      posCode: r.posCode.trim().toUpperCase(),
      programName: r.programName.trim(),
      qtm: r.qtm ?? 1,
      qtmKet: r.qtmKet || undefined,
      vol: r.vol ?? 1,
      volKet: r.volKet || undefined,
      unitPrice: r.unitPrice,
      allocatedBudget: r.allocatedBudget,
      category: r.category,
      description: r.description.trim() || undefined,
      keywords: [
        r.programName.toLowerCase(),
        r.posCode.toLowerCase(),
        r.category.toLowerCase(),
      ],
    }));

    onBulkAddRapb(itemsToImport, importMode);
    onClose();
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'POS,URAIAN,QTM,KET,VOL,KET,SATUAN,JUMLAH,KATEGORI,KETERANGAN\n' +
      'POS-01,Pembuatan Trofi Kristal & Plakat Juara,25,Buah,1,Kegiatan,500000,12500000,PENGANUGERAHAN (25.200),Pengadaan trofi kristal eksklusif dan plakat kayu\n' +
      'POS-02,Plakat Khidmah Asatidz & Tokoh Inspiratif,15,Buah,1,Kegiatan,300000,4500000,SEKSI PENGANUGERAHAN,Vandel penghargaan asatidz sepuh\n' +
      'POS-03,Pengadaan Hadiah Juara & Bisyarah,38,Paket,1,Kegiatan,100000,3800000,HADIAH LOMBA (25.300),Hadiah pemenang aneka lomba\n' +
      'POS-04,Apresiasi Juarawan MMU & Ranting Daerah,260,Orang,1,Kegiatan,20000,5200000,JUARAWAN MMU DAN DAERAH (25.400),Bisyarah dan cinderamata juarawan\n' +
      'POS-05,Biaya Operasional & Keperluan Sie,1,Paket,1,Kegiatan,3500000,3500000,LAIN-LAIN (25.500),Operasional kesekretariatan dan tak terduga';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_RAPB_Sie_Penganugerahan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validSelectedCount = parsedRows.filter((r) => r.selected && r.isValid).length;
  const totalSelectedBudget = parsedRows
    .filter((r) => r.selected && r.isValid)
    .reduce((sum, r) => sum + r.allocatedBudget, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[rgba(36,33,28,0.15)] overflow-hidden text-slate-800 my-auto animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-[#fcfbf9] px-6 py-4.5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8a7c4c]/10 text-[#8a7c4c] flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <span>Impor & Unggah Berkas RAPB (Excel / CSV)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8a7c4c]/15 text-[#6f633a]">
                  Bulk Import
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Unggah file Excel (.xlsx / .xls) atau CSV untuk mengekstrak dan menambahkan banyak pos anggaran sekaligus
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* UPLOAD DROPZONE */}
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-[#8a7c4c]/40 hover:border-[#8a7c4c] bg-[#fdfbf7] hover:bg-[#8a7c4c]/5 rounded-3xl flex flex-col items-center justify-center text-center group cursor-pointer transition shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#8a7c4c]/30 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-xs">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 text-[#8a7c4c] animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-[#8a7c4c]" />
                )}
              </div>

              <span className="font-extrabold text-sm text-slate-900">
                {selectedFile ? `Berkas Terpilih: ${selectedFile.name}` : 'Klik untuk Pilih atau Drag & Drop Berkas RAPB'}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 max-w-md">
                Mendukung berkas Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) atau <strong>.csv</strong>. Sistem otomatis membaca kolom Kode Pos, Program, Pagu Anggaran, dan Kategori.
              </span>

              <div className="mt-4 flex items-center space-x-2">
                <span className="px-3.5 py-1.5 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl text-xs transition shadow-2xs">
                  {selectedFile ? 'Pilih Berkas Lain' : 'Pilih Berkas Excel / CSV'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadTemplate();
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#8a7c4c]" />
                  <span>Unduh Contoh Template CSV</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Gagal Mengekstrak Berkas</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* PARSED PREVIEW SECTION */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {/* Toolbar & Import Mode Settings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                    <span>Pratinjau Hasil Ekstraksi ({parsedRows.length} Pos)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {validSelectedCount} Pos Siap Diimpor
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Periksa atau sesuaikan data sebelum memasukkannya ke anggaran aplikasi
                  </p>
                </div>

                {/* Import Mode Options (Append vs Replace) */}
                <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Mode Impor:</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-[#8a7c4c] focus:ring-[#8a7c4c]"
                    />
                    <span className="font-medium">Tambahkan (Append)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-[#8a7c4c] focus:ring-[#8a7c4c]"
                    />
                    <span className="font-medium text-rose-700">Gantikan Semua</span>
                  </label>
                </div>
              </div>

              {/* Selection Summary Actions */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    Pilih Semua Valid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    Hapus Pilihan
                  </button>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-500">Total Pagu Terpilih: </span>
                  <strong className="text-emerald-700 text-sm font-black">
                    {formatIDR(totalSelectedBudget)}
                  </strong>
                </div>
              </div>

              {/* Interactive Table of Extracted Rows */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                    <thead className="bg-[#fcfbf9] text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 text-[11px]">
                      <tr>
                        <th className="p-2.5 text-center w-8">Pilih</th>
                        <th className="p-2.5 w-20">POS</th>
                        <th className="p-2.5 min-w-[200px] whitespace-normal">URAIAN</th>
                        <th className="p-2.5 text-center w-12">QTM</th>
                        <th className="p-2.5 text-center w-16">KET</th>
                        <th className="p-2.5 text-center w-12">VOL</th>
                        <th className="p-2.5 text-center w-16">KET</th>
                        <th className="p-2.5 text-right w-24">SATUAN (Rp)</th>
                        <th className="p-2.5 text-right w-28 bg-[#8a7c4c]/5 font-black">JUMLAH (Rp)</th>
                        <th className="p-2.5 min-w-[130px]">Kategori</th>
                        <th className="p-2.5 text-center w-10">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`transition ${
                            !row.isValid
                              ? 'bg-rose-50/40 text-slate-500'
                              : row.selected
                              ? 'bg-[#fdfbf7]/80 hover:bg-[#fdfbf7]'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              disabled={!row.isValid}
                              onChange={() => handleToggleRow(row.id)}
                              className="rounded text-[#8a7c4c] focus:ring-[#8a7c4c] cursor-pointer disabled:opacity-30"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={row.posCode}
                              onChange={(e) => handleUpdateRow(row.id, 'posCode', e.target.value.toUpperCase())}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-[#8a7c4c] text-xs focus:ring-1 focus:ring-[#8a7c4c]"
                            />
                          </td>

                          <td className="p-2 whitespace-normal">
                            <input
                              type="text"
                              value={row.programName}
                              onChange={(e) => handleUpdateRow(row.id, 'programName', e.target.value)}
                              placeholder="Nama Program..."
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-xs focus:ring-1 focus:ring-[#8a7c4c]"
                            />
                            {row.error && (
                              <span className="text-[10px] font-semibold text-rose-600 block mt-0.5">
                                ⚠ {row.error}
                              </span>
                            )}
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={row.qtm ?? 1}
                              onChange={(e) => {
                                const newQtm = parseFloat(e.target.value) || 1;
                                const vol = row.vol ?? 1;
                                const unitPrice = row.unitPrice ?? 0;
                                const newBudget = unitPrice > 0 ? Math.round(newQtm * vol * unitPrice) : row.allocatedBudget;
                                handleUpdateRow(row.id, 'qtm', newQtm);
                                if (unitPrice > 0) handleUpdateRow(row.id, 'allocatedBudget', newBudget);
                              }}
                              className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-800 text-xs"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={row.qtmKet || 'Buah'}
                              onChange={(e) => handleUpdateRow(row.id, 'qtmKet', e.target.value)}
                              className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-center text-slate-600 text-xs"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={row.vol ?? 1}
                              onChange={(e) => {
                                const newVol = parseFloat(e.target.value) || 1;
                                const qtm = row.qtm ?? 1;
                                const unitPrice = row.unitPrice ?? 0;
                                const newBudget = unitPrice > 0 ? Math.round(qtm * newVol * unitPrice) : row.allocatedBudget;
                                handleUpdateRow(row.id, 'vol', newVol);
                                if (unitPrice > 0) handleUpdateRow(row.id, 'allocatedBudget', newBudget);
                              }}
                              className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-800 text-xs"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={row.volKet || 'Kegiatan'}
                              onChange={(e) => handleUpdateRow(row.id, 'volKet', e.target.value)}
                              className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-center text-slate-600 text-xs"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={row.unitPrice ?? 0}
                              onChange={(e) => {
                                const newPrice = parseInt(e.target.value, 10) || 0;
                                const qtm = row.qtm ?? 1;
                                const vol = row.vol ?? 1;
                                const newBudget = newPrice > 0 ? Math.round(qtm * vol * newPrice) : row.allocatedBudget;
                                handleUpdateRow(row.id, 'unitPrice', newPrice);
                                if (newPrice > 0) handleUpdateRow(row.id, 'allocatedBudget', newBudget);
                              }}
                              className="w-24 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-right font-medium text-slate-700 text-xs"
                            />
                          </td>

                          <td className="p-2 bg-[#8a7c4c]/5">
                            <input
                              type="number"
                              min="0"
                              step="10000"
                              value={row.allocatedBudget}
                              onChange={(e) => {
                                const newBudget = Number(e.target.value) || 0;
                                const qtm = row.qtm ?? 1;
                                const vol = row.vol ?? 1;
                                const newPrice = Math.round(newBudget / Math.max(1, qtm * vol));
                                handleUpdateRow(row.id, 'allocatedBudget', newBudget);
                                handleUpdateRow(row.id, 'unitPrice', newPrice);
                              }}
                              className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-black text-slate-900 text-xs focus:ring-1 focus:ring-[#8a7c4c]"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              value={row.category}
                              onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value as TransactionCategory)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#8a7c4c]"
                            >
                              {CATEGORIES_LIST.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus Baris Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-[#fcfbf9] flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? (
              <span>
                Siap mengimpor{' '}
                <strong className="text-slate-900">{validSelectedCount} Pos RAPB</strong> (
                {importMode === 'replace' ? 'Menggantikan semua data lama' : 'Ditambahkan ke pos yang ada'}
                )
              </span>
            ) : (
              <span>Unggah berkas untuk memulai ekstraksi baris pos RAPB</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={validSelectedCount === 0}
              className="px-5 py-2 bg-[#8a7c4c] hover:bg-[#6f633a] text-white font-extrabold rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Impor {validSelectedCount} Pos RAPB Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
