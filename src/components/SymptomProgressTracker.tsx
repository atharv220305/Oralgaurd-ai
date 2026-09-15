import React, { useState } from 'react';
import {
  Activity,
  TrendingDown,
  Minus,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  MapPin,
  AlertCircle,
  FileText,
  Calendar,
  ChevronRight,
  Sparkles,
  Info,
  X,
  History,
  ShieldCheck,
} from 'lucide-react';
import {
  SymptomProgressEntry,
  SymptomProgressStatus,
  PatientProfile,
  MouthMapLocationItem,
  AppLanguage,
} from '../types';
import { ORAL_REGIONS } from '../data/oralAnatomy';

interface SymptomProgressTrackerProps {
  entries: SymptomProgressEntry[];
  onAddEntry: (entry: SymptomProgressEntry) => void;
  onDeleteEntry: (id: string) => void;
  screeningProfile?: PatientProfile;
  availableMouthLocations?: MouthMapLocationItem[];
  onClose?: () => void;
  language?: AppLanguage | 'hinglish';
}

const COMMON_SYMPTOMS = [
  'Mouth Ulcer / Sore',
  'White Patch (Leukoplakia-like)',
  'Red Mucosal Patch',
  'Cheek / Tongue Pain or Burning',
  'Gum Swelling / Bleeding',
  'Reduced Mouth Opening / Stiffness',
  'Difficulty Swallowing',
  'Rough / Thickened Tissue',
];

const STATUS_CONFIG: Record<
  SymptomProgressStatus,
  {
    label: string;
    hindiLabel: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeBg: string;
    badgeText: string;
    border: string;
  }
