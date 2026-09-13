/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneCall,
  Phone,
  ShieldCheck,
  Clock,
  Globe,
  Search,
  ChevronLeft,
  AlertTriangle,
  HeartHandshake,
  Stethoscope,
  Building2,
  CheckCircle2,
  ExternalLink,
  Info,
  Sparkles
} from 'lucide-react';
import { HealthHelpline } from '../types';
import { VERIFIED_HEALTH_HELPLINES } from '../data/clinicalKnowledge';

interface HealthHelplinesScreenProps {
  onBack: () => void;
  onOpenEmergencyGuidance: () => void;
  onFindDoctors: () => void;
}

export function HealthHelplinesScreen({
  onBack,
  onOpenEmergencyGuidance,
  onFindDoctors,
}: HealthHelplinesScreenProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  const categories = [
    { id: 'all', label: 'All Helplines', labelHi: 'सभी हेल्पलाइन', labelMr: 'सर्व हेल्पलाइन' },
    { id: 'emergency', label: 'Emergency & Ambulance', labelHi: 'आपातकालीन व एम्बुलेंस', labelMr: 'आपत्कालीन व रुग्णवाहिका' },
    { id: 'cessation', label: 'Tobacco & Addiction', labelHi: 'तंबाकू व नशा मुक्ति', labelMr: 'तंबाखू व व्यसनमुक्ती' },
    { id: 'general_health', label: 'Medical Advice (104)', labelHi: 'स्वास्थ्य सलाह (104)', labelMr: 'आरोग्य सल्ला (104)' },
    { id: 'insurance_public', label: 'Public Schemes (PM-JAY)', labelHi: 'सरकारी योजनाएं', labelMr: 'शासकीय योजना' },
  ];

  const filteredHelplines = useMemo(() => {
    return VERIFIED_HEALTH_HELPLINES.filter((h) => {
      const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        (h.hindiName && h.hindiName.toLowerCase().includes(q)) ||
        (h.marathiName && h.marathiName.toLowerCase().includes(q)) ||
        h.phone.toLowerCase().includes(q) ||
        h.dialNumber.includes(q) ||
        h.purpose.toLowerCase().includes(q) ||
        h.authority.toLowerCase().includes(q) ||
        h.region.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

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
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setSelectedLanguage('en')}
              className={`px-2 py-0.5 rounded ${selectedLanguage === 'en' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-600'}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('hi')}
              className={`px-2 py-0.5 rounded ${selectedLanguage === 'hi' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-600'}`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('mr')}
              className={`px-2 py-0.5 rounded ${selectedLanguage === 'mr' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-600'}`}
            >
              मराठी
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 max-w-2xl mx-auto w-full space-y-4 pb-12">
        {/* Header Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {selectedLanguage === 'hi'
                  ? 'सत्यापित राष्ट्रीय स्वास्थ्य हेल्पलाइन'
                  : selectedLanguage === 'mr'
                  ? 'सत्यापित राष्ट्रीय आरोग्य हेल्पलाइन'
                  : 'Verified National Health Helplines'}
              </h1>
              <p className="text-[11px] text-slate-500">
                {selectedLanguage === 'hi'
                  ? 'भारत सरकार एवं स्वास्थ्य मंत्रालयों द्वारा संचालित आधिकारिक टोल-फ्री नंबर'
                  : selectedLanguage === 'mr'
                  ? 'भारत सरकार आणि आरोग्य मंत्रालयांतर्गत अधिकृत मोफत हेल्पलाइन'
                  : 'Official government helplines for acute emergencies, medical advice, and tobacco cessation'}
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Alert Shortcut */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold flex items-center gap-1.5 text-rose-100">
              <AlertTriangle className="w-4 h-4 text-white" />
              {selectedLanguage === 'hi' ? 'गंभीर आपातकाल? तुरंत 112 या 108 डायल करें' : 'Acute Emergency? Dial 112 or 108 immediately'}
            </span>
            <p className="text-[11px] text-rose-100 leading-tight">
              {selectedLanguage === 'hi'
                ? 'यदि सांस लेने में गंभीर तकलीफ, दम घुटना या अत्यधिक रक्तस्राव हो'
                : 'For acute airway obstruction, severe choking, or continuous uncontrolled bleeding.'}
            </p>
          </div>
          <a
            href="tel:112"
            className="px-3 py-2 bg-white text-rose-700 hover:bg-rose-50 active:bg-rose-100 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call 112</span>
          </a>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                selectedLanguage === 'hi'
                  ? 'हेल्पलाइन खोजें (उदा: 104, 112, तंबाकू, PM-JAY)...'
                  : selectedLanguage === 'mr'
                  ? 'हेल्पलाइन शोधा (उदा: 104, 112, तंबाखू, PM-JAY)...'
                  : 'Search verified helplines (e.g., 104, 112, Quitline, Tele-MANAS, PM-JAY)...'
              }
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {selectedLanguage === 'hi' ? cat.labelHi : selectedLanguage === 'mr' ? cat.labelMr : cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Helpline Cards List */}
        <div className="space-y-3">
          {filteredHelplines.map((helpline) => {
            const isEmergency = helpline.category === 'emergency';
            const isCessation = helpline.category === 'cessation';
            const isScheme = helpline.category === 'insurance_public';

            return (
              <motion.div
                key={helpline.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:border-slate-300 transition-colors"
              >
                {/* Top Row: Title, Category Badge, Verified Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">
                        {selectedLanguage === 'hi' && helpline.hindiName
                          ? helpline.hindiName
                          : selectedLanguage === 'mr' && helpline.marathiName
                          ? helpline.marathiName
                          : helpline.name}
                      </span>
                      {helpline.isTollFree && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                          Toll-Free (निःशुल्क)
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                        {helpline.region}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedLanguage === 'hi' && helpline.purposeHi
                        ? helpline.purposeHi
                        : selectedLanguage === 'mr' && helpline.purposeMr
                        ? helpline.purposeMr
                        : helpline.purpose}
                    </p>
                  </div>
                </div>

                {/* Metadata Row: Authority, Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={helpline.authority}>
                      {helpline.authority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{helpline.availability}</span>
                  </div>
                </div>

                {helpline.notes && (
                  <p className="text-[10.5px] text-slate-500 italic pl-1 border-l-2 border-slate-300">
                    💡 {helpline.notes}
                  </p>
                )}

                {/* Call Button Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 font-mono tracking-wide">
                      {helpline.phone}
                    </span>
                  </div>

                  <a
                    href={`tel:${helpline.dialNumber}`}
                    className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                      isEmergency
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {helpline.phone}</span>
                  </a>
                </div>
              </motion.div>
            );
          })}

          {filteredHelplines.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
              <PhoneCall className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No helplines match your search query.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-teal-600 font-medium underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Informational Guidance */}
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Verified Public Resources Verification</span>
          </div>
          <p>
            All listed phone numbers are official Indian public health helpline services operated by the Ministry of Health and Family Welfare (MoHFW), Ministry of Home Affairs, and the National Health Authority. OralGuard AI does not list unverified commercial lines.
          </p>
        </div>

        {/* Quick Navigation Footer */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onOpenEmergencyGuidance}
            className="py-2.5 px-3 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Emergency Guidance</span>
          </button>

          <button
            type="button"
            onClick={onFindDoctors}
            className="py-2.5 px-3 bg-white hover:bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Find Clinics & Hospitals</span>
          </button>
        </div>
      </div>
    </div>
  );
}
