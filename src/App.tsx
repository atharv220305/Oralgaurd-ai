/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Screen, ClinicalIndicators, AssessmentResult } from './types';
import { computeRiskAssessment } from './data/clinicalKnowledge';
import { Header } from './components/Header';
import { MobileContainer } from './components/MobileContainer';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeDisclaimerScreen } from './components/WelcomeDisclaimerScreen';
import { ChatScreen } from './components/ChatScreen';
import { ResultScreen } from './components/ResultScreen';
import { AppointmentMockScreen } from './components/AppointmentMockScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [indicators, setIndicators] = useState<ClinicalIndicators>({});
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [shareSummaryConsent, setShareSummaryConsent] = useState<boolean>(true);

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hinglish' | 'hi'>('hinglish');

  // Transition handlers
  const handleSplashContinue = () => {
    setCurrentScreen('welcome');
  };

  const handleDisclaimerAccept = (lang: 'en' | 'hinglish' | 'hi') => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('oralguard_persistent_screening_session_v2');
    }
    setSelectedLanguage(lang);
    setIndicators({ detectedLanguage: lang });
    setCurrentScreen('chat');
  };

  const handleCompleteScreening = (finalIndicators: ClinicalIndicators) => {
    setIndicators(finalIndicators);
    const calculated = computeRiskAssessment(finalIndicators);
    setAssessmentResult(calculated);
    setCurrentScreen('result');
  };

  const handleBookAppointmentClick = (consent?: boolean) => {
    if (typeof consent === 'boolean') {
      setShareSummaryConsent(consent);
    }
    setCurrentScreen('appointment');
  };

  const handleReset = () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('oralguard_persistent_screening_session_v2');
    }
    setIndicators({});
    setAssessmentResult(null);
    setCurrentScreen('welcome');
  };

  const handleRetakeScreening = () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('oralguard_persistent_screening_session_v2');
    }
    setIndicators({});
    setAssessmentResult(null);
    setCurrentScreen('chat');
  };

  const handleBackToHome = () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('oralguard_persistent_screening_session_v2');
    }
    setIndicators({});
    setAssessmentResult(null);
    setCurrentScreen('welcome');
  };

  return (
    <MobileContainer isFrameMode={isFrameMode}>
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onReset={handleReset}
        isFrameMode={isFrameMode}
        onToggleFrame={() => setIsFrameMode(!isFrameMode)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentScreen === 'splash' && (
          <SplashScreen onContinue={handleSplashContinue} />
        )}

        {currentScreen === 'welcome' && (
          <WelcomeDisclaimerScreen onAccept={handleDisclaimerAccept} />
        )}

        {currentScreen === 'chat' && (
          <ChatScreen
            onCompleteScreening={handleCompleteScreening}
            indicators={indicators}
            setIndicators={setIndicators}
            initialLanguage={selectedLanguage}
          />
        )}

        {currentScreen === 'result' && assessmentResult && (
          <ResultScreen
            assessment={assessmentResult}
            profile={indicators}
            onBookAppointment={handleBookAppointmentClick}
            onRetake={handleRetakeScreening}
          />
        )}

        {currentScreen === 'appointment' && (
          <AppointmentMockScreen
            onBackToHome={handleBackToHome}
            onRetakeScreening={handleRetakeScreening}
            shareSummaryConsent={shareSummaryConsent}
            selectedLanguage={selectedLanguage}
          />
        )}
      </main>
    </MobileContainer>
  );
}
