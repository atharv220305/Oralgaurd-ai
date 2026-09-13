import React, { useEffect } from 'react';
import { ShieldCheck, HeartPulse, Sparkles, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  return (
    <div className="min-h-[580px] h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-teal-50/70 via-white to-slate-50 text-slate-800 select-none">
      {/* Top micro pill */}
      <div className="w-full flex justify-center pt-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 border border-teal-200/80 text-teal-800 text-xs font-medium"
        >
          <Activity className="w-3.5 h-3.5 text-teal-600" />
          <span>Early Screening & Awareness Prototype</span>
        </motion.div>
      </div>

      {/* Center Medical Branding */}
      <div className="flex flex-col items-center text-center px-4 max-w-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-teal-700/20 border-4 border-white">
            <ShieldCheck className="w-12 h-12 text-teal-50" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md border border-slate-100 text-teal-600">
            <HeartPulse className="w-5 h-5 text-teal-600 animate-pulse" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          OralGuard AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-medium text-teal-800 mt-1"
        >
          Oral Health Early Screening Guide
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-slate-500 mt-3 leading-relaxed"
        >
          Empowering individuals with early risk awareness, guided conversational checks, and timely clinical dental referrals.
        </motion.p>

        {/* Pulsing indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-1.5 mt-8 text-[11px] text-slate-400"
        >
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
          <span>Strictly for awareness • Not a medical diagnosis</span>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm pb-4"
      >
        <button
          onClick={onContinue}
          className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/15 transition-all group"
          id="btn-splash-continue"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p className="text-[10px] text-center text-slate-400 mt-2.5">
          Takes about 2-3 minutes • Completely private
        </p>
      </motion.div>
    </div>
  );
};
