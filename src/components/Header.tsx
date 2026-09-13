import React from 'react';
import { ShieldCheck, RotateCcw, Smartphone, Maximize2, AlertCircle } from 'lucide-react';
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
  onReset,
  isFrameMode,
  onToggleFrame,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
          <ShieldCheck className="w-5 h-5 text-teal-50" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold tracking-tight text-slate-900 text-sm">OralGuard AI</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
              Prototype
            </span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500 inline" />
            Awareness Only • Not a Doctor
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Toggle mobile frame container for desktop demo */}
        <button
          onClick={onToggleFrame}
          title={isFrameMode ? "Expand to Full Width" : "Switch to Mobile Frame"}
          className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          id="btn-toggle-frame"
        >
          {isFrameMode ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>

        {currentScreen !== 'splash' && currentScreen !== 'welcome' && (
          <button
            onClick={onReset}
            title="Start New Screening"
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-teal-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
            id="btn-reset-screening"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </header>
  );
};
