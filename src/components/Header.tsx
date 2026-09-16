/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Header: Clean, modern, unified navigation bar with progressive disclosure menu.
 */

import React, { useState } from 'react';
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
  Cloud,
  Check,
  RefreshCw,
  History,
  MoreVertical,
  X,
  Stethoscope,
  MapPin,
  Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onReset: () => void;
  isFrameMode: boolean;
  onToggleFrame: () => void;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onOpenHistory?: () => void;
  hasActiveAssessment?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onReset,
  isFrameMode,
  onToggleFrame,
  syncStatus = 'synced',
  onOpenHistory,
  hasActiveAssessment = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleNav = (screen: Screen) => {
    setShowMenu(false);
    onNavigate(screen);
  };

  const isHome = currentScreen === 'welcome' || currentScreen === 'splash';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3.5 py-2 flex items-center justify-between transition-colors">
      {/* Brand & Home Shortcut */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => onNavigate('welcome')}
          className="flex items-center gap-2 text-left cursor-pointer truncate group"
          title="Return to Home"
        >
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition-colors shrink-0">
            <ShieldCheck className="w-4 h-4 text-teal-50" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-xs sm:text-sm">OralGuard AI</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Care Assistant
              </span>
              {/* Cloud Sync Status Badge */}
              <span
                title={
                  syncStatus === 'syncing'
                    ? 'Syncing with Cloud Firestore...'
                    : syncStatus === 'offline'
                    ? 'Working offline (cached locally)'
                    : 'Synced with Cloud Firestore'
                }
                className="hidden sm:inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded bg-slate-50 text-slate-500 border border-slate-200 cursor-default"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-2.5 h-2.5 text-teal-600 animate-spin" />
                ) : syncStatus === 'offline' ? (
                  <Cloud className="w-2.5 h-2.5 text-amber-500" />
                ) : (
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                )}
                <span>{syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'offline' ? 'Offline' : 'Cloud'}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
              <span>Non-Diagnostic Screening & Triage</span>
            </p>
          </div>
        </button>
      </div>

      {/* Primary & Secondary Nav Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Core Navigation Links */}
        {!isHome && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleNav('welcome')}
              className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              title="Home"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Home</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('chat')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                currentScreen === 'chat'
                  ? 'bg-teal-100 text-teal-900 font-bold'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
              title="Oral Health Chat Check"
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Oral Check</span>
            </button>

            {hasActiveAssessment && (
              <button
                type="button"
                onClick={() => handleNav('result')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  currentScreen === 'result'
                    ? 'bg-teal-100 text-teal-900 font-bold'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
                title="View Assessment & Triage"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Assessment</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNav('appointment')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                currentScreen === 'appointment'
                  ? 'bg-teal-100 text-teal-900 font-bold'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
              title="Find Dental & Medical Care"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Find Care</span>
            </button>
          </div>
        )}

        {/* Secondary Menu Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
            title="More Options & Patient Tools"
            aria-label="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Secondary Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/10 backdrop-blur-2xs"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 overflow-hidden text-xs"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Patient Resources
                    </span>
                    <button
                      onClick={() => setShowMenu(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="py-1">
                    {onOpenHistory && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onOpenHistory();
                        }}
                        className="w-full px-3 py-2 text-left text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-teal-600" />
                        <span>Assessment History</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleNav('follow_up')}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Follow-up & Recheck</span>
                    </button>

                    <button
                      onClick={() => handleNav('awareness_hub')}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>Oral Health Awareness Hub</span>
                    </button>

                    <button
                      onClick={() => handleNav('cessation_support')}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tobacco & Areca Support</span>
                    </button>

                    <button
                      onClick={() => handleNav('health_helplines')}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                      <span>Verified Helplines (104/112)</span>
                    </button>

                    <button
                      onClick={() => handleNav('emergency_guidance')}
                      className="w-full px-3 py-2 text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Emergency Warning Signs</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onReset();
                      }}
                      className="w-full px-3 py-2 text-left text-slate-600 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Start New Screening</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle mobile frame container for desktop demo */}
        <button
          onClick={onToggleFrame}
          title={isFrameMode ? 'Expand to Full Width' : 'Switch to Mobile Frame'}
          className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          id="btn-toggle-frame"
        >
          {isFrameMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
