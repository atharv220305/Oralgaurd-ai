import {
  AssessmentResult,
  ClinicProvider,
  PatientProfile,
  RiskLevel,
  ScreeningConcernLevel,
  DemoTestCase,
  ScreeningEvaluationState,
  ScreeningQuestionItem,
  ScreeningQuestionKey,
} from '../types';

export const DEMO_TEST_CASES: DemoTestCase[] = [
  {
    id: 'case-natural-multi-fact-tongue-sore',
    title: 'Case 1: Multi-Fact Tongue Sore (Left Lateral Tongue, ~3 Wks, Spicy Food Pain)',
    badge: 'Multi-Fact Intake',
    category: 'Non-Repetition',
    initialMessage: "I've noticed a small sore on the left side of my tongue. It's been there for about three weeks and it hurts when I eat spicy food.",
    description: "Extracts sore, Left Lateral Tongue Border, ~3 weeks (2-4 wks), pain=YES, trigger=spicy food. Symptoms & Duration complete. The AI acknowledges the sore, location, duration, and pain without re-asking duration, directly proceeding to warning signs.",
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-a-ulcer-bidi-no-red-flags',
    title: 'Case A: Initial Natural Description (Ulcer >2 Wks, Bidi, No Bleeding/Numbness)',
    badge: 'Case A: Natural Multi-Info',
    category: 'Conversational Memory',
    initialMessage: 'I have had this mouth ulcer for 3 weeks and I smoke bidi daily. I do not have any bleeding, numbness, or neck swelling.',
    description: 'Tests conversational memory & non-repetition: Ulcer >2 weeks, bidi daily, no bleeding, no numbness, no neck lump recorded. The AI must proceed to anatomical location without re-asking duration.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-b-partial-answer-pain-bleeding',
    title: 'Case B: Partial Answer (Pain & Bleeding Only)',
    badge: 'Case B: State Integrity',
    category: 'Strict Unknown Handling',
    initialMessage: 'I have pain and bleeding from my sore.',
    description: 'Tests single source of truth: Ulcer, pain, and bleeding are set to YES. All unmentioned signs (numbness, trismus, swallowing, habits) remain UNKNOWN (undefined), never converted to NO or protective factors.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-c-explicit-negative-numbness',
    title: 'Case C: Explicit Denial (Numbness Denied Only)',
    badge: 'Case C: Targeted Denial',
    category: 'Selective Negation',
    initialMessage: "I don't have any numbness in my mouth.",
    description: 'Tests selective negative attribution: Numbness is confirmed NO. Bleeding, mouth opening, and other warning signs remain UNKNOWN unless explicitly answered.',
    expectedConcern: 'LOW SCREENING CONCERN',
  },
  {
    id: 'case-d-unknown-duration',
    title: 'Case D: Patient Uncertain / Unknown ("I don\'t know")',
    badge: 'Case D: Unknown != No',
    category: 'Uncertainty Preservation',
    initialMessage: "I have a sore inside my mouth, but I'm not sure how long it's been there, I don't know.",
    description: 'Tests that "I don\'t know" preserves UNKNOWN without defaulting duration to <2 weeks or generating false protective factors.',
    expectedConcern: 'MODERATE SCREENING CONCERN',
  },
  {
    id: 'case-e-alcohol-sometimes',
    title: 'Case E: Occasional Alcohol Intake ("Sometimes")',
    badge: 'Case E: Nuanced Habits',
    category: 'Exposure Stratification',
    initialMessage: 'I drink alcohol sometimes on weekends, and I have a white patch on my cheek.',
    description: 'Tests nuanced habit intake: "Sometimes" records moderate/occasional alcohol intake (not none), appropriately adjusting clinical findings.',
    expectedConcern: 'MODERATE SCREENING CONCERN',
  },
  {
    id: 'case-f-correction-smoking',
    title: 'Case F: Self-Correction (Replacing Previous Value)',
    badge: 'Case F: State Overwrite',
    category: 'Correction Handling',
    initialMessage: "Actually I don't smoke anymore, I stopped smoking.",
    description: 'Tests self-correction: The latest patient statement replaces the prior tobacco state with confirmed non-smoker.',
    expectedConcern: 'LOW SCREENING CONCERN',
  },
  {
    id: 'case-g-routine-screening',
    title: 'Case G: Routine Screening (True Negatives Verified)',
    badge: 'Case G: Report Alignment',
    category: 'Final Report Integrity',
    initialMessage: "Routine checkup, no oral symptoms. Never used any tobacco or areca, and I don't drink alcohol.",
    description: 'Tests final report alignment: Matches screeningSession state with zero lesions, confirmed zero tobacco, and confirmed zero alcohol.',
    expectedConcern: 'LOW SCREENING CONCERN',
  },
];

