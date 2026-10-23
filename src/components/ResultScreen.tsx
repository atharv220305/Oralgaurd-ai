/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Result Screen: Displays non-diagnostic risk indication, structured summary,
 * and seamless links to Doctor Handoff, Finder, Cessation, Hub, Ask OralGuard, and Follow-ups.
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  FileText,
  Share2,
  X,
  Lock,
  Download,
  HeartHandshake,
  BookOpen,
  Eye,
  Sparkles,
  Flame,
  PhoneCall,
  Hospital,
  MessageSquare,
  History,
  ChevronRight,
  ClipboardList,
  Layers,
  Search,
  Printer,
  FileDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssessmentResult, PatientProfile, AppLanguage } from '../types';
import { getUIText } from '../data/translations';
import { PrivacyTrustFooter } from './PrivacyTrustFooter';

interface ResultScreenProps {
  assessment?: AssessmentResult | null;
  profile?: PatientProfile;
  onBookAppointment: (shareSummaryConsent?: boolean, specialtyFilter?: string) => void;
  onRetake: () => void;
  onStartScreening?: (starterText?: string) => void;
  onOpenScanner?: () => void;
  onOpenTracker?: () => void;
  onOpenMouthMap?: () => void;
  onOpenCessation?: () => void;
  onOpenAwarenessHub?: () => void;
  onOpenDoctorHandoff?: () => void;
  onOpenHelplines?: () => void;
  onOpenEmergencyGuidance?: () => void;
  onOpenAskOralGuard?: () => void;
  onOpenFollowUp?: () => void;
  onOpenHistory?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  assessment,
  profile,
  onBookAppointment,
  onRetake,
  onStartScreening,
  onOpenScanner,
  onOpenTracker,
  onOpenMouthMap,
  onOpenCessation,
  onOpenAwarenessHub,
  onOpenDoctorHandoff,
  onOpenHelplines,
  onOpenEmergencyGuidance,
  onOpenAskOralGuard,
  onOpenFollowUp,
  onOpenHistory,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQuestionsForDentist, setShowQuestionsForDentist] = useState(false);
  const [showDoctorSummaryModal, setShowDoctorSummaryModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [userConsentedToShare, setUserConsentedToShare] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<'all' | 'urgency' | 'findings' | 'recommendations'>('all');
  const [jsonDownloaded, setJsonDownloaded] = useState(false);

  const lang: AppLanguage = (profile?.detectedLanguage as AppLanguage) || 'en';
  const isHindi = lang === 'hi';
  const isMarathi = lang === 'mr';
  const t = getUIText(lang);

  // If no assessment has been completed yet, display an illustrative and informative empty state
  if (!assessment) {
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
      <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-y-auto transition-colors">
        <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 pb-8 flex-1">
          {/* Header */}
          <div className="pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                {isHindi ? 'मूल्यांकन मॉड्यूल' : isMarathi ? 'मूल्यांकन विभाग' : 'Assessment Module'}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {isHindi ? 'निःशुल्क प्रारंभिक जांच' : isMarathi ? 'मोफत प्राथमिक तपासणी' : 'AI-Assisted Triage'}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              {isHindi ? 'मुँह के स्वास्थ्य का समग्र मूल्यांकन' : isMarathi ? 'तोंडाच्या आरोग्याचे सर्वसमावेशक मूल्यांकन' : 'Oral Health & Triage Assessment'}
            </h1>
          </div>

          {/* Illustrative Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-2xs">
              <Stethoscope className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">
                {isHindi
                  ? 'अद्याप कोई सक्रिय मूल्यांकन नहीं है'
                  : isMarathi
                  ? 'अद्याप कोणतेही सक्रिय मूल्यांकन नाही'
                  : 'No Active Assessment Generated Yet'}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isHindi
                  ? 'OralGuard AI एक संक्षिप्त संवादात्मक बातचीत के माध्यम से आपके लक्षणों, आदतों और स्थान का विश्लेषण करके एक संरचित नैदानिक ट्राइएज और डॉक्टर सारांश तैयार करता है।'
                  : isMarathi
                  ? 'OralGuard AI एका लहान चॅट तपासणीद्वारे तुमच्या लक्षणांचे व सवयींचे विश्लेषण करून सविस्तर अहवाल तयार करते.'
                  : 'Complete a brief oral health check to generate your categorized care level, suggested provider specialty, and doctor handoff summary.'}
              </p>
            </div>

            {/* Feature preview pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Care Level</span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-snug">
                  Routine, Moderate, or Priority Triage timeframe.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs">
                  <Hospital className="w-4 h-4" />
                  <span>Provider Match</span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-snug">
                  Specialty recommendations (Dentist, Periodontist, ENT).
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Doctor Note</span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-snug">
                  Formatted summary to share with your dentist.
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => onStartScreening ? onStartScreening() : onRetake()}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isHindi ? 'मौखिक स्वास्थ्य जांच शुरू करें' : isMarathi ? 'तोंड तपासणी चॅट सुरू करा' : 'Start Oral Health Screening'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>

          {/* Starter Questions / Topics Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isHindi ? 'सामान्य लक्षणों से शुरुआत करें:' : isMarathi ? 'सामान्य लक्षणांमधून सुरुवात करा:' : 'Or Start with a Common Symptom:'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {starterExamples.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onStartScreening ? onStartScreening(ex.text) : onRetake()}
                  className="p-3 text-left bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-xl transition-all text-xs group cursor-pointer shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs group-hover:text-teal-900">
                      {ex.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    "{ex.text}"
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Past History Link if available */}
          {onOpenHistory && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <History className="w-4 h-4 text-teal-600" />
                <span>{isHindi ? 'पिछली जाँच रिकॉर्ड देखें' : isMarathi ? 'मागील तपासणी नोंदी पहा' : 'View past assessments archive'}</span>
              </div>
              <button
                type="button"
                onClick={onOpenHistory}
                className="text-teal-700 hover:text-teal-900 font-semibold underline cursor-pointer"
              >
                {isHindi ? 'इतिहास खोलें' : isMarathi ? 'इतिहास उघडा' : 'Open History'}
              </button>
            </div>
          )}
        </div>

        <PrivacyTrustFooter language={lang} />
      </div>
    );
  }

  const { riskLevel, screeningConcern } = assessment;

  const concernConfig = {
    low: {
      badgeText: isHindi ? 'कम जोखिम (Low Concern)' : isMarathi ? 'कमी धोका (Low Concern)' : 'LOW SCREENING CONCERN',
      subText: isHindi
        ? 'कोई गंभीर तीव्र म्यूकोसल चेतावनी संकेत नहीं मिले।'
        : isMarathi
        ? 'कोणतीही गंभीर तीव्र म्यूकोसल चेतावणी लक्षणे आढळली नाहीत.'
        : 'No critical acute mucosal warning signs identified.',
      themeBg: 'bg-emerald-50',
      themeBorder: 'border-emerald-200',
      themeText: 'text-emerald-900',
      badgeBg: 'bg-emerald-700',
      icon: ShieldCheck,
      timeframe: isHindi
        ? 'नियमित दंत जांच (प्रत्येक 6 महीने)'
        : isMarathi
        ? 'नियमित दंत तपासणी (दर ६ महिन्यांनी)'
        : 'Routine dental checkup (every 6 months)',
    },
    medium: {
      badgeText: isHindi ? 'मध्यम जोखिम (Moderate Concern)' : isMarathi ? 'मध्यम धोका (Moderate Concern)' : 'MODERATE SCREENING CONCERN',
      subText: isHindi
        ? 'उल्लेखनीय म्यूकोसल ऊतक परिवर्तन या तंबाकू/सुपारी का जोखिम दर्ज किया गया।'
        : isMarathi
        ? 'म्यूकोसल ऊतींमधील बदल किंवा तंबाखू/सुपारीचे सेवन नोंदवले गेले आहे.'
        : 'Notable mucosal tissue changes or tobacco/areca exposures reported.',
      themeBg: 'bg-amber-50',
      themeBorder: 'border-amber-200',
      themeText: 'text-amber-950',
      badgeBg: 'bg-amber-700',
      icon: AlertTriangle,
      timeframe: isHindi
        ? 'यदि लक्षण 2-3 सप्ताह तक बने रहें तो व्यक्तिगत जांच कराएं'
        : isMarathi
        ? 'लक्षणे २-३ आठवडे राहिल्यास प्रत्यक्ष तपासणी करून घ्या'
        : 'Evaluate in person within 2-3 weeks if persistent',
    },
    high: {
      badgeText: isHindi ? 'उच्च जोखिम (High Concern)' : isMarathi ? 'उच्च धोका (High Concern)' : 'HIGH SCREENING CONCERN',
      subText: isHindi
        ? 'विशेषज्ञ चिकित्सक द्वारा शीघ्र व्यक्तिगत नैदानिक परीक्षण की आवश्यकता है।'
        : isMarathi
        ? 'तज्ज्ञ डॉक्टरांकडून तातडीने प्रत्यक्ष तपासणी आवश्यक आहे.'
        : 'Symptoms warranting prompt clinical in-person examination by a specialist.',
      themeBg: 'bg-rose-50',
      themeBorder: 'border-rose-200',
      themeText: 'text-rose-950',
      badgeBg: 'bg-rose-700',
      icon: ShieldAlert,
      timeframe: isHindi
        ? '7-14 दिनों के भीतर विशेषज्ञ जांच कराएं'
        : isMarathi
        ? '७ ते १४ दिवसांत तज्ज्ञ डॉक्टरांकडून तपासणी करून घ्या'
        : 'Prompt professional evaluation within 7-14 days',
    },
  }[riskLevel];

  const RiskIcon = concernConfig.icon;

  const handleCopyDoctorSummary = () => {
    navigator.clipboard.writeText(assessment.doctorSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSummary = () => {
    const blob = new Blob([assessment.doctorSummaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OralGuard_Screening_Summary_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJsonRecord = () => {
    if (!assessment) return;

    const exportData = {
      formatVersion: '2.0',
      exportType: 'OralGuard Personal Oral Health Record (PHR)',
      exportedAt: new Date().toISOString(),
      detectedLanguage: lang,
      patientProfile: profile
        ? {
            demographics: {
              name: profile.patientName || undefined,
              age: profile.age || profile.patientAge || undefined,
              gender: profile.gender || profile.patientSex || undefined,
              language: profile.detectedLanguage || lang,
              mainConcern: profile.mainConcern || undefined,
            },
            symptoms: {
              primaryLocation: profile.primarySymptomLocation || undefined,
              toothPain: !!profile.toothPain,
              toothSensitivity: !!profile.toothSensitivity,
              toothDecay: !!profile.toothDecay,
              gumBleeding: !!profile.gumBleeding,
              soreBleeding: !!profile.soreBleeding,
              unexplainedBleeding: !!profile.unexplainedBleeding,
              hasLesionOrUlcer: !!profile.hasLesionOrUlcer,
              ulcerDetails: profile.ulcerDetails || undefined,
              duration: profile.duration || profile.durationCategory || undefined,
              durationText: profile.durationText || undefined,
              durationOverTwoWeeks: !!profile.durationOverTwoWeeks,
              oralSwelling: !!profile.oralSwelling,
              colorChanges: profile.colorChanges || undefined,
              thickeningOrLump: !!profile.thickeningOrLump,
              difficultySwallowing: !!profile.difficultySwallowing,
              difficultyChewing: !!profile.difficultyChewing,
              difficultySpeakingOrMovingTongue: !!profile.difficultySpeakingOrMovingTongue,
              reducedMouthOpening: !!profile.reducedMouthOpening,
              dryMouth: !!profile.dryMouth,
              badBreath: !!profile.badBreath,
              jawPain: !!profile.jawPain,
              mouthPainOrBurning: !!profile.mouthPainOrBurning,
              numbnessInMouth: !!profile.numbnessInMouth,
              persistentHoarseness: !!profile.persistentHoarseness,
              neckLumpOrSwelling: !!profile.neckLumpOrSwelling,
            },
            habits: {
              tobaccoSmoked: profile.tobaccoSmoked || undefined,
              tobaccoSmokeless: profile.tobaccoSmokeless || undefined,
              arecaOrBetelNut: profile.arecaOrBetelNut || undefined,
              tobaccoFrequency: profile.tobaccoFrequency || undefined,
              alcoholUse: profile.alcoholUse || profile.alcoholIntake || undefined,
              combinedTobaccoAlcohol: !!profile.combinedTobaccoAlcohol,
              chronicIrritation: !!profile.chronicIrritation,
            },
            oralAnatomyAndConcerns: {
              mouthMapLocations: profile.mouthMapLocations || [],
              toothConcerns: profile.toothConcerns || [],
              oralStructureConcerns: profile.oralStructureConcerns || [],
              missingTeeth: profile.missingTeeth || [],
              concerns: profile.concerns || [],
              userReportedFacts: profile.userReportedFacts || [],
              confirmedPositiveFindings: profile.confirmedPositiveFindings || [],
              confirmedNegativeFindings: profile.confirmedNegativeFindings || [],
            },
          }
        : null,
      assessment: {
        riskLevel: assessment.riskLevel,
        screeningConcern: assessment.screeningConcern,
        careLevel: assessment.careLevel || undefined,
        recommendedProfessional: assessment.recommendedProfessional || undefined,
        identifiedCondition: assessment.identifiedCondition || undefined,
        summaryOfFindings: assessment.summaryOfFindings,
        keyFindings: assessment.keyFindings || [],
        concerns: assessment.concerns || [],
        redFlags: assessment.redFlags || [],
        riskFactors: assessment.riskFactors || [],
        protectiveFactors: assessment.protectiveFactors || [],
        recommendation: assessment.recommendation,
        suggestedTimeframe: assessment.suggestedTimeframe,
        patientQuestions: assessment.patientQuestions || [],
        nextSteps: assessment.nextSteps || [],
        emergency: !!assessment.emergency,
        confidenceNotes: assessment.confidenceNotes,
        disclaimer: assessment.disclaimer,
        doctorSummaryText: assessment.doctorSummaryText,
      },
      notice:
        'AI-assisted screening and risk-triage summary. Formatted for patient personal health records and clinician consultation handoff. Not an autonomous clinical diagnosis.',
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateFormatted = new Date().toISOString().split('T')[0];
    a.download = `OralGuard_Patient_Record_${dateFormatted}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setJsonDownloaded(true);
    setTimeout(() => setJsonDownloaded(false), 3000);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print command was blocked or unavailable:', err);
      setShowPrintModal(true);
    }
  };

  const handleDownloadHtmlReport = () => {
    if (!assessment) return;
    const dateStr = new Date().toLocaleDateString(isHindi ? 'hi-IN' : isMarathi ? 'mr-IN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const reportHtml = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OralGuard Assessment Report - ${assessment.careLevel || 'Clinical Assessment'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px 20px;
      color: #0f172a;
      background-color: #f8fafc;
      line-height: 1.5;
    }
    .report-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 13px;
      color: #0d9488;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge-high { background-color: #ffe4e6; color: #be123c; border: 1px solid #fda4af; }
    .badge-medium { background-color: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
    .badge-low { background-color: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 8px;
    }
    .info-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .info-value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 4px; }
    ul, ol { margin: 8px 0; padding-left: 22px; }
    li { margin-bottom: 6px; font-size: 13px; }
    .doctor-summary-box {
      background: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      border: 1px solid #cbd5e1;
      line-height: 1.6;
    }
    .signature-area {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-top: 44px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
      padding-top: 4px;
    }
    .disclaimer {
      font-size: 11px;
      color: #64748b;
      margin-top: 24px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
      border-left: 3px solid #0d9488;
    }
    .print-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0d9488;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
    }
    .print-button:hover { background: #0f766e; }
    @media print {
      body { background: white; padding: 0; }
      .report-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .print-button { display: none !important; }
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨️ ${isHindi ? 'रिपोर्ट प्रिंट करें / PDF सेव करें' : isMarathi ? 'अहवाल प्रिंट करा / PDF सेव्ह करा' : 'Print or Save as PDF'}</button>
  <div class="report-container">
    <div class="header-bar">
      <div>
        <div class="brand-title">OralGuard AI</div>
        <div class="brand-sub">${isHindi ? 'मुँह स्वास्थ्य व ट्राइएज मूल्यांकन रिपोर्ट' : isMarathi ? 'तोंड आरोग्य व ट्राइएज मूल्यांकन अहवाल' : 'Comprehensive Oral Health Assessment Report'}</div>
      </div>
      <div style="text-align: right;">
        <span class="badge ${riskLevel === 'high' ? 'badge-high' : riskLevel === 'medium' ? 'badge-medium' : 'badge-low'}">
          ${assessment.careLevel ? assessment.careLevel.toUpperCase() : screeningConcern}
        </span>
        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">${isHindi ? 'रिपोर्ट दिनांक' : isMarathi ? 'दिनांक' : 'Date'}: ${dateStr}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="info-card">
        <div class="info-label">${isHindi ? 'जोखिम व ट्राइएज स्तर' : isMarathi ? 'धोका पातळी' : 'Assigned Triage Concern'}</div>
        <div class="info-value">${concernConfig.badgeText}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">${concernConfig.subText}</div>
      </div>
      <div class="info-card">
        <div class="info-label">${isHindi ? 'अनुशंसित समय-सीमा' : isMarathi ? 'तपासणी कालावधी' : 'Recommended Care Window'}</div>
        <div class="info-value">${assessment.suggestedTimeframe || concernConfig.timeframe}</div>
      </div>
    </div>

    <div class="info-card" style="margin-bottom: 16px;">
      <div class="info-label">${isHindi ? 'अनुशंसित विशेषज्ञ श्रेणी' : isMarathi ? 'सुचवलेले तज्ज्ञ' : 'Recommended Clinical Specialist'}</div>
      <div class="info-value">${specialtyInfo.title}</div>
      <div style="font-size: 12px; color: #475569; margin-top: 4px;">${specialtyInfo.reason}</div>
    </div>

    <div class="section-title">${isHindi ? 'नैदानिक निष्कर्ष व लक्षण' : isMarathi ? 'वैद्यकीय निष्कर्ष व लक्षणे' : 'Key Clinical Findings & Symptoms'}</div>
    <ul>
      ${assessment.concerns && assessment.concerns.length > 0
        ? assessment.concerns.map(c => `<li><strong>${c.title || c.type.replace(/_/g, ' ')}:</strong> ${c.description}</li>`).join('')
        : assessment.keyFindings?.map(f => `<li><strong>${f.title}:</strong> ${f.description}</li>`).join('') || '<li>Standard oral health screening protocol completed.</li>'
      }
    </ul>

    <div class="section-title">${isHindi ? 'अनुशंसित कदम व कार्ययोजना' : isMarathi ? 'पुढील टप्पे' : 'Action Plan Checklist'}</div>
    <ol>
      <li><strong>${isHindi ? 'विशेषज्ञ परामर्श' : isMarathi ? 'तज्ज्ञ सल्ला' : 'Specialist Consultation'}:</strong> ${specialtyInfo.title} - ${assessment.suggestedTimeframe || '7-14 days'}</li>
      <li><strong>${isHindi ? 'डॉक्टर स्क्रीनिंग सारांश' : isMarathi ? 'वैद्यकीय सारांश' : 'Share Screening Summary'}:</strong> ${isHindi ? 'जांच के समय डॉक्टर को यह नोट प्रस्तुत करें' : isMarathi ? 'तपासणीवेळी डॉक्टरांना हा सारांश दाखवा' : 'Provide this structured report during clinical triage or appointment check-in'}</li>
      <li><strong>${isHindi ? '14-दिवसीय रीचेक' : isMarathi ? '१४ दिवसांत रीचेक' : '14-Day Recheck Protocol'}:</strong> ${isHindi ? 'यदि छाला या घाव 14 दिनों से अधिक बना रहे तो तत्काल पुनः परीक्षण कराएं' : isMarathi ? 'जखम १४ दिवसांपेक्षा जास्त काळ राहिल्यास त्वरित पाठपुरावा करा' : 'Persistent oral mucosal changes exceeding 14 days require definitive clinical inspection'}</li>
    </ol>

    <div class="section-title">${isHindi ? 'डॉक्टर से पूछने योग्य प्रश्न' : isMarathi ? 'डॉक्टरांना विचारण्यासाठी प्रश्न' : 'Recommended Questions for Provider'}</div>
    <ul>
      <li>${isHindi ? 'क्या आप मेरी जीभ, तालु और गालों के आंतरिक ऊतकों की संपूर्ण जांच कर सकते हैं?' : isMarathi ? 'माझी जीभ, टाळू आणि तोंडाच्या आतील भागाची संपूर्ण तपासणी करू शकाल का?' : 'Could you perform a complete soft-tissue examination of my tongue, floor of mouth, and oral mucosa?'}</li>
      <li>${isHindi ? 'क्या यह घाव सामान्य है या किसी प्री-कैंसर घाव का संकेत हो सकता है?' : isMarathi ? 'ही जखम सामान्य आहे की प्री-कॅन्सरचे लक्षण असू शकते?' : 'Does this presentation look like a benign traumatic ulcer, or could it indicate precancerous tissue change?'}</li>
      <li>${isHindi ? 'क्या इसके लिए 10-14 दिनों में फॉलो-अप या बायोप्सी आवश्यक है?' : isMarathi ? 'यासाठी १०-१४ दिवसांत पुन्हा तपासणी किंवा बायोप्सी आवश्यक आहे का?' : 'Is follow-up evaluation in 10-14 days or diagnostic biopsy indicated?'}</li>
    </ul>

    <div class="section-title">${isHindi ? 'संरचित डॉक्टर सारांश नोट' : isMarathi ? 'संरचित वैद्यकीय सारांश नोंद' : 'Structured Doctor Handoff Note'}</div>
    <div class="doctor-summary-box">${assessment.doctorSummaryText || 'No summary text available.'}</div>

    <div class="signature-area">
      <div>
        <div class="sig-line">${isHindi ? 'परीक्षणकर्ता डॉक्टर के हस्ताक्षर व दिनांक' : isMarathi ? 'तपासणी डॉक्टर स्वाक्षरी व दिनांक' : 'Examining Clinician Signature & Date'}</div>
      </div>
      <div>
        <div class="sig-line">${isHindi ? 'अस्पताल / क्लिनिक की मुहर' : isMarathi ? 'रुग्णालय / क्लिनिक शिक्का' : 'Clinic / Hospital Stamp'}</div>
      </div>
    </div>

    <div class="disclaimer">
      <strong>${isHindi ? 'नैदानिक अस्वीकरण' : isMarathi ? 'वैद्यकीय अस्वीकरण' : 'Clinical Disclaimer'}:</strong> OralGuard AI is an educational screening and triage decision-support tool. It does not provide definitive medical diagnosis or replace formal physical examination, histology, or biopsy by a qualified dental surgeon or oncologist.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OralGuard_Health_Report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInitiateBooking = () => {
    setShowConsentModal(true);
  };

  const handleConsentChoice = (agreed: boolean) => {
    setUserConsentedToShare(agreed);
    setShowConsentModal(false);
    onBookAppointment(agreed, mappedProfessional);
  };

  const mappedProfessional = useMemo(() => {
    if (assessment?.identifiedCondition) {
      const cond = assessment.identifiedCondition.toLowerCase();
      if (cond.includes('emergency') || cond.includes('airway') || cond.includes('hemorrhage') || cond.includes('severe swelling')) {
        return 'Emergency Care';
      }
      if (cond.includes('periodont') || cond.includes('gingiv') || cond.includes('gum bleeding') || cond.includes('periodontitis')) {
        return 'Periodontist';
      }
      if (cond.includes('lesion') || cond.includes('ulcer') || cond.includes('mucosal') || cond.includes('maxillofacial') || cond.includes('leukoplakia') || cond.includes('erythroplakia') || cond.includes('osmf')) {
        return 'Oral & Maxillofacial Specialist';
      }
      if (cond.includes('neck') || cond.includes('hoarseness') || cond.includes('lump') || cond.includes('ent') || cond.includes('otolaryngology')) {
        return 'ENT Specialist';
      }
      if (cond.includes('oncology') || cond.includes('cancer') || cond.includes('tumor')) {
        return 'Head & Neck Oncology';
      }
      if (cond.includes('caries') || cond.includes('tooth') || cond.includes('decay') || cond.includes('odontogenic') || cond.includes('sensitivity')) {
        return 'General Dentist';
      }
    }

    if (assessment?.recommendedProfessional) return assessment.recommendedProfessional;
    if (assessment?.careLevel === 'Emergency' || profile?.emergencyFlagTriggered) return 'Emergency Care';
    if (profile?.gumBleeding && !profile?.toothDecay) return 'Periodontist';
    if (profile?.persistentHoarseness || profile?.neckLumpOrSwelling) return 'ENT Specialist';
    if (profile?.hasLesionOrUlcer && profile?.durationOverTwoWeeks) return 'Oral & Maxillofacial Specialist';
    return 'General Dentist';
  }, [assessment, profile]);

  const specialtyInfo = useMemo(() => {
    const prof = mappedProfessional.toLowerCase();
    if (prof.includes('periodontist')) {
      return {
        title: isHindi ? 'मसूड़ा रोग विशेषज्ञ (Periodontist)' : isMarathi ? 'मसूढातज्ज्ञ (Periodontist)' : 'Periodontist (Gum Specialist)',
        shortName: 'Periodontist',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        reason: isHindi
          ? 'आपके द्वारा रिपोर्ट किए गए मसूड़ों में सूजन और रक्तस्राव के आधार पर स्वचालित रूप से पिरियोडॉन्टिस्ट (मसूड़ा विशेषज्ञ) से परामर्श का सुझाव दिया गया है।'
          : isMarathi
          ? 'तुम्ही नोंदवलेल्या हिरड्यांमधील सूज व रक्तस्त्रावाच्या आधारे स्वयंचलितपणे मसूढातज्ज्ञांचा (Periodontist) सल्ला सुचवला आहे.'
          : 'Mapped based on reported gingival bleeding, gum tissue inflammation, or periodontal irritation.',
        buttonText: isHindi ? 'निकटतम पिरियोडॉन्टिस्ट (Periodontist) अस्पताल खोजें' : isMarathi ? 'जवळचे मसूढातज्ज्ञ (Periodontist) केंद्र शोधा' : 'Search Nearby Periodontists',
      };
    }
    if (prof.includes('maxillofacial') || prof.includes('oral specialist') || prof.includes('surgeon')) {
      return {
        title: isHindi ? 'ओरल एंड मैक्सिलोफेशियल विशेषज्ञ (Oral Surgeon)' : isMarathi ? 'ओरल अँड मॅक्सिलोफेशिअल तज्ज्ञ' : 'Oral & Maxillofacial Specialist',
        shortName: 'Maxillofacial Specialist',
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
        reason: isHindi
          ? '2 सप्ताह से अधिक पुराने छालों, सफेद/लाल धब्बों अथवा श्लेष्मा परिवर्तनों के विशेषज्ञ परीक्षण हेतु ओरल सर्जन का सुझाव दिया गया है।'
          : isMarathi
          ? '२ आठवड्यांपेक्षा जास्त जुन्या फोडांच्या व म्यूकोसल बदलांच्या तपासणीसाठी ओरल सर्जनचा सल्ला सुचवला आहे.'
          : 'Mapped based on persistent mucosal lesion (>14 days), unhealed ulceration, or suspicious tissue changes.',
        buttonText: isHindi ? 'निकटतम ओरल एंड मैक्सिलोफेशियल विशेषज्ञ खोजें' : isMarathi ? 'जवळचे ओरल (Maxillofacial) तज्ज्ञ शोधा' : 'Search Nearby Maxillofacial Specialists',
      };
    }
    if (prof.includes('ent')) {
      return {
        title: isHindi ? 'ईएनटी विशेषज्ञ (ENT Specialist)' : isMarathi ? 'ईएनटी तज्ज्ञ (ENT Specialist)' : 'ENT Specialist (Otolaryngologist)',
        shortName: 'ENT Specialist',
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
        reason: isHindi
          ? 'गले में परेशानी, आवाज में बदलाव या गर्दन में सूजन के गहन परीक्षण के लिए ईएनटी (ENT) विशेषज्ञ का सुझाव दिया गया है।'
          : isMarathi
          ? 'घशातील त्रास, आवाजातील बदल किंवा मानेतील सुजेच्या तपासणीसाठी ईएनटी (ENT) तज्ज्ञांचा सल्ला सुचवला आहे.'
          : 'Mapped based on persistent hoarseness, upper respiratory tract symptoms, or neck lymph node indicators.',
        buttonText: isHindi ? 'निकटतम ईएनटी (ENT) विशेषज्ञ अस्पताल खोजें' : isMarathi ? 'जवळचे ईएनटी (ENT) तज्ज्ञ रुग्णालय शोधा' : 'Search Nearby ENT Specialists',
      };
    }
    if (prof.includes('emergency')) {
      return {
        title: isHindi ? 'आपातकालीन चिकित्सा विभाग (Emergency Care)' : isMarathi ? 'आपत्कालीन वैद्यकीय विभाग (Emergency Care)' : 'Emergency Care / Casualty Unit',
        shortName: 'Emergency Care',
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
        reason: isHindi
          ? 'तीव्र चेतावनी संकेतों (सांस लेने/निगलने में गंभीर समस्या या अत्यधिक रक्तस्राव) के लिए तत्काल आपातकालीन चिकित्सा का सुझाव दिया गया है।'
          : isMarathi
          ? 'गंभीर लक्षणांसाठी (श्वास घेण्यास त्रास / सतत रक्तस्त्राव) तातडीने आपत्कालीन कक्षाशी संपर्क साधा.'
          : 'Mapped due to acute clinical red flags (airway compromise, rapid facial swelling, or severe oral bleeding).',
        buttonText: isHindi ? 'निकटतम आपातकालीन अस्पताल (Emergency) खोजें' : isMarathi ? 'जवळचे आपत्कालीन रुग्णालय (Emergency) शोधा' : 'Search Nearby Emergency Departments',
      };
    }
    return {
      title: isHindi ? 'सामान्य दंत चिकित्सक (General Dentist)' : isMarathi ? 'सर्वसाधारण दंतवैद्य (General Dentist)' : 'General Dentist',
      shortName: 'General Dentist',
      badgeBg: 'bg-teal-100 text-teal-900 border-teal-200',
      reason: isHindi
        ? 'दांत दर्द, सड़न, कैविटी या सामान्य मुख स्वच्छता और निवारक जांच के लिए दंत चिकित्सक का सुझाव दिया गया है।'
        : isMarathi
        ? 'दातदुखी, कीड किंवा सर्वसाधारण दातांच्या तपासणीसाठी दंतवैद्यांचा सल्ला सुचवला आहे.'
        : 'Mapped for dental caries, toothache, localized sensitivity, or routine preventive oral examination.',
      buttonText: isHindi ? 'निकटतम दंत चिकित्सक (General Dentist) खोजें' : isMarathi ? 'जवळचे दंतवैद्य (General Dentist) शोधा' : 'Search Nearby General Dentists',
    };
  }, [mappedProfessional, isHindi, isMarathi]);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-y-auto transition-colors">
      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 pb-12 print:hidden">
        {/* Top Header */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              {isHindi ? 'स्क्रीनिंग व ट्राइएज परिणाम' : isMarathi ? 'स्क्रीनिंग व ट्राइएज निकाल' : 'Oral Health & Triage Assessment'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 hover:text-teal-900 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs group"
                title={isHindi ? 'मूल्यांकन रिपोर्ट प्रिंट करें या PDF के रूप में सेव करें' : isMarathi ? 'अहवाल प्रिंट करा किंवा PDF म्हणून सेव्ह करा' : 'Print or Save Assessment Report as PDF'}
              >
                <Printer className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition-transform" />
                <span>{isHindi ? 'प्रिंट रिपोर्ट' : isMarathi ? 'प्रिंट अहवाल' : 'Print Report'}</span>
              </button>
              <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {isHindi ? 'प्रोटोटाइप मूल्यांकन' : isMarathi ? 'प्रोटोटाइप मूल्यांकन' : 'Prototype Evaluation'}
              </span>
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            {isHindi ? 'मुँह के स्वास्थ्य का समग्र मूल्यांकन' : isMarathi ? 'तोंडाच्या आरोग्याचे सर्वसमावेशक मूल्यांकन' : 'Comprehensive Oral Health Assessment'}
          </h1>
        </div>

        {/* Navigation Tabs with Layout Transition Pill Indicator */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner overflow-x-auto no-scrollbar">
          {[
            {
              id: 'all' as const,
              label: isHindi ? 'समग्र दृष्टिकोण' : isMarathi ? 'सर्व आढावा' : 'All Overview',
              shortLabel: isHindi ? 'सभी' : isMarathi ? 'सर्व' : 'All',
              icon: Layers,
            },
            {
              id: 'urgency' as const,
              label: isHindi ? 'आपात व स्तर' : isMarathi ? 'धोका पातळी' : 'Urgency & Specialty',
              shortLabel: isHindi ? 'जोखिम' : isMarathi ? 'धोका' : 'Urgency',
              icon: AlertTriangle,
              badge: assessment.careLevel ? assessment.careLevel.toUpperCase() : screeningConcern,
              badgeColor: riskLevel === 'high' ? 'bg-rose-100 text-rose-800' : riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
            },
            {
              id: 'findings' as const,
              label: isHindi ? 'नैदानिक निष्कर्ष' : isMarathi ? 'वैद्यकीय निष्कर्ष' : 'Clinical Findings',
              shortLabel: isHindi ? 'निष्कर्ष' : isMarathi ? 'निष्कर्ष' : 'Findings',
              icon: Search,
              badge: assessment.concerns?.length ? `${assessment.concerns.length}` : (assessment.keyFindings?.length ? `${assessment.keyFindings.length}` : undefined),
              badgeColor: 'bg-slate-200 text-slate-800',
            },
            {
              id: 'recommendations' as const,
              label: isHindi ? 'अनुशंसित कदम' : isMarathi ? 'पुढील टप्पे' : 'Action Plan',
              shortLabel: isHindi ? 'कदम' : isMarathi ? 'टप्पे' : 'Steps',
              icon: ClipboardList,
              badge: '3 Steps',
              badgeColor: 'bg-indigo-100 text-indigo-800',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`relative flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-teal-950 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeResultSectionTab"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/80"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="inline sm:hidden">{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? tab.badgeColor : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Animated Cards Container with Layout Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.75 }}
            layout
            className="space-y-4"
          >
            {/* URGENCIES & SPECIALTY SECTION */}
            {(activeSection === 'all' || activeSection === 'urgency') && (
              <>
                {/* CARD 1: Urgency & Care Triage Level (Color-coded Hero Card) */}
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`p-4 sm:p-5 rounded-2xl border-2 ${concernConfig.themeBorder} ${concernConfig.themeBg} shadow-xs relative overflow-hidden space-y-3`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-slate-600" />
                          <span>Clinical Triage Urgency Level</span>
                        </span>
                        {activeSection === 'all' && (
                          <button
                            type="button"
                            onClick={() => setActiveSection('urgency')}
                            className="text-[9.5px] font-semibold text-slate-500 hover:text-slate-800 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200/60 cursor-pointer"
                          >
                            Focus
                          </button>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1.5 rounded-full text-white text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm ${concernConfig.badgeBg} w-fit`}
                      >
                        <RiskIcon className="w-4 h-4" />
                        {assessment.careLevel ? `CARE LEVEL: ${assessment.careLevel.toUpperCase()}` : screeningConcern}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Timeframe: {assessment.suggestedTimeframe || concernConfig.timeframe}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/90 rounded-xl border border-slate-200/70 text-xs text-slate-800 leading-relaxed font-medium">
                    {assessment.recommendation || concernConfig.subText}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                    <span>Identified Assessment Category: <strong className="uppercase text-slate-900">{screeningConcern}</strong></span>
                    <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Non-Diagnostic Triage</span>
                  </div>
                </motion.div>

                {/* CARD 2: Mapped Specialist Provider Card (Teal Gradient Theme) */}
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white p-4.5 rounded-2xl border-2 border-teal-300 shadow-xs space-y-3.5 bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Stethoscope className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {isHindi ? 'स्वचालित क्लिनिकल विशेषज्ञ मैपिंग' : isMarathi ? 'स्वयंचलित क्लिनिकल तज्ज्ञ मॅपिंग' : 'Mapped Clinical Specialty'}
                        </h2>
                        <p className="text-[10.5px] text-slate-500">
                          {isHindi ? 'आपके लक्षणों के आधार पर अनुशंसित विशेषज्ञ श्रेणी' : isMarathi ? 'लक्षणांनुसार सुचवलेले तज्ज्ञ' : 'Recommended medical category for your specific concern'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs shrink-0 ${specialtyInfo.badgeBg}`}>
                      {specialtyInfo.title}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-teal-200 text-[11px] text-slate-700 space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        {isHindi ? 'मैपिंग का नैदानिक कारण:' : isMarathi ? 'मॅपिंगचे क्लिनिकल कारण:' : 'Clinical Rationale:'}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed pl-5">
                      {specialtyInfo.reason}
                    </p>
                  </div>

                  {/* Provider Search Button - Direct specialty filter */}
                  <button
                    type="button"
                    onClick={handleInitiateBooking}
                    id="btn-search-specialty-providers-card"
                    className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm shadow-teal-700/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Hospital className="w-4.5 h-4.5 text-teal-200 shrink-0" />
                      <span>{specialtyInfo.buttonText}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-teal-700/70 px-2.5 py-1 rounded-md text-[11px] text-teal-100 font-semibold group-hover:bg-teal-800 transition-colors">
                      <span>Auto-Filtered</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>

                  {/* Quick-switch footer when in Urgency tab */}
                  {activeSection === 'urgency' && (
                    <div className="pt-2 flex items-center justify-between border-t border-teal-200/70 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveSection('all')}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isHindi ? 'सभी कार्ड देखें' : isMarathi ? 'सर्व कार्ड्स पहा' : 'View All Overview'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection('findings')}
                        className="text-[11px] font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-teal-100/80 hover:bg-teal-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>{isHindi ? 'निष्कर्ष व लक्षणे देखें' : isMarathi ? 'निष्कर्ष व लक्षणे पहा' : 'Next: Clinical Findings'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}

            {/* CLINICAL FINDINGS SECTION */}
            {(activeSection === 'all' || activeSection === 'findings') && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-xs">
                      <Search className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {isHindi ? 'नैदानिक निष्कर्ष व चिन्ह' : isMarathi ? 'वैद्यकीय निष्कर्ष व लक्षणे' : 'Key Clinical Findings & Symptoms'}
                        </h2>
                        {activeSection === 'all' && (
                          <button
                            type="button"
                            onClick={() => setActiveSection('findings')}
                            className="text-[9.5px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 cursor-pointer"
                          >
                            Focus
                          </button>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500">
                        {isHindi ? 'फ्लैग किए गए लक्षण, जोखिम कारक और सुरक्षात्मक कारक' : isMarathi ? 'लक्षणे व जोखीम घटक' : 'Categorized by risk impact and protective oral habits'}
                      </p>
                    </div>
                  </div>
                  {assessment.concerns && assessment.concerns.length > 0 && (
                    <span className="text-[10px] bg-slate-100 border border-slate-200 font-bold px-2 py-0.5 rounded text-slate-700">
                      {assessment.concerns.length} Identified {assessment.concerns.length === 1 ? 'Condition' : 'Conditions'}
                    </span>
                  )}
                </div>

                {/* Identified Oral Health Concerns List */}
                {assessment.concerns && assessment.concerns.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                      Primary Oral Lesions & Symptoms
                    </span>
                    {assessment.concerns.map((concern, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                            <span className="text-xs font-bold text-slate-900">{concern.title}</span>
                          </div>
                          {concern.locations && concern.locations.length > 0 && (
                            <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                              {concern.locations.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {concern.description}
                        </p>
                        {concern.recommendedNextStep && (
                          <div className="text-[10.5px] text-teal-800 bg-teal-50/80 p-1.5 rounded-lg border border-teal-100 flex items-center gap-1 font-medium">
                            <Info className="w-3 h-3 text-teal-600 shrink-0" />
                            <span>{concern.recommendedNextStep}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Clinical Findings List */}
                {assessment.keyFindings && assessment.keyFindings.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                      Flagged Risk Factors & Observations
                    </span>
                    <div className="space-y-1.5">
                      {assessment.keyFindings.map((finding, idx) => (
                        <div key={idx} className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 flex items-start gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                              finding.impact === 'flag'
                                ? 'bg-rose-500 ring-2 ring-rose-200'
                                : finding.impact === 'moderate'
                                ? 'bg-amber-500 ring-2 ring-amber-200'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <div>
                            <strong className="text-slate-900 block font-semibold">{finding.title}</strong>
                            <span className="text-[11px] text-slate-600 leading-relaxed">{finding.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Protective Factors Section */}
                {assessment.protectiveFactors && assessment.protectiveFactors.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isHindi ? 'सकारात्मक सुरक्षात्मक कारक' : isMarathi ? 'सकारात्मक संरक्षणात्मक घटक' : 'Reported Protective Factors'}</span>
                    </span>
                    <ul className="space-y-1">
                      {assessment.protectiveFactors.map((fact, idx) => (
                        <li key={idx} className="text-[11px] text-emerald-950 font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick-switch footer when in Findings tab */}
                {activeSection === 'findings' && (
                  <div className="pt-2.5 flex items-center justify-between border-t border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveSection('urgency')}
                      className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{isHindi ? 'पिछला: आपात व स्तर' : isMarathi ? 'मागे: धोका पातळी' : 'Back: Urgency'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('recommendations')}
                      className="text-[11px] font-bold text-indigo-800 hover:text-indigo-900 flex items-center gap-1 cursor-pointer bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span>{isHindi ? 'अगला: अनुशंसित कदम' : isMarathi ? 'पुढील: महत्त्वाचे टप्पे' : 'Next: Action Plan'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* RECOMMENDATIONS & NEXT STEPS SECTION */}
            {(activeSection === 'all' || activeSection === 'recommendations') && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="bg-indigo-50/70 p-4 sm:p-4.5 rounded-2xl border border-indigo-200 shadow-2xs space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                      <ClipboardList className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {isHindi ? 'अनुशंसित अगले कदम' : isMarathi ? 'पुढील महत्त्वाचे टप्पे' : 'Recommended Next Steps'}
                        </h2>
                        {activeSection === 'all' && (
                          <button
                            type="button"
                            onClick={() => setActiveSection('recommendations')}
                            className="text-[9.5px] font-semibold text-indigo-700 hover:text-indigo-950 bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200/60 cursor-pointer"
                          >
                            Focus
                          </button>
                        )}
                      </div>
                      <p className="text-[10.5px] text-indigo-700">
                        {isHindi ? 'आपके स्वास्थ्य के लिए अनुशंसित कार्ययोजना' : isMarathi ? 'आरोग्यासाठी आवश्यक पायऱ्या' : 'Step-by-step guidance for your clinical evaluation'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        Book Clinical Evaluation with Mapped Specialist ({specialtyInfo.title})
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Schedule an in-person visual and tactile oral mucosal exam within the suggested timeframe ({assessment.suggestedTimeframe || '7-14 days'}).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        Share Structured Doctor Screening Note
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Provide your generated screening summary (symptoms, duration, tobacco exposures) to pre-inform your clinical provider.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        Set 14-Day Lesion Recheck Reminder
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        If the sore/white patch persists unchanged beyond 14 days without healing, follow up promptly for diagnostic evaluation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collapsible Questions for Your Dental/Medical Visit with Smooth Height Transition */}
                <motion.div layout className="bg-white rounded-xl border border-indigo-200 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowQuestionsForDentist(!showQuestionsForDentist)}
                    className="w-full p-3 text-left flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-indigo-600" />
                      <span>
                        {isHindi
                          ? 'डॉक्टर / दंत चिकित्सक से पूछने योग्य अनुशंसित प्रश्न'
                          : isMarathi
                          ? 'डॉक्टर / दंतवैद्यांना विचारण्यासाठी महत्त्वाचे प्रश्न'
                          : 'Recommended Questions for Your Doctor / Dentist'}
                      </span>
                    </span>
                    {showQuestionsForDentist ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {showQuestionsForDentist && (
                      <motion.div
                        key="dentist-questions-drawer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3.5 text-[11px] text-slate-600 space-y-2 border-t border-slate-100 pt-2.5">
                          <p>
                            {isHindi
                              ? 'जब आप अपने डेंटिस्ट या ईएनटी विशेषज्ञ से मिलें, तो ये प्रश्न अवश्य पूछें:'
                              : isMarathi
                              ? 'जेव्हा तुम्ही तुमच्या दंतवैद्य किंवा ईएनटी डॉक्टरांकडे जाल, तेव्हा हे प्रश्न नक्की विचारा:'
                              : 'When you visit your dentist or ENT specialist, consider asking:'}
                          </p>
                          <ul className="list-disc list-inside space-y-1.5 text-slate-700 pl-1">
                            {assessment.patientQuestions && assessment.patientQuestions.length > 0 ? (
                              assessment.patientQuestions.map((q, idx) => (
                                <li key={idx}>{q}</li>
                              ))
                            ) : isHindi ? (
                              <>
                                <li>क्या आप मेरी जीभ, मुँह के निचले हिस्से और गालों के आंतरिक ऊतकों की संपूर्ण जांच कर सकते हैं?</li>
                                <li>क्या यह घाव सामान्य है या यह किसी प्री-कैंसर घाव (Precancerous lesion) का संकेत हो सकता है?</li>
                                <li>क्या मुझे 10-14 दिनों में दोबारा फॉलो-अप जांच के लिए आना चाहिए?</li>
                                <li>क्या इसके लिए बायोप्सी (Biopsy) या विशेषज्ञ संदर्भ (Specialist referral) की सिफारिश की जाती है?</li>
                              </>
                            ) : isMarathi ? (
                              <>
                                <li>माझी जीभ, तोंडाचा तळ आणि गालांच्या आतील भागाची संपूर्ण तपासणी करू शकाल का?</li>
                                <li>ही जखम सामान्य आहे की प्री-कॅन्सर (Precancerous) जखमेचे लक्षण असू शकते?</li>
                                <li>१०-१४ दिवसांत जखम भरली आहे का हे पाहण्यासाठी पुन्हा यावे लागेल का?</li>
                                <li>यासाठी बायोप्सी (Biopsy) किंवा तज्ज्ञ डॉक्टरांचा सल्ला आवश्यक आहे का?</li>
                              </>
                            ) : (
                              <>
                                <li>Could you perform a complete soft-tissue inspection of my tongue, floor of mouth, and cheeks?</li>
                                <li>Does this lesion look like a benign traumatic ulcer, or could it be precancerous?</li>
                                <li>Should we follow up in 10-14 days to see if the sore has healed?</li>
                                <li>Is a diagnostic biopsy, toluidine blue stain, or specialist referral recommended?</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Quick-switch footer when in Recommendations tab */}
                {activeSection === 'recommendations' && (
                  <div className="pt-2.5 flex items-center justify-between border-t border-indigo-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveSection('findings')}
                      className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{isHindi ? 'पिछला: निष्कर्ष' : isMarathi ? 'मागे: निष्कर्ष' : 'Back: Findings'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInitiateBooking}
                      className="text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                    >
                      <Hospital className="w-3.5 h-3.5 text-teal-200" />
                      <span>{isHindi ? 'अस्पताल खोजें' : isMarathi ? 'रुग्णालय शोधा' : 'Find Providers'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Quick Access Tools: Ask OralGuard, Follow-up & Reminders, Hub */}
        <div className="grid grid-cols-2 gap-2">
          {onOpenAskOralGuard && (
            <button
              type="button"
              onClick={onOpenAskOralGuard}
              className="p-3 bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700">
                  {isHindi ? 'OralGuard से पूछें' : isMarathi ? 'OralGuard ला विचारा' : 'Ask OralGuard'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isHindi ? 'छाले, लक्षण और ओरल हेल्थ पर प्रश्न पूछें' : isMarathi ? 'तोंड येणे, लक्षणे व काळजी यावर शंका विचारा' : 'Ask questions about sores, oral care & habits'}
              </p>
            </button>
          )}

          {onOpenFollowUp && (
            <button
              type="button"
              onClick={onOpenFollowUp}
              className="p-3 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                  {isHindi ? 'फॉलो-अप व रिमाइंडर' : isMarathi ? 'फॉलो-अप व स्मरणपत्र' : 'Follow-up / Reminder'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isHindi ? '2-हफ़्ते रीचेक व अपॉइंटमेंट रिमाइंडर सेट करें' : isMarathi ? '२-आठवडे रीचेक व तपासणी रिमाइंडर सेट करा' : 'Set 2-week recheck & dental visit reminders'}
              </p>
            </button>
          )}

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="col-span-2 p-3 bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 block">
                    {isHindi ? 'क्लाउड जाँच इतिहास (Firestore History)' : isMarathi ? 'क्लाउड तपासणी इतिहास (Firestore History)' : 'Cloud Assessment History'}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {isHindi ? 'पिछली सभी जाँचें व लक्षण रिकॉर्ड देखें' : isMarathi ? 'मागील सर्व तपासण्या व नोंदी पहा' : 'View past assessments securely saved in Cloud Firestore'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
            </button>
          )}
        </div>

        {/* Doctor Handoff & Clinical Summary Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isHindi ? 'डॉक्टर स्क्रीनिंग सारांश' : isMarathi ? 'डॉक्टर स्क्रीनिंग सारांश' : 'Doctor Screening Summary'}
              </h2>
            </div>
            {onOpenDoctorHandoff ? (
              <button
                type="button"
                onClick={onOpenDoctorHandoff}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>{isHindi ? 'हैंडऑफ रिपोर्ट खोलें' : isMarathi ? 'हँडऑफ अहवाल उघडा' : 'Open Handoff View'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={() => setShowDoctorSummaryModal(true)}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>{isHindi ? 'पूरी रिपोर्ट देखें' : isMarathi ? 'संपूर्ण अहवाल पहा' : 'View Full Report'}</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            {isHindi
              ? 'एक संरचित नैदानिक नोट जिसमें आपकी बताई गई समयावधि, छाले/घाव का विवरण और तंबाकू/सुपारी के सेवन का विवरण शामिल है, डॉक्टर या दंत चिकित्सक के साथ साझा करने हेतु तैयार है।'
              : isMarathi
              ? 'तुमची लक्षणे, कालावधी आणि तंबाखू/सुपारी सेवनाचा संरचित वैद्यकीय सारांश डॉक्टरांसोबत शेअर करण्यासाठी तयार आहे.'
              : 'A structured clinical note summarizing your reported timeline, lesion details, and tobacco/areca exposures has been generated for sharing with a doctor or dentist.'}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleCopyDoctorSummary}
              className="flex-1 min-w-[130px] py-2 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? (isHindi ? 'कॉपी हो गया!' : isMarathi ? 'कॉपी झाले!' : 'Summary Copied!') : (isHindi ? 'सारांश कॉपी करें' : isMarathi ? 'सारांश कॉपी करा' : 'Copy Summary')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold text-teal-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title={isHindi ? 'पूरी रिपोर्ट प्रिंट करें या PDF सेव करें' : isMarathi ? 'संपूर्ण अहवाल प्रिंट करा किंवा PDF सेव्ह करा' : 'Print or Save Full Clinical Report'}
            >
              <Printer className="w-3.5 h-3.5 text-teal-600" />
              <span>{isHindi ? 'प्रिंट रिपोर्ट' : isMarathi ? 'प्रिंट अहवाल' : 'Print Report'}</span>
            </button>
            <button
              onClick={handleDownloadSummary}
              className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Download text file (.txt)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isHindi ? '.txt' : isMarathi ? '.txt' : '.txt'}</span>
            </button>
          </div>
        </div>

        {/* Tobacco & Areca Habit Support */}
        {((profile?.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none') ||
          (profile?.tobaccoSmoked && profile.tobaccoSmoked !== 'none') ||
          (profile?.arecaOrBetelNut && profile.arecaOrBetelNut !== 'none') ||
          (profile?.tobaccoUse && profile.tobaccoUse.status === 'current') ||
          onOpenCessation) && (
          <div className="bg-gradient-to-br from-teal-50/90 to-white rounded-xl border border-teal-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {isHindi ? 'तंबाकू व सुपारी मुक्ति सहयोग' : isMarathi ? 'तंबाखू व सुपारी मुक्ती सहाय्य' : 'Tobacco & Areca Cessation Support'}
                  </h3>
                  <p className="text-[10.5px] text-slate-500">
                    {isHindi ? 'सहानुभूतिपूर्ण दृष्टिकोण, लक्ष्य व तलब नियंत्रण युक्तियाँ' : isMarathi ? 'सवय सोडण्यासाठी समुपदेशन व ४ D तंत्र' : 'Non-judgmental habit goals, 4 D’s & craving substitutes'}
                  </p>
                </div>
              </div>

              {onOpenCessation && (
                <button
                  type="button"
                  onClick={onOpenCessation}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>{isHindi ? 'प्लान देखें' : isMarathi ? 'प्लॅन पहा' : 'Open Support'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-teal-100">
              {isHindi
                ? 'तंबाकू या सुपारी की मात्रा घटाने या बंद करने से मुँह की श्लेष्मा (oral mucosa) में जलन तुरंत कम होने लगती है।'
                : isMarathi
                ? 'तंबाखू किंवा सुपारीचे सेवन थांबवल्याने तोंडातील पेशींना होणारी जळजळ लगेच कमी होते.'
                : 'Stopping or gradually reducing tobacco and areca nut exposure immediately alleviates chemical and thermal irritation on the oral mucosa.'}
            </p>
          </div>
        )}

        {/* Oral Health Awareness & Education Hub Shortcut */}
        {onOpenAwarenessHub && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {isHindi ? 'ओरल हेल्थ अवेयरनेस हब' : isMarathi ? 'ओरल हेल्थ जनजागृती केंद्र' : 'Oral Health Awareness Hub'}
                  </h3>
                  <p className="text-[10.5px] text-slate-500">
                    {isHindi ? 'चेतावनी संकेत, २-मिनट स्वयं-जाँच और मुख स्वच्छता' : isMarathi ? 'धोक्याची लक्षणे, २-मिनिटे स्वतः तपासणी आणि काळजी' : 'Warning signs, 2-minute mirror check & verified guides'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAwarenessHub}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{isHindi ? 'हब खोलें' : isMarathi ? 'हब उघडा' : 'Explore Hub'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Emergency Alert Box & Link */}
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              {isHindi ? 'तत्काल आपातकालीन चिकित्सा कब लें:' : isMarathi ? 'तातडीची वैद्यकीय मदत केव्हा घ्यावी:' : 'Acute Emergency Warning Signs:'}
            </span>
            {onOpenEmergencyGuidance && (
              <button
                type="button"
                onClick={onOpenEmergencyGuidance}
                className="text-[10.5px] font-bold text-rose-700 underline cursor-pointer"
              >
                View Protocol
              </button>
            )}
          </div>
          <p className="text-[10.5px] text-rose-700 leading-relaxed">
            {isHindi
              ? 'यदि सांस लेने में तीव्र कठिनाई, गले या जबड़े में तेजी से फैलती सूजन, या अत्यधिक रक्तस्राव हो, तो तुरंत 112 डायल करें या निकटतम आपातकालीन अस्पताल जाएं।'
              : isMarathi
              ? 'श्वास घेण्यास तीव्र त्रास, घसा/जबड्याखाली वेगाने वाढणारी सूज किंवा सतत रक्तस्त्राव असल्यास त्वरित ११२ वर कॉल करा.'
              : 'For acute airway obstruction, severe rapidly spreading neck swelling, or uncontrolled oral bleeding, dial 112 or visit the nearest hospital casualty immediately.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          {/* Dedicated Print & PDF Report Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isHindi ? 'मूल्यांकन रिपोर्ट प्रिंट या सुरक्षित करें' : isMarathi ? 'मूल्यांकन अहवाल प्रिंट किंवा सेव्ह करा' : 'Save or Print Oral Health Report'}
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  {isHindi ? 'डेंटिस्ट विज़िट या रिकॉर्ड हेतु रिपोर्ट प्रिंट करें या PDF डाउनलोड करें' : isMarathi ? 'दंतवैद्य तपासणीसाठी किंवा नोंदीसाठी अहवाल सेव्ह/प्रिंट करा' : 'Ready to print or save as PDF for clinical visits & personal medical records'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Preview Report"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>{isHindi ? 'पूर्वावलोकन' : isMarathi ? 'पूर्वावलोकन' : 'Preview'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="py-2 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-teal-100" />
                <span>{isHindi ? 'प्रिंट / PDF' : isMarathi ? 'प्रिंट / PDF' : 'Print / PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJsonRecord}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Download personal patient profile & assessment JSON file"
              >
                {jsonDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{jsonDownloaded ? (isHindi ? 'डाउनलोड हुआ' : isMarathi ? 'डाउनलोड झाले' : 'Downloaded') : (isHindi ? 'JSON डेटा' : isMarathi ? 'JSON डेटा' : 'JSON Record')}</span>
              </button>
            </div>
          </div>
          {/* Direct Provider Search Button Filtered by Specialty */}
          <button
            onClick={handleInitiateBooking}
            id="btn-book-appointment"
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-sm shadow-teal-700/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Hospital className="w-4.5 h-4.5 text-teal-200 shrink-0" />
              <span>{specialtyInfo.buttonText}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-teal-100 bg-teal-700/70 px-2.5 py-1 rounded-md group-hover:bg-teal-800 transition-colors">
              <span>Auto-Filtered</span>
              <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            onClick={onRetake}
            id="btn-retake-screening"
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {isHindi ? 'नई स्क्रीनिंग शुरू करें' : isMarathi ? 'नवीन स्क्रीनिंग सुरू करा' : 'Start New Screening Session'}
            </span>
          </button>
        </div>

        {/* Past History Link */}
        {onOpenHistory && (
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <History className="w-4 h-4 text-teal-600" />
              <span>{isHindi ? 'पिछली जाँच रिकॉर्ड देखें' : isMarathi ? 'मागील तपासणी नोंदी पहा' : 'View past assessments archive'}</span>
            </div>
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-teal-700 hover:text-teal-900 font-semibold underline cursor-pointer"
            >
              {isHindi ? 'इतिहास खोलें' : isMarathi ? 'इतिहास उघडा' : 'Open History'}
            </button>
          </div>
        )}
      </div>

      {/* Subtle Trust & Privacy Footer */}
      <PrivacyTrustFooter language={lang} />

      {/* Doctor Summary Full Modal */}
      <AnimatePresence>
        {showDoctorSummaryModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-slate-900 text-sm">
                    {isHindi ? 'संरचित नैदानिक सारांश (Doctor Summary)' : isMarathi ? 'संरचित वैद्यकीय सारांश' : 'Structured Clinical Summary'}
                  </span>
                </div>
                <button
                  onClick={() => setShowDoctorSummaryModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] leading-relaxed text-slate-800 bg-slate-50/50 whitespace-pre-wrap select-text">
                {assessment.doctorSummaryText}
              </div>

              <div className="p-3 border-t border-slate-200 flex flex-wrap gap-2 bg-white">
                <button
                  onClick={handleCopyDoctorSummary}
                  className="flex-1 min-w-[120px] py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isHindi ? 'कॉपी हो गया' : isMarathi ? 'कॉपी झाले' : 'Copied') : (isHindi ? 'कॉपी करें' : isMarathi ? 'कॉपी करा' : 'Copy Summary')}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Print Report / Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isHindi ? 'प्रिंट रिपोर्ट' : isMarathi ? 'प्रिंट अहवाल' : 'Print Report'}</span>
                </button>
                <button
                  onClick={handleDownloadSummary}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'डाउनलोड .txt' : isMarathi ? 'डाउनलोड .txt' : 'Download .txt'}</span>
                </button>
                <button
                  onClick={handleDownloadJsonRecord}
                  className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Download complete patient profile & assessment JSON file"
                >
                  {jsonDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{jsonDownloaded ? 'JSON Saved' : (isHindi ? 'JSON फ़ाइल' : isMarathi ? 'JSON फाईल' : 'JSON Record')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Explicit User Consent Modal */}
      <AnimatePresence>
        {showConsentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isHindi ? 'डॉक्टर के साथ सारांश साझा करें?' : isMarathi ? 'डॉक्टरांसोबत सारांश शेअर करायचा?' : 'Share Screening Summary with Doctor?'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isHindi ? 'गोपनीयता और डेटा सुरक्षा' : isMarathi ? 'गोपनीयता व डेटा सुरक्षितता' : 'Privacy & Data Protection'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {isHindi
                  ? 'क्या आप चाहते हैं कि आपका संक्षिप्त ओरल स्क्रीनिंग सारांश (लक्षण, समयावधि और तंबाकू का विवरण) परामर्श के दौरान डॉक्टर को दिखाया जाए?'
                  : isMarathi
                  ? 'तुमचा तोंडाच्या तपासणीचा सारांश (लक्षणे, कालावधी व सवयी) तपासणीदरम्यान डॉक्टरांसोबत शेअर करायचा का?'
                  : 'Would you like to include your structured screening summary (symptoms, duration, and habits) with the appointment request so the doctor is pre-informed?'}
              </p>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleConsentChoice(true)}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isHindi ? 'हाँ, डॉक्टर के साथ साझा करें' : isMarathi ? 'होय, डॉक्टरांसोबत शेअर करा' : 'Yes, Share Summary with Doctor'}</span>
                </button>

                <button
                  onClick={() => handleConsentChoice(false)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isHindi ? 'नहीं, निजी रखें (केवल बुक करें)' : isMarathi ? 'नाही, खाजगी ठेवा (फक्त बुक करा)' : 'Keep Private (Book Without Summary)'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Preview & Export Options Modal */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isHindi ? 'ओरल हेल्थ मूल्यांकन रिपोर्ट - प्रिंट व सेव' : isMarathi ? 'तोंड आरोग्य मूल्यांकन अहवाल - प्रिंट व सेव्ह' : 'Oral Health Assessment Report – Print & Save'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isHindi ? 'डॉक्टर परामर्श या व्यक्तिगत रिकॉर्ड हेतु रिपोर्ट तैयार करें' : isMarathi ? 'वैद्यकीय तपासणीसाठी किंवा नोंदीसाठी अधिकृत अहवाल' : 'Formatted for clinical appointments and personal medical archival'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="p-3 bg-teal-50/70 border-b border-teal-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] font-medium text-teal-900">
                  {isHindi ? 'प्रिंट डायलॉग खोलें या ऑफ़लाइन फ़ाइल डाउनलोड करें:' : isMarathi ? 'प्रिंट पर्याय निवडा किंवा ऑफलाइन फाईल डाउनलोड करा:' : 'Choose print option or download offline report:'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadJsonRecord}
                    className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    title="Download complete patient profile and assessment data as a structured JSON file"
                  >
                    {jsonDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{jsonDownloaded ? 'JSON Saved' : (isHindi ? 'JSON फ़ाइल (.json)' : isMarathi ? 'JSON फाईल (.json)' : 'Export JSON (.json)')}</span>
                  </button>
                  <button
                    onClick={handleDownloadHtmlReport}
                    className="py-1.5 px-2.5 bg-white hover:bg-teal-100/70 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    title="Download standalone HTML report that can be opened and printed in any browser"
                  >
                    <FileDown className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isHindi ? 'ऑफ़लाइन रिपोर्ट (.html)' : isMarathi ? 'ऑफलाइन अहवाल (.html)' : 'Download Offline (.html)'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Open browser print dialog to print on paper or save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-100" />
                    <span>{isHindi ? 'प्रिंट / सेव PDF' : isMarathi ? 'प्रिंट / सेव्ह PDF' : 'Print / Save as PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Printable Report Preview Card */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/80 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 text-slate-800">
                  {/* Report Header */}
                  <div className="flex items-start justify-between border-b-2 border-teal-600 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-teal-600 text-white flex items-center justify-center font-black text-xs">OG</div>
                        <h2 className="text-base font-extrabold tracking-tight text-slate-900">OralGuard AI</h2>
                      </div>
                      <p className="text-xs text-teal-700 font-semibold mt-0.5">
                        {isHindi ? 'मुँह स्वास्थ्य मूल्यांकन व ट्राइएज रिपोर्ट' : isMarathi ? 'तोंड आरोग्य मूल्यांकन व ट्राइएज अहवाल' : 'Comprehensive Oral Health Assessment & Clinical Triage Report'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                        riskLevel === 'high'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : riskLevel === 'medium'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {assessment?.careLevel ? assessment.careLevel.toUpperCase() : screeningConcern}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date().toLocaleDateString(isHindi ? 'hi-IN' : isMarathi ? 'mr-IN' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {isHindi ? 'ट्राइएज स्थिति' : isMarathi ? 'धोका पातळी' : 'Triage Assessment'}
                      </span>
                      <span className="font-bold text-slate-900 block text-xs">{concernConfig.badgeText}</span>
                      <span className="text-[11px] text-slate-600 block">{concernConfig.subText}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {isHindi ? 'अनुशंसित विशेषज्ञ' : isMarathi ? 'सुचवलेले तज्ज्ञ' : 'Mapped Clinical Specialist'}
                      </span>
                      <span className="font-bold text-teal-800 block text-xs">{specialtyInfo.title}</span>
                      <span className="text-[11px] text-slate-600 block">{specialtyInfo.reason}</span>
                    </div>
                  </div>

                  {/* Clinical Findings & Symptoms */}
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      {isHindi ? 'मुख्य नैदानिक निष्कर्ष व लक्षण' : isMarathi ? 'मुख्य वैद्यकीय निष्कर्ष व लक्षणे' : 'Key Clinical Findings & Symptoms'}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                      {assessment?.concerns && assessment.concerns.length > 0
                        ? assessment.concerns.map((c, i) => (
                            <li key={i}>
                              <strong>{c.title || c.type.replace(/_/g, ' ')}:</strong> {c.description}
                            </li>
                          ))
                        : assessment?.keyFindings?.map((f, i) => (
                            <li key={i}>
                              <strong>{f.title}:</strong> {f.description}
                            </li>
                          )) || (
                            <li>Routine oral screening parameters within baseline range.</li>
                          )}
                    </ul>
                  </div>

                  {/* Action Plan */}
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      {isHindi ? 'अनुशंसित कदम व कार्ययोजना' : isMarathi ? 'पुढील टप्पे' : 'Action Plan Checklist'}
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                      <li>
                        <strong>{specialtyInfo.title}:</strong>{' '}
                        {isHindi
                          ? `व्यक्तिगत नैदानिक परीक्षण कराएं (${assessment?.suggestedTimeframe || '7-14 दिन'})`
                          : isMarathi
                          ? `प्रत्यक्ष तपासणी करून घ्या (${assessment?.suggestedTimeframe || '७-१४ दिवस'})`
                          : `Schedule in-person soft-tissue oral mucosal evaluation (${assessment?.suggestedTimeframe || '7-14 days'})`}
                      </li>
                      <li>
                        <strong>{isHindi ? 'डॉक्टर नोट' : isMarathi ? 'वैद्यकीय नोंद' : 'Doctor Handoff'}:</strong>{' '}
                        {isHindi
                          ? 'अपॉइंटमेंट के दौरान नीचे दिया गया सारांश डॉक्टर को दिखाएं'
                          : isMarathi
                          ? 'तपासणीवेळी खालील सारांश डॉक्टरांना दाखवा'
                          : 'Share this generated clinical intake note with your clinician'}
                      </li>
                      <li>
                        <strong>{isHindi ? '14-दिन रीचेक' : isMarathi ? '१४-दिवस रीचेक' : '14-Day Recheck'}:</strong>{' '}
                        {isHindi
                          ? 'यदि छाला/सफेद धब्बा 14 दिनों से अधिक बना रहे तो तत्काल विशेषज्ञ जांच कराएं'
                          : isMarathi
                          ? 'जखम १४ दिवसांपेक्षा जास्त काळ राहिल्यास त्वरित तज्ज्ञ तपासणी करा'
                          : 'Promptly follow up if mucosal lesion persists unhealed beyond 14 days'}
                      </li>
                    </ol>
                  </div>

                  {/* Structured Clinical Intake Note */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      {isHindi ? 'डॉक्टर स्क्रीनिंग सारांश नोट' : isMarathi ? 'वैद्यकीय सारांश नोंद' : 'Structured Doctor Screening Summary (EHR)'}
                    </h4>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap select-text">
                      {assessment?.doctorSummaryText || 'Summary not generated.'}
                    </div>
                  </div>

                  {/* Clinician Sign-off & Stamp Box */}
                  <div className="grid grid-cols-2 gap-6 border-t border-dashed border-slate-300 pt-6 text-xs text-slate-500">
                    <div className="text-center pt-8 border-t border-slate-400">
                      {isHindi ? 'परीक्षणकर्ता डॉक्टर के हस्ताक्षर' : isMarathi ? 'तपासणी डॉक्टर स्वाक्षरी' : 'Examining Clinician Signature'}
                    </div>
                    <div className="text-center pt-8 border-t border-slate-400">
                      {isHindi ? 'अस्पताल / क्लिनिक की मुहर' : isMarathi ? 'रुग्णालय / क्लिनिक शिक्का' : 'Clinic / Hospital Stamp'}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-[10px] text-slate-400 italic border-l-2 border-teal-500 pl-2 mt-4 leading-normal">
                    {isHindi
                      ? 'अस्वीकरण: OralGuard AI एक शैक्षिक व प्रारंभिक ट्राइएज सहायक है। यह किसी भी प्रकार से दंत चिकित्सक या ओंकोलॉजिस्ट के औपचारिक निदान, बायोप्सी अथवा चिकित्सीय परामर्श का स्थान नहीं लेता है।'
                      : isMarathi
                      ? 'अस्वीकरण: OralGuard AI हे शैक्षणिक व प्राथमिक ट्राइएज साधन आहे. हे दंतवैद्य किंवा तज्ज्ञांच्या प्रत्यक्ष वैद्यकीय तपासणीचा, बायोप्सीचा किंवा उपचारांचा पर्याय नाही.'
                      : 'Disclaimer: OralGuard AI is an educational screening and clinical triage guidance tool. It does not provide medical diagnosis or replace direct examination, biopsy, or treatment by a registered healthcare professional.'}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-white text-xs">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  {isHindi ? 'बंद करें' : isMarathi ? 'बंद करा' : 'Close'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadHtmlReport}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isHindi ? 'HTML सेव करें' : isMarathi ? 'HTML सेव्ह करा' : 'Save HTML'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-100" />
                    <span>{isHindi ? 'प्रिंट करें / सेव PDF' : isMarathi ? 'प्रिंट करा / सेव्ह PDF' : 'Print / Save PDF'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          DEDICATED FULL PRINTABLE CLINICAL ASSESSMENT REPORT
          Visible exclusively during browser print (window.print() / Save as PDF)
          Hidden from the regular on-screen display
          ========================================================================= */}
      <div className="hidden print:block p-8 bg-white text-slate-900 font-sans max-w-4xl mx-auto space-y-6">
        {/* Print Header */}
        <div className="flex items-start justify-between border-b-2 border-teal-700 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">OralGuard AI</span>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Clinical Triage</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">
              {isHindi ? 'मुँह स्वास्थ्य व ट्राइएज मूल्यांकन रिपोर्ट' : isMarathi ? 'तोंड आरोग्य व ट्राइएज मूल्यांकन अहवाल' : 'Comprehensive Oral Health Assessment & Clinical Triage Report'}
            </h1>
            <p className="text-xs text-slate-500">
              Generated: {new Date().toLocaleDateString(isHindi ? 'hi-IN' : isMarathi ? 'mr-IN' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase border ${
              riskLevel === 'high'
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : riskLevel === 'medium'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}>
              {assessment?.careLevel ? assessment.careLevel.toUpperCase() : screeningConcern}
            </span>
            <p className="text-[11px] font-bold text-slate-700 mt-1.5">
              Care Window: {assessment?.suggestedTimeframe || concernConfig.timeframe}
            </p>
          </div>
        </div>

        {/* Triage & Specialty Matrix */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-300 bg-slate-50/50 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Screening Urgency</span>
            <span className="font-extrabold text-sm text-slate-900 block">{concernConfig.badgeText}</span>
            <p className="text-slate-600 text-xs">{concernConfig.subText}</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-300 bg-slate-50/50 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Clinical Specialty</span>
            <span className="font-extrabold text-sm text-teal-900 block">{specialtyInfo.title}</span>
            <p className="text-slate-600 text-xs">{specialtyInfo.reason}</p>
          </div>
        </div>

        {/* Primary Symptoms & Findings */}
        <div className="space-y-2 border-t border-slate-200 pt-3 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Key Clinical Findings & Symptoms
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-slate-800 pl-1">
            {assessment?.concerns && assessment.concerns.length > 0
              ? assessment.concerns.map((c, i) => (
                  <li key={i}>
                    <strong>{c.title || c.type.replace(/_/g, ' ')}:</strong> {c.description}
                  </li>
                ))
              : assessment?.keyFindings?.map((f, i) => (
                  <li key={i}>
                    <strong>{f.title}:</strong> {f.description}
                  </li>
                )) || (
                  <li>Standard oral mucosal screening examination completed without acute red flags.</li>
                )}
          </ul>
        </div>

        {/* Action Plan */}
        <div className="space-y-2 border-t border-slate-200 pt-3 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Clinical Action Plan & Triage Checklist
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-800 pl-1">
            <li>
              <strong>Specialist Consultation ({specialtyInfo.title}):</strong> Schedule an in-person physical oral mucosal inspection within {assessment?.suggestedTimeframe || '7-14 days'}.
            </li>
            <li>
              <strong>Share Structured Intake Note:</strong> Present this clinical report to your examining dental surgeon or physician at check-in.
            </li>
            <li>
              <strong>14-Day Lesion Recheck Protocol:</strong> Any unhealed mucosal ulceration, leukoplakic plaque, or red patch persisting unchanged beyond 14 days warrants prompt clinical biopsy or diagnostic referral.
            </li>
          </ol>
        </div>

        {/* Recommended Questions for Doctor */}
        <div className="space-y-2 border-t border-slate-200 pt-3 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Recommended Questions for Healthcare Provider
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
            <li>Could you perform a complete soft-tissue examination of my tongue, oral cavity, cheeks, and floor of mouth?</li>
            <li>Does this lesion presentation look benign/traumatic, or are there features suggesting precancerous mucosal change?</li>
            <li>Is follow-up clinical re-evaluation in 10-14 days, toluidine blue stain, or specialist referral recommended?</li>
          </ul>
        </div>

        {/* Doctor Summary Note */}
        <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs print-avoid-break">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Doctor Screening Summary (EHR Note)
          </h3>
          <div className="p-4 bg-slate-50 rounded border border-slate-300 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
            {assessment?.doctorSummaryText || 'No summary text available.'}
          </div>
        </div>

        {/* Acute Emergency Warning Signs */}
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900 space-y-1 print-avoid-break">
          <span className="font-bold text-rose-800 block">Acute Emergency Guidance:</span>
          <p className="text-[11px] leading-relaxed">
            If experiencing rapid neck/facial swelling, acute difficulty breathing or swallowing, or uncontrolled oral bleeding, seek emergency medical care immediately at the nearest casualty hospital unit or call 112.
          </p>
        </div>

        {/* Clinician Signature & Stamp Area */}
        <div className="grid grid-cols-2 gap-8 border-t border-dashed border-slate-400 pt-8 text-xs text-slate-600 print-avoid-break">
          <div className="text-center pt-10 border-t border-slate-400">
            <span className="font-semibold block text-slate-800">Examining Clinician Signature</span>
            <span className="text-[10px] text-slate-500">Date: ________________________</span>
          </div>
          <div className="text-center pt-10 border-t border-slate-400">
            <span className="font-semibold block text-slate-800">Clinic / Hospital Stamp</span>
            <span className="text-[10px] text-slate-500">Registration No: ________________________</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[10px] text-slate-500 border-l-2 border-teal-600 pl-3 leading-relaxed print-avoid-break">
          <strong>Clinical Disclaimer:</strong> OralGuard AI provides educational oral health screening and clinical triage decision-support. This report does not represent a definitive medical diagnosis, nor does it replace formal physical examination, histopathology, or biopsy performed by a registered dental surgeon or oncology specialist.
        </div>
      </div>
    </div>
  );
};
