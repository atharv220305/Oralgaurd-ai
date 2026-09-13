/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Feature 12: Follow-up & Reminder System
 * Schedule and track oral health follow-ups, rechecks for non-healing ulcers/patches,
 * and post-consultation tracking. Safe prototype reminders with local persistence.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  Bell,
  MapPin,
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { PatientProfile, FollowUpItem, FollowUpStatus, AppLanguage } from '../types';
import { getUIText } from '../data/translations';

interface FollowUpScreenProps {
  indicators: PatientProfile;
  setIndicators: React.Dispatch<React.SetStateAction<PatientProfile>>;
  onBack: () => void;
  onOpenTracker: (concernId?: string) => void;
  onOpenDoctorHandoff: () => void;
  onOpenFinder: () => void;
}

export const FollowUpScreen: React.FC<FollowUpScreenProps> = ({
  indicators,
  setIndicators,
  onBack,
  onOpenTracker,
  onOpenDoctorHandoff,
  onOpenFinder,
}) => {
  const currentLang: AppLanguage = indicators.detectedLanguage || 'en';
  const t = getUIText(currentLang);

  const followUps = indicators.followUps || [];

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FollowUpItem | null>(null);

  // Form states
  const [formReason, setFormReason] = useState<string>('Recheck non-healing mouth ulcer (>2 weeks)');
  const [customReason, setCustomReason] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // default 2 weeks
    return d.toISOString().split('T')[0];
  });
  const [formLocation, setFormLocation] = useState<string>(indicators.primarySymptomLocation || '');
  const [formNote, setFormNote] = useState<string>('');

  const PRESET_REASONS = [
    {
      id: 'ulcer_2wk',
      label: 'Recheck non-healing mouth ulcer (>2 weeks)',
      labelHi: '2 सप्ताह से पुराने छाले की पुनः जांच (Recheck Ulcer)',
      labelMr: '२ आठवड्यांपेक्षा जुन्या फोडाची पुन्हा तपासणी',
      days: 14,
    },
    {
      id: 'patch_review',
      label: 'Review red or white patch progression',
      labelHi: 'सफेद या लाल पैच की प्रगति की जांच (Patch Review)',
      labelMr: 'पांढऱ्या किंवा लाल डागांची प्रगती तपासणे',
      days: 14,
    },
    {
      id: 'post_biopsy',
      label: 'Post-dental consultation or biopsy review',
      labelHi: 'दंत परामर्श या बायोप्सी रिपोर्ट की समीक्षा',
      labelMr: 'दंत तपासणी किंवा बायोप्सी अहवालाचे पुनरावलोकन',
      days: 7,
    },
    {
      id: 'cessation_milestone',
      label: 'Tobacco / Gutka cessation milestone (14-day check)',
      labelHi: 'तंबाकू/गुटखा मुक्ति 14-दिवसीय मील का पत्थर',
      labelMr: 'तंबाखू/गुटखा मुक्ती १४ दिवसांचा टप्पा तपासणी',
      days: 14,
    },
    {
      id: 'routine_6mo',
      label: 'Routine 6-month oral health checkup',
      labelHi: 'नियमित 6-मासिक दंत एवं मुँह की जांच',
      labelMr: 'दर ६ महिन्यांची नियमित दंत तपासणी',
      days: 180,
    },
  ];

  const handleSelectPresetReason = (reasonText: string, defaultDays: number) => {
    setFormReason(reasonText);
    const d = new Date();
    d.setDate(d.getDate() + defaultDays);
    setFormDate(d.toISOString().split('T')[0]);
  };

  const handleSetQuickDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFormDate(d.toISOString().split('T')[0]);
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = formReason === 'custom' ? customReason.trim() : formReason;
    if (!finalReason) return;

    if (editingItem) {
      const updatedList = followUps.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            reason: finalReason,
            scheduledDate: formDate,
            mouthLocation: formLocation || undefined,
            note: formNote.trim(),
          };
        }
        return item;
      });
      setIndicators((prev) => ({ ...prev, followUps: updatedList }));
    } else {
      const newItem: FollowUpItem = {
        id: `followup-${Date.now()}`,
        concernId: indicators.hasLesionOrUlcer ? 'concern-primary' : null,
        reason: finalReason,
        scheduledDate: formDate,
        mouthLocation: formLocation || undefined,
        note: formNote.trim(),
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      };
      setIndicators((prev) => ({ ...prev, followUps: [newItem, ...followUps] }));
    }

    setShowAddModal(false);
    setEditingItem(null);
    setFormNote('');
    setCustomReason('');
  };

  const handleToggleComplete = (id: string) => {
    const updated = followUps.map((item) => {
      if (item.id === id) {
        const nextStatus: FollowUpStatus = item.status === 'completed' ? 'upcoming' : 'completed';
        return {
          ...item,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });
    setIndicators((prev) => ({ ...prev, followUps: updated }));
  };

  const handleDelete = (id: string) => {
    const updated = followUps.filter((item) => item.id !== id);
    setIndicators((prev) => ({ ...prev, followUps: updated }));
  };

  const handleOpenEdit = (item: FollowUpItem) => {
    setEditingItem(item);
    const isPreset = PRESET_REASONS.some((r) => r.label === item.reason);
    if (isPreset) {
      setFormReason(item.reason);
      setCustomReason('');
    } else {
      setFormReason('custom');
      setCustomReason(item.reason);
    }
    setFormDate(item.scheduledDate);
    setFormLocation(item.mouthLocation || '');
    setFormNote(item.note || '');
    setShowAddModal(true);
  };

  const upcomingItems = followUps.filter((f) => f.status === 'upcoming');
  const completedItems = followUps.filter((f) => f.status === 'completed');

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h1 className="text-sm font-bold text-slate-900">{t.followUpHeading}</h1>
            </div>
            <p className="text-[11px] text-slate-500">{t.followUpSub}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setFormReason(PRESET_REASONS[0].label);
            setCustomReason('');
            const d = new Date();
            d.setDate(d.getDate() + 14);
            setFormDate(d.toISOString().split('T')[0]);
            setFormLocation(indicators.primarySymptomLocation || '');
            setFormNote('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addFollowUpBtn}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="p-4 max-w-3xl mx-auto w-full space-y-4 flex-1">
        {/* Prototype Reminder Banner */}
        <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5 shadow-2xs">
          <Bell className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-indigo-900">
              {currentLang === 'hi'
                ? 'प्रोटोटाइप अनुस्मारक (Reminder System)'
                : currentLang === 'mr'
                ? 'प्रोटोटाइप स्मरणपत्र (Reminder System)'
                : 'Prototype Follow-up Reminder System'}
            </span>
            <p className="text-[11px] text-indigo-800/90 leading-relaxed">
              {t.scheduleFollowUpNotice}
            </p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.upcomingFollowUps} ({upcomingItems.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.completedFollowUps} ({completedItems.length})
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={onOpenDoctorHandoff}
              className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Handoff</span>
            </button>
          </div>
        </div>

        {/* Tab Items List */}
        {activeTab === 'upcoming' ? (
          upcomingItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">{t.noUpcomingFollowUps}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {currentLang === 'hi'
                  ? 'यदि आपके मुँह में कोई छाला या लाल/सफेद पैच है, तो 2 सप्ताह बाद की पुनः जांच का फॉलो-अप शेड्यूल करें।'
                  : currentLang === 'mr'
                  ? 'जर आपल्या तोंडात फोड किंवा डाग असेल, तर २ आठवड्यांनंतरच्या फेरतपासणीचे स्मरणपत्र जोडा.'
                  : 'Scheduling a 14-day follow-up allows you to track whether a mouth sore or patch is resolving as expected.'}
              </p>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addFollowUpBtn}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingItems.map((item) => {
                const targetDate = new Date(item.scheduledDate);
                const today = new Date();
                const diffTime = targetDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays < 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isOverdue
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : diffDays <= 3
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isOverdue
                              ? `Due ${Math.abs(diffDays)} days ago`
                              : diffDays === 0
                              ? 'Due Today'
                              : `Due in ${diffDays} days`}
                          </span>

                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.scheduledDate}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">{item.reason}</h3>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.mouthLocation && (
                      <div className="flex items-center gap-1.5 text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/80 w-fit">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-medium">{item.mouthLocation}</span>
                      </div>
                    )}

                    {item.note && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        {item.note}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <button
                        onClick={() => onOpenTracker(item.concernId || undefined)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>
                          {currentLang === 'hi'
                            ? 'लक्षण प्रगति दर्ज करें'
                            : currentLang === 'mr'
                            ? 'लक्षण प्रगती नोंदवा'
                            : 'Log Symptom Progress'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleToggleComplete(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.markCompletedBtn}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : completedItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No completed follow-ups yet</h3>
            <p className="text-xs text-slate-500">
              When you re-check or visit your dentist, mark follow-ups as completed to record your care timeline.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs space-y-2.5 bg-emerald-50/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        COMPLETED
                      </span>
                      <span className="text-xs text-slate-500">
                        Scheduled: {item.scheduledDate}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{item.reason}</h3>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {item.mouthLocation && (
                  <p className="text-xs text-slate-600">
                    <strong>Location:</strong> {item.mouthLocation}
                  </p>
                )}

                {item.completedAt && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    ✓ Completed on: {new Date(item.completedAt).toLocaleDateString()}
                  </p>
                )}

                <div className="pt-2 border-t border-emerald-100 flex justify-end">
                  <button
                    onClick={() => handleToggleComplete(item.id)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Re-open Follow-up
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Follow-up Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingItem ? t.editFollowUpBtn : t.addFollowUpBtn}
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFollowUp} className="space-y-3.5 text-xs">
                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">{t.reasonLabel}</label>
                  <div className="space-y-1.5">
                    {PRESET_REASONS.map((preset) => {
                      const label =
                        currentLang === 'hi'
                          ? preset.labelHi
                          : currentLang === 'mr'
                          ? preset.labelMr
                          : preset.label;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPresetReason(preset.label, preset.days)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                            formReason === preset.label
                              ? 'border-indigo-600 bg-indigo-50/80 font-semibold text-indigo-950 ring-1 ring-indigo-600'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setFormReason('custom')}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                        formReason === 'custom'
                          ? 'border-indigo-600 bg-indigo-50/80 font-semibold text-indigo-950 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {currentLang === 'hi'
                        ? 'अन्य कस्टम कारण लिखें'
                        : currentLang === 'mr'
                        ? 'इतर सानुकूल कारण लिहा'
                        : 'Custom Reason'}
                    </button>
                  </div>

                  {formReason === 'custom' && (
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Enter custom follow-up reason..."
                      className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  )}
                </div>

                {/* Scheduled Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">{t.dateLabel}</label>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] text-slate-500">Quick set:</span>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDateOffset(7)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700"
                    >
                      +7 Days (1 Wk)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDateOffset(14)}
                      className="px-2 py-1 rounded bg-indigo-100 text-indigo-900 font-semibold text-[11px]"
                    >
                      +14 Days (2 Wks)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDateOffset(30)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700"
                    >
                      +30 Days (1 Mo)
                    </button>
                  </div>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Mouth Location */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Mouth Area / Location (Optional)</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Left Lateral Tongue, Right Inner Cheek"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">{t.notesLabel}</label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Inspect ulcer margin, check if size decreased or pain lessened..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-xs"
                  >
                    {t.saveFollowUpBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
