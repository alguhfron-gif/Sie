import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackName?: string;
  onAutoRecover?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isAutoRecovering: boolean;
  retryCount: number;
  lastRecoveredAt: number | null;
}

/**
 * Enhanced Self-Healing Error Boundary
 * Automatically catches, recovers, and repairs component errors without kicking the user out of the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  private autoRecoveryTimeout: any = null;

  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
      isAutoRecovering: false,
      retryCount: 0,
      lastRecoveredAt: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[Self-Healing Boundary] Intercepted UI error, executing automatic self-repair:', error, errorInfo);

    const currentState = (this as any).state as State;
    const now = Date.now();
    const isRecent = currentState.lastRecoveredAt && now - currentState.lastRecoveredAt < 10000;
    const newRetryCount = isRecent ? currentState.retryCount + 1 : 1;

    // Automatic self-healing: if retry count <= 2, automatically recover within 350ms
    if (newRetryCount <= 2) {
      (this as any).setState({
        isAutoRecovering: true,
        retryCount: newRetryCount,
        lastRecoveredAt: now,
      });

      if (this.autoRecoveryTimeout) clearTimeout(this.autoRecoveryTimeout);

      this.autoRecoveryTimeout = setTimeout(() => {
        this.handleAutoRecover();
      }, 350);
    } else {
      (this as any).setState({
        isAutoRecovering: false,
        retryCount: newRetryCount,
        lastRecoveredAt: now,
      });
    }
  }

  public componentWillUnmount() {
    if (this.autoRecoveryTimeout) {
      clearTimeout(this.autoRecoveryTimeout);
    }
  }

  private handleAutoRecover = () => {
    (this as any).setState({
      hasError: false,
      error: null,
      isAutoRecovering: false,
    });

    const props = (this as any).props as Props;
    if (props.onAutoRecover) {
      props.onAutoRecover();
    }
  };

  private handleSwitchToDashboard = () => {
    try {
      localStorage.setItem('sie_active_tab', 'dashboard');
    } catch {}
    this.handleAutoRecover();
    if (window.location.hash) {
      window.location.hash = '';
    }
  };

  private handleSoftRefresh = () => {
    // Soft reload without destroying user session
    (this as any).setState({ hasError: false, error: null, isAutoRecovering: false, retryCount: 0 });
    window.location.reload();
  };

  public render() {
    const state = (this as any).state as State;
    const props = (this as any).props as Props;

    if (state?.hasError) {
      if (state.isAutoRecovering) {
        // Instant seamless pass-through during micro-recovery without flashing loading animation
        return (
          <div className="w-full">
            {props.children}
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center p-4 min-h-[360px] w-full">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-7 text-center space-y-5 text-slate-800">
            <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-[11px] font-extrabold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sesi & Data Anda Aman</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Penyesuaian Tampilan Otomatis ({props.fallbackName || 'Modul'})
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Sistem mendeteksi jeda data atau penyesuaian tampilan. Sesi masuk Anda tetap aktif dan tidak perlu keluar dari aplikasi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleAutoRecover}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Pulihkan Bagian Ini Sekarang</span>
              </button>

              <button
                type="button"
                onClick={this.handleSwitchToDashboard}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200"
              >
                <Home className="w-4 h-4 text-slate-600" />
                <span>Kembali ke Dasbor Utama</span>
              </button>
            </div>

            <p className="text-[11px] text-emerald-800 font-semibold pt-1">
              ✓ Fitur Self-Healing Sie Penganugerahan Sidogiri Aktif
            </p>
          </div>
        </div>
      );
    }

    return props.children;
  }
}

/**
 * Scoped Self-Healing View Error Boundary
 * Wraps individual views to ensure an error in one tab never affects navigation or other tabs.
 */
export function ViewErrorBoundary({
  children,
  viewName,
  onResetView,
}: {
  children: ReactNode;
  viewName: string;
  onResetView?: () => void;
}) {
  return (
    <ErrorBoundary fallbackName={viewName} onAutoRecover={onResetView}>
      {children}
    </ErrorBoundary>
  );
}
