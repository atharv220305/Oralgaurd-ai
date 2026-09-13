/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Step 1: Welcome & Medical Disclaimer Screen with 3 Supported Languages:
 * English ('en'), हिन्दी ('hi'), and मराठी ('mr').
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Stethoscope,
  Lock,
  Globe2,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppLanguage } from '../types';
import { getUIText } from '../data/translations';

interface WelcomeDisclaimerProps {
  onAccept: (selectedLanguage: AppLanguage) => void;
  initialLanguage?: AppLanguage;
}

export const WelcomeDisclaimerScreen: React.FC<WelcomeDisclaimerProps> = ({
  onAccept,
  initialLanguage = 'en',
}) => {
  const [agreed, setAgreed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(initialLanguage);
  const t = getUIText(selectedLanguage);

  const handleSubmit = () => {
    if (!agreed) return;
    onAccept(selectedLanguage);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full flex-1 flex flex-col justify-between space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Step 1 of 2: Disclaimer & Language</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome to OralGuard AI
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Preliminary oral health awareness & risk screening prototype.
            </p>
          </div>

          {/* Core Safety & Medical Disclaimer Box */}
          <div className="p-4 rounded-xl bg-white border-2 border-amber-200/90 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex-shrink-0 flex items-center justify-center text-amber-700 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900">
                  {t.preliminaryNotice} • {t.notDiagnosisNotice}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  OralGuard AI is an educational and preliminary screening tool for oral health awareness.
                  It <strong>does NOT diagnose oral cancer</strong> and does not replace a doctor, dentist, or other qualified healthcare professional.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-amber-50/70 p-3 rounded-lg border border-amber-100 space-y-1.5">
              <p className="font-semibold text-amber-900">Important safety guidance:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-0.5">
                <li>This tool identifies signs or risk factors that may warrant professional evaluation.</li>
                <li>Any mouth ulcer, sore, or red/white patch lasting <strong>more than 2 weeks</strong> requires an in-person clinical examination.</li>
                <li>If you have concerning or worsening symptoms, please seek professional medical evaluation without delay.</li>
              </ul>
            </div>
          </div>

          {/* Language Selection Card (English, Hindi, Marathi) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t.selectLanguage}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Choose your preferred language. The selected language will be maintained consistently across your entire screening.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedLanguage('en')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedLanguage === 'en'
                    ? 'border-teal-500 bg-teal-50/80 ring-1 ring-teal-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-900">English</span>
                  {selectedLanguage === 'en' && (
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 leading-snug">
                  English questions, education, and summaries.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLanguage('hi')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedLanguage === 'hi'
                    ? 'border-teal-500 bg-teal-50/80 ring-1 ring-teal-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-900">हिन्दी (Hindi)</span>
                  {selectedLanguage === 'hi' && (
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 leading-snug">
                  सरल एवं प्रामाणिक हिन्दी संवाद और मार्गदर्शन।
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLanguage('mr')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedLanguage === 'mr'
                    ? 'border-teal-500 bg-teal-50/80 ring-1 ring-teal-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-900">मराठी (Marathi)</span>
                  {selectedLanguage === 'mr' && (
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 leading-snug">
                  सहज, सोपी मराठी भाषा आणि मार्गदर्शन.
                </span>
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span>Private & Confidential: All responses remain in this local screening session.</span>
          </div>
        </motion.div>

        {/* User Agreement & Action */}
        <div className="pt-3 border-t border-slate-200/80 space-y-3 pb-2">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors select-none">
            <input
              type="checkbox"
              id="disclaimer-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 leading-snug">
              I understand that <strong>OralGuard AI is for educational and preliminary screening only and does not diagnose oral cancer</strong>. If I have concerning symptoms, I will consult a healthcare professional.
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!agreed}
            id="btn-agree-start"
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
              agreed
                ? 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-teal-700/20 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>I Understand & Continue</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
