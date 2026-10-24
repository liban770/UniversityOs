/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Eye,
  Wifi,
  WifiOff,
  Plus,
  ChevronRight,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { SCREEN_METADATA, ScreenMetadata } from './data/stitchScreens';
import { StitchScreenCanvas } from './components/StitchScreenCanvas';
import {
  AccessibilityDrawer,
  AccessibilitySettings,
} from './components/AccessibilityDrawer';
import { OfflineSyncDrawer } from './components/OfflineSyncDrawer';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/usePWAInstall';
import {
  initializeOfflineCache,
  getOfflineCacheStats,
  getMutations,
  recordOfflineMutation,
  syncAllPendingMutations,
  clearOfflineCacheAndOverrides,
  OfflineCacheStats,
  OfflineMutation,
} from './services/offlineCache';

const LS_A11Y_KEY = 'uos_accessibility_settings_v1';
const LS_ACTIVE_SCREEN_KEY = 'uos_active_screen_v1';

const DEFAULT_A11Y: AccessibilitySettings = {
  theme: 'light',
  highContrast: false,
  fontScale: 'normal',
  dyslexicSpacing: false,
  reduceMotion: false,
};

export default function App() {
  // Active screen state (persisted in localStorage for offline continuity)
  const [activeScreenId, setActiveScreenId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LS_ACTIVE_SCREEN_KEY);
      if (saved && SCREEN_METADATA.some((s) => s.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'university_administrator_overview';
  });

  // Sidebar role filter ('All' | 'Administrator' | 'Student' | 'Lecturer')
  const [roleFilter, setRoleFilter] = useState<'All' | 'Administrator' | 'Student' | 'Lecturer'>('All');

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Accessibility settings state
  const [a11y, setA11y] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(LS_A11Y_KEY);
      return saved ? { ...DEFAULT_A11Y, ...JSON.parse(saved) } : DEFAULT_A11Y;
    } catch {
      return DEFAULT_A11Y;
    }
  });

  // Drawers & Modals state
  const [a11yDrawerOpen, setA11yDrawerOpen] = useState(false);
  const [offlineDrawerOpen, setOfflineDrawerOpen] = useState(false);
  const [commandModalOpen, setCommandModalOpen] = useState(false);

  // Search filter state for active screen tables
  const [searchQuery, setSearchQuery] = useState('');

  // Offline caching & simulation state
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const isOnline = useOnlineStatus(simulatedOffline);
  const [cacheStats, setCacheStats] = useState<OfflineCacheStats>(() => getOfflineCacheStats());
  const [mutations, setMutations] = useState<OfflineMutation[]>(() => getMutations());

  // Accessible screen reader & toast announcement
  const [announcement, setAnnouncement] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Initialize IndexedDB offline cache on mount
  useEffect(() => {
    initializeOfflineCache().then((stats) => {
      setCacheStats(stats);
    });
  }, []);

  // Auto-sync queued mutations when transitioning back to online
  useEffect(() => {
    if (isOnline) {
      const currentStats = getOfflineCacheStats();
      if (currentStats.pendingMutationsCount > 0) {
        const res = syncAllPendingMutations();
        setCacheStats(getOfflineCacheStats());
        setMutations(getMutations());
        announce(`Back online — synchronized ${res.syncedCount} queued offline changes.`);
      }
    }
  }, [isOnline, announce]);

  // Apply Accessibility & Dark Mode classes to <html> element
  useEffect(() => {
    const html = document.documentElement;
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = a11y.theme === 'dark' || (a11y.theme === 'system' && prefersDark);

    html.classList.toggle('dark', isDark);
    html.classList.toggle('a11y-high-contrast', a11y.highContrast);
    html.classList.toggle('a11y-font-lg', a11y.fontScale === 'large');
    html.classList.toggle('a11y-font-xl', a11y.fontScale === 'xlarge');
    html.classList.toggle('a11y-dyslexic', a11y.dyslexicSpacing);
    html.classList.toggle('a11y-reduce-motion', a11y.reduceMotion);

    try {
      localStorage.setItem(LS_A11Y_KEY, JSON.stringify(a11y));
    } catch {
      // ignore
    }
  }, [a11y]);

  // Global keyboard shortcuts (⌘K / Ctrl+K, Alt+D, Alt+O, Alt+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandModalOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setA11y((prev) => {
          const nextTheme = prev.theme === 'dark' ? 'light' : 'dark';
          announce(`Switched to ${nextTheme} mode.`);
          return { ...prev, theme: nextTheme };
        });
      } else if (e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setOfflineDrawerOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setA11yDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [announce]);

  const activeScreen: ScreenMetadata =
    SCREEN_METADATA.find((s) => s.id === activeScreenId) || SCREEN_METADATA[0];

  const handleSelectScreen = useCallback(
    (screenId: string) => {
      const target = SCREEN_METADATA.find((s) => s.id === screenId);
      if (!target) return;
      setActiveScreenId(screenId);
      setMobileMenuOpen(false);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: a11y.reduceMotion ? 'auto' : 'smooth' });
      try {
        localStorage.setItem(LS_ACTIVE_SCREEN_KEY, screenId);
      } catch {
        // ignore
      }
      setAnnouncement(`Loaded ${target.title} (${target.role} view)`);
    },
    [a11y.reduceMotion]
  );

  const handleLogMutation = useCallback(
    (actionType: OfflineMutation['actionType'], summary: string) => {
      recordOfflineMutation(
        activeScreen.id,
        activeScreen.shortTitle,
        actionType,
        summary,
        isOnline
      );
      setCacheStats(getOfflineCacheStats());
      setMutations(getMutations());
      announce(
        isOnline
          ? `${summary} (Saved & synced)`
          : `${summary} (Cached offline — queued for sync)`
      );
    },
    [activeScreen.id, activeScreen.shortTitle, isOnline, announce]
  );

  const handleSyncNow = useCallback(() => {
    const res = syncAllPendingMutations();
    setCacheStats(getOfflineCacheStats());
    setMutations(getMutations());
    announce(
      res.syncedCount > 0
        ? `Synchronized ${res.syncedCount} offline mutations with UniversityOS ledger.`
        : 'All 22 SIS modules and local records verified in sync.'
    );
  }, [announce]);

  const handleClearCache = useCallback(() => {
    clearOfflineCacheAndOverrides();
    setCacheStats(getOfflineCacheStats());
    setMutations(getMutations());
    announce('Cleared local field overrides and reset offline mutation queue.');
  }, [announce]);

  const isDarkActive =
    a11y.theme === 'dark' ||
    (a11y.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const categories: ScreenMetadata['category'][] = [
    'Overview & Portals',
    'Academic & Enrollment',
    'Instruction & Credentials',
    'Finance, Welfare & Governance',
    'Mobile Companion Views',
  ];

  const filteredSidebarScreens = SCREEN_METADATA.filter(
    (s) => roleFilter === 'All' || s.role === roleFilter
  );

  const siblingScreens = SCREEN_METADATA.filter(
    (s) => s.category === activeScreen.category
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface selection:bg-secondary selection:text-on-secondary">
      {/* WCAG Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-secondary focus:text-on-secondary focus:font-semibold focus:text-sm focus:shadow-xl"
      >
        Skip to main content
      </a>

      {/* Screen Reader Polite Live Region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Desktop Persistent Sidebar (lg: ≥ 1024px) */}
      <aside
        aria-label="Primary Institutional Navigation"
        className="hidden lg:flex fixed left-0 top-0 h-screen w-[256px] bg-[#111111] text-white z-40 flex-col border-r border-white/10 select-none"
      >
        {/* Brand Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
          <button
            type="button"
            onClick={() => handleSelectScreen('university_administrator_overview')}
            className="flex items-center gap-3 text-left group cursor-pointer focus-visible:rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xs">
              U
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-white truncate">
                UniversityOS
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Enterprise SIS · 22 Modules
              </div>
            </div>
          </button>
        </div>

        {/* Role Persona Filter Tabs */}
        <div className="px-3 pt-3 pb-2 border-b border-white/10">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-1 mb-1.5">
            Filter Workspace by Role
          </div>
          <div
            className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg"
            role="tablist"
            aria-label="Filter modules by role"
          >
            {(['All', 'Administrator', 'Student', 'Lecturer'] as const).map((r) => {
              const active = roleFilter === r;
              const shortLabel = r === 'Administrator' ? 'Admin' : r;
              return (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRoleFilter(r)}
                  className={`py-1 px-1.5 rounded text-[11px] font-semibold transition-colors cursor-pointer truncate ${
                    active
                      ? 'bg-secondary text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Navigation Links across all 22 Stitch Screens */}
        <nav
          aria-label="SIS Modules"
          className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4"
        >
          {categories.map((cat) => {
            const items = filteredSidebarScreens.filter((s) => s.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  {cat}
                </div>
                {items.map((item) => {
                  const isActive = item.id === activeScreen.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => handleSelectScreen(item.id)}
                      className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-secondary/20 text-white font-semibold ring-1 ring-secondary/50'
                          : 'text-neutral-300 hover:bg-white/8 hover:text-white font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`material-symbols-outlined text-[18px] shrink-0 ${
                            isActive ? 'text-secondary' : 'text-neutral-400'
                          }`}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.shortTitle}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {item.role === 'Administrator' ? 'Adm' : item.role === 'Student' ? 'Stu' : 'Lec'}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Offline Cache Telemetry Button */}
        <div className="p-3 border-t border-white/10 bg-black/40">
          <button
            type="button"
            onClick={() => setOfflineDrawerOpen(true)}
            className="w-full p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {isOnline ? 'Offline Cache Ready' : 'Offline Mode Active'}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono truncate">
                  {cacheStats.cachedScreensCount}/22 Modules · {cacheStats.cacheSizeKB} KB
                </div>
              </div>
            </div>
            {cacheStats.pendingMutationsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-mono text-[10px] font-bold shrink-0">
                {cacheStats.pendingMutationsCount}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Off-Canvas Navigation Drawer (< 1024px) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          className="fixed inset-0 z-50 lg:hidden flex bg-black/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="w-[84vw] max-w-[300px] bg-[#111111] text-white h-full flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#111111] z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white font-bold">
                  U
                </div>
                <div>
                  <div className="text-sm font-bold text-white">UniversityOS</div>
                  <div className="text-[11px] text-neutral-400">22 Enterprise SIS Views</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="w-11 h-11 rounded-lg flex items-center justify-center text-neutral-300 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 space-y-4 flex-1 overflow-y-auto">
              {categories.map((cat) => {
                const items = SCREEN_METADATA.filter((s) => s.category === cat);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {cat}
                    </div>
                    {items.map((item) => {
                      const isActive = item.id === activeScreen.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => handleSelectScreen(item.id)}
                          className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                            isActive
                              ? 'bg-secondary text-white font-semibold'
                              : 'text-neutral-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="material-symbols-outlined text-[18px] shrink-0">
                              {item.icon}
                            </span>
                            <span className="truncate">{item.shortTitle}</span>
                          </div>
                          <span className="text-[10px] opacity-75 shrink-0">{item.role}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/10 flex flex-col gap-2">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="lg:pl-[256px] flex-1 flex flex-col min-h-screen w-full">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-variant px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Left Zone: Mobile Hamburger + Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-h-[44px] min-w-[44px] -ml-1 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
              <button
                type="button"
                onClick={() => handleSelectScreen('university_administrator_overview')}
                className="font-semibold text-on-surface-variant hover:text-on-surface hidden sm:inline whitespace-nowrap cursor-pointer"
              >
                UniversityOS
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-outline hidden sm:inline shrink-0" aria-hidden="true" />
              <span className="text-on-surface-variant hidden md:inline whitespace-nowrap">
                {activeScreen.breadcrumb[0]}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-outline hidden md:inline shrink-0" aria-hidden="true" />
              <span className="font-semibold text-on-surface truncate">
                {activeScreen.shortTitle}
              </span>
            </nav>
          </div>

          {/* Center Zone: Live Filter & Global Command Search Trigger */}
          <div className="hidden md:flex items-center max-w-xs lg:max-w-md w-full relative">
            <Search className="w-4 h-4 text-outline absolute left-3 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter ${activeScreen.shortTitle} rows or press ⌘K...`}
              aria-label={`Filter ${activeScreen.shortTitle} records`}
              className="w-full h-9 pl-9 pr-14 rounded-lg bg-surface-container-low border border-surface-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-colors"
            />
            <button
              type="button"
              onClick={() => setCommandModalOpen(true)}
              aria-label="Open global module jumper (Command+K)"
              className="absolute right-1.5 px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant hover:text-on-surface font-mono text-[10px] border border-outline-variant/50 cursor-pointer"
            >
              ⌘K
            </button>
          </div>

          {/* Right Zone: Offline Cache, Dark Mode, Accessibility, PWA Install, Quick Action */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setCommandModalOpen(true)}
              aria-label="Search modules and actions"
              className="md:hidden min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Offline Cache & Sync Status Trigger */}
            <button
              type="button"
              onClick={() => setOfflineDrawerOpen(true)}
              aria-label={`Offline data cache status: ${isOnline ? 'Online' : 'Offline Mode'}. ${cacheStats.pendingMutationsCount} pending changes.`}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !isOnline
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-surface-container-low border-surface-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              )}
              <span className="hidden xl:inline">
                {isOnline ? 'Cached' : 'Offline'}
              </span>
              {cacheStats.pendingMutationsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black font-mono text-[10px] font-bold">
                  {cacheStats.pendingMutationsCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const nextTheme = isDarkActive ? 'light' : 'dark';
                setA11y((prev) => ({ ...prev, theme: nextTheme }));
                announce(`Switched to ${nextTheme} mode.`);
              }}
              aria-label={isDarkActive ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkActive ? 'Switch to Light Mode (Alt+D)' : 'Switch to Dark Mode (Alt+D)'}
              className="min-h-[38px] min-w-[38px] rounded-lg border border-surface-variant bg-surface-container-low text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
            >
              {isDarkActive ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
              )}
            </button>

            {/* Accessibility Settings Trigger */}
            <button
              type="button"
              onClick={() => setA11yDrawerOpen(true)}
              aria-label="Open accessibility and display preferences"
              title="Accessibility Standards (Alt+A)"
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                a11y.highContrast || a11y.fontScale !== 'normal' || a11y.dyslexicSpacing
                  ? 'bg-secondary/15 border-secondary text-secondary'
                  : 'bg-surface-container-low border-surface-variant text-on-surface hover:bg-surface-container'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">A11y</span>
            </button>

            {/* In-App PWA Install Button */}
            <PWAInstallButton />

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => setCommandModalOpen(true)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Quick Action</span>
            </button>
          </div>
        </header>

        {/* Offline Connectivity Banner (when Offline or Simulated Offline is active) */}
        {!isOnline && (
          <div
            role="region"
            aria-label="Offline Mode Notice"
            className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Serving cached UniversityOS SIS data from IndexedDB. Any edits you make are queued locally ({cacheStats.pendingMutationsCount} pending).
              </span>
            </div>
            <div className="flex items-center gap-2">
              {simulatedOffline && (
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedOffline(false);
                    announce('Exited simulated offline mode. Reconnected.');
                  }}
                  className="px-2.5 py-1 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 cursor-pointer"
                >
                  Reconnect & Sync
                </button>
              )}
              <button
                type="button"
                onClick={() => setOfflineDrawerOpen(true)}
                className="underline font-semibold hover:text-secondary cursor-pointer"
              >
                Inspect Queue
              </button>
            </div>
          </div>
        )}

        {/* Contextual Sub-Navigation Bar (Sibling Screens in Category + Desktop/Mobile Companion Switcher) */}
        <div className="bg-surface-container-low border-b border-surface-variant px-3 sm:px-6 py-2 flex items-center justify-between gap-3 overflow-x-auto">
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
            role="navigation"
            aria-label={`${activeScreen.category} views`}
          >
            {siblingScreens.map((sib) => {
              const active = sib.id === activeScreen.id;
              return (
                <button
                  key={sib.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleSelectScreen(sib.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    active
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs border border-surface-variant'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      active ? 'text-secondary' : ''
                    }`}
                    aria-hidden="true"
                  >
                    {sib.icon}
                  </span>
                  <span>{sib.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Toggle between Desktop SIS View and Mobile Companion View */}
          <button
            type="button"
            onClick={() => {
              if (activeScreen.isMobileCompanion) {
                handleSelectScreen('student_portal_dashboard');
              } else {
                handleSelectScreen('student_mobile_companion_dashboard');
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-surface-variant bg-surface-container-lowest text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeScreen.isMobileCompanion ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
                <span>Switch to Desktop SIS</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
                <span>Mobile Companion</span>
              </>
            )}
          </button>
        </div>

        {/* Main Landmark Canvas */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full pb-20 lg:pb-8 focus:outline-none"
        >
          <StitchScreenCanvas
            screen={activeScreen}
            globalSearchQuery={searchQuery}
            onNavigateScreen={handleSelectScreen}
            onOpenCommandPalette={() => setCommandModalOpen(true)}
            onLogMutation={handleLogMutation}
            onAnnounce={announce}
          />
        </main>

        {/* Accessible Toast Notification */}
        {toastMessage && (
          <div
            role="alert"
            className="fixed bottom-16 lg:bottom-5 right-4 z-40 max-w-md rounded-xl bg-primary text-on-primary border border-white/15 px-4 py-3 shadow-xl flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Mobile Ergonomic Bottom Tab Bar (< 1024px) */}
        <nav
          aria-label="Mobile Quick Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-variant grid grid-cols-5 items-center px-1"
        >
          {[
            {
              id: 'university_administrator_overview',
              label: 'Admin',
              icon: 'dashboard',
            },
            {
              id: 'student_portal_dashboard',
              label: 'Student',
              icon: 'school',
            },
            {
              id: 'lecturer_portal_dashboard',
              label: 'Lecturer',
              icon: 'co_present',
            },
            {
              id: 'mobile_digital_academic_id_profile',
              label: 'Digital ID',
              icon: 'qr_code_2',
            },
          ].map((tab) => {
            const active = activeScreen.id === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleSelectScreen(tab.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center rounded-lg transition-colors ${
                  active ? 'text-secondary font-semibold' : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className="text-[10px] tracking-tight mt-0.5 truncate">{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Browse all 22 SIS modules"
            className="min-h-[44px] flex flex-col items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              apps
            </span>
            <span className="text-[10px] tracking-tight mt-0.5 truncate">All (22)</span>
          </button>
        </nav>
      </div>

      {/* Accessibility & Display Standards Drawer */}
      <AccessibilityDrawer
        isOpen={a11yDrawerOpen}
        onClose={() => setA11yDrawerOpen(false)}
        settings={a11y}
        onUpdateSettings={(partial) =>
          setA11y((prev) => ({ ...prev, ...partial }))
        }
        onReset={() => {
          setA11y(DEFAULT_A11Y);
          announce('Reset accessibility and display preferences to default.');
        }}
      />

      {/* Offline Data Cache & Mutation Queue Drawer */}
      <OfflineSyncDrawer
        isOpen={offlineDrawerOpen}
        onClose={() => setOfflineDrawerOpen(false)}
        isOnline={isOnline}
        simulatedOffline={simulatedOffline}
        onToggleSimulatedOffline={() => {
          setSimulatedOffline((prev) => {
            const next = !prev;
            announce(
              next
                ? 'Simulated Offline Mode enabled. Changes will queue locally in IndexedDB.'
                : 'Simulated Offline Mode disabled.'
            );
            return next;
          });
        }}
        stats={cacheStats}
        mutations={mutations}
        onSyncNow={handleSyncNow}
        onClearCache={handleClearCache}
        onNavigateScreen={handleSelectScreen}
      />

      {/* Global Command Palette & Action Logger Modal */}
      <CommandPaletteModal
        isOpen={commandModalOpen}
        onClose={() => setCommandModalOpen(false)}
        onSelectScreen={handleSelectScreen}
        onCreateQuickAction={(actionType, summary) => {
          handleLogMutation(actionType, summary);
        }}
      />
    </div>
  );
}
