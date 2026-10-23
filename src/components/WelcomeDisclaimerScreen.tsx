/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Welcome/Home Screen: Conversational AI Oral Health Screening, Risk-Triage & Care Assistant.
 * Modern, clean, professional healthcare interface with progressive disclosure.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Stethoscope,
  Globe2,
  Check,
  Sparkles,
  Info,
  Calendar,
  HeartHandshake,
  BookOpen,
  PhoneCall,
  History,
  AlertTriangle,
  MapPin,
  Camera,
  Mic,
  ChevronDown,
  Lightbulb,
  Clock,
  Layers,
  Hospital,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLanguage } from '../types';
import { PrivacyTrustFooter } from './PrivacyTrustFooter';

interface WelcomeDisclaimerProps {
  onAccept: (selectedLanguage: AppLanguage) => void;
  initialLanguage?: AppLanguage;
  onOpenHistory?: () => void;
  onOpenFollowUp?: () => void;
  onOpenAwarenessHub?: () => void;
  onOpenCessation?: () => void;
  onOpenHelplines?: () => void;
  onOpenEmergencyGuidance?: () => void;
  onOpenMouthMap?: () => void;
  onFindCare?: () => void;
}

interface DailyTipItem {
  id: string;
  category: { en: string; hi: string; mr: string };
  title: { en: string; hi: string; mr: string };
  content: { en: string; hi: string; mr: string };
}

