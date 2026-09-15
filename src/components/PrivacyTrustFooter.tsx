/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Privacy & Data Protection Trust Component.
 * Subtle, non-intrusive footer / banner fostering patient trust and transparency.
 */

import React, { useState } from 'react';
import { ShieldCheck, Lock, Info, X, CheckCircle, Database, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLanguage } from '../types';

interface PrivacyTrustFooterProps {
  language?: AppLanguage;
  variant?: 'footer' | 'banner' | 'compact';
  className?: string;
}

export const PrivacyTrustFooter: React.FC<PrivacyTrustFooterProps> = ({
  language = 'en',
  variant = 'footer',
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isHindi = language === 'hi';
  const isMarathi = language === 'mr';

  const detailsContent = {
    title: isHindi
      ? 'गोपनीयता और डेटा सुरक्षा सिद्धांत'
      : isMarathi
      ? 'गोपनीयता आणि डेटा संरक्षण तत्त्वे'
      : 'Privacy & Data Protection Principles',
    items: isHindi
      ? [
          {
            icon: Lock,
            title: 'डेटा एन्क्रिप्शन व सुरक्षा',
            desc: 'सभी बातचीत और नैदानिक इनपुट पारगमन (in-transit) और क्लाउड पर एन्क्रिप्टेड हैं।',
          },
          {
            icon: EyeOff,
            title: 'कोई व्यक्तिगत डेटा बिक्री नहीं',
            desc: 'आपकी स्वास्थ्य जानकारी कभी भी तीसरे पक्ष को विज्ञापनों के लिए साझा नहीं की जाती।',
          },
          {
            icon: Database,
            title: 'पूर्ण नियंत्रण',
            desc: 'आप किसी भी समय अपना सत्र रीसेट कर सकते हैं या नया मूल्यांकन शुरू कर सकते हैं।',
          },
          {
            icon: ShieldCheck,
            title: 'गैर-नैदानिक सुरक्षा मानक',
            desc: 'यह प्रणाली केवल प्रारंभिक जोखिम मूल्यांकन और सहायता के लिए बनाई गई है।',
          },
        ]
      : isMarathi
      ? [
          {
            icon: Lock,
            title: 'डेटा एन्क्रिप्शन व सुरक्षितता',
            desc: 'सर्व संभाषण आणि इनपुट सुरक्षितपणे एन्क्रिप्ट केलेले आहेत.',
          },
          {
            icon: EyeOff,
            title: 'माहिती सुरक्षित',
            desc: 'तुमची आरोग्य माहिती कधीही जाहिरातींसाठी वापरली जात नाही.',
          },
          {
            icon: Database,
            title: 'संपूर्ण नियंत्रण',
            desc: 'तुम्ही कधीही सत्र रीसेट करू शकता किंवा नवीन तपासणी सुरू करू शकता.',
          },
          {
            icon: ShieldCheck,
            title: 'सुरक्षित आरोग्य सल्ला',
            desc: 'हे केवळ प्राथमिक तपासणी आणि मार्गदर्शन सहाय्यक आहे.',
          },
        ]
      : [
          {
            icon: Lock,
            title: 'End-to-End Clinical Data Safeguards',
            desc: 'Screening conversations and symptom notes are encrypted in-transit and in secure storage.',
          },
          {
            icon: EyeOff,
            title: 'No Advertising or Data Selling',
            desc: 'Your oral health inquiries and photo observations are strictly private and never monetized.',
          },
          {
            icon: Database,
            title: 'User Sovereignty & Control',
            desc: 'Reset sessions, clear history, or manage local and cloud assessments at any time.',
          },
          {
            icon: ShieldCheck,
            title: 'Non-Diagnostic Safety Principles',
            desc: 'Designed strictly for risk triage and patient navigation, not clinical diagnosis.',
          },
        ],
  };

  if (variant === 'compact') {
    return (
      <div className={`text-center py-2 px-3 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        <span>Designed with privacy & data-protection principles</span>
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="text-teal-700 hover:text-teal-800 underline font-medium cursor-pointer ml-1"
        >
          {isHindi ? 'विवरण' : isMarathi ? 'माहिती' : 'Learn more'}
        </button>

        {/* Modal */}
        <AnimatePresence>
          {showDetails && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-sm w-full p-4.5 shadow-xl border border-slate-200 text-left space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{detailsContent.title}</h4>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {detailsContent.items.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-md bg-slate-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                          <Icon className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-[11.5px]">{item.title}</p>
                          <p className="text-slate-500 text-[10.5px] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {isHindi ? 'समझ गया' : isMarathi ? 'समजले' : 'Got it'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <footer className={`bg-slate-50 border-t border-slate-200/80 px-4 py-2.5 shrink-0 ${className}`}>
      <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>
            {isHindi
              ? 'गोपनीयता और डेटा सुरक्षा सिद्धांतों के साथ डिज़ाइन किया गया'
              : isMarathi
              ? 'गोपनीयता आणि डेटा संरक्षण तत्त्वांसह डिझाइन केलेले'
              : 'Designed with privacy and data-protection principles'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10.5px]">
          <span className="text-slate-400">Non-Diagnostic</span>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
          >
            {isHindi ? 'सुरक्षा विवरण' : isMarathi ? 'सुरक्षितता तपशील' : 'Privacy & Trust'}
          </button>
        </div>
      </div>

      {/* Trust Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-4.5 shadow-xl border border-slate-200 text-left space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{detailsContent.title}</h4>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {detailsContent.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className="w-5 h-5 rounded-md bg-slate-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                        <Icon className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-[11.5px]">{item.title}</p>
                        <p className="text-slate-500 text-[10.5px] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {isHindi ? 'समझ गया' : isMarathi ? 'समजले' : 'Got it'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
};
