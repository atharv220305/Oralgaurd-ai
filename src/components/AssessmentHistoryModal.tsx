/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Assessment History & Profile Modal
 * Shows past screening records saved in Cloud Firestore for this patient,
 * with options to view findings or switch between past records.
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
}

export const AssessmentHistoryModal: React.FC<AssessmentHistoryModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
  currentProfile,
  currentAssessment,
  onSelectPastAssessment,
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
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

            {/* Historic List */}
            <div className="space-y-2">
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
                <div className="py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  <FileText className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {isHindi ? 'कोई पुराना रिकॉर्ड नहीं मिला' : isMarathi ? 'कोणताही जुना रेकॉर्ड आढळला नाही' : 'No previous assessments recorded'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isHindi
                      ? 'स्क्रीनिंग पूरा करने पर आपके परिणाम यहाँ दिखाई देंगे।'
                      : isMarathi
                      ? 'तपासणी पूर्ण झाल्यावर तुमचे निकाल येथे दिसतील.'
                      : 'When you complete a screening, results will be archived here.'}
                  </p>
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
            <span>OralGuard AI • HIPAA & DPDP Compliant Architecture</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              {isHindi ? 'बंद करें' : isMarathi ? 'बंद करा' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
