/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Stateful, Non-Linear Conversational Screening Engine Service for OralGuard AI
 *
 * Architecture & Design:
 * 1. Stateful Canonical Session: Maintains single source of truth `screeningSession` across all turns.
 * 2. LLM-Based Fact Extraction: Extracts multi-attribute clinical facts (symptoms, locations, chronicity,
 *    red flags, habits, corrections, denials) with remote Gemini LLM + resilient local fallback.
 * 3. Dynamic Missing Information Identification: Evaluates current clinical state against standard
 *    oral mucosal & oncological screening criteria, identifying specific missing clinical fields.
 * 4. Non-Linear Interaction Flow: Determines the next conversational interaction dynamically based on
 *    the highest-priority missing clinical gap, rather than walking a rigid sequential question script.
 * 5. Full Multilingual Support: Seamless translation and conversational synthesis for English, Hindi, and Marathi.
 */

import {
  ChatMessage,
  PatientProfile,
  ScreeningSession,
  ExtractedClinicalFacts,
  AppLanguage,
  OralRegion,
  PhotoDocumentationItem,
  SymptomProgressEntry,
  MouthMapLocationItem,
  ClinicalConcern,
} from '../types';
import {
  INITIAL_BOT_MESSAGE_EN,
  INITIAL_BOT_MESSAGE_HI,
  extractStructuredFactsLocally,
  validateExtractedFacts,
  mergeExtractedFactsIntoSession,
  getScreeningQuestionsStatus,
  evaluateClinicalIndicators,
} from '../data/clinicalKnowledge';
import { generateAdaptiveDialogueTurn } from '../data/conversationalEngine';

export const INITIAL_BOT_MESSAGE_MR: ChatMessage = {
  id: 'bot-initial-mr',
  role: 'assistant',
  content:
    'नमस्कार! मी ओरलगार्ड एआय (OralGuard AI) चा प्राथमिक तपासणी सहाय्यक आहे.\n\nकृपया आपल्या तोंडातील कोणत्याही लक्षणाबद्दल सांगा — जसे की कोणताही फोड, अल्सर (छाला), लाल किंवा पांढरा डाग, गाठ, किंवा गिळताना त्रास. आपण केव्हापासून हा बदल अनुभवत आहात?',
  timestamp: 'Just now',
  quickReplies: [
    'तोंडातील छाला / अल्सर',
    'पांढरा किंवा लाल डाग',
    'तोंड उघडण्यास त्रास (Trismus)',
    'नियमित तपासणी / कोणतीही समस्या नाही',
  ],
};

export const SESSION_STORAGE_KEY = 'oralguard_persistent_screening_session_v2';

/**
 * Key clinical information fields tracked in the non-linear assessment model
 */
export type MissingClinicalFieldKey =
  | 'primary_symptom'
  | 'anatomical_location'
  | 'symptom_duration'
  | 'warning_red_flags'
  | 'smokeless_tobacco_areca'
  | 'combustible_tobacco'
  | 'alcohol_consumption'
  | 'mechanical_dental_irritation';

export interface MissingClinicalInfoItem {
  key: MissingClinicalFieldKey;
  label: string;
  category: 'symptom' | 'location' | 'chronicity' | 'red_flag' | 'habit' | 'local_factor';
  urgency: 'emergency' | 'high' | 'moderate' | 'routine';
  clinicalRationale: string;
  suggestedQuestionEN: string;
  suggestedQuestionHI: string;
  suggestedQuestionMR: string;
  suggestedQuickRepliesEN: string[];
  suggestedQuickRepliesHI: string[];
  suggestedQuickRepliesMR: string[];
}

export interface NextLogicalInteractionResult {
  targetFieldKey: MissingClinicalFieldKey | 'ready' | 'emergency';
  directive: string;
  fallbackQuestionText: string;
  suggestedQuickReplies: string[];
  isReadyForEvaluation: boolean;
  isEmergency: boolean;
}

export interface ConversationalEngineResult {
  reply: string;
  quickReplies: string[];
  updatedSession: ScreeningSession;
  extractedFacts: ExtractedClinicalFacts;
  missingClinicalInfo: MissingClinicalInfoItem[];
  isReadyForEvaluation: boolean;
  isEmergencyAlert: boolean;
  source: 'gemini' | 'clinical-engine' | 'emergency-fallback';
}

/**
 * Creates a clean, initial canonical ScreeningSession
 */
export function createInitialScreeningSession(
  fallbackIndicators: PatientProfile = {},
  language: AppLanguage = 'en'
): ScreeningSession {
  const initialBotText =
    language === 'en'
      ? INITIAL_BOT_MESSAGE_EN.content
      : language === 'hi'
      ? INITIAL_BOT_MESSAGE_HI.content
      : INITIAL_BOT_MESSAGE_MR.content;

  return {
    sessionId: `session-${Date.now()}`,
    stage: 1,
    currentStepName: 'Symptoms',
    profile: { ...fallbackIndicators, detectedLanguage: language },
    lastAssistantQuestion: initialBotText,
    turnCount: 0,
    evaluatedFields: [],
    isComplete: false,
    emergencyTriggered: Boolean(fallbackIndicators.emergencyFlagTriggered),
    lastUpdatedAt: Date.now(),
  };
}

/**
 * Loads the persistent screening session from sessionStorage or falls back to a fresh one
 */
