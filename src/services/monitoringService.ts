import * as Sentry from '@sentry/react';

export interface MonitoringErrorEvent {
  id: string;
  type: 'unhandled_rejection' | 'react_render_error' | 'uncaught_exception' | 'api_error' | 'custom';
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  severity: 'fatal' | 'error' | 'warning' | 'info';
  handled: boolean;
  sentryEventId?: string;
  url: string;
  metadata?: {
    userAgent?: string;
    screenResolution?: string;
    viewport?: string;
    networkStatus?: 'online' | 'offline';
    currentScreen?: string;
    memory?: {
      usedMB?: number;
      totalMB?: number;
      limitMB?: number;
    };
    [key: string]: any;
  };
}

export interface PerformanceMetricRecord {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  unit: string;
  timestamp: number;
}

export interface ApiLatencyRecord {
  id: string;
  url: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

export interface MonitoringStats {
  totalErrors: number;
  unhandledRejections: number;
  reactRenderErrors: number;
  handledErrors: number;
  lastIncidentTimestamp: number | null;
  coreWebVitals: {
    fcp?: PerformanceMetricRecord;
    lcp?: PerformanceMetricRecord;
    cls?: PerformanceMetricRecord;
    inp?: PerformanceMetricRecord;
    ttfb?: PerformanceMetricRecord;
  };
  apiMetrics: {
    count: number;
    avgDurationMs: number;
    recentLatencies: ApiLatencyRecord[];
  };
  sentryConnected: boolean;
  dsnConfigured: boolean;
  environment: string;
  release: string;
}

// In-memory ring buffer for the monitoring dashboard
const MAX_RECORDED_ERRORS = 100;
const MAX_API_LATENCIES = 50;

let recordedErrors: MonitoringErrorEvent[] = [];
let recordedApiLatencies: ApiLatencyRecord[] = [];
let webVitals: MonitoringStats['coreWebVitals'] = {};
let isInitialized = false;
let isSentryActive = false;
let activeScreenName = 'landing';

const listeners = new Set<(stats: MonitoringStats, newError?: MonitoringErrorEvent) => void>();

function notifySubscribers(newError?: MonitoringErrorEvent) {
  const stats = getMonitoringStats();
  listeners.forEach((listener) => {
    try {
      listener(stats, newError);
    } catch (err) {
      console.error('[Monitoring] Error in subscriber listener:', err);
    }
  });
}

/**
 * Get device & runtime diagnostic metadata
 */
function getSystemMetadata() {
  const meta: Record<string, any> = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    networkStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    screenResolution: typeof window !== 'undefined' ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : 'Unknown',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown',
    currentScreen: activeScreenName,
  };

  const perf = typeof window !== 'undefined' ? (window.performance as any) : null;
  if (perf?.memory) {
    meta.memory = {
      usedMB: Math.round(perf.memory.usedJSHeapSize / (1024 * 1024) * 10) / 10,
      totalMB: Math.round(perf.memory.totalJSHeapSize / (1024 * 1024) * 10) / 10,
      limitMB: Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024) * 10) / 10,
    };
  }

  return meta;
}

/**
 * Send an event to the backend monitoring telemetry collector
 */
