import {
  AssessmentResult,
  ClinicProvider,
  PatientProfile,
  ClinicalConcern,
  CareLevel,
  RecommendedProfessional,
  ExtractedClinicalFacts,
  RiskLevel,
  ScreeningConcernLevel,
  DemoTestCase,
  ScreeningEvaluationState,
  ScreeningQuestionItem,
  ScreeningQuestionKey,
  HealthHelpline,
  EmergencyWarningSign,
  ScreeningSession,
} from '../types';

export const DEMO_TEST_CASES: DemoTestCase[] = [
  {
    id: 'case-1-multi-fact-tongue-sore',
    title: 'Case 1: Multi-Fact Tongue Sore (~3 Wks, Spicy Pain)',
    badge: 'Multi-Fact Intake',
    category: 'Non-Repetition',
    initialMessage: "I've noticed a small sore on the left side of my tongue. It's been there for about three weeks and it hurts when I eat spicy food.",
    description: "Extracts sore, Left Lateral Tongue Border, ~3 weeks (2-4 wks), pain=YES, trigger=spicy food. Symptoms & Duration complete. The AI acknowledges the sore, location, duration, and pain without re-asking duration, directly proceeding to warning signs.",
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-2-multi-concern-sore-gums',
    title: 'Case 2: Multi-Concern Sore & Gums (Sore + Gum Bleeding)',
    badge: 'Multi-Concern',
    category: 'Clinical Independence',
    initialMessage: "I have a sore on the left side of my tongue, but the sore doesn't bleed. My gums bleed when I brush.",
    description: "Multi-concern test: Preserves both independent clinical concerns (Lesion: sore without bleeding, Gums: bleeding on brushing). Never collapses into 'No unexplained bleeding' or treats gum bleeding as ulcer hemorrhage.",
    expectedConcern: 'MODERATE SCREENING CONCERN',
  },
  {
    id: 'case-3-emergency-airway-stridor',
    title: 'Case 3: Emergency Airway Compromise (Stridor & Swelling)',
    badge: 'Emergency Red Flag',
    category: 'Safety Triaging',
    initialMessage: 'I have severe throat swelling and I am struggling to breathe with noisy wheezing stridor.',
    description: 'Emergency safety override: Immediate detection of airway compromise / stridor. Instantly triggers urgent hospital referral instructions and helpline contacts, overriding routine questionnaire flow.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-4-emergency-acute-trismus-fever',
    title: 'Case 4: Emergency Lockjaw & Dysphagia (Fever & Drooling)',
    badge: 'Emergency Infection',
    category: 'Safety Triaging',
    initialMessage: 'I have a high fever, can barely open my mouth (severe lockjaw), and cannot swallow my own saliva.',
    description: 'Emergency safety override: Severe trismus + acute dysphagia + high fever. Instantly flags deep fascial neck space infection / Ludwig angina risk and delivers urgent emergency medical guidance.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-5-unknown-duration',
    title: 'Case 5: Uncertain / Unknown Duration ("I don\'t know")',
    badge: 'State Integrity',
    category: 'Strict Unknown Handling',
    initialMessage: "I have a sore inside my mouth, but I'm not sure how long it's been there, I don't know.",
    description: 'Tests uncertainty preservation: "I don\'t know" preserves UNKNOWN without defaulting duration to <2 weeks or generating false protective factors.',
    expectedConcern: 'MODERATE SCREENING CONCERN',
  },
  {
    id: 'case-6-partial-answer-pain-bleeding',
    title: 'Case 6: Partial Answer (Pain & Bleeding Only)',
    badge: 'Selective Intake',
    category: 'State Integrity',
    initialMessage: 'I have pain and bleeding from my sore.',
    description: 'Tests single source of truth: Ulcer, pain, and bleeding are set to YES. All unmentioned signs (numbness, trismus, swallowing, habits) remain UNKNOWN (undefined), never converted to NO.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-7-explicit-negative-numbness',
    title: 'Case C: Explicit Denial (Numbness Denied Only)',
    badge: 'Targeted Denial',
    category: 'Selective Negation',
    initialMessage: "I don't have any numbness in my mouth.",
    description: 'Tests selective negative attribution: Numbness is confirmed NO. Bleeding, mouth opening, and other warning signs remain UNKNOWN unless explicitly answered.',
    expectedConcern: 'LOW SCREENING CONCERN',
  },
  {
    id: 'case-8-correction-location',
    title: 'Case 8: Self-Correction Location (Tongue -> Left Cheek)',
    badge: 'Correction Handling',
    category: 'State Overwrite',
    initialMessage: 'Wait, sorry, the ulcer is actually on my left cheek, not my tongue.',
    description: 'Tests location correction: Overwrites anatomical location to Left Cheek / Buccal Mucosa while strictly maintaining all prior confirmed clinical facts.',
    expectedConcern: 'MODERATE SCREENING CONCERN',
  },
  {
    id: 'case-9-correction-smoking',
    title: 'Case 9: Self-Correction Smoking ("Stopped 2 years ago")',
    badge: 'Habit Revision',
    category: 'Correction Handling',
    initialMessage: "Actually I don't smoke anymore, I stopped smoking 2 years ago.",
    description: 'Tests habit revision: Replaces active smoker state with confirmed former smoker / zero current smoking exposure.',
    expectedConcern: 'LOW SCREENING CONCERN',
  },
  {
    id: 'case-10-alcohol-sometimes',
    title: 'Case 10: Nuanced Habit ("Sometimes" Alcohol + White Patch)',
    badge: 'Nuanced Habits',
    category: 'Exposure Stratification',
    initialMessage: 'I drink alcohol sometimes on weekends, and I have a white patch on my cheek.',
    description: 'Tests nuanced habit intake: "Sometimes" records moderate/occasional alcohol intake (not none), appropriately adjusting clinical findings.',
    expectedConcern: 'MODERATE SCREENING CONCERN',
  },
  {
    id: 'case-11-symptom-addition',
    title: 'Case 11: Symptom Addition ("Chewing Gutka for 5 Yrs")',
    badge: 'Additive Intake',
    category: 'Conversational Memory',
    initialMessage: "Also, I forgot to mention that I've been chewing gutka for 5 years.",
    description: 'Tests additive information: Correctly adds smokeless tobacco (gutka) exposure without wiping out existing lesion or location data.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-12-hindi-multi-fact',
    title: 'Case 12: Hindi Multi-Fact (गाल में सफेद छाला, 3 हफ्ते)',
    badge: 'Multilingual Hindi',
    category: 'Regional Language',
    initialMessage: 'मेरे दाहिने गाल के अंदर 3 हफ्ते से सफेद छाला है, लेकिन कोई दर्द या खून नहीं है।',
    description: 'Tests Hindi clinical comprehension: Extracts white patch, right buccal mucosa, >2 weeks duration, pain=NO, bleeding=NO, responding naturally in Hindi.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-13-marathi-trismus',
    title: 'Case 13: Marathi Trismus (तोंड उघडायला त्रास, पांढरा डाग)',
    badge: 'Multilingual Marathi',
    category: 'Regional Language',
    initialMessage: 'माझ्या डाव्या गालाच्या आत पांढरा डाग आहे आणि तोंड उघडायला त्रास होतो (Trismus).',
    description: 'Tests Marathi clinical comprehension: Extracts white patch, left cheek, reduced mouth opening (Trismus/OSMF), responding accurately in Marathi.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-14-unrelated-medical-query',
    title: 'Case 14: Unrelated Medical Query (Fever & Knee Pain)',
    badge: 'Clinical Boundaries',
    category: 'Compassionate Triage',
    initialMessage: 'I also have a mild fever and knee pain. Could that be related to my mouth sore?',
    description: 'Tests medical scope boundaries: Acknowledges unrelated systemic symptoms with empathy, clarifies oral focus, advises medical physician review if fever persists, and stays on track.',
    expectedConcern: 'MODERATE SCREENING CONCERN',
  },
  {
    id: 'case-15-mouth-map-multi-location',
    title: 'Case 15: Mouth Map Multi-Location (Cheek & Sublingual)',
    badge: 'Mouth Map Sync',
    category: 'Anatomical Precision',
    initialMessage: 'I confirmed 2 locations on the mouth map: Left Cheek and Floor of Mouth.',
    description: 'Tests anatomy synchronization: Accurately maps multiple distinct anatomical sites to the active clinical profile.',
    expectedConcern: 'HIGH SCREENING CONCERN',
  },
  {
    id: 'case-16-routine-screening',
    title: 'Case 16: Routine Screening (True Negatives Verified)',
    badge: 'Report Alignment',
    category: 'Final Report Integrity',
    initialMessage: "Routine checkup, no oral symptoms. Never used any tobacco or areca, and I don't drink alcohol.",
    description: 'Tests final report alignment: Matches screeningSession state with zero lesions, confirmed zero tobacco, and confirmed zero alcohol.',
    expectedConcern: 'LOW SCREENING CONCERN',
  },
];

