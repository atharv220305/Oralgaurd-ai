/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Assessment History & Profile Modal
 * Shows past screening records saved in Cloud Firestore for this patient,
 * with options to view findings or switch between past records.
 * Features an illustrative, informative empty state guiding users on their first check.
 */

import React, { useEffect, useState } from 'react';
import {
  History,
  X,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ChevronRight,
  Database,
  CloudCheck,
  RefreshCw,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Mic,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssessmentResult, PatientProfile, AppLanguage } from '../types';
import {
  loadAssessmentHistory,
  getOrCreatePatientId,
} from '../services/firestorePersistence';

interface AssessmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
  currentProfile?: PatientProfile;
  currentAssessment?: AssessmentResult | null;
  onSelectPastAssessment?: (assessment: AssessmentResult) => void;
  onStartNewScreening?: (starterText?: string) => void;
}

export const AssessmentHistoryModal: React.FC<AssessmentHistoryModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
  currentProfile,
  currentAssessment,
  onSelectPastAssessment,
  onStartNewScreening,
}) => {
  const [historyItems, setHistoryItems] = useState<
    Array<{ id: string; assessment: AssessmentResult; createdAt: any }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const patientId = getOrCreatePatientId();

  const isHindi = language === 'hi';
  const isMarathi = language === 'mr';

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsLoading(true);

    loadAssessmentHistory(patientId)
      .then((items) => {
        if (mounted) {
          setHistoryItems(items);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading history:', err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  const handleStartCheck = (promptText?: string) => {
    onClose();
    if (onStartNewScreening) {
      onStartNewScreening(promptText);
    }
  };

  const starterExamples = isHindi
    ? [
        { label: 'मसूड़ों से खून आना', text: 'ब्रश करते समय मसूड़ों से खून आता है' },
        { label: 'दांत में झनझनाहट (ठंडा/गर्म)', text: 'ठंडा पानी पीने पर दांतों में तेज झनझनाहट होती है' },
        { label: '2 हफ्ते से अधिक पुराना छाला', text: 'जीभ पर छाला 2 हफ़्ते से ठीक नहीं हो रहा है' },
        { label: 'चबाने पर दांत दर्द', text: 'खाना चबाने पर पीछे के दांत में दर्द होता है' },
      ]
    : isMarathi
    ? [
        { label: 'हिरड्यांतून रक्तस्त्राव', text: 'ब्रश करताना हिरड्यांतून रक्त येते' },
        { label: 'दात आंबणे (थंड/गरम)', text: 'थंड पाणी पिताना दातांमध्ये तीव्र कळ येते' },
        { label: '२ आठवड्यांहून जुना व्रण/फोड', text: 'जीभेवर झालेला फोड २ आठवड्यांपेक्षा जास्त काळ बरा झालेला नाही' },
        { label: 'चावताना दातदुखी', text: 'अन्न चावताना पाठीमागच्या दातात दुखते' },
      ]
    : [
        { label: 'Bleeding gums when brushing', text: 'My gums bleed whenever I brush or floss.' },
        { label: 'Sensitivity to cold/hot', text: 'I feel sharp sensitivity in my molars when drinking cold water.' },
        { label: 'Mouth sore lasting > 2 weeks', text: 'I have a sore inside my cheek that has not healed for over 2 weeks.' },
        { label: 'Pain when chewing', text: 'I experience a dull ache when chewing food on my left side.' },
      ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isHindi
                    ? 'जाँच इतिहास (Assessment History)'
                    : isMarathi
                    ? 'तपासणी इतिहास (Assessment History)'
                    : 'Saved Assessments & Cloud History'}
                </h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Database className="w-3 h-3 text-teal-600 inline" />
                  <span>
                    {isHindi
                      ? 'क्लाउड फ़ायरस्टोर में सुरक्षित रूप से सहेजा गया'
                      : isMarathi
                      ? 'क्लाउड फायरस्टोअरमध्ये सुरक्षित साठवलेले'
                      : 'Persisted to Cloud Firestore'}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {/* Current Active Session Overview */}
            <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  {isHindi ? 'सक्रिय सत्र (Active Session)' : isMarathi ? 'सध्याचे सत्र (Active Session)' : 'Active Screening Session'}
                </span>
                <span className="text-[10px] font-mono bg-teal-100/80 text-teal-800 px-1.5 py-0.5 rounded">
                  ID: {patientId.slice(0, 14)}...
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHindi
                  ? 'आपके लक्षण, मौखिक नक़्शा, और जोखिम निष्कर्ष स्वचालित रूप से क्लाउड पर सुरक्षित हैं। ब्राउज़र रीफ़्रेश करने पर भी आपका डेटा सुरक्षित रहेगा।'
                  : isMarathi
                  ? 'तुमची लक्षणे, तोंडाचा नकाशा आणि निष्कर्ष क्लाउडवर सुरक्षित आहेत. ब्राउझर रीफ्रेश केल्यास डेटा गमावला जाणार नाही.'
                  : 'Your clinical symptoms, oral map locations, and assessment outcomes are continuously synchronized to Cloud Firestore.'}
              </p>
              {currentAssessment && (
                <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {isHindi ? 'वर्तमान स्तर:' : isMarathi ? 'सध्याचा धोका:' : 'Current Concern:'}
                  </span>
                  <span className="font-bold text-teal-800 uppercase">
                    {currentAssessment.screeningConcern} ({currentAssessment.riskLevel})
                  </span>
                </div>
              )}
            </div>

            {/* Historic List or Illustrative Empty State */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>{isHindi ? 'पिछली जाँचें' : isMarathi ? 'मागील तपासण्या' : 'Past Assessment Logs'}</span>
                {isLoading && (
                  <RefreshCw className="w-3 h-3 text-teal-600 animate-spin" />
                )}
              </h4>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-teal-600" />
                  {isHindi ? 'क्लाउड से लोड हो रहा है...' : isMarathi ? 'क्लाउडवरून लोड होत आहे...' : 'Loading assessments from Cloud Firestore...'}
                </div>
              ) : historyItems.length === 0 ? (
                /* Illustrative Empty State with guidance on starting the first conversation */
                <div className="p-4 bg-gradient-to-b from-slate-50 to-teal-50/30 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="text-center space-y-1">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-teal-100/80 text-teal-700 shadow-2xs mb-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-slate-900">
                      {isHindi
                        ? 'कोई पिछला रिकॉर्ड नहीं मिला'
                        : isMarathi
                        ? 'अद्याप मागील तपासणी नोंद नाही'
                        : 'No Previous Screenings Archived Yet'}
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      {isHindi
                        ? 'अपनी पहली मौखिक स्वास्थ्य जांच शुरू करें। पूरा होने पर विस्तृत नैदानिक सारांश यहाँ हमेशा उपलब्ध रहेगा।'
                        : isMarathi
                        ? 'तुमची पहिली तोंड तपासणी सुरू करा. तपासणी पूर्ण झाल्यानंतर अहवाल येथे सुरक्षित जतन केला जाईल.'
                        : 'Start your first conversational screening. When completed, your clinical summary and follow-up timeline will be saved here.'}
                    </p>
                  </div>

                  {/* 3-Step Illustrated Guide */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                      {isHindi ? 'स्क्रीनिंग कैसे काम करती है:' : isMarathi ? 'तपासणी कशी कार्य करते:' : 'How your screening is saved:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1 text-teal-700 font-bold text-[11px]">
                          <Mic className="w-3.5 h-3.5" />
                          <span>1. Share Symptoms</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Speak or type pain, sores, sensitivity, or habits.
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1 text-teal-700 font-bold text-[11px]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>2. Pinpoint & Triage</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          AI triages urgency and marks spots on the mouth map.
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                        <div className="flex items-center gap-1 text-teal-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>3. Care & History</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Get provider handoff summary and permanent archive.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Starter Symptom Prompts */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      {isHindi ? 'त्वरित शुरुआत के लिए एक विषय चुनें:' : isMarathi ? 'सुरुवात करण्यासाठी विषय निवडा:' : 'Select a topic to start your screening:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {starterExamples.map((ex, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleStartCheck(ex.text)}
                          className="p-2 text-left bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl transition-all text-xs group cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-[11px] group-hover:text-teal-950">
                              {ex.label}
                            </span>
                            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-teal-600 shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={() => handleStartCheck()}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'ओरल हेल्थ चैट चेक शुरू करें' : isMarathi ? 'तोंड तपासणी चॅट सुरू करा' : 'Start First Oral Health Screening'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item, idx) => {
                    const concern = String(item.assessment.screeningConcern || 'low').toLowerCase();
                    const risk = String(item.assessment.riskLevel || '').toLowerCase();
                    const isHigh = concern.includes('high') || risk === 'high';
                    const isMod = concern.includes('moderate') || risk === 'medium' || risk === 'moderate';

                    const dateStr = item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString() + ' ' + item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : `Assessment #${historyItems.length - idx}`;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (onSelectPastAssessment) {
                            onSelectPastAssessment(item.assessment);
                            onClose();
                          }
                        }}
                        className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-300 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isHigh
                                  ? 'bg-rose-100 text-rose-800'
                                  : isMod
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {concern}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {dateStr}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 line-clamp-1 font-medium">
                            {item.assessment.summaryOfFindings || item.assessment.doctorSummaryText}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 shrink-0 ml-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Designed with privacy & data-protection principles</span>
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer text-xs"
            >
              {isHindi ? 'बंद करें' : isMarathi ? 'बंद करा' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
