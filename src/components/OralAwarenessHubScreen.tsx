import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Flame,
  Video,
  Building2,
  Search,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  Stethoscope,
  Info,
  X,
  Share2,
  ArrowRight,
  Eye,
  Smile,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AwarenessArticle, AwarenessCategoryKey, PatientProfile, AppLanguage } from '../types';
import {
  AWARENESS_CATEGORIES,
  AWARENESS_ARTICLES,
  getContextualAwarenessRecommendations,
} from '../data/awarenessKnowledge';

interface OralAwarenessHubProps {
  patientProfile?: PatientProfile;
  onOpenCessation?: () => void;
  onOpenScanner?: () => void;
  onOpenMouthMap?: () => void;
  onClose?: () => void;
  language?: AppLanguage;
}

export const OralAwarenessHubScreen: React.FC<OralAwarenessHubProps> = ({
  patientProfile,
  onOpenCessation,
  onOpenScanner,
  onOpenMouthMap,
  onClose,
  language = 'hinglish',
}) => {
  const isHindi = language === 'hi';
  const isHinglish = language === 'hinglish';

  const [selectedCategory, setSelectedCategory] = useState<AwarenessCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<AwarenessArticle | null>(null);
  const [showSelfCheckModal, setShowSelfCheckModal] = useState(false);

  // Derive personalized recommendations based on screening profile
  const personalizedArticles = useMemo(() => {
    if (!patientProfile) return [];
    return getContextualAwarenessRecommendations(patientProfile);
  }, [patientProfile]);

  // Filtered articles list based on category & search query
  const filteredArticles = useMemo(() => {
    return AWARENESS_ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === 'all' || article.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const titleMatch =
        article.title.toLowerCase().includes(q) ||
        (article.titleHi && article.titleHi.toLowerCase().includes(q)) ||
        (article.titleHinglish && article.titleHinglish.toLowerCase().includes(q));

      const summaryMatch = article.summary.toLowerCase().includes(q);
      const pointsMatch = article.keyPoints.some((p) => p.toLowerCase().includes(q));

      return titleMatch || summaryMatch || pointsMatch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden text-slate-800">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isHindi ? 'मुख स्वास्थ्य जागरूकता केंद्र' : isHinglish ? 'Oral Health Awareness Hub' : 'Oral Health Awareness Hub'}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Education
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              {isHindi ? 'प्रमाणित चिकित्सकीय जानकारी व चेतावनी संकेत' : 'Verified clinical education, warning signs & hygiene guides'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close Awareness Hub"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mandatory Non-Diagnostic Safety Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 flex items-start gap-2 text-[11px] text-amber-900">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-snug">
          {isHindi
            ? 'यह जागरूकता केंद्र केवल शैक्षणिक जानकारी प्रदान करता है और किसी रोग का निदान नहीं करता। किसी भी लगातार बने रहने वाले घाव (२ सप्ताह से अधिक) की जाँच डॉक्टर से करवाएं।'
            : 'Awareness Only: This educational hub does not replace medical advice or provide a diagnosis. Any sore, lump, or discoloration persisting >2 weeks requires in-person evaluation.'}
        </p>
      </div>

      {/* Search Bar & Interactive Self-Check CTA */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isHindi
                ? 'विषय खोजें (उदा. छाला, गुटखा, ब्रश, चेतावनी संकेत)...'
                : 'Search topics (e.g., ulcer, gutka, brushing, leukoplakia)...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-teal-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2-Minute Oral Self-Check Quick Banner */}
        <div
          onClick={() => setShowSelfCheckModal(true)}
          className="p-2.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex items-center justify-between cursor-pointer hover:border-teal-300 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-teal-950">
                {isHindi ? '२-मिनट मुँह की स्वयं-जाँच (Self-Check Guide)' : '2-Minute Mirror Self-Check Routine'}
              </h3>
              <p className="text-[10.5px] text-teal-700">
                {isHindi ? 'शीशे के सामने ५ आसान चरणों में मुँह की जाँच करें' : 'Step-by-step visual check for lips, tongue, cheeks, and roof'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-teal-600 shrink-0" />
        </div>
      </div>

      {/* Category Horizontal Pill Scroller */}
      <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto text-xs">
        {AWARENESS_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{isHindi ? cat.labelHi : cat.label}</span>
          </button>
        ))}
      </div>

      {/* Main Educational Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Contextual Personalized Recommendations Section (if patient profile data exists) */}
        {selectedCategory === 'all' && !searchQuery && personalizedArticles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                  {isHindi ? 'आपके लिए प्रासंगिक मार्गदर्शन' : 'Tailored For Your Screening Context'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Contextual Education</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {personalizedArticles.map((article) => (
                <div
                  key={`tailored-${article.id}`}
                  onClick={() => setActiveArticle(article)}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-teal-50/80 to-white border-2 border-teal-200/90 hover:border-teal-400 cursor-pointer transition-all shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-teal-600 text-white uppercase tracking-wider">
                      Recommended
                    </span>
                    <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {isHindi && article.titleHi ? article.titleHi : article.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtered Articles Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {selectedCategory === 'all'
                ? isHindi
                  ? 'सभी शैक्षणिक विषय'
                  : 'All Topics & Guides'
                : AWARENESS_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Articles'}
            </h3>
            <span className="text-[10.5px] text-slate-400">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setActiveArticle(article)}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 cursor-pointer transition-all shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {article.badge || 'Education'}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isHindi && article.titleHi ? article.titleHi : article.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isHindi && article.subtitleHi ? article.subtitleHi : article.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {article.summary}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-teal-700 font-semibold">
                    <span>{isHindi ? 'विस्तार से पढ़ें' : 'Read full guide'}</span>
                    <ChevronRight className="w-4 h-4 text-teal-600" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
              <BookOpen className="w-6 h-6 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No articles found matching "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-teal-700 font-semibold underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Article Detail Reader Modal */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                    {activeArticle.badge || 'Guide'}
                  </span>
                  <span className="text-[11px] text-slate-500">{activeArticle.readTime}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {isHindi && activeArticle.titleHi ? activeArticle.titleHi : activeArticle.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isHindi && activeArticle.subtitleHi ? activeArticle.subtitleHi : activeArticle.subtitle}
                  </p>
                </div>

                {/* Summary */}
                <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 text-xs leading-relaxed text-teal-950">
                  {activeArticle.summary}
                </div>

                {/* Key Points */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isHindi ? 'मुख्य बिंदु व दिशा-निर्देश' : 'Key Educational Insights'}
                  </h3>
                  <ul className="space-y-2">
                    {activeArticle.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* When to Consult Doctor Box */}
                {activeArticle.whenToConsultDoctor && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-amber-900">
                      <Stethoscope className="w-3.5 h-3.5 text-amber-700" />
                      {isHindi ? 'डॉक्टर से कब संपर्क करें?' : 'When to Consult a Healthcare Professional:'}
                    </span>
                    <p className="text-[11.5px] leading-relaxed text-slate-700">
                      {activeArticle.whenToConsultDoctor}
                    </p>
                  </div>
                )}

                {/* Practical Action */}
                {activeArticle.practicalAction && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block">
                      {isHindi ? 'व्यावहारिक कदम:' : 'Practical Action You Can Take:'}
                    </span>
                    <p className="text-slate-600 text-[11.5px]">{activeArticle.practicalAction}</p>
                  </div>
                )}

                {/* Attribution */}
                {activeArticle.trustedSourceAttribution && (
                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>Verified public source attribution: {activeArticle.trustedSourceAttribution}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white"
                >
                  Close
                </button>
                {activeArticle.category === 'tobacco_supari_risks' && onOpenCessation && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveArticle(null);
                      onOpenCessation();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Open Cessation Support</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2-Minute Oral Self-Check Step-by-Step Modal */}
      <AnimatePresence>
        {showSelfCheckModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-teal-800 text-white">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <h3 className="text-xs font-bold">5-Step Monthly Oral Self-Check</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSelfCheckModal(false)}
                  className="text-teal-200 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs text-slate-700">
                <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-200 text-[11.5px] text-teal-900 leading-snug">
                  <strong>Preparation:</strong> Wash your hands, stand in front of a mirror with good lighting, or use your smartphone flashlight.
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">1. Lips & Outer Gums</span>
                    <p className="text-[11.5px] text-slate-600">
                      Gently pull down your lower lip and lift your upper lip. Look for changes in color or sores.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">2. Cheeks (Buccal Lining)</span>
                    <p className="text-[11.5px] text-slate-600">
                      Pull your cheek outward with your fingers. Check for white, red, or dark patches on both sides.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">3. Sides & Top of Tongue</span>
                    <p className="text-[11.5px] text-slate-600">
                      Stick out your tongue and move it left and right. Inspect the lateral edges where mucosal changes often occur.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">4. Floor of Mouth (Under Tongue)</span>
                    <p className="text-[11.5px] text-slate-600">
                      Touch the roof of your mouth with your tongue tip. Look at the soft floor under your tongue.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">5. Roof of the Mouth (Palate)</span>
                    <p className="text-[11.5px] text-slate-600">
                      Tilt your head back and open wide to inspect the hard and soft roof of your mouth for lumps.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                  <strong>Notice anything unusual?</strong> If you find a patch or ulcer that does not heal within 2 weeks, consult a dentist or ENT doctor.
                </div>
              </div>

              <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSelfCheckModal(false)}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
