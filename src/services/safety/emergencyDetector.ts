/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Deterministic Emergency & Red Flag Safety Detector for OralGuard AI
 *
 * Provides non-probabilistic safety checks for life-threatening acute oral,
 * airway, and maxillofacial red flags across English, Hindi, and Marathi.
 */

import { AppLanguage } from '../../types';

export interface EmergencyCheckResult {
  isEmergency: boolean;
  reason?: string;
  urgentGuidanceText?: string;
  recommendedAction?: 'emergency_services' | 'urgent_dentist' | 'none';
}

/**
 * Keywords and phrases indicating urgent medical emergencies:
 * - Airway compromise / breathing difficulty / stridor / choking
 * - Severe swallowing obstruction (inability to swallow liquids / saliva)
 * - Rapidly progressing facial / submandibular / floor-of-mouth swelling (Ludwig's angina risk)
 * - Profuse, uncontrolled oral bleeding
 * - Acute maxillofacial trauma / fracture
 */
const EMERGENCY_PATTERNS_EN = [
  'trouble breathing',
  'difficulty breathing',
  'cannot breathe',
  'cant breathe',
  'short of breath',
  'choking',
  'stridor',
  'airway closing',
  'swelling in airway',
  'cannot swallow saliva',
  'cant swallow saliva',
  'unable to swallow water',
  'drooling saliva',
  'rapid swelling in neck',
  'rapidly spreading swelling',
  'floor of mouth swelling',
  'submandibular swelling',
  'uncontrolled bleeding',
  'gushing blood',
  'heavy bleeding in mouth',
  'bleeding non-stop',
  'broken jaw',
  'facial trauma',
];

const EMERGENCY_PATTERNS_HI = [
  'सांस नहीं आ रही',
  'सांस लेने में तकलीफ',
  'सांस फूलना',
  'दम घुट रहा',
  'गला बंद हो रहा',
  'लार नहीं निगल पा रहा',
  'थूक नहीं निगल पा रहा',
  'पानी नहीं पी पा रहा',
  'तेजी से सूजन बढ़ रही',
  'गले और चेहरे पर भारी सूजन',
  'खून नहीं रुक रहा',
  'लगातार खून बहना',
  'मुँह से भारी रक्तस्राव',
  'जबड़ा टूट गया',
  'गंभीर चोट',
];

const EMERGENCY_PATTERNS_MR = [
  'श्वास घेण्यास त्रास',
  'श्वास घेता येत नाही',
  'दम भरतोय',
  'घसा आवळल्यासारखा वाटतोय',
  'लाळ गिळता येत नाही',
  'थुंकी गिळता येत नाही',
  'पाणी पिता येत नाही',
  'मानेवर किंवा चेहऱ्यावर वेगाने सूज',
  'तीव्र रक्तस्राव',
  'रक्त थांबत नाही',
  'तोंडातील जास्त रक्तस्राव',
  'जबडा फ्रॅक्चर',
  'गंभीर दुखापत',
];

export function detectEmergencySigns(
  text: string,
  lang: AppLanguage = 'en'
): EmergencyCheckResult {
  if (!text || typeof text !== 'string') {
    return { isEmergency: false, recommendedAction: 'none' };
  }

  const lower = text.toLowerCase().trim();

  // English & transliterated roman matches
  const matchEN = EMERGENCY_PATTERNS_EN.some((p) => lower.includes(p));
  // Hindi matches
  const matchHI = EMERGENCY_PATTERNS_HI.some((p) => lower.includes(p));
  // Marathi matches
  const matchMR = EMERGENCY_PATTERNS_MR.some((p) => lower.includes(p));

  // Transliterated checks (Hinglish/Marathi in roman)
  const matchRoman =
    (lower.includes('saans') && (lower.includes('takleef') || lower.includes('nahi') || lower.includes('problem'))) ||
    (lower.includes('khoon') && (lower.includes('ruk nahi') || lower.includes('bahut'))) ||
    (lower.includes('shwas') && (lower.includes('tras') || lower.includes('ghyas'))) ||
    (lower.includes('rakt') && (lower.includes('thambat nahi') || lower.includes('khup')));

  if (matchEN || matchHI || matchMR || matchRoman) {
    let guidance = '';
    let reason = 'Acute airway, swallowing, or severe bleeding emergency indicator detected.';

    if (lang === 'hi') {
      guidance =
        '⚠️ **आपातकालीन चेतावनी**: आपने सांस लेने में रुकावट, अत्यधिक रक्तस्राव या लार निगलने में असमर्थता जैसे अति-गंभीर लक्षण बताए हैं। यह एक मेडिकल इमरजेंसी हो सकती है। कृपया तुरंत **112 / 108** डायल करें या निकटतम आपातकालीन अस्पताल (Emergency Room / ENT Specialist) में जाएं।';
      reason = 'सांस या अत्यधिक रक्तस्राव संबंधी आपातकालीन लक्षण।';
    } else if (lang === 'mr') {
      guidance =
        '⚠️ **तातडीची चेतावणी**: आपण श्वास घेण्यास अडथळा, तीव्र रक्तस्राव किंवा लाळ गिळण्यास असमर्थता यासारखी गंभीर लक्षणे नोंदवली आहेत. ही तातडीची वैद्यकीय आणीबाणी असू शकते. कृपया त्वरित **११२ / १०८** वर संपर्क साधा किंवा जवळच्या आपत्कालीन रुग्णालयात (Emergency Room) जा.';
      reason = 'श्वास किंवा तीव्र रक्तस्रावाशी संबंधित आणीबाणी लक्षण.';
    } else {
      guidance =
        '⚠️ **URGENT MEDICAL NOTICE**: You have described symptoms indicating potential airway compromise, severe swelling, or uncontrolled bleeding. This requires immediate in-person emergency evaluation. Please dial **112 / 911 / 108** or visit the nearest Hospital Emergency Department immediately.';
    }

    return {
      isEmergency: true,
      reason,
      urgentGuidanceText: guidance,
      recommendedAction: 'emergency_services',
    };
  }

  return {
    isEmergency: false,
    recommendedAction: 'none',
  };
}
