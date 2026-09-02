import React, { useState, useRef, useEffect } from 'react';
import { Image, Upload, Trash2, Check, RefreshCw, X, Eye, Sparkles, AlertCircle } from 'lucide-react';
import { MiladLogo, getCustomLogo, setCustomLogo } from './MiladLogo';

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({ isOpen, onClose }) => {
  const [currentLogo, setCurrentLogo] = useState<string | null>(getCustomLogo());
  const [previewUrl, setPreviewUrl] = useState<string | null>(getCustomLogo());
  const [inputUrl, setInputUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const existing = getCustomLogo();
      setCurrentLogo(existing);
      setPreviewUrl(existing);
      setInputUrl(existing && existing.startsWith('http') ? existing : '');
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap pilih file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 5MB.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) return;
    setPreviewUrl(inputUrl.trim());
    setErrorMessage(null);
  };

  const handleSave = () => {
    try {
      setCustomLogo(previewUrl);
      setCurrentLogo(previewUrl);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan logo: ' + (err?.message || 'Error'));
    }
  };

  const handleResetToDefault = () => {
    setCustomLogo(null);
    setCurrentLogo(null);
    setPreviewUrl(null);
    setInputUrl('');
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-900/20 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#005a2b] via-[#004220] to-[#002b15] px-6 py-4 flex items-center justify-between text-white border-b border-emerald-700/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Atur / Unggah Logo Resmi</h3>
              <p className="text-xs text-emerald-300">Sesuaikan logo Milad Sidogiri persis seperti yang Anda miliki</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Message */}
          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-pulse">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Logo berhasil diperbarui dan diterapkan ke seluruh sistem!</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-center space-x-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
            <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pratinjau Logo Saat Ini</span>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 inline-flex items-center justify-center min-w-[140px] min-h-[140px]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Pratinjau Logo"
                    className="max-h-28 max-w-28 object-contain"
                  />
                ) : (
                  <MiladLogo size="xl" className="w-24 h-24" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <span>{previewUrl ? '✨ Menggunakan Logo Kustom' : '🛡️ Menggunakan Logo Vektor Standar'}</span>
            </div>
          </div>

          {/* Upload Option 1: File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Opsi 1: Upload File Gambar Logo Asli (PNG transparan / JPG / SVG)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-emerald-600/40 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Pilih & Upload File dari Komputer / HP</span>
            </button>
          </div>

          {/* Upload Option 2: Image URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Opsi 2: Tempel Link / URL Gambar Langsung
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://contoh.com/logo-milad.png"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleApplyUrl}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Gunakan URL
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleResetToDefault}
            disabled={!previewUrl && !currentLogo}
            className="px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset ke Default</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#005a2b] hover:bg-[#004220] text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
