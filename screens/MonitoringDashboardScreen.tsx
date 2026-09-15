import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Globe,
  HardDrive,
  Info,
  Layers,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Wifi,
  Zap
} from 'lucide-react';
import {
  getMonitoringStats,
  getRecordedErrors,
  subscribeToMonitoring,
  clearRecordedErrors,
  triggerTestPromiseRejection,
  triggerTestException,
  MonitoringErrorEvent,
  MonitoringStats,
  PerformanceMetricRecord
} from '../src/services/monitoringService';

interface MonitoringDashboardScreenProps {
  onBack: () => void;
  t?: any;
}

export const MonitoringDashboardScreen: React.FC<MonitoringDashboardScreenProps> = ({ onBack }) => {
  const [stats, setStats] = useState<MonitoringStats>(getMonitoringStats());
  const [errors, setErrors] = useState<MonitoringErrorEvent[]>(getRecordedErrors());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unhandled_rejection' | 'react_render_error' | 'uncaught_exception' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incidents' | 'webvitals' | 'latencies' | 'diagnostics'>('incidents');
  const [testRenderCrash, setTestRenderCrash] = useState(false);

  // Subscribe to live monitoring updates
  useEffect(() => {
    const unsubscribe = subscribeToMonitoring((newStats) => {
      setStats(newStats);
      setErrors(getRecordedErrors());
    });
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setStats(getMonitoringStats());
    setErrors(getRecordedErrors());
  };

  const handleClear = async () => {
    if (window.confirm('Clear all recorded incidents and latency measurements?')) {
      await clearRecordedErrors();
      setErrors([]);
      setStats(getMonitoringStats());
    }
  };

  const handleCopy = (err: MonitoringErrorEvent) => {
    navigator.clipboard?.writeText(JSON.stringify(err, null, 2));
    setCopiedId(err.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      stats,
      errors,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishi-drishti-monitoring-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered error list
  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      const matchesFilter = selectedFilter === 'all' || err.type === selectedFilter;
      const matchesSearch =
        !searchQuery ||
        err.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        err.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (err.name && err.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [errors, selectedFilter, searchQuery]);

  // If synthetic crash is enabled, throw render error
  if (testRenderCrash) {
    throw new Error('Synthetic React Render Crash triggered from Monitoring Dashboard for ErrorBoundary validation!');
  }

  const getVitalsBadgeColor = (rating?: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'needs-improvement':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'poor':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      {/* Top Navbar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Return"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Reliability &amp; Performance
                </h1>
                {stats.sentryConnected ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sentry Active
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Local Diagnostic Guard
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Sentry Global Error Tracking • Promise Rejection Catchers • Core Web Vitals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors hidden sm:flex items-center gap-1.5"
            >
              <HardDrive size={13} />
              Export Logs
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Clear Event History"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* KPI Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Incidents */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Captured</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalErrors}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{stats.unhandledRejections} rejections</span>
              <span>•</span>
              <span>{stats.reactRenderErrors} crashes</span>
            </div>
          </div>

          {/* Promise Rejections */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unhandled Rejections</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.unhandledRejections}</div>
            <div className="text-[11px] text-slate-500 mt-1">Intercepted &amp; reported</div>
          </div>

          {/* React Render Crashes */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">React Crashes</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-indigo-600">{stats.reactRenderErrors}</div>
            <div className="text-[11px] text-slate-500 mt-1">Fiber boundaries guarded</div>
          </div>

          {/* Sentry Pipeline Status */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sentry Status</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity size={16} />
              </div>
            </div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              {stats.sentryConnected ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Configured</span>
                </>
              ) : (
                <>
                  <Info size={16} className="text-amber-500" />
                  <span>Local Mode</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              Release: {stats.release}
            </div>
          </div>
        </div>

        {/* Verification & Chaos Testing Playground */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Terminal size={17} className="text-emerald-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Interactive Pipeline Verification &amp; Chaos Simulator
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Trigger synthetic faults in real-time to observe Sentry capture, rejection trapping, and ErrorBoundary recovery.
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Stream
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Test 1: Uncaught Promise Rejection */}
            <button
              onClick={() => triggerTestPromiseRejection()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-colors active:scale-[0.98]"
            >
              <Flame size={14} className="text-amber-400" />
              Test Promise Rejection
            </button>

            {/* Test 2: React Render Crash */}
            <button
              onClick={() => setTestRenderCrash(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition-colors active:scale-[0.98]"
            >
              <AlertTriangle size={14} className="text-rose-400" />
              Test React Render Crash
            </button>

            {/* Test 3: Sentry Handled Exception */}
            <button
              onClick={() => triggerTestException()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 transition-colors active:scale-[0.98]"
            >
              <Zap size={14} className="text-indigo-400" />
              Test Handled Exception
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'incidents' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Live Incident Stream</span>
            {errors.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                {errors.length}
              </span>
            )}
            {activeTab === 'incidents' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('webvitals')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'webvitals' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Core Web Vitals</span>
            {activeTab === 'webvitals' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('latencies')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'latencies' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>API Latencies</span>
            {activeTab === 'latencies' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'diagnostics' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Environment &amp; Config</span>
            {activeTab === 'diagnostics' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        </div>

        {/* TAB 1: Incidents & Errors */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by message, stack trace, or error type..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="flex overflow-x-auto gap-1.5 pb-1">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'unhandled_rejection', label: 'Rejections' },
                  { id: 'react_render_error', label: 'React Crashes' },
                  { id: 'uncaught_exception', label: 'Exceptions' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedFilter(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedFilter === item.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Captured Events */}
            {filteredErrors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Zero Unresolved Incidents</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? 'No incidents matched your search filter.'
                    : 'The application runtime is clean. Use the simulator buttons above to test error interception.'}
                </p>
                <button
                  onClick={() => triggerTestPromiseRejection()}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                >
                  <Flame size={14} />
                  Trigger a test rejection to verify
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredErrors.map((err) => {
                  const isExpanded = expandedErrorId === err.id;

                  return (
                    <div
                      key={err.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
                    >
                      {/* Event Row Header */}
                      <div
                        onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                        className="p-4 cursor-pointer hover:bg-slate-50/60 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              err.type === 'react_render_error'
                                ? 'bg-rose-50 text-rose-600'
                                : err.type === 'unhandled_rejection'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {err.type === 'react_render_error' ? (
                              <Layers size={16} />
                            ) : err.type === 'unhandled_rejection' ? (
                              <Flame size={16} />
                            ) : (
                              <AlertTriangle size={16} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  err.type === 'react_render_error'
                                    ? 'bg-rose-100 text-rose-800'
                                    : err.type === 'unhandled_rejection'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {err.type.replace('_', ' ')}
                              </span>

                              <span className="text-[11px] text-slate-400 font-mono">
                                {new Date(err.timestamp).toLocaleTimeString()}
                              </span>

                              {err.sentryEventId && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                  Sentry: {err.sentryEventId.slice(0, 8)}...
                                </span>
                              )}
                            </div>

                            <div className="font-semibold text-sm text-slate-900 break-words">
                              {err.message}
                            </div>

                            {err.metadata?.currentScreen && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Screen: <span className="text-slate-600 font-medium">{err.metadata.currentScreen}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleCopy(err)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copy incident JSON"
                          >
                            {copiedId === err.id ? (
                              <CheckCircle2 size={15} className="text-emerald-600" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 p-4 bg-slate-50/70 space-y-3">
                          {err.stack && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Call Stack
                              </div>
                              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono max-h-48 overflow-auto whitespace-pre-wrap">
                                {err.stack}
                              </pre>
                            </div>
                          )}

                          {err.componentStack && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                React Component Tree Stack
                              </div>
                              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono max-h-48 overflow-auto whitespace-pre-wrap">
                                {err.componentStack}
                              </pre>
                            </div>
                          )}

                          {/* Metadata grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">URL</span>
                              <span className="font-mono text-slate-700 truncate block">{err.url}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Network</span>
                              <span className="font-semibold text-slate-700 block capitalize">
                                {err.metadata?.networkStatus || 'online'}
                              </span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Viewport</span>
                              <span className="font-mono text-slate-700 block">
                                {err.metadata?.viewport || 'Unknown'}
                              </span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Memory Heap</span>
                              <span className="font-mono text-slate-700 block">
                                {err.metadata?.memory ? `${err.metadata.memory.usedMB} MB used` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Core Web Vitals */}
        {activeTab === 'webvitals' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* LCP */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Largest Contentful Paint (LCP)
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getVitalsBadgeColor(
                      stats.coreWebVitals.lcp?.rating
                    )}`}
                  >
                    {stats.coreWebVitals.lcp?.rating || 'Measuring'}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {stats.coreWebVitals.lcp ? `${stats.coreWebVitals.lcp.value} ms` : 'Pending...'}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Target: &le; 2.5s for fast page visual readiness.
                </p>
              </div>

              {/* FCP */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    First Contentful Paint (FCP)
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getVitalsBadgeColor(
                      stats.coreWebVitals.fcp?.rating
                    )}`}
                  >
                    {stats.coreWebVitals.fcp?.rating || 'Measuring'}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {stats.coreWebVitals.fcp ? `${stats.coreWebVitals.fcp.value} ms` : 'Pending...'}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Target: &le; 1.8s for initial canvas perception.
                </p>
              </div>

              {/* TTFB */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Time to First Byte (TTFB)
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getVitalsBadgeColor(
                      stats.coreWebVitals.ttfb?.rating
                    )}`}
                  >
                    {stats.coreWebVitals.ttfb?.rating || 'Measuring'}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {stats.coreWebVitals.ttfb ? `${stats.coreWebVitals.ttfb.value} ms` : 'Pending...'}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Target: &le; 0.8s server responsiveness.
                </p>
              </div>
            </div>

            {/* Performance Advice */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                Performance Optimization Status
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>React 19 code-splitting active for secondary agritech modules (reduces initial bundle size)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Defensive null-check validation deployed across all map, marketplace, and weather screens</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Automated PerformanceObserver tracking real-world field device latencies</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: API Latencies */}
        {activeTab === 'latencies' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average API Latency</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {stats.apiMetrics.avgDurationMs ? `${stats.apiMetrics.avgDurationMs} ms` : 'No calls recorded'}
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {stats.apiMetrics.count} monitored requests
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-500">
                Recent Network Operations
              </div>

              {stats.apiMetrics.recentLatencies.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No network transactions recorded yet in this session.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.apiMetrics.recentLatencies.map((call) => (
                    <div key={call.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                            call.method === 'GET'
                              ? 'bg-blue-50 text-blue-700'
                              : call.method === 'POST'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {call.method}
                        </span>
                        <span className="font-mono text-slate-700 truncate max-w-xs sm:max-w-md">{call.url}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-bold font-mono text-[11px] ${
                            call.status >= 400 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {call.status}
                        </span>
                        <span className="font-mono text-slate-500 w-16 text-right">{call.durationMs} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Environment & Sentry Config */}
        {activeTab === 'diagnostics' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Monitoring Configuration</h3>
              <p className="text-xs text-slate-500">
                Review the current runtime environment variables and telemetry dispatch routes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">Sentry DSN Variable</span>
                <div className="font-mono text-slate-800 break-all font-semibold">
                  {stats.dsnConfigured ? 'Configured in VITE_SENTRY_DSN' : 'Not configured (Local Fallback Active)'}
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  To connect your remote Sentry cloud project, set <code className="bg-slate-200 px-1 rounded">VITE_SENTRY_DSN</code> in your environment settings.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">Deployment Environment</span>
                <div className="font-mono text-slate-800 font-semibold">{stats.environment}</div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Release tag: <span className="font-mono">{stats.release}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">Local Diagnostic Collector</span>
                <div className="font-mono text-emerald-700 font-semibold">/api/monitoring/events</div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Aggregates all uncaught promise rejections and React render crashes to server memory.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">Performance Tracing</span>
                <div className="font-mono text-slate-800 font-semibold">BrowserTracing Integration Enabled</div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Traces Sample Rate: {stats.environment === 'development' ? '100% (1.0)' : '20% (0.2)'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboardScreen;