const DAILY_ORAL_HEALTH_TIPS: DailyTipItem[] = [
  {
    id: 'tip-brushing-angle',
    category: { en: 'Technique', hi: 'ब्रशिंग तकनीक', mr: 'ब्रशिंग पद्धत' },
    title: { en: '45-Degree Gumline Angle', hi: '45-डिग्री कोण पर ब्रशिंग', mr: '४५-अंशात ब्रशिंग' },
    content: {
      en: 'Angle your toothbrush bristles at 45 degrees toward your gumline with gentle circular strokes to clear subgingival plaque.',
      hi: 'मसूड़ों की रेखा पर ब्रश को 45 डिग्री के कोण पर रखें और हल्के हाथों से ब्रश करें ताकि मसूड़ों के पास जमा प्लाक साफ हो सके।',
      mr: 'हिरड्यांच्या रेषेवर टूथब्रश ४५ अंशांच्या कोनात धरा आणि हलक्या हाताने ब्रश करा जेणेकरून साचलेला प्लाक निघून जाईल.',
    },
  },
  {
    id: 'tip-interdental-cleaning',
    category: { en: 'Hygiene', hi: 'दांतों के बीच की सफाई', mr: 'दातांमधील स्वच्छता' },
    title: { en: 'Daily Interdental Flossing', hi: 'दैनिक डेंटल फ्लॉसिंग', mr: 'दररोज फ्लॉसिंग' },
    content: {
      en: 'Standard brushing cleans only 65% of tooth surfaces. Daily flossing or interdental brushes reach the remaining 35% where cavities often start.',
      hi: 'टूथब्रश केवल 65% दांतों की सतह साफ करता है। बाकी 35% स्थान की सफाई के लिए रोज़ फ्लॉस का उपयोग करें।',
      mr: 'नियमित ब्रश फक्त ६५% दातांची जागा स्वच्छ करतो. उरलेल्या ३५% भागाच्या स्वच्छतेसाठी दररोज फ्लॉसिंग करा.',
    },
  },
  {
    id: 'tip-fourteen-day-rule',
    category: { en: 'Early Detection', hi: 'प्रारंभिक पहचान', mr: 'प्राथमिक दक्षता' },
    title: { en: 'The 14-Day Lesion Rule', hi: '14-दिन का छाला नियम', mr: '१४ दिवसांचा नियम' },
    content: {
      en: 'Any mouth sore, ulcer, or red/white patch that persists for more than 14 days without healing warrants an in-person dental evaluation.',
      hi: 'मुँह का कोई भी छाला, घाव या लाल/सफेद धब्बा जो 14 दिनों से अधिक बना रहे, उसकी दंत विशेषज्ञ से तुरंत जांच कराएं।',
      mr: 'तोंडातील कोणताही व्रण किंवा पांढरा/लाल डाग जो १४ दिवसांपेक्षा जास्त काळ राहत असेल, तर दंतवैद्यांकडून तपासणी करून घ्या.',
    },
  },
  {
    id: 'tip-tongue-hygiene',
    category: { en: 'Fresh Breath', hi: 'जीभ की स्वच्छता', mr: 'जीभेची स्वच्छता' },
    title: { en: 'Daily Tongue Cleaning', hi: 'जीभ की नियमित सफाई', mr: 'जीभेची नियमित स्वच्छता' },
    content: {
      en: 'Over 80% of bacteria causing bad breath reside on the dorsal surface of the tongue. Clean your tongue gently once a day.',
      hi: 'मुँह की दुर्गंध पैदा करने वाले 80% से अधिक बैक्टीरिया जीभ की ऊपरी सतह पर होते हैं। रोज़ाना हल्के हाथ से जीभ साफ करें।',
      mr: 'तोंडाची दुर्गंधी निर्माण करणारे ८०% हून अधिक जीवाणू जीभेवर असतात. दिवसातून एकदा हलक्या हाताने जीभ स्वच्छ करा.',
    },
  },
  {
    id: 'tip-acidic-enamel-wait',
    category: { en: 'Enamel Care', hi: 'इनेमल सुरक्षा', mr: 'इनॅमल संरक्षण' },
    title: { en: 'Wait 30 Mins After Citrus', hi: 'खट्टे भोजन के बाद 30 मिनट का नियम', mr: 'आंबट पदार्थानंतर ३० मिनिटे' },
    content: {
      en: 'Rinse with water after acidic foods or citrus, but wait 30 minutes before brushing so you do not scrub demineralized enamel.',
      hi: 'खट्टे फल या अम्लीय पेय के बाद सादे पानी से कुल्ला करें, लेकिन ब्रश करने के लिए 30 मिनट प्रतीक्षा करें ताकि इनेमल सुरक्षित रहे।',
      mr: 'लिंबूवर्गीय किंवा आंबट पेयांनंतर पाण्याने गुळणी करा, पण इनॅमलचे संरक्षण करण्यासाठी ब्रश करण्यापूर्वी ३० मिनिटे थांबा.',
    },
  },
  {
    id: 'tip-tobacco-cessation',
    category: { en: 'Prevention', hi: 'तंबाकू/सुपारी बचाव', mr: 'व्यसनमुक्ती व काळजी' },
    title: { en: 'Protect Oral Mucosa', hi: 'मुँह के ऊतकों का संरक्षण', mr: 'तोंडाच्या ऊतींचे संरक्षण' },
    content: {
      en: 'Eliminating areca nut (supari), gutkha, and tobacco drastically lowers oral submucous fibrosis and precancerous lesion risks.',
      hi: 'सुपारी, गुटखा और तंबाकू का त्याग करने से मुँह के ऊतकों को ठीक होने का अवसर मिलता है और गंभीर बीमारियों का खतरा घटता है।',
      mr: 'सुपारी, गुटखा व तंबाखूचे सेवन टाळल्याने तोंडाचे आरोग्य सुधारते आणि कर्करोगाचा धोका मोठ्या प्रमाणात कमी होतो.',
    },
  },
  {
    id: 'tip-salivary-flow',
    category: { en: 'Salivary Defense', hi: 'लार और जल संतुलन', mr: 'लाळ व पाणी संतुलन' },
    title: { en: 'Hydration Supports Saliva', hi: 'भरपूर पानी पिएं', mr: 'पुरेसे पाणी प्या' },
    content: {
      en: 'Drinking water supports healthy saliva flow, which remineralizes teeth with calcium and buffers harmful bacterial acids.',
      hi: 'पर्याप्त पानी पीने से लार बनती रहती है, जो दांतों के एसिड को बेअसर करती है और कैविटी से प्राकृतिक सुरक्षा देती है।',
      mr: 'पुरेसे पाणी प्यायल्याने लाळेचे प्रमाण चांगले राहते, ज्यामुळे दातांना आम्लापासून नैसर्गिक संरक्षण मिळते.',
    },
  },
  {
    id: 'tip-brush-replacement',
    category: { en: 'Hygiene Habits', hi: 'ब्रश बदलने का नियम', mr: 'टूथब्रश बदलण्याचा नियम' },
    title: { en: 'Replace Brush Every 3 Months', hi: 'हर 3 महीने में नया टूथब्रश', mr: 'दर ३ महिन्यांनी नवीन टूथब्रश' },
    content: {
      en: 'Swap your toothbrush every 3 months or as soon as bristles splay. Worn bristles lose efficiency and can irritate delicate gum margins.',
      hi: 'हर 3 महीने में या ब्रिसल्स मुड़ते ही नया टूथब्रश लें। घिसे हुए ब्रिसल्स मसूड़ों को नुकसान पहुंचा सकते हैं।',
      mr: 'दर ३ महिन्यांनी किंवा ब्रिसल्स खराब होताच नवीन ब्रश वापरा. खराब झालेले ब्रिसल्स हिरड्यांना इजा पोहोचवू शकतात.',
    },
  },
];

