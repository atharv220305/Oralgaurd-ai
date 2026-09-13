/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Header component with navigation shortcuts, frame toggle, and safety notices.
 */

import React from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Smartphone,
  Maximize2,
  AlertCircle,
  BookOpen,
  HeartHandshake,
  PhoneCall,
  AlertTriangle,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { Screen } from '../types';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onReset: () => void;
  isFrameMode: boolean;
  onToggleFrame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onReset,
  isFrameMode,
  onToggleFrame,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => {
            if (currentScreen !== 'splash' && currentScreen !== 'welcome') {
              onNavigate('chat');
            }
          }}
          className="flex items-center gap-2 text-left cursor-pointer truncate"
        >
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-700/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-teal-50" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1">
              <span className="font-semibold tracking-tight text-slate-900 text-xs sm:text-sm">OralGuard AI</span>
              <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Triage
              </span>
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-0.5 truncate">
              <AlertCircle className="w-2.5 h-2.5 text-amber-500 shrink-0 inline" />
              <span>Screening Support • Not Diagnostic</span>
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Quick Nav to Batch 2, 3, & 4 tools if in active app */}
        {currentScreen !== 'splash' && currentScreen !== 'welcome' && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onNavigate('ask_oralguard')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                currentScreen === 'ask_oralguard'
                  ? 'bg-teal-100 text-teal-800 font-bold'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
              title="Ask OralGuard AI (Educational Oral Health Assistant)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden lg:inline text-[11px]">Ask</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('follow_up')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                currentScreen === 'follow_up'
                  ? 'bg-indigo-100 text-indigo-800 font-bold'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-100'
              }`}
              title="Follow-up & Reminders"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline text-[11px]">Follow-up</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('health_helplines')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                currentScreen === 'health_helplines'
                  ? 'bg-teal-100 text-teal-800 font-bold'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
              title="Verified National Helplines (104, 112, Quitline)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden lg:inline text-[11px]">Helplines</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('emergency_guidance')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                currentScreen === 'emergency_guidance'
                  ? 'bg-rose-100 text-rose-800 font-bold'
                  : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
              }`}
              title="Acute Emergency Warning Signs & ERSS 112"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Emergency</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('awareness_hub')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                currentScreen === 'awareness_hub'
                  ? 'bg-teal-100 text-teal-800'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
              title="Open Oral Health Awareness Hub"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Hub</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('cessation_support')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                currentScreen === 'cessation_support'
                  ? 'bg-teal-100 text-teal-800'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
              title="Open Tobacco & Gutka Cessation Support"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Cessation</span>
            </button>
          </div>
        )}

        {/* Toggle mobile frame container for desktop demo */}
        <button
          onClick={onToggleFrame}
          title={isFrameMode ? "Expand to Full Width" : "Switch to Mobile Frame"}
          className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          id="btn-toggle-frame"
        >
          {isFrameMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
        </button>

        {currentScreen !== 'splash' && currentScreen !== 'welcome' && (
          <button
            onClick={onReset}
            title="Start New Screening"
            className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-teal-700 px-1.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
            id="btn-reset-screening"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset</span>
          </button>
        )}
      </div>
    </header>
  );
};