async function sendToBackendMonitoring(event: MonitoringErrorEvent | { metric: PerformanceMetricRecord }) {
  try {
    if (typeof window === 'undefined') return;
    await fetch('/api/monitoring/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {
      // Fail silently to avoid recursion
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Record an error into the internal dashboard ring buffer
 */
function recordError(event: MonitoringErrorEvent) {
  // Check for duplicate recent errors within 1 second to avoid storming
  const recentDuplicate = recordedErrors.find(
    (e) => e.message === event.message && Math.abs(e.timestamp - event.timestamp) < 1000
  );
  if (recentDuplicate) return;

  recordedErrors.unshift(event);
  if (recordedErrors.length > MAX_RECORDED_ERRORS) {
    recordedErrors.pop();
  }

  // Persist last 20 to sessionStorage for reload survival
  try {
    sessionStorage.setItem('kd_monitoring_errors', JSON.stringify(recordedErrors.slice(0, 20)));
  } catch {
    // Ignore quota issues
  }

  // Fire to backend collector
  sendToBackendMonitoring(event);

  // Notify UI listeners
  notifySubscribers(event);
}

/**
 * Rate Core Web Vitals based on Google Web Vitals thresholds
 */
function rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'INP':
    case 'FID':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    default:
      return 'good';
  }
}

/**
 * Initialize Sentry and Global Performance & Error Listeners
 */
export function initMonitoring() {
  if (isInitialized) return;
  isInitialized = true;

  // Restore existing session errors if any
  try {
    const saved = sessionStorage.getItem('kd_monitoring_errors');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        recordedErrors = parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN || '';
  const environment = (import.meta as any).env?.MODE || 'production';
  const release = 'krishi-drishti@1.0.0';

  if (dsn) {
    try {
      Sentry.init({
        dsn,
        environment,
        release,
        integrations: [
          Sentry.browserTracingIntegration(),
        ],
        // Set tracesSampleRate: 1.0 in development / 0.2 in production
        tracesSampleRate: environment === 'development' ? 1.0 : 0.2,
        // Sanitize sensitive information before sending
        beforeSend(event) {
          if (event.request?.headers) {
            delete event.request.headers['Authorization'];
            delete event.request.headers['authorization'];
          }
          if (event.user) {
            delete (event.user as any).phone;
          }
          return event;
        },
      });
      isSentryActive = true;
      console.log('[Sentry] Global Error Tracking & Performance Monitoring initialized with DSN:', dsn.slice(0, 18) + '...');
    } catch (e) {
      console.warn('[Sentry] Failed to initialize Sentry with provided DSN, falling back to local monitoring:', e);
      isSentryActive = false;
    }
  } else {
    console.info('[Monitoring] No VITE_SENTRY_DSN specified in environment. Operating in high-reliability Local Diagnostics & Telemetry mode.');
  }

  // Set default tags
  try {
    Sentry.setTag('app_name', 'Krishi-Drishti');
    Sentry.setTag('runtime', 'browser_pwa');
  } catch {}

  // 1. CATCH UNCAUGHT PROMISE REJECTIONS
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      // Prevent browser console from surfacing as uncaught fatal app crash
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      const reason = event.reason;
      let message = 'Unhandled Promise Rejection';
      let stack: string | undefined;
      let name = 'UnhandledRejection';

      if (reason instanceof Error) {
        message = reason.message || 'Error with no message';
        stack = reason.stack;
        name = reason.name || 'Error';
      } else if (typeof reason === 'string' && reason.trim()) {
        message = reason;
      } else if (reason && typeof reason === 'object') {
        try {
          message = reason.message || JSON.stringify(reason);
        } catch {
          message = String(reason);
        }
      } else if (reason === undefined || reason === null) {
        message = 'Promise rejected without explicit reason';
      }

      // Ignore silent aborts or benign cancellations
      if (
        message.includes('AbortError') ||
        message.includes('aborted') ||
        message.includes('ResizeObserver')
      ) {
        return;
      }

      console.warn('[Monitoring] Gracefully trapped promise rejection:', message);

      let sentryEventId: string | undefined;
      if (isSentryActive) {
        try {
          const errorObj = reason instanceof Error ? reason : new Error(message);
          sentryEventId = Sentry.captureException(errorObj, {
            level: 'error',
            tags: {
              mechanism: 'unhandledrejection',
              handled: 'false',
              screen: activeScreenName,
            },
            extra: {
              rawReason: reason,
              systemMetadata: getSystemMetadata(),
            },
          });
        } catch (sentryErr) {
          console.error('[Monitoring] Failed to forward rejection to Sentry:', sentryErr);
        }
      }

      // Record to dashboard
      const errorEvent: MonitoringErrorEvent = {
        id: `rej_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'unhandled_rejection',
        name,
        message,
        stack,
        timestamp: Date.now(),
        severity: 'error',
        handled: false,
        sentryEventId,
        url: window.location.href,
        metadata: getSystemMetadata(),
      };

      recordError(errorEvent);
    });

    // 2. CATCH UNCAUGHT RUNTIME WINDOW ERRORS
    window.addEventListener('error', (event: ErrorEvent) => {
      // Don't intercept benign resource load errors or resize observer alerts
      if (event.message?.includes('ResizeObserver') || !event.error) return;

      console.error('[Monitoring] Caught global window error:', event.error);

      let sentryEventId: string | undefined;
      if (isSentryActive) {
        try {
          sentryEventId = Sentry.captureException(event.error, {
            level: 'fatal',
            tags: {
              mechanism: 'window.onerror',
              handled: 'false',
              screen: activeScreenName,
            },
            extra: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
              systemMetadata: getSystemMetadata(),
            },
          });
        } catch (sentryErr) {
          console.error('[Monitoring] Sentry error reporting failed:', sentryErr);
        }
      }

      const errorEvent: MonitoringErrorEvent = {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'uncaught_exception',
        name: event.error?.name || 'UncaughtError',
        message: event.error?.message || event.message || 'Unknown runtime error',
        stack: event.error?.stack,
        timestamp: Date.now(),
        severity: 'fatal',
        handled: false,
        sentryEventId,
        url: window.location.href,
        metadata: {
          ...getSystemMetadata(),
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      };

      recordError(errorEvent);
    });

    // 3. PERFORMANCE & CORE WEB VITALS MONITORING
    setupPerformanceObservers();
  }
}

/**
 * Setup Browser Performance & Core Web Vitals Observers
 */
function setupPerformanceObservers() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    // Navigation timing (TTFB)
    const navObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        const nav = entry as PerformanceNavigationTiming;
        if (nav.responseStart && nav.requestStart) {
          const ttfb = Math.round(nav.responseStart - nav.requestStart);
          webVitals.ttfb = {
            name: 'TTFB',
            value: ttfb,
            rating: rateMetric('TTFB', ttfb),
            unit: 'ms',
            timestamp: Date.now(),
          };
          notifySubscribers();
        }
      }
    });
    navObserver.observe({ type: 'navigation', buffered: true });
  } catch {}

  try {
    // FCP (First Contentful Paint)
    const paintObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const fcp = Math.round(entry.startTime);
          webVitals.fcp = {
            name: 'FCP',
            value: fcp,
            rating: rateMetric('FCP', fcp),
            unit: 'ms',
            timestamp: Date.now(),
          };
          notifySubscribers();
        }
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });
  } catch {}

  try {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        const lcp = Math.round(lastEntry.startTime);
        webVitals.lcp = {
          name: 'LCP',
          value: lcp,
          rating: rateMetric('LCP', lcp),
          unit: 'ms',
          timestamp: Date.now(),
        };
        notifySubscribers();
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}

  try {
    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value || 0;
          webVitals.cls = {
            name: 'CLS',
            value: Math.round(clsValue * 1000) / 1000,
            rating: rateMetric('CLS', clsValue),
            unit: '',
            timestamp: Date.now(),
          };
          notifySubscribers();
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {}

  try {
    // FID / INP
    const inpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const duration = Math.round(entry.duration);
        if (duration > 0) {
          webVitals.inp = {
            name: 'INP',
            value: duration,
            rating: rateMetric('INP', duration),
            unit: 'ms',
            timestamp: Date.now(),
          };
          notifySubscribers();
        }
      }
    });
    inpObserver.observe({ type: 'first-input', buffered: true });
  } catch {}
}

/**
 * Capture React render errors caught by React Error Boundary
 */
export function captureReactRenderError(error: Error, errorInfo: { componentStack?: string | null }) {
  console.error('[Monitoring] Caught React render error:', error, errorInfo);

  let sentryEventId: string | undefined;
  if (isSentryActive) {
    try {
      sentryEventId = Sentry.captureException(error, {
        level: 'fatal',
        tags: {
          mechanism: 'react_error_boundary',
          handled: 'false',
          screen: activeScreenName,
        },
        extra: {
          componentStack: errorInfo?.componentStack,
          systemMetadata: getSystemMetadata(),
        },
      });
    } catch (sentryErr) {
      console.error('[Monitoring] Sentry React capture failed:', sentryErr);
    }
  }

  const errorEvent: MonitoringErrorEvent = {
    id: `react_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: 'react_render_error',
    name: error.name || 'ReactRenderError',
    message: error.message || 'React component render crash',
    stack: error.stack,
    componentStack: errorInfo?.componentStack || undefined,
    timestamp: Date.now(),
    severity: 'fatal',
    handled: false,
    sentryEventId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    metadata: {
      ...getSystemMetadata(),
      componentCrashPoint: errorInfo?.componentStack?.split('\n')?.[1]?.trim(),
    },
  };

  recordError(errorEvent);
  return errorEvent;
}

/**
 * Manually capture handled exceptions
 */
export function captureException(error: unknown, context?: Record<string, any>): string | undefined {
  const errObj = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
  console.warn('[Monitoring] Manual exception captured:', errObj, context);

  let sentryEventId: string | undefined;
  if (isSentryActive) {
    try {
      sentryEventId = Sentry.captureException(errObj, {
        level: 'error',
        tags: {
          mechanism: 'manual_capture',
          screen: activeScreenName,
          ...(context?.tags || {}),
        },
        extra: {
          ...context,
          systemMetadata: getSystemMetadata(),
        },
      });
    } catch {}
  }

  const errorEvent: MonitoringErrorEvent = {
    id: `man_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: 'custom',
    name: errObj.name,
    message: errObj.message,
    stack: errObj.stack,
    timestamp: Date.now(),
    severity: (context?.level as any) || 'error',
    handled: true,
    sentryEventId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    metadata: {
      ...getSystemMetadata(),
      ...(context || {}),
    },
  };

  recordError(errorEvent);
  return sentryEventId;
}

/**
 * Record an API latency measurement
 */
export function recordApiLatency(record: { url: string; method: string; status: number; durationMs: number }) {
  const item: ApiLatencyRecord = {
    id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    url: record.url,
    method: record.method,
    status: record.status,
    durationMs: Math.round(record.durationMs),
    timestamp: Date.now(),
  };

  recordedApiLatencies.unshift(item);
  if (recordedApiLatencies.length > MAX_API_LATENCIES) {
    recordedApiLatencies.pop();
  }

  // Add Sentry breadcrumb
  if (isSentryActive) {
    try {
      Sentry.addBreadcrumb({
        category: 'http',
        message: `${record.method.toUpperCase()} ${record.url} [${record.status}] in ${record.durationMs}ms`,
        level: record.status >= 400 ? 'error' : 'info',
        data: { status_code: record.status, duration_ms: record.durationMs },
      });
    } catch {}
  }

  // If HTTP error (5xx or 4xx network error), capture
  if (record.status >= 500) {
    captureException(new Error(`API Error ${record.status} on ${record.method} ${record.url}`), {
      type: 'api_error',
      status: record.status,
      url: record.url,
      method: record.method,
      durationMs: record.durationMs,
    });
  }

  notifySubscribers();
}

/**
 * Set active screen for telemetry breadcrumbs
 */
export function setActiveScreenTelemetry(screenName: string) {
  activeScreenName = screenName;
  if (isSentryActive) {
    try {
      Sentry.setTag('active_screen', screenName);
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to screen: ${screenName}`,
        level: 'info',
      });
    } catch {}
  }
}

