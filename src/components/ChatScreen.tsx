/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ChatScreen: Conversational AI Oral Health Screening, Risk-Triage & Care Assistant.
 * Fully integrated with Voice-to-Text (EN, HI, MR), Photo Attachments & Scanner,
 * Interactive Mouth Map, Dynamic Assessment Panel, and Smart Contextual Replies.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  MapPin,
  X,
  Camera,
  Activity,
  HeartHandshake,
  BookOpen,
  Mic,
  MicOff,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Flame,
  HelpCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChatMessage,
  PatientProfile,
  DemoTestCase,
  OralRegion,
  ScreeningSession,
  PhotoDocumentationItem,
  SymptomProgressEntry,
  AppLanguage,
  ClinicalConcern,
} from '../types';
import {
  INITIAL_BOT_MESSAGE_EN,
  INITIAL_BOT_MESSAGE_HI,
  INITIAL_BOT_MESSAGE_MR,
  DEMO_TEST_CASES,
  getScreeningQuestionsStatus,
} from '../data/clinicalKnowledge';
import {
  loadPersistentScreeningSession,
  persistScreeningSession,
  processConversationalTurn,
  applyMouthMapLocationsToSession,
} from '../services/conversationalEngine';
import { InteractiveMouthMap } from './InteractiveMouthMap';
import { MouthScannerScreen } from './MouthScannerScreen';
import { SymptomProgressTracker } from './SymptomProgressTracker';
import { PrivacyTrustFooter } from './PrivacyTrustFooter';

// SpeechRecognition type declarations for browser compatibility
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
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

