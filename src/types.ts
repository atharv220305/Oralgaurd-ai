export type Screen = 'splash' | 'welcome' | 'chat' | 'result' | 'appointment';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ScreeningConcernLevel =
  | 'LOW SCREENING CONCERN'
  | 'MODERATE SCREENING CONCERN'
  | 'HIGH SCREENING CONCERN';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  quickReplies?: string[];
  isEmergencyAlert?: boolean;
}

export interface PatientProfile {
  // Personal Info
  age?: string;
  gender?: string;
  mainConcern?: string;
  detectedLanguage?: 'en' | 'hi' | 'hinglish';

  // Symptoms
  hasLesionOrUlcer?: boolean;
  ulcerDetails?: string;
  affectedRegions?: string[];
  primarySymptomLocation?: string;
  duration?: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  durationCategory?: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  durationText?: string;
  durationOverTwoWeeks?: boolean;
  colorChanges?: 'none' | 'white' | 'red' | 'mixed';
  thickeningOrLump?: boolean;
  unexplainedBleeding?: boolean;
  mouthPainOrBurning?: boolean;
  pain?: boolean;
  symptomTrigger?: string;
  numbnessInMouth?: boolean;
  difficultySwallowing?: boolean;
  difficultyChewing?: boolean;
  difficultySpeakingOrMovingTongue?: boolean;
  reducedMouthOpening?: boolean; // OSMF / Trismus
  persistentHoarseness?: boolean;
  neckLumpOrSwelling?: boolean;
  progression?: 'improving' | 'worsening' | 'unchanged' | 'fluctuating';

  // Risk Factors
  tobaccoSmoked?: 'none' | 'bidi' | 'cigarettes' | 'both';
  tobaccoSmokeless?: 'none' | 'gutka' | 'khaini' | 'zarda' | 'tobacco_paan';
  arecaOrBetelNut?: 'none' | 'supari' | 'betel_quid' | 'pan_masala';
  tobaccoFrequency?: string;
  alcoholIntake?: 'none' | 'rare' | 'moderate' | 'heavy';
  alcoholUse?: 'none' | 'occasional' | 'regular' | 'heavy' | 'unknown';
  combinedTobaccoAlcohol?: boolean;
  chronicIrritation?: boolean; // sharp tooth, ill-fitting denture
  previousHeadNeckHistory?: boolean;

  // Medical context
  previousDentalEvaluation?: string;
  emergencyFlagTriggered?: boolean;
  emergencyReason?: string;

  // Evidence & Provenance Tracking (V2.1.2 Data Integrity Patch)
  askedQuestions?: string[];
  userReportedFacts?: string[];
  confirmedPositiveFindings?: string[];
  confirmedNegativeFindings?: string[];
  unknownFindings?: string[];
}

// Retain compatibility with legacy indicators
export type ClinicalIndicators = PatientProfile;

export type ClinicalStepKey = 'symptoms' | 'duration' | 'red_flags' | 'habits' | 'ready';

export type ScreeningQuestionKey =
  | 'symptoms'
  | 'mouthLocation'
  | 'duration'
  | 'redFlags'
  | 'gutka'
  | 'smoking'
  | 'alcohol';

export interface ScreeningQuestionItem {
  id: ScreeningQuestionKey;
  label: string;
  step: 1 | 2 | 3 | 4;
  stepName: 'Symptoms' | 'Duration' | 'Red Flags' | 'Habits';
  isCompleted: boolean;
  valueDisplay: string;
}

export interface ScreeningEvaluationState {
  questions: Record<ScreeningQuestionKey, ScreeningQuestionItem>;
  allRequiredAnswered: boolean;
  isReadyForEvaluation: boolean;
  progressPercentage: number;
  currentStepNumber: 1 | 2 | 3 | 4;
  currentStepName: 'Symptoms' | 'Duration' | 'Red Flags' | 'Habits' | 'Assessment Ready';
  nextUnansweredQuestionId: ScreeningQuestionKey | null;
  stage1Completed: boolean;
  stage2Completed: boolean;
  stage3Completed: boolean;
  stage4Completed: boolean;
}

export interface ScreeningSession {
  sessionId: string;
  stage: 1 | 2 | 3 | 4;
  currentStepName: string;
  currentClinicalStep?: ClinicalStepKey;
  profile: PatientProfile;
  mouthMapLocation?: string | null;
  // Patient-supported facts for state validation (Section 9)
  duration?: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  location?: string;
  symptom?: string;
  pain?: boolean;
  trigger?: string;
  lastAssistantQuestion?: string;
  lastUserResponse?: string;
  turnCount: number;
  evaluatedFields: string[];
  askedQuestions?: string[];
  userReportedFacts?: string[];
  confirmedPositiveFindings?: string[];
  confirmedNegativeFindings?: string[];
  unknownFindings?: string[];
  isComplete: boolean;
  assessmentReady?: boolean;
  emergencyTriggered: boolean;
  lastUpdatedAt: number;
}

export interface AssessmentResult {
  riskLevel: RiskLevel;
  screeningConcern: ScreeningConcernLevel;
  confidenceNotes: string;
  summaryOfFindings: string;
  keyFindings: {
    title: string;
    description: string;
    impact: 'flag' | 'moderate' | 'benign';
  }[];
  protectiveFactors: string[];
  recommendation: string;
  suggestedTimeframe: string;
  disclaimer: string;
  doctorSummaryText: string;
}

export interface ClinicProvider {
  id: string;
  name: string;
  specialist: string;
  specialtyType: 'Dentist' | 'Oral & Maxillofacial Surgeon' | 'ENT Specialist' | 'Head & Neck Oncology';
  title: string;
  rating: number;
  reviewsCount: number;
  distance: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  availableDates: string[];
  availableTimes: string[];
  badge: string;
}

export interface BookedAppointment {
  confirmationCode: string;
  clinic: ClinicProvider;
  date: string;
  timeSlot: string;
  patientName: string;
  contactNumber: string;
  patientNotes?: string;
  reasonForVisit: string;
  bookedAt: string;
  shareSummaryWithDoctor: boolean;
}

export interface DemoTestCase {
  id: string;
  title: string;
  badge: string;
  category: string;
  initialMessage: string;
  description: string;
  expectedConcern: ScreeningConcernLevel;
}

export interface OralRegion {
  id: string;
  name: string;
  hindiName: string;
  riskLevel: 'high_risk' | 'moderate_risk' | 'general';
  description: string;
  clinicalSignificance: string;
  commonPathologies: string[];
}
