import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Flame,
  Target,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Smile,
  BookOpen,
  Zap,
  Info,
  ChevronRight,
  ChevronDown,
  X,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PatientProfile,
  TobaccoCessationPlan,
  TobaccoProductItem,
  TobaccoUseStatus,
  CessationGoal,
  CessationLogEntry,
} from '../types';
import {
  COMMON_TOBACCO_PRODUCTS,
  CESSATION_TIMELINE_BENEFITS,
  CRAVING_MANAGEMENT_TIPS,
  CESSATION_SAFETY_DISCLAIMER,
  CESSATION_SAFETY_DISCLAIMER_HI,
} from '../data/cessationKnowledge';

interface TobaccoCessationScreenProps {
  currentPlan?: TobaccoCessationPlan;
  logs?: CessationLogEntry[];
  patientProfile?: PatientProfile;
  onSavePlan: (plan: TobaccoCessationPlan) => void;
  onAddLogEntry?: (entry: CessationLogEntry) => void;
  onDeleteLogEntry?: (id: string) => void;
  onClose?: () => void;
  language?: 'en' | 'hinglish' | 'hi';
}

export const TobaccoCessationScreen: React.FC<TobaccoCessationScreenProps> = ({
  currentPlan,
  logs = [],
  patientProfile,
  onSavePlan,
  onAddLogEntry,
  onDeleteLogEntry,
  onClose,
  language = 'hinglish',
}) => {
  const isHindi = language === 'hi';
  const isHinglish = language === 'hinglish';

  const [activeTab, setActiveTab] = useState<'tracker' | 'plan' | 'guidance' | 'timeline'>('tracker');

  // Derive initial status from screening session if not already in plan
  const initialStatus: TobaccoUseStatus = currentPlan?.status || (() => {
    if (patientProfile) {
      if (
        (patientProfile.tobaccoSmokeless && patientProfile.tobaccoSmokeless !== 'none') ||
        (patientProfile.tobaccoSmoked && patientProfile.tobaccoSmoked !== 'none') ||
        (patientProfile.arecaOrBetelNut && patientProfile.arecaOrBetelNut !== 'none')
      ) {
        return 'current';
      }
      if (
        patientProfile.tobaccoSmokeless === 'none' &&
        patientProfile.tobaccoSmoked === 'none' &&
        patientProfile.arecaOrBetelNut === 'none'
      ) {
        return 'never';
      }
    }
    return 'current';
  })();

  const [status, setStatus] = useState<TobaccoUseStatus>(initialStatus);
  const [goal, setGoal] = useState<CessationGoal>(currentPlan?.goal || 'reduce');
  const [previousAttempts, setPreviousAttempts] = useState<string>(
    currentPlan?.previousQuitAttempts || 'Tried once before'
  );
  const [targetDate, setTargetDate] = useState<string>(
    currentPlan?.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [daysStreak, setDaysStreak] = useState<number>(currentPlan?.daysStreak || 3);
  const [products, setProducts] = useState<TobaccoProductItem[]>(() => {
    if (currentPlan?.products && currentPlan.products.length > 0) {
      return currentPlan.products;
    }
    // Infer default product from screening indicators if present
    const defaultList: TobaccoProductItem[] = [];
    if (patientProfile?.tobaccoSmokeless && patientProfile.tobaccoSmokeless !== 'none') {
      const typeLabel =
        patientProfile.tobaccoSmokeless === 'gutka'
          ? 'Gutka'
          : patientProfile.tobaccoSmokeless === 'khaini'
          ? 'Khaini'
          : patientProfile.tobaccoSmokeless === 'zarda'
          ? 'Zarda'
          : 'Paan with tobacco';
      defaultList.push({
        id: `prod-auto-${Date.now()}-1`,
        type: typeLabel,
        frequency: patientProfile.tobaccoFrequency || '3-5 times daily',
        quantity: '2-3 pouches / day',
        duration: '2+ years',
      });
    } else if (patientProfile?.arecaOrBetelNut && patientProfile.arecaOrBetelNut !== 'none') {
      defaultList.push({
        id: `prod-auto-${Date.now()}-2`,
        type: 'Supari / Areca nut',
        frequency: 'Daily',
        quantity: '1-2 pieces',
        duration: '1+ year',
      });
    } else if (patientProfile?.tobaccoSmoked && patientProfile.tobaccoSmoked !== 'none') {
      defaultList.push({
        id: `prod-auto-${Date.now()}-3`,
        type: patientProfile.tobaccoSmoked === 'bidi' ? 'Beedis' : 'Cigarettes',
        frequency: 'Daily',
        quantity: '4-6 sticks / day',
        duration: '3+ years',
      });
    } else {
      defaultList.push({
        id: `prod-${Date.now()}`,
        type: 'Gutka',
        frequency: '3-4 times daily',
        quantity: '2 pouches',
        duration: '2 years',
      });
    }
    return defaultList;
  });

  // New product form states
  const [selectedProductType, setSelectedProductType] = useState('Gutka');
  const [inputFreq, setInputFreq] = useState('Daily (2-3 times)');
  const [inputQty, setInputQty] = useState('2 pouches');
  const [inputDuration, setInputDuration] = useState('2 years');
  const [showAddProduct, setShowAddProduct] = useState(false);

  // New Craving log modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [cravingLevel, setCravingLevel] = useState<'mild' | 'moderate' | 'strong' | 'none'>('moderate');
  const [cravingAction, setCravingAction] = useState<
    'resisted' | 'reduced_intake' | 'used_substitute' | 'slipped' | 'stayed_clean'
  >('used_substitute');
  const [cravingSubstitute, setCravingSubstitute] = useState('Roasted Saunf & Elaichi');
  const [cravingNote, setCravingNote] = useState('');

  // Save changes handler
  const handleSaveAll = () => {
    const updatedPlan: TobaccoCessationPlan = {
      status,
      products,
      previousQuitAttempts: previousAttempts,
      goal,
      targetDate,
      daysStreak,
      lastProgressNote: `Goal: ${goal.toUpperCase()}, Products: ${products.map((p) => p.type).join(', ')}`,
      updatedAt: new Date().toISOString(),
    };
    onSavePlan(updatedPlan);
  };

  const handleAddProduct = () => {
    const newItem: TobaccoProductItem = {
      id: `prod-${Date.now()}`,
      type: selectedProductType,
      frequency: inputFreq,
      quantity: inputQty,
      duration: inputDuration,
    };
    const nextList = [...products, newItem];
    setProducts(nextList);
    setShowAddProduct(false);

    // Persist immediately
    const updatedPlan: TobaccoCessationPlan = {
      status,
      products: nextList,
      previousQuitAttempts: previousAttempts,
      goal,
      targetDate,
      daysStreak,
      updatedAt: new Date().toISOString(),
    };
    onSavePlan(updatedPlan);
  };

  const handleRemoveProduct = (id: string) => {
    const nextList = products.filter((p) => p.id !== id);
    setProducts(nextList);
    const updatedPlan: TobaccoCessationPlan = {
      status,
      products: nextList,
      previousQuitAttempts: previousAttempts,
      goal,
      targetDate,
      daysStreak,
      updatedAt: new Date().toISOString(),
    };
    onSavePlan(updatedPlan);
  };

  const handleCreateCravingLog = () => {
    if (!onAddLogEntry) return;
    const newEntry: CessationLogEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      cravingLevel,
      actionTaken: cravingAction,
      substituteUsed: cravingSubstitute,
      notes: cravingNote.trim() || undefined,
    };
    onAddLogEntry(newEntry);
    setShowLogModal(false);
    setCravingNote('');

    if (cravingAction === 'resisted' || cravingAction === 'used_substitute' || cravingAction === 'stayed_clean') {
      setDaysStreak((prev) => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden text-slate-800">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isHindi ? 'तंबाकू व सुपारी मुक्ति सहयोग' : isHinglish ? 'Tobacco & Gutka Cessation' : 'Tobacco & Areca Cessation'}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Support
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              {isHindi ? 'सहानुभूतिपूर्ण, बिना किसी शर्मिंदगी के मार्गदर्शन' : 'Compassionate, non-judgmental habit support'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close Cessation Support"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Safety Notice Bar */}
      <div className="bg-teal-50 border-b border-teal-200/80 px-4 py-2 flex items-start gap-2 text-[11px] text-teal-900">
        <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-snug">
          {isHindi ? CESSATION_SAFETY_DISCLAIMER_HI : CESSATION_SAFETY_DISCLAIMER}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 flex items-center gap-1 overflow-x-auto py-1.5 text-xs">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tracker' ? 'bg-teal-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>{isHindi ? 'प्रगति व ट्रैकर' : 'My Progress & Goal'}</span>
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'plan' ? 'bg-teal-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{isHindi ? 'उत्पाद व आदत' : 'Product & Usage'}</span>
          {products.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'plan' ? 'bg-white text-teal-800' : 'bg-slate-200 text-slate-700'}`}>
              {products.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('guidance')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'guidance' ? 'bg-teal-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isHindi ? 'तलब नियंत्रण युक्तियाँ' : 'Craving Tips & 4 D’s'}</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'timeline' ? 'bg-teal-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isHindi ? 'शरीर सुधार समयरेखा' : 'Health Timeline'}</span>
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: TRACKER & PROGRESS */}
        {activeTab === 'tracker' && (
          <div className="space-y-4">
            {/* Compassionate Greeting & Status Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-xs">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-teal-600/60 px-2 py-0.5 rounded text-teal-100">
                    <Smile className="w-3 h-3" />
                    <span>{isHindi ? 'सहानुभूतिपूर्ण दृष्टिकोण' : 'Judgment-Free Space'}</span>
                  </div>
                  <h2 className="text-base font-bold">
                    {status === 'never'
                      ? (isHindi ? 'तंबाकू मुक्त जीवन शैली' : 'Tobacco-Free Baseline')
                      : status === 'quit'
                      ? (isHindi ? 'बहुत बढ़िया! आप सफलता की राह पर हैं' : 'Inspiring! Maintaining Your Clean Streak')
                      : (isHindi ? 'हर छोटा कदम आपके मुँह के स्वास्थ्य की रक्षा करता है' : 'Every step reduces mucosal irritation')}
                  </h2>
                  <p className="text-xs text-teal-100 leading-relaxed max-w-sm">
                    {isHindi
                      ? 'तंबाकू या सुपारी का सेवन छोड़ना आसान नहीं होता। यह एक प्रक्रिया है, और यहाँ हर प्रयास का सम्मान किया जाता है।'
                      : 'Whether your goal is gradual reduction or immediate quitting, your oral tissues begin healing with every single avoided dose.'}
                  </p>
                </div>
              </div>

              {/* Quick Streak & Metrics */}
              {status !== 'never' && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-teal-600/60 text-center">
                  <div className="bg-teal-900/40 p-2 rounded-lg">
                    <span className="text-xs text-teal-200 block">{isHindi ? 'सक्रिय लक्ष्य' : 'Goal'}</span>
                    <span className="text-xs font-bold uppercase">{goal.replace('_', ' ')}</span>
                  </div>
                  <div className="bg-teal-900/40 p-2 rounded-lg">
                    <span className="text-xs text-teal-200 block">{isHindi ? 'नियंत्रित दिन' : 'Days Mindful'}</span>
                    <span className="text-sm font-bold">{daysStreak} Days</span>
                  </div>
                  <div className="bg-teal-900/40 p-2 rounded-lg">
                    <span className="text-xs text-teal-200 block">{isHindi ? 'दर्ज लॉग्स' : 'Logs'}</span>
                    <span className="text-sm font-bold">{logs.length}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Current Status & Personal Goal Config Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-teal-600" />
                <span>{isHindi ? 'आपकी वर्तमान स्थिति और व्यक्तिगत लक्ष्य' : 'Your Current Status & Personal Goal'}</span>
              </h3>

              {/* Status Radio Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {isHindi ? 'वर्तमान उपयोग स्थिति:' : 'Usage Status:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(
                    [
                      { id: 'current', label: 'Currently Use', labelHi: 'वर्तमान में उपयोग' },
                      { id: 'reduced', label: 'Reduced Intake', labelHi: 'मात्रा कम की है' },
                      { id: 'quit', label: 'Successfully Quit', labelHi: 'छोड़ दिया है' },
                      { id: 'never', label: 'Never Used', labelHi: 'कभी नहीं लिया' },
                      { id: 'unknown', label: 'Unsure / Prefer not to say', labelHi: 'अज्ञात' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setStatus(st.id);
                        handleSaveAll();
                      }}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        status === st.id
                          ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold ring-1 ring-teal-500 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isHindi ? st.labelHi : st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Selector */}
              {status !== 'never' && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {isHindi ? 'आपका व्यक्तिगत लक्ष्य क्या है?' : 'What is your current personal goal?'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'reduce', label: 'Gradual Reduction', desc: 'Cut down pouches / sticks daily', descHi: 'दैनिक मात्रा में धीरे-धीरे कमी' },
                        { id: 'quit', label: 'Complete Cessation', desc: 'Set target date to fully stop', descHi: 'पूर्ण रूप से बंद करने का लक्ष्य' },
                        { id: 'learn_more', label: 'Learn & Explore', desc: 'Understand health risks first', descHi: 'पहले जोखिमों को समझना' },
                        { id: 'none', label: 'No Goal Right Now', desc: 'Tracking usage only', descHi: 'केवल आदत को ट्रैक करना' },
                      ] as const
                    ).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setGoal(g.id);
                          handleSaveAll();
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          goal === g.id
                            ? 'bg-teal-50 border-teal-600 text-teal-900 ring-1 ring-teal-500 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold block">{g.label}</span>
                        <span className="text-[10.5px] text-slate-500 mt-0.5 block leading-snug">
                          {isHindi ? g.descHi : g.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Craving Logger & Action Button */}
            {status !== 'never' && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {isHindi ? 'दैनिक तलब लॉग व मुकाबला' : 'Daily Craving & Substitute Tracker'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isHindi ? 'जब भी तलब आए, विकल्प चुनें और लॉग करें' : 'Log when an urge strikes and what healthy substitute helped you resist'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogModal(true)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'तलब लॉग करें' : 'Log Urge / Substitute'}</span>
                  </button>
                </div>

                {/* Log history list */}
                {logs.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {logs.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                entry.actionTaken === 'resisted' || entry.actionTaken === 'stayed_clean'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.actionTaken === 'used_substitute'
                                  ? 'bg-teal-100 text-teal-800'
                                  : entry.actionTaken === 'reduced_intake'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {entry.actionTaken.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-slate-400 text-[10px]">{entry.date}</span>
                          </div>
                          <p className="text-slate-700 font-medium">
                            {entry.substituteUsed && (
                              <span className="text-teal-700 font-semibold">
                                {entry.substituteUsed} •{' '}
                              </span>
                            )}
                            Craving: {entry.cravingLevel}
                          </p>
                          {entry.notes && (
                            <p className="text-[11px] text-slate-500 italic">"{entry.notes}"</p>
                          )}
                        </div>

                        {onDeleteLogEntry && (
                          <button
                            type="button"
                            onClick={() => onDeleteLogEntry(entry.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded"
                            title="Delete log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
                    <Smile className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                    <span>No urge logs recorded yet. Tap "Log Urge / Substitute" to track your journey.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS & HABIT DETAILS */}
        {activeTab === 'plan' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isHindi ? 'उपयोग किए जाने वाले उत्पाद' : 'Recorded Tobacco & Areca Products'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isHindi ? 'उत्पाद प्रकार, मात्रा और अवधि का विवरण' : 'Record specific products, daily intake, and duration'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'उत्पाद जोड़ें' : 'Add Product'}</span>
                </button>
              </div>

              {/* Product cards list */}
              {products.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {products.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.type}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            {item.quantity || 'Qty unspec'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3">
                          <span>
                            <strong>Frequency:</strong> {item.frequency}
                          </span>
                          <span>
                            <strong>Duration:</strong> {item.duration}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  <span>No products recorded. Tap "Add Product" if applicable.</span>
                </div>
              )}
            </div>

            {/* Add Product Modal / Accordion */}
            <AnimatePresence>
              {showAddProduct && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-white p-4 rounded-xl border-2 border-teal-300 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">Add Tobacco or Areca Product</h4>
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Common product grid */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Select Product Type:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {COMMON_TOBACCO_PRODUCTS.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setSelectedProductType(prod.name)}
                          className={`p-2 rounded-lg text-left border text-xs transition-all cursor-pointer ${
                            selectedProductType === prod.name
                              ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block font-semibold">{prod.name}</span>
                          <span className="text-[10px] text-slate-400 block">{prod.hindiName}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency & Quantity Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        Frequency:
                      </label>
                      <input
                        type="text"
                        value={inputFreq}
                        onChange={(e) => setInputFreq(e.target.value)}
                        placeholder="e.g. 3-4 times daily"
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        Approx Quantity:
                      </label>
                      <input
                        type="text"
                        value={inputQty}
                        onChange={(e) => setInputQty(e.target.value)}
                        placeholder="e.g. 2 pouches/day"
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        Duration of Use:
                      </label>
                      <input
                        type="text"
                        value={inputDuration}
                        onChange={(e) => setInputDuration(e.target.value)}
                        placeholder="e.g. 3 years"
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                    >
                      Save Product
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Previous Quit Attempts Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                {isHindi ? 'पिछला अनुभव / छोड़ने के पिछले प्रयास:' : 'Previous Quit Attempts & Experience:'}
              </label>
              <textarea
                value={previousAttempts}
                onChange={(e) => {
                  setPreviousAttempts(e.target.value);
                  handleSaveAll();
                }}
                rows={2}
                placeholder="e.g. Tried quitting for 2 weeks last year; cravings peaked around day 3."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-teal-500"
              />
              <p className="text-[10.5px] text-slate-500">
                {isHindi
                  ? 'पहले किए गए प्रयासों से हमें यह समझने में मदद मिलती है कि आपके लिए कौन से तरीके सबसे प्रभावी रहे हैं।'
                  : 'Every past attempt provides valuable insight into what triggers your cravings and what substitutes worked best.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: CRAVING MANAGEMENT TIPS & 4 D'S */}
        {activeTab === 'guidance' && (
          <div className="space-y-4">
            <div className="space-y-3">
              {CRAVING_MANAGEMENT_TIPS.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {tip.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{isHindi ? tip.titleHi : tip.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isHindi ? tip.descriptionHi : tip.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HEALTH RECOVERY TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900 space-y-1">
              <span className="font-bold block">
                {isHindi ? 'तंबाकू रोकने के बाद शरीर में क्या सुधार होता है?' : 'What happens when you reduce or stop tobacco?'}
              </span>
              <p className="text-[11px] leading-relaxed text-teal-800">
                {isHindi
                  ? 'जैसे ही आप तंबाकू व सुपारी रोकते हैं, आपके मुँह की कोशिकाएं तुरंत खुद को ठीक करना शुरू कर देती हैं।'
                  : 'The body possesses a remarkable ability to repair damaged mucosal lining when exposure to heat, chemicals, and arecoline stops.'}
              </p>
            </div>

            <div className="space-y-2.5">
              {CESSATION_TIMELINE_BENEFITS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                      {isHindi ? item.timeframeHi : item.timeframe}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      {isHindi ? item.headlineHi : item.headline}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isHindi ? item.detailHi : item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Craving Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Log Craving or Action</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Craving Intensity */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  How strong was the urge?
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['none', 'mild', 'moderate', 'strong'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCravingLevel(lvl)}
                      className={`p-1.5 rounded-lg text-xs font-medium border text-center capitalize cursor-pointer ${
                        cravingLevel === lvl
                          ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Taken */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Action Taken:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'used_substitute', label: 'Used Substitute' },
                      { id: 'resisted', label: 'Resisted with 4 Ds' },
                      { id: 'reduced_intake', label: 'Reduced Amount' },
                      { id: 'slipped', label: 'Slipped / Used Once' },
                    ] as const
                  ).map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setCravingAction(act.id)}
                      className={`p-2 rounded-lg text-xs font-medium border text-left cursor-pointer ${
                        cravingAction === act.id
                          ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Healthy Substitute Pick */}
              {cravingAction === 'used_substitute' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Substitute Used:
                  </label>
                  <select
                    value={cravingSubstitute}
                    onChange={(e) => setCravingSubstitute(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Roasted Saunf & Elaichi">Roasted Saunf (Fennel) & Elaichi</option>
                    <option value="Cloves (Laung)">Cloves (Laung) in Cheek</option>
                    <option value="Cinnamon Bark">Cinnamon Stick / Bark</option>
                    <option value="Sipped Cold Water">Sipped Cold Water</option>
                    <option value="Sugar-Free Mint Gum">Sugar-Free Mint Gum</option>
                    <option value="Deep Breathing Routine">Deep Breathing Routine</option>
                  </select>
                </div>
              )}

              {/* Optional Note */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                  Optional Reflection / Trigger Note:
                </label>
                <input
                  type="text"
                  value={cravingNote}
                  onChange={(e) => setCravingNote(e.target.value)}
                  placeholder="e.g. Urge after meal, resisted by drinking water."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCravingLog}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save Log Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
