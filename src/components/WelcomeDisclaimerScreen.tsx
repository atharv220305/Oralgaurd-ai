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
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(initialLanguage);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showSecondaryTools, setShowSecondaryTools] = useState(false);

  const handleStartCheck = () => {
    onAccept(selectedLanguage);
  };

  const isHindi = selectedLanguage === 'hi';
  const isMarathi = selectedLanguage === 'mr';

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
                <span>Conversational Triage & Care</span>
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                OralGuard AI
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                {isHindi
                  ? 'मुँह के स्वास्थ्य की जांच, मसूड़ों की सूजन, दांत दर्द, छालों का विश्लेषण और उचित देखभाल मार्गदर्शन।'
                  : isMarathi
                  ? 'तोंडाचे आरोग्य तपासणी, हिरड्यांची सूज, दातदुखी, तोंडातील फोड व योग्य वैद्यकीय मार्गदर्शन.'
                  : 'AI-assisted conversational screening and risk triage for toothache, bleeding gums, sensitivity, mouth sores, and overall oral health.'}
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
              <span>{isHindi ? 'संवाद शुरू करें' : isMarathi ? 'तपासणी सुरू करा' : 'Start Oral Health Check'}</span>
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
