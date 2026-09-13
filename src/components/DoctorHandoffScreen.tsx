/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cigarette,
  Wine,
  Camera,
  MapPin,
  TrendingUp,
  Copy,
  Check,
  Download,
  Share2,
  Printer,
  ChevronLeft,
  Calendar,
  ShieldAlert,
  Info,
  ExternalLink,
  PhoneCall,
  Stethoscope,
  HeartHandshake
} from 'lucide-react';
import { ClinicalIndicators, AssessmentResult, ScreeningConcernLevel } from '../types';

interface DoctorHandoffScreenProps {
  indicators: ClinicalIndicators;
  assessmentResult: AssessmentResult | null;
  onBack: () => void;
  onFindDoctors: () => void;
  onOpenHelplines: () => void;
  onOpenEmergencyGuidance: () => void;
}

export function DoctorHandoffScreen({
  indicators,
  assessmentResult,
  onBack,
  onFindDoctors,
  onOpenHelplines,
  onOpenEmergencyGuidance,
}: DoctorHandoffScreenProps) {
  const [activeTab, setActiveTab] = useState<'card_view' | 'ehr_text'>('card_view');
  const [copied, setCopied] = useState<boolean>(false);
  const [shared, setShared] = useState<boolean>(false);

  const lang = indicators.detectedLanguage || 'en';
  const isHindi = lang === 'hi';
  const isMarathi = lang === 'mr';

  const doctorSummary = assessmentResult?.doctorSummaryText || '';
  const concernLevel: ScreeningConcernLevel = assessmentResult?.screeningConcern || 'LOW SCREENING CONCERN';

  const isHighConcern = concernLevel === 'HIGH SCREENING CONCERN';
  const isModerateConcern = concernLevel === 'MODERATE SCREENING CONCERN';

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(doctorSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = doctorSummary;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadReport = () => {
    const blob = new Blob([doctorSummary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OralGuard_Clinical_Handoff_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OralGuard AI — Clinical Screening Summary',
          text: doctorSummary,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch {
        // user cancelled or share failed, fallback to copy
        handleCopySummary();
      }
    } else {
      handleCopySummary();
    }
  };

  // Extract confirmed findings
  const confirmedPositives = indicators.confirmedPositiveFindings || [];
  const confirmedNegatives = indicators.confirmedNegativeFindings || [];
  const unknownFindings = indicators.unknownFindings || [];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isHindi ? 'परिणाम पर वापस' : 'Back to Results'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              {isHindi ? 'डॉक्टर हैंडऑफ' : 'Clinical Handoff'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 max-w-2xl mx-auto w-full space-y-4 pb-12">
        {/* Title and Intro */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>{isHindi ? 'क्लिनिकल डॉक्टर हैंडऑफ रिपोर्ट' : 'Doctor Handoff Summary'}</span>
            </h1>
            <span className="text-[11px] text-slate-500 font-mono">
              {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isHindi
              ? 'यह रिपोर्ट आपके द्वारा पुष्टि की गई जानकारी के आधार पर तैयार की गई है, ताकि आप अपने चिकित्सक या दंत चिकित्सक के साथ परामर्श के समय इसे साझा कर सकें।'
              : 'Structured summary based strictly on confirmed screening session data to assist in-person evaluation by a qualified dental or medical specialist.'}
          </p>
        </div>

        {/* View Mode Toggle & Action Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('card_view')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'card_view'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'क्लिनिकल कार्ड व्यू' : 'Structured View'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ehr_text')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'ehr_text'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'EHR टेक्स्ट फॉर्मेट' : 'EHR Text Export'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? (isHindi ? 'कॉपी हुआ' : 'Copied') : (isHindi ? 'कॉपी' : 'Copy')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="p-2 text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Download .txt"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHindi ? 'डाउनलोड' : 'Download'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{shared ? 'Shared' : isHindi ? 'शेयर' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer hidden md:flex"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isHindi ? 'प्रिंट' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Structured Clinical Card View */}
        {activeTab === 'card_view' && (
          <div className="space-y-3.5">
            {/* 1. Screening Concern Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                isHighConcern
                  ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                  : isModerateConcern
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white tracking-wide ${
                      isHighConcern ? 'bg-rose-700' : isModerateConcern ? 'bg-amber-600' : 'bg-emerald-700'
                    }`}
                  >
                    {concernLevel}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {assessmentResult?.suggestedTimeframe}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium pt-1">
                  {assessmentResult?.recommendation}
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                {isHighConcern ? (
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                ) : (
                  <Activity className="w-6 h-6 text-teal-600" />
                )}
              </div>
            </div>

            {/* 2. Patient Demographics & Language */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>{isHindi ? 'रोगी की सामान्य जानकारी (Voluntary)' : 'Patient Demographic Context'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                  <span className="font-semibold text-slate-800">{indicators.patientName || 'Self / Anonymous'}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Age</span>
                  <span className="font-semibold text-slate-800">{indicators.patientAge || indicators.age || 'Adult (Not specified)'}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Biological Sex</span>
                  <span className="font-semibold text-slate-800">{indicators.patientSex || indicators.gender || 'Not specified'}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Language</span>
                  <span className="font-semibold text-slate-800">
                    {lang === 'hi' ? 'Hindi (हिन्दी)' : lang === 'mr' ? 'Marathi (मराठी)' : 'English'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Chief Complaint & Anatomical Localization */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>{isHindi ? 'मुख्य समस्या एवं शारीरिक स्थिति' : 'Chief Concern & Anatomical Location'}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Reported Concern:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {indicators.mainConcern || indicators.ulcerDetails || 'Oral mucosal checkup'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Anatomical Site(s):</span>
                  <span className="font-semibold text-teal-800 text-right">
                    {indicators.primarySymptomLocation ||
                      (indicators.affectedRegions && indicators.affectedRegions.length > 0
                        ? indicators.affectedRegions.join(', ')
                        : 'Unspecified / Diffuse')}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Duration & Chronicity:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {indicators.durationOverTwoWeeks === true
                      ? '⚠️ Over 2 Weeks (Persistent > 14 days)'
                      : indicators.durationOverTwoWeeks === false
                      ? 'Recent onset (< 2 weeks)'
                      : indicators.durationText || 'Uncertain / Unknown by patient'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 py-1">
                  <span className="text-slate-500 font-medium">Discoloration / Patch:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {indicators.colorChanges && indicators.colorChanges !== 'none'
                      ? `${indicators.colorChanges.toUpperCase()} mucosal patch`
                      : indicators.colorChanges === 'none'
                      ? 'None reported (normal mucosal color)'
                      : 'Not reported'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Strict Confirmed Findings Triaging (Positives, Negatives, Unknowns) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>{isHindi ? 'नैदानिक निष्कर्ष (सत्यापित डेटा)' : 'Clinical Findings (Traceable Evidence)'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Positive vs Negative vs Unknown</span>
              </div>

              {/* Positives */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Confirmed Positive Findings ({confirmedPositives.length})</span>
                </span>
                {confirmedPositives.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {confirmedPositives.map((pos, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-200 rounded-lg text-xs font-medium"
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic pl-4">No active red flags or positive symptoms confirmed.</p>
                )}
              </div>

              {/* Explicit Negatives */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Confirmed Negative Findings ({confirmedNegatives.length})</span>
                </span>
                {confirmedNegatives.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {confirmedNegatives.map((neg, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-medium"
                      >
                        {neg}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic pl-4">No specific negative symptoms recorded.</p>
                )}
              </div>

              {/* Unknowns / Unassessed */}
              {unknownFindings.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Uncertain / Unknown Findings ({unknownFindings.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {unknownFindings.map((unk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs"
                      >
                        {unk} (Patient uncertain)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Habit Stratification & Exposures */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                <Cigarette className="w-4 h-4 text-amber-600" />
                <span>{isHindi ? 'तंबाकू, सुपारी व अन्य आदतें' : 'Tobacco, Areca & Alcohol Exposure History'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Smokeless (Gutka / Khaini / Zarda)</span>
                  <span className="font-semibold text-slate-800 block">
                    {indicators.tobaccoSmokeless && indicators.tobaccoSmokeless !== 'none'
                      ? `⚠️ ${indicators.tobaccoSmokeless.toUpperCase()} reported`
                      : indicators.tobaccoSmokeless === 'none'
                      ? '✅ Confirmed None (Zero smokeless tobacco)'
                      : 'Not assessed / Not reported'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Smoking (Bidi / Cigarettes)</span>
                  <span className="font-semibold text-slate-800 block">
                    {indicators.tobaccoSmoked && indicators.tobaccoSmoked !== 'none'
                      ? `⚠️ ${indicators.tobaccoSmoked.toUpperCase()} ${indicators.tobaccoFrequency ? `(${indicators.tobaccoFrequency})` : ''}`
                      : indicators.tobaccoSmoked === 'none'
                      ? '✅ Confirmed Non-smoker'
                      : 'Not assessed / Not reported'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Areca Nut / Supari</span>
                  <span className="font-semibold text-slate-800 block">
                    {indicators.arecaOrBetelNut && indicators.arecaOrBetelNut !== 'none'
                      ? `⚠️ ${indicators.arecaOrBetelNut.toUpperCase()} reported`
                      : indicators.arecaOrBetelNut === 'none'
                      ? '✅ Confirmed None'
                      : 'Not assessed / Not reported'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Alcohol Intake</span>
                  <span className="font-semibold text-slate-800 block">
                    {indicators.alcoholIntake === 'heavy' || indicators.alcoholUse === 'heavy'
                      ? '⚠️ Regular / Heavy alcohol intake'
                      : indicators.alcoholIntake === 'moderate' || indicators.alcoholUse === 'occasional'
                      ? 'Occasional / Moderate intake'
                      : indicators.alcoholIntake === 'none' || indicators.alcoholUse === 'none'
                      ? '✅ Confirmed Zero alcohol'
                      : 'Not assessed / Not reported'}
                  </span>
                </div>
              </div>

              {indicators.combinedTobaccoAlcohol && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Synergistic Exposure:</strong> Combined tobacco and alcohol consumption multiplies epithelial susceptibility to oncogenesis.
                  </span>
                </div>
              )}
            </div>

            {/* 6. Attached Documentation & Artifacts */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                <Camera className="w-4 h-4 text-teal-600" />
                <span>{isHindi ? 'संलग्न प्रलेखन व फोटो' : 'Attached Clinical Artifacts & Logs'}</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Mouth Map */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>Mouth Map Pinned Regions:</span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {indicators.mouthMapLocations && indicators.mouthMapLocations.length > 0
                      ? `${indicators.mouthMapLocations.length} Region(s) confirmed`
                      : 'None pinned'}
                  </span>
                </div>

                {/* Photos */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <Camera className="w-3.5 h-3.5 text-teal-600" />
                    <span>Documented Photos:</span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {indicators.photoDocumentation && indicators.photoDocumentation.length > 0
                      ? `${indicators.photoDocumentation.length} photo(s) available for inspection`
                      : '0 photos attached'}
                  </span>
                </div>

                {/* Symptom Tracker */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                    <span>Longitudinal Progress Logs:</span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {indicators.symptomProgress && indicators.symptomProgress.length > 0
                      ? `${indicators.symptomProgress.length} log entry/entries recorded`
                      : '0 logs recorded'}
                  </span>
                </div>

                {/* Cessation Plan */}
                {indicators.tobaccoUse && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50 border border-teal-100">
                    <span className="flex items-center gap-2 font-medium text-teal-800">
                      <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                      <span>Cessation Support Goal:</span>
                    </span>
                    <span className="font-semibold text-teal-900">
                      {indicators.tobaccoUse.goal === 'quit'
                        ? 'Active Quit Goal'
                        : indicators.tobaccoUse.goal === 'reduce'
                        ? 'Reduction Goal'
                        : 'Information & Awareness'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 7. Questions to Ask Doctor */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300 border-b border-slate-800 pb-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>Recommended Questions for Your Healthcare Provider</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
                <li>Could you perform a complete tactile and visual inspection of my oral mucosa?</li>
                <li>Does this presentation suggest a benign traumatic sore or a precancerous lesion?</li>
                <li>Is a diagnostic tissue biopsy or follow-up in 10-14 days advised?</li>
                <li>What topical or medical measures will promote healing and protect the mucosal barrier?</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Raw EHR Text Format */}
        {activeTab === 'ehr_text' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                <span className="font-mono font-semibold">Standard Clinical Text Export (UTF-8)</span>
                <span>Selectable & Formatted for EHR input</span>
              </div>
              <pre className="font-mono text-[11px] leading-relaxed text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200 overflow-x-auto whitespace-pre-wrap select-text">
                {doctorSummary}
              </pre>
            </div>
          </div>
        )}

        {/* Mandatory Medical Integrity Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] space-y-1 leading-relaxed">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-700" />
            <span>Clinical Reference & Non-Diagnostic Disclaimer</span>
          </div>
          <p>
            This summary is generated by OralGuard AI strictly as an awareness and clinical screening-support tool. It does not constitute a medical diagnosis, pathology report, or prescription. Only a qualified dentist, maxillofacial surgeon, or ENT oncologist can diagnose oral lesions.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onFindDoctors}
            className="py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>{isHindi ? 'डॉक्टर / अस्पताल खोजें' : 'Find Specialists'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenHelplines}
            className="py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-teal-600" />
            <span>{isHindi ? 'हेल्पलाइन नंबर (104/112)' : 'Verified Helplines'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenEmergencyGuidance}
            className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{isHindi ? 'आपातकालीन निर्देश' : 'Emergency Signs'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