export function loadPersistentScreeningSession(
  fallbackIndicators: PatientProfile = {},
  fallbackLang: AppLanguage = 'en'
): ScreeningSession {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ScreeningSession;
        if (parsed && parsed.sessionId && parsed.profile) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse error and fall back
    }
  }

  return createInitialScreeningSession(fallbackIndicators, fallbackLang);
}

/**
 * Persists the canonical screening session to sessionStorage
 */
export function persistScreeningSession(session: ScreeningSession): void {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage error
    }
  }
}

/**
 * Dynamically identifies missing clinical information from the patient profile.
 * Unlike rigid linear forms, this evaluates the entire clinical state holistically.
 */
export function identifyMissingClinicalInformation(
  profile: PatientProfile
): MissingClinicalInfoItem[] {
  const missing: MissingClinicalInfoItem[] = [];

  // 1. Primary Lesion / Complaint Assessment
  const hasActiveConcerns = Boolean(profile.concerns && profile.concerns.length > 0);
  const isLesionPresent = Boolean(
    profile.hasLesionOrUlcer ||
    (profile.colorChanges && profile.colorChanges !== 'none') ||
    profile.thickeningOrLump ||
    profile.concerns?.some(
      (c) => c.type === 'lesion_ulcer' || c.type === 'color_change' || c.type === 'lump_thickening'
    )
  );

  const symptomsAnswered = Boolean(
    hasActiveConcerns ||
    profile.hasLesionOrUlcer !== undefined ||
    (profile.colorChanges !== undefined && profile.colorChanges !== 'none') ||
    profile.thickeningOrLump !== undefined
  );

  if (!symptomsAnswered) {
    missing.push({
      key: 'primary_symptom',
      label: 'Primary Oral Complaint',
      category: 'symptom',
      urgency: 'high',
      clinicalRationale: 'Establishing whether an active mucosal lesion, sore, or discomfort exists determines the clinical pathway.',
      suggestedQuestionEN: 'Could you describe what you have noticed in your mouth — such as a sore or ulcer, a white or red patch, reduced mouth opening, or is this a routine checkup?',
      suggestedQuestionHI: 'क्या आप बता सकते हैं कि मुँह में क्या तकलीफ़ महसूस हो रही है — जैसे कोई छाला (ulcer), सफ़ेद या लाल पैच, मुँह कम खुलना, या यह केवल रूटीन चेकअप है?',
      suggestedQuestionMR: 'आपण सांगू शकता का की तोंडात काय त्रास जाणवत आहे — जसे की फोड (ulcer), पांढरा किंवा लाल डाग, तोंड उघडण्यास त्रास, की ही केवळ रूटीन तपासणी आहे?',
      suggestedQuickRepliesEN: ['Mouth sore or ulcer', 'White or red patch', 'Difficulty opening mouth', 'No symptoms, routine check'],
      suggestedQuickRepliesHI: ['मुँह में छाला (ulcer) है', 'सफ़ेद या लाल पैच है', 'मुँह कम खुलता है', 'कोई लक्षण नहीं, बस रूटीन चेकअप'],
      suggestedQuickRepliesMR: ['तोंडात फोड (ulcer) आहे', 'पांढरा किंवा लाल डाग आहे', 'तोंड कमी उघडते', 'कोणतेही लक्षण नाही, रूटीन चेकअप'],
    });
  }

  // 2. Anatomical Site / Localization
  // Required only if a lesion, sore, lump, or patch is present
  const lesionConcern = profile.concerns?.find(
    (c) => c.type === 'lesion_ulcer' || c.type === 'color_change' || c.type === 'lump_thickening'
  );
  const concernHasLocation = Boolean(lesionConcern && lesionConcern.locations && lesionConcern.locations.length > 0);
  const locationAnswered = !isLesionPresent || Boolean(
    concernHasLocation ||
    profile.primarySymptomLocation ||
    (profile.affectedRegions && profile.affectedRegions.length > 0)
  );

  if (isLesionPresent && !locationAnswered) {
    missing.push({
      key: 'anatomical_location',
      label: 'Anatomical Site / Location',
      category: 'location',
      urgency: 'high',
      clinicalRationale: 'Anatomical site stratifies oncological risk (e.g. lateral tongue border and floor of mouth are high-risk sites).',
      suggestedQuestionEN: 'Where in your mouth is this sore or discomfort located — for example, on the side of your tongue, inside of your cheek, on your gums, or floor of mouth? (You can also tap the interactive Mouth Map).',
      suggestedQuestionHI: 'यह छाला या तकलीफ़ मुँह के किस हिस्से में है — जैसे जीभ के किनारे, गाल के अंदर, मसूड़ों पर, या मुँह के निचले हिस्से (Floor of mouth) में? (आप ऊपर Mouth Map पर भी चुन सकते हैं)।',
      suggestedQuestionMR: 'हा फोड किंवा त्रास तोंडाच्या कोणत्या भागात आहे — जसे की जिभेची बाजू, गालाचा आतील भाग, हिरड्यांवर, किंवा जिभेच्या खाली? (आपण वरील Mouth Map वरही निवडू शकता).',
      suggestedQuickRepliesEN: ['Inside cheek (Buccal)', 'Side of tongue (Lateral border)', 'Gums / Ridge', 'Under tongue / Floor of mouth'],
      suggestedQuickRepliesHI: ['गाल के अंदर (Inner Cheek)', 'जीभ पर (Side of Tongue)', 'मसूड़े (Gums)', 'मुँह का निचला हिस्सा (Floor of mouth)'],
      suggestedQuickRepliesMR: ['गालाच्या आत (Inner Cheek)', 'जिभेवर (Side of Tongue)', 'हिरड्या (Gums)', 'जिभेच्या खाली (Floor of mouth)'],
    });
  }

  // 3. Chronicity / Duration
  // Evaluates persistence > 2 weeks (major diagnostic cutoff for persistent oral lesions)
  const concernHasDuration = Boolean(
    lesionConcern &&
    (lesionConcern.duration ||
      lesionConcern.durationCategory ||
      lesionConcern.durationOverTwoWeeks !== undefined ||
      lesionConcern.durationText)
  );
  const durationAnswered = !isLesionPresent || Boolean(
    concernHasDuration ||
    profile.duration !== undefined ||
    profile.durationCategory !== undefined ||
    profile.durationOverTwoWeeks !== undefined ||
    profile.durationText
  );

  if (isLesionPresent && !durationAnswered) {
    missing.push({
      key: 'symptom_duration',
      label: 'Symptom Chronicity / Duration',
      category: 'chronicity',
      urgency: 'high',
      clinicalRationale: 'Mucosal sores lasting more than two weeks fail normal healing kinetics and warrant clinical visualization.',
      suggestedQuestionEN: 'Approximately how long has this been present — just a few days (< 2 weeks), 2 to 4 weeks, or more than a month?',
      suggestedQuestionHI: 'यह समस्या लगभग कितने समय से बनी हुई है — कुछ दिनों से (< 2 हफ्ते), 2 से 4 सप्ताह, या 1 महीने से अधिक?',
      suggestedQuestionMR: 'हा त्रास साधारण किती दिवसांपासून आहे — काही दिवस (< २ आठवडे), २ ते ४ आठवडे, की १ महिन्यापेक्षा जास्त?',
      suggestedQuickRepliesEN: ['Just a few days (< 2 weeks)', 'About 2 to 4 weeks', 'More than a month', "Not sure / Can't recall"],
      suggestedQuickRepliesHI: ['कुछ ही दिन (< 2 हफ्ते)', 'लगभग 2 से 4 हफ्ते', '1 महीने से अधिक', 'ठीक से याद नहीं'],
      suggestedQuickRepliesMR: ['काहीच दिवस (< २ आठवडे)', 'सुमारे २ ते ४ आठवडे', '१ महिन्यापेक्षा जास्त', 'नक्की आठवत नाही'],
    });
  }

  // 4. Warning Signs & Red Flags (Bleeding, Trismus, Numbness, Dysphagia)
  const redFlagsAnswered = Boolean(
    profile.reducedMouthOpening !== undefined ||
    profile.unexplainedBleeding !== undefined ||
    profile.soreBleeding !== undefined ||
    profile.numbnessInMouth !== undefined ||
    profile.difficultySwallowing !== undefined
  );

  if (!redFlagsAnswered) {
    missing.push({
      key: 'warning_red_flags',
      label: 'Oncological Warning Signs (Trismus, Bleeding, Numbness, Dysphagia)',
      category: 'red_flag',
      urgency: 'high',
      clinicalRationale: 'Associated paresthesia, contact bleeding, and reduced mouth opening indicate deep tissue infiltration or OSMF.',
      suggestedQuestionEN: 'Have you noticed any associated warning signs — such as unexplained bleeding from the area, numbness in your lips or tongue, or difficulty opening your mouth fully?',
      suggestedQuestionHI: 'क्या आपने इसके साथ कोई चेतावनी संकेत महसूस किए हैं — जैसे उस जगह से अकारण खून बहना, होंठ या जीभ में सुन्नपन, या मुँह पूरा खोलने में कठिनाई?',
      suggestedQuestionMR: 'आपण यासोबत काही धोक्याची लक्षणे पाहिली आहेत का — जसे की अकारण रक्त येणे, ओठ किंवा जीभ बधीर होणे, अथवा तोंड पूर्ण उघडण्यास त्रास?',
      suggestedQuickRepliesEN: ['No, none of these symptoms', 'Difficulty opening mouth (Trismus)', 'Bleeding or numbness noticed'],
      suggestedQuickRepliesHI: ['नहीं, इनमें से कोई लक्षण नहीं', 'मुँह खोलने में परेशानी होती है', 'खून आना या सुन्नपन महसूस होना'],
      suggestedQuickRepliesMR: ['नाही, यांपैकी कोणतेही लक्षण नाही', 'तोंड उघडण्यास त्रास होतो', 'रक्त येणे किंवा बधीरपणा जाणवणे'],
    });
  }

  // 5. Smokeless Tobacco & Areca Nut (Gutka, Khaini, Supari, Paan)
  const gutkaAnswered = Boolean(
    profile.tobaccoSmokeless !== undefined ||
    profile.arecaOrBetelNut !== undefined
  );

  if (!gutkaAnswered) {
    missing.push({
      key: 'smokeless_tobacco_areca',
      label: 'Smokeless Tobacco & Areca Nut Exposure',
      category: 'habit',
      urgency: 'moderate',
      clinicalRationale: 'Areca nut and smokeless tobacco are primary Group 1 carcinogens driving submucous fibrosis and oral squamous cell carcinoma.',
      suggestedQuestionEN: 'Do you currently or previously chew gutka, khaini, zarda, supari, or paan with tobacco? (Our discussion is completely confidential and non-judgmental).',
      suggestedQuestionHI: 'क्या आप गुटखा, खैनी, जर्दा, सुपारी या तंबाकू वाला पान का सेवन करते हैं या पहले कभी किया है? (यह बातचीत पूरी तरह गोपनीय और बिना किसी पूर्वाग्रह के है)।',
      suggestedQuestionMR: 'आपण गुटखा, खैनी, जर्दा, सुपारी किंवा तंबाखूचे पान खाता किंवा पूर्वी कधी खाल्ले आहे का? (आपली ही माहिती पूर्णपणे सुरक्षित व गोपनीय आहे).',
      suggestedQuickRepliesEN: ['Never used gutka or areca', 'Daily gutka / khaini', 'Occasional supari / paan', 'Used in past, now quit'],
      suggestedQuickRepliesHI: ['कभी गुटखा या सुपारी नहीं ली', 'रोज़ गुटखा / खैनी का सेवन', 'कभी-कभार पान / सुपारी', 'पहले लेता था, अब छोड़ दिया'],
      suggestedQuickRepliesMR: ['कधीही गुटखा किंवा सुपारी घेतली नाही', 'रोज गुटखा / खैनी खातो', 'कधीतरी पान / सुपारी', 'पूर्वी खात होतो, आता सोडले'],
    });
  }

  // 6. Combustible Tobacco (Bidi, Cigarettes)
  const smokingAnswered = Boolean(profile.tobaccoSmoked !== undefined);
  if (!smokingAnswered) {
    missing.push({
      key: 'combustible_tobacco',
      label: 'Combustible Tobacco (Bidi / Cigarettes)',
      category: 'habit',
      urgency: 'moderate',
      clinicalRationale: 'Combustion products inflict thermal and chemical injury across upper aerodigestive mucosa.',
      suggestedQuestionEN: 'Do you smoke bidi, cigarettes, or any other tobacco products?',
      suggestedQuestionHI: 'क्या आप बीड़ी, सिगरेट या अन्य किसी धूम्रपान उत्पाद का सेवन करते हैं?',
      suggestedQuestionMR: 'आपण बिडी, सिगारेट किंवा इतर कोणत्याही धूम्रपानाचे सेवन करता का?',
      suggestedQuickRepliesEN: ['Non-smoker (Never smoked)', 'Smoke bidi daily', 'Smoke cigarettes', 'Former smoker (Quit)'],
      suggestedQuickRepliesHI: ['धूम्रपान कभी नहीं किया', 'रोज़ बीड़ी पीता हूँ', 'सिगरेट पीता हूँ', 'पहले पीता था, अब छोड़ दिया'],
      suggestedQuickRepliesMR: ['धूम्रपान कधीही केले नाही', 'रोज बिडी ओढतो', 'सिगारेट ओढतो', 'पूर्वी ओढत होतो, आता सोडले'],
    });
  }

  // 7. Alcohol Consumption & Synergy
  const alcoholAnswered = Boolean(profile.alcoholIntake !== undefined || profile.alcoholUse !== undefined);
  if (!alcoholAnswered) {
    missing.push({
      key: 'alcohol_consumption',
      label: 'Alcohol Consumption',
      category: 'habit',
      urgency: 'moderate',
      clinicalRationale: 'Alcohol acts synergistically with tobacco by increasing mucosal permeability to carcinogens.',
      suggestedQuestionEN: 'Do you consume alcohol, and if so, is it occasional or regular?',
      suggestedQuestionHI: 'क्या आप शराब (alcohol) का भी सेवन करते हैं? यदि हाँ, तो कभी-कभार (occasional) या नियमित (regular)?',
      suggestedQuestionMR: 'आपण मद्यपान (alcohol) करता का? असल्यास, कधीतरी (occasional) की नियमित (regular)?',
      suggestedQuickRepliesEN: ['Never drink alcohol', 'Occasionally / Socially', 'Regular / Frequent', 'Quit alcohol'],
      suggestedQuickRepliesHI: ['शराब का सेवन बिल्कुल नहीं', 'कभी-कभार (Occasional)', 'नियमित / अक्सर (Regular)', 'अब छोड़ दी है'],
      suggestedQuickRepliesMR: ['मद्यपान अजिबात करत नाही', 'कधीतरी (Occasional)', 'नियमित / वारंवार (Regular)', 'आता बंद केले आहे'],
    });
  }

  // 8. Chronic Mechanical Dental Irritation (Optional context if ulcer exists without habits)
  if (isLesionPresent && profile.chronicIrritation === undefined && gutkaAnswered && smokingAnswered) {
    const isLowHabitRisk = profile.tobaccoSmokeless === 'none' && profile.tobaccoSmoked === 'none';
    if (isLowHabitRisk) {
      missing.push({
        key: 'mechanical_dental_irritation',
        label: 'Dental Mechanical Irritation',
        category: 'local_factor',
        urgency: 'routine',
        clinicalRationale: 'Traumatic ulcers from sharp cusps or ill-fitting dentures mimic neoplasia but resolve after removing the irritation.',
        suggestedQuestionEN: 'Is there a sharp tooth, broken filling, or ill-fitting denture rubbing against this sore area?',
        suggestedQuestionHI: 'क्या उस छाले वाली जगह पर कोई नुकीला दांत, टूटा हुआ दांत, या नकली बत्तीसी (denture) रगड़ खा रही है?',
        suggestedQuestionMR: 'त्या फोडाच्या जागी एखादा अणकुचीदार दात, तुटलेला दात किंवा कवळी (denture) घासली जात आहे का?',
        suggestedQuickRepliesEN: ['Yes, a sharp tooth rubs there', 'No sharp tooth or denture', 'Not sure'],
        suggestedQuickRepliesHI: ['हाँ, नुकीला दांत रगड़ता है', 'कोई नुकीला दांत या डेंचर नहीं', 'पक्का पता नहीं'],
        suggestedQuickRepliesMR: ['होय, अणकुचीदार दात घासतो', 'कोणताही दात किंवा कवळी नाही', 'नक्की माहित नाही'],
      });
    }
  }

  return missing;
}