export const MOCK_CLINICS: ClinicProvider[] = [
  {
    id: 'clinic-1',
    name: 'Demo Hospital — Tata Memorial Oncology Centre (Demo)',
    specialist: 'Demo Doctor: Dr. Rajesh Sharma (Specialist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Senior Consultant Oral Oncologist (Prototype / Demo Data)',
    rating: 4.9,
    reviewsCount: 312,
    distance: '2.5 km (Simulated)',
    address: 'E Borges Road, Parel (Demo Address)',
    city: 'Mumbai',
    lat: 19.0048,
    lng: 72.8427,
    availableDates: ['Tomorrow, 10:30 AM', 'Thursday, 2:00 PM', 'Friday, 11:30 AM'],
    availableTimes: ['10:30 AM', '11:45 AM', '2:00 PM', '3:30 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-1b',
    name: 'Demo Hospital — Nair Dental College & Oral Pathology (Demo)',
    specialist: 'Demo Doctor: Dr. Meera Merchant (Specialist)',
    specialtyType: 'Dentist',
    title: 'Specialist in Mucosal Biopsy (Prototype / Demo Data)',
    rating: 4.7,
    reviewsCount: 168,
    distance: '3.8 km (Simulated)',
    address: 'Dr. AL Nair Road, Mumbai Central (Demo Address)',
    city: 'Mumbai',
    lat: 18.9723,
    lng: 72.8228,
    availableDates: ['Today, 4:00 PM', 'Tomorrow, 11:00 AM', 'Friday, 2:30 PM'],
    availableTimes: ['11:00 AM', '2:30 PM', '4:00 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-2',
    name: 'Demo Hospital — AIIMS Maxillofacial Surgery Unit (Demo)',
    specialist: 'Demo Doctor: Dr. Priya Deshmukh (Specialist)',
    specialtyType: 'Oral & Maxillofacial Surgeon',
    title: 'Facial Reconstructive Specialist (Prototype / Demo Data)',
    rating: 4.8,
    reviewsCount: 245,
    distance: '4.1 km (Simulated)',
    address: 'Ansari Nagar, Medical Enclave (Demo Address)',
    city: 'New Delhi',
    lat: 28.5672,
    lng: 77.2100,
    availableDates: ['Today, 3:30 PM', 'Tomorrow, 9:00 AM', 'Wednesday, 1:15 PM'],
    availableTimes: ['9:00 AM', '11:30 AM', '1:15 PM', '3:30 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-2b',
    name: 'Demo Hospital — Maulana Azad Dental Sciences (Demo)',
    specialist: 'Demo Doctor: Dr. Amitav Banerjee (Specialist)',
    specialtyType: 'Dentist',
    title: 'Consultant Oral Medicine (Prototype / Demo Data)',
    rating: 4.8,
    reviewsCount: 220,
    distance: '5.2 km (Simulated)',
    address: 'Bahadur Shah Zafar Marg (Demo Address)',
    city: 'New Delhi',
    lat: 28.6369,
    lng: 77.2407,
    availableDates: ['Tomorrow, 10:00 AM', 'Thursday, 12:30 PM'],
    availableTimes: ['10:00 AM', '11:30 AM', '12:30 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-3',
    name: 'Demo Hospital — Apollo Oral Health Diagnostic Hub (Demo)',
    specialist: 'Demo Doctor: Dr. Ananya Iyer (Specialist)',
    specialtyType: 'Dentist',
    title: 'Consultant Oral Medicine (Prototype / Demo Data)',
    rating: 4.7,
    reviewsCount: 180,
    distance: '1.2 km (Simulated)',
    address: 'Metro Health Pavilion, 4th Block, Koramangala (Demo Address)',
    city: 'Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    availableDates: ['Tomorrow, 11:00 AM', 'Wednesday, 4:00 PM', 'Thursday, 10:30 AM'],
    availableTimes: ['10:30 AM', '11:00 AM', '2:30 PM', '4:00 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-3b',
    name: 'Demo Hospital — Kidwai Head & Neck Oncology Centre (Demo)',
    specialist: 'Demo Doctor: Dr. Suresh Ranganathan (Specialist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Head & Neck Cancer Specialist (Prototype / Demo Data)',
    rating: 4.9,
    reviewsCount: 290,
    distance: '3.4 km (Simulated)',
    address: 'Dr. M.H. Marigowda Road (Demo Address)',
    city: 'Bengaluru',
    lat: 12.9405,
    lng: 77.5954,
    availableDates: ['Wednesday, 9:30 AM', 'Thursday, 3:00 PM'],
    availableTimes: ['9:30 AM', '11:00 AM', '2:00 PM', '3:00 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-4',
    name: 'Demo Hospital — Fortis Upper Airway & ENT Care (Demo)',
    specialist: 'Demo Doctor: Dr. Vikramaditya Sen (Specialist)',
    specialtyType: 'ENT Specialist',
    title: 'Upper Airway Diagnostics (Prototype / Demo Data)',
    rating: 4.9,
    reviewsCount: 195,
    distance: '5.6 km (Simulated)',
    address: 'Sector 44, Opposite Huda City (Demo Address)',
    city: 'Gurugram',
    lat: 28.4595,
    lng: 77.0266,
    availableDates: ['Wednesday, 10:00 AM', 'Thursday, 12:00 PM', 'Friday, 3:00 PM'],
    availableTimes: ['10:00 AM', '12:00 PM', '2:00 PM', '3:00 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-5',
    name: 'Demo Hospital — Bharati Dental Research Hospital (Demo)',
    specialist: 'Demo Doctor: Dr. Sandeep Kulkarni (Specialist)',
    specialtyType: 'Oral & Maxillofacial Surgeon',
    title: 'Oral Surgery & Biopsy Specialist (Prototype / Demo Data)',
    rating: 4.7,
    reviewsCount: 174,
    distance: '3.1 km (Simulated)',
    address: 'Pune-Satara Road, Dhankawadi (Demo Address)',
    city: 'Pune',
    lat: 18.4575,
    lng: 73.8553,
    availableDates: ['Today, 2:30 PM', 'Tomorrow, 10:00 AM'],
    availableTimes: ['10:00 AM', '11:30 AM', '2:30 PM', '4:00 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-6',
    name: 'Demo Hospital — Basavatarakam Cancer Wing (Demo)',
    specialist: 'Demo Doctor: Dr. K. Srinivas Rao (Specialist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Surgical Oncologist (Prototype / Demo Data)',
    rating: 4.8,
    reviewsCount: 260,
    distance: '4.7 km (Simulated)',
    address: 'Road No. 10, Banjara Hills (Demo Address)',
    city: 'Hyderabad',
    lat: 17.4326,
    lng: 78.4312,
    availableDates: ['Tomorrow, 11:30 AM', 'Thursday, 1:30 PM'],
    availableTimes: ['11:30 AM', '1:30 PM', '3:30 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-7',
    name: 'Demo Hospital — Adyar Oral Oncology Institute (Demo)',
    specialist: 'Demo Doctor: Dr. Radhika Sundaram (Specialist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Oral Stomatologist (Prototype / Demo Data)',
    rating: 4.9,
    reviewsCount: 340,
    distance: '3.9 km (Simulated)',
    address: 'East Canal Bank Road, Gandhi Nagar, Adyar (Demo Address)',
    city: 'Chennai',
    lat: 13.0067,
    lng: 80.2570,
    availableDates: ['Wednesday, 10:00 AM', 'Friday, 2:00 PM'],
    availableTimes: ['10:00 AM', '11:30 AM', '2:00 PM'],
    badge: 'Prototype / Demo Data',
  },
  {
    id: 'clinic-8',
    name: 'Demo Hospital — Chittaranjan Cancer Diagnostic Centre (Demo)',
    specialist: 'Demo Doctor: Dr. Subhashish Roy (Specialist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Consultant Oncosurgeon (Prototype / Demo Data)',
    rating: 4.8,
    reviewsCount: 210,
    distance: '4.4 km (Simulated)',
    address: '37 SP Mukherjee Road, Hazra (Demo Address)',
    city: 'Kolkata',
    lat: 22.5204,
    lng: 88.3533,
    availableDates: ['Tomorrow, 12:00 PM', 'Thursday, 10:30 AM'],
    availableTimes: ['10:30 AM', '12:00 PM', '2:30 PM'],
    badge: 'Prototype / Demo Data',
  },
];

/**
 * Calculates geographical distance in kilometers between two coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function normalizeApostrophes(t: string): string {
  return t.replace(/[’‘`´]/g, "'");
}

function cleanText(t: string): string {
  return normalizeApostrophes(t)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isBlanketNegative(rawText: string): boolean {
  const norm = normalizeApostrophes(rawText);
  const t = norm.toLowerCase().trim();
  const cleaned = cleanText(rawText);

  // If the text mentions any specific anatomical location, symptom, or habit words, it is NOT a blanket negative!
  const specificContentWords = [
    'bleed', 'khoon', 'blood',
    'numb', 'sunn', 'tingl',
    'opening', 'trismus', 'kholne',
    'swallow', 'nigal',
    'neck', 'gale',
    'lump', 'gath', 'ganth', 'sujan', 'swelling',
    'pain', 'dard', 'jalan', 'burn',
    'smoke', 'cigarette', 'bidi', 'beedi',
    'gutka', 'khaini', 'zarda', 'tambaku', 'tobacco',
    'areca', 'supari', 'paan', 'pan',
    'alcohol', 'sharab', 'daru', 'beer', 'wine', 'drink',
    'tongue', 'zuban', 'jeebh', 'cheek', 'gal', 'lip', 'hoth', 'gum', 'masuda', 'palate', 'talu', 'ulcer', 'sore', 'chhala', 'patch', 'white', 'red', 'safed', 'lal', 'laal'
  ];

  const hasSpecificContent = specificContentWords.some((w) => t.includes(w));
  if (hasSpecificContent) {
    return false;
  }

  // Exact or strict short general negative phrases
  return (
    t === 'no' ||
    t === 'none' ||
    t === 'nahi' ||
    t === 'nah' ||
    t === 'nope' ||
    t === 'na' ||
    t === 'never' ||
    t === 'not really' ||
    t === 'none of these' ||
    t === 'none of the above' ||
    t === 'no none of these' ||
    t === 'no none of these symptoms' ||
    t === 'none of these symptoms' ||
    t === 'aisi koi takleef nahi hai' ||
    t === 'koi takleef nahi hai' ||
    t === 'koi takleef nahi' ||
    t === 'koi dikkat nahi hai' ||
    t === 'koi dikkat nahi' ||
    t === 'kuch nahi hai' ||
    t === 'sab theek hai' ||
    t === 'bilkul nahi' ||
    cleaned === 'no' ||
    cleaned === 'none' ||
    cleaned === 'nahi' ||
    cleaned === 'no none' ||
    cleaned === 'no none of these' ||
    cleaned === 'no none of these symptoms' ||
    cleaned === 'none of these' ||
    cleaned === 'none of these symptoms' ||
    cleaned === 'bilkul nahi' ||
    cleaned === 'kuch nahi' ||
    cleaned === 'nahi aisi koi takleef nahi hai' ||
    cleaned === 'aisi koi takleef nahi hai' ||
    cleaned === 'koi takleef nahi hai' ||
    cleaned === 'koi dikkat nahi' ||
    t === 'नहीं' ||
    t === 'कोई नहीं' ||
    t === 'बिल्कुल नहीं' ||
    t === 'इनमें से कोई नहीं' ||
    t === 'सब ठीक है' ||
    t === 'कोई तकलीफ नहीं'
  );
}

function isOverallNegativeAnswer(rawText: string): boolean {
  return isBlanketNegative(rawText);
}

function detectTopicStatus(
  cleanedText: string,
  rawText: string,
  affirmativeTerms: string[],
  explicitNegationPhrases: string[] = []
): 'positive' | 'negative' | 'unknown' {
  const norm = normalizeApostrophes(rawText);
  const lower = norm.toLowerCase();

  // 1. Check explicit negative phrases first
  for (const negPhrase of explicitNegationPhrases) {
    const cleanNeg = cleanText(negPhrase);
    if (cleanedText.includes(cleanNeg) || lower.includes(negPhrase.toLowerCase()) || lower.includes(cleanNeg)) {
      return 'negative';
    }
  }

  // 2. Clause-level negation detection
  const sentences = norm.split(/[.!?;\n]/);
  const clauseNegationRegex = /\b(do not have|dont have|don't have|have no|not have|without|never|neither|no|nahi|not noticed|koi nahi|koi dard|koi chhala|koi takleef|dont drink|don't drink|do not drink|never drink|never drank|not drink|no alcohol|sharab nahi|daru nahi|abstain|zero alcohol)\b/i;

  for (const sentence of sentences) {
    const sClean = cleanText(sentence);
    const sLower = sentence.toLowerCase().trim();
    if (!sLower) continue;

    if (clauseNegationRegex.test(sClean) || clauseNegationRegex.test(sLower)) {
      for (const term of affirmativeTerms) {
        const termClean = cleanText(term);
        if (sClean.includes(termClean) || sLower.includes(term.toLowerCase())) {
          return 'negative';
        }
      }
    }
  }

  // 3. Proximity negation: check if a negation word occurs near any affirmative term within the same clause
  const negWords = [
    'no',
    'not',
    'dont',
    "don't",
    'without',
    'never',
    'neither',
    'zero',
    'nahi',
    'na',
    'kabhi nahi',
    'koi nahi',
    'koi',
    'bilkul nahi',
    'nhi',
    'none',
    'non',
  ];

  // Split into clauses to preserve sentence and coordination boundaries
  const clauses = norm.split(/[.!?;:\n]|\band\b|\baur\b/i);

  for (const clause of clauses) {
    const clauseClean = cleanText(clause);
    if (!clauseClean) continue;
    const words = clauseClean.split(' ');

    for (const term of affirmativeTerms) {
      const termClean = cleanText(term);
      const termWords = termClean.split(' ');
      if (clauseClean.includes(termClean)) {
        const termStart = words.indexOf(termWords[0]);
        if (termStart !== -1) {
          // Check within 6 words before in the same clause
          const preceding = words.slice(Math.max(0, termStart - 6), termStart);
          if (preceding.some((w) => negWords.includes(w))) {
            return 'negative';
          }
          // Check within 3 words after in the same clause (e.g. "bidi nahi", "smoke nahi")
          const following = words.slice(
            termStart + termWords.length,
            termStart + termWords.length + 3
          );
          if (following.some((w) => negWords.includes(w))) {
            return 'negative';
          }
        }
      }
    }
  }

  // 4. If no negation was found, check for affirmative terms
  for (const term of affirmativeTerms) {
    if (cleanedText.includes(cleanText(term)) || lower.includes(term.toLowerCase())) {
      return 'positive';
    }
  }

  return 'unknown';
}

/**
 * Natural language duration extraction with support for words, digits, and approximate phrasing.
 * Example inputs handled:
 * - "about three weeks", "three weeks", "for 3 weeks", "around two weeks", "3 hafte"
 * - "for about a month", "around a month", "over a month", "more than 2 weeks"
 * - "a couple of days", "few days", "10 days", "5 din", "yesterday"
 * - "don't know", "not sure", "pata nahi"
 */
export function extractDurationDetails(text: string, lower: string): {
  duration: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  durationCategory: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  durationOverTwoWeeks?: boolean;
  durationText: string;
  isUnknown?: boolean;
} | null {
  // Check unknown / uncertain first
  if (
    lower.includes("not sure") ||
    lower.includes("don't know") ||
    lower.includes("dont know") ||
    lower.includes("can't remember") ||
    lower.includes("cant remember") ||
    lower.includes("pata nahi") ||
    lower.includes("yaad nahi") ||
    lower.includes("theek se yaad nahi") ||
    lower.includes("याद नहीं") ||
    lower.includes("पता नहीं")
  ) {
    return {
      duration: 'unknown',
      durationCategory: 'unknown',
      durationOverTwoWeeks: undefined,
      durationText: 'uncertain / not sure',
      isUnknown: true,
    };
  }

  const numberWordMap: Record<string, number> = {
    a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, twenty: 20, thirty: 30,
    ek: 1, do: 2, teen: 3, tin: 3, chaar: 4, char: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, che: 6,
    saat: 7, sat: 7, aath: 8, ath: 8, nau: 9, das: 10, pandrah: 15, bees: 20, tees: 30,
    'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
    'पंद्रह': 15, 'बीस': 20, 'तीस': 30,
  };

  // Match weeks: e.g. "about three weeks", "for about 3 weeks", "3 hafte", "two weeks", "teen hafte"
  const weekRegex = /(?:for\s+about|for\s+around|about|around|approx|approximately|roughly|nearly|almost|for|since|lagbhag|karib|kariban|andazan)?\s*(\d+|a\s*few|few|several|a\s*couple\s*of|couple\s*of|a\s*couple|couple|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fourteen|fifteen|twenty|ek|do|teen|tin|chaar|char|paanch|panch|chhe|saat|aath|das|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|दस)\s*(weeks|week|hafte|hafate|hafton|saptah|wk|wks|हफ्ते|हफ़्ते|सप्ताह)/i;
  const weekMatch = lower.match(weekRegex);

  if (weekMatch) {
    const rawNum = weekMatch[1].trim().toLowerCase();
    const isApprox = /about|around|approx|roughly|nearly|almost|lagbhag|karib/i.test(weekMatch[0]);

    if (rawNum === 'a few' || rawNum === 'few' || rawNum === 'several') {
      return {
        duration: 'two_to_four_weeks',
        durationCategory: 'two_to_four_weeks',
        durationOverTwoWeeks: true,
        durationText: 'for a few weeks',
      };
    }
    if (rawNum.includes('couple')) {
      return {
        duration: 'two_to_four_weeks',
        durationCategory: 'two_to_four_weeks',
        durationOverTwoWeeks: true,
        durationText: isApprox ? 'approximately 2 weeks' : 'about 2 weeks',
      };
    }

    const numVal = numberWordMap[rawNum] !== undefined ? numberWordMap[rawNum] : parseInt(rawNum, 10);
    if (!isNaN(numVal)) {
      if (numVal < 2) {
        return {
          duration: 'less_than_2_weeks',
          durationCategory: 'less_than_2_weeks',
          durationOverTwoWeeks: false,
          durationText: isApprox ? `approximately ${numVal} week` : `${numVal} week`,
        };
      } else if (numVal <= 4) {
        return {
          duration: 'two_to_four_weeks',
          durationCategory: 'two_to_four_weeks',
          durationOverTwoWeeks: true,
          durationText: isApprox ? `about ${numVal} weeks` : `${numVal} weeks`,
        };
      } else {
        return {
          duration: 'more_than_one_month',
          durationCategory: 'more_than_one_month',
          durationOverTwoWeeks: true,
          durationText: isApprox ? `about ${numVal} weeks` : `${numVal} weeks`,
        };
      }
    }
  }

  // Match months: e.g. "about a month", "around a month", "2 months", "1 mahina", "ek mahine"
  const monthRegex = /(?:for\s+about|for\s+around|about|around|approx|approximately|roughly|nearly|almost|for|since|over|more\s*than|lagbhag|karib|kariban|andazan)?\s*(\d+|a|an|one|two|three|four|five|six|several|a\s*few|few|couple|ek|do|teen|char|एक|दो|तीन|चार)?\s*(months|month|mahina|mahine|mahino|महीने|महीना|साल|year|years)/i;
  const monthMatch = lower.match(monthRegex);

  if (monthMatch && (monthMatch[1] || monthMatch[0].includes('month') || monthMatch[0].includes('mahine') || monthMatch[0].includes('महीने') || monthMatch[0].includes('year') || monthMatch[0].includes('साल'))) {
    const rawNum = (monthMatch[1] || '1').trim().toLowerCase();
    const isApprox = /about|around|approx|roughly|nearly|almost|lagbhag|karib/i.test(monthMatch[0]);
    const numVal = numberWordMap[rawNum] !== undefined ? numberWordMap[rawNum] : parseInt(rawNum, 10);

    return {
      duration: 'more_than_one_month',
      durationCategory: 'more_than_one_month',
      durationOverTwoWeeks: true,
      durationText: isApprox
        ? `approximately ${isNaN(numVal) ? 1 : numVal} month${numVal > 1 ? 's' : ''}`
        : `${isNaN(numVal) ? 1 : numVal} month${numVal > 1 ? 's' : ''}`,
    };
  }

  // Match days: e.g. "about 10 days", "for 3 days", "5 din", "do teen din"
  const dayRegex = /(?:for\s+about|for\s+around|about|around|approx|approximately|roughly|nearly|almost|for|since|lagbhag|karib)?\s*(\d+|a\s*few|few|several|a\s*couple|couple|one|two|three|four|five|six|seven|eight|ten|twelve|fourteen|fifteen|twenty|ek|do|teen|char|panch|ek-do|do-teen|एक|दो|तीन|चार|पांच)\s*(days|day|din|दिन)/i;
  const dayMatch = lower.match(dayRegex);

  if (dayMatch) {
    const rawNum = dayMatch[1].trim().toLowerCase();
    const isApprox = /about|around|approx|roughly|nearly|almost|lagbhag|karib/i.test(dayMatch[0]);
    const numVal = numberWordMap[rawNum] !== undefined ? numberWordMap[rawNum] : parseInt(rawNum, 10);

    if (!isNaN(numVal)) {
      if (numVal < 14) {
        return {
          duration: 'less_than_2_weeks',
          durationCategory: 'less_than_2_weeks',
          durationOverTwoWeeks: false,
          durationText: isApprox ? `approximately ${numVal} days` : `${numVal} days`,
        };
      } else if (numVal <= 30) {
        return {
          duration: 'two_to_four_weeks',
          durationCategory: 'two_to_four_weeks',
          durationOverTwoWeeks: true,
          durationText: isApprox ? `about ${numVal} days` : `${numVal} days`,
        };
      } else {
        return {
          duration: 'more_than_one_month',
          durationCategory: 'more_than_one_month',
          durationOverTwoWeeks: true,
          durationText: isApprox ? `about ${numVal} days` : `${numVal} days`,
        };
      }
    }
  }

  // Specific semantic phrases
  if (
    lower.includes('more than 2 weeks') ||
    lower.includes('more than two weeks') ||
    lower.includes('over 2 weeks') ||
    lower.includes('over two weeks') ||
    lower.includes('longer than 2 weeks') ||
    lower.includes('2 hafton se zyada') ||
    lower.includes('do hafte se zyada') ||
    lower.includes('दो हफ्ते से ज्यादा') ||
    lower.includes('persistent') ||
    lower.includes('not healing') ||
    lower.includes('theek nahi ho raha')
  ) {
    return {
      duration: 'two_to_four_weeks',
      durationCategory: 'two_to_four_weeks',
      durationOverTwoWeeks: true,
      durationText: 'more than 2 weeks',
    };
  }

  if (
    lower.includes('less than 2 weeks') ||
    lower.includes('less than two weeks') ||
    lower.includes('under 2 weeks') ||
    lower.includes('under two weeks') ||
    lower.includes('few days') ||
    lower.includes('just a few days') ||
    lower.includes('kuch din') ||
    lower.includes('yesterday') ||
    lower.includes('kal se') ||
    lower.includes('recently') ||
    lower.includes('just started') ||
    lower.includes('कुछ दिन') ||
    lower.includes('कल से')
  ) {
    return {
      duration: 'less_than_2_weeks',
      durationCategory: 'less_than_2_weeks',
      durationOverTwoWeeks: false,
      durationText: 'less than 2 weeks',
    };
  }

  return null;
}

/**
 * Intelligent multilingual extractor supporting English, Hindi (Latin & Devanagari), and Hinglish.
 * STRICT CLINICAL EVIDENCE RULE:
 * - Findings are ONLY marked positive if the user explicitly stated or confirmed them.
 * - Negative inputs ('no', 'none', 'nahi', 'not noticed', 'no bleeding', 'no numbness')
 *   MUST be explicitly stored as false / 'none'.
 * - NEVER infer positive findings from questions asked by the assistant.
 */
export function extractPatientProfileFromText(
  text: string,
  existingProfile: PatientProfile,
  lastAssistantMessage?: string
): PatientProfile {
  const lower = text.toLowerCase().trim();
  const cleaned = cleanText(text);
  const next: PatientProfile = { ...existingProfile };

  // Track raw user reported facts
  const userReportedFacts = next.userReportedFacts ? [...next.userReportedFacts] : [];
  if (text.trim() && !userReportedFacts.includes(text.trim())) {
    userReportedFacts.push(text.trim());
  }
  next.userReportedFacts = userReportedFacts;

  // Context from immediately preceding assistant message
  // (USED ONLY to identify context of negative, unknown, or short replies - NEVER to infer positive findings!)
  const lastQ = (lastAssistantMessage || '').toLowerCase();
  const isAboutDuration =
    lastQ.includes('kitne samay') ||
    lastQ.includes('how long') ||
    lastQ.includes('duration') ||
    lastQ.includes('hafte') ||
    lastQ.includes('weeks') ||
    lastQ.includes('mahine') ||
    lastQ.includes('month');

  const isAboutBleeding =
    lastQ.includes('bleeding') ||
    lastQ.includes('khoon') ||
    lastQ.includes('blood');

  const isAboutMouthOpening =
    lastQ.includes('opening') ||
    lastQ.includes('kholne') ||
    lastQ.includes('khulta') ||
    lastQ.includes('trismus');

  const isAboutNumbness =
    lastQ.includes('numbness') ||
    lastQ.includes('sunnpan') ||
    lastQ.includes('sunn');

  const isAboutSwallowing =
    lastQ.includes('swallow') ||
    lastQ.includes('nigal') ||
    lastQ.includes('throat');

  const isAboutTobacco =
    lastQ.includes('gutka') ||
    lastQ.includes('khaini') ||
    lastQ.includes('tambaku') ||
    lastQ.includes('tobacco') ||
    lastQ.includes('bidi') ||
    lastQ.includes('cigarette') ||
    lastQ.includes('supari') ||
    lastQ.includes('habits');

  const isAboutAlcohol =
    lastQ.includes('alcohol') ||
    lastQ.includes('sharab') ||
    lastQ.includes('daru') ||
    lastQ.includes('drink');

  const isAboutSharpTooth =
    lastQ.includes('sharp tooth') ||
    lastQ.includes('teekha daant') ||
    lastQ.includes('denture') ||
    lastQ.includes('ragad');

  const isAboutNeckLump =
    lastQ.includes('neck') ||
    lastQ.includes('gale') ||
    lastQ.includes('lump') ||
    lastQ.includes('gath') ||
    lastQ.includes('sujan');

  const isAboutProgression =
    lastQ.includes('healing') ||
    lastQ.includes('theek ho raha') ||
    lastQ.includes('badh raha') ||
    lastQ.includes('unchanged') ||
    lastQ.includes('worsening');

  const isGeneralNegative = isOverallNegativeAnswer(text);

  const isUnknown =
    lower.includes("don't know") ||
    lower.includes('dont know') ||
    lower.includes('not sure') ||
    lower.includes('pata nahi') ||
    lower.includes('yaad nahi') ||
    lower.includes('maloom nahi') ||
    lower.includes("can't remember") ||
    lower.includes('cant remember') ||
    lower.includes('पता नहीं') ||
    lower.includes('याद नहीं');

  // Detect self-corrections (e.g., "Actually, I smoke occasionally", "Actually I don't drink", "Wait, no pain", "Correction: it is on right side")
  const isCorrection =
    lower.startsWith('actually') ||
    lower.startsWith('wait') ||
    lower.startsWith('correction') ||
    lower.startsWith('sorry') ||
    lower.startsWith('in fact') ||
    lower.includes('actually') ||
    lower.includes('pehle galat') ||
    lower.includes('galti se') ||
    lower.includes('nahi balki') ||
    lower.includes('i meant') ||
    lower.includes('to be honest');

  // Handle explicit self-corrections for habits & symptoms immediately
  if (isCorrection) {
    if (lower.includes('smoke') || lower.includes('cigarette') || lower.includes('bidi') || lower.includes('beedi') || lower.includes('सिगरेट') || lower.includes('बीड़ी')) {
      if (lower.includes('no') || lower.includes('never') || lower.includes("don't") || lower.includes('nahi') || lower.includes('zero') || lower.includes('chhod di')) {
        next.tobaccoSmoked = 'none';
        next.tobaccoFrequency = 'none';
      } else {
        next.tobaccoSmoked = lower.includes('bidi') || lower.includes('beedi') || lower.includes('बीड़ी') ? 'bidi' : 'cigarettes';
        if (lower.includes('occasion') || lower.includes('social') || lower.includes('sometimes') || lower.includes('kabhi') || lower.includes('rare')) {
          next.tobaccoFrequency = 'occasional';
        }
      }
    }
    if (lower.includes('gutka') || lower.includes('khaini') || lower.includes('tambaku') || lower.includes('zarda') || lower.includes('गुटखा') || lower.includes('तंबाकू')) {
      if (lower.includes('no') || lower.includes('never') || lower.includes("don't") || lower.includes('nahi') || lower.includes('zero')) {
        next.tobaccoSmokeless = 'none';
      } else {
        next.tobaccoSmokeless = lower.includes('khaini') ? 'khaini' : lower.includes('zarda') ? 'zarda' : 'gutka';
      }
    }
    if (lower.includes('alcohol') || lower.includes('sharab') || lower.includes('daru') || lower.includes('drink') || lower.includes('beer') || lower.includes('शराब') || lower.includes('दारू')) {
      if (lower.includes('no') || lower.includes('never') || lower.includes("don't") || lower.includes('nahi') || lower.includes('zero')) {
        next.alcoholIntake = 'none';
      } else if (lower.includes('occasion') || lower.includes('social') || lower.includes('sometimes') || lower.includes('kabhi') || lower.includes('rare') || lower.includes('weekend')) {
        next.alcoholIntake = 'moderate';
      } else {
        next.alcoholIntake = 'heavy';
      }
    }
    if (lower.includes('pain') || lower.includes('dard') || lower.includes('burning') || lower.includes('jalan')) {
      if (lower.includes('no') || lower.includes('nahi') || lower.includes('zero') || lower.includes('without')) {
        next.mouthPainOrBurning = false;
      }
    }
  }

  // 0. CONTEXTUAL RESOLUTION OF SHORT / NEGATIVE REPLIES TO ASSISTANT QUESTIONS
  if (isUnknown) {
    if (isAboutDuration) {
      next.duration = 'unknown';
      next.durationOverTwoWeeks = undefined; // Strict unknown: NEVER set to false!
      next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Symptom Duration / Chronicity']));
    }
    // Strict requirement: UNKNOWN must remain undefined for unconfirmed findings.
    // NEVER convert unmentioned or unknown symptoms into false (NO) or protective factors.
  } else if (isGeneralNegative && !isCorrection) {
    // Blanket negative response (e.g. "No", "None of these") directly answering a specific category question:
    if (isAboutBleeding && isAboutNumbness) {
      next.unexplainedBleeding = false;
      next.reducedMouthOpening = false;
      next.numbnessInMouth = false;
      next.difficultySwallowing = false;
      next.neckLumpOrSwelling = false;
    } else if (isAboutBleeding) {
      next.unexplainedBleeding = false;
    } else if (isAboutNumbness) {
      next.numbnessInMouth = false;
    } else if (isAboutMouthOpening) {
      next.reducedMouthOpening = false;
    } else if (isAboutSwallowing) {
      next.difficultySwallowing = false;
    } else if (isAboutNeckLump) {
      next.neckLumpOrSwelling = false;
    }

    if (isAboutSharpTooth) next.chronicIrritation = false;
    if (isAboutProgression) next.progression = 'unchanged';

    if (isAboutTobacco && !isAboutAlcohol) {
      next.tobaccoSmokeless = 'none';
      next.tobaccoSmoked = 'none';
      next.arecaOrBetelNut = 'none';
      next.tobaccoFrequency = 'none';
    }
    if (isAboutAlcohol) {
      next.alcoholIntake = 'none';
      next.alcoholUse = 'none';
    }
  }

  // Language Persistence: Once selected or locked, NEVER switch or overwrite!
  if (existingProfile.detectedLanguage) {
    next.detectedLanguage = existingProfile.detectedLanguage;
  } else if (/[\u0900-\u097F]/.test(text)) {
    next.detectedLanguage = 'hi';
  } else if (
    lower.includes('hai') ||
    lower.includes('hoon') ||
    lower.includes('mein') ||
    lower.includes('mera') ||
    lower.includes('mujhe') ||
    lower.includes('kaafi') ||
    lower.includes('sujan') ||
    lower.includes('saas') ||
    lower.includes('khata') ||
    lower.includes('dard')
  ) {
    next.detectedLanguage = 'hinglish';
  } else {
    next.detectedLanguage = 'en';
  }

  // Preserve initial concern description
  if (!next.mainConcern && text.length > 5) {
    next.mainConcern = text;
  }

  // 1. EMERGENCY RED FLAGS (Airway obstruction, acute massive swelling, severe choking)
  if (
    lower.includes('saas lene me dikkat') ||
    lower.includes('saans lene me') ||
    lower.includes('saas lene') ||
    lower.includes('saans lene') ||
    lower.includes('sans lene') ||
    lower.includes('saas') ||
    lower.includes('saans') ||
    lower.includes('breathing difficulty') ||
    lower.includes('choking') ||
    lower.includes('airway') ||
    lower.includes('सांस लेने में') ||
    lower.includes('सांस') ||
    ((lower.includes('tez sujan') || lower.includes('severe swelling')) && (lower.includes('gala') || lower.includes('gale') || lower.includes('throat') || lower.includes('neck')))
  ) {
    next.emergencyFlagTriggered = true;
    next.emergencyReason = 'Acute breathing or rapid airway swelling reported';
  }

  // 2. SORES / ULCERS / LESIONS
  const soreStatus = detectTopicStatus(
    cleaned,
    text,
    ['chhala', 'chhale', 'ulcer', 'sore', 'wound', 'ghav', 'blister', 'canker', 'छाला', 'छाले', 'अल्सर', 'घाव'],
    [
      'no sore',
      'no ulcer',
      'no mouth ulcer',
      'koi chhala nahi',
      'chhala nahi hai',
      'chhala nahi',
      'ulcer nahi hai',
      'ulcer nahi',
      'chhala ya ulcer nahi',
      'koi dard chhala ya ulcer nahi',
      'no symptoms',
      'healthy',
      'sab theek hai',
      'koi takleef nahi',
      'कोई छाला नहीं',
      'छाला नहीं',
      'अल्सर नहीं'
    ]
  );
  if (soreStatus === 'negative') {
    next.hasLesionOrUlcer = false;
  } else if (soreStatus === 'positive') {
    next.hasLesionOrUlcer = true;
    next.ulcerDetails = text;
  }

  // 3. DURATION (Evaluate lesion duration only if user reported a lesion or symptom)
  const isHabitDurationOnly =
    (lower.includes('saal se') || lower.includes('saal tak') || lower.includes('years of') || lower.includes('years')) &&
    (lower.includes('gutka') || lower.includes('khaini') || lower.includes('bidi') || lower.includes('smoke') || lower.includes('smoking')) &&
    !lower.includes('sore') && !lower.includes('ulcer') && !lower.includes('chhala') && !lower.includes('patch');

  if (next.hasLesionOrUlcer !== false && !isHabitDurationOnly) {
    const durDetails = extractDurationDetails(text, lower);
    if (durDetails) {
      next.duration = durDetails.duration;
      next.durationCategory = durDetails.durationCategory;
      next.durationOverTwoWeeks = durDetails.durationOverTwoWeeks;
      next.durationText = durDetails.durationText;
      if (durDetails.isUnknown) {
        next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Symptom Duration / Chronicity']));
      }
    }
  }

  // 4. COLOR / APPEARANCE
  if (
    (lower.includes('red') && lower.includes('white')) ||
    (lower.includes('lal') && lower.includes('safed')) ||
    (lower.includes('laal') && lower.includes('safed')) ||
    (lower.includes('लाल') && lower.includes('सफेद'))
  ) {
    next.colorChanges = 'mixed';
  } else if (
    lower.includes('white') ||
    lower.includes('safed') ||
    lower.includes('leukoplak') ||
    lower.includes('pale patch') ||
    lower.includes('सफेद')
  ) {
    next.colorChanges = 'white';
  } else if (
    lower.includes('red') ||
    lower.includes('lal') ||
    lower.includes('laal') ||
    lower.includes('erythro') ||
    lower.includes('लाल')
  ) {
    next.colorChanges = 'red';
  }

  // 5. THICKENING / LUMP / NECK MASS
  const neckLumpStatus = detectTopicStatus(
    cleaned,
    text,
    [
      'neck lump',
      'swollen neck',
      'neck swelling',
      'gale mein gath',
      'gale me gath',
      'firm swelling in neck',
      'node in neck',
      'swelling under jaw',
    ],
    [
      'no neck lump',
      'no neck swelling',
      'gale me koi gath nahi',
      'gale me sujan nahi',
      'gala bilkul normal',
      'no swelling in neck',
      'without neck swelling',
    ]
  );
  if (neckLumpStatus === 'negative') {
    next.neckLumpOrSwelling = false;
  } else if (neckLumpStatus === 'positive' && !isGeneralNegative) {
    next.neckLumpOrSwelling = true;
  }

  const oralLumpStatus = detectTopicStatus(
    cleaned,
    text,
    ['lump', 'thickening', 'gath', 'ganth', 'sujan', 'swelling', 'bump', 'गांठ', 'सूजन', 'गिल्टी'],
    ['no lump', 'no thickening', 'no swelling', 'koi gath nahi', 'koi sujan nahi']
  );
  if (oralLumpStatus === 'negative') {
    next.thickeningOrLump = false;
  } else if (oralLumpStatus === 'positive' && !isGeneralNegative && !lower.includes('neck') && !lower.includes('gale')) {
    next.thickeningOrLump = true;
  }

  // 6. SWALLOWING & MOUTH OPENING (TRISMUS / OSMF)
  const swallowingStatus = detectTopicStatus(
    cleaned,
    text,
    [
      'difficulty swallowing',
      'pain swallowing',
      'nigalne me takleef',
      'nigalne me dikkat',
      'thook nigalne',
      'nigalne',
      'food gets stuck',
      'throat pain',
      'swallow',
      'swallowing',
      'निगलने'
    ],
    ['no difficulty swallowing', 'swallow normally', 'nigalne me koi dikkat nahi', 'normal swallowing']
  );
  if (swallowingStatus === 'negative') {
    next.difficultySwallowing = false;
  } else if (swallowingStatus === 'positive') {
    next.difficultySwallowing = true;
  }

  const mouthOpeningStatus = detectTopicStatus(
    cleaned,
    text,
    [
      'difficulty opening mouth',
      'muh kholne mein dikkat',
      'mouth opening',
      'trismus',
      'muh kam khulta',
      'can not open mouth',
      'cannot open mouth',
      'jaw tightness',
      'restricted mouth opening',
      'मुंह कम खुलता',
      'मुंह खुलने में',
    ],
    [
      'normal mouth opening',
      'normal khulta hai',
      'opens normally',
      'muh pura khulta',
      'kholne me koi dikkat nahi',
      'no difficulty opening mouth',
      'no trismus',
      'muh pura khulta hai',
    ]
  );
  if (mouthOpeningStatus === 'negative') {
    next.reducedMouthOpening = false;
  } else if (mouthOpeningStatus === 'positive') {
    next.reducedMouthOpening = true;
  }

  if (lower.includes('chabane') || lower.includes('chewing')) {
    next.difficultyChewing = true;
  }
  if (lower.includes('zuban') || lower.includes('tongue') || lower.includes('speaking') || lower.includes('जीभ')) {
    if (lower.includes('dikkat') || lower.includes('pain') || lower.includes('difficulty') || lower.includes('move')) {
      next.difficultySpeakingOrMovingTongue = true;
    }
  }

  // 7. SENSATION / PAIN / BLEEDING / NUMBNESS (STRICT NEGATIVE-FIRST)
  if (
    lower.includes('dard') ||
    lower.includes('pain') ||
    lower.includes('burning') ||
    lower.includes('jalan') ||
    lower.includes('hurt') ||
    lower.includes('hurts') ||
    lower.includes('hurting') ||
    lower.includes('painful') ||
    lower.includes('spicy') ||
    lower.includes('teekha') ||
    lower.includes('mirchi') ||
    lower.includes('तीखा') ||
    lower.includes('मिर्ची') ||
    lower.includes('दर्द') ||
    lower.includes('जलन')
  ) {
    if (
      !lower.includes('no pain') &&
      !lower.includes('dard nahi') &&
      !lower.includes('no burning') &&
      !lower.includes('jalan nahi') &&
      !lower.includes("doesn't hurt") &&
      !lower.includes("doesnt hurt") &&
      !lower.includes('no hurting') &&
      !lower.includes('dard ya jalan nahi')
    ) {
      next.mouthPainOrBurning = true;
      next.pain = true;
    } else {
      next.mouthPainOrBurning = false;
      next.pain = false;
    }
  }

  // Symptom trigger context (e.g. spicy food, chewing)
  if (
    lower.includes('spicy') ||
    lower.includes('teekha') ||
    lower.includes('mirchi') ||
    lower.includes('तीखा') ||
    lower.includes('मिर्ची')
  ) {
    next.symptomTrigger = 'spicy food';
  } else if (lower.includes('eating') || lower.includes('khate') || lower.includes('khane')) {
    next.symptomTrigger = 'eating / chewing';
  } else if (lower.includes('hot') || lower.includes('garam')) {
    next.symptomTrigger = 'hot food / beverages';
  }

  // EXPLICIT BLEEDING: Checked with explicit negatives first!
  const bleedingStatus = detectTopicStatus(
    cleaned,
    text,
    ['bleeding', 'khoon', 'blood', 'खून', 'bleeding noticed', 'khoon aana', 'bleeding ya sunnpan'],
    [
      'no bleeding',
      'khoon nahi',
      'bleeding nahi',
      'without bleeding',
      'never bled',
      'koi khoon nahi',
      'neither bleeding nor numbness',
      'not noticed any bleeding',
      'no blood',
      'no, none of these symptoms',
      'none of these symptoms',
      'none of these',
      'no none of these',
    ]
  );
  if (bleedingStatus === 'negative') {
    next.unexplainedBleeding = false;
  } else if (bleedingStatus === 'positive') {
    next.unexplainedBleeding = true;
  }

  // EXPLICIT NUMBNESS: Checked with explicit negatives first!
  const numbnessStatus = detectTopicStatus(
    cleaned,
    text,
    ['numbness', 'numb', 'sunn', 'sunnpan', 'tingling', 'सुन्न', 'loss of sensation', 'numbness feel'],
    [
      'no numbness',
      'sunnpan nahi',
      'sunn nahi',
      'without numbness',
      'never numb',
      'koi sunnpan nahi',
      'neither bleeding nor numbness',
      'not noticed any numbness',
      'no tingling',
      'no, none of these symptoms',
      'none of these symptoms',
      'none of these',
      'no none of these',
    ]
  );
  if (numbnessStatus === 'negative') {
    next.numbnessInMouth = false;
  } else if (numbnessStatus === 'positive') {
    next.numbnessInMouth = true;
  }

  if (lower.includes('hoarse') || lower.includes('awaz') || lower.includes('voice change')) {
    next.persistentHoarseness = true;
  }

  // 8. TOBACCO & ARECA PRODUCTS (STRICT NEGATIVE-FIRST)
  const normLower = normalizeApostrophes(lower);
  const explicitTobaccoNegation =
    normLower.includes('never smoke') ||
    normLower.includes('no tobacco') ||
    normLower.includes('tambaku nahi') ||
    normLower.includes('non-smoker') ||
    normLower.includes('non smoker') ||
    normLower.includes('gutka nahi') ||
    normLower.includes("don't smoke") ||
    normLower.includes("dont smoke") ||
    normLower.includes('never used tobacco') ||
    normLower.includes('never used any tobacco') ||
    normLower.includes('never used any tobacco or areca') ||
    normLower.includes('never used tobacco or areca') ||
    normLower.includes('never use tobacco') ||
    normLower.includes('never chew') ||
    normLower.includes('kabhi koi tambaku use nahi kiya') ||
    normLower.includes('kabhi koi tambaku nahi') ||
    normLower.includes('kabhi tambaku nahi') ||
    normLower.includes('kabhi gutka nahi') ||
    normLower.includes('तंबाकू नहीं') ||
    normLower.includes('गुटखा नहीं');

  const generalTobaccoNegation = explicitTobaccoNegation || (isGeneralNegative && isAboutTobacco);

  if (generalTobaccoNegation) {
    next.tobaccoSmoked = 'none';
    next.tobaccoSmokeless = 'none';
    next.arecaOrBetelNut = 'none';
    next.tobaccoFrequency = 'none';
  } else {
    // Smokeless tobacco (gutka / khaini / zarda)
    const smokelessStatus = detectTopicStatus(
      cleaned,
      text,
      ['gutka', 'gutkha', 'khaini', 'zarda', 'tambaku', 'chewing tobacco', 'गुटखा', 'खैनी', 'जर्दा', 'तंबाकू', 'तम्बाकू'],
      ['no gutka', 'gutka nahi', 'khaini nahi', 'no smokeless tobacco']
    );
    if (smokelessStatus === 'negative') {
      next.tobaccoSmokeless = 'none';
    } else if (smokelessStatus === 'positive') {
      if (lower.includes('khaini') || lower.includes('खैनी')) next.tobaccoSmokeless = 'khaini';
      else if (lower.includes('zarda') || lower.includes('जर्दा')) next.tobaccoSmokeless = 'zarda';
      else next.tobaccoSmokeless = 'gutka';

      if (lower.includes('daily') || lower.includes('roz') || lower.includes('रोज') || lower.includes('रोजाना')) {
        next.tobaccoFrequency = 'daily';
      }

      // If user specifically picked smokeless option from habits query, mark smoked as none if not specified
      if (isAboutTobacco && next.tobaccoSmoked === undefined) {
        next.tobaccoSmoked = 'none';
      }
      if (isAboutTobacco && next.arecaOrBetelNut === undefined) {
        next.arecaOrBetelNut = 'none';
      }
    }

    // Areca / Supari / Pan Masala
    const arecaStatus = detectTopicStatus(
      cleaned,
      text,
      ['supari', 'areca', 'betel', 'paan', 'pan masala', 'सुपारी', 'पान', 'पान मसाला'],
      ['no supari', 'supari nahi', 'no paan', 'paan nahi', 'no betel']
    );
    if (arecaStatus === 'negative') {
      next.arecaOrBetelNut = 'none';
    } else if (arecaStatus === 'positive') {
      if (lower.includes('supari') || lower.includes('सुपारी')) next.arecaOrBetelNut = 'supari';
      else if (lower.includes('paan') || lower.includes('पान')) next.arecaOrBetelNut = 'betel_quid';
      else next.arecaOrBetelNut = 'pan_masala';

      if (isAboutTobacco && next.tobaccoSmokeless === undefined) {
        next.tobaccoSmokeless = 'none';
      }
      if (isAboutTobacco && next.tobaccoSmoked === undefined) {
        next.tobaccoSmoked = 'none';
      }
    }

    // Smoked tobacco (bidi / cigarettes)
    const smokedStatus = detectTopicStatus(
      cleaned,
      text,
      ['bidi', 'beedi', 'cigarette', 'smoke', 'smoking', 'sigret', 'बीड़ी', 'सिगरेट'],
      ['never smoke', "don't smoke", 'dont smoke', 'no smoking', 'bidi nahi', 'no cigarette', 'non-smoker']
    );
    if (smokedStatus === 'negative') {
      next.tobaccoSmoked = 'none';
    } else if (smokedStatus === 'positive') {
      if (lower.includes('bidi') || lower.includes('beedi') || lower.includes('बीड़ी')) {
        next.tobaccoSmoked = 'bidi';
      } else {
        next.tobaccoSmoked = 'cigarettes';
      }

      if (isAboutTobacco && next.tobaccoSmokeless === undefined) {
        next.tobaccoSmokeless = 'none';
      }
      if (isAboutTobacco && next.arecaOrBetelNut === undefined) {
        next.arecaOrBetelNut = 'none';
      }
    }
  }

  // 9. ALCOHOL (STRICT NEGATIVE-FIRST & VALIDATED OPTION MATCHING)
  const hasAlcoholMention =
    normLower.includes('alcohol') ||
    normLower.includes('sharab') ||
    normLower.includes('daru') ||
    normLower.includes('drink') ||
    normLower.includes('drank') ||
    normLower.includes('beer') ||
    normLower.includes('wine') ||
    normLower.includes('whisky') ||
    normLower.includes('liquor') ||
    normLower.includes('शराब') ||
    normLower.includes('दारू') ||
    isAboutAlcohol;

  const isOccasionalAlcohol =
    normLower.includes('sometimes') ||
    normLower.includes('occasion') ||
    normLower.includes('social') ||
    normLower.includes('weekend') ||
    normLower.includes('rare') ||
    normLower.includes('kabhi-kabhi') ||
    normLower.includes('kabhi kabhi') ||
    normLower.includes('कभी-कभार') ||
    normLower.includes('कभी कभी');

  const isHeavyAlcohol =
    normLower.includes('regular') ||
    normLower.includes('frequent') ||
    normLower.includes('daily') ||
    normLower.includes('heavy') ||
    normLower.includes('roz') ||
    normLower.includes('रोज') ||
    normLower.includes('रोजाना');

  const explicitAlcoholNegation =
    normLower.includes('no alcohol') ||
    normLower.includes("don't drink") ||
    normLower.includes("dont drink") ||
    normLower.includes('do not drink') ||
    normLower.includes('never drink') ||
    normLower.includes('never drank') ||
    normLower.includes('not drink') ||
    normLower.includes('never drink alcohol') ||
    normLower.includes('daru nahi') ||
    normLower.includes('sharab nahi') ||
    normLower.includes('kabhi alcohol nahi') ||
    normLower.includes('kabhi sharab nahi') ||
    normLower.includes('kabhi daru nahi') ||
    normLower.includes('zero alcohol') ||
    normLower.includes('non drinker') ||
    normLower.includes('non-drinker') ||
    normLower.includes('nondrinker') ||
    normLower.includes('teetotal') ||
    normLower.includes('abstain') ||
    normLower.includes('शराब नहीं') ||
    normLower.includes('दारू नहीं') ||
    (isAboutAlcohol && (
      normLower === 'no' ||
      normLower === 'none' ||
      normLower === 'never' ||
      normLower === 'nahi' ||
      normLower === 'nah' ||
      normLower === 'nope' ||
      normLower === 'zero' ||
      normLower === 'bilkul nahi' ||
      (isBlanketNegative(text) && !isOccasionalAlcohol && !isHeavyAlcohol)
    ));

  if (hasAlcoholMention) {
    if (isOccasionalAlcohol) {
      next.alcoholIntake = 'moderate';
      next.alcoholUse = 'occasional';
    } else if (isHeavyAlcohol) {
      next.alcoholIntake = 'heavy';
      next.alcoholUse = 'heavy';
    } else if (explicitAlcoholNegation) {
      next.alcoholIntake = 'none';
      next.alcoholUse = 'none';
    } else if (
      normLower.includes('drink alcohol') ||
      normLower.includes('drinks alcohol') ||
      normLower.includes('consume alcohol') ||
      normLower.includes('drinking')
    ) {
      next.alcoholIntake = 'moderate';
      next.alcoholUse = 'occasional';
    }
  }

  // Combined exposure detection
  const hasTobacco =
    (next.tobaccoSmoked && next.tobaccoSmoked !== 'none') ||
    (next.tobaccoSmokeless && next.tobaccoSmokeless !== 'none') ||
    (next.arecaOrBetelNut && next.arecaOrBetelNut !== 'none');
  const hasAlcohol = next.alcoholIntake && next.alcoholIntake !== 'none';
  if (hasTobacco && hasAlcohol) {
    next.combinedTobaccoAlcohol = true;
  }

  // 10. CHRONIC IRRITATION (Sharp tooth, ill-fitting denture)
  if (
    lower.includes('sharp tooth') ||
    lower.includes('denture') ||
    lower.includes('teekha daant') ||
    lower.includes('तीखा दांत') ||
    lower.includes('दांत लगता')
  ) {
    if (!lower.includes('no sharp tooth') && !lower.includes('daant nahi lagta')) {
      next.chronicIrritation = true;
    }
  } else if (
    lower.includes('no sharp tooth') ||
    lower.includes('daant nahi lagta') ||
    lower.includes('daant se koi takleef nahi')
  ) {
    next.chronicIrritation = false;
  }

  // 11. ANATOMICAL REGION / SYMPTOM LOCATION (Interactive Mouth Map or Text)
  const isLocationCorrection = isCorrection && (
    lower.includes('side') ||
    lower.includes('cheek') ||
    lower.includes('tongue') ||
    lower.includes('lip') ||
    lower.includes('palate') ||
    lower.includes('gum') ||
    lower.includes('gaal') ||
    lower.includes('jeebh') ||
    lower.includes('taraf')
  );
  const currentRegions = isLocationCorrection ? new Set<string>() : new Set(next.affectedRegions || []);

  if (
    lower.includes('lateral tongue') ||
    lower.includes('side of tongue') ||
    lower.includes('side of my tongue') ||
    lower.includes('side of the tongue') ||
    lower.includes('zuban ke kinare') ||
    lower.includes('jeebh ke kinare') ||
    lower.includes('lateral_tongue') ||
    ((lower.includes('tongue') || lower.includes('jeebh') || lower.includes('zuban')) && (lower.includes('side') || lower.includes('kinare') || lower.includes('kinara')))
  ) {
    if (lower.includes('left') || lower.includes('baya') || lower.includes('baayein')) {
      currentRegions.add('lateral_tongue_left');
      next.primarySymptomLocation = 'Left Lateral Tongue Border';
    } else if (lower.includes('right') || lower.includes('daya') || lower.includes('daayein')) {
      currentRegions.add('lateral_tongue_right');
      next.primarySymptomLocation = 'Right Lateral Tongue Border';
    } else {
      currentRegions.add('lateral_tongue_left');
      next.primarySymptomLocation = 'Lateral Tongue Border';
    }
  } else if (
    lower.includes('floor of mouth') ||
    lower.includes('floor of the mouth') ||
    lower.includes('zuban ke neeche') ||
    lower.includes('under tongue') ||
    lower.includes('sublingual') ||
    lower.includes('floor_of_mouth')
  ) {
    currentRegions.add('floor_of_mouth');
    next.primarySymptomLocation = 'Floor of the Mouth (Under Tongue)';
  } else if (
    lower.includes('inner cheek') ||
    lower.includes('buccal mucosa') ||
    lower.includes('gaal ke andar') ||
    lower.includes('cheek') ||
    lower.includes('buccal_mucosa')
  ) {
    if (lower.includes('left') || lower.includes('baya') || lower.includes('baayein')) {
      currentRegions.add('buccal_mucosa_left');
      next.primarySymptomLocation = 'Left Inner Cheek (Buccal Mucosa)';
    } else if (lower.includes('right') || lower.includes('daya') || lower.includes('daayein')) {
      currentRegions.add('buccal_mucosa_right');
      next.primarySymptomLocation = 'Right Inner Cheek (Buccal Mucosa)';
    } else {
      currentRegions.add('buccal_mucosa_left');
      next.primarySymptomLocation = 'Inner Cheek (Buccal Mucosa)';
    }
  } else if (
    lower.includes('left side') ||
    lower.includes('bayein side') ||
    lower.includes('baayein side') ||
    lower.includes('bayein taraf') ||
    lower.includes('baayein taraf') ||
    lower.includes('baye taraf') ||
    lower.includes('बायें तरफ') ||
    lower.includes('बाएं तरफ') ||
    lower.includes('left cheek')
  ) {
    if (lower.includes('tongue') || lower.includes('jeebh') || lower.includes('zuban')) {
      currentRegions.add('lateral_tongue_left');
      next.primarySymptomLocation = 'Left Lateral Tongue Border';
    } else {
      currentRegions.add('buccal_mucosa_left');
      next.primarySymptomLocation = 'Left Inner Cheek / Oral Cavity';
    }
  } else if (
    lower.includes('right side') ||
    lower.includes('dayein side') ||
    lower.includes('daayein side') ||
    lower.includes('dayein taraf') ||
    lower.includes('daayein taraf') ||
    lower.includes('daye taraf') ||
    lower.includes('दायें तरफ') ||
    lower.includes('दाएं तरफ') ||
    lower.includes('right cheek')
  ) {
    if (lower.includes('tongue') || lower.includes('jeebh') || lower.includes('zuban')) {
      currentRegions.add('lateral_tongue_right');
      next.primarySymptomLocation = 'Right Lateral Tongue Border';
    } else {
      currentRegions.add('buccal_mucosa_right');
      next.primarySymptomLocation = 'Right Inner Cheek / Oral Cavity';
    }
  } else if (
    lower.includes('gums') ||
    lower.includes('masoode') ||
    lower.includes('gingiva') ||
    lower.includes('jaw ridge')
  ) {
    if (lower.includes('upper') || lower.includes('upar')) {
      currentRegions.add('gingiva_upper');
      next.primarySymptomLocation = 'Upper Gums (Gingiva)';
    } else {
      currentRegions.add('gingiva_lower');
      next.primarySymptomLocation = 'Lower Gums (Gingiva)';
    }
  } else if (
    lower.includes('palate') ||
    lower.includes('talu') ||
    lower.includes('roof of mouth') ||
    lower.includes('hard palate')
  ) {
    currentRegions.add('hard_soft_palate');
    next.primarySymptomLocation = 'Palate (Roof of Mouth)';
  } else if (lower.includes('lip') || lower.includes('hoth') || lower.includes('labial')) {
    if (lower.includes('lower') || lower.includes('neeche')) {
      currentRegions.add('lip_lower');
      next.primarySymptomLocation = 'Lower Lip';
    } else {
      currentRegions.add('lip_upper');
      next.primarySymptomLocation = 'Upper Lip';
    }
  } else if (
    lower.includes('tonsil') ||
    lower.includes('oropharynx') ||
    lower.includes('throat') ||
    lower.includes('gale ke peeche')
  ) {
    currentRegions.add('tonsil_oropharynx');
    next.primarySymptomLocation = 'Oropharynx / Back of Throat';
  } else if (
    lower.includes('tongue') ||
    lower.includes('zuban') ||
    lower.includes('jeebh')
  ) {
    currentRegions.add('tongue_dorsum');
    next.primarySymptomLocation = 'Tongue Dorsum';
  }

  if (currentRegions.size > 0) {
    next.affectedRegions = Array.from(currentRegions);
  }

  // 12. DERIVE STRICT CONFIRMED POSITIVE AND NEGATIVE CLINICAL FINDINGS
  const confirmedPositives: string[] = [];
  const confirmedNegatives: string[] = [];

  if (next.hasLesionOrUlcer === true) {
    confirmedPositives.push(
      next.durationOverTwoWeeks
        ? 'Persistent Oral Sore or Lesion (> 2 Weeks)'
        : 'Recent Oral Ulcer / Sore (< 2 Weeks)'
    );
  } else if (next.hasLesionOrUlcer === false) {
    confirmedNegatives.push('No active oral ulcers, sores, or indurated lesions reported');
  }

  if (next.unexplainedBleeding === true) {
    confirmedPositives.push('Unexplained Oral Bleeding');
  } else if (next.unexplainedBleeding === false) {
    confirmedNegatives.push('No unexplained oral bleeding');
  }

  if (next.numbnessInMouth === true) {
    confirmedPositives.push('Oral Paresthesia / Numbness');
  } else if (next.numbnessInMouth === false) {
    confirmedNegatives.push('No oral paresthesia or numbness');
  }

  if (next.reducedMouthOpening === true) {
    confirmedPositives.push('Restricted Mouth Opening (Trismus / OSMF Indicator)');
  } else if (next.reducedMouthOpening === false) {
    confirmedNegatives.push('Normal mouth opening (no trismus)');
  }

  if (next.difficultySwallowing === true) {
    confirmedPositives.push('Dysphagia / Sensation of Food Sticking in Throat');
  } else if (next.difficultySwallowing === false) {
    confirmedNegatives.push('Normal swallowing function');
  }

  if (next.neckLumpOrSwelling === true) {
    confirmedPositives.push('Palpable Neck Swelling / Firm Mass');
  } else if (next.neckLumpOrSwelling === false) {
    confirmedNegatives.push('No palpable neck swelling or lump');
  }

  if (next.colorChanges === 'white') {
    confirmedPositives.push('Leukoplakic White Patch');
  } else if (next.colorChanges === 'red' || next.colorChanges === 'mixed') {
    confirmedPositives.push('Erythroplakic / Mixed Velvet Red Mucosal Change');
  }

  if (next.thickeningOrLump === true) {
    confirmedPositives.push('Mucosal Thickening or Palpable Oral Lump');
  } else if (next.thickeningOrLump === false) {
    confirmedNegatives.push('No palpable mucosal thickening or oral lump');
  }

  if (next.tobaccoSmokeless && next.tobaccoSmokeless !== 'none') {
    confirmedPositives.push(`Smokeless Tobacco Exposure (${next.tobaccoSmokeless.toUpperCase()})`);
  }
  if (next.tobaccoSmoked && next.tobaccoSmoked !== 'none') {
    confirmedPositives.push(`Combustible Tobacco Exposure (${next.tobaccoSmoked.toUpperCase()})`);
  }
  if (next.arecaOrBetelNut && next.arecaOrBetelNut !== 'none') {
    confirmedPositives.push(`Areca Nut / Betel Quid (${next.arecaOrBetelNut.toUpperCase()})`);
  }
  if (
    next.tobaccoSmokeless === 'none' &&
    next.tobaccoSmoked === 'none' &&
    next.arecaOrBetelNut === 'none'
  ) {
    confirmedNegatives.push('No tobacco or areca nut use');
  }

  if (next.alcoholIntake === 'heavy' || next.alcoholIntake === 'moderate') {
    confirmedPositives.push(
      next.alcoholIntake === 'heavy' ? 'Frequent / Heavy Alcohol Intake' : 'Moderate Alcohol Intake'
    );
  } else if (next.alcoholIntake === 'none') {
    confirmedNegatives.push('Zero alcohol intake');
  }

  next.confirmedPositiveFindings = confirmedPositives;
  next.confirmedNegativeFindings = confirmedNegatives;

  return next;
}

/**
 * Computes oral cancer screening concern level using multi-factor clinical triage guidelines.
 * Respects strict safety boundaries: Does NOT claim to diagnose cancer or output arbitrary probabilities.
 */
export function computeRiskAssessment(profile: PatientProfile): AssessmentResult {
  let riskScore = 0;
  const findings: AssessmentResult['keyFindings'] = [];
  const protective: string[] = [];

  // 1. Lesion / Ulcer & Duration Check
  if (profile.hasLesionOrUlcer === true) {
    if (profile.durationOverTwoWeeks === true) {
      riskScore += 40;
      findings.push({
        title: 'Persistent Oral Sore or Lesion (> 2 Weeks)',
        description: 'Mouth sores lasting longer than 14 days deviate from self-resolving aphthous ulcers. In clinical protocols, a non-healing lesion over two weeks requires direct in-person inspection.',
        impact: 'flag',
      });
    } else if (profile.durationOverTwoWeeks === false) {
      riskScore += 12;
      findings.push({
        title: 'Recent Oral Ulcer / Sore (< 2 Weeks)',
        description: 'Recent ulcers often stem from minor trauma, accidental cheek biting, or routine aphthous stomatitis. Monitoring for complete resolution within 14 days is advised.',
        impact: 'moderate',
      });
    } else {
      // duration is unknown or unverified
      riskScore += 20;
      findings.push({
        title: 'Oral Sore or Ulcer (Duration Uncertain / Unverified)',
        description: 'An oral sore of uncertain or unverified duration has been reported. Clinical protocols advise direct in-person evaluation if persisting beyond 14 days.',
        impact: 'moderate',
      });
    }
  } else if (profile.hasLesionOrUlcer === false) {
    protective.push('No active oral ulcers, sores, or indurated lesions reported.');
  }

  // 2. Mucosal Color Changes (Leukoplakia / Erythroplakia)
  if (profile.colorChanges === 'red' || profile.colorChanges === 'mixed') {
    riskScore += 35;
    findings.push({
      title: 'Erythroplakic / Mixed Velvet Red Mucosal Change',
      description: 'Persistent red or speckled mucosal patches possess higher clinical significance for epithelial dysplasia than isolated benign friction spots.',
      impact: 'flag',
    });
  } else if (profile.colorChanges === 'white') {
    riskScore += 22;
    findings.push({
      title: 'Leukoplakic White Patch',
      description: 'A white plaque that cannot be wiped off warrants professional examination to distinguish benign keratosis from precancerous changes.',
      impact: 'moderate',
    });
  } else if (profile.colorChanges === 'none') {
    protective.push('Absence of suspicious velvet-red or adherent white mucosal plaques.');
  }

  // 3. Structural & Functional Red Flags
  if (profile.reducedMouthOpening) {
    riskScore += 30;
    findings.push({
      title: 'Restricted Mouth Opening (Trismus / OSMF Indicator)',
      description: 'Progressive inability to open the mouth is a hallmark of Oral Submucous Fibrosis (OSMF), commonly associated with areca nut and gutka exposure.',
      impact: 'flag',
    });
  }

  if (profile.difficultySwallowing) {
    riskScore += 25;
    findings.push({
      title: 'Dysphagia / Sensation of Food Sticking in Throat',
      description: 'Swallowing discomfort or throat tightness lasting without an acute cold warrants thorough oropharyngeal visualization.',
      impact: 'flag',
    });
  }

  if (profile.neckLumpOrSwelling) {
    riskScore += 25;
    findings.push({
      title: 'Palpable Neck Swelling / Firm Mass',
      description: 'Unexplained firm swelling in cervical lymph nodes should be palpated and examined alongside intraoral tissues.',
      impact: 'flag',
    });
  }

  if (profile.thickeningOrLump) {
    riskScore += 20;
    findings.push({
      title: 'Mucosal Thickening or Palpable Oral Lump',
      description: 'Submucosal firmness or texture change requiring tactile examination by an oral specialist.',
      impact: 'moderate',
    });
  }

  if (profile.unexplainedBleeding) {
    riskScore += 20;
    findings.push({
      title: 'Unexplained Oral Bleeding',
      description: 'Spontaneous or minimal-touch bleeding from soft tissues requires evaluation to exclude active mucosal erosion.',
      impact: 'flag',
    });
  }

  if (profile.numbnessInMouth) {
    riskScore += 18;
    findings.push({
      title: 'Oral Paresthesia / Numbness',
      description: 'Unexplained numbness in the tongue, lips, or alveolar ridge without dental anesthesia warrants specialist consultation.',
      impact: 'flag',
    });
  }

  if (profile.persistentHoarseness) {
    riskScore += 15;
    findings.push({
      title: 'Persistent Voice Change / Hoarseness',
      description: 'Voice change lasting several weeks without acute viral infection should be checked by an ENT specialist.',
      impact: 'moderate',
    });
  }

  // 4. Carcinogenic Habits & Exposures
  if (profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none') {
    riskScore += 30;
    findings.push({
      title: `Smokeless Tobacco Exposure (${profile.tobaccoSmokeless.toUpperCase()})`,
      description: 'Smokeless tobacco contains potent tobacco-specific nitrosamines and creates continuous chemical mucosal stress, a primary risk factor for oral lesions in India.',
      impact: 'flag',
    });
  }

  if (profile.arecaOrBetelNut && profile.arecaOrBetelNut !== 'none') {
    riskScore += 25;
    findings.push({
      title: `Areca Nut / Betel Quid (${profile.arecaOrBetelNut.toUpperCase()}) Use`,
      description: 'Areca alkaloids stimulate collagen synthesis and mucosal stiffness, strongly predisposing oral tissues to submucous fibrosis and cellular changes.',
      impact: 'flag',
    });
  }

  if (profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none') {
    riskScore += 20;
    findings.push({
      title: `Combustible Tobacco Exposure (${profile.tobaccoSmoked.toUpperCase()})`,
      description: 'Thermal irritation combined with polycyclic aromatic hydrocarbons increases susceptibility to mucosal tissue alteration.',
      impact: 'moderate',
    });
  }

  // Warning signs protective factor ONLY if all three were explicitly verified false:
  if (profile.unexplainedBleeding === false && profile.reducedMouthOpening === false && profile.numbnessInMouth === false) {
    protective.push('No acute warning signs (no unexplained bleeding, normal mouth opening, normal oral sensation).');
  }

  // Tobacco protective factor ONLY if all tobacco products are confirmed none:
  if (
    profile.tobaccoSmoked === 'none' &&
    profile.tobaccoSmokeless === 'none' &&
    profile.arecaOrBetelNut === 'none'
  ) {
    protective.push('No reported tobacco or areca nut (gutka/khaini/supari/bidi) use.');
  }

  if (profile.alcoholIntake === 'heavy' || profile.alcoholUse === 'heavy') {
    riskScore += 18;
    findings.push({
      title: 'Frequent / Heavy Alcohol Intake',
      description: 'Heavy alcohol intake acts as a solvent for cellular membranes, increasing mucosal permeability to chemical irritants.',
      impact: 'moderate',
    });
  } else if (
    profile.alcoholIntake === 'moderate' ||
    profile.alcoholIntake === 'rare' ||
    profile.alcoholUse === 'occasional'
  ) {
    riskScore += 8;
    findings.push({
      title: 'Occasional / Moderate Alcohol Intake',
      description: 'Occasional alcohol consumption reported. While lower risk than daily heavy use, alcohol acts synergistically with oral mucosal irritants.',
      impact: 'moderate',
    });
  } else if (profile.alcoholIntake === 'none' || profile.alcoholUse === 'none') {
    protective.push('Zero alcohol exposure / No alcohol intake.');
  }

  // Synergistic risk
  if (profile.combinedTobaccoAlcohol) {
    riskScore += 15;
    findings.push({
      title: 'Synergistic Tobacco + Alcohol Combined Exposure',
      description: 'Concurrent use of tobacco products and alcohol creates a multiplicative biological risk profile compared to either substance alone.',
      impact: 'flag',
    });
  }

  if (profile.chronicIrritation) {
    riskScore += 10;
    findings.push({
      title: 'Chronic Mechanical Irritation',
      description: 'Sharp tooth cusp or ill-fitting prosthesis causing repetitive local trauma.',
      impact: 'moderate',
    });
  }

  // Anatomical Site Risk Stratification
  if (
    profile.affectedRegions &&
    profile.affectedRegions.some((r) => r.includes('lateral_tongue') || r.includes('floor_of_mouth'))
  ) {
    riskScore += 15;
    findings.push({
      title: 'High-Risk Anatomical Site (Lateral Tongue / Sublingual Floor)',
      description:
        'The ventrolateral tongue border and floor of the mouth account for over 70% of oral squamous cell carcinomas. Any chronic or non-healing mucosal lesion at these specific sites warrants clinical palpation and inspection.',
      impact: 'flag',
    });
  } else if (
    profile.affectedRegions &&
    profile.affectedRegions.some((r) => r.includes('buccal_mucosa'))
  ) {
    riskScore += 8;
    findings.push({
      title: 'Anatomical Site: Buccal Mucosa (Inner Cheek)',
      description:
        'The inner cheek is particularly susceptible to chewing tobacco/khaini contact, chronic frictional trauma, oral submucous fibrosis (OSMF), and leukoplakic changes.',
      impact: 'moderate',
    });
  }

  // Emergency safety override
  if (profile.emergencyFlagTriggered) {
    riskScore = Math.max(riskScore, 65);
  }

  // Determine Screening Concern Level according to Requirement 12
  let screeningConcern: ScreeningConcernLevel = 'LOW SCREENING CONCERN';
  let level: RiskLevel = 'low';
  let recommendation = '';
  let suggestedTimeframe = '';

  const isHindi = profile.detectedLanguage === 'hi';
  const isHinglish = profile.detectedLanguage === 'hinglish';

  if (
    profile.emergencyFlagTriggered ||
    riskScore >= 45 ||
    (profile.durationOverTwoWeeks && (profile.hasLesionOrUlcer || profile.colorChanges === 'red' || profile.reducedMouthOpening || profile.neckLumpOrSwelling))
  ) {
    screeningConcern = 'HIGH SCREENING CONCERN';
    level = 'high';
    if (isHindi) {
      recommendation = profile.emergencyFlagTriggered
        ? 'तत्काल चिकित्सकीय सहायता की आवश्यकता: आपके बताए गए लक्षणों में सांस लेने या निगलने में संभावित गंभीर समस्या शामिल है। कृपया तुरंत किसी आपातकालीन अस्पताल या चिकित्सक से व्यक्तिगत जाँच कराएं।'
        : 'शीघ्र विशेषज्ञ चिकित्सकीय जाँच की सलाह: आपके विवरण में लगातार बने रहने वाले ओरल बदलाव या मुख्य नैदानिक जोखिम कारक शामिल हैं। कृपया किसी ओरल सर्जन या डेंटिस्ट से व्यक्तिगत जाँच के लिए परामर्श लें।';
      suggestedTimeframe = profile.emergencyFlagTriggered ? 'तत्काल / 24 घंटे के भीतर' : '7 से 14 दिनों के भीतर';
    } else if (isHinglish) {
      recommendation = profile.emergencyFlagTriggered
        ? 'URGENT MEDICAL ATTENTION: Aapne saans lene ya gale me tez takleef ki baat kahi hai. Kripya turant kisi emergency hospital ya doctor ko dikhayein.'
        : 'PROMPT PROFESSIONAL EVALUATION: Aapke chhale/lesion 2 hafton se zyada purane hain ya clinical risk factors maujood hain. Kripya kisi dentist ya specialist se direct physical examination karwayein.';
      suggestedTimeframe = profile.emergencyFlagTriggered ? 'Immediate / 24 ghante ke andar' : '7 se 14 dino ke andar';
    } else {
      recommendation = profile.emergencyFlagTriggered
        ? 'URGENT MEDICAL ATTENTION RECOMMENDED: Your reported symptoms include potentially urgent airway or swallowing difficulty. Please seek immediate in-person evaluation from an emergency hospital or healthcare provider.'
        : 'PROMPT PROFESSIONAL EVALUATION RECOMMENDED: Your responses include persistent oral changes or key clinical risk factors. Please schedule an in-person visual and tactile examination with an oral & maxillofacial specialist or dentist.';
      suggestedTimeframe = profile.emergencyFlagTriggered ? 'Immediate / Within 24 hours' : 'Within 7 to 14 days';
    }
  } else if (
    riskScore >= 20 ||
    profile.hasLesionOrUlcer ||
    profile.colorChanges === 'white' ||
    (profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none') ||
    (profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none')
  ) {
    screeningConcern = 'MODERATE SCREENING CONCERN';
    level = 'medium';
    if (isHindi) {
      recommendation = 'मध्यम स्क्रीनिंग संकेत: मुँह के ऊतकों में उल्लेखनीय बदलाव या तंबाकू/सुपारी के उपयोग की जानकारी दी गई है। यदि कोई छाला या पैच 10-14 दिनों से अधिक बना रहे या पूरी तरह ठीक न हो, तो किसी दंत चिकित्सक से व्यक्तिगत जाँच कराएं।';
      suggestedTimeframe = '2 से 3 सप्ताह के भीतर';
    } else if (isHinglish) {
      recommendation = 'MODERATE SCREENING INDICATION: Oral mucosal badlav ya tambaku/gutka aadat notice hui hai. Agar koi chhala 10-14 din se theek na ho, toh doctor se checkup zaroor karwayein.';
      suggestedTimeframe = '2 se 3 hafton ke andar';
    } else {
      recommendation =
        'MODERATE SCREENING INDICATION: Notable oral mucosal factors or tobacco/areca exposures were reported. If any sore or patch has lasted over 10-14 days or does not heal completely, have it evaluated in person by a dental professional.';
      suggestedTimeframe = 'Within 2 to 3 weeks';
    }
  } else {
    screeningConcern = 'LOW SCREENING CONCERN';
    level = 'low';
    if (isHindi) {
      recommendation = 'कम स्क्रीनिंग संकेत: उपलब्ध जानकारी के आधार पर इस स्क्रीनिंग में कोई बड़ा चेतावनी संकेत नहीं पाया गया। यह किसी बीमारी को पूरी तरह खारिज नहीं करता। हर महीने स्वयं मुँह की जाँच करें और वर्ष में दो बार नियमित दंत परीक्षण कराएं।';
      suggestedTimeframe = 'नियमित दंत जाँच (प्रत्येक 6 महीने में)';
    } else if (isHinglish) {
      recommendation = 'LOW SCREENING INDICATION: Batayi gayi jankari ke hisab se koi critical warning signs nahi mile. Har mahine self-examination karein aur regular dental checkup karwayein.';
      suggestedTimeframe = 'Routine dental checkup (har 6 mahine me)';
    } else {
      recommendation =
        'LOW SCREENING INDICATION: Based on the information provided, no major warning signs were identified in this screening. This does not rule out disease. Continue monthly oral self-checks and routine biannual dental examinations.';
      suggestedTimeframe = 'Routine dental checkup (every 6 months)';
    }
  }

  if (findings.length === 0) {
    findings.push({
      title: isHindi ? 'कोई तीव्र म्यूकोसल लक्षण नहीं पाए गए' : isHinglish ? 'Koi Acute Mucosal Symptom Nahi Bataya Gaya' : 'No Acute Mucosal Symptoms Reported',
      description: isHindi ? 'आपके द्वारा दिए गए उत्तरों में लगातार बने रहने वाले छाले, पैच या निगलने में कठिनाई नहीं बताई गई है।' : isHinglish ? 'Aapke answers ke hisaab se koi persistent ulcers, patches ya swallowing difficulty nahi hai.' : 'Your self-reported answers indicate no persistent ulcers, patches, or swallowing difficulties.',
      impact: 'benign',
    });
  }

  // Construct Personalized Plain-Language Explanation
  const userFactSnippets: string[] = [];
  if (profile.hasLesionOrUlcer === true) {
    if (profile.durationOverTwoWeeks === true) {
      const durationLabel = profile.duration === 'two_to_four_weeks'
        ? (isHindi ? '2 से 4 सप्ताह' : isHinglish ? '2 se 4 hafte' : '2 to 4 weeks')
        : profile.duration === 'more_than_one_month'
        ? (isHindi ? '1 महीने से अधिक' : isHinglish ? '1 mahine se zyada' : 'more than 1 month')
        : (isHindi ? '2 सप्ताह से अधिक' : isHinglish ? '2 hafton se zyada' : 'over 2 weeks');
      userFactSnippets.push(isHindi ? `मुँह का छाला (ulcer) जो ${durationLabel} से बना हुआ है` : isHinglish ? `muh me chhala jo ${durationLabel} se bana hua hai` : `a mouth sore/ulcer persisting for ${durationLabel}`);
    } else if (profile.durationOverTwoWeeks === false) {
      userFactSnippets.push(isHindi ? 'हाल ही का मुँह का छाला (< 2 सप्ताह)' : isHinglish ? 'recent muh ka chhala (< 2 hafte)' : 'a recent mouth ulcer (< 2 weeks)');
    } else {
      userFactSnippets.push(isHindi ? 'मुँह का छाला (अवधि अनिश्चित / अज्ञात)' : isHinglish ? 'muh ka chhala (duration uncertain / unknown)' : 'a mouth ulcer (duration uncertain / unverified)');
    }
  }
  if (profile.primarySymptomLocation) {
    userFactSnippets.push(isHindi ? `${profile.primarySymptomLocation} पर स्थिति` : isHinglish ? `${profile.primarySymptomLocation} par sthiti` : `located at ${profile.primarySymptomLocation}`);
  }
  if (profile.mouthPainOrBurning) {
    userFactSnippets.push(isHindi ? 'तीखा खाने पर दर्द या जलन' : isHinglish ? 'dard ya jalan (khaaskar teekha khane par)' : 'pain or burning sensation (especially with spicy food)');
  }
  if (profile.colorChanges && profile.colorChanges !== 'none') {
    userFactSnippets.push(isHindi ? `${profile.colorChanges} रंग का म्यूकोसल पैच` : isHinglish ? `${profile.colorChanges} mucosal patch` : `a ${profile.colorChanges} mucosal tissue patch`);
  }
  if (profile.unexplainedBleeding) {
    userFactSnippets.push(isHindi ? 'अकारण खून आना' : isHinglish ? 'unexplained bleeding' : 'unexplained oral bleeding');
  }
  if (profile.numbnessInMouth) {
    userFactSnippets.push(isHindi ? 'मुँह में सुन्नपन' : isHinglish ? 'muh me sunnpan (numbness)' : 'numbness or paresthesia in oral tissues');
  }
  if (profile.reducedMouthOpening) {
    userFactSnippets.push(isHindi ? 'मुँह पूरा खोलने में कठिनाई (trismus)' : isHinglish ? 'muh kholne me dikkat (trismus)' : 'difficulty opening mouth fully (trismus)');
  }
  if (profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none') {
    userFactSnippets.push(isHindi ? `${profile.tobaccoSmokeless} (गुटखा/तंबाकू) का सेवन` : isHinglish ? `${profile.tobaccoSmokeless} ka sevan` : `use of ${profile.tobaccoSmokeless}`);
  }
  if (profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none') {
    const freq = profile.tobaccoFrequency ? ` (${profile.tobaccoFrequency})` : '';
    userFactSnippets.push(isHindi ? `${profile.tobaccoSmoked}${freq} (बीड़ी/सिगरेट) पीना` : isHinglish ? `${profile.tobaccoSmoked}${freq} peena` : `smoking ${profile.tobaccoSmoked}${freq}`);
  }
  if (profile.alcoholIntake === 'heavy' || profile.alcoholUse === 'heavy') {
    userFactSnippets.push(isHindi ? 'नियमित/अधिक शराब का सेवन' : isHinglish ? 'regular/heavy alcohol sevan' : 'regular / heavy alcohol intake');
  } else if (profile.alcoholIntake === 'moderate' || profile.alcoholUse === 'occasional') {
    userFactSnippets.push(isHindi ? 'कभी-कभार शराब का सेवन' : isHinglish ? 'occasional alcohol sevan' : 'occasional / moderate alcohol intake');
  }

  const summaryOfFindings = userFactSnippets.length > 0
    ? (isHindi
        ? `आपने बताया: ${userFactSnippets.join(', ')}। ये विशिष्ट विवरण आपके स्क्रीनिंग संकेत का मुख्य आधार हैं।`
        : isHinglish
        ? `Aapne bataya: ${userFactSnippets.join(', ')}. Ye details aapke screening concern ka basis hain.`
        : `You mentioned ${userFactSnippets.join(', ')}. These specific details form the basis of your ${screeningConcern.toLowerCase()} indication.`)
    : (isHindi
        ? 'आपने मुँह में किसी सक्रिय घाव, रंग परिवर्तन या तंबाकू के उपयोग की सूचना नहीं दी है।'
        : isHinglish
        ? 'Aapne muh me koi active chhale, discoloration ya tobacco exposure report nahi kiya hai.'
        : 'You reported no active oral sores, discoloration, or tobacco exposure.');

  // Helper for confirmed vs unassessed status in clinical summary
  const getConfirmedFieldDisplay = (val: boolean | undefined, positiveLabel: string, negativeLabel: string) => {
    if (val === true) return `YES — ${positiveLabel}`;
    if (val === false) return `NO — ${negativeLabel}`;
    return 'Not assessed / Not reported';
  };

  // Build Doctor Summary Text (Requirement 15 & Master Refinement V2.1)
  const doctorSummaryText = `ORALGUARD AI — CLINICAL PATIENT SCREENING SUMMARY
==================================================
Generated by OralGuard AI screening prototype for clinical reference only. Not a definitive diagnosis.
Date/Time: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}

1. PATIENT PROFILE:
- Age: ${profile.age || 'Not specified (Adult)'}
- Sex: ${profile.gender || 'Not specified'}
- Language Used: ${profile.detectedLanguage === 'hi' ? 'Hindi (हिन्दी)' : profile.detectedLanguage === 'hinglish' ? 'Hinglish' : 'English'}

2. CHIEF COMPLAINT & ANATOMICAL LOCALIZATION:
- Chief Complaint: ${profile.mainConcern || 'Oral mucosal risk evaluation'}
- Primary Anatomical Location: ${profile.primarySymptomLocation || (profile.affectedRegions && profile.affectedRegions.length > 0 ? profile.affectedRegions.join(', ') : 'Not localized / diffuse')}
- Mouth Sore / Ulcer: ${getConfirmedFieldDisplay(profile.hasLesionOrUlcer, 'Active sore or ulcer reported', 'Confirmed None (No sores/ulcers)')}
- Mucosal Discoloration: ${profile.colorChanges && profile.colorChanges !== 'none' ? `${profile.colorChanges.toUpperCase()} patch` : profile.colorChanges === 'none' ? 'Confirmed None (No discoloration)' : 'Not assessed / Not reported'}
- Thickening or Lump: ${getConfirmedFieldDisplay(profile.thickeningOrLump, 'Palpable lump or thickened mucosal area', 'Confirmed None (No lump/thickening)')}

3. DURATION & CHRONICITY:
- Duration Category: ${profile.duration && profile.duration !== 'unknown' ? profile.duration.replace(/_/g, ' ').toUpperCase() : profile.durationOverTwoWeeks === true ? 'MORE THAN 2 WEEKS' : profile.durationOverTwoWeeks === false ? 'LESS THAN 2 WEEKS' : profile.duration === 'unknown' ? 'UNKNOWN (Patient uncertain)' : 'Not assessed / Not reported'}
- Persisting > 14 Days: ${profile.durationOverTwoWeeks === true ? 'YES (High Clinical Significance — Persistent lesion)' : profile.durationOverTwoWeeks === false ? 'No / Recent onset (< 14 days)' : profile.duration === 'unknown' ? 'UNKNOWN (Patient uncertain)' : 'Not assessed / Not reported'}
- Progression: ${profile.progression ? profile.progression.toUpperCase() : 'Not reported'}

4. ASSOCIATED SYMPTOMS & WARNING SIGNS:
- Bleeding from Lesion: ${getConfirmedFieldDisplay(profile.unexplainedBleeding, 'Unexplained bleeding reported', 'Confirmed None (No bleeding)')}
- Oral Numbness / Paresthesia: ${getConfirmedFieldDisplay(profile.numbnessInMouth, 'Paresthesia/numbness present', 'Confirmed None (Normal sensation)')}
- Mouth Pain / Burning Sensation: ${getConfirmedFieldDisplay(profile.mouthPainOrBurning, 'Present (Pain or burning, especially with spicy food)', 'Confirmed None (No pain/burning)')}
- Mouth Opening (Trismus): ${getConfirmedFieldDisplay(profile.reducedMouthOpening, 'RESTRICTED mouth opening (OSMF suspected)', 'Confirmed Normal mouth opening')}
- Swallowing Discomfort (Dysphagia): ${getConfirmedFieldDisplay(profile.difficultySwallowing, 'Difficulty swallowing reported', 'Confirmed None (Normal swallowing)')}
- Neck Lump or Swelling: ${getConfirmedFieldDisplay(profile.neckLumpOrSwelling, 'Palpable neck swelling (Regional lymph node evaluation needed)', 'Confirmed None (No neck swelling)')}
- Persistent Hoarseness: ${getConfirmedFieldDisplay(profile.persistentHoarseness, 'Voice change / hoarseness > 2 weeks', 'Confirmed None (Normal voice)')}

5. RISK FACTORS & EXPOSURES:
- Smokeless Tobacco (Gutka / Khaini / Zarda): ${profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none' ? `${profile.tobaccoSmokeless.toUpperCase()} (Reported)` : profile.tobaccoSmokeless === 'none' ? 'Confirmed None (Zero smokeless tobacco use)' : 'Not assessed'}
- Smoked Tobacco (Bidi / Cigarettes): ${profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none' ? `${profile.tobaccoSmoked.toUpperCase()}${profile.tobaccoFrequency ? ` (${profile.tobaccoFrequency})` : ''}` : profile.tobaccoSmoked === 'none' ? 'Confirmed Non-smoker (Zero smoked tobacco)' : 'Not assessed'}
- Areca / Betel Nut (Supari / Paan): ${profile.arecaOrBetelNut && profile.arecaOrBetelNut !== 'none' ? `${profile.arecaOrBetelNut.toUpperCase()} (Reported)` : profile.arecaOrBetelNut === 'none' ? 'Confirmed None (Zero areca nut use)' : 'Not assessed'}
- Alcohol Intake: ${profile.alcoholIntake === 'none' || profile.alcoholUse === 'none' ? 'Confirmed None (Zero alcohol consumption)' : profile.alcoholIntake === 'heavy' || profile.alcoholUse === 'heavy' ? 'REGULAR / HEAVY (Reported frequent alcohol intake)' : profile.alcoholIntake === 'moderate' || profile.alcoholUse === 'occasional' ? 'OCCASIONAL / MODERATE (Reported occasional alcohol intake)' : profile.alcoholIntake ? `${profile.alcoholIntake.toUpperCase()} (Reported)` : 'Not assessed'}
- Synergistic Risk (Tobacco + Alcohol): ${profile.combinedTobaccoAlcohol ? 'YES (Multiplicative oral risk)' : 'No'}
- Chronic Mechanical Irritation: ${profile.chronicIrritation ? 'YES (Sharp tooth or dental appliance rubbing)' : 'No'}

6. SCREENING RISK INDICATION:
- Overall Screening Concern Level: ${screeningConcern}
- Risk Level: ${level.toUpperCase()}
- Key Clinical Flags: ${findings.filter(f => f.impact === 'flag').map(f => f.title).join('; ') || 'No acute flags'}

7. SUGGESTED CLINICAL NEXT STEPS:
- Recommended Evaluation: ${recommendation}
- Suggested Timeframe: ${suggestedTimeframe}
- Suggested Specialist: Oral & Maxillofacial Surgeon, ENT Specialist, or General Dentist for direct clinical visualization, palpation, and biopsy if indicated.

==================================================
MANDATORY DISCLAIMER:
Generated by OralGuard AI screening prototype for clinical reference only. Not a definitive diagnosis. Only a qualified healthcare professional can diagnose or rule out oral cancer.
==================================================`;

  return {
    riskLevel: level,
    screeningConcern,
    confidenceNotes: 'Evaluated using clinical screening triage parameters based on duration, mucosal lesion attributes, sensory signs, and tobacco/areca exposures.',
    summaryOfFindings,
    keyFindings: findings,
    protectiveFactors: protective,
    recommendation,
    suggestedTimeframe,
    disclaimer: 'OralGuard AI cannot diagnose cancer. Only a qualified healthcare professional can diagnose or rule out cancer. This is a preliminary screening result, not a diagnosis.',
    doctorSummaryText,
  };
}

export const INITIAL_BOT_MESSAGE_EN = {
  id: 'msg-1-en',
  role: 'assistant' as const,
  content: `Hello 👋\nI am OralGuard AI. I am here to help you with oral mucosal awareness and preliminary oral cancer risk screening.\n\nI am an educational screening tool and cannot diagnose cancer. I will help assess your symptoms and risk factors to guide whether a professional clinical evaluation is advisable.\n\nPlease describe what has been bothering you in your own words. What symptoms have you noticed in your mouth?`,
  timestamp: 'Just now',
  quickReplies: [
    'I have a mouth ulcer / sore',
    'White or red patch in mouth',
    'Daily gutka or tobacco use',
    'Difficulty opening my mouth',
    'Routine screening, no symptoms',
  ],
};

export const INITIAL_BOT_MESSAGE_HI = {
  id: 'msg-1-hi',
  role: 'assistant' as const,
  content: `नमस्ते 👋\nमैं ओरलगार्ड एआई (OralGuard AI) हूँ। मैं मुँह के स्वास्थ्य (oral mucosal health) के प्रति जागरूकता और प्रारंभिक ओरल कैंसर जोखिम स्क्रीनिंग में आपकी सहायता के लिए उपस्थित हूँ।\n\nमैं एक प्रारंभिक शैक्षणिक स्क्रीनिंग टूल हूँ और कैंसर का निदान नहीं करता। मैं आपके लक्षणों और जोखिम कारकों का आकलन करके यह समझने में सहायता करूँगा कि क्या किसी डॉक्टर या डेंटिस्ट से व्यक्तिगत जाँच कराना उचित है।\n\nकृपया अपने शब्दों में बताएं कि आपको मुँह में क्या तकलीफ़ या बदलाव महसूस हो रहा है?`,
  timestamp: 'Just now',
  quickReplies: [
    'मुँह में छाला (ulcer) है',
    'सफ़ेद या लाल पैच (patch) है',
    'रोज़ गुटखा / तंबाकू का सेवन',
    'मुँह खोलने में परेशानी होती है',
    'नियमित जाँच, कोई लक्षण नहीं',
  ],
};

export const INITIAL_BOT_MESSAGE = {
  id: 'msg-1',
  role: 'assistant' as const,
  content: `Namaste 👋
Main OralGuard AI hoon. Main oral health awareness aur preliminary oral-cancer risk screening mein aapki madad kar sakta hoon.

Main doctor ka replacement nahi hoon aur cancer ka diagnosis nahi kar sakta. Main aapki symptoms aur risk factors ko samajhne mein help karunga aur bataunga ki professional medical evaluation ki zarurat ho sakti hai ya nahi.

Aap apni problem apne words mein bata sakte hain.

Aapko kis wajah se concern ho raha hai?`,
  timestamp: 'Just now',
  quickReplies: [
    'Muh me chhala hai',
    'White or red patch hai',
    'Roz gutka khata hoon',
    'Muh kholne me dikkat hoti hai',
    'General routine screening',
  ],
};

export interface ClinicalIndicatorItem {
  key: keyof PatientProfile;
  category: 'symptom' | 'chronicity' | 'red_flag' | 'habit' | 'other';
  label: string;
  isAnswered: boolean;
  valueDisplay: string;
  forbiddenTopics: string[];
}

export interface ClinicalEvaluationSummary {
  answeredIndicators: ClinicalIndicatorItem[];
  unansweredIndicators: ClinicalIndicatorItem[];
  forbiddenTopics: string[];
  answeredSummary: string;
}

/**
 * Evaluates the patient profile against standard clinical indicators.
 * Identifies which indicators are already answered vs. still unanswered,
 * and compiles the exact forbidden topics to prevent repeated questions.
 */
export function evaluateClinicalIndicators(profile: PatientProfile): ClinicalEvaluationSummary {
  const items: ClinicalIndicatorItem[] = [
    {
      key: 'hasLesionOrUlcer',
      category: 'symptom',
      label: 'Oral Sore / Ulcer / Patch',
      isAnswered:
        profile.hasLesionOrUlcer !== undefined ||
        profile.colorChanges !== undefined ||
        profile.thickeningOrLump !== undefined,
      valueDisplay: profile.hasLesionOrUlcer
        ? `Present (${profile.colorChanges && profile.colorChanges !== 'none' ? profile.colorChanges + ' patch' : 'ulcer/sore'}${profile.thickeningOrLump ? ', lump/thickening' : ''})`
        : profile.hasLesionOrUlcer === false
        ? 'No mouth ulcer or sore'
        : 'Unknown',
      forbiddenTopics: [
        'whether user has a mouth sore or ulcer',
        'presence of white or red patches in mouth',
        'presence of lump or mucosal thickening',
      ],
    },
    {
      key: 'primarySymptomLocation',
      category: 'symptom',
      label: 'Symptom Location',
      isAnswered: Boolean(
        profile.primarySymptomLocation ||
        (profile.affectedRegions && profile.affectedRegions.length > 0)
      ),
      valueDisplay:
        profile.primarySymptomLocation ||
        (profile.affectedRegions && profile.affectedRegions.join(', ')) ||
        'Not specified',
      forbiddenTopics: [
        'location of the sore or ulcer in the mouth',
        'where in the mouth the symptom is located',
      ],
    },
    {
      key: 'duration',
      category: 'chronicity',
      label: 'Symptom Duration / Chronicity',
      isAnswered:
        profile.hasLesionOrUlcer === false ||
        profile.duration !== undefined ||
        profile.durationCategory !== undefined ||
        profile.durationOverTwoWeeks !== undefined,
      valueDisplay:
        profile.hasLesionOrUlcer === false
          ? 'Not applicable (no lesions reported)'
          : profile.durationText
          ? profile.durationText
          : profile.duration
          ? profile.duration.replace(/_/g, ' ')
          : profile.durationOverTwoWeeks
          ? '> 2 weeks'
          : '< 2 weeks',
      forbiddenTopics: [
        'duration of the sore or symptom',
        'how long the problem or ulcer has been present',
        'duration in weeks or months',
        'approximately how long has this been present',
        'how long has this been present',
        'how long has it been there',
      ],
    },
    {
      key: 'unexplainedBleeding',
      category: 'red_flag',
      label: 'Unexplained Bleeding',
      isAnswered: profile.unexplainedBleeding !== undefined,
      valueDisplay: profile.unexplainedBleeding ? 'Bleeding reported' : 'No bleeding',
      forbiddenTopics: [
        'unexplained bleeding from the mouth or sore',
        'bleeding or blood from mouth',
      ],
    },
    {
      key: 'reducedMouthOpening',
      category: 'red_flag',
      label: 'Mouth Opening (OSMF / Trismus)',
      isAnswered: profile.reducedMouthOpening !== undefined,
      valueDisplay: profile.reducedMouthOpening
        ? 'Restricted mouth opening / Trismus'
        : 'Normal mouth opening',
      forbiddenTopics: [
        'difficulty opening mouth or restricted jaw opening',
        'trismus or mouth opening limitations',
      ],
    },
    {
      key: 'numbnessInMouth',
      category: 'red_flag',
      label: 'Numbness / Sensory Changes',
      isAnswered: profile.numbnessInMouth !== undefined,
      valueDisplay: profile.numbnessInMouth
        ? 'Numbness in lips, tongue, or mouth'
        : 'No numbness',
      forbiddenTopics: [
        'numbness or loss of sensation in lips, mouth, or tongue',
        'sensory loss or paresthesia',
      ],
    },
    {
      key: 'difficultySwallowing',
      category: 'red_flag',
      label: 'Difficulty Swallowing (Dysphagia)',
      isAnswered: profile.difficultySwallowing !== undefined,
      valueDisplay: profile.difficultySwallowing
        ? 'Difficulty swallowing'
        : 'No swallowing difficulty',
      forbiddenTopics: [
        'difficulty swallowing food or liquids',
        'pain or obstruction when swallowing',
      ],
    },
    {
      key: 'neckLumpOrSwelling',
      category: 'red_flag',
      label: 'Neck Lump / Swelling',
      isAnswered: profile.neckLumpOrSwelling !== undefined,
      valueDisplay: profile.neckLumpOrSwelling
        ? 'Neck lump or firm swelling present'
        : 'No neck lump or swelling',
      forbiddenTopics: [
        'neck lump or firm swollen neck lymph nodes',
        'gale mein gath ya sujan',
      ],
    },
    {
      key: 'tobaccoSmokeless',
      category: 'habit',
      label: 'Tobacco & Areca Nut Habits',
      isAnswered:
        profile.tobaccoSmokeless !== undefined ||
        profile.tobaccoSmoked !== undefined ||
        profile.arecaOrBetelNut !== undefined,
      valueDisplay: `Smokeless: ${profile.tobaccoSmokeless || 'none'}, Smoked: ${
        profile.tobaccoSmoked || 'none'
      }, Areca: ${profile.arecaOrBetelNut || 'none'}`,
      forbiddenTopics: [
        'tobacco consumption, gutka, khaini, bidi, cigarette, supari, or paan use',
        'whether user chews or smokes tobacco',
      ],
    },
    {
      key: 'alcoholIntake',
      category: 'habit',
      label: 'Alcohol Consumption',
      isAnswered: profile.alcoholIntake !== undefined,
      valueDisplay: profile.alcoholIntake || 'None',
      forbiddenTopics: [
        'alcohol consumption or drinking habits',
        'frequency of alcohol consumption',
      ],
    },
    {
      key: 'chronicIrritation',
      category: 'other',
      label: 'Chronic Mechanical Irritation',
      isAnswered: profile.chronicIrritation !== undefined,
      valueDisplay: profile.chronicIrritation
        ? 'Sharp tooth or rough denture irritation'
        : 'No sharp tooth irritation',
      forbiddenTopics: [
        'sharp tooth rubbing, rough tooth, or denture irritation',
        'mechanical dental irritation',
      ],
    },
  ];

  const answeredIndicators = items.filter((i) => i.isAnswered);
  const unansweredIndicators = items.filter((i) => !i.isAnswered);
  const forbiddenTopics = answeredIndicators.flatMap((i) => i.forbiddenTopics);
  const answeredSummary = answeredIndicators
    .map((i) => `${i.label}: ${i.valueDisplay}`)
    .join('; ');

  return {
    answeredIndicators,
    unansweredIndicators,
    forbiddenTopics,
    answeredSummary,
  };
}

/**
 * Single Source of Truth for Screening Questions & Progress State.
 * Evaluates completion based on strictly validated patient answers.
 */
export function getScreeningQuestionsStatus(profile: PatientProfile): ScreeningEvaluationState {
  const isEmergency = Boolean(profile.emergencyFlagTriggered);

  // 1. Symptoms: Ulcer/sore, patch, lump, or explicitly no symptoms / routine checkup
  const isLesionPresent = Boolean(
    profile.hasLesionOrUlcer ||
    (profile.colorChanges && profile.colorChanges !== 'none') ||
    profile.thickeningOrLump
  );

  const symptomsAnswered = Boolean(
    profile.hasLesionOrUlcer !== undefined ||
    (profile.colorChanges !== undefined && profile.colorChanges !== 'none') ||
    profile.thickeningOrLump !== undefined
  );

  let symptomsDisplay = 'Pending';
  if (profile.hasLesionOrUlcer) {
    symptomsDisplay = 'Mouth sore or ulcer reported';
  } else if (profile.colorChanges && profile.colorChanges !== 'none') {
    symptomsDisplay = `${profile.colorChanges} mucosal discoloration`;
  } else if (profile.thickeningOrLump) {
    symptomsDisplay = 'Palpable lump or mucosal thickening';
  } else if (profile.hasLesionOrUlcer === false) {
    symptomsDisplay = 'No mouth sores or active lesions reported';
  }

  // 2. Mouth Location:
  // If no lesion is present, location is automatically marked not applicable / complete
  const locationAnswered = !isLesionPresent || Boolean(
    profile.primarySymptomLocation ||
    (profile.affectedRegions && profile.affectedRegions.length > 0)
  );

  let locationDisplay = 'Pending';
  if (!isLesionPresent) {
    locationDisplay = 'Not applicable (no lesions reported)';
  } else if (profile.primarySymptomLocation) {
    locationDisplay = profile.primarySymptomLocation;
  } else if (profile.affectedRegions && profile.affectedRegions.length > 0) {
    locationDisplay = profile.affectedRegions.join(', ');
  }

  // 3. Duration:
  // If no lesion is present, duration is automatically marked not applicable / complete
  const durationAnswered = !isLesionPresent || Boolean(
    profile.duration !== undefined ||
    profile.durationCategory !== undefined ||
    profile.durationOverTwoWeeks !== undefined
  );

  let durationDisplay = 'Pending';
  if (!isLesionPresent) {
    durationDisplay = 'Not applicable (no lesions reported)';
  } else if (profile.durationText) {
    durationDisplay = profile.durationText;
  } else if (profile.duration) {
    durationDisplay = profile.duration.replace(/_/g, ' ');
  } else if (profile.durationOverTwoWeeks !== undefined) {
    durationDisplay = profile.durationOverTwoWeeks ? 'More than 2 weeks' : 'Less than 2 weeks';
  }

  // 4. Red Flags: Warning signs (bleeding, mouth opening/trismus, numbness, dysphagia)
  const redFlagsAnswered = Boolean(
    profile.reducedMouthOpening !== undefined ||
    profile.unexplainedBleeding !== undefined ||
    profile.numbnessInMouth !== undefined ||
    profile.difficultySwallowing !== undefined
  );

  let redFlagsDisplay = 'Pending';
  if (redFlagsAnswered) {
    const positiveFlags: string[] = [];
    if (profile.reducedMouthOpening) positiveFlags.push('Restricted mouth opening');
    if (profile.unexplainedBleeding) positiveFlags.push('Oral bleeding');
    if (profile.numbnessInMouth) positiveFlags.push('Oral numbness');
    if (profile.difficultySwallowing) positiveFlags.push('Dysphagia');
    redFlagsDisplay = positiveFlags.length > 0 ? positiveFlags.join(', ') : 'No bleeding, numbness, or opening restriction';
  }

  // 5. Gutka / Smokeless Tobacco & Areca Nut
  const gutkaAnswered = Boolean(
    profile.tobaccoSmokeless !== undefined ||
    profile.arecaOrBetelNut !== undefined
  );

  let gutkaDisplay = 'Pending';
  if (gutkaAnswered) {
    const parts: string[] = [];
    if (profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none') parts.push(profile.tobaccoSmokeless);
    if (profile.arecaOrBetelNut && profile.arecaOrBetelNut !== 'none') parts.push(profile.arecaOrBetelNut);
    gutkaDisplay = parts.length > 0 ? parts.join(', ') : 'No gutka or areca nut use';
  }

  // 6. Smoking (Bidi / Cigarettes)
  const smokingAnswered = Boolean(profile.tobaccoSmoked !== undefined);
  let smokingDisplay = 'Pending';
  if (smokingAnswered) {
    smokingDisplay = profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none'
      ? profile.tobaccoSmoked
      : 'Non-smoker (no bidi or cigarettes)';
  }

  // 7. Alcohol Consumption
  const alcoholAnswered = Boolean(profile.alcoholIntake !== undefined);
  let alcoholDisplay = 'Pending';
  if (alcoholAnswered) {
    alcoholDisplay = profile.alcoholIntake && profile.alcoholIntake !== 'none'
      ? `${profile.alcoholIntake} alcohol intake`
      : 'No alcohol consumption';
  }

  // Stage Completion Breakdown
  const stage1Completed = symptomsAnswered && locationAnswered;
  const stage2Completed = stage1Completed && durationAnswered;
  const stage3Completed = stage2Completed && redFlagsAnswered;
  const stage4Completed = stage3Completed && gutkaAnswered && smokingAnswered && alcoholAnswered;

  const allRequiredAnswered = Boolean(stage1Completed && stage2Completed && stage3Completed && stage4Completed);
  const isReadyForEvaluation = Boolean(isEmergency || allRequiredAnswered);

  // Progress Calculation strictly based on answered questions, NOT on currentStep numbers
  let progressPercentage = 20;
  let currentStepNumber: 1 | 2 | 3 | 4 = 1;
  let currentStepName: 'Symptoms' | 'Duration' | 'Red Flags' | 'Habits' | 'Assessment Ready' = 'Symptoms';

  if (isEmergency) {
    progressPercentage = 100;
    currentStepNumber = 4;
    currentStepName = 'Assessment Ready';
  } else if (!stage1Completed) {
    currentStepNumber = 1;
    currentStepName = 'Symptoms';
    progressPercentage = !symptomsAnswered ? 15 : 25;
  } else if (!stage2Completed) {
    currentStepNumber = 2;
    currentStepName = 'Duration';
    progressPercentage = 50;
  } else if (!stage3Completed) {
    currentStepNumber = 3;
    currentStepName = 'Red Flags';
    progressPercentage = 75;
  } else if (!stage4Completed) {
    currentStepNumber = 4;
    currentStepName = 'Habits';
    // If tobacco (gutka & smoking) is answered but alcohol is still unanswered:
    // Keep progress strictly below 100% and show "Step 4 of 4 – Habits", not "Assessment Ready"
    if (gutkaAnswered && smokingAnswered && !alcoholAnswered) {
      progressPercentage = 90;
    } else {
      progressPercentage = 85;
    }
  } else {
    // All required questions answered!
    progressPercentage = 100;
    currentStepNumber = 4;
    currentStepName = 'Assessment Ready';
  }

  // Determine next unanswered required question
  let nextUnansweredQuestionId: ScreeningQuestionKey | null = null;
  if (!isEmergency && !allRequiredAnswered) {
    if (!symptomsAnswered) nextUnansweredQuestionId = 'symptoms';
    else if (!locationAnswered) nextUnansweredQuestionId = 'mouthLocation';
    else if (!durationAnswered) nextUnansweredQuestionId = 'duration';
    else if (!redFlagsAnswered) nextUnansweredQuestionId = 'redFlags';
    else if (!gutkaAnswered) nextUnansweredQuestionId = 'gutka';
    else if (!smokingAnswered) nextUnansweredQuestionId = 'smoking';
    else if (!alcoholAnswered) nextUnansweredQuestionId = 'alcohol';
  }

  const questions: Record<ScreeningQuestionKey, ScreeningQuestionItem> = {
    symptoms: {
      id: 'symptoms',
      label: 'Oral Lesion / Sore Symptoms',
      step: 1,
      stepName: 'Symptoms',
      isCompleted: symptomsAnswered,
      valueDisplay: symptomsDisplay,
    },
    mouthLocation: {
      id: 'mouthLocation',
      label: 'Anatomical Location',
      step: 1,
      stepName: 'Symptoms',
      isCompleted: locationAnswered,
      valueDisplay: locationDisplay,
    },
    duration: {
      id: 'duration',
      label: 'Duration / Chronicity',
      step: 2,
      stepName: 'Duration',
      isCompleted: durationAnswered,
      valueDisplay: durationDisplay,
    },
    redFlags: {
      id: 'redFlags',
      label: 'Warning Signs (Bleeding, Trismus, Numbness)',
      step: 3,
      stepName: 'Red Flags',
      isCompleted: redFlagsAnswered,
      valueDisplay: redFlagsDisplay,
    },
    gutka: {
      id: 'gutka',
      label: 'Gutka / Smokeless Tobacco & Areca Nut',
      step: 4,
      stepName: 'Habits',
      isCompleted: gutkaAnswered,
      valueDisplay: gutkaDisplay,
    },
    smoking: {
      id: 'smoking',
      label: 'Smoking (Bidi / Cigarettes)',
      step: 4,
      stepName: 'Habits',
      isCompleted: smokingAnswered,
      valueDisplay: smokingDisplay,
    },
    alcohol: {
      id: 'alcohol',
      label: 'Alcohol Consumption',
      step: 4,
      stepName: 'Habits',
      isCompleted: alcoholAnswered,
      valueDisplay: alcoholDisplay,
    },
  };

  return {
    questions,
    allRequiredAnswered,
    isReadyForEvaluation,
    progressPercentage,
    currentStepNumber,
    currentStepName,
    nextUnansweredQuestionId,
    stage1Completed,
    stage2Completed,
    stage3Completed,
    stage4Completed,
  };
}
