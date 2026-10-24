import React, { useEffect, useRef } from 'react';
import { STITCH_SCREENS_HTML, ScreenMetadata } from '../data/stitchScreens';
import {
  getSavedFieldOverrides,
  saveFieldOverride,
  OfflineMutation,
} from '../services/offlineCache';

interface StitchScreenCanvasProps {
  screen: ScreenMetadata;
  globalSearchQuery: string;
  onNavigateScreen: (screenId: string) => void;
  onOpenCommandPalette: (defaultTab?: 'navigate' | 'quick_entry') => void;
  onLogMutation: (
    actionType: OfflineMutation['actionType'],
    summary: string
  ) => void;
  onAnnounce: (message: string) => void;
}

const FALLBACK_AVATAR_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="#1f1f24"/><circle cx="40" cy="30" r="14" fill="#d32f2f"/><path d="M16 68c0-13.255 10.745-24 24-24s24 10.745 24 24" fill="#52525b"/></svg>`
  );

export const StitchScreenCanvas: React.FC<StitchScreenCanvasProps> = ({
  screen,
  globalSearchQuery,
  onNavigateScreen,
  onOpenCommandPalette,
  onLogMutation,
  onAnnounce,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhance DOM accessibility, restore cached field overrides, and wire image fallbacks
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const overrides = getSavedFieldOverrides(screen.id);

    // 1. Resilient images with fallback SVG avatar
    const images = root.querySelectorAll<HTMLImageElement>('img');
    images.forEach((img) => {
      img.setAttribute('referrerpolicy', 'no-referrer');
      if (!img.getAttribute('alt')) {
        img.setAttribute('alt', img.getAttribute('data-alt') || `${screen.title} graphic`);
      }
      img.onerror = () => {
        if (img.src !== FALLBACK_AVATAR_SVG) {
          img.src = FALLBACK_AVATAR_SVG;
        }
      };
    });

    // 2. Ensure all buttons have type="button" and accessible labels
    const buttons = root.querySelectorAll<HTMLButtonElement>('button');
    buttons.forEach((btn, idx) => {
      if (!btn.getAttribute('type')) {
        btn.setAttribute('type', 'button');
      }
      const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
      const titleAttr = btn.getAttribute('title');
      if (!btn.getAttribute('aria-label')) {
        if (titleAttr) {
          btn.setAttribute('aria-label', titleAttr);
        } else if (text.length > 0 && text.length <= 28) {
          // If button only contains a Material Symbol icon name, provide a clean aria-label
          const iconSpan = btn.querySelector('.material-symbols-outlined');
          if (iconSpan && text === (iconSpan.textContent || '').trim()) {
            const readableIcon = text.replace(/_/g, ' ');
            btn.setAttribute('aria-label', `Action: ${readableIcon}`);
          }
        } else if (!text) {
          btn.setAttribute('aria-label', `${screen.shortTitle} control ${idx + 1}`);
        }
      }
    });

    // 3. Ensure all inputs, selects, and textareas have accessible labels and restore offline cached values
    const controls = root.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input, select, textarea');
    controls.forEach((ctrl, idx) => {
      const key = ctrl.id || ctrl.name || `field_${idx}`;
      ctrl.setAttribute('data-field-key', key);

      if (!ctrl.getAttribute('aria-label') && !ctrl.id) {
        const placeholder = ctrl.getAttribute('placeholder');
        ctrl.setAttribute(
          'aria-label',
          placeholder || `${screen.shortTitle} input field ${idx + 1}`
        );
      }

      if (key in overrides) {
        const savedVal = overrides[key];
        if (ctrl instanceof HTMLInputElement && (ctrl.type === 'checkbox' || ctrl.type === 'radio')) {
          ctrl.checked = Boolean(savedVal);
        } else {
          ctrl.value = String(savedVal);
        }
      }
    });

    // 4. Make tables keyboard-scrollable with ARIA region attributes
    const tables = root.querySelectorAll<HTMLTableElement>('table');
    tables.forEach((table, idx) => {
      if (!table.getAttribute('aria-label')) {
        table.setAttribute('aria-label', `${screen.title} Data Table ${idx + 1}`);
      }
      const parent = table.parentElement;
      if (parent && !parent.classList.contains('overflow-x-auto')) {
        parent.classList.add('overflow-x-auto');
      }
    });
  }, [screen.id, screen.shortTitle, screen.title]);

  // Apply live global search filtering across table rows when globalSearchQuery changes
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const q = globalSearchQuery.toLowerCase().trim();
    const rows = root.querySelectorAll<HTMLTableRowElement>('tbody tr');
    rows.forEach((row) => {
      if (!q) {
        row.style.display = '';
        return;
      }
      const text = (row.textContent || '').toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  }, [globalSearchQuery, screen.id]);

  // Event delegation for clicks inside the Stitch canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const interactive = target.closest('button, a, [role="button"], [role="switch"]');
    if (!interactive) return;

    if (interactive.tagName.toLowerCase() === 'a') {
      e.preventDefault();
    }

    const rawText = (interactive.textContent || '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const lower = rawText.toLowerCase();
    const titleAttr = (interactive.getAttribute('title') || '').toLowerCase();

    // 1. Check if button/link navigates to another SIS module
    if (lower.includes('course registration') || lower.includes('register course')) {
      onNavigateScreen('course_registration_enrollment_portal');
      return;
    }
    if (lower.includes('full transcript') || lower.includes('official transcript')) {
      onNavigateScreen('official_academic_transcript_credential_issuance');
      return;
    }
    if (lower.includes('launch attendance') || lower.includes('attendance roster')) {
      onNavigateScreen('attendance_session_roster_verification');
      return;
    }
    if (lower.includes('grade entry') || lower.includes('grading queue') || lower.includes('enter grades')) {
      onNavigateScreen('examinations_grade_entry_sheet');
      return;
    }
    if (lower.includes('applicant dossier') || lower.includes('review dossier')) {
      onNavigateScreen('applicant_dossier_decision_review');
      return;
    }
    if (lower.includes('fee statement') || lower.includes('pay tuition') || lower.includes('billing statement')) {
      onNavigateScreen('student_billing_fee_statement_workstation');
      return;
    }
    if (lower.includes('public registry') || lower.includes('verify document') || lower.includes('verify credential')) {
      onNavigateScreen('document_verification_public_registry_ledger');
      return;
    }
    if (lower.includes('welfare') || lower.includes('case dossier') || lower.includes('micro-grant')) {
      onNavigateScreen('student_welfare_incident_case_dossier');
      return;
    }
    if (lower.includes('audit log') || lower.includes('privilege profile')) {
      onNavigateScreen('staff_privilege_profile_security_audit_log');
      return;
    }
    if (lower.includes('quick action') || lower.includes('add_circle')) {
      onOpenCommandPalette('quick_entry');
      return;
    }

    // 2. Check if it's an Export / Download action
    if (
      lower.includes('export') ||
      lower.includes('download') ||
      lower.includes('csv') ||
      lower.includes('pdf') ||
      titleAttr.includes('download')
    ) {
      const exportPayload = {
        institution: 'UniversityOS Enterprise SIS',
        module: screen.title,
        roleContext: screen.role,
        exportedAt: new Date().toISOString(),
        offlineCached: true,
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${screen.id}_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      onAnnounce(`Exported ${screen.shortTitle} dataset to local file.`);
      return;
    }

    // 3. Check if it's a Role / Permission Switch or Attendance Status Toggle
    if (
      interactive.getAttribute('role') === 'switch' ||
      lower === 'present' ||
      lower === 'absent' ||
      lower === 'late' ||
      lower === 'excused'
    ) {
      const isPressed = interactive.getAttribute('aria-pressed') === 'true';
      interactive.setAttribute('aria-pressed', String(!isPressed));
      interactive.classList.toggle('ring-2');
      interactive.classList.toggle('ring-secondary');
      const cleanLabel = rawText.slice(0, 48) || 'Status toggle';
      onLogMutation('attendance_mark', `Updated ${cleanLabel} in ${screen.shortTitle}`);
      return;
    }

    // 4. Generic interactive button feedback (Approve, Save, Enroll, Verify, Lock, Filter, etc.)
    const cleanBtnLabel =
      rawText
        .replace(/^[a-z0-9_]+\s+/i, '') // strip leading Material Symbol icon ligature name if present
        .trim() ||
      interactive.getAttribute('aria-label') ||
      'Action';

    if (
      lower.includes('enroll') ||
      lower.includes('register') ||
      lower.includes('add course')
    ) {
      onLogMutation('course_enrollment', `Executed "${cleanBtnLabel}" in ${screen.shortTitle}`);
    } else if (
      lower.includes('save') ||
      lower.includes('submit') ||
      lower.includes('publish') ||
      lower.includes('approve') ||
      lower.includes('confirm') ||
      lower.includes('verify')
    ) {
      onLogMutation('dossier_action', `Committed "${cleanBtnLabel}" in ${screen.shortTitle}`);
    } else {
      onAnnounce(`Activated "${cleanBtnLabel}" in ${screen.shortTitle}`);
    }
  };

  // Event delegation for input/select/checkbox changes inside the Stitch canvas
  const handleCanvasChange = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!target || !('value' in target)) return;

    const fieldKey = target.getAttribute('data-field-key') || target.id || 'input_field';
    const isCheckbox =
      target instanceof HTMLInputElement &&
      (target.type === 'checkbox' || target.type === 'radio');
    const newVal = isCheckbox ? (target as HTMLInputElement).checked : target.value;

    saveFieldOverride(screen.id, fieldKey, newVal);

    // If user typed in an inline search box inside the Stitch screen, filter table rows
    if (
      target instanceof HTMLInputElement &&
      (target.type === 'text' || target.type === 'search') &&
      (target.placeholder || '').toLowerCase().includes('search')
    ) {
      const root = containerRef.current;
      if (root) {
        const q = target.value.toLowerCase().trim();
        const rows = root.querySelectorAll<HTMLTableRowElement>('tbody tr');
        rows.forEach((row) => {
          if (!q) {
            row.style.display = '';
          } else {
            row.style.display = (row.textContent || '').toLowerCase().includes(q) ? '' : 'none';
          }
        });
      }
      return;
    }

    const summary = isCheckbox
      ? `Toggled selection (${fieldKey}) to ${newVal ? 'Enabled' : 'Disabled'}`
      : `Updated field (${fieldKey}) to "${String(newVal).slice(0, 32)}"`;

    onLogMutation(
      screen.id.includes('grade') ? 'grade_update' : 'field_edit',
      summary
    );
  };

  const htmlContent = STITCH_SCREENS_HTML[screen.id] || '';

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      onChange={handleCanvasChange}
      className={`stitch-canvas w-full transition-colors ${
        screen.isMobileCompanion
          ? 'max-w-md mx-auto my-4 sm:my-6 rounded-3xl border border-surface-variant shadow-xl overflow-hidden bg-surface'
          : 'w-full'
      }`}
    >
      {screen.isMobileCompanion && (
        <div className="bg-primary text-on-primary px-4 py-2.5 flex items-center justify-between text-xs border-b border-surface-variant/20">
          <div className="flex items-center gap-2 font-semibold">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              smartphone
            </span>
            <span>Mobile Companion Viewport ({screen.shortTitle})</span>
          </div>
          <span className="font-mono text-[11px] text-on-primary-container">390px Touch Frame</span>
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};
