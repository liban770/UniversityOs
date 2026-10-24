import React, { useEffect } from 'react';
import {
  Eye,
  Moon,
  Sun,
  Monitor,
  Type,
  ZapOff,
  Contrast,
  Keyboard,
  RotateCcw,
  X,
  Check,
} from 'lucide-react';

export interface AccessibilitySettings {
  theme: 'light' | 'dark' | 'system';
  highContrast: boolean;
  fontScale: 'normal' | 'large' | 'xlarge';
  dyslexicSpacing: boolean;
  reduceMotion: boolean;
}

interface AccessibilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (next: Partial<AccessibilitySettings>) => void;
  onReset: () => void;
}

export const AccessibilityDrawer: React.FC<AccessibilityDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReset,
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
      aria-labelledby="a11y-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-surface-container-lowest text-on-surface h-full shadow-2xl border-l border-surface-variant flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-surface-variant flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <Eye className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="a11y-drawer-title" className="text-base font-semibold text-on-surface">
                  Accessibility & Display Standards
                </h2>
                <p className="text-xs text-on-surface-variant">
                  WCAG 2.1 AA / AAA Visual & Motor Controls
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close accessibility settings"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Theme Mode */}
            <section aria-labelledby="theme-mode-heading">
              <h3
                id="theme-mode-heading"
                className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3"
              >
                Color Theme & Luminance
              </h3>
              <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Color Theme">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = settings.theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() =>
                        onUpdateSettings({ theme: item.id as AccessibilitySettings['theme'] })
                      }
                      className={`min-h-[44px] px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                          : 'bg-surface-container-low text-on-surface border-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Font Size Scaling */}
            <section aria-labelledby="font-scale-heading">
              <h3
                id="font-scale-heading"
                className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5"
              >
                <Type className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Typography Scaling</span>
              </h3>
              <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Font Size">
                {[
                  { id: 'normal', label: 'Default (100%)' },
                  { id: 'large', label: 'Large (108%)' },
                  { id: 'xlarge', label: 'Extra (115%)' },
                ].map((item) => {
                  const active = settings.fontScale === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() =>
                        onUpdateSettings({
                          fontScale: item.id as AccessibilitySettings['fontScale'],
                        })
                      }
                      className={`min-h-[44px] px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                        active
                          ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                          : 'bg-surface-container-low text-on-surface border-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Visual & Cognitive Toggles */}
            <section aria-labelledby="visual-aids-heading" className="space-y-3">
              <h3
                id="visual-aids-heading"
                className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                Visual & Cognitive Accommodations
              </h3>

              {/* High Contrast AAA */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
                className="w-full p-3.5 rounded-xl border border-surface-variant bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 pr-3">
                  <Contrast className="w-5 h-5 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-on-surface">
                      High Contrast Mode (WCAG AAA)
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      Maximizes text-to-surface contrast ratios (7:1+) and sharpens table borders.
                    </div>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                    settings.highContrast ? 'bg-secondary justify-end' : 'bg-outline-variant justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center">
                    {settings.highContrast && <Check className="w-3 h-3 text-secondary" />}
                  </div>
                </div>
              </button>

              {/* Dyslexia-Friendly Spacing */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.dyslexicSpacing}
                onClick={() => onUpdateSettings({ dyslexicSpacing: !settings.dyslexicSpacing })}
                className="w-full p-3.5 rounded-xl border border-surface-variant bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 pr-3">
                  <Type className="w-5 h-5 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-on-surface">
                      Enhanced Reading & Letter Spacing
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      Increases character tracking, word spacing, and line height for reading comfort.
                    </div>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                    settings.dyslexicSpacing ? 'bg-secondary justify-end' : 'bg-outline-variant justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center">
                    {settings.dyslexicSpacing && <Check className="w-3 h-3 text-secondary" />}
                  </div>
                </div>
              </button>

              {/* Reduce Motion */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.reduceMotion}
                onClick={() => onUpdateSettings({ reduceMotion: !settings.reduceMotion })}
                className="w-full p-3.5 rounded-xl border border-surface-variant bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 pr-3">
                  <ZapOff className="w-5 h-5 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold text-on-surface">
                      Reduce Motion & Animations
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      Eliminates UI transitions, smooth scrolling, and animated micro-interactions.
                    </div>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                    settings.reduceMotion ? 'bg-secondary justify-end' : 'bg-outline-variant justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center">
                    {settings.reduceMotion && <Check className="w-3 h-3 text-secondary" />}
                  </div>
                </div>
              </button>
            </section>

            {/* Keyboard Navigation Reference */}
            <section
              aria-labelledby="keyboard-shortcuts-heading"
              className="p-4 rounded-xl bg-surface-container-low border border-surface-variant space-y-2.5"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface">
                <Keyboard className="w-4 h-4 text-secondary" aria-hidden="true" />
                <h3 id="keyboard-shortcuts-heading">Keyboard Navigation Shortcuts</h3>
              </div>
              <div className="space-y-1.5 text-xs text-on-surface-variant">
                <div className="flex items-center justify-between py-1 border-b border-surface-variant/60">
                  <span>Global Search & Module Jumper</span>
                  <kbd className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-[11px]">
                    ⌘K / Ctrl+K
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-surface-variant/60">
                  <span>Toggle Dark / Light Theme</span>
                  <kbd className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-[11px]">
                    Alt + D
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-surface-variant/60">
                  <span>Open Offline Data Cache Center</span>
                  <kbd className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-[11px]">
                    Alt + O
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Dismiss Active Modal or Drawer</span>
                  <kbd className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-[11px]">
                    Escape
                  </kbd>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-variant bg-surface-container-low flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="min-h-[42px] px-4 py-2 rounded-lg border border-surface-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