/**
 * Determines the next logical interaction based on identified missing clinical information
 * rather than following a fixed question sequence.
 */
export function determineNextLogicalInteraction(
  profile: PatientProfile,
  missingInfo: MissingClinicalInfoItem[],
  language: AppLanguage,
  lastUserText?: string
): NextLogicalInteractionResult {
  // Priority 0: Safety First — Emergency Airway / Neck Space Red Flags
  if (profile.emergencyFlagTriggered) {
    const isHindi = language === 'hi';
    const isMarathi = language === 'mr';

    return {
      targetFieldKey: 'emergency',
      directive: 'Emergency safety override: Severe airway or acute spreading neck space infection signs. Advise immediate in-person emergency hospital care.',
      fallbackQuestionText: isHindi
        ? '⚠️ आवश्यक स्वास्थ्य सुरक्षा चेतावनी: आपने सांस लेने में कठिनाई या गले/गर्दन में गंभीर सूजन की सूचना दी है। यह लक्षण तत्काल व्यक्तिगत चिकित्सकीय ध्यान की मांग करते हैं। कृपया इस ऑनलाइन स्क्रीनिंग के बजाय तुरंत नजदीकी अस्पताल या इमरजेंसी क्लिनिक में डॉक्टर से संपर्क करें।'
        : isMarathi
        ? '⚠️ महत्त्वाची वैद्यकीय सुरक्षा चेतावणी: आपण श्वास घेण्यास अडथळा किंवा मान/घशात तीव्र सूज आल्याची माहिती दिली आहे. या लक्षणांसाठी तातडीने प्रत्यक्ष डॉक्टरांची मदत आवश्यक आहे. कृपया त्वरित जवळच्या रुग्णालयात किंवा आपत्कालीन विभागात संपर्क साधा.'
        : '⚠️ Important Medical Safety Notice: You mentioned symptoms involving breathing difficulty or acute swelling in the neck or throat. These require immediate in-person clinical care. Please seek urgent care at a hospital emergency room or clinic rather than continuing this screening.',
      suggestedQuickReplies: isHindi
        ? ['मेरी स्क्रीनिंग रिपोर्ट देखें', 'नजदीकी अस्पताल खोजें']
        : isMarathi
        ? ['माझा तपासणी अहवाल पहा', 'जवळचे रुग्णालय शोधा']
        : ['View My Screening Results', 'Find Hospital / Clinic'],
      isReadyForEvaluation: true,
      isEmergency: true,
    };
  }

  // Check overall screening completeness from single source of truth
  const screeningStatus = getScreeningQuestionsStatus(profile);
  const criticalMissing = missingInfo.filter((item) => item.urgency !== 'routine');

  if (screeningStatus.allRequiredAnswered || criticalMissing.length === 0) {
    const isHindi = language === 'hi';
    const isMarathi = language === 'mr';

    return {
      targetFieldKey: 'ready',
      directive: 'All critical clinical areas (symptoms, duration, red flags, habits) have been evaluated. Inform the patient their preliminary screening report and doctor summary are ready.',
      fallbackQuestionText: isHindi
        ? 'धन्यवाद! हमने आपकी स्थिति से जुड़े सभी मुख्य बिंदु — लक्षण, समय, चेतावनी संकेत और आदतें — पूरी तरह समझ लिए हैं। आपकी प्रारंभिक स्क्रीनिंग रिपोर्ट और डॉक्टर समरी तैयार है।\n\nनीचे दिए गए बटन पर टैप करके अपनी रिपोर्ट देखें।'
        : isMarathi
        ? 'धन्यवाद! आपण लक्षणे, कालावधी, धोक्याची लक्षणे आणि सवयी या सर्व मुख्य मुद्द्यांची माहिती पूर्ण केली आहे. आपला प्राथमिक तपासणी अहवाल आणि डॉक्टर सारांश तयार आहे.\n\nखालील बटनावर टॅप करून अहवाल पहा.'
        : 'Thank you! We have covered all the key clinical areas — symptoms, duration, warning signs, and habits. Your preliminary screening evaluation and doctor summary are ready.\n\nPlease tap below to review your results.',
      suggestedQuickReplies: isHindi
        ? ['मेरी स्क्रीनिंग रिपोर्ट देखें']
        : isMarathi
        ? ['माझा तपासणी अहवाल पहा']
        : ['View My Screening Results'],
      isReadyForEvaluation: true,
      isEmergency: false,
    };
  }

  // Non-linear clinical gap prioritization:
  // Instead of fixed order (1, then 2, then 3):
  // 1. If lesion exists but location is missing -> Prioritize location & anatomical precision
  // 2. If lesion exists & location known, but duration is missing -> Prioritize duration
  // 3. If primary complaint is unknown -> Prioritize symptom elicitation
  // 4. If warning signs are unaddressed -> Prioritize high-risk red flags
  // 5. If habits are unaddressed -> Prioritize smokeless tobacco/areca, then smoking, then alcohol
  let chosenGap: MissingClinicalInfoItem;

  const locationGap = missingInfo.find((m) => m.key === 'anatomical_location');
  const durationGap = missingInfo.find((m) => m.key === 'symptom_duration');
  const symptomGap = missingInfo.find((m) => m.key === 'primary_symptom');
  const redFlagGap = missingInfo.find((m) => m.key === 'warning_red_flags');
  const gutkaGap = missingInfo.find((m) => m.key === 'smokeless_tobacco_areca');
  const smokingGap = missingInfo.find((m) => m.key === 'combustible_tobacco');
  const alcoholGap = missingInfo.find((m) => m.key === 'alcohol_consumption');
  const irritationGap = missingInfo.find((m) => m.key === 'mechanical_dental_irritation');

  if (locationGap) {
    chosenGap = locationGap;
  } else if (durationGap) {
    chosenGap = durationGap;
  } else if (symptomGap) {
    chosenGap = symptomGap;
  } else if (redFlagGap) {
    chosenGap = redFlagGap;
  } else if (gutkaGap) {
    chosenGap = gutkaGap;
  } else if (smokingGap) {
    chosenGap = smokingGap;
  } else if (alcoholGap) {
    chosenGap = alcoholGap;
  } else if (irritationGap) {
    chosenGap = irritationGap;
  } else {
    chosenGap = missingInfo[0];
  }

  const isHindi = language === 'hi';
  const isMarathi = language === 'mr';

  const questionText = isHindi
    ? chosenGap.suggestedQuestionHI
    : isMarathi
    ? chosenGap.suggestedQuestionMR
    : chosenGap.suggestedQuestionEN;

  const quickReplies = isHindi
    ? chosenGap.suggestedQuickRepliesHI
    : isMarathi
    ? chosenGap.suggestedQuickRepliesMR
    : chosenGap.suggestedQuickRepliesEN;

  const directive = `The current missing clinical gap is: "${chosenGap.label}". Rationale: ${chosenGap.clinicalRationale}. Acknowledge any newly provided details empathetically, and conversationally inquire about ${chosenGap.label}. Do NOT re-ask about already confirmed clinical indicators.`;

  return {
    targetFieldKey: chosenGap.key,
    directive,
    fallbackQuestionText: questionText,
    suggestedQuickReplies: quickReplies,
    isReadyForEvaluation: false,
    isEmergency: false,
  };
}

