/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Main App Root: Orchestrates state, language ('en' | 'hi' | 'mr'), and screen navigation
 * across conversational screening, mouth map, scanner, tracker, cessation, hub,
 * doctor handoff, helplines, emergency guidance, ask oralguard, and follow-up/reminders.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Screen,
  PatientProfile,
  AssessmentResult,
  PhotoDocumentationItem,
  SymptomProgressEntry,
  OralRegion,
  MouthMapLocationItem,
  TobaccoCessationPlan,
  CessationLogEntry,
  AppLanguage,
} from './types';
import { computeRiskAssessment } from './data/clinicalKnowledge';
import { Header } from './components/Header';
import { MobileContainer } from './components/MobileContainer';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeDisclaimerScreen } from './components/WelcomeDisclaimerScreen';
import { ChatScreen } from './components/ChatScreen';
import { ResultScreen } from './components/ResultScreen';
import { AppointmentMockScreen } from './components/AppointmentMockScreen';
import { MouthScannerScreen } from './components/MouthScannerScreen';
import { InteractiveMouthMap } from './components/InteractiveMouthMap';
import { SymptomProgressTracker } from './components/SymptomProgressTracker';
import { TobaccoCessationScreen } from './components/TobaccoCessationScreen';
import { OralAwarenessHubScreen } from './components/OralAwarenessHubScreen';
import { DoctorHandoffScreen } from './components/DoctorHandoffScreen';
import { HealthHelplinesScreen } from './components/HealthHelplinesScreen';
import { EmergencyGuidanceScreen } from './components/EmergencyGuidanceScreen';
import { AskOralGuardScreen } from './components/AskOralGuardScreen';
import { FollowUpScreen } from './components/FollowUpScreen';
import { AssessmentHistoryModal } from './components/AssessmentHistoryModal';
import {
  loadPatientFromFirestore,
  syncPatientToFirestore,
  resetLocalPatientSession,
  getOrCreatePatientId,
} from './services/firestorePersistence';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [indicators, setIndicators] = useState<PatientProfile>({});
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [shareSummaryConsent, setShareSummaryConsent] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>('en');

  // Firestore Sync & History state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const isInitialLoadDone = useRef(false);

  // Restore Patient Profile and Assessment from Cloud Firestore on mount
  useEffect(() => {
    let isMounted = true;
    async function restorePatientState() {
      try {
        setSyncStatus('syncing');
        const patientId = getOrCreatePatientId();
        const restored = await loadPatientFromFirestore(patientId);
        if (!isMounted) return;

        if (restored) {
          if (restored.profile && Object.keys(restored.profile).length > 0) {
            setIndicators(restored.profile);
            if (restored.profile.detectedLanguage) {
              setSelectedLanguage(restored.profile.detectedLanguage);
            }
          }
          if (restored.latestAssessment) {
            setAssessmentResult(restored.latestAssessment);
          }
        }
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Could not restore from Firestore, falling back to local state:', err);
        if (isMounted) setSyncStatus('offline');
      } finally {
        if (isMounted) isInitialLoadDone.current = true;
      }
    }
    restorePatientState();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize state changes to Cloud Firestore
  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    // Don't sync if completely empty state
    if (Object.keys(indicators).length === 0 && !assessmentResult) return;

    setSyncStatus('syncing');
    const timer = setTimeout(() => {
      const patientId = getOrCreatePatientId();
      syncPatientToFirestore(patientId, indicators, assessmentResult)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('offline'));
    }, 600);

    return () => clearTimeout(timer);
  }, [indicators, assessmentResult]);

  // Transition handlers
  const handleSplashContinue = () => {
    setCurrentScreen('welcome');
  };

  const handleDisclaimerAccept = (lang: AppLanguage) => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('oralguard_persistent_screening_session_v2');
    }
    setSelectedLanguage(lang);
    setIndicators({ detectedLanguage: lang });
    setCurrentScreen('chat');
  };

  const handleCompleteScreening = (finalIndicators: PatientProfile) => {
    setIndicators(finalIndicators);
    const calculated = computeRiskAssessment(finalIndicators);
    setAssessmentResult(calculated);

    // If critical emergency flag was triggered during assessment, prioritize emergency screen
    if (finalIndicators.emergencyFlagTriggered) {
      setCurrentScreen('emergency_guidance');
    } else {
      setCurrentScreen('result');
    }
  };

  const handleBookAppointmentClick = (consent?: boolean) => {
    if (typeof consent === 'boolean') {
      setShareSummaryConsent(consent);
    }
    setCurrentScreen('appointment');
  };

  const handleReset = () => {
    resetLocalPatientSession();
    setIndicators({});
    setAssessmentResult(null);
    setCurrentScreen('welcome');
  };

  const handleRetakeScreening = () => {
    resetLocalPatientSession();
    setIndicators({ detectedLanguage: selectedLanguage });
    setAssessmentResult(null);
    setCurrentScreen('chat');
  };

  const handleBackToHome = () => {
    resetLocalPatientSession();
    setIndicators({});
    setAssessmentResult(null);
    setCurrentScreen('welcome');
  };

  // Direct handlers for photo/scanner updates
  const handleSavePhotoFromScanner = (photo: PhotoDocumentationItem) => {
    const existing = indicators.photoDocumentation || [];
    const updatedPhotos = [...existing.filter((p) => p.id !== photo.id), photo];
    const updated = { ...indicators, photoDocumentation: updatedPhotos };
    setIndicators(updated);
    if (assessmentResult) {
      setAssessmentResult(computeRiskAssessment(updated));
    }
  };

  const handleDeletePhotoFromScanner = (id: string) => {
    const existing = indicators.photoDocumentation || [];
    const updatedPhotos = existing.filter((p) => p.id !== id);
    const updated = { ...indicators, photoDocumentation: updatedPhotos };
    setIndicators(updated);
    if (assessmentResult) {
      setAssessmentResult(computeRiskAssessment(updated));
    }
  };

  // Direct handlers for symptom progress tracking
  const handleAddSymptomEntry = (entry: SymptomProgressEntry) => {
    const existing = indicators.symptomProgress || [];
    const updatedEntries = [...existing.filter((e) => e.id !== entry.id), entry];
    const updated = { ...indicators, symptomProgress: updatedEntries };
    setIndicators(updated);
    if (assessmentResult) {
      setAssessmentResult(computeRiskAssessment(updated));
    }
  };

  const handleDeleteSymptomEntry = (id: string) => {
    const existing = indicators.symptomProgress || [];
    const updatedEntries = existing.filter((e) => e.id !== id);
    const updated = { ...indicators, symptomProgress: updatedEntries };
    setIndicators(updated);
    if (assessmentResult) {
      setAssessmentResult(computeRiskAssessment(updated));
    }
  };

  // Direct handlers for mouth map updates
  const handleConfirmMultipleMapLocations = (regions: OralRegion[]) => {
    const isUnknown = regions.some((r) => r.id === 'unknown_location');
    const locationItems: MouthMapLocationItem[] = isUnknown
      ? [{ id: 'unknown_location', area: 'Not sure / Unspecified', hindiName: 'सटीक स्थान ज्ञात नहीं', marathiName: 'नक्की जागा माहित नाही', confirmed: true }]
      : regions.map((r) => ({ id: r.id, area: r.name, hindiName: r.hindiName, marathiName: r.marathiName, confirmed: true }));

    const locationNames = isUnknown ? 'Not sure / Unspecified' : regions.map((r) => r.name).join(', ');
    const regionIds = isUnknown ? [] : regions.map((r) => r.id);

    const updated = {
      ...indicators,
      affectedRegions: regionIds,
      primarySymptomLocation: locationNames,
      mouthMapLocations: locationItems,
    };
    setIndicators(updated);
    if (assessmentResult) {
      setAssessmentResult(computeRiskAssessment(updated));
    }
    setCurrentScreen(assessmentResult ? 'result' : 'chat');
  };

  // Direct handlers for tobacco cessation plan & craving log
  const handleSaveCessationPlan = (plan: TobaccoCessationPlan) => {
    const updated: PatientProfile = {
      ...indicators,
      tobaccoUse: plan,
    };
    setIndicators(updated);
    if (assessmentResult) {
      setAssessmentResult(computeRiskAssessment(updated));
    }
  };

  const handleAddCessationLog = (entry: CessationLogEntry) => {
    const existing = indicators.cessationLogs || [];
    const updatedLogs = [entry, ...existing.filter((l) => l.id !== entry.id)];
    const updated: PatientProfile = {
      ...indicators,
      cessationLogs: updatedLogs,
    };
    setIndicators(updated);
  };

  const handleDeleteCessationLog = (id: string) => {
    const existing = indicators.cessationLogs || [];
    const updatedLogs = existing.filter((l) => l.id !== id);
    const updated: PatientProfile = {
      ...indicators,
      cessationLogs: updatedLogs,
    };
    setIndicators(updated);
  };

  return (
    <MobileContainer isFrameMode={isFrameMode}>
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onReset={handleReset}
        isFrameMode={isFrameMode}
        onToggleFrame={() => setIsFrameMode(!isFrameMode)}
        syncStatus={syncStatus}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentScreen === 'splash' && (
          <SplashScreen onContinue={handleSplashContinue} />
        )}

        {currentScreen === 'welcome' && (
          <WelcomeDisclaimerScreen
            onAccept={handleDisclaimerAccept}
            initialLanguage={selectedLanguage}
          />
        )}

        {currentScreen === 'chat' && (
          <ChatScreen
            onCompleteScreening={handleCompleteScreening}
            indicators={indicators}
            setIndicators={setIndicators}
            initialLanguage={selectedLanguage}
            onOpenCessation={() => setCurrentScreen('cessation_support')}
            onOpenAwarenessHub={() => setCurrentScreen('awareness_hub')}
            onOpenAskOralGuard={() => setCurrentScreen('ask_oralguard')}
            onOpenFollowUp={() => setCurrentScreen('follow_up')}
          />
        )}

        {currentScreen === 'result' && assessmentResult && (
          <ResultScreen
            assessment={assessmentResult}
            profile={indicators}
            onBookAppointment={handleBookAppointmentClick}
            onRetake={handleRetakeScreening}
            onOpenScanner={() => setCurrentScreen('mouth_scanner')}
            onOpenTracker={() => setCurrentScreen('symptom_tracker')}
            onOpenMouthMap={() => setCurrentScreen('mouth_map')}
            onOpenCessation={() => setCurrentScreen('cessation_support')}
            onOpenAwarenessHub={() => setCurrentScreen('awareness_hub')}
            onOpenDoctorHandoff={() => setCurrentScreen('doctor_handoff')}
            onOpenHelplines={() => setCurrentScreen('health_helplines')}
            onOpenEmergencyGuidance={() => setCurrentScreen('emergency_guidance')}
            onOpenAskOralGuard={() => setCurrentScreen('ask_oralguard')}
            onOpenFollowUp={() => setCurrentScreen('follow_up')}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
          />
        )}

        {currentScreen === 'ask_oralguard' && (
          <AskOralGuardScreen
            indicators={indicators}
            setIndicators={setIndicators}
            onBack={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
            onOpenDoctorHandoff={() => setCurrentScreen('doctor_handoff')}
            onOpenFinder={() => setCurrentScreen('appointment')}
            onOpenFollowUp={() => setCurrentScreen('follow_up')}
            onOpenEmergency={() => setCurrentScreen('emergency_guidance')}
            onOpenCessation={() => setCurrentScreen('cessation_support')}
          />
        )}

        {currentScreen === 'follow_up' && (
          <FollowUpScreen
            indicators={indicators}
            setIndicators={setIndicators}
            onBack={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
            onOpenTracker={() => setCurrentScreen('symptom_tracker')}
            onOpenDoctorHandoff={() => setCurrentScreen('doctor_handoff')}
            onOpenFinder={() => setCurrentScreen('appointment')}
          />
        )}

        {currentScreen === 'doctor_handoff' && (
          <DoctorHandoffScreen
            indicators={indicators}
            assessmentResult={assessmentResult}
            onBack={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
            onFindDoctors={() => setCurrentScreen('appointment')}
            onOpenHelplines={() => setCurrentScreen('health_helplines')}
            onOpenEmergencyGuidance={() => setCurrentScreen('emergency_guidance')}
          />
        )}

        {currentScreen === 'health_helplines' && (
          <HealthHelplinesScreen
            onBack={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
            onOpenEmergencyGuidance={() => setCurrentScreen('emergency_guidance')}
            onFindDoctors={() => setCurrentScreen('appointment')}
          />
        )}

        {currentScreen === 'emergency_guidance' && (
          <EmergencyGuidanceScreen
            onBack={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
            onFindHospital={() => setCurrentScreen('appointment')}
            onOpenHelplines={() => setCurrentScreen('health_helplines')}
            triggeredReason={indicators.emergencyFlagReason}
          />
        )}

        {currentScreen === 'mouth_scanner' && (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
            <MouthScannerScreen
              photos={indicators.photoDocumentation || []}
              onSavePhoto={handleSavePhotoFromScanner}
              onDeletePhoto={handleDeletePhotoFromScanner}
              availableMouthLocations={indicators.mouthMapLocations || []}
              onOpenMouthMap={() => setCurrentScreen('mouth_map')}
              onClose={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
              language={selectedLanguage}
            />
          </div>
        )}

        {currentScreen === 'mouth_map' && (
          <div className="flex-1 overflow-y-auto bg-slate-100 p-3">
            <InteractiveMouthMap
              confirmedLocation={indicators.primarySymptomLocation}
              confirmedLocations={indicators.mouthMapLocations || []}
              onConfirmMultipleLocations={handleConfirmMultipleMapLocations}
              onCancel={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
              onClose={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
              language={selectedLanguage}
            />
          </div>
        )}

        {currentScreen === 'symptom_tracker' && (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
            <SymptomProgressTracker
              entries={indicators.symptomProgress || []}
              onAddEntry={handleAddSymptomEntry}
              onDeleteEntry={handleDeleteSymptomEntry}
              screeningProfile={indicators}
              availableMouthLocations={indicators.mouthMapLocations || []}
              onClose={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
              language={selectedLanguage}
            />
          </div>
        )}

        {currentScreen === 'cessation_support' && (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
            <TobaccoCessationScreen
              currentPlan={indicators.tobaccoUse}
              logs={indicators.cessationLogs || []}
              patientProfile={indicators}
              onSavePlan={handleSaveCessationPlan}
              onAddLogEntry={handleAddCessationLog}
              onDeleteLogEntry={handleDeleteCessationLog}
              onClose={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
              language={selectedLanguage}
            />
          </div>
        )}

        {currentScreen === 'awareness_hub' && (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
            <OralAwarenessHubScreen
              patientProfile={indicators}
              onOpenCessation={() => setCurrentScreen('cessation_support')}
              onOpenScanner={() => setCurrentScreen('mouth_scanner')}
              onOpenMouthMap={() => setCurrentScreen('mouth_map')}
              onClose={() => setCurrentScreen(assessmentResult ? 'result' : 'chat')}
              language={selectedLanguage}
            />
          </div>
        )}

        {currentScreen === 'appointment' && (
          <AppointmentMockScreen
            onBackToHome={handleBackToHome}
            onRetakeScreening={handleRetakeScreening}
            shareSummaryConsent={shareSummaryConsent}
            selectedLanguage={selectedLanguage}
            onOpenHelplines={() => setCurrentScreen('health_helplines')}
            onOpenEmergencyGuidance={() => setCurrentScreen('emergency_guidance')}
            onOpenDoctorHandoff={() => setCurrentScreen('doctor_handoff')}
          />
        )}
      </main>

      {/* Cross-Session Firestore Assessment History Modal */}
      <AssessmentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        language={selectedLanguage}
        currentProfile={indicators}
        currentAssessment={assessmentResult}
        onSelectPastAssessment={(selected) => {
          setAssessmentResult(selected);
          setCurrentScreen('result');
        }}
      />
    </MobileContainer>
  );
}
