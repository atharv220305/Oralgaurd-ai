/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Result Screen: Displays non-diagnostic risk indication, structured summary,
 * and seamless links to Doctor Handoff, Finder, Cessation, Hub, Ask OralGuard, and Follow-ups.
 */

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
  HeartHandshake,
  BookOpen,
  Eye,
  Sparkles,
  Flame,
  PhoneCall,
  Hospital,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssessmentResult, PatientProfile, AppLanguage } from '../types';
import { getUIText } from '../data/translations';

interface ResultScreenProps {
  assessment: AssessmentResult;
  profile?: PatientProfile;
  onBookAppointment: (shareSummaryConsent?: boolean) => void;
  onRetake: () => void;
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
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  assessment,
  profile,
  onBookAppointment,
  onRetake,
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
}) => {
  const [copied, setCopied] = useState(false);
  const [showQuestionsForDentist, setShowQuestionsForDentist] = useState(false);
  const [showDoctorSummaryModal, setShowDoctorSummaryModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [userConsentedToShare, setUserConsentedToShare] = useState<boolean | null>(null);

  const { riskLevel, screeningConcern } = assessment;
  const lang: AppLanguage = (profile?.detectedLanguage as AppLanguage) || 'en';
  const isHindi = lang === 'hi';
  const isMarathi = lang === 'mr';
  const t = getUIText(lang);

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
      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 pb-12">
        {/* Top Header */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              {isHindi ? 'स्क्रीनिंग परिणाम' : isMarathi ? 'स्क्रीनिंग निकाल' : 'Screening Result'}
            </span>
            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {isHindi ? 'प्रोटोटाइप मूल्यांकन' : isMarathi ? 'प्रोटोटाइप मूल्यांकन' : 'Prototype Evaluation'}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            {isHindi ? 'मुँह के कैंसर का जोखिम मूल्यांकन' : isMarathi ? 'तोंडाच्या कर्करोग जोखीम मूल्यांकन' : 'Oral Cancer Risk Indication'}
          </h1>
        </div>

        {/* Primary Screening Concern Level Card */}
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
              <span>{concernConfig.timeframe}</span>
            </div>
          </div>

          <p className="text-xs text-slate-700 mt-3 leading-relaxed">
            {concernConfig.subText}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Level: <strong className="uppercase text-slate-800">{riskLevel}</strong></span>
            <span>Non-Diagnostic Triage</span>
          </div>
        </motion.div>

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

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopyDoctorSummary}
              className="flex-1 py-2 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? (isHindi ? 'कॉपी हो गया!' : isMarathi ? 'कॉपी झाले!' : 'Summary Copied!') : (isHindi ? 'सारांश कॉपी करें' : isMarathi ? 'सारांश कॉपी करा' : 'Copy Summary')}</span>
            </button>
            <button
              onClick={handleDownloadSummary}
              className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Download text file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isHindi ? 'डाउनलोड' : isMarathi ? 'डाउनलोड' : 'Download'}</span>
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

          {showQuestionsForDentist && (
            <div className="px-4 pb-3.5 text-[11px] text-slate-600 space-y-2 border-t border-slate-100 pt-2.5">
              <p>
                {isHindi
                  ? 'जब आप अपने डेंटिस्ट या ईएनटी विशेषज्ञ से मिलें, तो ये प्रश्न अवश्य पूछें:'
                  : isMarathi
                  ? 'जेव्हा तुम्ही तुमच्या दंतवैद्य किंवा ईएनटी डॉक्टरांकडे जाल, तेव्हा हे प्रश्न नक्की विचारा:'
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
          )}
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
          {/* Prototype Book Appointment Button */}
          <button
            onClick={handleInitiateBooking}
            id="btn-book-appointment"
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-teal-700/20 transition-all cursor-pointer"
          >
            <Hospital className="w-4 h-4" />
            <span>
              {isHindi
                ? 'अस्पताल / डॉक्टर से परामर्श बुक करें'
                : isMarathi
                ? 'दवाखाना / डॉक्टर तपासणी शोधा'
                : 'Smart Doctor & Hospital Finder'}
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
              {isHindi ? 'नई स्क्रीनिंग शुरू करें' : isMarathi ? 'नवीन स्क्रीनिंग सुरू करा' : 'Start New Screening Session'}
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

              <div className="p-3 border-t border-slate-200 flex gap-2 bg-white">
                <button
                  onClick={handleCopyDoctorSummary}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isHindi ? 'कॉपी हो गया' : isMarathi ? 'कॉपी झाले' : 'Copied to Clipboard') : (isHindi ? 'पूरा सारांश कॉपी करें' : isMarathi ? 'संपूर्ण सारांश कॉपी करा' : 'Copy Full Summary')}</span>
                </button>
                <button
                  onClick={handleDownloadSummary}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'डाउनलोड .txt' : isMarathi ? 'डाउनलोड .txt' : 'Download .txt'}</span>
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
    </div>
  );
};
