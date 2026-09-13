import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface MobileContainerProps {
  children: React.ReactNode;
  isFrameMode: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children, isFrameMode }) => {
  // Current simulated mobile time
  const currentTime = '9:41';

  if (!isFrameMode) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 md:p-6 font-sans">
        <div className="w-full max-w-2xl min-h-screen md:min-h-[820px] md:h-[88vh] bg-white md:rounded-3xl md:shadow-xl md:border md:border-slate-200/80 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-0 sm:p-4 md:p-6 font-sans">
      {/* Mobile Device Mockup Frame */}
      <div className="w-full sm:max-w-[420px] h-screen sm:h-[860px] sm:max-h-[92vh] bg-white sm:rounded-[44px] sm:shadow-2xl sm:border-[8px] sm:border-slate-900 overflow-hidden flex flex-col relative ring-1 ring-slate-900/10">
        {/* Dynamic Island / Speaker Notch for Smartphone realism on desktop */}
        <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 bg-white select-none z-40 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-800">{currentTime}</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto" />
          <div className="flex items-center gap-1.5 text-slate-700">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* Virtual Home Bar on framed view */}
        <div className="hidden sm:flex justify-center pb-2 pt-1 bg-white select-none">
          <div className="w-32 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};
