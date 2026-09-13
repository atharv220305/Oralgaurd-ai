/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Modular Multi-Disease Architecture for OralGuard AI platform
 */

import { AssessmentResult, PatientProfile, ScreeningConcernLevel } from '../types';

export interface DiseaseModule {
  id: string;
  name: string;
  category: 'oncology' | 'metabolic' | 'infectious' | 'general';
  isActive: boolean;
  version: string;
  description: string;
  disclaimerText: string;
  initialMessage: {
    en: string;
    hinglish: string;
  };
  symptomsList: string[];
  riskFactorsList: string[];
  redFlagsList: string[];
  computeRisk: (profile: PatientProfile) => AssessmentResult;
  generateDoctorSummary: (profile: PatientProfile, result: AssessmentResult) => string;
}

// Active Module: Oral Cancer Screening
export const oralCancerModule: DiseaseModule = {
  id: 'oral_cancer',
  name: 'Oral Cancer Risk Screening',
  category: 'oncology',
  isActive: true,
  version: '2.0.0',
  description: 'Early oral mucosal lesion, precancerous condition, and risk factor screening engine.',
  disclaimerText: 'OralGuard AI cannot diagnose cancer. Only a qualified healthcare professional can diagnose or rule out cancer.',
  initialMessage: {
    en: "Hello 👋 I am OralGuard AI. I am here to help you with oral health awareness and preliminary oral cancer risk screening.\n\nI am not a replacement for a doctor and cannot diagnose cancer. I will help understand your symptoms and risk factors to guide whether a professional medical evaluation is advisable.\n\nPlease describe your concern in your own words. What has been bothering you?",
    hinglish: "Namaste 👋\nMain OralGuard AI hoon. Main oral health awareness aur preliminary oral-cancer risk screening mein aapki madad kar sakta hoon.\n\nMain doctor ka replacement nahi hoon aur cancer ka diagnosis nahi kar sakta. Main aapki symptoms aur risk factors ko samajhne mein help karunga aur bataunga ki professional medical evaluation ki zarurat ho sakti hai ya nahi.\n\nAap apni problem apne words mein bata sakte hain.\n\nAapko kis wajah se concern ho raha hai?",
  },
  symptomsList: [
    'persistent mouth ulcer or sore that does not heal',
    'white patch (leukoplakia)',
    'red patch (erythroplakia) or mixed red-white patch',
    'unusual thickening or lump in cheek, tongue, or gums',
    'unexplained bleeding in mouth',
    'persistent mouth pain or burning sensation',
    'numbness or loss of sensation in lip or tongue',
    'difficulty chewing, swallowing, or moving the tongue',
    'reduced mouth opening (trismus / OSMF)',
    'persistent hoarseness or sore throat',
    'unexplained neck swelling or lymph node lump',
  ],
  riskFactorsList: [
    'Smokeless tobacco (Gutka, Khaini, Zarda, Tambaku)',
    'Smoked tobacco (Bidi, Cigarettes)',
    'Areca nut / Supari / Betel quid (Paan)',
    'Alcohol consumption (especially combined with tobacco)',
    'Chronic mechanical irritation (sharp tooth, ill-fitting denture)',
    'Previous history of head/neck cancer or oral lesions',
  ],
  redFlagsList: [
    'Difficulty breathing or acute airway obstruction',
    'Rapidly worsening severe facial or neck swelling',
    'Persistent oral sore or ulcer lasting longer than 2-4 weeks without healing',
    'Persistent velvet-red mucosal patch (erythroplakia)',
    'Fixed, painless, firm neck mass or swelling',
    'Severe progressive inability to open mouth (trismus)',
  ],
  computeRisk: () => {
    // Dynamically implemented in clinicalKnowledge.ts
    throw new Error('Use computeRiskAssessment from clinicalKnowledge');
  },
  generateDoctorSummary: () => '',
};

// Architecture blueprints for future diseases (Inactive as per prompt directives)
export const futureDiseaseModules: Record<string, Partial<DiseaseModule>> = {
  diabetes: {
    id: 'diabetes',
    name: 'Type 2 Diabetes Risk Screener',
    category: 'metabolic',
    isActive: false,
    version: '0.1.0-blueprint',
    description: 'ADA / IDRS risk score screener based on age, BMI, waist circumference, physical activity, and family history.',
  },
  dengue: {
    id: 'dengue',
    name: 'Dengue Warning Sign Screener',
    category: 'infectious',
    isActive: false,
    version: '0.1.0-blueprint',
    description: 'Acute febrile illness symptom analysis with WHO warning sign triage (platelet drops, severe abdominal pain, persistent vomiting).',
  },
  tuberculosis: {
    id: 'tuberculosis',
    name: 'Pulmonary TB Triage Screener',
    category: 'infectious',
    isActive: false,
    version: '0.1.0-blueprint',
    description: 'Cough lasting >2 weeks, hemoptysis, night sweats, unexplained weight loss screening for prompt sputum testing.',
  },
  breast_cancer: {
    id: 'breast_cancer',
    name: 'Breast Health Awareness & Triage',
    category: 'oncology',
    isActive: false,
    version: '0.1.0-blueprint',
    description: 'Self-examination guideline, palpable lump, skin dimpling, nipple discharge risk triage.',
  },
};
