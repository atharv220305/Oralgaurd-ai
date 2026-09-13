/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ChatScreen: Conversational Oral Screening dialogue with 3-language toggle (EN, हिन्दी, मराठी),
 * single source of truth `screeningSession`, and direct access to Scanner, Mouth Map, and Tracker.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Flame,
  Globe2,
  ChevronDown,
  MapPin,
  X,
  ClipboardList,
  CheckCircle2,
  Camera,
  Activity,
  HeartHandshake,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChatMessage,
  PatientProfile,
  ClinicalIndicators,
  DemoTestCase,
  OralRegion,
  ScreeningSession,
  PhotoDocumentationItem,
  SymptomProgressEntry,
  MouthMapLocationItem,
  AppLanguage,
} from '../types';
import {
  INITIAL_BOT_MESSAGE,
  INITIAL_BOT_MESSAGE_EN,
  INITIAL_BOT_MESSAGE_HI,
  DEMO_TEST_CASES,
  extractPatientProfileFromText,
  evaluateClinicalIndicators,
  getScreeningQuestionsStatus,
} from '../data/clinicalKnowledge';
import { generateAdaptiveDialogueTurn } from '../data/conversationalEngine';
import { InteractiveMouthMap } from './InteractiveMouthMap';
import { MouthScannerScreen } from './MouthScannerScreen';
import { SymptomProgressTracker } from './SymptomProgressTracker';

export const INITIAL_BOT_MESSAGE_MR: ChatMessage = {
  id: 'bot-initial-mr',
  role: 'assistant',
  content:
    'नमस्कार! मी ओरलगार्ड एआय (OralGuard AI) चा प्राथमिक तपासणी सहाय्यक आहे.\n\nकृपया आपल्या तोंडातील कोणत्याही लक्षणाबद्दल सांगा — जसे की कोणताही फोड, अल्सर (छाला), लाल किंवा पांढरा डाग, गाठ, किंवा गिळताना त्रास. आपण केव्हापासून हा बदल अनुभवत आहात?',
  timestamp: 'Just now',
  quickReplies: [
    'तोंडातील छाला / अल्सर',
    'पांढरा किंवा लाल डाग',
    'तोंड उघडण्यास त्रास (Trismus)',
    'नियमित तपासणी / कोणतीही समस्या नाही',
  ],
};

const SESSION_STORAGE_KEY = 'oralguard_persistent_screening_session_v2';

function loadPersistentScreeningSession(
  fallbackIndicators: PatientProfile,
  fallbackLang: AppLanguage
): ScreeningSession {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ScreeningSession;
        if (parsed && parsed.sessionId && parsed.profile) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }

  const initialBotText =
    fallbackLang === 'en'
      ? INITIAL_BOT_MESSAGE_EN.content
      : fallbackLang === 'hi'
      ? INITIAL_BOT_MESSAGE_HI.content
      : INITIAL_BOT_MESSAGE_MR.content;

  return {
    sessionId: `session-${Date.now()}`,
    stage: 1,
    currentStepName: 'Symptoms',
    profile: { ...fallbackIndicators, detectedLanguage: fallbackLang },
    lastAssistantQuestion: initialBotText,
    turnCount: 0,
    evaluatedFields: [],
    isComplete: false,
    emergencyTriggered: Boolean(fallbackIndicators.emergencyFlagTriggered),
    lastUpdatedAt: Date.now(),
  };
}

function persistScreeningSession(session: ScreeningSession) {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }
}

