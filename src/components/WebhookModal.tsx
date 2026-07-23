import React, { useState, useEffect } from 'react';
import { X, Link2, CheckCircle2, FileSpreadsheet, Copy, Send, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import {
  getWebhookUrl,
  saveWebhookUrl,
  sendWebhookPayload,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from '../services/webhookService';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(getWebhookUrl());
      setTestResult(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    await saveWebhookUrl(url);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestWebhook = async () => {
    setIsTesting(true);
    setTestResult(null);
    await saveWebhookUrl(url);

    const res = await sendWebhookPayload('bulk_export', {
      type: 'TEST_PING',
      message: 'Uji koneksi Webhook Aplikasi Sie Penganugerahan berhasil!',
      timestamp: new Date().toLocaleString('id-ID'),
    });

    setTestResult(res);
    setIsTesting(false);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Integrasi Webhook Google Sheets</h2>
              <p className="text-xs text-emerald-100">Sinkronkan data otomatis ke spreadsheet tanpa reload</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-2xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          <div>
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Google Apps Script Webhook URL *</span>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'Sembunyikan Panduan' : 'Cara Membuat Apps Script'}</span>
              </button>
            </label>

            <div className="relative flex items-center">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
              <button
                onClick={handleSave}
                className="absolute right-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                {isSaved ? 'Tersimpan!' : 'Simpan'}
              </button>
            </div>
          </div>

          {/* Testing Status */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start space-x-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-extrabold">{testResult.success ? 'Koneksi Berhasil!' : 'Perhatian Webhook'}</p>
                <p className="text-[11px] mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Expandable Setup Guide */}
          {showGuide && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Panduan Langkah Mudah (3 Menit):</span>
                </h4>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center space-x-1 text-[11px] bg-slate-200 hover:bg-slate-300 px-2.5 py-1 rounded-xl font-bold transition text-slate-800 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedScript ? 'Tersalin!' : 'Salin Kode Script'}</span>
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                <li>Buka Google Sheets milik Anda di browser.</li>
                <li>Pilih menu <b>Ekstensi (Extensions)</b> &rarr; <b>Apps Script</b>.</li>
                <li>Hapus seluruh isi kode lama, lalu klik tombol <b>Salin Kode Script</b> di atas dan tempel di editor.</li>
                <li>Klik tombol <b>Terapkan (Deploy)</b> di pojok kanan atas &rarr; pilih <b>Pengenerapan baru (New deployment)</b>.</li>
                <li>Pilih jenis <b>Aplikasi web (Web app)</b>. Ubah <b>Siapa yang memiliki akses (Who has access)</b> menjadi <b>Siapa saja (Anyone)</b>.</li>
                <li>Klik <b>Terapkan (Deploy)</b>, lalu salin <b>URL Aplikasi Web</b> dan tempelkan pada kolom di atas!</li>
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleTestWebhook}
              disabled={isTesting || !url}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTesting ? 'Menguji...' : 'Uji Kirim Tes Data'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
