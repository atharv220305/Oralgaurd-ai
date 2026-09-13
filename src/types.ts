export type Screen =
  | 'splash'
  | 'welcome'
  | 'chat'
  | 'result'
  | 'appointment'
  | 'mouth_scanner'
  | 'mouth_map'
  | 'symptom_tracker'
  | 'cessation_support'
  | 'awareness_hub'
  | 'doctor_handoff'
  | 'health_helplines'
  | 'emergency_guidance'
  | 'ask_oralguard'
  | 'follow_up';

export type AppLanguage = 'en' | 'hi' | 'mr';

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

export interface PhotoDocumentationItem {
  id: string;
  imageData: string;
  location: string | null;
  locationName?: string;
  note: string;
  capturedAt: string;
}

export interface MouthMapLocationItem {
  id: string;
  area: string;
  hindiName?: string;
  marathiName?: string;
  confirmed: boolean;
}

export type SymptomProgressStatus = 'better' | 'same' | 'worse' | 'gone';

export interface SymptomProgressEntry {
  id: string;
  concernId: string | null;
  symptom: string;
  location: string | null;
  status: SymptomProgressStatus;
  note: string;
  recordedAt: string;
}

// Batch 4: Follow-up & Reminders
export type FollowUpStatus = 'upcoming' | 'completed' | 'cancelled';

export interface FollowUpItem {
  id: string;
  concernId: string | null;
  reason: string;
  scheduledDate: string; // YYYY-MM-DD
  note: string;
  status: FollowUpStatus;
  createdAt: string;
  completedAt?: string;
  mouthLocation?: string;
}

// Batch 2: Tobacco & Areca Cessation Types
export type TobaccoUseStatus = 'current' | 'reduced' | 'quit' | 'never' | 'unknown';
export type CessationGoal = 'reduce' | 'quit' | 'learn_more' | 'none' | 'unknown';

export interface TobaccoProductItem {
  id: string;
  type: string;
  frequency: string;
  quantity: string;
  duration: string;
  notes?: string;
}

export interface CessationLogEntry {
  id: string;
  date: string;
  cravingLevel: 'mild' | 'moderate' | 'strong' | 'none';
  actionTaken: 'resisted' | 'reduced_intake' | 'used_substitute' | 'slipped' | 'stayed_clean';
  substituteUsed?: string;
  notes?: string;
}

export interface TobaccoCessationPlan {
  status: TobaccoUseStatus;
  products: TobaccoProductItem[];
  previousQuitAttempts: string;
  goal: CessationGoal;
  targetDate?: string;
  reasonsToQuit?: string[];
  daysStreak?: number;
  lastProgressNote?: string;
  updatedAt: string;
}

// Batch 2: Oral Health Awareness Hub Types
export type AwarenessCategoryKey =
  | 'all'
  | 'cancer_awareness'
  | 'warning_signs'
  | 'oral_hygiene'
  | 'tobacco_supari_risks'
  | 'educational_videos'
  | 'trusted_organizations';

export interface AwarenessArticle {
  id: string;
  category: AwarenessCategoryKey;
  title: string;
  titleHi?: string;
  titleMr?: string;
  titleHinglish?: string;
  subtitle: string;
  subtitleHi?: string;
  subtitleMr?: string;
  subtitleHinglish?: string;
  readTime: string;
  iconName: string;
  badge?: string;
  summary: string;
  summaryHi?: string;
  summaryMr?: string;
  keyPoints: string[];
  keyPointsHi?: string[];
  keyPointsMr?: string[];
  clinicalSignificance?: string;
  whenToConsultDoctor?: string;
  practicalAction?: string;
  trustedSourceAttribution?: string;
  relevantFindingTriggers?: string[]; // Triggers personalization banner if profile matches
}

export interface PatientProfile {
  // Personal Info (Voluntary)
  patientName?: string;
  patientAge?: string;
  patientSex?: string;
  age?: string;
  gender?: string;
  mainConcern?: string;
  detectedLanguage?: AppLanguage;

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