> = {
  better: {
    label: 'Better',
    hindiLabel: 'बेहतर (सुधार हुआ)',
    description: 'Reduced pain, shrinking lesion, or improving comfort',
    icon: TrendingDown,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  same: {
    label: 'Same',
    hindiLabel: 'वैसा ही (समान)',
    description: 'No noticeable change, persistent lesion or sensation',
    icon: Minus,
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    border: 'border-amber-300',
  },
  worse: {
    label: 'Worse',
    hindiLabel: 'अधिक ख़राब (बढ़ गया)',
    description: 'Increased size, spreading, new bleeding, or intensifying pain',
    icon: TrendingUp,
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    border: 'border-rose-300',
  },
  gone: {
    label: 'Gone',
    hindiLabel: 'ठीक हो गया (गायब)',
    description: 'Completely healed and symptom-free',
    icon: CheckCircle2,
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    border: 'border-teal-300',
  },
};

export const SymptomProgressTracker: React.FC<SymptomProgressTrackerProps> = ({
  entries = [],
  onAddEntry,
  onDeleteEntry,
  screeningProfile,
  availableMouthLocations = [],
  onClose,
  language = 'en',
}) => {
  const isHindi = language === 'hi';
  const isHinglish = language === 'hinglish';

  const [showAddForm, setShowAddForm] = useState<boolean>(entries.length === 0);

  // Form states
  const defaultSymptom = screeningProfile?.mainConcern || 'Mouth Ulcer / Sore';
  const defaultLoc = availableMouthLocations.length > 0 ? availableMouthLocations[0].id : '';

  const [symptom, setSymptom] = useState<string>(defaultSymptom);
  const [selectedLocation, setSelectedLocation] = useState<string>(defaultLoc);
  const [status, setStatus] = useState<SymptomProgressStatus>('same');
  const [note, setNote] = useState<string>('');

  // Active filter for timeline
  const [selectedSymptomFilter, setSelectedSymptomFilter] = useState<string>('All');

  // Handle submit new progress log
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptom.trim()) return;

    const locName = selectedLocation ? (ORAL_REGIONS[selectedLocation]?.name || selectedLocation) : null;

    const newEntry: SymptomProgressEntry = {
      id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      concernId: null,
      symptom: symptom.trim(),
      location: locName,
      status: status,
      note: note.trim(),
      recordedAt: new Date().toISOString(),
    };

    onAddEntry(newEntry);
    setNote('');
    setShowAddForm(false);
  };

  // Group entries by unique symptoms for multi-symptom summary
  const uniqueSymptoms = Array.from(new Set(entries.map((e) => e.symptom)));

  // Latest status for each symptom
  const latestStatusPerSymptom = uniqueSymptoms.map((sym) => {
    const matching = entries
      .filter((e) => e.symptom === sym)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return {
      symptom: sym,
      latest: matching[0],
      historyCount: matching.length,
    };
  });

  // Filtered timeline entries (chronological descending: newest first)
  const sortedEntries = [...entries]
    .filter((e) => selectedSymptomFilter === 'All' || e.symptom === selectedSymptomFilter)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  return (
    <div
      id="oralguard-symptom-progress-tracker"
      className="flex-1 flex flex-col bg-slate-50 overflow-y-auto max-w-2xl mx-auto w-full p-3 sm:p-4 space-y-4"
    >
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {isHindi ? 'लक्षण एवं प्रगति ट्रैकर' : 'Symptom & Progress Tracker'}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {entries.length} {entries.length === 1 ? 'Log' : 'Logs'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'समय के साथ मौखिक लक्षणों के बदलाव का कालक्रमबद्ध रिकॉर्ड'
                : 'Chronological timeline of mucosal changes and healing progression'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            id="btn-close-tracker"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Medical Safety Disclaimer */}
      <div
        id="symptom-tracker-disclaimer"
        className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-950 shadow-2xs"
      >
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-blue-900">
          <strong>Important Clinical Reminder:</strong> Symptom tracking is for personal documentation and follow-up reference only. It does not replace professional medical evaluation. Any mouth sore or ulcer lasting more than 2 weeks warrants an in-person dental exam.
        </p>
      </div>

      {/* Current / Latest Status Summary Cards (if entries exist) */}
      {latestStatusPerSymptom.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
            Current Status Overview ({latestStatusPerSymptom.length} {latestStatusPerSymptom.length === 1 ? 'Concern' : 'Concerns'})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {latestStatusPerSymptom.map((item) => {
              const cfg = STATUS_CONFIG[item.latest.status];
              const IconComp = cfg.icon;

              return (
                <div
                  key={item.symptom}
                  className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 truncate">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {item.symptom}
                    </span>
                    {item.latest.location && (
                      <span className="text-[10.5px] text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                        <span className="truncate">{item.latest.location}</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      Updated: {new Date(item.latest.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.border}`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{cfg.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.historyCount} {item.historyCount === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Progress Entry Button / Form Toggle */}
      {!showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          id="btn-open-add-progress"
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Symptom / Progress Entry</span>
        </button>
      )}

      {/* ADD PROGRESS ENTRY FORM */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          id="form-add-symptom-progress"
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>Record Symptom Update</span>
            </h3>
            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Symptom Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Symptom / Area of Concern
            </label>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {COMMON_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSymptom(s)}
                  className={`text-[10.5px] px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                    symptom === s
                      ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="e.g. White patch on cheek, Tongue ulcer..."
              id="input-progress-symptom"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Anatomical Location Association */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Anatomical Location (Optional)</span>
            </label>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              id="select-progress-location"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="">-- General / Not specified --</option>
              {Object.values(ORAL_REGIONS).map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Status Radio Choices: Better, Same, Worse, Gone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              How has this symptom changed?
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['better', 'same', 'worse', 'gone'] as SymptomProgressStatus[]).map((st) => {
                const cfg = STATUS_CONFIG[st];
                const IconComp = cfg.icon;
                const isCurrent = status === st;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    id={`btn-status-${st}`}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isCurrent
                        ? `${cfg.badgeBg} ${cfg.border} ring-1 ring-teal-600`
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <IconComp
                      className={`w-5 h-5 ${isCurrent ? cfg.badgeText : 'text-slate-500'}`}
                    />
                    <span className={`text-xs font-bold ${isCurrent ? cfg.badgeText : 'text-slate-800'}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[9.5px] text-slate-500 line-clamp-1">
                      {isHindi ? cfg.hindiLabel.split('(')[0] : cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Observation Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Optional Note / Details
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Pain decreased with saltwater rinse, but ulcer size is still about 5mm..."
              id="textarea-progress-note"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              id="btn-save-progress-entry"
              className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Progress Entry</span>
            </button>

            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* CHRONOLOGICAL TIMELINE */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chronological Progress Timeline ({sortedEntries.length})
            </span>
          </div>

          {/* Filter by symptom if multiple */}
          {uniqueSymptoms.length > 1 && (
            <select
              value={selectedSymptomFilter}
              onChange={(e) => setSelectedSymptomFilter(e.target.value)}
              className="text-[11px] p-1 bg-white border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="All">All Symptoms</option>
              {uniqueSymptoms.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          )}
        </div>

        {sortedEntries.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs text-slate-500">No progress entries recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-3 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {sortedEntries.map((entry) => {
              const cfg = STATUS_CONFIG[entry.status];
              const IconComp = cfg.icon;

              return (
                <div
                  key={entry.id}
                  className="relative bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-4 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white ring-2 ring-teal-100 flex items-center justify-center shadow-xs" />

                  {/* Top line: Symptom title & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {entry.symptom}
                      </span>
                      {entry.location && (
                        <span className="text-[10.5px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-600" />
                          <span>{entry.location}</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.border} shrink-0`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{cfg.label}</span>
                    </span>
                  </div>

                  {/* Note */}
                  {entry.note && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {entry.note}
                    </p>
                  )}

                  {/* Footer: Date timestamp & Delete */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(entry.recordedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      title="Delete Entry"
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
