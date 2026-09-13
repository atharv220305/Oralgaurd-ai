/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Specialized Knowledge and Context-Aware Q&A Engine for Ask OralGuard
 * Strictly non-diagnostic, educational, empathetic, and multilingual (en, hi, mr).
 */

import { PatientProfile, AppLanguage } from '../types';

export interface AskAnswerResult {
  reply: string;
  suggestedQuestions: string[];
  isEmergencyAlert?: boolean;
  relatedTopic?: string;
}

export interface SuggestedTopic {
  id: string;
  label: string;
  labelHi: string;
  labelMr: string;
  query: string;
}

export const SUGGESTED_TOPICS: SuggestedTopic[] = [
  {
    id: 'ulcer_causes',
    label: 'Why do mouth ulcers happen?',
    labelHi: 'मुँह में छाले क्यों होते हैं?',
    labelMr: 'तोंडात फोड / अल्सर का होतात?',
    query: 'What causes mouth ulcers and when should I worry?',
  },
  {
    id: 'two_week_rule',
    label: 'What is the 2-week rule?',
    labelHi: '2-सप्ताह का नियम क्या है?',
    labelMr: '२ आठवड्यांचा नियम काय आहे?',
    query: 'Why is a mouth sore lasting more than 2 weeks significant?',
  },
  {
    id: 'gutka_supari',
    label: 'Gutka & Supari risks',
    labelHi: 'गुटखा और सुपारी के खतरे',
    labelMr: 'गुटखा व सुपारीचे धोके',
    query: 'How do gutka, khaini, and supari damage mouth tissues?',
  },
  {
    id: 'osmf_trismus',
    label: 'Reduced mouth opening (OSMF)',
    labelHi: 'मुँह कम खुलना (OSMF क्या है?)',
    labelMr: 'तोंड कमी उघडणे (OSMF म्हणजे काय?)',
    query: 'What causes reduced mouth opening and burning sensation?',
  },
  {
    id: 'white_red_patches',
    label: 'White or red patches in mouth',
    labelHi: 'मुँह में सफेद या लाल पैच',
    labelMr: 'तोंडात पांढरे किंवा लाल डाग',
    query: 'What are white or red patches in the mouth?',
  },
  {
    id: 'dentist_questions',
    label: 'What to ask my dentist?',
    labelHi: 'दंत चिकित्सक से क्या पूछें?',
    labelMr: 'दंतवैद्यांना काय विचारावे?',
    query: 'What questions should I ask my doctor or dentist during an oral examination?',
  },
];

export function getStarterQuestions(lang: AppLanguage = 'en'): string[] {
  if (lang === 'hi') {
    return [
      'मुँह के छाले सामान्यतः कितने दिन में ठीक होते हैं?',
      'गुटखा या खैनी छोड़ने से क्या मुँह के ऊतक ठीक हो सकते हैं?',
      'मुँह कम खुलने और तीखा लगने का क्या कारण है?',
      'डॉक्टर मुँह की बायोप्सी या जांच कैसे करते हैं?',
    ];
  }
  if (lang === 'mr') {
    return [
      'तोंडातील फोड साधारणपणे किती दिवसांत बरे होतात?',
      'तंबाखू किंवा गुटखा सोडल्याने तोंडाचे आरोग्य सुधारते का?',
      'तोंड कमी उघडणे आणि तिखट खाताना जळजळ होणे कशामुळे होते?',
      'दंततज्ज्ञ तोंडाची तपासणी कशी करतात?',
    ];
  }
  return [
    'How long does a normal mouth ulcer take to heal?',
    'How do gutka and areca nut affect the mouth lining?',
    'What causes reduced mouth opening and burning sensation?',
    'What should I expect during an in-person oral mucosa checkup?',
  ];
}

/**
 * Checks for acute life-threatening emergency signs
 */
function checkForEmergencySymptoms(lower: string): boolean {
  return (
    lower.includes('choking') ||
    lower.includes('cannot breathe') ||
    lower.includes('cant breathe') ||
    lower.includes('breathless') ||
    lower.includes('heavy bleeding') ||
    lower.includes('gushing blood') ||
    lower.includes('cannot swallow saliva') ||
    lower.includes('cant swallow saliva') ||
    lower.includes('swelling in airway') ||
    lower.includes('सांस नहीं आ रही') ||
    lower.includes('सांस लेने में तकलीफ') ||
    lower.includes('खून बह रहा') ||
    lower.includes('श्वास घेण्यास त्रास') ||
    lower.includes('रक्तस्राव')
  );
}

