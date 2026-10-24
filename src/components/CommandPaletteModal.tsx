import React, { useEffect, useState } from 'react';
import { Search, ArrowRight, X, PlusCircle, CheckCircle2 } from 'lucide-react';
import { SCREEN_METADATA, ScreenMetadata } from '../data/stitchScreens';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScreen: (screenId: string) => void;
  onCreateQuickAction: (actionType: 'attendance_mark' | 'grade_update' | 'course_enrollment' | 'dossier_action', summary: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectScreen,
  onCreateQuickAction,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'navigate' | 'quick_entry'>('navigate');
  const [entryType, setEntryType] = useState<'attendance_mark' | 'grade_update' | 'course_enrollment' | 'dossier_action'>('attendance_mark');
  const [studentName, setStudentName] = useState('Julian Chen (UOS-2022-8492)');
  const [courseOrModule, setCourseOrModule] = useState('CS402: Distributed Systems Architecture');
  const [noteValue, setNoteValue] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSubmittedMsg(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredScreens: ScreenMetadata[] = SCREEN_METADATA.filter((s) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.shortTitle.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const labelMap = {
      attendance_mark: 'Attendance Verified',
      grade_update: 'Grade Assessment Recorded',
      course_enrollment: 'Course Enrollment Updated',
      dossier_action: 'Administrative Action Logged',
    };
    const summary = `${labelMap[entryType]} — ${studentName} · ${courseOrModule}${noteValue.trim() ? ` (${noteValue.trim()})` : ''}`;
    onCreateQuickAction(entryType, summary);
    setSubmittedMsg(summary);
    setNoteValue('');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cmd-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-12 sm:pt-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-surface-container-lowest border border-surface-variant shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        {/* Top Mode Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-surface-variant bg-surface-container-low flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Command Mode">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'navigate'}
              onClick={() => setActiveTab('navigate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'navigate'
                  ? 'bg-secondary text-on-secondary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Jump to Module (22 Screens)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'quick_entry'}
              onClick={() => setActiveTab('quick_entry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'quick_entry'
                  ? 'bg-secondary text-on-secondary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Administrative / Academic Action</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 id="cmd-modal-title" className="sr-only">
          UniversityOS Global Command Palette and Quick Action Launcher
        </h2>

        {activeTab === 'navigate' ? (
          <>
            <div className="p-3.5 border-b border-surface-variant relative flex items-center">
              <Search className="w-4 h-4 text-outline absolute left-6 pointer-events-none" />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 22 SIS modules by name, role (Admin, Student, Lecturer, Mobile), or keyword..."
                aria-label="Search SIS modules"
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-container-low border border-surface-variant text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
              {filteredScreens.length === 0 ? (
                <div className="py-10 text-center text-sm text-on-surface-variant">
                  No SIS modules match &ldquo;{query}&rdquo;.
                </div>
              ) : (
                filteredScreens.map((screen) => (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => {
                      onSelectScreen(screen.id);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl hover:bg-surface-container-low border border-transparent hover:border-surface-variant flex items-center justify-between gap-3 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className="material-symbols-outlined text-[20px] text-secondary mt-0.5 shrink-0"
                        aria-hidden="true"
                      >
                        {screen.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-on-surface group-hover:text-secondary transition-colors">
                            {screen.title}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            · {screen.role} · {screen.category}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {screen.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-outline group-hover:text-secondary shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleQuickSubmit} className="p-5 space-y-4 overflow-y-auto">
            {submittedMsg ? (
              <div className="p-6 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div className="text-sm font-semibold text-on-surface">
                  Action Recorded & Cached!
                </div>
                <p className="text-xs text-on-surface-variant">{submittedMsg}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="qa-type"
                      className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5"
                    >
                      Action Type
                    </label>
                    <select
                      id="qa-type"
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value as typeof entryType)}
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-variant text-sm text-on-surface"
                    >
                      <option value="attendance_mark">Verify Class Attendance</option>
                      <option value="grade_update">Record Continuous Assessment / Grade</option>
                      <option value="course_enrollment">Approve Course Registration Override</option>
                      <option value="dossier_action">Log Admissions / Welfare Committee Decision</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="qa-student"
                      className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5"
                    >
                      Target Student / Applicant
                    </label>
                    <select
                      id="qa-student"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-variant text-sm text-on-surface"
                    >
                      <option>Julian Chen (UOS-2022-8492)</option>
                      <option>Amara Okafor (UOS-2023-1104)</option>
                      <option>Elena Rostova (UOS-2021-4920)</option>
                      <option>Marcus Vance-Sterling (UOS-2024-7731)</option>
                      <option>Sofia Al-Mansoor (UOS-2022-3318)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="qa-course"
                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5"
                  >
                    Course / Department Context
                  </label>
                  <select
                    id="qa-course"
                    value={courseOrModule}
                    onChange={(e) => setCourseOrModule(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-variant text-sm text-on-surface"
                  >
                    <option>CS402: Distributed Systems Architecture</option>
                    <option>CS301: Algorithms & Complexity</option>
                    <option>CS310: Relational & Distributed Database Systems</option>
                    <option>MATH204: Linear Algebra & Optimization</option>
                    <option>Office of the Registrar — Fall 2024 Ledger</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="qa-notes"
                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5"
                  >
                    Audit Rationale / Score / Remarks
                  </label>
                  <input
                    id="qa-notes"
                    type="text"
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="e.g., Midterm Score 94/100 verified, or Biometric Check-in Present"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-variant text-sm text-on-surface placeholder:text-outline"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[40px] px-4 py-2 rounded-lg border border-surface-variant text-xs font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold cursor-pointer"
                  >
                    Commit to SIS Ledger
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