export const MOCK_CLINICS: ClinicProvider[] = [
  {
    id: 'clinic-1',
    name: 'Tata Memorial Hospital — Head & Neck Oncology Centre',
    specialist: 'Dr. Rajesh Sharma (Oncosurgeon)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Senior Consultant Oral Oncosurgeon',
    rating: 4.9,
    reviewsCount: 312,
    distance: '2.5 km (Simulated)',
    address: 'Dr. E Borges Road, Parel',
    city: 'Mumbai',
    area: 'Parel',
    phone: '022-24177000',
    publicHospitalType: 'Government / Public Institution',
    isVerified: true,
    lat: 19.0048,
    lng: 72.8427,
    availableDates: ['Tomorrow, 10:30 AM', 'Thursday, 2:00 PM', 'Friday, 11:30 AM'],
    availableTimes: ['10:30 AM', '11:45 AM', '2:00 PM', '3:30 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-1b',
    name: 'Nair Dental College & Hospital — Oral Medicine Department',
    specialist: 'Dr. Meera Merchant (Oral Medicine & Biopsy)',
    specialtyType: 'Dentist',
    title: 'Professor & Specialist in Mucosal Biopsy',
    rating: 4.7,
    reviewsCount: 168,
    distance: '3.8 km (Simulated)',
    address: 'Dr. AL Nair Road, Mumbai Central',
    city: 'Mumbai',
    area: 'Mumbai Central',
    phone: '022-23082714',
    publicHospitalType: 'Dental College & Hospital',
    isVerified: true,
    lat: 18.9723,
    lng: 72.8228,
    availableDates: ['Today, 4:00 PM', 'Tomorrow, 11:00 AM', 'Friday, 2:30 PM'],
    availableTimes: ['11:00 AM', '2:30 PM', '4:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-2',
    name: 'AIIMS New Delhi — Oral & Maxillofacial Surgery Unit',
    specialist: 'Dr. Priya Deshmukh (Maxillofacial Surgeon)',
    specialtyType: 'Oral & Maxillofacial Surgeon',
    title: 'Facial Reconstructive & Biopsy Specialist',
    rating: 4.8,
    reviewsCount: 245,
    distance: '4.1 km (Simulated)',
    address: 'Ansari Nagar, Medical Enclave',
    city: 'New Delhi',
    area: 'Ansari Nagar',
    phone: '011-26588500',
    publicHospitalType: 'Government / Public Institution',
    isVerified: true,
    lat: 28.5672,
    lng: 77.2100,
    availableDates: ['Today, 3:30 PM', 'Tomorrow, 9:00 AM', 'Wednesday, 1:15 PM'],
    availableTimes: ['9:00 AM', '11:30 AM', '1:15 PM', '3:30 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-2b',
    name: 'Maulana Azad Institute of Dental Sciences (MAIDS)',
    specialist: 'Dr. Amitav Banerjee (Oral Medicine)',
    specialtyType: 'Dentist',
    title: 'Consultant in Precancerous Lesions & Stomatology',
    rating: 4.8,
    reviewsCount: 220,
    distance: '5.2 km (Simulated)',
    address: 'Bahadur Shah Zafar Marg, ITO',
    city: 'New Delhi',
    area: 'ITO',
    phone: '011-23233925',
    publicHospitalType: 'Dental College & Hospital',
    isVerified: true,
    lat: 28.6369,
    lng: 77.2407,
    availableDates: ['Tomorrow, 10:00 AM', 'Thursday, 12:30 PM'],
    availableTimes: ['10:00 AM', '11:30 AM', '12:30 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-3',
    name: 'Apollo Health Pavilion — Comprehensive Oral & ENT Unit',
    specialist: 'Dr. Ananya Iyer (Oral Medicine)',
    specialtyType: 'Dentist',
    title: 'Consultant Oral Medicine & Mucosal Diagnostic Expert',
    rating: 4.7,
    reviewsCount: 180,
    distance: '1.2 km (Simulated)',
    address: 'Metro Health Pavilion, 4th Block, Koramangala',
    city: 'Bengaluru',
    area: 'Koramangala',
    phone: '080-25530000',
    publicHospitalType: 'Empanelled Private Hospital',
    isVerified: true,
    lat: 12.9352,
    lng: 77.6245,
    availableDates: ['Tomorrow, 11:00 AM', 'Wednesday, 4:00 PM', 'Thursday, 10:30 AM'],
    availableTimes: ['10:30 AM', '11:00 AM', '2:30 PM', '4:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-3b',
    name: 'Kidwai Memorial Institute of Oncology',
    specialist: 'Dr. Suresh Ranganathan (Surgical Oncologist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Head & Neck Cancer Specialist',
    rating: 4.9,
    reviewsCount: 290,
    distance: '3.4 km (Simulated)',
    address: 'Dr. M.H. Marigowda Road',
    city: 'Bengaluru',
    area: 'Dairy Circle',
    phone: '080-26094000',
    publicHospitalType: 'Government / Public Institution',
    isVerified: true,
    lat: 12.9405,
    lng: 77.5954,
    availableDates: ['Wednesday, 9:30 AM', 'Thursday, 3:00 PM'],
    availableTimes: ['9:30 AM', '11:00 AM', '2:00 PM', '3:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-4',
    name: 'Bharati Vidyapeeth Dental College & Hospital',
    specialist: 'Dr. Sandeep Kulkarni (Maxillofacial Surgeon)',
    specialtyType: 'Oral & Maxillofacial Surgeon',
    title: 'Oral Surgery & Mucosal Biopsy Specialist',
    rating: 4.7,
    reviewsCount: 174,
    distance: '3.1 km (Simulated)',
    address: 'Pune-Satara Road, Dhankawadi',
    city: 'Pune',
    area: 'Dhankawadi / Satara Road',
    phone: '020-24373266',
    publicHospitalType: 'Dental College & Hospital',
    isVerified: true,
    lat: 18.4575,
    lng: 73.8553,
    availableDates: ['Today, 2:30 PM', 'Tomorrow, 10:00 AM'],
    availableTimes: ['10:00 AM', '11:30 AM', '2:30 PM', '4:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-4b',
    name: 'Deenanath Mangeshkar Hospital — ENT & Head-Neck Dept',
    specialist: 'Dr. Pallavi Joshi (ENT & Head Neck)',
    specialtyType: 'ENT Specialist',
    title: 'Senior ENT Surgeon & Laryngologist',
    rating: 4.8,
    reviewsCount: 205,
    distance: '4.5 km (Simulated)',
    address: 'Erandwane, Near Mhatre Bridge',
    city: 'Pune',
    area: 'Erandwane',
    phone: '020-40151000',
    publicHospitalType: 'Empanelled Private Hospital',
    isVerified: true,
    lat: 18.5018,
    lng: 73.8340,
    availableDates: ['Tomorrow, 10:00 AM', 'Friday, 3:00 PM'],
    availableTimes: ['10:00 AM', '12:00 PM', '3:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-nashik-1',
    name: 'Maharashtra University of Health Sciences & Civil Hospital Wing',
    specialist: 'Dr. Nitin Patil (Maxillofacial Surgeon)',
    specialtyType: 'Oral & Maxillofacial Surgeon',
    title: 'Consultant Oral Surgeon & Precancer Specialist',
    rating: 4.6,
    reviewsCount: 132,
    distance: '2.8 km (Simulated)',
    address: 'Trimbak Road, Near Civil Hospital',
    city: 'Nashik',
    area: 'Trimbak Road',
    phone: '0253-2576106',
    publicHospitalType: 'Government / Public Institution',
    isVerified: true,
    lat: 19.9975,
    lng: 73.7898,
    availableDates: ['Today, 3:00 PM', 'Tomorrow, 11:30 AM'],
    availableTimes: ['11:30 AM', '2:00 PM', '3:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-nashik-2',
    name: 'Nashik Cancer Hospital & Onco-Surgical Center',
    specialist: 'Dr. Snehal Kadam (Head & Neck Oncologist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Oncosurgical Specialist in Oral Lesions',
    rating: 4.8,
    reviewsCount: 145,
    distance: '4.2 km (Simulated)',
    address: 'Gangapur Road, Anandwalli',
    city: 'Nashik',
    area: 'Gangapur Road',
    phone: '0253-2345000',
    publicHospitalType: 'Empanelled Private Hospital',
    isVerified: true,
    lat: 20.0150,
    lng: 73.7650,
    availableDates: ['Tomorrow, 10:00 AM', 'Thursday, 1:00 PM'],
    availableTimes: ['10:00 AM', '11:30 AM', '1:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-6',
    name: 'Basavatarakam Indo-American Cancer Hospital & Research Institute',
    specialist: 'Dr. K. Srinivas Rao (Surgical Oncologist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Senior Surgical Oncologist',
    rating: 4.8,
    reviewsCount: 260,
    distance: '4.7 km (Simulated)',
    address: 'Road No. 10, Banjara Hills',
    city: 'Hyderabad',
    area: 'Banjara Hills',
    phone: '040-23551235',
    publicHospitalType: 'Empanelled Private Hospital',
    isVerified: true,
    lat: 17.4326,
    lng: 78.4312,
    availableDates: ['Tomorrow, 11:30 AM', 'Thursday, 1:30 PM'],
    availableTimes: ['11:30 AM', '1:30 PM', '3:30 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-7',
    name: 'Cancer Institute (WIA) Adyar — Head & Neck Oncology Wing',
    specialist: 'Dr. Radhika Sundaram (Head & Neck Specialist)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Oral Stomatologist & Diagnostic Lead',
    rating: 4.9,
    reviewsCount: 340,
    distance: '3.9 km (Simulated)',
    address: 'East Canal Bank Road, Gandhi Nagar, Adyar',
    city: 'Chennai',
    area: 'Adyar',
    phone: '044-22209150',
    publicHospitalType: 'Government / Public Institution',
    isVerified: true,
    lat: 13.0067,
    lng: 80.2570,
    availableDates: ['Wednesday, 10:00 AM', 'Friday, 2:00 PM'],
    availableTimes: ['10:00 AM', '11:30 AM', '2:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-8',
    name: 'Chittaranjan National Cancer Institute (CNCI)',
    specialist: 'Dr. Subhashish Roy (Head & Neck Oncosurgeon)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Consultant Oncosurgeon & Biopsy Lead',
    rating: 4.8,
    reviewsCount: 210,
    distance: '4.4 km (Simulated)',
    address: '37 SP Mukherjee Road, Hazra',
    city: 'Kolkata',
    area: 'Hazra / Kalighat',
    phone: '033-24765101',
    publicHospitalType: 'Government / Public Institution',
    isVerified: true,
    lat: 22.5204,
    lng: 88.3533,
    availableDates: ['Tomorrow, 12:00 PM', 'Thursday, 10:30 AM'],
    availableTimes: ['10:30 AM', '12:00 PM', '2:30 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-9',
    name: 'Government Dental College & Hospital (GDC Ahmedabad)',
    specialist: 'Dr. Hiren Patel (Oral Medicine & Diagnosis)',
    specialtyType: 'Dentist',
    title: 'Professor & Head, Oral Pathology & Medicine',
    rating: 4.7,
    reviewsCount: 188,
    distance: '3.5 km (Simulated)',
    address: 'Civil Hospital Compound, Asarwa',
    city: 'Ahmedabad',
    area: 'Asarwa',
    phone: '079-22682060',
    publicHospitalType: 'Dental College & Hospital',
    isVerified: true,
    lat: 23.0525,
    lng: 72.6026,
    availableDates: ['Tomorrow, 9:30 AM', 'Thursday, 11:00 AM'],
    availableTimes: ['9:30 AM', '11:00 AM', '2:00 PM'],
    badge: 'Directory & Demo Data',
  },
  {
    id: 'clinic-10',
    name: 'RST Regional Cancer Hospital & Research Centre',
    specialist: 'Dr. Manisha Wankhede (Head & Neck Surgeon)',
    specialtyType: 'Head & Neck Oncology',
    title: 'Consultant Surgical Oncologist',
    rating: 4.7,
    reviewsCount: 162,
    distance: '4.0 km (Simulated)',
    address: 'Manewada Road, Tukdoji Square',
    city: 'Nagpur',
    area: 'Tukdoji Square',
    phone: '0712-2744441',
    publicHospitalType: 'Government / Public Institution',
    isVerified: true,
    lat: 21.1150,
    lng: 79.0980,
    availableDates: ['Wednesday, 10:30 AM', 'Friday, 1:30 PM'],
    availableTimes: ['10:30 AM', '12:00 PM', '1:30 PM'],
    badge: 'Directory & Demo Data',
  },
];

export const VERIFIED_HEALTH_HELPLINES: HealthHelpline[] = [
  {
    id: 'helpline-erss-112',
    name: 'National Emergency Response Support System (ERSS)',
    hindiName: 'राष्ट्रीय आपातकालीन प्रतिक्रिया सहायता प्रणाली (112)',
    marathiName: 'राष्ट्रीय आपत्कालीन प्रतिसाद सहाय्यता यंत्रणा (112)',
    phone: '112',
    dialNumber: '112',
    purpose: 'Pan-India 24x7 all-in-one emergency response for acute medical emergencies, ambulance distress, and police/fire dispatch.',
    purposeHi: 'अति-गंभीर चिकित्सा आपातकाल, एम्बुलेंस और त्वरित सहायता के लिए अखिल भारतीय 24x7 आपातकालीन नंबर।',
    purposeMr: 'तातडीच्या वैद्यकीय आणीबाणी, रुग्णवाहिका आणि त्वरित मदतीसाठी संपूर्ण भारतातील २४x७ हेल्पलाइन.',
    availability: '24 Hours / 7 Days (Round-the-clock)',
    region: 'Pan-India (All States & UTs)',
    authority: 'Ministry of Home Affairs & Emergency Response System, Govt. of India',
    category: 'emergency',
    isTollFree: true,
    notes: 'Use immediately if experiencing acute difficulty breathing, airway choking, or massive hemorrhage.',
  },
  {
    id: 'helpline-nhh-104',
    name: 'National Health Helpline / State Medical Advice',
    hindiName: 'राष्ट्रीय स्वास्थ्य हेल्पलाइन (104)',
    marathiName: 'राष्ट्रीय आरोग्य हेल्पलाइन (104)',
    phone: '104',
    dialNumber: '104',
    purpose: 'Toll-free 24x7 medical information, first-aid triage, directory of local health centers, blood bank availability, and health grievance redressal.',
    purposeHi: '24x7 निःशुल्क स्वास्थ्य परामर्श, प्राथमिक उपचार सलाह, सरकारी अस्पताल और रक्त उपलब्धता की जानकारी।',
    purposeMr: '२४x७ मोफत आरोग्य सल्ला, प्रथमोपचार मार्गदर्शन आणि जवळच्या आरोग्य केंद्रांची माहिती.',
    availability: '24 Hours / 7 Days',
    region: 'Pan-India (State Integrated Services)',
    authority: 'Ministry of Health and Family Welfare (MoHFW) & State Health Departments',
    category: 'general_health',
    isTollFree: true,
    notes: 'Connects to registered doctors and paramedics for non-emergency medical guidance and local hospital directions.',
  },
  {
    id: 'helpline-tobacco-quitline',
    name: 'National Tobacco Quitline Services (NTQLS)',
    hindiName: 'राष्ट्रीय तंबाकू मुक्ति क्विटलाइन (NTQLS)',
    marathiName: 'राष्ट्रीय तंबाखू मुक्ती क्विटलाइन (NTQLS)',
    phone: '1800-11-2356',
    dialNumber: '1800112356',
    purpose: 'Dedicated toll-free counseling and behavioral support for quitting Gutka, Khaini, Zarda, Supari/Areca nut, Bidi, and Cigarettes in multiple Indian languages.',
    purposeHi: 'गुटखा, खैनी, जर्दा, सुपारी, बीड़ी और सिगरेट छोड़ने के लिए निःशुल्क परामर्श और चरणबद्ध सहायता।',
    purposeMr: 'गुटखा, खैनी, जर्दा, सुपारी, विडी आणि सिगारेट सोडण्यासाठी मोफत समुपदेशन व सहाय्य.',
    availability: '8:00 AM – 8:00 PM (All days except National Holidays)',
    region: 'Pan-India (Multilingual Support)',
    authority: 'Ministry of Health and Family Welfare (MoHFW) & V.P. Chest Institute, Delhi',
    category: 'cessation',
    isTollFree: true,
    notes: 'Certified counselors provide customized 4 D’s coping plans, craving management techniques, and follow-up calls.',
  },
  {
    id: 'helpline-tele-manas',
    name: 'Tele-MANAS (National Mental Health & De-addiction Distress Helpline)',
    hindiName: 'टेली-मानस राष्ट्रीय मानसिक स्वास्थ्य व नशा मुक्ति हेल्पलाइन',
    marathiName: 'टेलि-मानस राष्ट्रीय मानसिक आरोग्य व व्यसनमुक्ती हेल्पलाइन',
    phone: '14416 / 1800-891-4416',
    dialNumber: '14416',
    purpose: '24x7 comprehensive, confidential psychosocial support, de-addiction distress counseling, and mental wellness guidance.',
    purposeHi: '24x7 गोपनीय मानसिक स्वास्थ्य, नशा मुक्ति और तनाव प्रबंधन परामर्श सेवा।',
    purposeMr: '२४x७ गोपनीय मानसिक आरोग्य, व्यसनमुक्ती आणि ताणतणाव व्यवस्थापन सल्ला सेवा.',
    availability: '24 Hours / 7 Days',
    region: 'Pan-India (20+ Indian Languages)',
    authority: 'MoHFW, Govt. of India & NIMHANS (National Apex Coordinating Centre)',
    category: 'cessation',
    isTollFree: true,
    notes: 'Dial shortcode 14416 from any mobile or landline across India.',
  },
  {
    id: 'helpline-pmjay-14555',
    name: 'Ayushman Bharat PM-JAY / National Health Authority Helpline',
    hindiName: 'आयुष्मान भारत PM-JAY राष्ट्रीय हेल्पलाइन (14555)',
    marathiName: 'आयुष्मान भारत PM-JAY राष्ट्रीय हेल्पलाइन (14555)',
    phone: '14555 / 1800-111-565',
    dialNumber: '14555',
    purpose: 'Information on empanelled public and private hospitals, cashless cancer treatments, eligibility verification, and beneficiary card assistance.',
    purposeHi: 'कैशलेस उपचार, सरकारी व निजी संबद्ध अस्पतालों की सूची, और योजना पात्रता की जानकारी।',
    purposeMr: 'कॅशलेस उपचार, संलग्न रुग्णालयांची यादी आणि योजना पात्रतेबद्दल माहिती.',
    availability: '24 Hours / 7 Days',
    region: 'Pan-India',
    authority: 'National Health Authority (NHA), Govt. of India',
    category: 'insurance_public',
    isTollFree: true,
    notes: 'Covers major surgical onco-treatments, biopsies, and diagnostic admissions under national health assurance.',
  },
  {
    id: 'helpline-ambulance-108',
    name: 'Emergency Medical & Ambulance Transport (108 / 102)',
    hindiName: 'आपातकालीन एम्बुलेंस सेवा (108 / 102)',
    marathiName: 'आपत्कालीन रुग्णवाहिका सेवा (108 / 102)',
    phone: '108 / 102',
    dialNumber: '108',
    purpose: 'Emergency medical response, basic and advanced life support ambulance dispatch to the nearest tertiary or district hospital.',
    purposeHi: 'निकटतम अस्पताल तक गंभीर रोगियों के लिए 24x7 निःशुल्क एम्बुलेंस परिवहन सेवा।',
    purposeMr: 'जवळच्या रुग्णालयात तातडीच्या रुग्णवाहिका वाहतुकीसाठी २४x७ मोफत सेवा.',
    availability: '24 Hours / 7 Days',
    region: 'State Disaster & Public Health Services (Pan-India)',
    authority: 'State Health Departments & National Health Mission (NHM)',
    category: 'emergency',
    isTollFree: true,
    notes: '108 provides emergency life-support transport; 102 focuses on maternal and infant transport.',
  },
];

export const EMERGENCY_WARNING_SIGNS: EmergencyWarningSign[] = [
  {
    id: 'emerg-airway',
    title: 'Acute Airway Obstruction / Breathing Difficulty',
    titleHi: 'सांस लेने में तीव्र कठिनाई या दम घुटना',
    titleMr: 'श्वास घेण्यास तीव्र अडचण किंवा गुदमरणे',
    symptomSign: 'Stridor (high-pitched breathing sounds), severe shortness of breath, or choking feeling related to throat or oral swelling.',
    whyUrgent: 'Can lead to rapid airway compromise and hypoxia within minutes. Requires immediate emergency airway management.',
    immediateAction: 'Call 112 or 108 immediately. Sit upright, keep head slightly elevated, and proceed to the nearest emergency department.',
    severity: 'critical',
  },
  {
    id: 'emerg-dysphagia',
    title: 'Severe Acute Inability to Swallow (Saliva / Liquids)',
    titleHi: 'लार या पानी निगलने में असमर्थता',
    titleMr: 'लाळ किंवा पाणी गिळण्यास असमर्थता',
    symptomSign: 'Inability to swallow even small sips of water or saliva, resulting in constant drooling, throat blockage, or aspiration coughing.',
    whyUrgent: 'Indicates high-grade mechanical obstruction of the pharynx or severe deep tissue inflammation with aspiration risk.',
    immediateAction: 'Do not attempt to swallow solid foods. Seek immediate hospital emergency evaluation or call 112.',
    severity: 'critical',
  },
  {
    id: 'emerg-swelling',
    title: 'Rapidly Expanding Floor-of-Mouth or Neck Swelling',
    titleHi: 'गले या जबड़े के नीचे तेजी से बढ़ती सूजन',
    titleMr: 'घसा किंवा जबड्याखाली वेगाने वाढणारी सूज',
    symptomSign: 'A firm, tender swelling under the tongue or jaw that is visibly spreading over hours, elevating the tongue or causing neck rigidity.',
    whyUrgent: 'Risk of Ludwig’s angina or severe deep fascial space infection, which can push the tongue upward and block the airway.',
    immediateAction: 'Proceed immediately to an emergency trauma or ENT hospital unit. Do not press or squeeze the swelling.',
    severity: 'critical',
  },
  {
    id: 'emerg-bleeding',
    title: 'Continuous / Uncontrolled Oral Bleeding',
    titleHi: 'मुँह से लगातार या अत्यधिक रक्तस्राव',
    titleMr: 'तोंडातून सतत किंवा मोठ्या प्रमाणात रक्तस्त्राव',
    symptomSign: 'Heavy, active bleeding from an oral ulcer, tongue border, or throat that does not stop after 15 minutes of gentle pressure.',
    whyUrgent: 'Risk of vascular erosion or acute blood loss. Choking hazard if blood drains into the tracheobronchial tree.',
    immediateAction: 'Lean slightly forward so blood drains out (do not swallow blood). Apply clean rolled gauze with firm gentle pressure and call 112.',
    severity: 'critical',
  },
  {
    id: 'emerg-sepsis',
    title: 'Severe Lockjaw with High Fever & Systemic Confusion',
    titleHi: 'तेज बुखार, भ्रम और मुँह बिल्कुल न खुल पाना',
    titleMr: 'तीव्र ताप, गोंधळ आणि तोंड अजिबात न उघडणे',
    symptomSign: 'Complete inability to open jaw (< 5mm) accompanied by high temperature (> 102°F), altered alertness, lethargy, or rapid pulse.',
    whyUrgent: 'Indicates severe systemic spread of infection (sepsis) or deep masticator space abscess requiring urgent IV antibiotics and surgical drainage.',
    immediateAction: 'Transport to the emergency triage room of a major hospital immediately.',
    severity: 'urgent',
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
  return extractDurationFromTarget(lower);
}

function extractDurationFromTarget(targetStr: string): {
  duration: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  durationCategory: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  durationOverTwoWeeks?: boolean;
  durationText: string;
  isUnknown?: boolean;
} | null {
  const lower = targetStr.toLowerCase().trim();

  // If text has a self-correction like "for two weeks... actually, three weeks", focus on the corrected part
  if (lower.includes('actually') || lower.includes('wait') || lower.includes('correction') || lower.includes('balki') || lower.includes('nahi balki')) {
    const parts = lower.split(/actually|wait|correction|balki|nahi balki/i);
    const afterCorrection = parts[parts.length - 1].trim();
    if (afterCorrection.length >= 3) {
      const correctedResult = extractDurationFromTarget(afterCorrection);
      if (correctedResult) return correctedResult;
    }
  }

  // Check unknown / uncertain first
  if (
    lower.includes("not sure") ||
    lower.includes("don't know") ||
    lower.includes("dont know") ||
    lower.includes("uncertain") ||
    lower.includes("unsure") ||
    lower.includes("cannot remember") ||
    lower.includes("can't remember") ||
    lower.includes("cant remember") ||
    lower.includes("pata nahi") ||
    lower.includes("yaad nahi") ||
    lower.includes("theek se yaad nahi") ||
    lower.includes("mahiti nahi") ||
    lower.includes("आठवत नाही") ||
    lower.includes("माहित नाही") ||
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
    ek: 1, do: 2, don: 2, teen: 3, tin: 3, chaar: 4, char: 4, paanch: 5, panch: 5, pach: 5, chhe: 6, chhah: 6, che: 6, saha: 6,
    saat: 7, sat: 7, aath: 8, ath: 8, nau: 9, das: 10, daha: 10, pandrah: 15, bees: 20, tees: 30,
    'एक': 1, 'दो': 2, 'दोन': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'पाच': 5, 'छह': 6, 'सहा': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'नऊ': 9, 'दस': 10, 'दहा': 10,
    'पंद्रह': 15, 'बीस': 20, 'तीस': 30,
  };

  // Match weeks: e.g. "about three weeks", "for about 3 weeks", "3 hafte", "two weeks", "teen hafte", "3 aathwade"
  const weekRegex = /(?:for\s+about|for\s+around|about|around|approx|approximately|roughly|nearly|almost|for|since|lagbhag|karib|kariban|andazan|sumare)?\s*(\d+|a\s*few|few|several|a\s*couple\s*of|couple\s*of|a\s*couple|couple|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fourteen|fifteen|twenty|ek|do|don|teen|tin|chaar|char|paanch|panch|pach|chhe|saha|saat|aath|das|daha|एक|दो|दोन|तीन|चार|पांच|पाँच|पाच|छह|सहा|सात|आठ|दस|दहा)\s*(weeks|week|hafte|hafate|hafton|saptah|aathwade|aathvade|aathwada|aathvada|wk|wks|हफ्ते|हफ़्ते|सप्ताह|आठवडे|आठवडा)/i;
  const weekMatch = lower.match(weekRegex);

  if (weekMatch) {
    const rawNum = weekMatch[1].trim().toLowerCase();
    const isApprox = /about|around|approx|roughly|nearly|almost|lagbhag|karib|sumare/i.test(weekMatch[0]);

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

  // Match months: e.g. "about a month", "around a month", "2 months", "1 mahina", "ek mahine", "don mahine"
  const monthRegex = /(?:for\s+about|for\s+around|about|around|approx|approximately|roughly|nearly|almost|for|since|over|more\s*than|lagbhag|karib|kariban|andazan|sumare)?\s*(\d+|a|an|one|two|three|four|five|six|several|a\s*few|few|couple|ek|do|don|teen|char|pach|एक|दो|दोन|तीन|चार|पाच)?\s*(months|month|mahina|mahine|mahino|महीने|महीना|महिने|महिना|साल|year|years|varsh|varshe)/i;
  const monthMatch = lower.match(monthRegex);

  if (monthMatch && (monthMatch[1] || monthMatch[0].includes('month') || monthMatch[0].includes('mahine') || monthMatch[0].includes('महीने') || monthMatch[0].includes('महिने') || monthMatch[0].includes('year') || monthMatch[0].includes('साल'))) {
    const rawNum = (monthMatch[1] || '1').trim().toLowerCase();
    const isApprox = /about|around|approx|roughly|nearly|almost|lagbhag|karib|sumare/i.test(monthMatch[0]);
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

  // Match days: e.g. "about 10 days", "for 3 days", "5 din", "do teen din", "don divas"
  const dayRegex = /(?:for\s+about|for\s+around|about|around|approx|approximately|roughly|nearly|almost|for|since|lagbhag|karib|sumare)?\s*(\d+|a\s*few|few|several|a\s*couple|couple|one|two|three|four|five|six|seven|eight|ten|twelve|fourteen|fifteen|twenty|ek|do|don|teen|char|panch|pach|ek-do|do-teen|एक|दो|दोन|तीन|चार|पांच|पाच)\s*(days|day|din|divas|दिन|दिवस)/i;
  const dayMatch = lower.match(dayRegex);

  if (dayMatch) {
    const rawNum = dayMatch[1].trim().toLowerCase();
    const isApprox = /about|around|approx|roughly|nearly|almost|lagbhag|karib|sumare/i.test(dayMatch[0]);
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
    lower.includes('२ आठवड्यांपेक्षा जास्त') ||
    lower.includes('दोन आठवड्यांपेक्षा जास्त') ||
    lower.includes('दो हफ्ते से ज्यादा') ||
    lower.includes('persistent') ||
    lower.includes('not healing') ||
    lower.includes('theek nahi ho raha') ||
    lower.includes('बरा होत नाही')
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
    lower.includes('kahi divas') ||
    lower.includes('yesterday') ||
    lower.includes('kal se') ||
    lower.includes('kalapasun') ||
    lower.includes('recently') ||
    lower.includes('just started') ||
    lower.includes('कुछ दिन') ||
    lower.includes('काही दिवस') ||
    lower.includes('कालपासून') ||
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
    next.detectedLanguage = 'hi';
  } else if (
    lower.includes('tras') ||
    lower.includes('foda') ||
    lower.includes('zakhma') ||
    lower.includes('vedna')
  ) {
    next.detectedLanguage = 'mr';
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

  // EXPLICIT BLEEDING: Differentiated for lesion vs gingival bleeding
  const soreDoesNotBleed =
    lower.includes("doesn't bleed") ||
    lower.includes("doesnt bleed") ||
    lower.includes("does not bleed") ||
    lower.includes("sore doesn't bleed") ||
    lower.includes("sore does not bleed") ||
    lower.includes("ulcer doesn't bleed") ||
    lower.includes("ulcer does not bleed") ||
    lower.includes("not bleed") ||
    lower.includes("sore me se khoon nahi") ||
    lower.includes("chhale se khoon nahi") ||
    lower.includes("छाले से खून नहीं") ||
    lower.includes("फोडातून रक्त येत नाही");

  const soreBleeds =
    lower.includes("sore bleeds") ||
    lower.includes("ulcer bleeds") ||
    lower.includes("bleeds when touched") ||
    lower.includes("bleeding from the sore") ||
    lower.includes("bleeding from ulcer") ||
    lower.includes("chhale se khoon");

  const gumsBleed =
    lower.includes("gums bleed") ||
    lower.includes("gum bleeds") ||
    lower.includes("bleeding from gums") ||
    lower.includes("gum bleeding") ||
    lower.includes("bleed when brushing") ||
    lower.includes("bleeds when brushing") ||
    lower.includes("brush karte waqt khoon") ||
    lower.includes("brushing ke time khoon") ||
    lower.includes("masudo se khoon") ||
    lower.includes("मसूड़ों से खून") ||
    lower.includes("हिरड्यांमधून रक्त");

  const gumsDoNotBleed =
    lower.includes("no gum bleeding") ||
    lower.includes("gums do not bleed") ||
    lower.includes("gums don't bleed") ||
    lower.includes("masudo se khoon nahi");

  if (soreDoesNotBleed) {
    next.soreBleeding = false;
  } else if (soreBleeds) {
    next.soreBleeding = true;
  }

  if (gumsBleed) {
    next.gumBleeding = true;
  } else if (gumsDoNotBleed) {
    next.gumBleeding = false;
  }

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
  if (soreBleeds) {
    next.unexplainedBleeding = true;
  } else if (soreDoesNotBleed) {
    next.unexplainedBleeding = false;
  } else if (bleedingStatus === 'negative') {
    next.unexplainedBleeding = false;
    if (next.soreBleeding === undefined) next.soreBleeding = false;
    if (next.gumBleeding === undefined) next.gumBleeding = false;
  } else if (bleedingStatus === 'positive' && !gumsBleed) {
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
  const locationNames: string[] = [];

  // Multi-location: both sides of tongue / left & right tongue
  if (
    lower.includes('both sides of my tongue') ||
    lower.includes('both sides of the tongue') ||
    lower.includes('both sides of tongue') ||
    (lower.includes('tongue') && (lower.includes('both sides') || (lower.includes('left') && lower.includes('right')))) ||
    lower.includes('donhi baju') ||
    lower.includes('dono taraf')
  ) {
    currentRegions.add('lateral_tongue_left');
    currentRegions.add('lateral_tongue_right');
    locationNames.push('Left & Right Lateral Tongue Border');
  } else if (
    lower.includes('lateral tongue') ||
    lower.includes('side of tongue') ||
    lower.includes('side of my tongue') ||
    lower.includes('side of the tongue') ||
    lower.includes('zuban ke kinare') ||
    lower.includes('jeebh ke kinare') ||
    lower.includes('जीभ के किनारे') ||
    lower.includes('lateral_tongue') ||
    ((lower.includes('tongue') || lower.includes('jeebh') || lower.includes('zuban')) && (lower.includes('side') || lower.includes('kinare') || lower.includes('kinara')))
  ) {
    if (lower.includes('left') || lower.includes('baya') || lower.includes('baayein') || lower.includes('डावीकडे') || lower.includes('बायें')) {
      currentRegions.add('lateral_tongue_left');
      locationNames.push('Left Lateral Tongue Border');
    } else if (lower.includes('right') || lower.includes('daya') || lower.includes('daayein') || lower.includes('उजवीकडे') || lower.includes('दायें')) {
      currentRegions.add('lateral_tongue_right');
      locationNames.push('Right Lateral Tongue Border');
    } else {
      currentRegions.add('lateral_tongue_left');
      locationNames.push('Lateral Tongue Border');
    }
  }

  // Cheek / Buccal Mucosa
  if (
    lower.includes('inner cheek') ||
    lower.includes('buccal mucosa') ||
    lower.includes('gaal ke andar') ||
    lower.includes('inside my cheek') ||
    lower.includes('inside of cheek') ||
    lower.includes('inside cheek') ||
    lower.includes('गाल के अंदर') ||
    lower.includes('cheek') ||
    lower.includes('buccal_mucosa')
  ) {
    if (lower.includes('left') || lower.includes('baya') || lower.includes('baayein')) {
      currentRegions.add('buccal_mucosa_left');
      locationNames.push('Left Inner Cheek (Buccal Mucosa)');
    } else if (lower.includes('right') || lower.includes('daya') || lower.includes('daayein')) {
      currentRegions.add('buccal_mucosa_right');
      locationNames.push('Right Inner Cheek (Buccal Mucosa)');
    } else {
      currentRegions.add('buccal_mucosa_left');
      locationNames.push('Inner Cheek (Buccal Mucosa)');
    }
  }

  // Floor of mouth
  if (
    lower.includes('floor of mouth') ||
    lower.includes('floor of the mouth') ||
    lower.includes('zuban ke neeche') ||
    lower.includes('under tongue') ||
    lower.includes('sublingual') ||
    lower.includes('floor_of_mouth')
  ) {
    currentRegions.add('floor_of_mouth');
    locationNames.push('Floor of the Mouth (Under Tongue)');
  }

  // Gums / Gingiva
  if (
    lower.includes('gums') ||
    lower.includes('masoode') ||
    lower.includes('gingiva') ||
    lower.includes('jaw ridge') ||
    lower.includes('मसूड़े')
  ) {
    if (lower.includes('upper') || lower.includes('upar')) {
      currentRegions.add('gingiva_upper');
      locationNames.push('Upper Gums (Gingiva)');
    } else {
      currentRegions.add('gingiva_lower');
      locationNames.push('Lower Gums (Gingiva)');
    }
  }

  // Palate
  if (
    lower.includes('palate') ||
    lower.includes('talu') ||
    lower.includes('roof of mouth') ||
    lower.includes('hard palate') ||
    lower.includes('तालू')
  ) {
    currentRegions.add('hard_soft_palate');
    locationNames.push('Palate (Roof of Mouth)');
  }

  // Lip
  if (lower.includes('lip') || lower.includes('hoth') || lower.includes('labial') || lower.includes('ओठ') || lower.includes('होंठ')) {
    if (lower.includes('lower') || lower.includes('neeche') || lower.includes('खालचा')) {
      currentRegions.add('lip_lower');
      locationNames.push('Lower Lip');
    } else {
      currentRegions.add('lip_upper');
      locationNames.push('Upper Lip');
    }
  }

  // Throat / Tonsil
  if (
    lower.includes('tonsil') ||
    lower.includes('oropharynx') ||
    lower.includes('throat') ||
    lower.includes('gale ke peeche')
  ) {
    currentRegions.add('tonsil_oropharynx');
    locationNames.push('Oropharynx / Back of Throat');
  }

  // Tongue dorsum fallback
  if (
    (lower.includes('tongue') || lower.includes('zuban') || lower.includes('jeebh') || lower.includes('जीभ')) &&
    !currentRegions.has('lateral_tongue_left') &&
    !currentRegions.has('lateral_tongue_right') &&
    !currentRegions.has('floor_of_mouth')
  ) {
    currentRegions.add('tongue_dorsum');
    locationNames.push('Tongue Dorsum');
  }

  if (currentRegions.size > 0) {
    next.affectedRegions = Array.from(currentRegions);
    if (locationNames.length > 0) {
      next.primarySymptomLocation = Array.from(new Set(locationNames)).join(', ');
    }
  }

  // 11b. MULTIPLE CONCERNS TRACKING (e.g. sore on tongue AND bleeding gums)
  const detectedConcerns: string[] = next.multipleConcerns ? [...next.multipleConcerns] : [];
  if (next.hasLesionOrUlcer) {
    detectedConcerns.push(`Oral Sore / Ulcer (${next.primarySymptomLocation || 'Oral Cavity'})`);
  }
  if (next.colorChanges === 'white') {
    detectedConcerns.push('Leukoplakic White Patch');
  } else if (next.colorChanges === 'red' || next.colorChanges === 'mixed') {
    detectedConcerns.push('Red Mucosal Patch');
  }
  if (next.unexplainedBleeding) {
    if (lower.includes('gum') || lower.includes('brush') || lower.includes('masoode')) {
      detectedConcerns.push('Bleeding Gums / Oral Bleeding');
    } else {
      detectedConcerns.push('Unexplained Oral Bleeding');
    }
  }
  if (next.reducedMouthOpening) {
    detectedConcerns.push('Restricted Mouth Opening');
  }
  if (detectedConcerns.length > 0) {
    next.multipleConcerns = Array.from(new Set(detectedConcerns));
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
 * Helper to parse tri-state values ('yes' | 'no' | 'unknown' | 'not_mentioned' | boolean)
 */
function parseTriStateValue(val: unknown): boolean | 'unknown' | 'not_mentioned' | undefined {
  if (val === true || val === 'yes' || val === 'true' || val === 'positive') return true;
  if (val === false || val === 'no' || val === 'false' || val === 'negative') return false;
  if (val === 'unknown' || val === 'uncertain' || val === 'unsure') return 'unknown';
  if (val === 'not_mentioned' || val === null || val === undefined) return 'not_mentioned';
  return undefined;
}

/**
 * Normalizes duration descriptions into standard clinical categories.
 */
function normalizeExtractedDuration(textOrCategory: unknown): {
  duration?: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  durationCategory?: 'less_than_2_weeks' | 'two_to_four_weeks' | 'more_than_one_month' | 'unknown';
  durationOverTwoWeeks?: boolean;
} {
  if (!textOrCategory) return {};
  const str = String(textOrCategory).toLowerCase().trim();

  if (str === 'unknown' || str.includes('not sure') || str.includes('dont know') || str.includes("don't know") || str.includes('uncertain')) {
    return { duration: 'unknown', durationCategory: 'unknown', durationOverTwoWeeks: undefined };
  }
  if (
    str === 'two_to_four_weeks' ||
    str.includes('three week') ||
    str.includes('3 week') ||
    str.includes('two week') ||
    str.includes('2 week') ||
    str.includes('four week') ||
    str.includes('4 week') ||
    str.includes('2-4') ||
    str.includes('2 to 4') ||
    str.includes('do se char hafte') ||
    str.includes('teen hafte') ||
    str.includes('३ आठवडे') ||
    str.includes('तीन आठवडे')
  ) {
    return { duration: 'two_to_four_weeks', durationCategory: 'two_to_four_weeks', durationOverTwoWeeks: true };
  }
  if (
    str === 'more_than_one_month' ||
    str.includes('month') ||
    str.includes('mahina') ||
    str.includes('mahine') ||
    str.includes('saal') ||
    str.includes('year') ||
    str.includes('महिना') ||
    str.includes('महीने')
  ) {
    return { duration: 'more_than_one_month', durationCategory: 'more_than_one_month', durationOverTwoWeeks: true };
  }
  if (
    str === 'less_than_2_weeks' ||
    str.includes('day') ||
    str.includes('din') ||
    str.includes('one week') ||
    str.includes('1 week') ||
    str.includes('few days') ||
    str.includes('hafta') ||
    str.includes('दिवस') ||
    str.includes('एक आठवडा')
  ) {
    return { duration: 'less_than_2_weeks', durationCategory: 'less_than_2_weeks', durationOverTwoWeeks: false };
  }
  return {};
}

/**
 * Validates and sanitizes raw extracted data against strict clinical enums and types.
 */
export function validateExtractedFacts(raw: unknown): ExtractedClinicalFacts {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, any>;
  const facts: ExtractedClinicalFacts = {};

  // Lesion presence
  const ulcerParsed = parseTriStateValue(obj.hasLesionOrUlcer);
  if (ulcerParsed !== undefined && ulcerParsed !== 'not_mentioned') {
    facts.hasLesionOrUlcer = ulcerParsed;
  }
  if (typeof obj.ulcerDetails === 'string') facts.ulcerDetails = obj.ulcerDetails.trim();
  if (typeof obj.primarySymptomLocation === 'string') facts.primarySymptomLocation = obj.primarySymptomLocation.trim();
  if (Array.isArray(obj.affectedRegions)) {
    facts.affectedRegions = obj.affectedRegions.filter((r: unknown) => typeof r === 'string' && (r as string).length > 0);
  }

  // Duration normalization
  const rawDur = obj.durationCategory || obj.duration || obj.durationText;
  const normDur = normalizeExtractedDuration(rawDur);
  if (normDur.duration) {
    facts.duration = normDur.duration;
    facts.durationCategory = normDur.durationCategory;
    facts.durationOverTwoWeeks = normDur.durationOverTwoWeeks;
  }
  if (typeof obj.durationText === 'string') facts.durationText = obj.durationText.trim();
  if (typeof obj.durationOverTwoWeeks === 'boolean') facts.durationOverTwoWeeks = obj.durationOverTwoWeeks;

  // Sensation & Pain
  const painParsed = parseTriStateValue(obj.pain ?? obj.mouthPainOrBurning);
  if (painParsed !== undefined && painParsed !== 'not_mentioned') {
    facts.pain = painParsed;
    facts.mouthPainOrBurning = painParsed;
  }
  if (typeof obj.symptomTrigger === 'string') facts.symptomTrigger = obj.symptomTrigger.trim();

  // Color changes
  const validColors = ['none', 'white', 'red', 'mixed', 'unknown'];
  if (validColors.includes(obj.colorChanges)) facts.colorChanges = obj.colorChanges;

  // Lumps & Warning signs
  const lumpParsed = parseTriStateValue(obj.thickeningOrLump);
  if (lumpParsed !== undefined && lumpParsed !== 'not_mentioned') facts.thickeningOrLump = lumpParsed;

  const bleedingParsed = parseTriStateValue(obj.unexplainedBleeding);
  if (bleedingParsed !== undefined && bleedingParsed !== 'not_mentioned') facts.unexplainedBleeding = bleedingParsed;

  const numbnessParsed = parseTriStateValue(obj.numbnessInMouth);
  if (numbnessParsed !== undefined && numbnessParsed !== 'not_mentioned') facts.numbnessInMouth = numbnessParsed;

  const openingParsed = parseTriStateValue(obj.reducedMouthOpening);
  if (openingParsed !== undefined && openingParsed !== 'not_mentioned') facts.reducedMouthOpening = openingParsed;

  const swallowingParsed = parseTriStateValue(obj.difficultySwallowing);
  if (swallowingParsed !== undefined && swallowingParsed !== 'not_mentioned') facts.difficultySwallowing = swallowingParsed;

  const neckParsed = parseTriStateValue(obj.neckLumpOrSwelling);
  if (neckParsed !== undefined && neckParsed !== 'not_mentioned') facts.neckLumpOrSwelling = neckParsed;

  // Habits: Smoking
  const smokingStatusParsed = parseTriStateValue(obj.smokingStatus);
  if (smokingStatusParsed !== undefined && smokingStatusParsed !== 'not_mentioned') {
    facts.smokingStatus = smokingStatusParsed === true ? 'yes' : smokingStatusParsed === false ? 'no' : 'unknown';
  }
  const validSmoked = ['none', 'bidi', 'cigarettes', 'both', 'unknown'];
  if (validSmoked.includes(obj.tobaccoSmoked)) facts.tobaccoSmoked = obj.tobaccoSmoked;

  // Habits: Smokeless
  const smokelessStatusParsed = parseTriStateValue(obj.tobaccoSmokelessStatus);
  if (smokelessStatusParsed !== undefined && smokelessStatusParsed !== 'not_mentioned') {
    facts.tobaccoSmokelessStatus = smokelessStatusParsed === true ? 'yes' : smokelessStatusParsed === false ? 'no' : 'unknown';
  }
  const validSmokeless = ['none', 'gutka', 'khaini', 'zarda', 'tobacco_paan', 'unknown'];
  if (validSmokeless.includes(obj.tobaccoSmokeless)) facts.tobaccoSmokeless = obj.tobaccoSmokeless;

  const validAreca = ['none', 'supari', 'betel_quid', 'pan_masala', 'unknown'];
  if (validAreca.includes(obj.arecaOrBetelNut)) facts.arecaOrBetelNut = obj.arecaOrBetelNut;

  if (typeof obj.tobaccoFrequency === 'string') facts.tobaccoFrequency = obj.tobaccoFrequency.trim();

  // Habits: Alcohol
  const alcoholStatusParsed = parseTriStateValue(obj.alcoholStatus);
  if (alcoholStatusParsed !== undefined && alcoholStatusParsed !== 'not_mentioned') {
    facts.alcoholStatus = alcoholStatusParsed === true ? 'yes' : alcoholStatusParsed === false ? 'no' : 'unknown';
  }
  const validAlcohol = ['none', 'rare', 'moderate', 'heavy', 'unknown'];
  if (validAlcohol.includes(obj.alcoholIntake)) facts.alcoholIntake = obj.alcoholIntake;

  const validAlcoholUse = ['none', 'occasional', 'regular', 'heavy', 'unknown'];
  if (validAlcoholUse.includes(obj.alcoholUse)) facts.alcoholUse = obj.alcoholUse;

  const irritationParsed = parseTriStateValue(obj.chronicIrritation);
  if (irritationParsed !== undefined && irritationParsed !== 'not_mentioned') facts.chronicIrritation = irritationParsed;

  if (Array.isArray(obj.multipleConcerns)) {
    facts.multipleConcerns = obj.multipleConcerns.filter((c: unknown) => typeof c === 'string' && (c as string).length > 0);
  }
  if (Array.isArray(obj.multipleLocations)) {
    facts.multipleLocations = obj.multipleLocations.filter((l: unknown) => typeof l === 'string' && (l as string).length > 0);
  }

  if (typeof obj.emergencyFlag === 'boolean') facts.emergencyFlag = obj.emergencyFlag;
  if (typeof obj.emergencyReason === 'string') facts.emergencyReason = obj.emergencyReason.trim();
  if (typeof obj.isCorrection === 'boolean') facts.isCorrection = obj.isCorrection;
  if (typeof obj.correctionDetails === 'string') facts.correctionDetails = obj.correctionDetails.trim();

  return facts;
}

/**
 * Builds and maintains the canonical array of ClinicalConcern objects from the patient profile and facts.
 * Handles multi-concern tracking, location association, duration tracking, and corrections.
 */
export function buildClinicalConcerns(
  currentProfile: PatientProfile,
  facts?: ExtractedClinicalFacts,
  rawUserText?: string
): ClinicalConcern[] {
  const concerns: ClinicalConcern[] = currentProfile.concerns ? [...currentProfile.concerns] : [];
  const lower = (rawUserText || '').toLowerCase();
  const isCorrection = Boolean(
    facts?.isCorrection ||
      lower.includes('actually') ||
      lower.includes('not my tongue') ||
      lower.includes('correction') ||
      lower.includes('pehle galat') ||
      lower.includes('galti se')
  );

  // 1. If structuredConcerns were explicitly provided in facts, merge them
  if (facts?.structuredConcerns && Array.isArray(facts.structuredConcerns) && facts.structuredConcerns.length > 0) {
    for (const sc of facts.structuredConcerns) {
      const idx = concerns.findIndex((c) => c.id === sc.id || c.type === sc.type);
      if (idx >= 0) {
        concerns[idx] = { ...concerns[idx], ...sc, lastUpdatedAt: Date.now() };
      } else {
        concerns.push({ ...sc, detectedAt: Date.now(), lastUpdatedAt: Date.now() });
      }
    }
  }

  // 2. Primary Lesion / Ulcer concern
  if (currentProfile.hasLesionOrUlcer) {
    let lesionConcern = concerns.find((c) => c.type === 'lesion_ulcer');
    const locations = currentProfile.primarySymptomLocation
      ? [currentProfile.primarySymptomLocation]
      : currentProfile.affectedRegions && currentProfile.affectedRegions.length > 0
      ? currentProfile.affectedRegions
      : [];

    if (!lesionConcern) {
      lesionConcern = {
        id: 'concern-lesion-1',
        type: 'lesion_ulcer',
        description:
          currentProfile.ulcerDetails ||
          (currentProfile.primarySymptomLocation
            ? `Oral Sore / Ulcer (${currentProfile.primarySymptomLocation})`
            : 'Oral Sore / Ulcer'),
        locations,
        duration: currentProfile.duration,
        durationCategory: currentProfile.durationCategory,
        durationText: currentProfile.durationText,
        durationOverTwoWeeks: currentProfile.durationOverTwoWeeks,
        pain: currentProfile.pain,
        symptomTrigger: currentProfile.symptomTrigger,
        color: currentProfile.colorChanges && currentProfile.colorChanges !== 'none' ? currentProfile.colorChanges : undefined,
        status: 'active',
        isPrimary: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(lesionConcern);
    } else {
      if (isCorrection && locations.length > 0) {
        lesionConcern.locations = locations;
        lesionConcern.description =
          currentProfile.ulcerDetails ||
          (currentProfile.primarySymptomLocation
            ? `Oral Sore / Ulcer (${currentProfile.primarySymptomLocation})`
            : 'Oral Sore / Ulcer');
      } else if (locations.length > 0) {
        const mergedLocs = Array.from(new Set([...(lesionConcern.locations || []), ...locations]));
        lesionConcern.locations = mergedLocs;
        if (currentProfile.primarySymptomLocation) {
          lesionConcern.description = `Oral Sore / Ulcer (${currentProfile.primarySymptomLocation})`;
        }
      }
      if (currentProfile.duration) lesionConcern.duration = currentProfile.duration;
      if (currentProfile.durationCategory) lesionConcern.durationCategory = currentProfile.durationCategory;
      if (currentProfile.durationText) lesionConcern.durationText = currentProfile.durationText;
      if (currentProfile.durationOverTwoWeeks !== undefined) lesionConcern.durationOverTwoWeeks = currentProfile.durationOverTwoWeeks;
      if (currentProfile.pain !== undefined) lesionConcern.pain = currentProfile.pain;
      if (currentProfile.soreBleeding !== undefined) {
        lesionConcern.soreBleeding = currentProfile.soreBleeding;
        lesionConcern.bleeding = currentProfile.soreBleeding;
      }
      if (currentProfile.symptomTrigger) lesionConcern.symptomTrigger = currentProfile.symptomTrigger;
      if (currentProfile.colorChanges && currentProfile.colorChanges !== 'none') lesionConcern.color = currentProfile.colorChanges;
      lesionConcern.lastUpdatedAt = Date.now();
    }
  }

  // 3. Bleeding concern (e.g. bleeding gums or spontaneous oral bleeding)
  if (currentProfile.gumBleeding || currentProfile.unexplainedBleeding) {
    let bleedingConcern = concerns.find((c) => c.type === 'bleeding');
    const isGumBleeding = Boolean(
      currentProfile.gumBleeding ||
      lower.includes('gum') ||
      lower.includes('brush') ||
      lower.includes('masoode') ||
      lower.includes('hirad')
    );
    const bleedDesc = isGumBleeding ? 'Gingival Bleeding / Bleeding when Brushing' : 'Unexplained Oral Bleeding';
    const bleedLocs = isGumBleeding ? ['Lower / Upper Gums (Gingiva)'] : [];

    if (!bleedingConcern) {
      bleedingConcern = {
        id: 'concern-bleeding-1',
        type: isGumBleeding ? 'gum_gingival_periodontal' : 'bleeding',
        title: isGumBleeding ? 'Gingival Bleeding / Inflammation' : 'Oral Soft Tissue Bleeding',
        description: bleedDesc,
        locations: bleedLocs,
        gumBleeding: isGumBleeding ? true : undefined,
        bleeding: true,
        severity: 'moderate',
        symptomTrigger: isGumBleeding ? 'brushing' : undefined,
        status: 'active',
        isPrimary: concerns.length === 0,
        recommendedNextStep: 'Schedule a periodontal checkup and professional scaling with a dentist.',
        professionalEvaluationRecommended: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(bleedingConcern);
    } else {
      if (isGumBleeding) {
        bleedingConcern.type = 'gum_gingival_periodontal';
        bleedingConcern.title = 'Gingival Bleeding / Inflammation';
        bleedingConcern.description = bleedDesc;
        bleedingConcern.locations = Array.from(new Set([...(bleedingConcern.locations || []), ...bleedLocs]));
        bleedingConcern.symptomTrigger = 'brushing';
        bleedingConcern.gumBleeding = true;
        bleedingConcern.recommendedNextStep = 'Schedule a periodontal checkup and professional scaling with a dentist.';
      }
      bleedingConcern.lastUpdatedAt = Date.now();
    }
  }

  // 3b. Tooth Pain / Toothache concern
  if (
    currentProfile.toothPain ||
    lower.includes('toothache') ||
    lower.includes('tooth pain') ||
    lower.includes('teeth pain') ||
    lower.includes('daant me dard') ||
    lower.includes('danto me dard') ||
    lower.includes('daad dukhne') ||
    lower.includes('दांत में दर्द') ||
    lower.includes('दात दुखणे')
  ) {
    let toothPainConcern = concerns.find((c) => c.type === 'tooth_pain');
    if (!toothPainConcern) {
      toothPainConcern = {
        id: 'concern-tooth-pain-1',
        type: 'tooth_pain',
        title: 'Toothache / Dental Pain',
        description: 'Pain localized to tooth or jaw when biting or constant ache.',
        locations: currentProfile.primarySymptomLocation ? [currentProfile.primarySymptomLocation] : ['Upper / Lower Teeth'],
        pain: true,
        severity: 'moderate',
        status: 'active',
        isPrimary: concerns.length === 0,
        recommendedNextStep: 'Undergo dental examination and periapical X-ray with a General Dentist.',
        professionalEvaluationRecommended: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(toothPainConcern);
    }
  }

  // 3c. Tooth Sensitivity concern
  if (
    currentProfile.toothSensitivity ||
    lower.includes('sensitivity') ||
    lower.includes('cold water') ||
    lower.includes('cold drinks') ||
    lower.includes('hot tea') ||
    lower.includes('jhanjhanahat') ||
    lower.includes('sensitive teeth') ||
    lower.includes('संवेदनशीलता') ||
    lower.includes('झणझणाट')
  ) {
    let sensConcern = concerns.find((c) => c.type === 'tooth_sensitivity');
    if (!sensConcern) {
      sensConcern = {
        id: 'concern-sensitivity-1',
        type: 'tooth_sensitivity',
        title: 'Dentine Hypersensitivity',
        description: 'Sharp, transient sensitivity to cold liquids, sweet foods, or air.',
        locations: currentProfile.primarySymptomLocation ? [currentProfile.primarySymptomLocation] : ['Teeth / Enamel'],
        severity: 'mild',
        status: 'active',
        isPrimary: concerns.length === 0,
        recommendedNextStep: 'Use desensitizing toothpaste and consult a dentist to check for enamel wear or exposed roots.',
        professionalEvaluationRecommended: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(sensConcern);
    }
  }

  // 3d. Tooth Decay / Cavity concern
  if (
    currentProfile.toothDecay ||
    lower.includes('cavity') ||
    lower.includes('decay') ||
    lower.includes('kida') ||
    lower.includes('keeda') ||
    lower.includes('black spot on tooth') ||
    lower.includes('hole in tooth') ||
    lower.includes('दांत में कीड़ा') ||
    lower.includes('कीड')
  ) {
    let decayConcern = concerns.find((c) => c.type === 'tooth_decay_cavity');
    if (!decayConcern) {
      decayConcern = {
        id: 'concern-decay-1',
        type: 'tooth_decay_cavity',
        title: 'Dental Caries / Cavity',
        description: 'Possible tooth decay, cavity formation, or structural enamel breakdown.',
        locations: currentProfile.primarySymptomLocation ? [currentProfile.primarySymptomLocation] : ['Teeth'],
        severity: 'moderate',
        status: 'active',
        isPrimary: concerns.length === 0,
        recommendedNextStep: 'Visit a dentist for clinical evaluation and restoration (filling) before pulp involvement.',
        professionalEvaluationRecommended: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(decayConcern);
    }
  }

  // 3e. Bad Breath / Halitosis concern
  if (
    currentProfile.badBreath ||
    lower.includes('bad breath') ||
    lower.includes('halitosis') ||
    lower.includes('bad smell') ||
    lower.includes('mooh se badboo') ||
    lower.includes('muh se badboo') ||
    lower.includes('दुर्गंध') ||
    lower.includes('घाण वास')
  ) {
    let breathConcern = concerns.find((c) => c.type === 'bad_breath_halitosis');
    if (!breathConcern) {
      breathConcern = {
        id: 'concern-breath-1',
        type: 'bad_breath_halitosis',
        title: 'Chronic Halitosis / Oral Odor',
        description: 'Persistent oral malodor potentially related to biofilm, tongue coating, or subgingival plaque.',
        locations: ['Oral Cavity / Tongue Dorsum'],
        severity: 'mild',
        status: 'active',
        isPrimary: concerns.length === 0,
        recommendedNextStep: 'Maintain tongue scraping, flossing, and schedule professional dental prophylaxis.',
        professionalEvaluationRecommended: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(breathConcern);
    }
  }

  // 3f. Oral / Facial Swelling concern
  if (
    currentProfile.oralSwelling ||
    (lower.includes('sujan') && !lower.includes('neck') && !lower.includes('gale')) ||
    lower.includes('swollen gum') ||
    lower.includes('gum boil') ||
    lower.includes('swollen cheek') ||
    lower.includes('abscess') ||
    lower.includes('सूजन')
  ) {
    let swellingConcern = concerns.find((c) => c.type === 'oral_swelling');
    if (!swellingConcern) {
      swellingConcern = {
        id: 'concern-swelling-1',
        type: 'oral_swelling',
        title: 'Oral Soft Tissue Swelling / Possible Abscess',
        description: 'Localized swelling in the gingiva, cheek, or alveolar ridge.',
        locations: currentProfile.primarySymptomLocation ? [currentProfile.primarySymptomLocation] : ['Oral Tissues'],
        severity: 'severe',
        status: 'active',
        isPrimary: concerns.length === 0,
        recommendedNextStep: 'Seek prompt dental or emergency evaluation to rule out acute odontogenic infection.',
        professionalEvaluationRecommended: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(swellingConcern);
    }
  }

  // 3g. Jaw / Facial Pain concern
  if (
    currentProfile.jawPain ||
    lower.includes('jaw pain') ||
    lower.includes('tmj') ||
    lower.includes('jaw click') ||
    lower.includes('jabde me dard') ||
    lower.includes('जबड़े में दर्द')
  ) {
    let jawConcern = concerns.find((c) => c.type === 'jaw_facial_pain');
    if (!jawConcern) {
      jawConcern = {
        id: 'concern-jaw-1',
        type: 'jaw_facial_pain',
        title: 'Temporomandibular / Jaw Pain',
        description: 'Pain, stiffness, or clicking in the temporomandibular joint or masticatory muscles.',
        locations: ['Temporomandibular Joint / Jaw'],
        severity: 'moderate',
        status: 'active',
        isPrimary: concerns.length === 0,
        recommendedNextStep: 'Consult a dental specialist for occlusal and TMJ functional assessment.',
        professionalEvaluationRecommended: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(jawConcern);
    }
  }

  // 3h. Tobacco / Areca exposure concern
  if (
    (currentProfile.tobaccoSmokeless && currentProfile.tobaccoSmokeless !== 'none') ||
    (currentProfile.arecaOrBetelNut && currentProfile.arecaOrBetelNut !== 'none')
  ) {
    let tobaccoConcern = concerns.find((c) => c.type === 'tobacco_areca_risk');
    const habitName = currentProfile.tobaccoSmokeless || currentProfile.arecaOrBetelNut || 'tobacco/areca';
    if (!tobaccoConcern) {
      tobaccoConcern = {
        id: 'concern-tobacco-1',
        type: 'tobacco_areca_risk',
        title: `Chemical Mucosal Exposure (${habitName.toUpperCase()})`,
        description: `Exposure to ${habitName}, elevating risk for mucosal keratosis, submucous fibrosis (OSMF), and dysplastic transformation.`,
        locations: currentProfile.primarySymptomLocation ? [currentProfile.primarySymptomLocation] : ['Buccal Mucosa / Gingivobuccal Sulcus'],
        severity: 'moderate',
        status: 'active',
        isPrimary: false,
        recommendedNextStep: 'Enroll in tobacco cessation counseling and have regular visual mucosal screenings.',
        professionalEvaluationRecommended: true,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(tobaccoConcern);
    }
  }

  // 4. Color Change concern (e.g. leukoplakia, erythroplakia)
  if (currentProfile.colorChanges && currentProfile.colorChanges !== 'none' && !currentProfile.hasLesionOrUlcer) {
    let colorConcern = concerns.find((c) => c.type === 'color_change');
    const colorDesc = currentProfile.colorChanges === 'white' ? 'Leukoplakic White Patch' : `${currentProfile.colorChanges} Mucosal Change`;
    const locs = currentProfile.primarySymptomLocation ? [currentProfile.primarySymptomLocation] : [];

    if (!colorConcern) {
      colorConcern = {
        id: 'concern-color-1',
        type: 'color_change',
        description: colorDesc,
        locations: locs,
        color: currentProfile.colorChanges,
        duration: currentProfile.duration,
        durationCategory: currentProfile.durationCategory,
        durationText: currentProfile.durationText,
        durationOverTwoWeeks: currentProfile.durationOverTwoWeeks,
        status: 'active',
        isPrimary: concerns.length === 0,
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(colorConcern);
    } else {
      colorConcern.color = currentProfile.colorChanges;
      if (locs.length > 0) colorConcern.locations = locs;
      if (currentProfile.duration) colorConcern.duration = currentProfile.duration;
      colorConcern.lastUpdatedAt = Date.now();
    }
  }

  // 5. Trismus / Reduced Mouth Opening concern
  if (currentProfile.reducedMouthOpening) {
    let trismusConcern = concerns.find((c) => c.type === 'trismus');
    if (!trismusConcern) {
      trismusConcern = {
        id: 'concern-trismus-1',
        type: 'trismus',
        description: 'Restricted Mouth Opening (Trismus / OSMF Indicator)',
        locations: ['Buccal Mucosa Bilateral'],
        status: 'active',
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(trismusConcern);
    }
  }

  // 6. Palpable Lump or Thickening
  if (currentProfile.thickeningOrLump) {
    let lumpConcern = concerns.find((c) => c.type === 'lump_thickening');
    if (!lumpConcern) {
      lumpConcern = {
        id: 'concern-lump-1',
        type: 'lump_thickening',
        description: 'Mucosal Thickening or Oral Lump',
        locations: currentProfile.primarySymptomLocation ? [currentProfile.primarySymptomLocation] : [],
        status: 'active',
        detectedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      concerns.push(lumpConcern);
    }
  }

  return concerns;
}

/**
 * Merges structured extracted clinical facts into the persistent screening session profile.
 * Follows strict clinical rules:
 * - Deterministic validation & merging
 * - Negation preservation
 * - Uncertainty handling (records unknown findings without guessing)
 * - "Not mentioned" preservation
 * - Corrections handling (latest explicit statement wins)
 * - Multiple concerns & multiple locations preservation
 */
export function mergeExtractedFactsIntoProfile(
  existingProfile: PatientProfile,
  facts: ExtractedClinicalFacts,
  rawUserText?: string
): PatientProfile {
  let next: PatientProfile = { ...existingProfile };

  // First, if raw text is provided, harmonize with deterministic local parser to catch explicit patient wording
  if (rawUserText && rawUserText.trim()) {
    next = extractPatientProfileFromText(rawUserText, next);
  }

  // Track raw user reported facts
  if (rawUserText && rawUserText.trim()) {
    const userReportedFacts = next.userReportedFacts ? [...next.userReportedFacts] : [];
    if (!userReportedFacts.includes(rawUserText.trim())) {
      userReportedFacts.push(rawUserText.trim());
    }
    next.userReportedFacts = userReportedFacts;
  }

  const isCorrection = Boolean(facts.isCorrection);

  // 1. Lesion / Ulcer
  if (facts.hasLesionOrUlcer === true || facts.hasLesionOrUlcer === 'yes') {
    next.hasLesionOrUlcer = true;
    if (facts.ulcerDetails) next.ulcerDetails = facts.ulcerDetails;
  } else if (facts.hasLesionOrUlcer === false || facts.hasLesionOrUlcer === 'no') {
    next.hasLesionOrUlcer = false;
  } else if (facts.hasLesionOrUlcer === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Lesion / Ulcer Presence']));
  }

  // 2. Locations & Anatomical Regions
  if (facts.primarySymptomLocation) {
    if (isCorrection) {
      next.primarySymptomLocation = facts.primarySymptomLocation;
    } else if (next.primarySymptomLocation && !next.primarySymptomLocation.includes(facts.primarySymptomLocation)) {
      next.primarySymptomLocation = `${next.primarySymptomLocation}, ${facts.primarySymptomLocation}`;
    } else {
      next.primarySymptomLocation = facts.primarySymptomLocation;
    }
  }

  if (facts.affectedRegions && Array.isArray(facts.affectedRegions) && facts.affectedRegions.length > 0) {
    const existingRegions = new Set(isCorrection ? [] : (next.affectedRegions || []));
    facts.affectedRegions.forEach(r => existingRegions.add(r));
    next.affectedRegions = Array.from(existingRegions);
  }

  if (facts.multipleLocations && Array.isArray(facts.multipleLocations) && facts.multipleLocations.length > 0) {
    const existingLocations = new Set(isCorrection ? [] : (next.reportedLocations || []));
    facts.multipleLocations.forEach(l => existingLocations.add(l));
    next.reportedLocations = Array.from(existingLocations);

    // Map common location names into affectedRegions if not present
    const regions = new Set(next.affectedRegions || []);
    facts.multipleLocations.forEach(loc => {
      const lower = loc.toLowerCase();
      if (lower.includes('tongue') && (lower.includes('left') || lower.includes('baya'))) regions.add('lateral_tongue_left');
      if (lower.includes('tongue') && (lower.includes('right') || lower.includes('daya'))) regions.add('lateral_tongue_right');
      if (lower.includes('tongue') && lower.includes('both')) {
        regions.add('lateral_tongue_left');
        regions.add('lateral_tongue_right');
      }
      if (lower.includes('cheek') || lower.includes('buccal')) regions.add('buccal_mucosa_left');
      if (lower.includes('floor') || lower.includes('under tongue')) regions.add('floor_of_mouth');
      if (lower.includes('gum') || lower.includes('gingiva')) regions.add('gingiva_lower');
      if (lower.includes('palate')) regions.add('hard_soft_palate');
      if (lower.includes('lip')) regions.add('lip_lower');
    });
    next.affectedRegions = Array.from(regions);
  }

  // 3. Duration & Chronicity
  if (facts.duration !== undefined && facts.duration !== null && facts.duration !== 'not_mentioned') {
    if (facts.duration === 'unknown') {
      next.duration = 'unknown';
      next.durationCategory = 'unknown';
      next.durationOverTwoWeeks = undefined;
      next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Symptom Duration / Chronicity']));
    } else {
      next.duration = facts.duration;
      if (facts.durationCategory && facts.durationCategory !== 'not_mentioned') {
        next.durationCategory = facts.durationCategory;
      } else {
        next.durationCategory = facts.duration;
      }
      if (facts.durationText) next.durationText = facts.durationText;
      if (facts.durationOverTwoWeeks !== undefined && facts.durationOverTwoWeeks !== null) {
        next.durationOverTwoWeeks = facts.durationOverTwoWeeks;
      } else {
        next.durationOverTwoWeeks = facts.duration === 'two_to_four_weeks' || facts.duration === 'more_than_one_month';
      }
    }
  }

  // 4. Sensation / Pain
  if (facts.pain === true || facts.pain === 'yes') {
    next.pain = true;
    next.mouthPainOrBurning = true;
  } else if (facts.pain === false || facts.pain === 'no') {
    next.pain = false;
    next.mouthPainOrBurning = false;
  } else if (facts.pain === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Pain / Burning Sensation']));
  }

  if (facts.symptomTrigger) {
    next.symptomTrigger = facts.symptomTrigger;
  }

  // 5. Color changes
  if (facts.colorChanges && facts.colorChanges !== 'not_mentioned') {
    if (facts.colorChanges === 'unknown') {
      next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Lesion Color / Appearance']));
    } else {
      next.colorChanges = facts.colorChanges;
    }
  }

  // 6. Warning Signs / Red Flags
  // Bleeding
  if (facts.unexplainedBleeding === true || facts.unexplainedBleeding === 'yes') {
    next.unexplainedBleeding = true;
  } else if (facts.unexplainedBleeding === false || facts.unexplainedBleeding === 'no') {
    next.unexplainedBleeding = false;
  } else if (facts.unexplainedBleeding === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Unexplained Oral Bleeding']));
  }

  // Numbness
  if (facts.numbnessInMouth === true || facts.numbnessInMouth === 'yes') {
    next.numbnessInMouth = true;
  } else if (facts.numbnessInMouth === false || facts.numbnessInMouth === 'no') {
    next.numbnessInMouth = false;
  } else if (facts.numbnessInMouth === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Oral Numbness / Paresthesia']));
  }

  // Reduced Mouth Opening (Trismus)
  if (facts.reducedMouthOpening === true || facts.reducedMouthOpening === 'yes') {
    next.reducedMouthOpening = true;
  } else if (facts.reducedMouthOpening === false || facts.reducedMouthOpening === 'no') {
    next.reducedMouthOpening = false;
  } else if (facts.reducedMouthOpening === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Mouth Opening / Trismus']));
  }

  // Difficulty Swallowing (Dysphagia)
  if (facts.difficultySwallowing === true || facts.difficultySwallowing === 'yes') {
    next.difficultySwallowing = true;
  } else if (facts.difficultySwallowing === false || facts.difficultySwallowing === 'no') {
    next.difficultySwallowing = false;
  } else if (facts.difficultySwallowing === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Swallowing Discomfort']));
  }

  // Thickening / Lump
  if (facts.thickeningOrLump === true || facts.thickeningOrLump === 'yes') {
    next.thickeningOrLump = true;
  } else if (facts.thickeningOrLump === false || facts.thickeningOrLump === 'no') {
    next.thickeningOrLump = false;
  }

  // Neck Lump / Swelling
  if (facts.neckLumpOrSwelling === true || facts.neckLumpOrSwelling === 'yes') {
    next.neckLumpOrSwelling = true;
  } else if (facts.neckLumpOrSwelling === false || facts.neckLumpOrSwelling === 'no') {
    next.neckLumpOrSwelling = false;
  } else if (facts.neckLumpOrSwelling === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Neck Lump or Swelling']));
  }

  // 7. Habits: Smoking
  if (facts.smokingStatus === 'no' || facts.tobaccoSmoked === 'none') {
    next.tobaccoSmoked = 'none';
  } else if (facts.smokingStatus === 'yes') {
    if (!next.tobaccoSmoked || next.tobaccoSmoked === 'none') {
      next.tobaccoSmoked = 'cigarettes';
    }
  } else if (facts.tobaccoSmoked === 'bidi' || facts.tobaccoSmoked === 'cigarettes' || facts.tobaccoSmoked === 'both') {
    next.tobaccoSmoked = facts.tobaccoSmoked;
  } else if (facts.tobaccoSmoked === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Smoking History']));
  }

  // Habits: Smokeless
  if (facts.tobaccoSmokelessStatus === 'no' || facts.tobaccoSmokeless === 'none') {
    next.tobaccoSmokeless = 'none';
    if (facts.arecaOrBetelNut === undefined) next.arecaOrBetelNut = 'none';
  } else if (
    facts.tobaccoSmokeless === 'gutka' ||
    facts.tobaccoSmokeless === 'khaini' ||
    facts.tobaccoSmokeless === 'zarda' ||
    facts.tobaccoSmokeless === 'tobacco_paan'
  ) {
    next.tobaccoSmokeless = facts.tobaccoSmokeless;
  } else if (facts.tobaccoSmokeless === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Smokeless Tobacco History']));
  }

  if (
    facts.arecaOrBetelNut === 'none' ||
    facts.arecaOrBetelNut === 'supari' ||
    facts.arecaOrBetelNut === 'betel_quid' ||
    facts.arecaOrBetelNut === 'pan_masala'
  ) {
    next.arecaOrBetelNut = facts.arecaOrBetelNut;
  } else if (facts.arecaOrBetelNut === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Areca Nut History']));
  }
  if (facts.tobaccoFrequency) {
    next.tobaccoFrequency = facts.tobaccoFrequency;
  }

  // Habits: Alcohol
  if (facts.alcoholStatus === 'no' || facts.alcoholIntake === 'none') {
    next.alcoholIntake = 'none';
    next.alcoholUse = 'none';
  } else if (facts.alcoholIntake === 'rare' || facts.alcoholIntake === 'moderate' || facts.alcoholIntake === 'heavy') {
    next.alcoholIntake = facts.alcoholIntake;
    next.alcoholUse = facts.alcoholIntake === 'heavy' ? 'heavy' : 'occasional';
  } else if (facts.alcoholIntake === 'unknown') {
    next.unknownFindings = Array.from(new Set([...(next.unknownFindings || []), 'Alcohol Intake']));
  }

  if (facts.chronicIrritation === true || facts.chronicIrritation === 'yes') {
    next.chronicIrritation = true;
  } else if (facts.chronicIrritation === false || facts.chronicIrritation === 'no') {
    next.chronicIrritation = false;
  }

  // 8. Multiple Concerns Preservation & Canonical Structured Concerns
  const updatedConcerns = buildClinicalConcerns(next, facts, rawUserText);
  if (updatedConcerns.length > 0) {
    next.concerns = updatedConcerns;
    next.multipleConcerns = Array.from(new Set(updatedConcerns.map((c) => c.description)));
  } else {
    const existingConcerns = new Set(next.multipleConcerns || []);
    if (facts.multipleConcerns && Array.isArray(facts.multipleConcerns)) {
      facts.multipleConcerns.forEach((c) => existingConcerns.add(c));
    }
    if (next.hasLesionOrUlcer && next.primarySymptomLocation) {
      existingConcerns.add(`Oral Sore / Ulcer (${next.primarySymptomLocation})`);
    }
    if (next.unexplainedBleeding) {
      existingConcerns.add('Oral Bleeding / Bleeding Gums');
    }
    if (existingConcerns.size > 0) {
      next.multipleConcerns = Array.from(existingConcerns);
    }
  }

  // 9. Emergency Guidance Flag
  if (facts.emergencyFlag) {
    next.emergencyFlagTriggered = true;
    if (facts.emergencyReason) next.emergencyReason = facts.emergencyReason;
  }

  // Combined exposure
  const hasTobacco = (next.tobaccoSmoked && next.tobaccoSmoked !== 'none') ||
                     (next.tobaccoSmokeless && next.tobaccoSmokeless !== 'none') ||
                     (next.arecaOrBetelNut && next.arecaOrBetelNut !== 'none');
  const hasAlcohol = next.alcoholIntake && next.alcoholIntake !== 'none';
  if (hasTobacco && hasAlcohol) {
    next.combinedTobaccoAlcohol = true;
  }

  // 10. Re-derive confirmed positive and negative findings strictly
  const pos: string[] = [];
  const neg: string[] = [];
  if (next.hasLesionOrUlcer === true) {
    if (next.durationOverTwoWeeks === true) {
      pos.push('Persistent Oral Sore or Lesion (> 2 Weeks)');
    } else if (next.durationOverTwoWeeks === false) {
      pos.push('Recent Oral Ulcer / Sore (< 2 Weeks)');
    } else {
      pos.push('Oral Ulcer / Sore Present (Duration unconfirmed / not assessed)');
    }
  } else if (next.hasLesionOrUlcer === false) {
    neg.push('No active oral ulcers, sores, or indurated lesions reported');
  }

  if (next.soreBleeding === true) {
    pos.push('Bleeding from Oral Sore');
  } else if (next.soreBleeding === false) {
    neg.push('No bleeding from oral sore');
  }

  if (next.gumBleeding === true) {
    pos.push('Gingival Bleeding (when Brushing)');
  } else if (next.gumBleeding === false) {
    neg.push('No gingival bleeding');
  }

  if (next.unexplainedBleeding === true) {
    pos.push('Unexplained Spontaneous Oral Bleeding');
  } else if (next.unexplainedBleeding === false && !next.gumBleeding) {
    neg.push('No unexplained oral bleeding');
  }

  if (next.numbnessInMouth === true) pos.push('Oral Paresthesia / Numbness');
  else if (next.numbnessInMouth === false) neg.push('No oral paresthesia or numbness');

  if (next.reducedMouthOpening === true) pos.push('Restricted Mouth Opening (Trismus / OSMF Indicator)');
  else if (next.reducedMouthOpening === false) neg.push('Normal mouth opening (no trismus)');

  if (next.difficultySwallowing === true) pos.push('Dysphagia / Sensation of Food Sticking in Throat');
  else if (next.difficultySwallowing === false) neg.push('Normal swallowing function');

  if (next.neckLumpOrSwelling === true) pos.push('Palpable Neck Swelling / Firm Mass');
  else if (next.neckLumpOrSwelling === false) neg.push('No palpable neck swelling or lump');

  if (next.colorChanges === 'white') pos.push('Leukoplakic White Patch');
  else if (next.colorChanges === 'red' || next.colorChanges === 'mixed') pos.push('Erythroplakic / Mixed Velvet Red Mucosal Change');

  if (next.thickeningOrLump === true) pos.push('Mucosal Thickening or Palpable Oral Lump');
  else if (next.thickeningOrLump === false) neg.push('No palpable mucosal thickening or oral lump');

  if (next.tobaccoSmokeless && next.tobaccoSmokeless !== 'none') {
    pos.push(`Smokeless Tobacco Exposure (${next.tobaccoSmokeless.toUpperCase()})`);
  }
  if (next.tobaccoSmoked && next.tobaccoSmoked !== 'none') {
    pos.push(`Combustible Tobacco Exposure (${next.tobaccoSmoked.toUpperCase()})`);
  }
  if (next.arecaOrBetelNut && next.arecaOrBetelNut !== 'none') {
    pos.push(`Areca Nut / Betel Quid (${next.arecaOrBetelNut.toUpperCase()})`);
  }
  if (next.alcoholIntake === 'heavy' || next.alcoholIntake === 'moderate') {
    pos.push(next.alcoholIntake === 'heavy' ? 'Frequent / Heavy Alcohol Intake' : 'Moderate Alcohol Intake');
  }

  if (
    next.tobaccoSmoked === 'none' &&
    next.tobaccoSmokeless === 'none' &&
    next.arecaOrBetelNut === 'none'
  ) {
    neg.push('No tobacco or areca nut use');
  }
  if (next.alcoholIntake === 'none' || next.alcoholUse === 'none') {
    neg.push('Zero alcohol intake');
  }

  next.confirmedPositiveFindings = pos;
  next.confirmedNegativeFindings = neg;

  return next;
}

/**
 * Updates the screeningSession single-source-of-truth by merging new extracted facts,
 * then immediately recalculating indicators and completion status.
 */
export function mergeExtractedFactsIntoSession(
  existingSession: ScreeningSession,
  facts: ExtractedClinicalFacts,
  rawUserText?: string
): ScreeningSession {
  const updatedProfile = mergeExtractedFactsIntoProfile(existingSession.profile, facts, rawUserText);
  const status = getScreeningQuestionsStatus(updatedProfile);

  return {
    ...existingSession,
    profile: updatedProfile,
    concerns: updatedProfile.concerns,
    turnCount: existingSession.turnCount + 1,
    lastUpdatedAt: Date.now(),
    duration: updatedProfile.durationCategory || updatedProfile.duration,
    location: updatedProfile.primarySymptomLocation || existingSession.location,
    symptom: updatedProfile.ulcerDetails || (updatedProfile.hasLesionOrUlcer ? 'Oral sore / ulcer' : existingSession.symptom),
    pain: updatedProfile.pain,
    trigger: updatedProfile.symptomTrigger || existingSession.trigger,
    emergencyTriggered: Boolean(updatedProfile.emergencyFlagTriggered || existingSession.emergencyTriggered),
    confirmedPositiveFindings: updatedProfile.confirmedPositiveFindings,
    confirmedNegativeFindings: updatedProfile.confirmedNegativeFindings,
    unknownFindings: updatedProfile.unknownFindings,
    userReportedFacts: updatedProfile.userReportedFacts,
    isComplete: status.isReadyForEvaluation,
    assessmentReady: status.isReadyForEvaluation,
    currentStepName: status.currentStepName,
    stage: status.currentStepNumber,
  };
}

/**
 * Deterministic local fallback extractor: converts raw patient message into ExtractedClinicalFacts.
 * Ensures that if Gemini API is throttled or offline, the exact same structured data contract is returned.
 */
export function extractStructuredFactsLocally(
  text: string,
  existingProfile: PatientProfile,
  lastAssistantMessage?: string
): ExtractedClinicalFacts {
  const updated = extractPatientProfileFromText(text, existingProfile, lastAssistantMessage);
  const facts: ExtractedClinicalFacts = {};

  if (updated.hasLesionOrUlcer !== undefined) facts.hasLesionOrUlcer = updated.hasLesionOrUlcer;
  if (updated.ulcerDetails) facts.ulcerDetails = updated.ulcerDetails;
  if (updated.primarySymptomLocation) facts.primarySymptomLocation = updated.primarySymptomLocation;
  if (updated.affectedRegions && updated.affectedRegions.length > 0) facts.affectedRegions = updated.affectedRegions;
  if (updated.duration) facts.duration = updated.duration;
  if (updated.durationCategory) facts.durationCategory = updated.durationCategory;
  if (updated.durationText) facts.durationText = updated.durationText;
  if (updated.durationOverTwoWeeks !== undefined) facts.durationOverTwoWeeks = updated.durationOverTwoWeeks;
  if (updated.pain !== undefined) facts.pain = updated.pain;
  if (updated.mouthPainOrBurning !== undefined) facts.mouthPainOrBurning = updated.mouthPainOrBurning;
  if (updated.symptomTrigger) facts.symptomTrigger = updated.symptomTrigger;
  if (updated.colorChanges) facts.colorChanges = updated.colorChanges;
  if (updated.thickeningOrLump !== undefined) facts.thickeningOrLump = updated.thickeningOrLump;
  if (updated.unexplainedBleeding !== undefined) facts.unexplainedBleeding = updated.unexplainedBleeding;
  if (updated.numbnessInMouth !== undefined) facts.numbnessInMouth = updated.numbnessInMouth;
  if (updated.reducedMouthOpening !== undefined) facts.reducedMouthOpening = updated.reducedMouthOpening;
  if (updated.difficultySwallowing !== undefined) facts.difficultySwallowing = updated.difficultySwallowing;
  if (updated.neckLumpOrSwelling !== undefined) facts.neckLumpOrSwelling = updated.neckLumpOrSwelling;
  if (updated.tobaccoSmokeless) facts.tobaccoSmokeless = updated.tobaccoSmokeless;
  if (updated.tobaccoSmoked) facts.tobaccoSmoked = updated.tobaccoSmoked;
  if (updated.arecaOrBetelNut) facts.arecaOrBetelNut = updated.arecaOrBetelNut;
  if (updated.alcoholIntake) facts.alcoholIntake = updated.alcoholIntake;
  if (updated.chronicIrritation !== undefined) facts.chronicIrritation = updated.chronicIrritation;
  if (updated.concerns && updated.concerns.length > 0) facts.structuredConcerns = updated.concerns;
  if (updated.multipleConcerns && updated.multipleConcerns.length > 0) facts.multipleConcerns = updated.multipleConcerns;
  if (updated.emergencyFlagTriggered) {
    facts.emergencyFlag = true;
    facts.emergencyReason = updated.emergencyReason;
  }

  return facts;
}

/**
 * Computes overall oral health risk indication and clinical triage using multi-factor guidelines.
 * Respects strict safety boundaries: Does NOT claim to diagnose cancer or dental conditions, or output arbitrary probabilities.
 */
export function computeRiskAssessment(profile: PatientProfile): AssessmentResult {
  let riskScore = 0;
  const findings: AssessmentResult['keyFindings'] = [];
  const protective: string[] = [];

  // 1. Build canonical list of clinical concerns (Multi-concern model)
  const concerns: ClinicalConcern[] = buildClinicalConcerns(profile);

  // 2. Evaluate specific oral health concerns
  // Gum / Periodontal Bleeding
  const hasGumBleeding = profile.gumBleeding || concerns.some((c) => c.type === 'gum_gingival_periodontal' || c.gumBleeding);
  if (hasGumBleeding) {
    riskScore += 12;
    findings.push({
      title: 'Gingival Bleeding / Periodontal Inflammation',
      description: 'Bleeding while brushing or flossing indicates marginal gingivitis or subgingival plaque accumulation requiring professional periodontal evaluation.',
      impact: 'moderate',
    });
  }

  // Tooth Pain
  const hasToothPain = profile.toothPain || concerns.some((c) => c.type === 'tooth_pain');
  if (hasToothPain) {
    riskScore += 20;
    findings.push({
      title: 'Dental Pain / Odontogenic Ache',
      description: 'Tooth pain when biting, chewing, or at rest suggests possible deep caries, cracked tooth syndrome, or pulpitis requiring clinical and radiographic dental examination.',
      impact: 'moderate',
    });
  }

  // Tooth Sensitivity
  const hasSensitivity = profile.toothSensitivity || concerns.some((c) => c.type === 'tooth_sensitivity');
  if (hasSensitivity) {
    riskScore += 10;
    findings.push({
      title: 'Dentine Hypersensitivity / Enamel Wear',
      description: 'Sensitivity to cold, hot, or sweet stimuli often indicates enamel erosion, exposed root surfaces, or early cavitation.',
      impact: 'moderate',
    });
  }

  // Tooth Decay / Cavity
  const hasDecay = profile.toothDecay || concerns.some((c) => c.type === 'tooth_decay_cavity');
  if (hasDecay) {
    riskScore += 22;
    findings.push({
      title: 'Dental Caries / Cavity Formation',
      description: 'Reported cavity or visible discoloration in tooth enamel requires prompt restorative intervention to prevent pulpal necrosis.',
      impact: 'moderate',
    });
  }

  // Bad Breath / Halitosis
  const hasBadBreath = profile.badBreath || concerns.some((c) => c.type === 'bad_breath_halitosis');
  if (hasBadBreath) {
    riskScore += 8;
    findings.push({
      title: 'Chronic Halitosis / Oral Biofilm',
      description: 'Persistent oral odor may stem from bacterial coating on the tongue, periodontal pockets, or xerostomia.',
      impact: 'benign',
    });
  }

  // Oral / Facial Swelling
  const hasOralSwelling = profile.oralSwelling || concerns.some((c) => c.type === 'oral_swelling');
  if (hasOralSwelling) {
    riskScore += 35;
    findings.push({
      title: 'Oral Soft Tissue Swelling / Suspected Abscess',
      description: 'Localized swelling in the gums or cheek may indicate an acute periapical or periodontal abscess requiring urgent in-person drainage and treatment.',
      impact: 'flag',
    });
  }

  // Jaw / Facial Pain (TMJ)
  const hasJawPain = profile.jawPain || concerns.some((c) => c.type === 'jaw_facial_pain');
  if (hasJawPain) {
    riskScore += 12;
    findings.push({
      title: 'Temporomandibular Joint / Masticatory Strain',
      description: 'Jaw pain, clicking, or stiffness upon opening may indicate TMJ dysfunction or nocturnal bruxism.',
      impact: 'moderate',
    });
  }

  // 3. Lesion / Ulcer & Duration Check (Mucosal Risk)
  if (profile.hasLesionOrUlcer === true || concerns.some((c) => c.type === 'lesion_ulcer')) {
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

  // 4. Mucosal Color Changes (Leukoplakia / Erythroplakia)
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

  // 5. Structural & Functional Red Flags
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

  if (profile.soreBleeding === true) {
    riskScore += 20;
    findings.push({
      title: 'Bleeding from Oral Sore',
      description: 'Contact or spontaneous bleeding directly from an oral lesion or ulcer requires evaluation to assess mucosal fragility.',
      impact: 'flag',
    });
  } else if (profile.unexplainedBleeding && !hasGumBleeding) {
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

  // 6. Carcinogenic Habits & Exposures
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
    riskScore = Math.max(riskScore, 75);
  }

  // 7. Calculate Care Level & Recommended Professional
  let careLevel: CareLevel = 'Routine';
  let recommendedProfessional: RecommendedProfessional = 'General Dentist';
  let screeningConcern: ScreeningConcernLevel = 'LOW SCREENING CONCERN';
  let level: RiskLevel = 'low';
  let recommendation = '';
  let suggestedTimeframe = '';

  const isHindi = profile.detectedLanguage === 'hi';
  const isMarathi = profile.detectedLanguage === 'mr';

  if (profile.emergencyFlagTriggered) {
    careLevel = 'Emergency';
    recommendedProfessional = 'Emergency Department';
    screeningConcern = 'HIGH SCREENING CONCERN';
    level = 'high';
    suggestedTimeframe = isHindi ? 'तत्काल / 24 घंटे के भीतर' : isMarathi ? 'तातडीने / २४ तासांच्या आत' : 'Immediate / Within 24 hours';
    recommendation = isHindi
      ? 'तत्काल चिकित्सकीय सहायता की आवश्यकता: सांस लेने या निगलने में गंभीर समस्या अथवा तीव्र रक्तस्त्राव। कृपया तुरंत आपातकालीन अस्पताल जाएं।'
      : isMarathi
      ? 'तातडीची वैद्यकीय मदत आवश्यक: श्वास घेण्यास किंवा गिळण्यास गंभीर अडचण. कृपया त्वरित जवळच्या आपत्कालीन रुग्णालयात जा.'
      : 'EMERGENCY MEDICAL ATTENTION REQUIRED: Severe airway compromise, rapid swelling, or uncontrollable bleeding. Proceed to an emergency department immediately.';
  } else if (hasOralSwelling || (hasToothPain && profile.pain)) {
    careLevel = 'Urgent';
    recommendedProfessional = 'General Dentist';
    screeningConcern = 'MODERATE SCREENING CONCERN';
    level = 'medium';
    suggestedTimeframe = isHindi ? '24 से 48 घंटे के भीतर' : isMarathi ? '२४ ते ४८ तासांच्या आत' : 'Within 24 to 48 hours';
    recommendation = isHindi
      ? 'शीघ्र दंत परीक्षण आवश्यक: दांत में तेज दर्द या मसूड़े/गाल में सूजन का तुरंत दंत चिकित्सक से निदान व उपचार कराएं।'
      : isMarathi
      ? 'त्वरित दंत तपासणी आवश्यक: दातात तीव्र वेदना किंवा सूज यासाठी त्वरित दंतवैद्यांकडून उपचार घ्या.'
      : 'URGENT DENTAL EVALUATION RECOMMENDED: Acute toothache or soft tissue swelling requires prompt clinical and radiographic evaluation to treat possible abscess or infection.';
  } else if (
    riskScore >= 45 ||
    (profile.durationOverTwoWeeks && (profile.hasLesionOrUlcer || profile.colorChanges === 'red' || profile.reducedMouthOpening || profile.neckLumpOrSwelling))
  ) {
    careLevel = 'Prompt evaluation';
    recommendedProfessional = profile.neckLumpOrSwelling || profile.persistentHoarseness ? 'ENT Specialist' : 'Oral & Maxillofacial Specialist';
    screeningConcern = 'HIGH SCREENING CONCERN';
    level = 'high';
    suggestedTimeframe = isHindi ? '7 से 14 दिनों के भीतर' : isMarathi ? '७ ते १४ दिवसांच्या आत' : 'Within 7 to 14 days';
    recommendation = isHindi
      ? 'विशेषज्ञ चिकित्सकीय जाँच की सलाह: 2 सप्ताह से अधिक समय से बने रहने वाले बदलाव या प्रमुख जोखिम कारकों के लिए ओरल सर्जन या ईएनटी विशेषज्ञ से परामर्श लें।'
      : isMarathi
      ? 'तज्ज्ञ डॉक्टरांकडून तपासणीचा सल्ला: २ आठवड्यांपेक्षा जास्त काळ टिकणारे बदल किंवा धोक्याच्या घटकांसाठी ओरल सर्जन किंवा ईएनटी तज्ज्ञांकडून तपासणी करून घ्या.'
      : 'PROMPT PROFESSIONAL EVALUATION RECOMMENDED: Persistent mucosal changes (> 14 days) or major clinical risk indicators warrant in-person examination by an Oral Specialist or ENT.';
  } else if (
    hasGumBleeding ||
    hasSensitivity ||
    hasDecay ||
    hasBadBreath ||
    hasJawPain ||
    profile.hasLesionOrUlcer ||
    profile.colorChanges === 'white' ||
    (profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none') ||
    (profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none')
  ) {
    careLevel = 'Needs dental evaluation';
    recommendedProfessional = hasGumBleeding && !hasDecay ? 'Periodontist' : 'General Dentist';
    screeningConcern = 'MODERATE SCREENING CONCERN';
    level = 'medium';
    suggestedTimeframe = isHindi ? '2 से 3 सप्ताह के भीतर' : isMarathi ? '२ ते ३ आठवड्यांच्या आत' : 'Within 2 to 3 weeks';
    recommendation = isHindi
      ? 'दंत परीक्षण की सलाह: मसूड़ों से खून आना, दांत में संवेदनशीलता या तंबाकू के उपयोग के लिए दंत चिकित्सक से परीक्षण व परामर्श लें।'
      : isMarathi
      ? 'दंत तपासणीचा सल्ला: हिरड्यांमधून रक्त येणे, संवेदनशीलता किंवा तंबाखूच्या सवयींसाठी दंतवैद्यांकडून तपासणी करून घ्या.'
      : 'DENTAL EVALUATION RECOMMENDED: Notable oral health indicators (e.g. gingival bleeding, sensitivity, caries, or tobacco exposure) should be evaluated by a dental professional.';
  } else {
    careLevel = 'Routine';
    recommendedProfessional = 'General Dentist';
    screeningConcern = 'LOW SCREENING CONCERN';
    level = 'low';
    suggestedTimeframe = isHindi ? 'नियमित दंत जाँच (प्रत्येक 6 महीने में)' : isMarathi ? 'नियमित दंत तपासणी (दर ६ महिन्यांनी)' : 'Routine dental checkup (every 6 months)';
    recommendation = isHindi
      ? 'कम स्क्रीनिंग संकेत: कोई तीव्र चेतावनी लक्षण नहीं मिला। हर 6 महीने में नियमित दंत परीक्षण और दैनिक मुख स्वच्छता बनाए रखें।'
      : isMarathi
      ? 'कमी जोखीम संकेत: कोणतीही गंभीर लक्षणे आढळली नाहीत. दर ६ महिन्यांनी नियमित दंत तपासणी आणि मुख स्वच्छता राखा.'
      : 'ROUTINE PREVENTIVE CARE: No acute red flags identified. Maintain good oral hygiene, monthly self-checks, and biannual dental prophylaxis.';
  }

  if (findings.length === 0) {
    findings.push({
      title: isHindi ? 'कोई तीव्र म्यूकोसल लक्षण नहीं पाए गए' : isMarathi ? 'कोणतीही तीव्र लक्षणे आढळली नाहीत' : 'No Acute Symptoms Reported',
      description: isHindi ? 'आपके उत्तरों में लगातार बने रहने वाले छाले, मसूड़ों से रक्तस्त्राव या दांत में दर्द नहीं बताया गया है।' : isMarathi ? 'आपल्या उत्तरांनुसार सतत राहणारे फोड, हिरड्यांमधून रक्त किंवा दातदुखी नाही.' : 'Your self-reported answers indicate no active ulcers, bleeding gums, or acute tooth pain.',
      impact: 'benign',
    });
  }

  // Construct Personalized Plain-Language Explanation
  const userFactSnippets: string[] = [];
  if (hasGumBleeding) userFactSnippets.push(isHindi ? 'मसूड़ों से खून आना' : isMarathi ? 'हिरड्यांमधून रक्त येणे' : 'bleeding gums when brushing');
  if (hasToothPain) userFactSnippets.push(isHindi ? 'दांत में दर्द' : isMarathi ? 'दात दुखणे' : 'toothache/dental pain');
  if (hasSensitivity) userFactSnippets.push(isHindi ? 'ठंडे/गर्म की संवेदनशीलता' : isMarathi ? 'थंड/गरम झणझणाट' : 'tooth sensitivity');
  if (hasDecay) userFactSnippets.push(isHindi ? 'दांत में कीड़ा/सड़न' : isMarathi ? 'दातात कीड' : 'possible tooth decay/cavity');
  if (hasOralSwelling) userFactSnippets.push(isHindi ? 'मुँह में सूजन' : isMarathi ? 'तोंडात सूज' : 'oral soft tissue swelling');
  if (hasJawPain) userFactSnippets.push(isHindi ? 'जबड़े में दर्द' : isMarathi ? 'जबड्यात वेदना' : 'jaw/TMJ pain');
  if (profile.hasLesionOrUlcer === true) {
    if (profile.durationOverTwoWeeks === true) {
      userFactSnippets.push(isHindi ? 'मुँह का छाला जो 2 सप्ताह से अधिक से है' : isMarathi ? 'तोंडातील फोड जे २ आठवड्यांपेक्षा जास्त आहे' : 'a mouth sore/ulcer persisting > 2 weeks');
    } else {
      userFactSnippets.push(isHindi ? 'हाल ही का मुँह का छाला' : isMarathi ? 'नुकताच झालेला तोंडातील फोड' : 'a recent mouth sore/ulcer');
    }
  }
  if (profile.primarySymptomLocation) {
    userFactSnippets.push(isHindi ? `${profile.primarySymptomLocation} पर स्थिति` : isMarathi ? `${profile.primarySymptomLocation} येथे` : `at ${profile.primarySymptomLocation}`);
  }
  if (profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none') {
    userFactSnippets.push(isHindi ? `${profile.tobaccoSmokeless} का सेवन` : isMarathi ? `${profile.tobaccoSmokeless} चे सेवन` : `use of ${profile.tobaccoSmokeless}`);
  }
  if (profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none') {
    userFactSnippets.push(isHindi ? `धूम्रपान (${profile.tobaccoSmoked})` : isMarathi ? `धूम्रपान (${profile.tobaccoSmoked})` : `smoking ${profile.tobaccoSmoked}`);
  }

  const summaryOfFindings = userFactSnippets.length > 0
    ? (isHindi
        ? `आपने बताया: ${userFactSnippets.join(', ')}। ये विशिष्ट विवरण आपके मूल्यांकन का आधार हैं।`
        : isMarathi
        ? `आपण नमूद केले: ${userFactSnippets.join(', ')}. हे तपशील आपल्या निष्कर्षांचा मुख्य आधार आहेत.`
        : `You reported ${userFactSnippets.join(', ')}. These details form the basis of your ${careLevel.toLowerCase()} triage guidance.`)
    : (isHindi
        ? 'आपने मुँह में किसी सक्रिय घाव, रक्तस्त्राव या दर्द की सूचना नहीं दी है।'
        : isMarathi
        ? 'आपण तोंडात कोणताही सक्रिय फोड, रक्तस्त्राव किंवा वेदनेची नोंद केलेली नाही.'
        : 'You reported no active oral sores, bleeding, or dental pain.');

  // Recommended Next Steps & Questions for the Doctor
  const nextSteps: string[] = [
    `Schedule an appointment with a ${recommendedProfessional} (${suggestedTimeframe}).`,
    'Avoid self-medicating with caustic topical remedies or rubbing tobacco/pain balm on soft tissues.',
    hasGumBleeding ? 'Use a soft-bristled toothbrush and gentle circular motions; do not skip brushing due to bleeding.' : 'Maintain gentle, thorough twice-daily tooth brushing and daily flossing.',
    profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none' ? 'Initiate tobacco reduction or cessation; view our personalized Cessation Plan.' : 'Continue avoiding tobacco and betel nut products.',
    'If new symptoms like difficulty swallowing, severe jaw swelling, or rapid worsening occur, seek immediate emergency care.',
  ];

  const patientQuestions: string[] = [
    hasGumBleeding ? 'Are my bleeding gums caused by plaque/tartar buildup, or is there bone loss (periodontitis)?' : 'Do you recommend professional dental cleaning or scaling at this visit?',
    profile.hasLesionOrUlcer ? 'Does this ulcer/sore show signs of irritation from a sharp tooth, or should it be biopsied?' : 'Did you notice any unusual mucosal patches or suspicious tissue in my mouth?',
    hasToothPain || hasSensitivity ? 'Is there any hidden cavity between my teeth, and do I need a digital dental X-ray?' : 'Are my teeth showing signs of enamel wear or nighttime grinding?',
    'What preventive dental hygiene routine do you recommend for my mouth?',
  ];

  // Helper for confirmed vs unassessed status in clinical summary
  const getConfirmedFieldDisplay = (val: boolean | undefined, positiveLabel: string, negativeLabel: string) => {
    if (val === true) return `YES — ${positiveLabel}`;
    if (val === false) return `NO — ${negativeLabel}`;
    return 'Not assessed / Not reported';
  };

  // Build Structured Clinical Handoff (Doctor Summary)
  const doctorSummaryText = `ORALGUARD AI — CLINICAL PATIENT SCREENING & CARE HANDOFF
==================================================
Generated by OralGuard AI screening prototype for clinical handoff reference only. Not a definitive diagnosis.
Date/Time: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}

1. PATIENT PROFILE:
- Age: ${profile.age || 'Not specified (Adult)'}
- Sex: ${profile.gender || 'Not specified'}
- Preferred Language: ${profile.detectedLanguage === 'hi' ? 'Hindi (हिन्दी)' : profile.detectedLanguage === 'mr' ? 'Marathi (मराठी)' : 'English'}

2. CHIEF COMPLAINTS & IDENTIFIED CLINICAL CONCERNS:
- Primary Complaint: ${profile.mainConcern || 'Comprehensive oral health screening'}
- Primary Anatomical Site: ${profile.primarySymptomLocation || (profile.affectedRegions && profile.affectedRegions.length > 0 ? profile.affectedRegions.join(', ') : 'Oral cavity (general)')}
${concerns.map((c, i) => `  [Concern ${i + 1}] ${c.title || c.type.replace(/_/g, ' ').toUpperCase()}: ${c.description}${c.locations && c.locations.length > 0 ? ` (Locations: ${c.locations.join(', ')})` : ''}`).join('\n')}
${profile.mouthMapLocations && profile.mouthMapLocations.length > 0 ? `- Confirmed Mouth Map Sites (${profile.mouthMapLocations.length}): ${profile.mouthMapLocations.map(l => `${l.area} [${l.id}]`).join(', ')}\n` : ''}${profile.photoDocumentation && profile.photoDocumentation.length > 0 ? `- Documented Oral Photos: ${profile.photoDocumentation.length} photo(s) attached for reference\n` : ''}${profile.symptomProgress && profile.symptomProgress.length > 0 ? `- Longitudinal Progress Entries: ${profile.symptomProgress.length} entry/entries recorded\n` : ''}
3. SYMPTOMS & CLINICAL INDICATORS:
- Gingival Bleeding: ${getConfirmedFieldDisplay(profile.gumBleeding, 'Bleeding reported (e.g. during brushing)', 'No gum bleeding')}
- Tooth Pain / Ache: ${getConfirmedFieldDisplay(profile.toothPain, 'Odontogenic pain reported', 'No toothache reported')}
- Dentine Hypersensitivity: ${getConfirmedFieldDisplay(profile.toothSensitivity, 'Sensitivity to cold/hot/sweets', 'No sensitivity')}
- Possible Caries / Cavity: ${getConfirmedFieldDisplay(profile.toothDecay, 'Suspected decay or tooth hole', 'No cavity reported')}
- Soft Tissue Swelling: ${getConfirmedFieldDisplay(profile.oralSwelling, 'Oral swelling / abscess suspected', 'No oral swelling')}
- Oral Sore / Ulcer: ${getConfirmedFieldDisplay(profile.hasLesionOrUlcer, 'Active sore or ulcer reported', 'No active ulcer')}
- Mucosal Patch / Discoloration: ${profile.colorChanges && profile.colorChanges !== 'none' ? `${profile.colorChanges.toUpperCase()} mucosal patch` : profile.colorChanges === 'none' ? 'Confirmed None (No discoloration)' : 'Not assessed'}
- Palpable Lump / Thickening: ${getConfirmedFieldDisplay(profile.thickeningOrLump, 'Submucosal firmness or lump', 'No lump/thickening')}
- Sensation (Pain/Burning): ${getConfirmedFieldDisplay(profile.mouthPainOrBurning, 'Pain or burning with spicy food/eating', 'No pain/burning')}
- Mouth Opening (Trismus): ${getConfirmedFieldDisplay(profile.reducedMouthOpening, 'RESTRICTED mouth opening (OSMF/TMJ suspected)', 'Normal mouth opening')}
- Swallowing Function: ${getConfirmedFieldDisplay(profile.difficultySwallowing, 'Difficulty swallowing (Dysphagia)', 'Normal swallowing')}
- Regional Neck Nodes: ${getConfirmedFieldDisplay(profile.neckLumpOrSwelling, 'Palpable neck swelling reported', 'No neck mass reported')}

4. DURATION & CHRONICITY:
- Duration: ${profile.duration && profile.duration !== 'unknown' ? profile.duration.replace(/_/g, ' ').toUpperCase() : profile.durationOverTwoWeeks === true ? 'MORE THAN 2 WEEKS' : profile.durationOverTwoWeeks === false ? 'LESS THAN 2 WEEKS' : 'Not specified / Unknown'}
- Persisting > 14 Days: ${profile.durationOverTwoWeeks === true ? 'YES (High Clinical Significance)' : profile.durationOverTwoWeeks === false ? 'No (< 14 days)' : 'Unknown'}

5. HABITS & CHEMICAL EXPOSURES:
- Smokeless Tobacco (Gutka / Khaini / Zarda): ${profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none' ? `${profile.tobaccoSmokeless.toUpperCase()} (Reported)` : profile.tobaccoSmokeless === 'none' ? 'Confirmed None' : 'Not assessed'}
- Smoked Tobacco (Bidi / Cigarettes): ${profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none' ? `${profile.tobaccoSmoked.toUpperCase()}${profile.tobaccoFrequency ? ` (${profile.tobaccoFrequency})` : ''}` : profile.tobaccoSmoked === 'none' ? 'Confirmed Non-smoker' : 'Not assessed'}
- Areca / Betel Nut (Supari / Paan): ${profile.arecaOrBetelNut && profile.arecaOrBetelNut !== 'none' ? `${profile.arecaOrBetelNut.toUpperCase()} (Reported)` : profile.arecaOrBetelNut === 'none' ? 'Confirmed None' : 'Not assessed'}
- Alcohol Intake: ${profile.alcoholIntake === 'none' || profile.alcoholUse === 'none' ? 'Confirmed None' : profile.alcoholIntake ? `${profile.alcoholIntake.toUpperCase()}` : 'Not assessed'}
- Mechanical Irritation: ${profile.chronicIrritation ? 'YES (Sharp tooth or ill-fitting prosthesis)' : 'No'}

6. TRIAGE INDICATION & CLINICAL NEXT STEPS:
- Care Level: ${careLevel.toUpperCase()}
- Recommended Provider: ${recommendedProfessional}
- Suggested Timeframe: ${suggestedTimeframe}
- Evaluation Recommendation: ${recommendation}

==================================================
MANDATORY CLINICAL DISCLAIMER:
This summary was generated by the OralGuard AI screening prototype for clinical handoff and educational triage only. It is not a medical diagnosis or treatment plan. A licensed dental or medical practitioner must perform an in-person visual, tactile, and radiographic examination.
==================================================`;

  return {
    riskLevel: level,
    careLevel,
    screeningConcern,
    recommendedProfessional,
    concerns,
    confidenceNotes: 'Evaluated across multi-concern oral health parameters including gingival status, dental pain, mucosal lesions, and habit history.',
    summaryOfFindings,
    keyFindings: findings,
    protectiveFactors: protective,
    recommendation,
    suggestedTimeframe,
    nextSteps,
    patientQuestions,
    disclaimer: 'OralGuard AI provides health screening and risk-triage guidance only, not a definitive medical or dental diagnosis. Consult a qualified dentist or doctor for an in-person examination.',
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

export const INITIAL_BOT_MESSAGE_MR = {
  id: 'msg-1-mr',
  role: 'assistant' as const,
  content: `नमस्कार 👋\nमी ओरलगार्ड एआय (OralGuard AI) आहे. मी तोंडाच्या आरोग्याविषयी (oral mucosal health) जनजागृती आणि प्राथमिक तोंडाच्या कर्करोगाच्या जोखीम तपासणीमध्ये मदत करण्यासाठी उपलब्ध आहे.\n\nमी एक प्राथमिक शैक्षणिक स्क्रीनिंग टूल आहे आणि कर्करोगाचे निदान करत नाही. आपल्या लक्षणांचे आणि सवयींचे मूल्यांकन करून डॉक्टरांकडून तपासणी करून घेणे आवश्यक आहे का, याचे मार्गदर्शन मी करेन.\n\nकृपया आपल्या शब्दांत सांगा की आपल्याला तोंडात काय त्रास किंवा बदल जाणवत आहे?`,
  timestamp: 'Just now',
  quickReplies: [
    'तोंडात फोड / जखम (ulcer) आहे',
    'पांढरा किंवा लाल डाग (patch) आहे',
    'दररोज गुटखा / तंबाखूचे सेवन',
    'तोंड उघडण्यास त्रास होतो',
    'नियमित तपासणी, कोणतीही लक्षणे नाहीत',
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

  // 1. Symptoms: Ulcer/sore, patch, lump, bleeding, or explicitly no symptoms / routine checkup
  const hasActiveConcerns = Boolean(profile.concerns && profile.concerns.length > 0);
  const isLesionPresent = Boolean(
    profile.hasLesionOrUlcer ||
    (profile.colorChanges && profile.colorChanges !== 'none') ||
    profile.thickeningOrLump ||
    profile.concerns?.some((c) => c.type === 'lesion_ulcer' || c.type === 'color_change' || c.type === 'lump_thickening')
  );

  const symptomsAnswered = Boolean(
    hasActiveConcerns ||
    profile.hasLesionOrUlcer !== undefined ||
    (profile.colorChanges !== undefined && profile.colorChanges !== 'none') ||
    profile.thickeningOrLump !== undefined
  );

  let symptomsDisplay = 'Pending';
  if (profile.concerns && profile.concerns.length > 1) {
    symptomsDisplay = profile.concerns.map((c) => c.description).join('; ');
  } else if (profile.hasLesionOrUlcer) {
    symptomsDisplay = 'Mouth sore or ulcer reported';
  } else if (profile.colorChanges && profile.colorChanges !== 'none') {
    symptomsDisplay = `${profile.colorChanges} mucosal discoloration`;
  } else if (profile.thickeningOrLump) {
    symptomsDisplay = 'Palpable lump or mucosal thickening';
  } else if (profile.hasLesionOrUlcer === false) {
    symptomsDisplay = 'No mouth sores or active lesions reported';
  } else if (hasActiveConcerns && profile.concerns) {
    symptomsDisplay = profile.concerns[0].description;
  }

  // 2. Mouth Location:
  // If no lesion is present, location is automatically marked not applicable / complete
  const lesionConcern = profile.concerns?.find((c) => c.type === 'lesion_ulcer' || c.type === 'color_change');
  const concernHasLocation = Boolean(lesionConcern && lesionConcern.locations && lesionConcern.locations.length > 0);

  const locationAnswered = !isLesionPresent || Boolean(
    concernHasLocation ||
    profile.primarySymptomLocation ||
    (profile.affectedRegions && profile.affectedRegions.length > 0)
  );

  let locationDisplay = 'Pending';
  if (!isLesionPresent) {
    locationDisplay = 'Not applicable (no lesions reported)';
  } else if (profile.primarySymptomLocation) {
    locationDisplay = profile.primarySymptomLocation;
  } else if (concernHasLocation && lesionConcern) {
    locationDisplay = lesionConcern.locations.join(', ');
  } else if (profile.affectedRegions && profile.affectedRegions.length > 0) {
    locationDisplay = profile.affectedRegions.join(', ');
  }

  // 3. Duration:
  // If no lesion is present, duration is automatically marked not applicable / complete
  const concernHasDuration = Boolean(
    lesionConcern && (lesionConcern.duration || lesionConcern.durationCategory || lesionConcern.durationOverTwoWeeks !== undefined)
  );

  const durationAnswered = !isLesionPresent || Boolean(
    concernHasDuration ||
    profile.duration !== undefined ||
    profile.durationCategory !== undefined ||
    profile.durationOverTwoWeeks !== undefined
  );

  let durationDisplay = 'Pending';
  if (!isLesionPresent) {
    durationDisplay = 'Not applicable (no lesions reported)';
  } else if (profile.durationText) {
    durationDisplay = profile.durationText;
  } else if (concernHasDuration && lesionConcern?.durationText) {
    durationDisplay = lesionConcern.durationText;
  } else if (profile.duration) {
    durationDisplay = profile.duration.replace(/_/g, ' ');
  } else if (profile.durationOverTwoWeeks !== undefined) {
    durationDisplay = profile.durationOverTwoWeeks ? 'More than 2 weeks' : 'Less than 2 weeks';
  } else if (concernHasDuration && lesionConcern?.durationOverTwoWeeks !== undefined) {
    durationDisplay = lesionConcern.durationOverTwoWeeks ? 'More than 2 weeks' : 'Less than 2 weeks';
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
