import React, { useState } from 'react';
import {
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MousePointer,
  Rotate3d,
  Lock,
  Keyboard,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { AppLanguage } from '../types';

interface MouthMapLegendProps {
  language?: AppLanguage | 'hinglish';
  is3DMode?: boolean;
  selectionLocked?: boolean;
}

export const MouthMapLegend: React.FC<MouthMapLegendProps> = ({
  language = 'en',
  is3DMode = false,
  selectionLocked = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const isHindi = language === 'hi';
  const isHinglish = language === 'hinglish';

  return (
    <div
      id="oralguard-mouth-map-legend"
      role="region"
      aria-label={isHindi ? 'नक़्शा संकेत व रंग सूची' : 'Anatomy Map Legend & Selection States'}
      className="mt-3 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all text-slate-800"
    >
      {/* Legend Header & Collapse Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer border-b border-slate-100"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isHindi ? 'संकेत सूची व चयन अवस्था (Legend Key)' : 'Anatomy Legend & Selection States'}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200/60">
                WCAG AA Compliant
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isExpanded ? (isHindi ? 'छिपाएं' : 'Collapse') : (isHindi ? 'विस्तार करें' : 'Expand')}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-3.5 space-y-3.5">
          {/* 1. Selection States Row */}
          <div>
            <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              {isHindi ? '१. चयन अवस्था (Selection States)' : '1. Selection States & Visual Feedback'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Unselected */}
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                <div className="w-4 h-4 rounded border border-slate-300 bg-white shadow-2xs shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    {isHindi ? 'अचयनित (Normal)' : 'Unselected'}
                  </span>
                  <span className="text-[10.5px] text-slate-600 leading-tight block">
                    {isHindi ? 'प्राकृतिक रंग' : 'Natural pearl / pink'}
                  </span>
                </div>
              </div>

              {/* Hover / Inspected */}
              <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-300 flex items-start gap-2">
                <div className="w-4 h-4 rounded border-2 border-sky-600 bg-sky-100 shadow-2xs shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-sky-950 block">
                    {isHindi ? 'निरीक्षण (Hover)' : 'Hover / Inspect'}
                  </span>
                  <span className="text-[10.5px] text-sky-800 leading-tight block">
                    {isHindi ? 'आसमानी सीमा रेखा' : 'Sky outline preview'}
                  </span>
                </div>
              </div>

              {/* Selected with Cyan-Blue Glow */}
              <div className="p-2 rounded-lg bg-cyan-50/70 border-2 border-cyan-500 shadow-xs flex items-start gap-2 ring-1 ring-cyan-400/40">
                <div className="w-4 h-4 rounded border-2 border-cyan-600 bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-cyan-950 block flex items-center gap-1">
                    <span>{isHindi ? 'चयनित (Selected)' : 'Selected'}</span>
                    <Sparkles className="w-2.5 h-2.5 text-cyan-600" />
                  </span>
                  <span className="text-[10.5px] text-cyan-800 leading-tight block font-medium">
                    {isHindi ? 'सियान-नीला घेरा व चमक' : 'Cyan outline & glow'}
                  </span>
                </div>
              </div>

              {/* Selection Locked */}
              <div className={`p-2 rounded-lg border flex items-start gap-2 transition-all ${
                selectionLocked ? 'bg-amber-50/80 border-amber-400 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  selectionLocked ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Lock className="w-2.5 h-2.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold block">
                    {selectionLocked ? (isHindi ? 'चयन बंद (Locked)' : 'Locked') : (isHindi ? 'अनलॉक (Free)' : 'Select Mode')}
                  </span>
                  <span className="text-[10.5px] text-slate-600 leading-tight block">
                    {selectionLocked ? 'Protected from taps' : 'Tap to add/remove'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Color-Coded Anatomical Regions */}
          <div>
            <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              {isHindi ? '२. शारीरिक रंग कोडिंग (Anatomical Color Codes)' : '2. Anatomical Region Legend & FDI Dentition'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {/* Teeth */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white border-2 border-slate-400 shrink-0 shadow-2xs" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-900 block truncate">Teeth (FDI)</span>
                  <span className="text-[10px] text-slate-600 block truncate">11–18, 21–28, 31–48</span>
                </div>
              </div>

              {/* Gingiva / Gums */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-pink-100 border-2 border-pink-300 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-900 block truncate">Gums / Gingiva</span>
                  <span className="text-[10px] text-slate-600 block truncate">Upper & Lower Arch</span>
                </div>
              </div>

              {/* Tongue */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-200 border-2 border-rose-400 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-900 block truncate">Tongue</span>
                  <span className="text-[10px] text-slate-600 block truncate">Dorsum & Borders</span>
                </div>
              </div>

              {/* Palate */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-100 border-2 border-orange-300 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-900 block truncate">Palate</span>
                  <span className="text-[10px] text-slate-600 block truncate">Hard & Soft Roof</span>
                </div>
              </div>

              {/* Cheeks & Lips */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-100 border-2 border-red-300 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-900 block truncate">Cheek & Lips</span>
                  <span className="text-[10px] text-slate-600 block truncate">Buccal & Labial</span>
                </div>
              </div>

              {/* Throat & Tonsils */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-100 border-2 border-rose-300 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-900 block truncate">Throat</span>
                  <span className="text-[10px] text-slate-600 block truncate">Tonsillar Pillars</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Navigation, Gestures & Keyboard Interaction Tips */}
          <div className="pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-slate-600">
            <div className="flex items-start gap-2">
              {is3DMode ? (
                <Rotate3d className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              ) : (
                <MousePointer className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-slate-900">
                  {is3DMode ? '3D Navigation & Touch Gestures:' : '2D Selection & Touch:'}
                </span>{' '}
                {is3DMode
                  ? 'Drag to orbit/rotate • Pinch or scroll to zoom • Double-tap to focus structure • Tap to select/deselect.'
                  : 'Tap any tooth or zone to select • Tap again or use "×" to remove • Pinch/buttons to zoom.'}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Keyboard className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Accessibility & Keyboard:</span>{' '}
                Press <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-300">Tab</kbd> to focus,{' '}
                <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-300">Space</kbd> or{' '}
                <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-300">Enter</kbd> to select, and{' '}
                <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-300">Arrow</kbd> keys to step through dental arches.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