/**
 * Set user context in Sentry
 */
export function setMonitoringUser(user: { id?: string; name?: string; district?: string }) {
  if (isSentryActive) {
    try {
      Sentry.setUser({
        id: user.id || user.name || 'anonymous_farmer',
        username: user.name,
      });
      if (user.district) Sentry.setTag('farmer_district', user.district);
    } catch {}
  }
}

/**
 * Get aggregated statistics for the monitoring dashboard
 */
export function getMonitoringStats(): MonitoringStats {
  const avgDuration =
    recordedApiLatencies.length > 0
      ? Math.round(
          recordedApiLatencies.reduce((acc, curr) => acc + curr.durationMs, 0) / recordedApiLatencies.length
        )
      : 0;

  return {
    totalErrors: recordedErrors.length,
    unhandledRejections: recordedErrors.filter((e) => e.type === 'unhandled_rejection').length,
    reactRenderErrors: recordedErrors.filter((e) => e.type === 'react_render_error').length,
    handledErrors: recordedErrors.filter((e) => e.handled).length,
    lastIncidentTimestamp: recordedErrors[0]?.timestamp || null,
    coreWebVitals: { ...webVitals },
    apiMetrics: {
      count: recordedApiLatencies.length,
      avgDurationMs: avgDuration,
      recentLatencies: [...recordedApiLatencies],
    },
    sentryConnected: isSentryActive,
    dsnConfigured: Boolean((import.meta as any).env?.VITE_SENTRY_DSN),
    environment: (import.meta as any).env?.MODE || 'production',
    release: 'krishi-drishti@1.0.0',
  };
}

