/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Phone,
  PhoneCall,
  ShieldAlert,
  ChevronLeft,
  HeartPulse,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Hospital,
  ArrowRight,
  Info,
  ShieldCheck
} from 'lucide-react';
import { EMERGENCY_WARNING_SIGNS } from '../data/clinicalKnowledge';

interface EmergencyGuidanceScreenProps {
  onBack: () => void;
  onFindHospital: () => void;
  onOpenHelplines: () => void;
  triggeredReason?: string;
}

export function EmergencyGuidanceScreen({
  onBack,
  onFindHospital,
  onOpenHelplines,
  triggeredReason,
}: EmergencyGuidanceScreenProps) {
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Bar Navigation */}
      <div className="bg-rose-700 text-white sticky top-0 z-20 px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-100 hover:text-white px-2 py-1 rounded-lg hover:bg-rose-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{selectedLang === 'hi' ? 'स्क्रीनिंग पर वापस' : selectedLang === 'mr' ? 'मागे जा' : 'Back to Screening'}</span>
          </button>

          <div className="flex items-center gap-1 bg-rose-800/80 p-0.5 rounded-lg text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setSelectedLang('en')}
              className={`px-2 py-0.5 rounded ${selectedLang === 'en' ? 'bg-white text-rose-900 font-bold' : 'text-rose-100'}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('hi')}
              className={`px-2 py-0.5 rounded ${selectedLang === 'hi' ? 'bg-white text-rose-900 font-bold' : 'text-rose-100'}`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('mr')}
              className={`px-2 py-0.5 rounded ${selectedLang === 'mr' ? 'bg-white text-rose-900 font-bold' : 'text-rose-100'}`}
            >
              मराठी
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 max-w-2xl mx-auto w-full space-y-4 pb-12">
        {/* Urgent Alert Banner */}
        <div className="bg-rose-600 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold bg-white/20 px-2 py-0.5 rounded text-rose-100">
                Immediate Medical Action Required
              </span>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">
                {selectedLang === 'hi'
                  ? 'तत्काल आपातकालीन चिकित्सा निर्देश'
                  : selectedLang === 'mr'
                  ? 'तातडीचे आपत्कालीन वैद्यकीय मार्गदर्शन'
                  : 'Emergency Medical Guidance'}
              </h1>
            </div>
          </div>

          {triggeredReason && (
            <div className="p-2.5 bg-rose-700/80 rounded-xl text-xs text-rose-100 border border-rose-500/50">
              <strong>Reported Emergency Flag:</strong> {triggeredReason}
            </div>
          )}

          <p className="text-xs text-rose-100 leading-relaxed">
            {selectedLang === 'hi'
              ? 'यदि आप या कोई अन्य व्यक्ति नीचे दिए गए तीव्र चेतावनी संकेतों का अनुभव कर रहे हैं, तो सामान्य ऑनलाइन स्क्रीनिंग छोड़ें और तुरंत 112 डायल करें या निकटतम अस्पताल के आपातकालीन कक्ष (Casualty / Emergency Dept) में जाएं।'
              : 'If you are experiencing acute respiratory distress, severe airway blockage, or uncontrolled oral bleeding, do not wait for routine appointments. Dial 112 or visit the nearest hospital emergency room immediately.'}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="tel:112"
              className="py-3 px-4 bg-white hover:bg-rose-50 text-rose-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call ERSS 112</span>
            </a>

            <a
              href="tel:108"
              className="py-3 px-4 bg-rose-800 hover:bg-rose-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Call Ambulance 108</span>
            </a>
          </div>
        </div>

        {/* The 5 Acute Red Flag Emergencies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>Acute Red Flag Warning Signs</span>
            </h2>
            <span className="text-[10.5px] text-slate-500">Require immediate in-person triage</span>
          </div>

          <div className="space-y-2.5">
            {EMERGENCY_WARNING_SIGNS.map((sign, idx) => (
              <motion.div
                key={sign.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border border-rose-200 p-4 space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900">
                      {selectedLang === 'hi' && sign.titleHi
                        ? sign.titleHi
                        : selectedLang === 'mr' && sign.titleMr
                        ? sign.titleMr
                        : sign.title}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                    {sign.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {sign.symptomSign}
                </p>

                <div className="text-[11px] space-y-1 pt-1">
                  <p className="text-slate-600">
                    <strong className="text-rose-700">Clinical Risk:</strong> {sign.whyUrgent}
                  </p>
                  <p className="text-slate-800 bg-rose-50/60 p-2 rounded border border-rose-100 font-medium">
                    <strong>Action:</strong> {sign.immediateAction}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Immediate First-Aid & What To Do in Transit */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <h2 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>Essential Actions While Awaiting Transport</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Keep the patient sitting upright:</strong> If breathing or swallowing is impaired, do not let the patient lie flat. Keep head slightly elevated to maintain airway patency.
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Lean forward during oral bleeding:</strong> Allow blood to drain into a tissue or bowl. Do NOT swallow blood, as it irritates the stomach and increases vomiting/choking risk.
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Do NOT pack loose gauze deep into the throat:</strong> Applying gentle pressure to an anterior lip or tongue sore is safe, but never shove loose packing into the posterior pharynx.
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Do NOT force-open a locked jaw (trismus):</strong> Forcing the jaw open during an acute space infection can spread sepsis into deeper fascial compartments.
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Do NOT consume solid food or beverages:</strong> Keep the stomach empty if emergency airway intervention or surgical drainage is needed.
              </div>
            </div>
          </div>
        </div>

        {/* Clear Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Safety & Non-Diagnostic Notice</span>
          </div>
          <p>
            OralGuard AI is an awareness and early screening triage assistant. It cannot manage acute emergencies or substitute for hospital emergency care. If life-threatening symptoms are present, always prioritize official emergency dispatch (112 / 108).
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onFindHospital}
            className="py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Hospital className="w-4 h-4" />
            <span>Find Hospitals</span>
          </button>

          <button
            type="button"
            onClick={onOpenHelplines}
            className="py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-teal-600" />
            <span>All Helplines</span>
          </button>
        </div>
      </div>
    </div>
  );
}