// Helper to ensure clean markdown string extraction from any Gemini JSON schema or raw text response
const parseMessageContent = (content: string): string => {
  if (!content) return '';
  let text = content.trim();

  // Handle raw JSON string if passed directly in message content
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.reply) {
        return parsed.reply;
      }
    } catch {
      // Proceed if not pure JSON
    }
  }

  // Handle embedded JSON markdown code blocks
  const jsonBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock[1]);
      if (parsed.reply) {
        text = text.replace(jsonBlock[0], parsed.reply).trim();
      }
    } catch {
      // ignore
    }
  }

  return text;
};

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

  // Photo attachment in composer
  const [pendingPhoto, setPendingPhoto] = useState<{
    dataUrl: string;
    file: File;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice-to-Text State
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [interimVoiceText, setInterimVoiceText] = useState('');
  const [voiceErrorMsg, setVoiceErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Persistent screening session state tracking structured clinical context across turns
  const [screeningSession, setScreeningSession] = useState<ScreeningSession>(() =>
    loadPersistentScreeningSession(indicators, activeInitialLang)
  );

  // Automatically sync screeningSession state to sessionStorage
  useEffect(() => {
    persistScreeningSession(screeningSession);
  }, [screeningSession]);

  // Reset session if top-level profile was reset
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
  }, [messages, isTyping, interimVoiceText]);

  // Voice Recognition Setup using Web Speech API
  useEffect(() => {
    const win = (typeof window !== 'undefined' ? window : {}) as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Map app language to Web Speech API language tag
      const langCode =
        selectedLanguage === 'hi'
          ? 'hi-IN'
          : selectedLanguage === 'mr'
          ? 'mr-IN'
          : 'en-IN';

      recognition.lang = langCode;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimVoiceText('');
        setVoiceErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          setInputText((prev) => {
            const cleanFinal = final.trim();
            if (!cleanFinal) return prev;
            return prev ? `${prev} ${cleanFinal}` : cleanFinal;
          });
          setInterimVoiceText('');
        } else {
          setInterimVoiceText(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimVoiceText('');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceErrorMsg(
            selectedLanguage === 'hi'
              ? 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया ब्राउज़र में माइक्रोफ़ोन चालू करें।'
              : selectedLanguage === 'mr'
              ? 'मायक्रोफोन परवानगी नाकारली. कृपया ब्राउझरमध्ये मायक्रोफोन चालू करा.'
              : 'Microphone access denied. Please grant microphone permissions in your browser.'
          );
        } else if (event.error === 'no-speech') {
          // Silent timeout or no audio, simply reset
        } else if (event.error !== 'aborted') {
          setVoiceErrorMsg(
            selectedLanguage === 'hi'
              ? 'आवाज पहचानने में समस्या आई। कृपया पुनः प्रयास करें।'
              : selectedLanguage === 'mr'
              ? 'आवाज ओळखण्यात समस्या आली. कृपया पुन्हा प्रयत्न करा.'
              : 'Voice capture issue. Please try speaking again.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimVoiceText('');
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition initialization error:', err);
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
        } catch {
          // ignore
        }
      }
    };
  }, [selectedLanguage]);

  const toggleVoiceInput = () => {
    if (!voiceSupported) {
      setVoiceErrorMsg(
        selectedLanguage === 'hi'
          ? 'आपके ब्राउज़र में वॉइस-टू-टेक्स्ट समर्थित नहीं है।'
          : selectedLanguage === 'mr'
          ? 'तुमच्या ब्राउझरमध्ये व्हॉइस-टू-टेक्स्ट समर्थित नाही.'
          : 'Voice-to-text is not supported in this browser. Please use Chrome/Edge or type your message.'
      );
      return;
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      setVoiceErrorMsg(null);
      setInterimVoiceText('');
      try {
        const langCode =
          selectedLanguage === 'hi'
            ? 'hi-IN'
            : selectedLanguage === 'mr'
            ? 'mr-IN'
            : 'en-IN';
        recognitionRef.current.lang = langCode;
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn('Could not start recognition:', err);
        setIsListening(false);
        // If already started or interrupted, retry with fresh start
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    }
  };

  // Photo Attachment Handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPendingPhoto({
        dataUrl,
        file,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePendingPhoto = () => {
    setPendingPhoto(null);
  };

  // Handle oral map confirmed selection
  const handleConfirmMultipleLocationsFromMap = (regions: OralRegion[], targetConcernId?: string | null) => {
    if (regions.length === 0) return;
    const { updatedSession, summaryMessage } = applyMouthMapLocationsToSession(
      screeningSession,
      regions,
      targetConcernId,
      selectedLanguage
    );

    setIndicators(updatedSession.profile);
    setScreeningSession(updatedSession);
    persistScreeningSession(updatedSession);
    setShowMouthMap(false);

    handleSendMessage(summaryMessage);
  };

  // Photo Documentation Handlers
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

  // Symptom Progress Tracking Handlers
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

  // Demo test case picker
  const handleSelectTestCase = (testCase: DemoTestCase) => {
    setShowDemoCases(false);
    setInputText(testCase.initialMessage);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend ?? inputText).trim();
    const photoToAttach = pendingPhoto;

    if ((!content && !photoToAttach) || isTyping) return;

    setInputText('');
    setPendingPhoto(null);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const messageText = content || (selectedLanguage === 'hi' ? 'तस्वीर संलग्न की गई' : selectedLanguage === 'mr' ? 'फोटो जोडला' : 'Photo attached for assessment');

    // If photo attached, store in session
    if (photoToAttach) {
      const newPhotoItem: PhotoDocumentationItem = {
        id: `photo-${Date.now()}`,
        imageData: photoToAttach.dataUrl,
        location: indicators.primarySymptomLocation || 'Oral Cavity',
        locationName: indicators.primarySymptomLocation || 'Oral Cavity',
        note: content || 'Captured during chat',
        capturedAt: new Date().toISOString(),
      };
      handleSavePhotoDocumentation(newPhotoItem);
    }

    const userMsgId = `user-${Date.now()}`;
    const newHistory: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: messageText,
        timestamp: 'Just now',
        imageAttachmentUrl: photoToAttach ? photoToAttach.dataUrl : undefined,
      },
    ];

    setMessages(newHistory);
    setIsTyping(true);

    try {
      const result = await processConversationalTurn({
        patientInput: messageText,
        session: screeningSession,
        language: selectedLanguage,
        messagesHistory: newHistory,
        onCompleteScreening,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: result.reply,
          timestamp: 'Just now',
          quickReplies: result.quickReplies,
          isEmergencyAlert: result.isEmergencyAlert,
        },
      ]);

      setIndicators(result.updatedSession.profile);
      setScreeningSession(result.updatedSession);
      persistScreeningSession(result.updatedSession);
      setExchangesCount(result.updatedSession.turnCount);
      setIsTyping(false);

      // Check if user requested evaluation
      const isRequestingResults =
        messageText.toLowerCase().includes('view my screening') ||
        messageText.toLowerCase().includes('view result') ||
        messageText.toLowerCase().includes('result dekhein') ||
        messageText.toLowerCase().includes('check result') ||
        messageText.toLowerCase().includes('assessment');

      if (isRequestingResults && result.isReadyForEvaluation) {
        setTimeout(() => {
          onCompleteScreening(result.updatedSession.profile);
        }, 450);
      }
    } catch (err) {
      console.error('Error processing conversational turn:', err);
      setIsTyping(false);
    }
  };

  // Screening status & concerns
  const screeningEvalState = getScreeningQuestionsStatus(indicators);
  const {
    isReadyForEvaluation: isReadyToComplete,
    currentStepNumber,
  } = screeningEvalState;

  // Active identified concerns from profile
  const activeConcerns: ClinicalConcern[] =
    screeningSession.profile?.concerns || indicators.concerns || [];
  const hasEmergency = indicators.emergencyFlagTriggered || screeningSession.emergencyTriggered;
  const hasHabits =
    (indicators.tobaccoUse && indicators.tobaccoUse.status === 'current') ||
    (indicators.tobaccoSmokeless && indicators.tobaccoSmokeless !== 'none') ||
    (indicators.tobaccoSmoked && indicators.tobaccoSmoked !== 'none') ||
    (indicators.arecaOrBetelNut && indicators.arecaOrBetelNut !== 'none');

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Top Dynamic AI Oral Health Assessment Status Banner */}
      <div className="bg-white border-b border-slate-200/90 px-3 py-2 shrink-0 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${hasEmergency ? 'bg-rose-500 animate-ping' : 'bg-teal-500 animate-pulse'}`} />
            <span className="text-xs font-bold text-slate-800 truncate">
              Oral Health Assessment
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {activeConcerns.length === 0 ? 'Evaluating' : `${activeConcerns.length} Findings`}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Language Pill Switcher */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold text-slate-600">
              <button
                onClick={() => handleLanguageToggle('en')}
                aria-label="Switch language to English"
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedLanguage === 'en' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageToggle('hi')}
                aria-label="Switch language to Hindi"
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedLanguage === 'hi' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => handleLanguageToggle('mr')}
                aria-label="Switch language to Marathi"
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedLanguage === 'mr' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* Test Case Preset Selector */}
            <button
              onClick={() => setShowDemoCases(!showDemoCases)}
              className="text-[10px] px-2 py-1 rounded-md text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 font-semibold transition-colors cursor-pointer flex items-center gap-1"
              title="Select sample clinical test case"
            >
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span className="hidden sm:inline">Cases</span>
            </button>
          </div>
        </div>

        {/* Dynamic Findings Pills with smooth motion animations */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar text-[11px]">
          <AnimatePresence>
            {hasEmergency && (
              <motion.span
                key="pill-emergency"
                initial={{ opacity: 0, scale: 0.85, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: -6 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-bold shrink-0"
              >
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Urgent Warning Sign</span>
              </motion.span>
            )}

            {activeConcerns.length > 0 ? (
              activeConcerns.map((c) => (
                <motion.span
                  key={`concern-${c.id || c.type}`}
                  initial={{ opacity: 0, scale: 0.88, y: 3 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-900 font-semibold shrink-0"
                >
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  <span>{c.title || c.type.replace(/_/g, ' ')}</span>
                  {c.durationOverTwoWeeks && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold">&gt;2 wks</span>
                  )}
                </motion.span>
              ))
            ) : (
              <motion.span
                key="pill-listening"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-[10.5px] shrink-0"
              >
                <Sparkles className="w-3 h-3 text-slate-400" />
                <span>Listening to symptoms & habits...</span>
              </motion.span>
            )}

            {hasHabits && (
              <motion.span
                key="pill-habits"
                initial={{ opacity: 0, scale: 0.85, x: 6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 6 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold shrink-0"
              >
                <Flame className="w-3 h-3 text-amber-600" />
                <span>Habit Exposure</span>
              </motion.span>
            )}

            {indicators.primarySymptomLocation && (
              <motion.span
                key="pill-location"
                initial={{ opacity: 0, scale: 0.85, y: 3 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -3 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold shrink-0"
              >
                <MapPin className="w-3 h-3 text-indigo-600" />
                <span>{indicators.primarySymptomLocation}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Demo Test Cases Modal Dropdown */}
      <AnimatePresence>
        {showDemoCases && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-3 right-3 z-30 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 space-y-2 max-w-md mx-auto"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Select Clinical Test Case</span>
              </span>
              <button
                onClick={() => setShowDemoCases(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {DEMO_TEST_CASES.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => handleSelectTestCase(tc)}
                  className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-xs space-y-0.5 cursor-pointer"
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{tc.title}</span>
                    <span className="text-[10px] text-teal-700 font-medium">{tc.badge}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{tc.initialMessage}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          const isEmergency = msg.isEmergencyAlert;
          const cleanContent = parseMessageContent(msg.content);

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`flex gap-2 max-w-[88%] sm:max-w-[80%] ${
                  isAssistant ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs transition-colors ${
                    isAssistant
                      ? isEmergency
                        ? 'bg-rose-600'
                        : 'bg-teal-600'
                      : 'bg-slate-700'
                  }`}
                >
                  {isAssistant ? (
                    isEmergency ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble Container */}
                <div className="flex flex-col min-w-0">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs transition-colors ${
                      isAssistant
                        ? isEmergency
                          ? 'bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-tl-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                        : 'bg-teal-600 text-white rounded-tr-xs shadow-sm'
                    }`}
                  >
                    {/* Optional Image Preview inside Message */}
                    {msg.imageAttachmentUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-xs">
                        <img
                          src={msg.imageAttachmentUrl}
                          alt="Uploaded symptom"
                          className="w-full h-auto max-h-48 object-cover"
                        />
                      </div>
                    )}

                    <div
                      className={`prose prose-sm max-w-none text-xs sm:text-[13px] leading-relaxed break-words ${
                        isAssistant
                          ? 'text-slate-800'
                          : 'prose-user-bubble text-white'
                      }`}
                    >
                      <Markdown>{cleanContent}</Markdown>
                    </div>

                    {isEmergency && (
                      <div className="mt-2.5 pt-2 border-t border-rose-200 text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Immediate clinical or hospital evaluation advised (Helpline: 112 / 104)</span>
                      </div>
                    )}
                  </div>

                  {/* Smart Contextual Quick Replies */}
                  {isAssistant && index === messages.length - 1 && !isTyping && msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-md">
                      {msg.quickReplies.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chip)}
                          disabled={isTyping}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 shadow-2xs transition-all active:scale-98 text-left cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}

                      {/* Mouth Map shortcut chip if location not yet pinned */}
                      {!indicators.primarySymptomLocation && (
                        <button
                          onClick={() => setShowMouthMap(true)}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 shadow-2xs transition-all active:scale-98 text-left cursor-pointer flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-teal-600" />
                          <span>Pinpoint Spot on Map</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thoughtful Typing & Analysis Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="flex items-start gap-2 text-slate-600 text-xs pl-1 max-w-sm"
            >
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>

              <div className="bg-white border border-teal-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs flex flex-col gap-1 min-w-[220px]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:180ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:360ms]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    Understanding your symptoms…
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {currentStepNumber === 1
                    ? 'Checking oral mucosal signs & pain triggers…'
                    : currentStepNumber === 2
                    ? 'Assessing symptom duration & persistence…'
                    : 'Evaluating clinical safety & care recommendations…'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Error Notice */}
        <AnimatePresence>
          {voiceErrorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{voiceErrorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceErrorMsg(null)}
                className="p-1 rounded-lg text-amber-600 hover:bg-amber-100 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Listening Wave Indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-100/70 to-teal-50 border border-rose-300 shadow-md flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm">
                    <Mic className="w-4 h-4 animate-pulse" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-slate-900 text-[9px] font-black text-white uppercase">
                    {selectedLanguage}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-rose-950 text-xs">
                      {selectedLanguage === 'hi'
                        ? 'सुन रहे हैं (हिन्दी)...'
                        : selectedLanguage === 'mr'
                        ? 'ऐकत आहोत (मराठी)...'
                        : 'Listening (English)...'}
                    </span>
                    {/* Pulsing visual wave bars */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-3 rounded-full bg-rose-500 animate-pulse [animation-delay:0ms]" />
                      <span className="w-1 h-5 rounded-full bg-rose-600 animate-pulse [animation-delay:150ms]" />
                      <span className="w-1 h-2.5 rounded-full bg-rose-500 animate-pulse [animation-delay:300ms]" />
                      <span className="w-1 h-4 rounded-full bg-rose-600 animate-pulse [animation-delay:450ms]" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700 italic truncate font-medium mt-0.5">
                    {interimVoiceText || (
                      selectedLanguage === 'hi'
                        ? 'अपने लक्षण बोलें...'
                        : selectedLanguage === 'mr'
                        ? 'आपली लक्षणे बोला...'
                        : 'Describe your symptoms into microphone...'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedLanguage === 'hi'
                      ? 'पूर्ण'
                      : selectedLanguage === 'mr'
                      ? 'झाले'
                      : 'Done'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Assessment Summary Action Banner (When Sufficient Context Gathered) */}
      {(isReadyToComplete || activeConcerns.length > 0 || exchangesCount >= 2) && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 border-t border-teal-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-semibold text-teal-950 truncate">
              {activeConcerns.length > 0
                ? `${activeConcerns.length} oral concerns triaged`
                : 'Sufficient context gathered'}
            </span>
          </div>
          <button
            onClick={() => {
              const profileToEvaluate = screeningSession.profile || indicators;
              onCompleteScreening(profileToEvaluate);
            }}
            id="btn-view-results"
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>View Care Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Photo Attachment Thumbnail Preview in Composer */}
      {pendingPhoto && (
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={pendingPhoto.dataUrl}
              alt="Preview"
              className="w-10 h-10 rounded-lg object-cover border border-slate-300 shadow-2xs"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 block truncate max-w-[180px]">
                {pendingPhoto.name}
              </span>
              <span className="text-[10px] text-teal-700">Ready to attach with message</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemovePendingPhoto}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Conversational Composer Bar */}
      <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 shrink-0 transition-colors">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex flex-col gap-2 max-w-lg mx-auto"
        >
          {/* Main Input Row */}
          <div className="flex items-center gap-1.5">
            {/* Hidden File Input for Image Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Photo Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Upload photo of mouth symptom or sore"
              aria-label="Upload photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Mouth Map Trigger */}
            <button
              type="button"
              onClick={() => setShowMouthMap(true)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Pinpoint anatomical location on Mouth Map"
              aria-label="Open Mouth Map"
            >
              <MapPin className="w-4 h-4" />
            </button>

            {/* Voice-to-Text Microphone Button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs animate-pulse'
                    : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50 border-slate-200'
                }`}
                title={isListening ? 'Stop listening' : `Voice input in ${selectedLanguage === 'hi' ? 'हिन्दी' : selectedLanguage === 'mr' ? 'मराठी' : 'English'}`}
                aria-label="Voice input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedLanguage === 'hi'
                  ? 'अपनी समस्या बताएं (उदा. मसूड़ों से खून, दांत दर्द, छाला)...'
                  : selectedLanguage === 'mr'
                  ? 'लक्षणे सांगा (उदा. हिरड्यांतून रक्त, दातदुखी, तोंडातील व्रण)...'
                  : 'Describe symptoms naturally in full sentences...'
              }
              disabled={isTyping}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
              id="chat-input-field"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !pendingPhoto) || isTyping}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${
                (inputText.trim() || pendingPhoto) && !isTyping
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              id="chat-send-button"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Mouth Map Modal */}
      {showMouthMap && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="w-full max-w-2xl bg-slate-50 rounded-2xl shadow-2xl overflow-y-auto max-h-[80vh] flex flex-col p-3 sm:p-5 border border-slate-200">
            <InteractiveMouthMap
              confirmedLocation={indicators.primarySymptomLocation}
              confirmedLocations={indicators.mouthMapLocations || []}
              onConfirmMultipleLocations={handleConfirmMultipleLocationsFromMap}
              onCancel={() => setShowMouthMap(false)}
              onClose={() => setShowMouthMap(false)}
              language={selectedLanguage}
            />
          </div>
        </div>
      )}

      {/* Mouth Scanner / Camera Modal */}
      {showScanner && (
        <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col p-3 overflow-y-auto">
          <MouthScannerScreen
            photos={screeningSession.photoDocumentation || indicators.photoDocumentation || []}
            onSavePhoto={handleSavePhotoDocumentation}
            onDeletePhoto={handleDeletePhotoDocumentation}
            availableMouthLocations={indicators.mouthMapLocations || []}
            onOpenMouthMap={() => {
              setShowScanner(false);
              setShowMouthMap(true);
            }}
            onClose={() => setShowScanner(false)}
            language={selectedLanguage}
          />
        </div>
      )}

      {/* Symptom Tracker Modal */}
      {showTracker && (
        <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col p-3 overflow-y-auto">
          <SymptomProgressTracker
            entries={screeningSession.symptomProgress || indicators.symptomProgress || []}
            onAddEntry={handleAddSymptomProgressEntry}
            onDeleteEntry={handleDeleteSymptomProgressEntry}
            screeningProfile={indicators}
            availableMouthLocations={indicators.mouthMapLocations || []}
            onClose={() => setShowTracker(false)}
            language={selectedLanguage}
          />
        </div>
      )}
    </div>
  );
};
