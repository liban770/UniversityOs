import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        aria-label="Install UniversityOS App for offline access"
        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Instructions to install UniversityOS on iOS"
          className="min-h-[38px] px-3 py-1.5 rounded-lg border border-surface-variant bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          >
            <div className="w-full max-w-sm rounded-xl bg-surface-container-lowest border border-surface-variant p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 id="ios-install-title" className="text-base font-semibold text-on-surface">
                  Install UniversityOS on iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close installation guide"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                1. Tap the <strong>Share</strong> button in your Safari toolbar.<br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.<br />
                3. Launch UniversityOS anytime with full offline caching.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[42px] rounded-lg bg-secondary text-on-secondary py-2 text-xs font-semibold hover:bg-secondary-container transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
