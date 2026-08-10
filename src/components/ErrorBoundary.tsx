import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleResetSession = () => {
    try {
      localStorage.removeItem('sie_user_session');
      sessionStorage.removeItem('sie_user_session');
    } catch (e) {
      console.warn('Failed to clear session on reset:', e);
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Aplikasi Mengalami Penyesuaian Latar Belakang
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sistem mendeteksi jeda proses saat ponsel berpindah aplikasi atau tidak aktif. Klik tombol di bawah untuk memuat ulang status aplikasi secara normal.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950/60 rounded-xl p-3 text-left border border-slate-800">
                <p className="text-[11px] font-mono text-rose-300 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-[#005a2b] hover:bg-[#004220] text-amber-300 font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer border border-emerald-600/30"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>Muat Ulang Aplikasi (Refresh)</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetSession}
                className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer border border-slate-600"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Sesi & Masuk Kembali</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-medium">
              Panitia Sie Penganugerahan • Sidogiri 2026
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