/**
 * Generates an educational, context-aware reply to user questions in Ask OralGuard.
 */
export function generateAskOralGuardReply(
  userQuery: string,
  profile: PatientProfile,
  lang: AppLanguage = 'en'
): AskAnswerResult {
  const queryLower = userQuery.toLowerCase().trim();

  // 1. Emergency Safety Intercept
  if (checkForEmergencySymptoms(queryLower)) {
    if (lang === 'hi') {
      return {
        reply:
          '⚠️ **आपातकालीन चेतावनी**: आपने सांस लेने में रुकावट, अत्यधिक रक्तस्राव या लार निगलने में असमर्थता जैसे गंभीर लक्षण बताए हैं। यह एक मेडिकल इमरजेंसी हो सकती है। कृपया तुरंत 112 / 108 डायल करें या निकटतम आपातकालीन अस्पताल (Emergency Room) में जाएं।',
        suggestedQuestions: ['आपातकालीन दिशा-निर्देश देखें', 'नजदीकी अस्पताल खोजें'],
        isEmergencyAlert: true,
      };
    }
    if (lang === 'mr') {
      return {
        reply:
          '⚠️ **तातडीची चेतावणी**: आपण श्वास घेण्यास अडथळा, तीव्र रक्तस्राव किंवा लाळ गिळण्यास असमर्थता यासारखी गंभीर लक्षणे विचारली आहेत. ही तातडीची वैद्यकीय आणीबाणी असू शकते. कृपया त्वरित ११२ / १०८ वर संपर्क साधा किंवा जवळच्या रुग्णालयात (Emergency Room) जा.',
        suggestedQuestions: ['तातडीची मदत पहा', 'जवळचे रुग्णालय शोधा'],
        isEmergencyAlert: true,
      };
    }
    return {
      reply:
        '⚠️ **URGENT EMERGENCY NOTICE**: You have described symptoms indicating acute airway compromise, severe bleeding, or inability to manage saliva. Please seek immediate emergency medical care or dial 112 / 911 / emergency services without delay.',
      suggestedQuestions: ['View Emergency Guidance', 'Find Nearest Hospital'],
      isEmergencyAlert: true,
    };
  }

  // 2. Off-topic check (e.g. asking about coding, cars, sports, completely unrelated body parts)
  const isOffTopic =
    (queryLower.includes('weather') ||
      queryLower.includes('cricket') ||
      queryLower.includes('football') ||
      queryLower.includes('stock market') ||
      queryLower.includes('bitcoin') ||
      queryLower.includes('python code') ||
      queryLower.includes('javascript') ||
      queryLower.includes('knee replacement') ||
      queryLower.includes('back ache')) &&
    !queryLower.includes('mouth') &&
    !queryLower.includes('teeth') &&
    !queryLower.includes('oral') &&
    !queryLower.includes('tongue') &&
    !queryLower.includes('gum');

  if (isOffTopic) {
    if (lang === 'hi') {
      return {
        reply:
          'मैं विशेष रूप से मुँह के स्वास्थ्य, मुँह के छाले, सफेद/लाल पैच, तंबाकू व सुपारी मुक्ति, और दंत स्वच्छता संबंधी प्रश्नों के लिए डिज़ाइन किया गया AI सहायक हूँ। कृपया मुँह या गले से जुड़े स्वास्थ्य प्रश्न पूछें।',
        suggestedQuestions: [
          'मुँह के छाले कितने दिन में ठीक होते हैं?',
          'गुटखा छोड़ने के क्या फायदे हैं?',
          '2-सप्ताह का नियम क्या है?',
        ],
      };
    }
    if (lang === 'mr') {
      return {
        reply:
          'मी प्रामुख्याने तोंडाचे आरोग्य, तोंडातील फोड, पांढरे/लाल डाग, तंबाखू व गुटखा मुक्ती, आणि दंत स्वच्छतेविषयी माहिती देण्यासाठी तयार केलेला AI सहाय्यक आहे. कृपया तोंडाच्या आरोग्याशी संबंधित प्रश्न विचारा.',
        suggestedQuestions: [
          'तोंडातील फोड किती दिवसांत बरे होतात?',
          'तंबाखू सोडण्याचे काय फायदे आहेत?',
          '२ आठवड्यांचा नियम काय आहे?',
        ],
      };
    }
    return {
      reply:
        'I am an AI assistant specialized specifically in oral mucosal health, mouth ulcers, white/red patches, tobacco and areca nut cessation, and dental care. Please feel free to ask any question regarding mouth or dental health.',
      suggestedQuestions: [
        'Why is a 2-week mouth sore significant?',
        'How does quitting gutka help the mouth?',
        'What causes white patches in the mouth?',
      ],
    };
  }

  // Build context preamble if patient profile has confirmed findings
  let contextualNote = '';
  if (profile.hasLesionOrUlcer && profile.primarySymptomLocation) {
    if (lang === 'hi') {
      contextualNote = `*(आपकी स्क्रीनिंग जानकारी के अनुसार: आपने ${profile.primarySymptomLocation} पर छाले/लक्षण की जानकारी दी है।)*\n\n`;
    } else if (lang === 'mr') {
      contextualNote = `*(आपल्या तपासणी माहितीनुसार: आपण ${profile.primarySymptomLocation} येथे फोड/लक्षणाची नोंद केली आहे.)*\n\n`;
    } else {
      contextualNote = `*(Based on your screening details: you noted a concern involving the ${profile.primarySymptomLocation}.)*\n\n`;
    }
  }

  // Topic matchers:

  // 1. Two-Week Rule / Non-healing ulcers
  if (
    queryLower.includes('2 week') ||
    queryLower.includes('two week') ||
    queryLower.includes('2 hafta') ||
    queryLower.includes('do hafte') ||
    queryLower.includes('non-healing') ||
    queryLower.includes('not healing') ||
    queryLower.includes('duration') ||
    queryLower.includes('2 आठवडे') ||
    queryLower.includes('२ आठवडे') ||
    queryLower.includes('२ सप्ताह')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          contextualNote +
          '**2-सप्ताह का नियम (The 2-Week Rule)** मुँह के स्वास्थ्य का एक अत्यंत महत्वपूर्ण क्लिनिकल मानक है:\n\n' +
          '• **सामान्य छाले (Aphthous Ulcers)**: साधारण चोट, तनाव या विटामिन की कमी से होने वाले छाले आमतौर पर 7 से 14 दिनों के भीतर अपने आप ठीक हो जाते हैं।\n' +
          '• **2 सप्ताह से अधिक समय**: यदि मुँह का कोई भी छाला, घाव या गांठ 2 सप्ताह (14 दिन) से अधिक समय तक बनी रहती है और ठीक नहीं हो रही है, तो उसकी दंत चिकित्सक (Dentist) या ईएनटी (ENT) विशेषज्ञ द्वारा व्यक्तिगत क्लिनिकल जांच अनिवार्य है।\n' +
          '• **कारण**: लंबे समय तक रहने वाले घाव क्रोनिक इरिटेशन (जैसे नुकीले दांत की रगड़), प्री-कैंसरस घाव, या अन्य म्यूकोसल विकारों का संकेत हो सकते हैं।',
        suggestedQuestions: [
          'मुँह के छाले होने पर क्या सावधानियां बरतें?',
          'दंत चिकित्सक से क्या पूछें?',
          'गुटखा और सुपारी के खतरे क्या हैं?',
        ],
        relatedTopic: 'two_week_rule',
      };
    }
    if (lang === 'mr') {
      return {
        reply:
          contextualNote +
          '**२ आठवड्यांचा नियम (The 2-Week Rule)** हा तोंडाच्या आरोग्याचा एक अत्यंत महत्त्वाचा वैद्यकीय नियम आहे:\n\n' +
          '• **सामान्य फोड (Aphthous Ulcers)**: दातांची हलकी इजा किंवा पोटाच्या उष्णतेमुळे होणारे सामान्य फोड ७ ते १४ दिवसांत आपोआप बरे होतात.\n' +
          '• **२ आठवड्यांपेक्षा जास्त काळ**: तोंडातील कोणताही फोड, व्रण किंवा गाठ २ आठवड्यांपेक्षा (१४ दिवस) जास्त काळ टिकून राहिली तर दंतवैद्य (Dentist) किंवा ईएनटी (ENT) तज्ज्ञांकडून प्रत्यक्ष तपासणी करून घेणे आवश्यक आहे.\n' +
          '• **महत्त्व**: दीर्घकाळ न भरणारे व्रण हे दातांचे घर्षण, तोंडातील संसर्ग किंवा प्राथमिक ऊती बदलांचे लक्षण असू शकतात.',
        suggestedQuestions: [
          'तोंडाचे फोड लवकर बरे करण्यासाठी काय करावे?',
          'दंतवैद्यांना काय विचारावे?',
          'तंबाखू व गुटख्याचे दुष्परिणाम काय आहेत?',
        ],
        relatedTopic: 'two_week_rule',
      };
    }
    return {
      reply:
        contextualNote +
        '**The 2-Week Rule** is a gold-standard oral health guideline:\n\n' +
        '• **Common Sores (Aphthous/Traumatic)**: Typical canker sores or minor bites usually resolve naturally within 7 to 14 days as mucosal cells regenerate.\n' +
        '• **Persistence Beyond 2 Weeks**: Any sore, ulcer, or lump in the mouth that persists past 14 days without clear improvement requires an in-person evaluation by a dental surgeon or ENT specialist.\n' +
        '• **Clinical Reason**: Non-healing lesions warrant direct visual inspection, palpation, and differentiation from persistent trauma (e.g. sharp molar), premalignant dysplasia, or other systemic conditions.',
      suggestedQuestions: [
        'What causes mouth ulcers?',
        'What happens during an oral biopsy?',
        'What questions should I ask my dentist?',
      ],
      relatedTopic: 'two_week_rule',
    };
  }

  // 2. OSMF & Reduced Mouth Opening / Burning Sensation
  if (
    queryLower.includes('opening') ||
    queryLower.includes('trismus') ||
    queryLower.includes('osmf') ||
    queryLower.includes('burning') ||
    queryLower.includes('spicy') ||
    queryLower.includes('mouth open') ||
    queryLower.includes('kam khulna') ||
    queryLower.includes('teekha') ||
    queryLower.includes('तिखट') ||
    queryLower.includes('जळजळ') ||
    queryLower.includes('तोंड उघडणे')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          contextualNote +
          '**मुँह कम खुलना और तीखा खाने पर जलन (OSMF की संभावना)**:\n\n' +
          '• **कारण**: सुपारी (Areca Nut / Supari), पान मसाला, या गुटखे का नियमित उपयोग मुँह के अंदरूनी गालों (Buccal Mucosa) में कोलेजन तंतुओं को सख्त और रेशेदार बना देता है। इसे **Oral Submucous Fibrosis (OSMF)** कहा जाता है।\n' +
          '• **प्रमुख लक्षण**: मुँह में 3-4 अंगुलियां न जा पाना, तीखा या गर्म खाना खाते ही तेज जलन होना, गालों का अंदर से सफेद या कड़ा महसूस होना, और जीभ बाहर निकालने में कठिनाई।\n' +
          '• **उपाय व कदम**: सबसे पहला और अनिवार्य कदम सुपारी और गुटखे का सेवन पूरी तरह बंद करना है। इसके अलावा दंत विशेषज्ञ से मिलकर फिजियोथेरेपी व दवाइयों से संबंधित परामर्श लें।',
        suggestedQuestions: [
          'गुटखा और सुपारी छोड़ने में मदद कैसे लें?',
          'मुँह के लिए कौन से व्यायाम मददगार हैं?',
          'दंत विशेषज्ञ से संपर्क करें',
        ],
        relatedTopic: 'osmf_trismus',
      };
    }
    if (lang === 'mr') {
      return {
        reply:
          contextualNote +
          '**तोंड कमी उघडणे आणि तिखट खाताना जळजळ (OSMF ची शक्यता)**:\n\n' +
          '• **कारण**: सुपारी, गुटखा, किंवा पान मसाल्याच्या नियमित वापरामुळे गालांच्या आतील त्वचेचे लवचिकता कमी होते आणि ते कडक होतात. या स्थितीला **Oral Submucous Fibrosis (OSMF)** म्हणतात.\n' +
          '• **लक्षणे**: तोंडात ३-४ बोटे न जाणे, तिखट किंवा गरम अन्न खाताना तीव्र जळजळ होणे, आणि गालांचा आतील भाग पांढरट व कडक होणे.\n' +
          '• **पुढील पाऊल**: सुपारी आणि तंबाखूचे सेवन त्वरित थांबवणे हा सर्वात महत्त्वाचा उपाय आहे. त्यानंतर दंततज्ज्ञांचा सल्ला घेऊन योग्य उपचार सुरू करावेत.',
        suggestedQuestions: [
          'व्यसनमुक्तीसाठी काय उपाय करावेत?',
          'तोंडाचे व्यायाम कोणते असतात?',
          'दंतवैद्यांची भेट कशी घ्यावी?',
        ],
        relatedTopic: 'osmf_trismus',
      };
    }
    return {
      reply:
        contextualNote +
        '**Reduced Mouth Opening & Burning Sensation (OSMF Awareness)**:\n\n' +
        '• **Underlying Cause**: Habitual consumption of areca nut (supari), pan masala, or smokeless tobacco triggers chronic inflammation, leading to fibrous collagen bands in the cheek lining known as **Oral Submucous Fibrosis (OSMF)**.\n' +
        '• **Recognizable Signs**: Inability to insert 3 to 4 fingers vertically between incisors, intolerance to normal spices (burning sensation), blanching of inner cheeks, and stiffening of the soft palate.\n' +
        '• **Actionable Next Steps**: Immediate total cessation of all areca nut and tobacco products halts disease progression. Consultation with an Oral Medicine specialist for mucosal therapy and jaw exercises is strongly advised.',
      suggestedQuestions: [
        'How to quit supari and tobacco?',
        'What is an oral medicine consultation?',
        'What is the 2-week rule?',
      ],
      relatedTopic: 'osmf_trismus',
    };
  }

  // 3. Gutka, Khaini, Bidi, Tobacco Cessation
  if (
    queryLower.includes('gutka') ||
    queryLower.includes('khaini') ||
    queryLower.includes('tobacco') ||
    queryLower.includes('bidi') ||
    queryLower.includes('cigarette') ||
    queryLower.includes('supari') ||
    queryLower.includes('quitting') ||
    queryLower.includes('quit') ||
    queryLower.includes('craving') ||
    queryLower.includes('तंबाकू') ||
    queryLower.includes('गुटखा') ||
    queryLower.includes('सुपारी') ||
    queryLower.includes('व्यसन')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          contextualNote +
          '**तंबाकू व सुपारी का प्रभाव और छोड़ने के व्यावहारिक उपाय**:\n\n' +
          '• **हानिकारक प्रभाव**: गुटखा, खैनी और बीड़ी में निकोटीन और कार्सिनोजेन्स होते हैं जो मुँह के ऊतकों को लगातार जलाते हैं और कोशिकाओं में असामान्य बदलाव लाते हैं।\n' +
          '• **छोड़ने पर ऊतकों का सुधार**: तंबाकू बंद करने के कुछ ही हफ्तों में मुँह की प्रतिरक्षा प्रणाली सक्रिय होती है, स्वाद और गंध की क्षमता लौटती है, और म्यूकोसल घाव भरने की गति तेज होती है।\n' +
          '• **क्रेविंग कंट्रोल (4D तकनीक)**:\n' +
          '  1. **Delay**: 5 मिनट रुकें।\n' +
          '  2. **Deep Breath**: 5 गहरी सांसें लें।\n' +
          '  3. **Drink Water**: धीरे-धीरे एक गिलास ठंडा पानी पिएं।\n' +
          '  4. **Distract**: सौंफ, लौंग या च्युइंग गम चबाएं और किसी काम में व्यस्त हो जाएं।\n' +
          '• **राष्ट्रीय हेल्पलाइन**: 1800-11-2356 (राष्ट्रीय तंबाकू मुक्ति टोल-फ्री नंबर)।',
        suggestedQuestions: [
          'मुक्ति सहयोग (Cessation Tracker) खोलें',
          'सत्यापित हेल्पलाइन नंबर देखें',
          'मुँह के छाले ठीक होने में कितना समय लगता है?',
        ],
        relatedTopic: 'gutka_supari',
      };
    }
    if (lang === 'mr') {
      return {
        reply:
          contextualNote +
          '**तंबाखू व गुटख्याचे दुष्परिणाम आणि व्यसनमुक्तीचे उपाय**:\n\n' +
          '• **परिणाम**: गुटखा, खैनी आणि बिडीमधील रसायने तोंडाच्या आतील नाजूक त्वचेला नुकसान पोहोचवतात, ज्यामुळे पांढरे डाग आणि अल्सर तयार होऊ शकतात.\n' +
          '• **व्यसन सोडण्याचे फायदे**: तंबाखू बंद केल्यास तोंडाची रोगप्रतिकारक शक्ती सुधारते, चव सुधारते आणि ऊतींचे नुकसान थांबते.\n' +
          '• **क्रेविंग नियंत्रणासाठी ४ डी (4D) पद्धत**:\n' +
          '  १. **Delay (थांबा)**: ५ मिनिटे संयम ठेवा.\n' +
          '  २. **Deep Breath (दीर्घ श्वास)**: दीर्घ श्वास घ्या.\n' +
          '  ३. **Drink Water (पाणी प्या)**: एक ग्लास थंड पाणी प्या.\n' +
          '  ४. **Distract (मन वळवा)**: बडीशेप किंवा लवंग चावून मन दुसरीकडे लावा.\n' +
          '• **राष्ट्रीय हेल्पलाइन**: १८००-११-२३५६ (तंबाखू मुक्ती टोल-फ्री क्रमांक).',
        suggestedQuestions: [
          'व्यसनमुक्ती मदत कक्ष उघडा',
          'हेल्पलाइन संपर्क पहा',
          'तोंडातील पांढरे डाग काय असतात?',
        ],
        relatedTopic: 'gutka_supari',
      };
    }
    return {
      reply:
        contextualNote +
        '**Tobacco & Areca Nut Impact & Cessation Support**:\n\n' +
        '• **Cellular Stress**: Nicotine, nitrosamines, and areca alkaloids cause DNA damage and microvascular constrictions in the mouth mucosa.\n' +
        '• **Reversibility**: Stopping tobacco and areca nut halts progressive cellular dysplasia and significantly enhances oral mucosal healing within weeks.\n' +
        '• **The 4 D’s Craving Strategy**:\n' +
        '  1. **Delay**: Wait 5–10 minutes when an urge strikes.\n' +
        '  2. **Deep Breathe**: Take 5 slow, grounding abdominal breaths.\n' +
        '  3. **Drink Water**: Sip a cool glass of water slowly.\n' +
        '  4. **Distract / Substitute**: Chew roasted fennel (saunf), cardamom, or sugar-free gum.\n' +
        '• **National Quitline**: 1800-11-2356 (Toll-free National Tobacco Quitline).',
      suggestedQuestions: [
        'Open Cessation Support Tracker',
        'View Verified Health Helplines',
        'What is the 2-week rule?',
      ],
      relatedTopic: 'gutka_supari',
    };
  }

  // 4. White or Red Patches (Leukoplakia, Erythroplakia, Lichen Planus)
  if (
    queryLower.includes('white patch') ||
    queryLower.includes('red patch') ||
    queryLower.includes('leukoplakia') ||
    queryLower.includes('erythroplakia') ||
    queryLower.includes('lichen') ||
    queryLower.includes('patch') ||
    queryLower.includes('safed dag') ||
    queryLower.includes('laal dag') ||
    queryLower.includes('सफेद दाग') ||
    queryLower.includes('लाल दाग') ||
    queryLower.includes('पांढरा डाग') ||
    queryLower.includes('लाल डाग')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          contextualNote +
          '**मुँह में सफेद या लाल पैच (White & Red Patches)**:\n\n' +
          '• **सफेद पैच (Leukoplakia / Thrush / Lichen Planus)**: ऐसा सफेद धब्बा जो रगड़ने पर भी आसानी से न छूटे। यह अक्सर तंबाकू, सुपारी या तीखे दांत की रगड़ से होता है।\n' +
          '• **लाल पैच (Erythroplakia)**: लाल, मखमली धब्बे जो बिना किसी स्पष्ट चोट के मौजूद हों। लाल पैच में कोशिकाओं के असामान्य बदलाव का जोखिम सफेद पैच से अधिक होता है।\n' +
          '• **सलाह**: किसी भी नए सफेद या लाल पैच को स्वयं छीलने या घरेलू नुस्खों से रगड़ने की कोशिश न करें। दंत चिकित्सक द्वारा इसकी क्लिनिकल जांच करवाएं।',
        suggestedQuestions: [
          'डॉक्टर पैच की जांच कैसे करते हैं?',
          'क्या यह पैच तंबाकू छोड़ने से ठीक हो सकता है?',
          '2-सप्ताह का नियम क्या है?',
        ],
        relatedTopic: 'white_red_patches',
      };
    }
    if (lang === 'mr') {
      return {
        reply:
          contextualNote +
          '**तोंडात पांढरे किंवा लाल डाग (White & Red Patches)**:\n\n' +
          '• **पांढरे डाग (Leukoplakia / Lichen Planus)**: असा पांढरा थर जो चोळल्यास निघत नाही. हा सामान्यतः तंबाखू, सुपारी किंवा दातांच्या घर्षणामुळे होतो.\n' +
          '• **लाल डाग (Erythroplakia)**: तोंडातील लालसर, मऊ डाग. लाल डागांमध्ये ऊतींचे बदल होण्याची शक्यता जास्त असते.\n' +
          '• **काळजी**: हे डाग स्वतः टोचू नका किंवा त्यावर घरगुती प्रयोग करू नका. दंतवैद्यांकडून योग्य तपासणी करून घेणे सुरक्षित ठरते.',
        suggestedQuestions: [
          'दंतवैद्य डागांची तपासणी कशी करतात?',
          'तंबाखू सोडल्याने डाग बरे होतात का?',
          '२ आठवड्यांचा नियम काय आहे?',
        ],
        relatedTopic: 'white_red_patches',
      };
    }
    return {
      reply:
        contextualNote +
        '**White and Red Patches in the Oral Cavity**:\n\n' +
        '• **White Patches (Leukoplakia / Lichen Planus)**: Adherent white plaques that cannot be wiped away with gauze. Often driven by chemical irritation from smokeless tobacco, bidi smoke, or friction from sharp teeth.\n' +
        '• **Red Patches (Erythroplakia)**: Smooth, velvety red areas with distinct borders. Red lesions carry higher dysplasia rates than homogenous white plaques and require diligent evaluation.\n' +
        '• **Recommendation**: Avoid scraping or applying caustic home remedies. Have the mucosal site examined in-person by a dental surgeon or specialist.',
      suggestedQuestions: [
        'What is an oral biopsy procedure?',
        'What causes mouth ulcers?',
        'What questions should I ask my dentist?',
      ],
      relatedTopic: 'white_red_patches',
    };
  }

  // 5. Questions for Doctor / Biopsy / Clinical Exam
  if (
    queryLower.includes('doctor') ||
    queryLower.includes('dentist') ||
    queryLower.includes('biopsy') ||
    queryLower.includes('exam') ||
    queryLower.includes('appointment') ||
    queryLower.includes('checkup') ||
    queryLower.includes('डॉक्टर') ||
    queryLower.includes('बायोप्सी') ||
    queryLower.includes('दंतवैद्य')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          contextualNote +
          '**डॉक्टर / दंत चिकित्सक से परामर्श के समय क्या पूछें?**:\n\n' +
          '1. "यह छाला / पैच किस प्रकार का है और इसके संभावित कारण क्या हैं?"\n' +
          '2. "क्या इसके लिए किसी बायोप्सी, एक्स-रे या विशेष जांच की आवश्यकता है?"\n' +
          '3. "क्या किसी नुकीले दांत या कृत्रिम दांत (Denture) के कारण यह रगड़ लग रही है?"\n' +
          '4. "मुझे कितने दिनों बाद दोबारा जांच (Follow-up) के लिए आना चाहिए?"\n\n' +
          '*(आप OralGuard AI के **Doctor Handoff** फीचर से अपना क्लिनिकल सारांश सीधे डाउनलोड या कॉपी करके डॉक्टर को दिखा सकते हैं।)*',
        suggestedQuestions: [
          'डॉक्टर हैंडऑफ सारांश देखें',
          'नजदीकी अस्पताल / डॉक्टर खोजें',
          'फॉलो-अप रिमाइंडर सेट करें',
        ],
        relatedTopic: 'dentist_questions',
      };
    }
    if (lang === 'mr') {
      return {
        reply:
          contextualNote +
          '**डॉक्टर किंवा दंतवैद्यांना भेटताना काय विचारावे?**:\n\n' +
          '१. "हा फोड / डाग कशामुळे झाला असावा आणि त्याचे स्वरूप काय आहे?"\n' +
          '२. "यासाठी बायोप्सी किंवा इतर तपासणीची गरज आहे का?"\n' +
          '३. "कोणत्याही दाताच्या घर्षणामुळे ही समस्या निर्माण झाली आहे का?"\n' +
          '४. "मला पुन्हा फॉलो-अप तपासणीसाठी कधी यावे लागेल?"\n\n' +
          '*(आपण OralGuard AI च्या **Doctor Handoff** टॅबमधून संपूर्ण सारांश डाऊनलोड करून डॉक्टरांना दाखवू शकता.)*',
        suggestedQuestions: [
          'डॉक्टर हँडऑफ सारांश पहा',
          'जवळचे दंतवैद्य शोधा',
          'फॉलो-अप स्मरणपत्र तयार करा',
        ],
        relatedTopic: 'dentist_questions',
      };
    }
    return {
      reply:
        contextualNote +
        '**Key Questions to Ask Your Doctor or Dentist**:\n\n' +
        '1. "What is the clinical nature of this ulcer or patch?"\n' +
        '2. "Is an incisional/punch biopsy or referral to an oral surgeon indicated?"\n' +
        '3. "Is there any mechanical trauma (e.g. sharp cusp or ill-fitting denture) contributing?"\n' +
        '4. "What timeline do you recommend for follow-up review (e.g. 7–14 days)?"\n\n' +
        '*(Tip: You can use OralGuard AI’s **Doctor Handoff** screen to export a structured summary directly for your clinic visit.)*',
      suggestedQuestions: [
        'View Doctor Handoff Report',
        'Find Hospital / Doctor',
        'Schedule Follow-up Reminder',
      ],
      relatedTopic: 'dentist_questions',
    };
  }

  // 6. General / Comprehensive Fallback
  if (lang === 'hi') {
    return {
      reply:
        contextualNote +
        'मुँह के स्वास्थ्य के लिए यह महत्वपूर्ण है कि मुँह के अंदरूनी सभी हिस्सों (जीभ, गाल, मसूड़े, तालू) की नियमित निगरानी रखी जाए।\n\n' +
        '• **साधारण छाले**: 7-10 दिनों में ठीक होते हैं।\n' +
        '• **चेतावनी संकेत**: 2 सप्ताह से अधिक समय तक रहने वाले घाव, मुँह कम खुलना, बिना चोट खून आना या सफेद-लाल पैच की तुरंत क्लिनिकल जांच आवश्यक है।\n' +
        '• क्या आप किसी विशिष्ट लक्षण, आदत (जैसे गुटखा/सुपारी), या डॉक्टर परामर्श के बारे में अधिक जानना चाहते हैं?',
      suggestedQuestions: [
        '2-सप्ताह का नियम क्या है?',
        'गुटखा और सुपारी के क्या खतरे हैं?',
        'मुँह कम खुलने का क्या कारण है?',
      ],
    };
  }
  if (lang === 'mr') {
    return {
      reply:
        contextualNote +
        'तोंडाच्या आरोग्यासाठी तोंडाच्या सर्व भागांची (जीभ, गाल, हिरड्या, टाळू) नियमित तपासणी महत्त्वाची आहे.\n\n' +
        '• **सामान्य व्रण**: ७-१० दिवसांत बरे होतात.\n' +
        '• **महत्त्वाची लक्षणे**: २ आठवड्यांपेक्षा जास्त काळ टिकणारे फोड, तोंड कमी उघडणे किंवा पांढरे/लाल डाग आढळल्यास प्रत्यक्ष वैद्यकीय सल्ला घ्यावा.\n' +
        '• आपल्याला एखाद्या विशिष्ट लक्षणाविषयी किंवा सवयीविषयी अधिक जाणून घ्यायचे आहे का?',
      suggestedQuestions: [
        '२ आठवड्यांचा नियम काय आहे?',
        'तंबाखू व गुटख्याचे दुष्परिणाम कोणते?',
        'तोंड कमी उघडण्याचे कारण काय?',
      ],
    };
  }
  return {
    reply:
      contextualNote +
      'Healthy oral mucosa is typically smooth, moist, and pliable without persistent firm nodules or non-healing ulcers.\n\n' +
      '• **Common Minor Sores**: Heal on their own in 7–14 days.\n' +
      '• **Key Recommendation**: Any mucosal ulcer, swelling, or red/white patch lasting longer than 2 weeks warrants an in-person clinical examination by a qualified dental or ENT practitioner.\n' +
      '• Would you like to explore a specific topic like ulcer care, cessation tips, or questions for your doctor?',
    suggestedQuestions: [
      'What is the 2-week rule?',
      'Why is gutka harmful to the mouth?',
      'What causes reduced mouth opening?',
    ],
  };
}
