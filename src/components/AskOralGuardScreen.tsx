/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Feature 11: Ask OralGuard Screen
 * An educational conversational Q&A assistant for oral health, mouth ulcers,
 * tobacco cessation, and dental care. Non-diagnostic, empathetic, and multilingual.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Stethoscope,
  PhoneCall,
  Calendar,
  ChevronLeft,
  Flame,
  Globe2,
} from 'lucide-react';
import { PatientProfile, AppLanguage, ChatMessage } from '../types';
import {
  generateAskOralGuardReply,
  SUGGESTED_TOPICS,
  getStarterQuestions,
} from '../data/askOralGuardEngine';
import { getUIText } from '../data/translations';

interface AskOralGuardScreenProps {
  indicators: PatientProfile;
  setIndicators: React.Dispatch<React.SetStateAction<PatientProfile>>;
  onBack: () => void;
  onOpenDoctorHandoff: () => void;
  onOpenFinder: () => void;
  onOpenFollowUp: () => void;
  onOpenEmergency: () => void;
  onOpenCessation: () => void;
}

export const AskOralGuardScreen: React.FC<AskOralGuardScreenProps> = ({
  indicators,
  setIndicators,
  onBack,
  onOpenDoctorHandoff,
  onOpenFinder,
  onOpenFollowUp,
  onOpenEmergency,
  onOpenCessation,
}) => {
  const currentLang = indicators.detectedLanguage || 'en';
  const t = getUIText(currentLang);

  const getInitialGreeting = (lang: AppLanguage): string => {
    if (lang === 'hi') {
      return 'नमस्ते! मैं **Ask OralGuard** हूँ — आपका मुँह के स्वास्थ्य और दंत जागरूकता का AI मार्गदर्शक। आप मुँह के छाले, सफेद/लाल पैच, गुटखा-तंबाकू छोड़ने, या डॉक्टर परामर्श संबंधी कोई भी प्रश्न पूछ सकते हैं।';
    }
    if (lang === 'mr') {
      return 'नमस्कार! मी **Ask OralGuard** आहे — तोंडाचे आरोग्य आणि दंत जागरूकतेचा आपला AI सहाय्यक. आपण तोंडातील फोड, डाग, तंबाखू मुक्ती किंवा डॉक्टरांच्या सल्ल्याविषयी कोणताही प्रश्न विचारू शकता.';
    }
    return 'Hello! I am **Ask OralGuard** — your AI oral health and dental awareness assistant. Ask me anything about mouth sores, white/red patches, tobacco cessation, or what to expect during a dental checkup.';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'ask-welcome',
      role: 'assistant',
      content: getInitialGreeting(currentLang),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: getStarterQuestions(currentLang),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle language switch
  const handleLanguageChange = (newLang: AppLanguage) => {
    setIndicators((prev) => ({ ...prev, detectedLanguage: newLang }));
    // Update starter message
    setMessages((prev) => [
      ...prev,
      {
        id: `lang-switch-${Date.now()}`,
        role: 'system',
        content:
          newLang === 'hi'
            ? 'भाषा हिन्दी में बदली गई।'
            : newLang === 'mr'
            ? 'भाषा मराठीमध्ये बदलली.'
            : 'Language changed to English.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `ask-welcome-${Date.now()}`,
        role: 'assistant',
        content: getInitialGreeting(newLang),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: getStarterQuestions(newLang),
      },
    ]);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAskOralGuardReply(text, indicators, currentLang);
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: response.suggestedQuestions,
        isEmergencyAlert: response.isEmergencyAlert,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `ask-welcome-reset-${Date.now()}`,
        role: 'assistant',
        content: getInitialGreeting(currentLang),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: getStarterQuestions(currentLang),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-sm font-bold text-slate-900">{t.askHeading}</h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Educational AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1">{t.askSub}</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Language selector toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                currentLang === 'en'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                currentLang === 'hi'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => handleLanguageChange('mr')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                currentLang === 'mr'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>

          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Reset Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong>{t.preliminaryNotice}</strong>: {t.askDisclaimer}
          </span>
        </div>
        <button
          onClick={onOpenEmergency}
          className="text-[11px] font-bold text-red-700 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span>{t.navEmergency}</span>
        </button>
      </div>

      {/* Topic Suggestions Carousel */}
      <div className="bg-slate-50/80 border-b border-slate-200/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap pl-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" />
          Topics:
        </span>
        {SUGGESTED_TOPICS.map((topic) => {
          const label =
            currentLang === 'hi'
              ? topic.labelHi
              : currentLang === 'mr'
              ? topic.labelMr
              : topic.label;
          return (
            <button
              key={topic.id}
              onClick={() => handleSendMessage(topic.query)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-800 transition-all whitespace-nowrap shadow-2xs"
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-teal-600 text-white'
                    : msg.isEmergencyAlert
                    ? 'bg-red-600 text-white'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                {isUser ? (
                  <User className="w-3.5 h-3.5" />
                ) : msg.isEmergencyAlert ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] space-y-2`}>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-tr-none'
                      : msg.isEmergencyAlert
                      ? 'bg-red-50 text-red-950 border border-red-200 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Quick reply suggestion buttons */}
                {msg.quickReplies && msg.quickReplies.length > 0 && !isUser && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickReplies.map((qr, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (qr === 'आपातकालीन दिशा-निर्देश देखें' || qr === 'View Emergency Guidance' || qr === 'तातडीची मदत पहा') {
                            onOpenEmergency();
                          } else if (qr === 'नजदीकी अस्पताल खोजें' || qr === 'Find Nearest Hospital' || qr === 'जवळचे रुग्णालय शोधा') {
                            onOpenFinder();
                          } else if (qr === 'डॉक्टर हैंडऑफ सारांश देखें' || qr === 'View Doctor Handoff Report' || qr === 'डॉक्टर हँडऑफ सारांश पहा') {
                            onOpenDoctorHandoff();
                          } else if (qr === 'मुक्ति सहयोग (Cessation Tracker) खोलें' || qr === 'Open Cessation Support Tracker' || qr === 'व्यसनमुक्ती मदत कक्ष उघडा') {
                            onOpenCessation();
                          } else {
                            handleSendMessage(qr);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100/80 transition-colors shadow-2xs text-left"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-slate-400 text-xs pl-9"
          >
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[11px] text-slate-500">OralGuard AI is thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Access Shortcut Bar */}
      <div className="bg-slate-100/90 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs text-slate-600">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          Quick Links:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDoctorHandoff}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300"
          >
            <Stethoscope className="w-3 h-3 text-teal-600" />
            <span>{t.navDoctorHandoff}</span>
          </button>
          <button
            onClick={onOpenFollowUp}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300"
          >
            <Calendar className="w-3 h-3 text-indigo-600" />
            <span>{t.navFollowUp}</span>
          </button>
          <button
            onClick={onOpenFinder}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300"
          >
            <PhoneCall className="w-3 h-3 text-emerald-600" />
            <span>{t.navFinder}</span>
          </button>
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-slate-200 p-3 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 max-w-2xl mx-auto"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.askInputPlaceholder}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center font-medium text-xs flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