export interface ProcessTurnOptions {
  patientInput: string;
  session: ScreeningSession;
  language: AppLanguage;
  messagesHistory: ChatMessage[];
  imageAttachment?: { data: string; mimeType: string };
  onCompleteScreening?: (profile: PatientProfile) => void;
}

/**
 * Main stateful processing function:
 * 1. Performs local clinical fact extraction and updates the canonical session.
 * 2. Evaluates answered vs. missing clinical indicators.
 * 3. Dispatches context-filtered request to LLM backend (/api/chat).
 * 4. Merges LLM extracted facts into the canonical session with validation.
 * 5. Dynamically determines the next non-linear interaction based on missing clinical information.
 * 6. Returns the updated session, reply, and missing clinical items.
 */
export async function processConversationalTurn(
  options: ProcessTurnOptions
): Promise<ConversationalEngineResult> {
  const { patientInput, session, language, messagesHistory } = options;
  const content = patientInput.trim();

  // 1. Initial local extraction and single-source-of-truth canonical update
  const lastAssistantMsg =
    session.lastAssistantQuestion ||
    [...messagesHistory].reverse().find((m) => m.role === 'assistant')?.content;

  const baseProfile: PatientProfile = {
    ...session.profile,
    detectedLanguage: language,
  };

  const initialLocalFacts = extractStructuredFactsLocally(content, baseProfile, lastAssistantMsg);
  let activeSession = mergeExtractedFactsIntoSession(session, initialLocalFacts, content);
  activeSession.profile.detectedLanguage = language;
  activeSession.lastUserResponse = content;

  // 2. Identify missing clinical gaps based on updated profile
  let missingInfo = identifyMissingClinicalInformation(activeSession.profile);
  let logicalNext = determineNextLogicalInteraction(activeSession.profile, missingInfo, language, content);

  // 3. Fast-track if patient explicitly requests results AND screening criteria are met
  const lowerContent = content.toLowerCase();
  const isRequestingResults =
    lowerContent.includes('view my screening') ||
    lowerContent.includes('view result') ||
    lowerContent.includes('result dekhein') ||
    lowerContent.includes('निकाल') ||
    lowerContent.includes('check result') ||
    lowerContent.includes('assessment');

  if (isRequestingResults && logicalNext.isReadyForEvaluation) {
    return {
      reply: logicalNext.fallbackQuestionText,
      quickReplies: logicalNext.suggestedQuickReplies,
      updatedSession: {
        ...activeSession,
        isComplete: true,
        assessmentReady: true,
        lastUpdatedAt: Date.now(),
      },
      extractedFacts: initialLocalFacts,
      missingClinicalInfo: missingInfo,
      isReadyForEvaluation: true,
      isEmergencyAlert: false,
      source: 'clinical-engine',
    };
  }

  // 4. Emergency override: immediate return without waiting for network
  if (activeSession.profile.emergencyFlagTriggered || logicalNext.isEmergency) {
    const turn = generateAdaptiveDialogueTurn(
      content,
      activeSession.profile,
      messagesHistory,
      activeSession.turnCount
    );

    const finalizedSession: ScreeningSession = {
      ...activeSession,
      lastAssistantQuestion: turn.replyText,
      isComplete: true,
      assessmentReady: true,
      emergencyTriggered: true,
      lastUpdatedAt: Date.now(),
    };

    return {
      reply: turn.replyText,
      quickReplies: turn.suggestedQuickReplies,
      updatedSession: finalizedSession,
      extractedFacts: initialLocalFacts,
      missingClinicalInfo: missingInfo,
      isReadyForEvaluation: true,
      isEmergencyAlert: true,
      source: 'clinical-engine',
    };
  }

  // 5. Context Filter preparation for LLM Fact Extraction (/api/chat)
  const { answeredIndicators, unansweredIndicators, forbiddenTopics } =
    evaluateClinicalIndicators(activeSession.profile);

  const filteredContextMessages: Array<{ role: string; content: string }> = [];

  filteredContextMessages.push({
    role: 'user',
    content: `[STATEFUL NON-LINEAR CLINICAL CONTEXT FILTER]
PREVIOUSLY CONFIRMED CLINICAL FACTS (NEVER RE-ASK):
${answeredIndicators.map((i) => `• ${i.label}: ${i.valueDisplay}`).join('\n')}

FORBIDDEN TOPICS:
${forbiddenTopics.map((t) => `• ${t}`).join('\n')}

IDENTIFIED MISSING CLINICAL GAPS:
${
  missingInfo.length > 0
    ? missingInfo.map((m) => `• [${m.urgency.toUpperCase()}] ${m.label} (${m.clinicalRationale})`).join('\n')
    : 'All critical screening gaps resolved.'
}

NON-LINEAR TARGET DIRECTIVE:
${logicalNext.directive}

Patient's latest message: "${content}"`,
  });

  const recentDialogueTurns = messagesHistory.slice(-4);
  for (const msg of recentDialogueTurns) {
    if (msg.role === 'assistant') {
      const textLower = msg.content.toLowerCase();
      const askedAnsweredTopic = forbiddenTopics.some((topic) =>
        textLower.includes(topic.toLowerCase().slice(0, 14))
      );
      if (askedAnsweredTopic) {
        filteredContextMessages.push({
          role: 'assistant',
          content: 'Understood and recorded your symptoms in your screening record.',
        });
        continue;
      }
    }
    filteredContextMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  }

  // 6. Remote LLM Fact Extraction with resilient local fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: filteredContextMessages,
        currentProfile: activeSession.profile,
        language,
        previouslyAnsweredIndicators: answeredIndicators.map((i) => `${i.label}: ${i.valueDisplay}`),
        forbiddenTopics,
        unansweredIndicators: unansweredIndicators.map((i) => i.label),
        imageAttachment: options.imageAttachment,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.reply) {
        let extractedFacts = initialLocalFacts;

        // Merge LLM extracted facts into canonical session
        if (data.extractedFacts && typeof data.extractedFacts === 'object') {
          const validatedFacts = validateExtractedFacts(data.extractedFacts);
          activeSession = mergeExtractedFactsIntoSession(activeSession, validatedFacts, content);
          activeSession.profile.detectedLanguage = language;
          extractedFacts = { ...initialLocalFacts, ...validatedFacts };
        }

        // Recalculate missing gaps and next interaction based on newly merged facts
        missingInfo = identifyMissingClinicalInformation(activeSession.profile);
        logicalNext = determineNextLogicalInteraction(activeSession.profile, missingInfo, language, content);

        const finalReply = data.reply;

        const quickReplies =
          Array.isArray(data.quickReplies) && data.quickReplies.length > 0
            ? data.quickReplies
            : logicalNext.suggestedQuickReplies;

        const finalizedSession: ScreeningSession = {
          ...activeSession,
          lastAssistantQuestion: finalReply,
          isComplete: logicalNext.isReadyForEvaluation,
          assessmentReady: logicalNext.isReadyForEvaluation,
          emergencyTriggered: Boolean(activeSession.profile.emergencyFlagTriggered),
          lastUpdatedAt: Date.now(),
        };

        return {
          reply: finalReply,
          quickReplies,
          updatedSession: finalizedSession,
          extractedFacts,
          missingClinicalInfo: missingInfo,
          isReadyForEvaluation: logicalNext.isReadyForEvaluation,
          isEmergencyAlert: Boolean(activeSession.profile.emergencyFlagTriggered),
          source: (data.source as 'gemini' | 'clinical-engine') || 'gemini',
        };
      }
    }
  } catch {
    // Network or parse failure: smoothly fall through to resilient local engine
  }

  // 7. Resilient Local Dialogue Engine Fallback
  const turn = generateAdaptiveDialogueTurn(
    content,
    activeSession.profile,
    messagesHistory,
    activeSession.turnCount
  );

  missingInfo = identifyMissingClinicalInformation(activeSession.profile);
  logicalNext = determineNextLogicalInteraction(activeSession.profile, missingInfo, language, content);

  const fallbackReply = logicalNext.isReadyForEvaluation ? logicalNext.fallbackQuestionText : turn.replyText;
  const fallbackQuickReplies = logicalNext.isReadyForEvaluation
    ? logicalNext.suggestedQuickReplies
    : turn.suggestedQuickReplies;

  const finalizedSession: ScreeningSession = {
    ...activeSession,
    lastAssistantQuestion: fallbackReply,
    isComplete: logicalNext.isReadyForEvaluation || Boolean(turn.isReadyForEvaluation),
    assessmentReady: logicalNext.isReadyForEvaluation || Boolean(turn.isReadyForEvaluation),
    emergencyTriggered: Boolean(turn.isEmergencyAlert || activeSession.profile.emergencyFlagTriggered),
    lastUpdatedAt: Date.now(),
  };

  return {
    reply: fallbackReply,
    quickReplies: fallbackQuickReplies,
    updatedSession: finalizedSession,
    extractedFacts: initialLocalFacts,
    missingClinicalInfo: missingInfo,
    isReadyForEvaluation: logicalNext.isReadyForEvaluation || Boolean(turn.isReadyForEvaluation),
    isEmergencyAlert: Boolean(turn.isEmergencyAlert || activeSession.profile.emergencyFlagTriggered),
    source: 'clinical-engine',
  };
}