  // Batch 1 Roadmap Extensions
  photoDocumentation?: PhotoDocumentationItem[];
  mouthMapLocations?: MouthMapLocationItem[];
  symptomProgress?: SymptomProgressEntry[];

  // Batch 2 Roadmap Extensions
  tobaccoUse?: TobaccoCessationPlan;
  cessationLogs?: CessationLogEntry[];

  // Batch 4 Roadmap Extensions
  followUps?: FollowUpItem[];

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
  multipleConcerns?: string[];
  reportedLocations?: string[];
  askedQuestions?: string[];
  userReportedFacts?: string[];
  confirmedPositiveFindings?: string[];
  confirmedNegativeFindings?: string[];
  unknownFindings?: string[];
}

export interface ExtractedClinicalFacts {
  hasLesionOrUlcer?: boolean | null;
  ulcerDetails?: string | null;
  primarySymptomLocation?: string | null;
  affectedRegions?: string[] | null;
  duration?: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown' | null;
  durationCategory?: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown' | null;
  durationText?: string | null;
  durationOverTwoWeeks?: boolean | null;
  pain?: boolean | null;
  mouthPainOrBurning?: boolean | null;
  symptomTrigger?: string | null;
  colorChanges?: 'none' | 'white' | 'red' | 'mixed' | null;
  thickeningOrLump?: boolean | null;
  unexplainedBleeding?: boolean | null;
  numbnessInMouth?: boolean | null;
  reducedMouthOpening?: boolean | null;
  difficultySwallowing?: boolean | null;
  neckLumpOrSwelling?: boolean | null;
  tobaccoSmokeless?: 'none' | 'gutka' | 'khaini' | 'zarda' | 'tobacco_paan' | null;
  tobaccoSmoked?: 'none' | 'bidi' | 'cigarettes' | 'both' | null;
  arecaOrBetelNut?: 'none' | 'supari' | 'betel_quid' | 'pan_masala' | null;
  tobaccoFrequency?: string | null;
  alcoholIntake?: 'none' | 'rare' | 'moderate' | 'heavy' | null;
  alcoholUse?: 'none' | 'occasional' | 'regular' | 'heavy' | 'unknown' | null;
  chronicIrritation?: boolean | null;
  multipleConcerns?: string[] | null;
  multipleLocations?: string[] | null;
  emergencyFlag?: boolean | null;
  emergencyReason?: string | null;
  isCorrection?: boolean | null;
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
  mouthMapLocations?: MouthMapLocationItem[];
  photoDocumentation?: PhotoDocumentationItem[];
  symptomProgress?: SymptomProgressEntry[];
  tobaccoUse?: TobaccoCessationPlan;
  cessationLogs?: CessationLogEntry[];
  followUps?: FollowUpItem[];
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
  area?: string;
  phone?: string;
  website?: string;
  publicHospitalType?: string;
  isVerified?: boolean;
  lat?: number;
  lng?: number;
  availableDates: string[];
  availableTimes: string[];
  badge: string;
}

export interface HealthHelpline {
  id: string;
  name: string;
  hindiName?: string;
  marathiName?: string;
  phone: string;
  dialNumber: string; // digits only for tel:
  purpose: string;
  purposeHi?: string;
  purposeMr?: string;
  availability: string;
  region: string;
  authority: string;
  category: 'emergency' | 'cessation' | 'general_health' | 'insurance_public';
  isTollFree: boolean;
  notes?: string;
}

export interface EmergencyWarningSign {
  id: string;
  title: string;
  titleHi?: string;
  titleMr?: string;
  symptomSign: string;
  whyUrgent: string;
  immediateAction: string;
  severity: 'critical' | 'urgent';
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
  marathiName?: string;
  riskLevel: 'high_risk' | 'moderate_risk' | 'general';
  description: string;
  clinicalSignificance: string;
  commonPathologies: string[];
}
