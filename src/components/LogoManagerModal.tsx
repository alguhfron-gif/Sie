import React, { useState, useRef, useEffect } from 'react';
import { Image, Upload, Trash2, Check, RefreshCw, X, Eye, Sparkles, AlertCircle, Cloud, Globe, Download, Smartphone } from 'lucide-react';
import { MiladLogo } from './MiladLogo';
import { getLocalCustomLogo, saveCustomLogo, optimizeImageForLogo, subscribeCustomLogo } from '../services/logoService';

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({ isOpen, onClose }) => {
  const [currentLogo, setCurrentLogo] = useState<string | null>(getLocalCustomLogo());
  const [previewUrl, setPreviewUrl] = useState<string | null>(getLocalCustomLogo());
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const existing = getLocalCustomLogo();
      setCurrentLogo(existing);
      setPreviewUrl(existing);
      setInputUrl(existing && existing.startsWith('http') ? existing : '');
      setSaveSuccess(false);
      setErrorMessage(null);

      // Subscribe to cloud updates in case updated elsewhere
      const unsubscribe = subscribeCustomLogo((cloudLogo) => {
        if (cloudLogo) {
          setCurrentLogo(cloudLogo);
        }
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap pilih file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 10MB.');
      return;
    }

    setErrorMessage(null);
    try {
      const optimized = await optimizeImageForLogo(file);
      setPreviewUrl(optimized);
    } catch (err: any) {
      setErrorMessage('Gagal memproses gambar: ' + (err?.message || 'Error'));
    }
  };

  const handleApplyUrl = async () => {
    if (!inputUrl.trim()) return;
    try {
      setErrorMessage(null);
      const optimized = await optimizeImageForLogo(inputUrl.trim());
      setPreviewUrl(optimized);
    } catch {
      setPreviewUrl(inputUrl.trim());
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveCustomLogo(previewUrl);
      setCurrentLogo(previewUrl);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage('Gagal menyinkronkan logo: ' + (err?.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    setIsSaving(true);
    try {
      await saveCustomLogo(null);
      setCurrentLogo(null);
      setPreviewUrl(null);
      setInputUrl('');
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Gagal mereset logo: ' + (err?.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadLogo = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = 'logo-milad-sidogiri.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <h3 className="font-extrabold text-base tracking-tight">Atur & Sinkronkan Logo Resmi</h3>
              <p className="text-xs text-emerald-300">Sinkron otomatis ke HP (PWA), Vercel & seluruh panitia</p>
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Cloud Synchronization Banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="text-xs leading-relaxed text-slate-700">
              <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                <span>Sinkronisasi Cloud Real-Time</span>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">Aktif</span>
              </span>
              Logo yang Anda unggah otomatis tersimpan di Cloud Database Firebase sehingga langsung tampil di HP yang terinstall, deployment Vercel, dan seluruh perangkat panitia tanpa perlu instal ulang.
            </div>
          </div>

          {/* Status Message */}
          {saveSuccess && (
            <div className="bg-emerald-600 text-white p-3.5 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-pulse shadow-md">
              <Check className="w-4 h-4 shrink-0" />
              <span>Logo berhasil disimpan & disinkronkan ke Cloud (HP & Vercel)!</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-center space-x-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2.5">
            <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pratinjau Logo</span>
            </div>

            <div className="flex items-center justify-center py-1">
              <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200 inline-flex items-center justify-center min-w-[130px] min-h-[130px]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Pratinjau Logo"
                    className="max-h-24 max-w-24 object-contain"
                  />
                ) : (
                  <MiladLogo size="xl" className="w-20 h-20" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium">
              <span>{previewUrl ? '✨ Logo Kustom Dipilih' : '🛡️ Logo Vektor Standar'}</span>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleDownloadLogo}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer underline"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Gambar</span>
                </button>
              )}
            </div>
          </div>

          {/* Upload Option 1: File Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Opsi 1: Upload File Gambar Logo Asli (PNG Transparan / JPG / SVG)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-emerald-600/40 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Pilih Gambar dari Galeri HP / Komputer</span>
            </button>
          </div>

          {/* Upload Option 2: Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Opsi 2: Tempel Link / URL Gambar Langsung
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://contoh.com/logo-milad.png"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Gunakan URL
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={(!previewUrl && !currentLogo) || isSaving}
            className="px-3.5 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset ke Default</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#005a2b] hover:bg-[#004220] text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Cloud...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan & Sinkronkan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