/**
 * Get all captured error events
 */
export function getRecordedErrors(): MonitoringErrorEvent[] {
  return [...recordedErrors];
}

/**
 * Subscribe to live monitoring updates
 */
export function subscribeToMonitoring(callback: (stats: MonitoringStats, newError?: MonitoringErrorEvent) => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Clear captured error logs
 */
export async function clearRecordedErrors() {
  recordedErrors = [];
  try {
    sessionStorage.removeItem('kd_monitoring_errors');
    await fetch('/api/monitoring/events', { method: 'DELETE' }).catch(() => {});
  } catch {}
  notifySubscribers();
}

/**
 * Diagnostic test tools for verifying Sentry & dashboard pipelines
 */
export function triggerTestPromiseRejection() {
  console.log('[Monitoring] Triggering synthetic Unhandled Promise Rejection for verification...');
  Promise.reject(
    new Error(`[Diagnostic Test] Simulated Unhandled Rejection at ${new Date().toLocaleTimeString()} - Verification OK`)
  );
}

export function triggerTestException() {
  console.log('[Monitoring] Triggering synthetic Sentry exception for verification...');
  captureException(
    new Error(`[Diagnostic Test] Simulated Runtime Exception at ${new Date().toLocaleTimeString()} - Sentry Verified`),
    { severity: 'warning', testTrigger: true }
  );
}