const DAILY_TIP_STORAGE_KEY = 'oralguard_daily_oral_health_tip_v1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function getDailyOralHealthTip(): { tipIndex: number; lastUpdated: number } {
  const now = Date.now();
  try {
    const stored = localStorage.getItem(DAILY_TIP_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        typeof parsed.tipIndex === 'number' &&
        parsed.tipIndex >= 0 &&
        parsed.tipIndex < DAILY_ORAL_HEALTH_TIPS.length &&
        typeof parsed.timestamp === 'number' &&
        now - parsed.timestamp < TWENTY_FOUR_HOURS_MS
      ) {
        return {
          tipIndex: parsed.tipIndex,
          lastUpdated: parsed.timestamp,
        };
      }
    }

    // Expired or missing: pick a new randomized tip
    let previousIndex = -1;
    if (stored) {
      try {
        previousIndex = JSON.parse(stored).tipIndex;
      } catch {
        // ignore parse error
      }
    }

    let nextIndex = Math.floor(Math.random() * DAILY_ORAL_HEALTH_TIPS.length);
    if (nextIndex === previousIndex && DAILY_ORAL_HEALTH_TIPS.length > 1) {
      nextIndex = (nextIndex + 1) % DAILY_ORAL_HEALTH_TIPS.length;
    }

    localStorage.setItem(
      DAILY_TIP_STORAGE_KEY,
      JSON.stringify({
        tipIndex: nextIndex,
        timestamp: now,
      })
    );

    return {
      tipIndex: nextIndex,
      lastUpdated: now,
    };
  } catch (err) {
    console.warn('LocalStorage unavailable for daily oral health tip check:', err);
    return {
      tipIndex: 0,
      lastUpdated: now,
    };
  }
}