interface ChatScreenProps {
  onCompleteScreening: (profile: PatientProfile) => void;
  indicators: PatientProfile;
  setIndicators: React.Dispatch<React.SetStateAction<PatientProfile>>;
  initialLanguage?: AppLanguage;
  onOpenCessation?: () => void;
  onOpenAwarenessHub?: () => void;
  onOpenAskOralGuard?: () => void;
  onOpenFollowUp?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onCompleteScreening,
  indicators,
  setIndicators,
  initialLanguage,
  onOpenCessation,
  onOpenAwarenessHub,
  onOpenAskOralGuard,
  onOpenFollowUp,
}) => {
  const activeInitialLang: AppLanguage = (initialLanguage || indicators.detectedLanguage || 'en') as AppLanguage;
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(activeInitialLang);
  const [messages, setMessages] = useState<ChatMessage[]>([
    activeInitialLang === 'en'
      ? INITIAL_BOT_MESSAGE_EN
      : activeInitialLang === 'hi'
      ? INITIAL_BOT_MESSAGE_HI
      : INITIAL_BOT_MESSAGE_MR,
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [exchangesCount, setExchangesCount] = useState(0);
  const [showDemoCases, setShowDemoCases] = useState(false);
  const [showMouthMap, setShowMouthMap] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  // Persistent screening session state tracking structured clinical context across turns
  const [screeningSession, setScreeningSession] = useState<ScreeningSession>(() =>
    loadPersistentScreeningSession(indicators, activeInitialLang)
  );

  // Automatically sync screeningSession state to sessionStorage
  useEffect(() => {
    persistScreeningSession(screeningSession);
  }, [screeningSession]);

  // Reset session if top-level profile was reset (e.g. retake screening from result screen)
  useEffect(() => {
    if (Object.keys(indicators).length === 0 && screeningSession.turnCount > 0) {
      const initialMsg =
        selectedLanguage === 'en'
          ? INITIAL_BOT_MESSAGE_EN
          : selectedLanguage === 'hi'
          ? INITIAL_BOT_MESSAGE_HI
          : INITIAL_BOT_MESSAGE_MR;

      const freshSession: ScreeningSession = {
        sessionId: `session-${Date.now()}`,
        stage: 1,
        currentStepName: 'Symptoms',
        profile: { detectedLanguage: selectedLanguage },
        lastAssistantQuestion: initialMsg.content,
        turnCount: 0,
        evaluatedFields: [],
        isComplete: false,
        emergencyTriggered: false,
        lastUpdatedAt: Date.now(),
      };
      setScreeningSession(freshSession);
      persistScreeningSession(freshSession);
      setMessages([initialMsg]);
      setExchangesCount(0);
    }
  }, [indicators, selectedLanguage]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle oral map confirmed selection (Multi-Location Support)
  const handleConfirmMultipleLocationsFromMap = (regions: OralRegion[]) => {
    if (regions.length === 0) return;
    const isUnknown = regions.some((r) => r.id === 'unknown_location');
    const locationItems: MouthMapLocationItem[] = isUnknown
      ? [{ id: 'unknown_location', area: 'Not sure / Unspecified', hindiName: 'सटीक स्थान ज्ञात नहीं', marathiName: 'सटीक जागा माहित नाही', confirmed: true }]
      : regions.map((r) => ({ id: r.id, area: r.name, hindiName: r.hindiName, marathiName: r.marathiName, confirmed: true }));

    const locationNames = isUnknown ? 'Not sure / Unspecified' : regions.map((r) => r.name).join(', ');
    const regionIds = isUnknown ? [] : regions.map((r) => r.id);

    const updated: PatientProfile = {
      ...indicators,
      detectedLanguage: selectedLanguage,
      affectedRegions: regionIds,
      primarySymptomLocation: locationNames,
      mouthMapLocations: locationItems,
    };

    setIndicators(updated);

    setScreeningSession((curr) => {
      const nextSession: ScreeningSession = {
        ...curr,
        mouthMapLocation: isUnknown ? 'unknown' : regions[0].id,
        mouthMapLocations: locationItems,
        profile: updated,
        lastUpdatedAt: Date.now(),
      };
      persistScreeningSession(nextSession);
      return nextSession;
    });

    setShowMouthMap(false);

    const messageContent = isUnknown
      ? (selectedLanguage === 'hi'
          ? 'मैंने मुँह के नक़्शे (Mouth Map) पर बताया कि मुझे सटीक स्थान की पहचान नहीं है।'
          : selectedLanguage === 'mr'
          ? 'मी माउथ मॅपवर सांगितले की मला नेमकी जागा निश्चित माहिती नाही.'
          : 'I indicated on the oral anatomy map that I am not sure of the exact location.')
      : (selectedLanguage === 'hi'
          ? `मैंने मुँह के नक़्शे (Mouth Map) पर ${regions.length > 1 ? `${regions.length} स्थान` : ''} चिह्नित किए: ${regions.map((r) => `${r.name} (${r.hindiName})`).join(', ')}`
          : selectedLanguage === 'mr'
          ? `मी माउथ मॅपवर ${regions.length > 1 ? `${regions.length} जागा` : 'जागा'} निवडल्या: ${regions.map((r) => `${r.name} (${r.marathiName || r.hindiName})`).join(', ')}`
          : `I confirmed ${regions.length > 1 ? `${regions.length} locations` : 'location'} on the mouth map: ${regions.map((r) => r.name).join(', ')}`);

    handleSendMessage(messageContent);
  };

  const handleConfirmLocationFromMap = (region: OralRegion) => {
    handleConfirmMultipleLocationsFromMap([region]);
  };

  // Clear location from screening session
  const handleClearLocationFromMap = () => {
    const updated: PatientProfile = {
      ...indicators,
      detectedLanguage: selectedLanguage,
      affectedRegions: [],
      primarySymptomLocation: undefined,
      mouthMapLocations: [],
    };

    setIndicators(updated);

    setScreeningSession((curr) => {
      const nextSession: ScreeningSession = {
        ...curr,
        mouthMapLocation: null,
        mouthMapLocations: [],
        profile: updated,
        lastUpdatedAt: Date.now(),
      };
      persistScreeningSession(nextSession);
      return nextSession;
    });
  };

  const handleCancelMouthMap = () => {
    setShowMouthMap(false);
  };

  // Feature 1: Photo Documentation Handlers
  const handleSavePhotoDocumentation = (photo: PhotoDocumentationItem) => {
    const currentPhotos = screeningSession.photoDocumentation || screeningSession.profile.photoDocumentation || [];
    const updatedPhotos = [...currentPhotos.filter((p) => p.id !== photo.id), photo];

    const updatedProfile: PatientProfile = {
      ...indicators,
      photoDocumentation: updatedPhotos,
    };
    setIndicators(updatedProfile);

    setScreeningSession((curr) => {
      const nextSession: ScreeningSession = {
        ...curr,
        photoDocumentation: updatedPhotos,
        profile: {
          ...curr.profile,
          photoDocumentation: updatedPhotos,
        },
        lastUpdatedAt: Date.now(),
      };
      persistScreeningSession(nextSession);
      return nextSession;
    });
  };

  const handleDeletePhotoDocumentation = (id: string) => {
    const currentPhotos = screeningSession.photoDocumentation || screeningSession.profile.photoDocumentation || [];
    const updatedPhotos = currentPhotos.filter((p) => p.id !== id);

    const updatedProfile: PatientProfile = {
      ...indicators,
      photoDocumentation: updatedPhotos,
    };
    setIndicators(updatedProfile);

    setScreeningSession((curr) => {
      const nextSession: ScreeningSession = {
        ...curr,
        photoDocumentation: updatedPhotos,
        profile: {
          ...curr.profile,
          photoDocumentation: updatedPhotos,
        },
        lastUpdatedAt: Date.now(),
      };
      persistScreeningSession(nextSession);
      return nextSession;
    });
  };

  // Feature 3: Symptom Progress Tracking Handlers
  const handleAddSymptomProgressEntry = (entry: SymptomProgressEntry) => {
    const currentEntries = screeningSession.symptomProgress || screeningSession.profile.symptomProgress || [];
    const updatedEntries = [...currentEntries.filter((e) => e.id !== entry.id), entry];

    const updatedProfile: PatientProfile = {
      ...indicators,
      symptomProgress: updatedEntries,
    };
    setIndicators(updatedProfile);

    setScreeningSession((curr) => {
      const nextSession: ScreeningSession = {
        ...curr,
        symptomProgress: updatedEntries,
        profile: {
          ...curr.profile,
          symptomProgress: updatedEntries,
        },
        lastUpdatedAt: Date.now(),
      };
      persistScreeningSession(nextSession);
      return nextSession;
    });
  };

  const handleDeleteSymptomProgressEntry = (id: string) => {
    const currentEntries = screeningSession.symptomProgress || screeningSession.profile.symptomProgress || [];
    const updatedEntries = currentEntries.filter((e) => e.id !== id);

    const updatedProfile: PatientProfile = {
      ...indicators,
      symptomProgress: updatedEntries,
    };
    setIndicators(updatedProfile);

    setScreeningSession((curr) => {
      const nextSession: ScreeningSession = {
        ...curr,
        symptomProgress: updatedEntries,
        profile: {
          ...curr.profile,
          symptomProgress: updatedEntries,
        },
        lastUpdatedAt: Date.now(),
      };
      persistScreeningSession(nextSession);
      return nextSession;
    });
  };

  // Handle language switch
  const handleLanguageToggle = (lang: AppLanguage) => {
    setSelectedLanguage(lang);
    const updated: PatientProfile = { ...indicators, detectedLanguage: lang };
    setIndicators(updated);

    const initialMsg =
      lang === 'en'
        ? INITIAL_BOT_MESSAGE_EN
        : lang === 'hi'
        ? INITIAL_BOT_MESSAGE_HI
        : INITIAL_BOT_MESSAGE_MR;

    setScreeningSession((curr) => {
      const nextSession = {
        ...curr,
        profile: updated,
        lastAssistantQuestion: initialMsg.content,
        lastUpdatedAt: Date.now(),
      };
      persistScreeningSession(nextSession);
      return nextSession;
    });

    if (messages.length === 1) {
      setMessages([initialMsg]);
    }
  };

  // Run a judge demo test case
  const handleSelectTestCase = (testCase: DemoTestCase) => {
    setShowDemoCases(false);
    setInputText(testCase.initialMessage);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Generate intelligent response strictly relying on persistent screeningSession state
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend ?? inputText).trim();
    if (!content || isTyping) return;

    setInputText('');
    const userMsgId = `user-${Date.now()}`;
    const newHistory: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content,
        timestamp: 'Just now',
      },
    ];

    setMessages(newHistory);
    setIsTyping(true);

    // 1. Locally parse user input against persistent screeningSession state object
    const lastAssistantMsg =
      screeningSession.lastAssistantQuestion ||
      [...messages].reverse().find((m) => m.role === 'assistant')?.content;

    const profileWithLockedLanguage: PatientProfile = {
      ...screeningSession.profile,
      detectedLanguage: selectedLanguage,
    };

    const updatedProfile = extractPatientProfileFromText(
      content,
      profileWithLockedLanguage,
      lastAssistantMsg
    );
    // Strict language lock: NEVER allow user free-text to reset or override language
    updatedProfile.detectedLanguage = selectedLanguage;
    setIndicators(updatedProfile);

    // Evaluate clinical indicators to determine answered vs unanswered indicators
    const { answeredIndicators, unansweredIndicators, forbiddenTopics } =
      evaluateClinicalIndicators(updatedProfile);

    const nextStep = screeningSession.turnCount + 1;
    setExchangesCount(nextStep);

    // Update persistent screeningSession state object locally before triggering API prompt
    const newlyEvaluatedFieldKeys = answeredIndicators.map((item) => String(item.key));
    const nextSession: ScreeningSession = {
      ...screeningSession,
      profile: updatedProfile,
      lastUserResponse: content,
      turnCount: nextStep,
      evaluatedFields: newlyEvaluatedFieldKeys,
      emergencyTriggered: Boolean(updatedProfile.emergencyFlagTriggered),
      duration: updatedProfile.duration,
      location: updatedProfile.primarySymptomLocation || (updatedProfile.affectedRegions && updatedProfile.affectedRegions.length > 0 ? updatedProfile.affectedRegions.join(', ') : undefined),
      symptom: updatedProfile.hasLesionOrUlcer ? 'mouth sore / ulcer' : undefined,
      pain: updatedProfile.pain ?? updatedProfile.mouthPainOrBurning,
      trigger: updatedProfile.symptomTrigger,
      lastUpdatedAt: Date.now(),
    };

    setScreeningSession(nextSession);
    persistScreeningSession(nextSession);

    // 2. Fast track if user explicitly taps view results AND screening is ready
    const evalState = getScreeningQuestionsStatus(updatedProfile);
    const isRequestingResults =
      content.toLowerCase().includes('view my screening') ||
      content.toLowerCase().includes('view result') ||
      content.toLowerCase().includes('result dekhein') ||
      content.toLowerCase().includes(' निकाल') ||
      content.toLowerCase().includes('check result') ||
      content.toLowerCase().includes('assessment');

    if (isRequestingResults && evalState.isReadyForEvaluation) {
      setTimeout(() => {
        setIsTyping(false);
        onCompleteScreening(updatedProfile);
      }, 500);
      return;
    }

    // 3. Immediate local resolution only for emergency red flags
    const isEmergency = Boolean(updatedProfile.emergencyFlagTriggered);

    if (isEmergency) {
      const turn = generateAdaptiveDialogueTurn(content, updatedProfile, newHistory, nextStep);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: turn.replyText,
            timestamp: 'Just now',
            quickReplies: turn.suggestedQuickReplies,
            isEmergencyAlert: true,
          },
        ]);

        const finalizedSession: ScreeningSession = {
          ...nextSession,
          lastAssistantQuestion: turn.replyText,
          isComplete: Boolean(turn.isReadyForEvaluation),
          emergencyTriggered: true,
          lastUpdatedAt: Date.now(),
        };

        setScreeningSession(finalizedSession);
        persistScreeningSession(finalizedSession);
        setIsTyping(false);
      }, 350);

      return;
    }

    // 4. Construct a filtered context window for the assistant API before triggering prompt.
    const filteredContextMessages: Array<{ role: string; content: string }> = [];

    filteredContextMessages.push({
      role: 'user',
      content: `[CLINICAL ASSESSMENT MEMORY & CONTEXT FILTER]
PREVIOUSLY ANSWERED CLINICAL INDICATORS (FILTERED OUT - NEVER ASK AGAIN):
${answeredIndicators.map((i) => `• ${i.label}: ${i.valueDisplay}`).join('\n')}

FORBIDDEN QUESTION TOPICS:
${forbiddenTopics.map((t) => `• ${t}`).join('\n')}

REMAINING UNANSWERED CLINICAL INDICATORS:
${
  unansweredIndicators.length > 0
    ? unansweredIndicators.map((i) => `• ${i.label}`).join('\n')
    : 'All primary screening indicators answered. Inform patient preliminary results are ready.'
}

Patient's latest message: "${content}"`,
    });

    const recentDialogueTurns = newHistory.slice(-4);
    for (const msg of recentDialogueTurns) {
      if (msg.role === 'assistant') {
        const textLower = msg.content.toLowerCase();
        const askedAnsweredTopic = forbiddenTopics.some((topic) =>
          textLower.includes(topic.toLowerCase().slice(0, 14))
        );
        if (askedAnsweredTopic) {
          filteredContextMessages.push({
            role: 'assistant',
            content: 'Understood and recorded your symptoms in your screening record.',
          });
          continue;
        }
      }
      filteredContextMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: filteredContextMessages,
          currentProfile: updatedProfile,
          language: selectedLanguage,
          previouslyAnsweredIndicators: answeredIndicators.map((i) => `${i.label}: ${i.valueDisplay}`),
          forbiddenTopics,
          unansweredIndicators: unansweredIndicators.map((i) => i.label),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          const turn = generateAdaptiveDialogueTurn(content, updatedProfile, newHistory, nextStep);

          let replyText = data.reply;

          if (turn.isReadyForEvaluation) {
            replyText = turn.replyText;
          }

          const dynamicReplies =
            Array.isArray(data.quickReplies) && data.quickReplies.length > 0
              ? data.quickReplies
              : turn.suggestedQuickReplies;

          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              role: 'assistant',
              content: replyText,
              timestamp: 'Just now',
              quickReplies: turn.isReadyForEvaluation ? turn.suggestedQuickReplies : dynamicReplies,
              isEmergencyAlert: updatedProfile.emergencyFlagTriggered,
            },
          ]);

          const finalizedSession: ScreeningSession = {
            ...nextSession,
            lastAssistantQuestion: replyText,
            isComplete: Boolean(turn.isReadyForEvaluation),
            emergencyTriggered: Boolean(updatedProfile.emergencyFlagTriggered),
            lastUpdatedAt: Date.now(),
          };

          setScreeningSession(finalizedSession);
          persistScreeningSession(finalizedSession);
          setIsTyping(false);
          return;
        }
      }
    } catch {
      // Gracefully fall through to adaptive local engine
    }

    // Local Adaptive Clinical Dialogue Turn Fallback
    const turn = generateAdaptiveDialogueTurn(content, updatedProfile, newHistory, nextStep);

    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: turn.replyText,
        timestamp: 'Just now',
        quickReplies: turn.suggestedQuickReplies,
        isEmergencyAlert: turn.isEmergencyAlert || updatedProfile.emergencyFlagTriggered,
      },
    ]);

    const finalizedSession: ScreeningSession = {
      ...nextSession,
      lastAssistantQuestion: turn.replyText,
      isComplete: Boolean(turn.isReadyForEvaluation),
      emergencyTriggered: Boolean(turn.isEmergencyAlert || updatedProfile.emergencyFlagTriggered),
      lastUpdatedAt: Date.now(),
    };

    setScreeningSession(finalizedSession);
    persistScreeningSession(finalizedSession);
    setIsTyping(false);
  };

  // Screening Progress Tracking
  const screeningEvalState = getScreeningQuestionsStatus(indicators);
  const {
    stage1Completed,
    stage2Completed,
    stage3Completed,
    stage4Completed,
    isReadyForEvaluation: isReadyToComplete,
    progressPercentage,
    currentStepNumber,
    currentStepName,
  } = screeningEvalState;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Top Screening Status & Quick Tools Bar */}
      <div className="bg-white px-3.5 py-2 border-b border-slate-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">
            Conversational Oral Screening
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Language selector with EN, हिन्दी, मराठी */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-[10px] font-medium text-slate-600">
            <button
              onClick={() => handleLanguageToggle('en')}
              aria-label="Switch language to English"
              className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                selectedLanguage === 'en' ? 'bg-white text-teal-800 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageToggle('hi')}
              aria-label="Switch language to Hindi"
              className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                selectedLanguage === 'hi' ? 'bg-white text-teal-800 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => handleLanguageToggle('mr')}
              aria-label="Switch language to Marathi"
              className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                selectedLanguage === 'mr' ? 'bg-white text-teal-800 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Interactive Mouth Map Button */}
          <button
            onClick={() => setShowMouthMap(!showMouthMap)}
            id="btn-toggle-mouth-map"
            title="Interactive Mouth Map: Click or tap specific oral regions"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
              showMouthMap
                ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                : indicators.primarySymptomLocation
                ? 'bg-teal-50 text-teal-800 border-teal-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-3 h-3 text-teal-600" />
            <span className="hidden sm:inline">Mouth Map</span>
            {(screeningSession.mouthMapLocations?.length || (indicators.primarySymptomLocation ? 1 : 0)) > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-teal-600 text-white text-[9px] font-bold">
                {screeningSession.mouthMapLocations?.length || 1}
              </span>
            )}
          </button>

          {/* Photo Scanner Button */}
          <button
            onClick={() => setShowScanner(true)}
            id="btn-toggle-photo-scanner"
            title="Photo Documentation: Capture or upload mouth photos"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
              (screeningSession.photoDocumentation?.length || 0) > 0
                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Camera className="w-3 h-3 text-indigo-600" />
            <span className="hidden sm:inline">Scanner</span>
            {(screeningSession.photoDocumentation?.length || 0) > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-bold">
                {screeningSession.photoDocumentation?.length}
              </span>
            )}
          </button>

          {/* Symptom Tracker Button */}
          <button
            onClick={() => setShowTracker(true)}
            id="btn-toggle-symptom-tracker"
            title="Symptom Tracker: Log status changes over time"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
              (screeningSession.symptomProgress?.length || 0) > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3 h-3 text-amber-600" />
            <span className="hidden sm:inline">Tracker</span>
            {(screeningSession.symptomProgress?.length || 0) > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-amber-600 text-white text-[9px] font-bold">
                {screeningSession.symptomProgress?.length}
              </span>
            )}
          </button>

          {/* Presets Button */}
          <button
            onClick={() => setShowDemoCases(!showDemoCases)}
            id="btn-demo-test-cases"
            title="Open Demo Scenarios for Aavishkar Judges"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span className="hidden sm:inline font-semibold">Presets</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDemoCases ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Interactive Mouth Map Drawer */}
      <AnimatePresence>
        {showMouthMap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-100/95 border-b border-slate-300 px-3 py-2.5 z-30 shadow-md max-h-[82vh] overflow-y-auto"
          >
            <InteractiveMouthMap
              confirmedLocation={indicators.primarySymptomLocation}
              confirmedRegionId={screeningSession.mouthMapLocation}
              confirmedLocations={screeningSession.mouthMapLocations || indicators.mouthMapLocations}
              onConfirmLocation={handleConfirmLocationFromMap}
              onConfirmMultipleLocations={handleConfirmMultipleLocationsFromMap}
              onClearLocation={handleClearLocationFromMap}
              onCancel={handleCancelMouthMap}
              onClose={handleCancelMouthMap}
              language={selectedLanguage}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <MouthScannerScreen
                photos={screeningSession.photoDocumentation || indicators.photoDocumentation || []}
                onSavePhoto={handleSavePhotoDocumentation}
                onDeletePhoto={handleDeletePhotoDocumentation}
                availableMouthLocations={screeningSession.mouthMapLocations || indicators.mouthMapLocations || []}
                onOpenMouthMap={() => {
                  setShowScanner(false);
                  setShowMouthMap(true);
                }}
                onClose={() => setShowScanner(false)}
                language={selectedLanguage}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Symptom & Progress Tracker Modal */}
      <AnimatePresence>
        {showTracker && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <SymptomProgressTracker
                entries={screeningSession.symptomProgress || indicators.symptomProgress || []}
                onAddEntry={handleAddSymptomProgressEntry}
                onDeleteEntry={handleDeleteSymptomProgressEntry}
                screeningProfile={indicators}
                availableMouthLocations={screeningSession.mouthMapLocations || indicators.mouthMapLocations || []}
                onClose={() => setShowTracker(false)}
                language={selectedLanguage}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Demo Test Cases Drawer */}
      <AnimatePresence>
        {showDemoCases && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-amber-50/95 border-b border-amber-200 px-3.5 py-2.5 space-y-2 z-20 shadow-xs"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Demo / Evaluation Cases (Aavishkar Presets)</span>
              </span>
              <span className="text-[10px] text-amber-700">Tap any preset to load</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {DEMO_TEST_CASES.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => handleSelectTestCase(tc)}
                  className="text-left p-2 rounded-lg bg-white/90 hover:bg-white border border-amber-200/90 text-slate-800 hover:border-amber-400 shadow-2xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-900 group-hover:text-teal-700">
                      {tc.title}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                      {tc.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {tc.description}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Screening Progress Bar */}
      <div className="bg-white border-b border-slate-200 px-3.5 py-2 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <ClipboardList className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span>
              Screening Progress: <strong className="text-slate-900 font-semibold">Step {currentStepNumber} of 4</strong> • {currentStepName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                progressPercentage === 100
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}
            >
              {progressPercentage}%
            </span>
            {isReadyToComplete && (
              <button
                onClick={() => onCompleteScreening(indicators)}
                className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 cursor-pointer transition-all"
                title="Sufficient clinical data collected. Review results now."
              >
                <span>View Results</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Animated Progress Bar Track */}
        <div
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Oral screening question completion progress"
          className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              progressPercentage === 100 ? 'bg-emerald-600' : 'bg-teal-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-4 gap-1 text-[10px] pt-0.5">
          <div className={`flex items-center gap-1 ${stage1Completed ? 'text-teal-800 font-semibold' : 'text-slate-400'}`}>
            {stage1Completed ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-teal-600 flex-shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
            )}
            <span className="truncate">1. Symptoms</span>
          </div>

          <div className={`flex items-center gap-1 ${stage2Completed ? 'text-teal-800 font-semibold' : 'text-slate-400'}`}>
            {stage2Completed ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-teal-600 flex-shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
            )}
            <span className="truncate">2. Duration</span>
          </div>

          <div className={`flex items-center gap-1 ${stage3Completed ? 'text-teal-800 font-semibold' : 'text-slate-400'}`}>
            {stage3Completed ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-teal-600 flex-shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
            )}
            <span className="truncate">3. Red Flags</span>
          </div>

          <div className={`flex items-center gap-1 ${stage4Completed ? 'text-teal-800 font-semibold' : 'text-slate-400'}`}>
            {stage4Completed ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-teal-600 flex-shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
            )}
            <span className="truncate">4. Habits</span>
          </div>
        </div>
      </div>

      {/* Medical Safety & Awareness Banner */}
      <div className="bg-amber-50/90 border-b border-amber-200/60 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-900">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>OralGuard AI cannot diagnose cancer • Educational screening guide</span>
        </span>
        {isReadyToComplete && (
          <button
            onClick={() => onCompleteScreening(screeningSession.profile || indicators)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            <span>Finish Early</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Emergency Red Flag Notice if Acute Symptom Detected */}
      {indicators.emergencyFlagTriggered && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-start gap-2 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Potentially Urgent Symptom Detected: </span>
            <span>{indicators.emergencyReason || 'Acute airway or severe symptom reported'}. Please seek immediate emergency medical care.</span>
          </div>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`flex gap-2 max-w-[90%] ${
                  isAssistant ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-xs ${
                    isAssistant
                      ? msg.isEmergencyAlert
                        ? 'bg-rose-600 text-white'
                        : 'bg-teal-600 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isAssistant
                        ? msg.isEmergencyAlert
                          ? 'bg-rose-50 text-rose-950 rounded-tl-xs border border-rose-200 font-medium'
                          : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
                        : 'bg-teal-600 text-white rounded-tr-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>

                  {/* Quick Reply Chips */}
                  {isAssistant && index === messages.length - 1 && !isTyping && msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-sm">
                      {msg.quickReplies.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chip)}
                          disabled={isTyping}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200/90 hover:border-teal-300 shadow-2xs transition-all active:scale-98 text-left cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}

                      {/* Optional Interactive Mouth Map shortcut chip */}
                      {!indicators.primarySymptomLocation && (
                        <button
                          onClick={() => setShowMouthMap(true)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 shadow-2xs transition-all active:scale-98 text-left cursor-pointer flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-teal-600" />
                          <span>Pinpoint on Mouth Map</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              id="analyzing-response-indicator"
              className="flex items-start gap-2.5 text-slate-600 text-xs pl-1 max-w-sm"
            >
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>

              <div className="bg-white border border-teal-200/90 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs flex flex-col gap-1.5 min-w-[210px]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:180ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:360ms]" />
                    </div>
                    <span className="text-[11.5px] font-semibold text-slate-800 tracking-tight">
                      Analyzing your response…
                    </span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                    Clinical Engine
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  <span>
                    {currentStepNumber === 1
                      ? 'Analyzing oral symptoms & mucosal signs…'
                      : currentStepNumber === 2
                      ? 'Assessing symptom duration & chronicity…'
                      : currentStepNumber === 3
                      ? 'Checking red flags & sensory changes…'
                      : 'Evaluating habit exposure & risk factors…'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Ready Banner */}
      {isReadyToComplete && (
        <div className="px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 border-t border-teal-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-teal-900">
              Clinical Context Gathered
            </span>
          </div>
          <button
            onClick={() => {
              const profileToEvaluate = screeningSession.profile || indicators;
              onCompleteScreening(profileToEvaluate);
            }}
            id="btn-view-results"
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>View Screening Result</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Clinical Tool Indicators */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 truncate">
          {indicators.primarySymptomLocation ? (
            <button
              type="button"
              onClick={() => setShowMouthMap(true)}
              className="flex items-center gap-1 text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md font-semibold cursor-pointer truncate"
              title="Click to view or edit pinpointed oral locations"
            >
              <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
              <span className="truncate">{indicators.primarySymptomLocation}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowMouthMap(true)}
              className="flex items-center gap-1 text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50/50 border border-slate-200 px-2 py-0.5 rounded-md font-medium cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Pinpoint Spot</span>
            </button>
          )}

          {(screeningSession.photoDocumentation?.length || 0) > 0 ? (
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold cursor-pointer shrink-0"
              title="Click to view or add mouth photos"
            >
              <Camera className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>{screeningSession.photoDocumentation?.length} {screeningSession.photoDocumentation?.length === 1 ? 'Photo' : 'Photos'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1 text-slate-600 hover:text-indigo-700 bg-white hover:bg-indigo-50/50 border border-slate-200 px-2 py-0.5 rounded-md font-medium cursor-pointer shrink-0"
            >
              <Camera className="w-3 h-3 text-slate-400" />
              <span>Add Photo</span>
            </button>
          )}

          {onOpenAskOralGuard && (
            <button
              type="button"
              onClick={onOpenAskOralGuard}
              className="flex items-center gap-1 text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md font-medium cursor-pointer shrink-0"
              title="Ask OralGuard AI questions"
            >
              <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
              <span>Ask AI</span>
            </button>
          )}

          {onOpenFollowUp && (
            <button
              type="button"
              onClick={onOpenFollowUp}
              className="flex items-center gap-1 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md font-medium cursor-pointer shrink-0"
              title="Open Follow-up & Reminders"
            >
              <RotateCcw className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>Follow-up</span>
            </button>
          )}

          {onOpenCessation && (
            <button
              type="button"
              onClick={onOpenCessation}
              className="flex items-center gap-1 text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md font-medium cursor-pointer shrink-0"
              title="Open Habit & Tobacco Cessation Support"
            >
              <HeartHandshake className="w-3 h-3 text-teal-600 shrink-0" />
              <span>Cessation</span>
            </button>
          )}

          {onOpenAwarenessHub && (
            <button
              type="button"
              onClick={onOpenAwarenessHub}
              className="flex items-center gap-1 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md font-medium cursor-pointer shrink-0"
              title="Open Oral Health Awareness Hub"
            >
              <BookOpen className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>Hub</span>
            </button>
          )}

          {(screeningSession.symptomProgress?.length || 0) > 0 && (
            <button
              type="button"
              onClick={() => setShowTracker(true)}
              className="flex items-center gap-1 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md font-semibold cursor-pointer shrink-0"
              title="Click to view symptom timeline"
            >
              <Activity className="w-3 h-3 text-amber-600 shrink-0" />
              <span>{screeningSession.symptomProgress?.length} Logged</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowTracker(true)}
          className="text-[10px] text-slate-500 hover:text-slate-800 font-medium shrink-0 underline cursor-pointer"
        >
          Tracker
        </button>
      </div>

      {/* Conversational Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 max-w-lg mx-auto"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              selectedLanguage === 'hi'
                ? "अपनी समस्या सरल शब्दों में बताएं (उदा. जीभ पर छाला, 3 हफ्ते से दर्द)..."
                : selectedLanguage === 'mr'
                ? "आपली समस्या सोप्या शब्दांत सांगा (उदा. तोंडातील फोड, ३ आठवड्यांपासून त्रास)..."
                : "Type your concern naturally in full sentences..."
            }
            disabled={isTyping}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            id="chat-input-field"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`p-2.5 rounded-xl transition-all ${
              inputText.trim() && !isTyping
                ? 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs cursor-pointer'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            id="chat-send-button"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-1.5">
          Describe symptoms, timeline, or habits naturally in {selectedLanguage === 'hi' ? 'हिन्दी' : selectedLanguage === 'mr' ? 'मराठी' : 'English'}.
        </p>
      </div>
    </div>
  );
};
