import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssessmentResult, PatientProfile } from '../types';

interface ResultScreenProps {
  assessment: AssessmentResult;
  profile?: PatientProfile;
  onBookAppointment: (shareSummaryConsent?: boolean) => void;
  onRetake: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  assessment,
  profile,
  onBookAppointment,
  onRetake,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQuestionsForDentist, setShowQuestionsForDentist] = useState(false);
  const [showDoctorSummaryModal, setShowDoctorSummaryModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [userConsentedToShare, setUserConsentedToShare] = useState<boolean | null>(null);

  const { riskLevel, screeningConcern } = assessment;
  const lang = profile?.detectedLanguage || 'en';
  const isHindi = lang === 'hi';
  const isHinglish = lang === 'hinglish';

  const concernConfig = {
    low: {
      badgeText: isHindi ? 'कम जोखिम (Low Concern)' : isHinglish ? 'Low Concern (कम चिंता)' : 'LOW SCREENING CONCERN',
      subText: isHindi
        ? 'कोई गंभीर तीव्र म्यूकोसल चेतावनी संकेत नहीं मिले।'
        : isHinglish
        ? 'Koi critical acute mucosal warning signs identify nahi hue.'
        : 'No critical acute mucosal warning signs identified.',
      themeBg: 'bg-emerald-50',
      themeBorder: 'border-emerald-200',
      themeText: 'text-emerald-900',
      badgeBg: 'bg-emerald-700',
      icon: ShieldCheck,
      timeframe: isHindi
        ? 'नियमित दंत जांच (प्रत्येक 6 महीने)'
        : isHinglish
        ? 'Routine dental checkup (har 6 mahine)'
        : 'Routine dental checkup (every 6 months)',
    },
    medium: {
      badgeText: isHindi ? 'मध्यम जोखिम (Moderate Concern)' : isHinglish ? 'Moderate Concern (मध्यम जोखिम)' : 'MODERATE SCREENING CONCERN',
      subText: isHindi
        ? 'उल्लेखनीय म्यूकोसल ऊतक परिवर्तन या तंबाकू/सुपारी का जोखिम दर्ज किया गया।'
        : isHinglish
        ? 'Notable mucosal tissue changes ya tobacco/areca exposures report hue.'
        : 'Notable mucosal tissue changes or tobacco/areca exposures reported.',
      themeBg: 'bg-amber-50',
      themeBorder: 'border-amber-200',
      themeText: 'text-amber-950',
      badgeBg: 'bg-amber-700',
      icon: AlertTriangle,
      timeframe: isHindi
        ? 'यदि लक्षण 2-3 सप्ताह तक बने रहें तो व्यक्तिगत जांच कराएं'
        : isHinglish
        ? 'Evaluate in person within 2-3 weeks if persistent'
        : 'Evaluate in person within 2-3 weeks if persistent',
    },
    high: {
      badgeText: isHindi ? 'उच्च जोखिम (High Concern)' : isHinglish ? 'High Concern (उच्च जोखिम)' : 'HIGH SCREENING CONCERN',
      subText: isHindi
        ? 'विशेषज्ञ चिकित्सक द्वारा शीघ्र व्यक्तिगत नैदानिक परीक्षण की आवश्यकता है।'
        : isHinglish
        ? 'Specialist se turant in-person clinical examination karwana advisable hai.'
        : 'Symptoms warranting prompt clinical in-person examination by a specialist.',
      themeBg: 'bg-rose-50',
      themeBorder: 'border-rose-200',
      themeText: 'text-rose-950',
      badgeBg: 'bg-rose-700',
      icon: ShieldAlert,
      timeframe: isHindi
        ? '7-14 दिनों के भीतर विशेषज्ञ जांच कराएं'
        : isHinglish
        ? 'Prompt professional evaluation within 7-14 days'
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

  // Triggers booking flow with optional consent check
  const handleInitiateBooking = () => {
    setShowConsentModal(true);
  };

  const handleConsentChoice = (agreed: boolean) => {
    setUserConsentedToShare(agreed);
    setShowConsentModal(false);
    onBookAppointment(agreed);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 pb-8">
        {/* Top Header */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              {isHindi ? 'स्क्रीनिंग परिणाम' : isHinglish ? 'Screening Result' : 'Screening Result'}
            </span>
            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {isHindi ? 'प्रोटोटाइप मूल्यांकन' : 'Prototype Evaluation'}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            {isHindi ? 'मुँह के कैंसर का जोखिम मूल्यांकन' : isHinglish ? 'Oral Cancer Risk Indication' : 'Oral Cancer Risk Indication'}
          </h1>
        </div>

        {/* Primary Screening Concern Level Card (Requirement 12 & 13) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`p-4 sm:p-5 rounded-2xl border ${concernConfig.themeBorder} ${concernConfig.themeBg} shadow-xs relative overflow-hidden`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-white text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-2xs ${concernConfig.badgeBg}`}
              >
                <RiskIcon className="w-3.5 h-3.5" />
                {screeningConcern}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{assessment.suggestedTimeframe}</span>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-900 mt-3 leading-snug">
            {concernConfig.subText}
          </p>

          <p className="text-xs text-slate-700 mt-2 leading-relaxed">
            {assessment.recommendation}
          </p>
        </motion.div>

        {/* Mandatory Core Medical Disclaimer (Requirement 1 & 13) */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-900 text-xs font-bold">
            <Info className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>
              {isHindi
                ? 'प्रारंभिक स्क्रीनिंग परिणाम — यह कैंसर का निदान नहीं है'
                : isHinglish
                ? 'Preliminary Screening Result — Ye koi Cancer Diagnosis nahi hai'
                : 'Preliminary Screening Result — Not a Diagnosis'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
            {isHindi ? (
              <>
                OralGuard AI कैंसर का निदान (Diagnosis) नहीं कर सकता। केवल योग्य स्वास्थ्य पेशेवर ही इसकी पुष्टि कर सकते हैं। 2 सप्ताह से अधिक समय तक रहने वाला कोई भी छाला, सफेद या लाल पैच की <strong>व्यक्तिगत क्लिनिकल जांच</strong> अनिवार्य है।
              </>
            ) : isHinglish ? (
              <>
                OralGuard AI cancer diagnose nahi kar sakta. Keval qualified doctor/dentist hi diagnosis de sakte hain. 2 hafte se zyada rehne wala koi bhi chhala ya patch <strong>clinical examination</strong> mangta hai.
              </>
            ) : (
              <>
                OralGuard AI cannot diagnose cancer. Only a qualified healthcare professional can diagnose or rule out cancer. Any oral sore, red or white patch, or swelling lasting <strong>more than 2 weeks</strong> requires direct in-person clinical examination.
              </>
            )}
          </p>
        </div>

        {/* Anatomical Site Pinpointed via Mouth Map */}
        {profile?.primarySymptomLocation && (
          <div className="p-3.5 rounded-xl bg-teal-50/90 border border-teal-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600/15 text-teal-800 flex items-center justify-center font-bold text-sm border border-teal-600/20">
                📍
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
                  {isHindi ? 'लक्षित शारीरिक क्षेत्र (Targeted Site)' : 'Targeted Anatomical Site'}
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  {profile.primarySymptomLocation}
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800 shadow-2xs">
              {isHindi ? 'Mouth Map द्वारा चिह्नित' : 'Mouth Map Pinpointed'}
            </span>
          </div>
        )}

        {/* What We Found & Why (Requirement 13 & 14) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isHindi ? 'जांच में क्या मिला और क्यों' : isHinglish ? 'What We Found & Why (निष्कर्ष)' : 'What We Found & Why'}
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {assessment.summaryOfFindings}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {isHindi ? 'नैदानिक निष्कर्षों का विवरण:' : 'Clinical Findings Breakdown:'}
            </span>
            {assessment.keyFindings.map((finding, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="mt-0.5">
                  {finding.impact === 'flag' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  ) : finding.impact === 'moderate' ? (
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900">
                    {finding.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {finding.description}
                  </p>
                </div>
              </div>
            ))}

            {assessment.protectiveFactors.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  {isHindi ? 'सुरक्षात्मक कारक (Protective Factors)' : 'Protective Factors'}
                </span>
                <ul className="space-y-1">
                  {assessment.protectiveFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Structured Doctor Summary Card (Requirement 15) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <h2 className="text-xs font-bold text-slate-900">
                {isHindi ? 'डॉक्टर स्क्रीनिंग सारांश (Doctor Summary)' : 'Doctor Screening Summary'}
              </h2>
            </div>
            <button
              onClick={() => setShowDoctorSummaryModal(true)}
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <span>{isHindi ? 'पूरी रिपोर्ट देखें' : 'View Full Report'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            {isHindi
              ? 'एक संरचित नैदानिक नोट जिसमें आपकी बताई गई समयावधि, छाले/घाव का विवरण और तंबाकू/सुपारी के सेवन का विवरण शामिल है, डॉक्टर या दंत चिकित्सक के साथ साझा करने हेतु तैयार है।'
              : 'A structured clinical note summarizing your reported timeline, lesion details, and tobacco/areca exposures has been generated for sharing with a doctor or dentist.'}
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopyDoctorSummary}
              className="flex-1 py-2 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? (isHindi ? 'कॉपी हो गया!' : 'Summary Copied!') : (isHindi ? 'सारांश कॉपी करें' : 'Copy Summary')}</span>
            </button>
            <button
              onClick={handleDownloadSummary}
              className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Download text file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isHindi ? 'डाउनलोड' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Questions for Your Dental/Medical Visit */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <button
            onClick={() => setShowQuestionsForDentist(!showQuestionsForDentist)}
            className="w-full p-3.5 text-left flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>
                {isHindi
                  ? 'डॉक्टर / दंत चिकित्सक से पूछने योग्य अनुशंसित प्रश्न'
                  : 'Recommended Questions for Your Doctor / Dentist'}
              </span>
            </span>
            {showQuestionsForDentist ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showQuestionsForDentist && (
            <div className="px-4 pb-3.5 text-[11px] text-slate-600 space-y-2 border-t border-slate-100 pt-2.5">
              <p>
                {isHindi
                  ? 'जब आप अपने डेंटिस्ट या ईएनटी विशेषज्ञ से मिलें, तो ये प्रश्न अवश्य पूछें:'
                  : 'When you visit your dentist or ENT specialist, consider asking:'}
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-700 pl-1">
                {isHindi ? (
                  <>
                    <li>क्या आप मेरी जीभ, मुँह के निचले हिस्से और गालों के आंतरिक ऊतकों की संपूर्ण जांच कर सकते हैं?</li>
                    <li>क्या यह घाव सामान्य है या यह किसी प्री-कैंसर घाव (Precancerous lesion) का संकेत हो सकता है?</li>
                    <li>क्या मुझे 10-14 दिनों में दोबारा फॉलो-अप जांच के लिए आना चाहिए?</li>
                    <li>क्या इसके लिए बायोप्सी (Biopsy) या विशेषज्ञ संदर्भ (Specialist referral) की सिफारिश की जाती है?</li>
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
          )}
        </div>

        {/* Emergency Alert Box */}
        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {isHindi ? 'तत्काल आपातकालीन चिकित्सा कब लें:' : 'When to seek immediate emergency medical care:'}
          </span>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {isHindi
              ? 'यदि सांस लेने में तीव्र कठिनाई, गले या चेहरे पर गंभीर सूजन, या अत्यधिक रक्तस्राव हो, तो तुरंत निकटतम अस्पताल या आपातकालीन सेवा से संपर्क करें।'
              : 'If you experience acute difficulty breathing, rapid throat/facial swelling causing choking, or profuse bleeding, contact emergency medical services immediately.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          {/* Prototype Book Appointment Button */}
          <button
            onClick={handleInitiateBooking}
            id="btn-book-appointment"
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-teal-700/20 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>
              {isHindi
                ? 'अस्पताल / डॉक्टर से परामर्श बुक करें'
                : isHinglish
                ? 'Book Appointment (डॉक्टर परामर्श)'
                : 'Book Appointment (Demo Workflow)'}
            </span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onRetake}
            id="btn-retake-screening"
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {isHindi ? 'नई स्क्रीनिंग शुरू करें' : 'Start New Screening Session'}
            </span>
          </button>
        </div>
      </div>

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
                    {isHindi ? 'संरचित नैदानिक सारांश (Doctor Summary)' : 'Structured Clinical Summary'}
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

              <div className="p-3 border-t border-slate-200 flex gap-2 bg-white">
                <button
                  onClick={handleCopyDoctorSummary}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isHindi ? 'कॉपी हो गया' : 'Copied to Clipboard') : (isHindi ? 'पूरा सारांश कॉपी करें' : 'Copy Full Summary')}</span>
                </button>
                <button
                  onClick={handleDownloadSummary}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'डाउनलोड .txt' : 'Download .txt'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Explicit User Consent Modal (Requirement 17) */}
      <AnimatePresence>
        {showConsentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isHindi ? 'उपयोगकर्ता सहमति: क्या आप डॉक्टर सारांश साझा करना चाहते हैं?' : 'User Consent: Share Screening Summary?'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isHindi
                      ? 'क्या आप परामर्श के दौरान चुने गए स्वास्थ्य विशेषज्ञ के साथ अपनी इस स्क्रीनिंग रिपोर्ट को साझा करने की सहमति देते हैं?'
                      : 'Would you like to share this screening summary with the selected healthcare professional during your appointment consultation?'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800">{isHindi ? 'साझा करने पर क्या शामिल होगा:' : 'What is included if shared:'}</span>
                <p className="text-[10px] text-slate-500">
                  {isHindi
                    ? 'स्वयं बताए गए लक्षण, समयावधि, तंबाकू/सुपारी की आदतें और स्क्रीनिंग जोखिम स्तर। आपकी सहमति के बिना कोई भी डेटा बाहरी रूप से नहीं भेजा जाता।'
                    : 'Self-reported symptoms, duration, habit exposure flags, and screening concern level. No private medical data is sent externally without your choice.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={() => handleConsentChoice(true)}
                  id="btn-consent-share"
                  className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer text-center"
                >
                  {isHindi ? 'हाँ, सारांश साझा करें' : 'Yes, Share Summary'}
                </button>
                <button
                  onClick={() => handleConsentChoice(false)}
                  id="btn-consent-keep-private"
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer text-center"
                >
                  {isHindi ? 'नहीं, निजी रखें' : 'No, Keep it Private'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