export const WelcomeDisclaimerScreen: React.FC<WelcomeDisclaimerProps> = ({
  onAccept,
  initialLanguage = 'en',
  onOpenHistory,
  onOpenFollowUp,
  onOpenAwarenessHub,
  onOpenCessation,
  onOpenHelplines,
  onOpenEmergencyGuidance,
  onOpenMouthMap,
  onFindCare,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(initialLanguage);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showSecondaryTools, setShowSecondaryTools] = useState(false);
  const [dailyTipState] = useState(() => getDailyOralHealthTip());

  const handleStartCheck = () => {
    onAccept(selectedLanguage);
  };

  const isHindi = selectedLanguage === 'hi';
  const isMarathi = selectedLanguage === 'mr';
  const currentDailyTip = DAILY_ORAL_HEALTH_TIPS[dailyTipState.tipIndex] || DAILY_ORAL_HEALTH_TIPS[0];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Top Brand Hero */}
          <div className="text-center pt-2 space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-700/20 mb-1">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-semibold border border-teal-200">
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>OralGuard AI 2.0</span>
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {isHindi
                  ? 'अपने मुख स्वास्थ्य को समझें। अगला कदम जानें।'
                  : isMarathi
                  ? 'तोंडाचे आरोग्य समजून घ्या. पुढचे योग्य पाऊल ओळखा.'
                  : 'Understand Your Oral Health. Know Your Next Step.'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                {isHindi
                  ? 'अपनी समस्या साझा करें, मुँह की शारीरिक रचना समझें, और डॉक्टर परामर्श के लिए बेहतर तैयारी करें।'
                  : isMarathi
                  ? 'तुमची समस्या सांगा, तोंडाची शरीररचना समजून घ्या आणि डॉक्टरांच्या सल्ल्यासाठी पूर्वतयारी करा.'
                  : 'Describe your concern, explore your oral anatomy, and prepare for a more informed healthcare consultation.'}
              </p>
            </div>
          </div>

          {/* Preferred Language Selector */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{isHindi ? 'भाषा चुनें' : isMarathi ? 'भाषा निवडा' : 'Select Language'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Auto-synced</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedLanguage('en')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedLanguage === 'en'
                    ? 'border-teal-600 bg-teal-50/90 text-teal-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>English</span>
                {selectedLanguage === 'en' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLanguage('hi')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedLanguage === 'hi'
                    ? 'border-teal-600 bg-teal-50/90 text-teal-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>हिन्दी</span>
                {selectedLanguage === 'hi' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLanguage('mr')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedLanguage === 'mr'
                    ? 'border-teal-600 bg-teal-50/90 text-teal-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>मराठी</span>
                {selectedLanguage === 'mr' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>
            </div>
          </div>

          {/* Daily Oral Health Tip Banner (Checked against localStorage, updates once every 24 hours) */}
          <div
            id="daily-oral-health-tip-banner"
            className="bg-gradient-to-br from-teal-50/90 via-emerald-50/60 to-white p-3.5 rounded-2xl border border-teal-200/90 shadow-2xs space-y-2 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-lg bg-teal-600 text-white shadow-2xs flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>{isHindi ? 'दैनिक मुख स्वास्थ्य सुझाव' : isMarathi ? 'दैनिक मौखिक आरोग्य सल्ला' : 'Daily Oral Health Tip'}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-teal-800 font-semibold border border-teal-200 shadow-2xs">
                  <Clock className="w-3 h-3 text-teal-600" />
                  <span>{isHindi ? '24 घंटे में नया' : isMarathi ? '२४ तासांत नवीन' : '24h Cycle'}</span>
                </span>
              </div>
            </div>

            <div className="space-y-1 pl-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                  {currentDailyTip.category[selectedLanguage] || currentDailyTip.category.en}
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  {currentDailyTip.title[selectedLanguage] || currentDailyTip.title.en}
                </h3>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                {currentDailyTip.content[selectedLanguage] || currentDailyTip.content.en}
              </p>
            </div>
          </div>

          {/* Primary Action Card */}
          <div className="bg-white p-4 rounded-2xl border border-teal-200/90 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900">
                  {isHindi ? 'ओरल हेल्थ चेक शुरू करें' : isMarathi ? 'तोंड आरोग्य तपासणी सुरू करा' : 'Start Oral Health Check'}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isHindi
                    ? 'बोलकर या लिखकर बताएं। लक्षण, छाले या आदतें साझा करें।'
                    : isMarathi
                    ? 'आवाज किंवा मजकुराद्वारे लक्षणे सांगा. त्वरित मूल्यांकन मिळवा.'
                    : 'Chat naturally using voice or text. Pinpoint spots on mouth map or add photos.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartCheck}
              id="btn-start-oral-check-home"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer group"
            >
              <span>{isHindi ? 'ओरल असेसमेंट शुरू करें' : isMarathi ? 'तोंड मूल्यांकन सुरू करा' : 'Start Oral Assessment'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Reassurance & Privacy statement */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-500">
                <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Designed with privacy & safety principles</span>
              </span>
              <span className="text-[10px] text-slate-400">Non-Diagnostic</span>
            </div>
          </div>

          {/* Secondary Actions (Section 4A): Explore Oral Map, Find Dental Care, View Health History */}
          <div className="grid grid-cols-3 gap-2">
            {onOpenMouthMap && (
              <button
                type="button"
                onClick={onOpenMouthMap}
                id="btn-home-explore-map"
                className="p-2.5 bg-white hover:bg-teal-50/70 active:bg-teal-100/80 border border-slate-200 hover:border-teal-300 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isHindi ? '3D ओरल मैप' : isMarathi ? '3D ओरल मॅप' : '3D Oral Map'}
                </span>
                <span className="text-[9.5px] text-slate-400">
                  {isHindi ? 'अंग अन्वेषण' : isMarathi ? 'अवयव पहा' : 'Explore Anatomy'}
                </span>
              </button>
            )}

            {onFindCare && (
              <button
                type="button"
                onClick={onFindCare}
                id="btn-home-find-care"
                className="p-2.5 bg-white hover:bg-teal-50/70 active:bg-teal-100/80 border border-slate-200 hover:border-teal-300 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Hospital className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isHindi ? 'दंत चिकित्सक' : isMarathi ? 'दंतवैद्य शोधा' : 'Find Dental Care'}
                </span>
                <span className="text-[9.5px] text-slate-400">
                  {isHindi ? 'सत्यापित क्लिनिक' : isMarathi ? 'नोंदणीकृत' : 'Verified Clinics'}
                </span>
              </button>
            )}

            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                id="btn-home-health-history"
                className="p-2.5 bg-white hover:bg-teal-50/70 active:bg-teal-100/80 border border-slate-200 hover:border-teal-300 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <History className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isHindi ? 'स्वास्थ्य इतिहास' : isMarathi ? 'आरोग्य इतिहास' : 'Health History'}
                </span>
                <span className="text-[9.5px] text-slate-400">
                  {isHindi ? 'पिछली जाँच' : isMarathi ? 'मागील नोंदी' : 'Past Records'}
                </span>
              </button>
            )}
          </div>

          {/* Progressive Disclosure: How It Works */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>{isHindi ? 'यह कैसे काम करता है?' : isMarathi ? 'हे कसे कार्य करते?' : 'How OralGuard AI Works'}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showHowItWorks && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs space-y-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="text-slate-900 block font-semibold">Conversational Screening</strong>
                      <span className="text-slate-600 text-[11px]">Describe bleeding gums, pain, sensitivity, sores, or habits in English, हिन्दी, or मराठी.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="text-slate-900 block font-semibold">Multi-Concern Triage</strong>
                      <span className="text-slate-600 text-[11px]">Identifies simultaneous concerns, anatomical locations, and urgency without medical jargon.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="text-slate-900 block font-semibold">Care Navigator & Doctor Handoff</strong>
                      <span className="text-slate-600 text-[11px]">Recommends appropriate dental or medical care level and formats a clinical summary for in-person exam.</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Secondary Tools & Patient Resources (Progressive Disclosure) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowSecondaryTools(!showSecondaryTools)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-teal-600" />
                <span>{isHindi ? 'स्वास्थ्य साधन व सहायता' : isMarathi ? 'आरोग्य साधने व सहाय्य' : 'Secondary Tools & Patient Resources'}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showSecondaryTools ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSecondaryTools && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 grid grid-cols-2 gap-2"
                >
                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={onOpenHistory}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                        <History className="w-3.5 h-3.5 text-teal-600" />
                        <span>History</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Past assessments</p>
                    </button>
                  )}

                  {onOpenFollowUp && (
                    <button
                      type="button"
                      onClick={onOpenFollowUp}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Recheck</span>
                      </div>
                      <p className="text-[10px] text-slate-500">2-week follow-up</p>
                    </button>
                  )}

                  {onOpenAwarenessHub && (
                    <button
                      type="button"
                      onClick={onOpenAwarenessHub}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                        <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                        <span>Awareness</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Oral health guides</p>
                    </button>
                  )}

                  {onOpenCessation && (
                    <button
                      type="button"
                      onClick={onOpenCessation}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cessation</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Tobacco support</p>
                    </button>
                  )}

                  {onOpenHelplines && (
                    <button
                      type="button"
                      onClick={onOpenHelplines}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                        <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                        <span>Helplines</span>
                      </div>
                      <p className="text-[10px] text-slate-500">104 / 112 / Quitline</p>
                    </button>
                  )}

                  {onOpenEmergencyGuidance && (
                    <button
                      type="button"
                      onClick={onOpenEmergencyGuidance}
                      className="p-2.5 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 mb-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Emergency</span>
                      </div>
                      <p className="text-[10px] text-rose-700">Urgent red flags</p>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Subtle Trust & Privacy Banner */}
        <PrivacyTrustFooter language={selectedLanguage} />

        {/* Safety Footer Disclaimer */}
        <div className="pt-1 text-center text-[11px] text-slate-400 space-y-0.5">
          <p>Non-diagnostic screening and triage assistant.</p>
          <p>Consult a registered dental or medical practitioner for clinical diagnosis.</p>
        </div>
      </div>
    </div>
  );
};