/**
 * Updates the canonical screening session with multiple confirmed locations from the Mouth Map
 */
export function applyMouthMapLocationsToSession(
  session: ScreeningSession,
  regions: OralRegion[],
  targetConcernId?: string | null,
  language: AppLanguage = 'en'
): {
  updatedSession: ScreeningSession;
  summaryMessage: string;
} {
  const isUnknown = regions.some((r) => r.id === 'unknown_location');
  const locationItems: MouthMapLocationItem[] = isUnknown
    ? [
        {
          id: 'unknown_location',
          area: 'Not sure / Unspecified',
          hindiName: 'सटीक स्थान ज्ञात नहीं',
          marathiName: 'सटीक जागा माहित नाही',
          confirmed: true,
        },
      ]
    : regions.map((r) => ({
        id: r.id,
        area: r.name,
        hindiName: r.hindiName,
        marathiName: r.marathiName,
        confirmed: true,
      }));

  const locationNames = isUnknown ? 'Not sure / Unspecified' : regions.map((r) => r.name).join(', ');
  const regionIds = isUnknown ? [] : regions.map((r) => r.id);

  let updatedConcerns = session.profile.concerns ? [...session.profile.concerns] : undefined;
  let targetConcern = updatedConcerns?.find((c) => c.id === targetConcernId);

  if (targetConcern) {
    targetConcern.locations = isUnknown ? [] : regions.map((r) => r.name);
    targetConcern.lastUpdatedAt = Date.now();
  }

  const updatedProfile: PatientProfile = {
    ...session.profile,
    detectedLanguage: language,
    affectedRegions: regionIds,
    primarySymptomLocation: locationNames,
    mouthMapLocations: locationItems,
    concerns: updatedConcerns,
  };

  const updatedSession: ScreeningSession = {
    ...session,
    mouthMapLocation: isUnknown ? 'unknown' : regions[0]?.id || null,
    mouthMapLocations: locationItems,
    location: locationNames,
    profile: updatedProfile,
    lastUpdatedAt: Date.now(),
  };

  const concernSuffix = targetConcern ? ` for ${targetConcern.description}` : '';
  const summaryMessage = isUnknown
    ? language === 'hi'
      ? `मैंने मुँह के नक़्शे (Mouth Map) पर बताया कि मुझे${concernSuffix ? ` ${targetConcern?.description} के लिए` : ''} सटीक स्थान की पहचान नहीं है।`
      : language === 'mr'
      ? `मी माउथ मॅपवर सांगितले की मला${concernSuffix ? ` ${targetConcern?.description} साठी` : ''} नेमकी जागा निश्चित माहिती नाही.`
      : `I indicated on the oral anatomy map that I am not sure of the exact location${concernSuffix}.`
    : language === 'hi'
    ? `मैंने मुँह के नक़्शे (Mouth Map) पर ${regions.length > 1 ? `${regions.length} स्थान` : ''} चिह्नित किए${concernSuffix ? ` (${targetConcern?.description})` : ''}: ${regions.map((r) => `${r.name} (${r.hindiName})`).join(', ')}`
    : language === 'mr'
    ? `मी माउथ मॅपवर ${regions.length > 1 ? `${regions.length} जागा` : 'जागा'} निवडल्या${concernSuffix ? ` (${targetConcern?.description})` : ''}: ${regions.map((r) => `${r.name} (${r.marathiName || r.hindiName})`).join(', ')}`
    : `I confirmed ${regions.length > 1 ? `${regions.length} locations` : 'location'} on the mouth map${concernSuffix}: ${regions.map((r) => r.name).join(', ')}`;

  return { updatedSession, summaryMessage };
}
