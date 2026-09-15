import React, { Component, ReactNode, ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Activity, Copy, Check, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { captureReactRenderError, MonitoringErrorEvent } from '../src/services/monitoringService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  onReset?: () => void;
  onNavigateToMonitoring?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  capturedEvent: MonitoringErrorEvent | null;
  isDetailsOpen: boolean;
  copied: boolean;
}

export class SentryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  declare setState: (state: Partial<ErrorBoundaryState> | ((prevState: ErrorBoundaryState) => Partial<ErrorBoundaryState>), callback?: () => void) => void;
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    capturedEvent: null,
    isDetailsOpen: false,
    copied: false,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const capturedEvent = captureReactRenderError(error, errorInfo);
    this.setState({ errorInfo, capturedEvent });
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      capturedEvent: null,
      isDetailsOpen: false,
      copied: false,
    });
  };

  handleCopyDiagnostics = () => {
    const { error, errorInfo, capturedEvent } = this.state;
    const diagnosticReport = {
      incidentId: capturedEvent?.id || 'unknown',
      timestamp: new Date().toISOString(),
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    navigator.clipboard?.writeText(JSON.stringify(diagnosticReport, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  render() {
    if (this.state.hasError) {
      const incidentId = this.state.capturedEvent?.id || 'ERR-' + Math.random().toString(36).substr(2, 6).toUpperCase();

      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 select-text">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden"
          >
            {/* Header Ribbon */}
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Sentry Production Guard
              </div>
              <span className="text-[11px] font-mono font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                {incidentId}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {/* Icon & Title */}
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5 shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                {this.props.fallbackTitle || 'Component Render Failure Intercepted'}
              </h1>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {this.props.fallbackSubtitle ||
                  'An unexpected render exception was caught. The crash trace and system telemetry have been captured and forwarded to Sentry for diagnosis.'}
              </p>

              {/* Error Message Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-700 mb-6 overflow-hidden">
                <div className="font-semibold text-rose-700 mb-1">
                  {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown render error'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Target: {this.state.errorInfo?.componentStack?.split('\n')?.[1]?.trim() || 'React Fiber Node'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try to Recover
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                >
                  <Home className="w-4 h-4" />
                  Reload App
                </button>
              </div>

              {/* Technical Diagnostics Accordion */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => this.setState((prev) => ({ isDetailsOpen: !prev.isDetailsOpen }))}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <span>Diagnostic Details &amp; Component Stack</span>
                    {this.state.isDetailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={this.handleCopyDiagnostics}
                    className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors"
                  >
                    {this.state.copied ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {this.state.isDetailsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono max-h-48 overflow-auto leading-relaxed whitespace-pre-wrap select-all">
                        {this.state.error?.stack || this.state.error?.toString()}
                        {'\n\n--- React Component Hierarchy ---\n'}
                        {this.state.errorInfo?.componentStack || 'No component stack available'}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Link to Monitoring Dashboard */}
              {this.props.onNavigateToMonitoring && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={this.props.onNavigateToMonitoring}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                  >
                    <Activity size={13} />
                    Inspect in Sentry Monitoring Dashboard &rarr;
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
