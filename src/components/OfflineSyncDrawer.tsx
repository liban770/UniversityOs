import React, { useEffect } from 'react';
import {
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  HardDrive,
} from 'lucide-react';
import {
  OfflineCacheStats,
  OfflineMutation,
} from '../services/offlineCache';

interface OfflineSyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  simulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  stats: OfflineCacheStats;
  mutations: OfflineMutation[];
  onSyncNow: () => void;
  onClearCache: () => void;
  onNavigateScreen: (screenId: string) => void;
}

export const OfflineSyncDrawer: React.FC<OfflineSyncDrawerProps> = ({
  isOpen,
  onClose,
  isOnline,
  simulatedOffline,
  onToggleSimulatedOffline,
  stats,
  mutations,
  onSyncNow,
  onClearCache,
  onNavigateScreen,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-surface-container-lowest text-on-surface h-full shadow-2xl border-l border-surface-variant flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-surface-variant flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isOnline
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isOnline ? (
                  <Database className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <WifiOff className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <div>
                <h2 id="offline-drawer-title" className="text-base font-semibold text-on-surface">
                  Offline Data Cache & Sync Engine
                </h2>
                <p className="text-xs text-on-surface-variant">
                  IndexedDB + Service Worker Persistent Storage
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close offline cache drawer"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Connectivity Status & Simulation Switch */}
            <div className="p-4 rounded-xl border border-surface-variant bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-semibold text-on-surface">
                    {isOnline
                      ? 'Connected — Real-Time Institutional Sync'
                      : 'Offline Mode Active — Serving Local Cache'}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {isOnline
                      ? 'All 22 SIS modules are cached locally. Edits sync immediately.'
                      : 'Edits to grades, attendance, and records are queued locally in IndexedDB.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={simulatedOffline}
                onClick={onToggleSimulatedOffline}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  simulatedOffline
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-surface-container-highest text-on-surface hover:bg-surface-variant'
                }`}
              >
                {simulatedOffline ? 'Exit Offline Simulation' : 'Simulate Offline Mode'}
              </button>
            </div>

            {/* Cache Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-surface-variant bg-surface-container-lowest">
                <div className="text-xs text-on-surface-variant flex items-center justify-between">
                  <span>Cached Modules</span>
                  <HardDrive className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-on-surface mt-1">
                  {stats.cachedScreensCount} / {stats.totalScreensCount}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  100% Offline Ready
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-variant bg-surface-container-lowest">
                <div className="text-xs text-on-surface-variant flex items-center justify-between">
                  <span>Local Footprint</span>
                  <Database className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-on-surface mt-1">
                  {stats.cacheSizeKB.toLocaleString()} KB
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  IndexedDB + Workbox
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-variant bg-surface-container-lowest col-span-2 sm:col-span-1">
                <div className="text-xs text-on-surface-variant flex items-center justify-between">
                  <span>Pending Queue</span>
                  <Clock className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-on-surface mt-1">
                  {stats.pendingMutationsCount}
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  {stats.syncedMutationsCount} synced total
                </div>
              </div>
            </div>

            {/* Offline Mutation Queue & Sync Log */}
            <section aria-labelledby="mutation-queue-heading">
              <div className="flex items-center justify-between mb-3">
                <h3
                  id="mutation-queue-heading"
                  className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Local Mutation Queue & Sync Ledger ({mutations.length})
                </h3>
                {stats.pendingMutationsCount > 0 && (
                  <button
                    type="button"
                    onClick={onSyncNow}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync {stats.pendingMutationsCount} Pending Now</span>
                  </button>
                )}
              </div>

              {mutations.length === 0 ? (
                <div className="p-6 rounded-xl border border-surface-variant bg-surface-container-low text-center space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <div className="text-sm font-semibold text-on-surface">
                    All Institutional Records Synchronized
                  </div>
                  <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                    Any edits you make to grades, attendance rosters, permissions, or course registrations are automatically cached here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {mutations.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-surface-variant bg-surface-container-low flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                              m.synced
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {m.synced ? 'Synced' : 'Queued Offline'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateScreen(m.screenId);
                              onClose();
                            }}
                            className="text-xs font-semibold text-on-surface hover:text-secondary truncate cursor-pointer"
                          >
                            {m.screenTitle}
                          </button>
                        </div>
                        <p className="text-xs text-on-surface-variant break-words">{m.summary}</p>
                        <div className="text-[11px] font-mono text-outline">
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-variant bg-surface-container-low flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClearCache}
            className="min-h-[42px] px-3.5 py-2 rounded-lg border border-surface-variant bg-surface-container-lowest text-on-surface-variant hover:text-error hover:border-error text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Local Overrides</span>
          </button>
          <button
            type="button"
            onClick={onSyncNow}
            className="min-h-[42px] px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verify & Sync Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
};
