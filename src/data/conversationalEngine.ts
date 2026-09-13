/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Adaptive Conversational Dialogue Engine for OralGuard AI
 * Supports English ('en'), Hindi ('hi'), and Marathi ('mr').
 *
 * Provides a natural, empathetic, context-aware conversational AI experience.
 * Seamlessly tracks multi-intent patient inputs, handles corrections, acknowledges
 * patient emotions, and strictly avoids repeated questions.
 */

import { PatientProfile, ChatMessage, AppLanguage } from '../types';
import { getScreeningQuestionsStatus } from './clinicalKnowledge';

export interface ConversationalTurnResult {
  replyText: string;
  suggestedQuickReplies: string[];
  isEmergencyAlert?: boolean;
  isReadyForEvaluation?: boolean;
}

/**
 * Recognizes patient emotions (anxiety, fear of cancer, pain) and creates
 * a warm, reassuring preamble that alleviates distress without false promises.
 */
function buildEmotionalEmpathyPreamble(lower: string, lang: AppLanguage): string {
  const isAnxiousOrFearingCancer =
    lower.includes('cancer') ||
    lower.includes('scared') ||
    lower.includes('afraid') ||
    lower.includes('worried') ||
    lower.includes('serious') ||
    lower.includes('darr') ||
    lower.includes('dar') ||
    lower.includes('chinta') ||
    lower.includes('khauf') ||
    lower.includes('bhiti') ||
    lower.includes('kalji') ||
    lower.includes('कैंसर') ||
    lower.includes('डर') ||
    lower.includes('चिंता') ||
    lower.includes('भीती') ||
    lower.includes('काळजी') ||
    lower.includes('कर्करोग');

  const hasHighPain =
    lower.includes('severe pain') ||
    lower.includes('bohot dard') ||
    lower.includes('bahut dard') ||
    lower.includes('tez dard') ||
    lower.includes('unbearable') ||
    lower.includes('khup tras') ||
    lower.includes('khup vedna') ||
    lower.includes('तीव्र वेदना') ||
    lower.includes('खूप त्रास') ||
    lower.includes('बहुत दर्द') ||
    lower.includes('तेज़ दर्द');

  if (isAnxiousOrFearingCancer) {
    if (lang === 'hi') {
      return 'मैं आपकी चिंता पूरी तरह समझ सकता हूँ। मुँह में कोई भी बदलाव देखकर मन में डर आना स्वाभाविक है, लेकिन कृपया घबराएं नहीं — मुँह के अधिकतर छाले और पैच साधारण या आसानी से ठीक होने वाले कारणों से होते हैं। आइए इसे चरणबद्ध तरीके से समझें। ';
    }
    if (lang === 'mr') {
      return 'मी आपली काळजी पूर्णपणे समजू शकतो. तोंडातील कोणताही बदल पाहून मनात भीती वाटणे स्वाभाविक आहे, परंतु कृपया घाबरू नका — तोंडातील बहुतांश फोड व डाग सामान्य किंवा सहज बरे होणाऱ्या कारणांमुळे असतात. आपण टप्प्याटप्प्याने याची माहिती घेऊया. ';
    }
    return 'I completely understand your concern. Noticing an unusual sore or patch in your mouth can naturally feel alarming, but please rest assured that the vast majority of mouth sores are benign or easily treatable. Let us go through your details calmly together. ';
  }

  if (hasHighPain) {
    if (lang === 'hi') {
      return 'दर्द होना निश्चित रूप से बहुत तकलीफ़देह होता है, विशेषकर खाते या बोलते समय। ';
    }
    if (lang === 'mr') {
      return 'वेदना होणे नक्कीच खूप त्रासदायक असते, विशेषतः खाताना किंवा बोलताना. ';
    }
    return 'Experiencing pain in the mouth can be especially uncomfortable, particularly when eating or speaking. ';
  }

  return '';
}

/**
 * Builds a natural, conversational synthesis of multiple facts reported by the patient.
 * Avoids rigid robotic lists and strings together a warm human acknowledgment.
 */
function buildNaturalFactAcknowledgment(
  profile: PatientProfile,
  lower: string,
  lang: AppLanguage
): string {
  const isCorrection =
    lower.startsWith('actually') ||
    lower.startsWith('wait') ||
    lower.startsWith('correction') ||
    lower.includes('actually') ||
    lower.includes('pehle galat') ||
    lower.includes('galti se') ||
    lower.includes('chukichi') ||
    lower.includes('i meant') ||
    lower.includes('mera matlab');

  const isUncertainty =
    lower.includes('not sure') ||
    lower.includes("don't know") ||
    lower.includes('dont know') ||
    lower.includes("can't remember") ||
    lower.includes('pata nahi') ||
    lower.includes('yaad nahi') ||
    lower.includes('mahit nahi') ||
    lower.includes('aathvat nahi') ||
    lower.includes('याद नहीं') ||
    lower.includes('पता नहीं') ||
    lower.includes('माहित नाही') ||
    lower.includes('आठवत नाही');

  if (isCorrection) {
    if (lang === 'hi') {
      return 'सुधार नोट कर लिया गया है। जानकारी अपडेट कर दी गई है। ';
    }
    if (lang === 'mr') {
      return 'दुरुस्तीची नोंद घेतली आहे. माहिती अद्ययावत केली गेली आहे. ';
    }
    return 'Got it, thank you for clarifying that update. ';
  }

  if (isUncertainty) {
    if (lang === 'hi') {
      return 'कोई बात नहीं, बिल्कुल सटीक समय याद न होना पूरी तरह सामान्य है। ';
    }
    if (lang === 'mr') {
      return 'काही हरकत नाही, अचूक वेळ आठवत नसणे अगदी सामान्य आहे. ';
    }
    return 'No problem at all, it is completely normal not to recall the exact timeline. ';
  }

  const hasSoreInTurn =
    (lower.includes('sore') ||
      lower.includes('ulcer') ||
      lower.includes('chhala') ||
      lower.includes('chhale') ||
      lower.includes('fod') ||
      lower.includes('wound') ||
      lower.includes('ghav')) &&
    Boolean(profile.hasLesionOrUlcer);

  const hasLocInTurn = Boolean(
    profile.primarySymptomLocation &&
      (lower.includes('tongue') ||
        lower.includes('jeebh') ||
        lower.includes('jibh') ||
        lower.includes('cheek') ||
        lower.includes('gaal') ||
        lower.includes('lip') ||
        lower.includes('oth') ||
        lower.includes('gum') ||
        lower.includes('hirad') ||
        lower.includes('palate') ||
        lower.includes('talu') ||
        lower.includes('floor') ||
        lower.includes('side'))
  );

  const hasDurInTurn = Boolean(
    (profile.duration || profile.durationCategory || profile.durationOverTwoWeeks !== undefined) &&
      (lower.includes('week') ||
        lower.includes('hafte') ||
        lower.includes('hafate') ||
        lower.includes('aathvad') ||
        lower.includes('month') ||
        lower.includes('mahine') ||
        lower.includes('day') ||
        lower.includes('din') ||
        lower.includes('divas') ||
        lower.includes('since') ||
        lower.includes('for about') ||
        lower.includes('about') ||
        lower.includes('around'))
  );

  const hasPainInTurn = Boolean(
    (profile.pain || profile.mouthPainOrBurning) &&
      (lower.includes('hurt') ||
        lower.includes('hurts') ||
        lower.includes('hurting') ||
        lower.includes('pain') ||
        lower.includes('dard') ||
        lower.includes('tras') ||
        lower.includes('vedna') ||
        lower.includes('burning') ||
        lower.includes('jalan') ||
        lower.includes('jaljal'))
  );

  // If patient provided both lesion location and duration together in natural language
  if (hasSoreInTurn && hasLocInTurn && hasDurInTurn) {
    const soreDescEn = hasPainInTurn ? 'a painful sore' : 'a sore';
    let locDescEn = `on your ${profile.primarySymptomLocation?.toLowerCase() || 'mouth'}`;
    if (
      profile.primarySymptomLocation?.toLowerCase().includes('left lateral tongue') ||
      (lower.includes('left') && (lower.includes('tongue') || lower.includes('jeebh') || lower.includes('jibh')))
    ) {
      locDescEn = 'on the left side of your tongue';
    } else if (
      profile.primarySymptomLocation?.toLowerCase().includes('right lateral tongue') ||
      (lower.includes('right') && (lower.includes('tongue') || lower.includes('jeebh') || lower.includes('jibh')))
    ) {
      locDescEn = 'on the right side of your tongue';
    }

    const durDescEn =
      profile.durationText ||
      (profile.duration === 'more_than_one_month'
        ? 'over a month'
        : profile.duration === 'two_to_four_weeks'
        ? 'about three weeks'
        : 'a few days');

    const triggerDescEn = profile.symptomTrigger ? `, particularly bothering you with ${profile.symptomTrigger}` : '';

    if (lang === 'en') {
      return `Thanks — I understand that you've had ${soreDescEn} ${locDescEn} for ${durDescEn}${triggerDescEn}. I'd like to check for any warning signs. `;
    }

    if (lang === 'hi') {
      const locDescHi = locDescEn.includes('left')
        ? 'अपनी जीभ के बाईं ओर'
        : locDescEn.includes('right')
        ? 'अपनी जीभ के दाईं ओर'
        : 'मुँह में';
      const soreDescHi = hasPainInTurn ? 'दर्दनाक छाला' : 'छाला';
      return `धन्यवाद — मैं समझ गया कि आपको लगभग ${durDescEn} से ${locDescHi} एक ${soreDescHi} है${profile.symptomTrigger ? `, जो तीखा खाने पर परेशान करता है` : ''}। मैं कुछ चेतावनी संकेतों (warning signs) की जाँच करना चाहता हूँ। `;
    }

    if (lang === 'mr') {
      const locDescMr = locDescEn.includes('left')
        ? 'आपल्या जिभेच्या डाव्या बाजूला'
        : locDescEn.includes('right')
        ? 'आपल्या जिभेच्या उजव्या बाजूला'
        : 'तोंडात';
      const soreDescMr = hasPainInTurn ? 'त्रासदायक फोड' : 'फोड';
      return `धन्यवाद — मला समजले की आपल्याला साधारण ${durDescEn} पासून ${locDescMr} एक ${soreDescMr} आहे${profile.symptomTrigger ? `, जो तिखट खाताना त्रास देतो` : ''}. मी काही महत्त्वाच्या चेतावणी लक्षणांची तपासणी करू इच्छितो. `;
    }
  }

  const items: string[] = [];

  // Symptom + Duration
  if (profile.hasLesionOrUlcer && profile.durationOverTwoWeeks) {
    if (lower.includes('week') || lower.includes('hafte') || lower.includes('aathvad') || lower.includes('month') || lower.includes('mahine')) {
      const durText =
        profile.duration === 'more_than_one_month'
          ? lang === 'hi'
            ? '1 महीने से अधिक समय से'
            : lang === 'mr'
            ? '१ महिन्यापेक्षा जास्त काळापासून'
            : 'over a month'
          : lang === 'hi'
          ? 'लगभग 2 से 4 सप्ताह से'
          : lang === 'mr'
          ? 'सुमारे २ ते ४ आठवड्यांपासून'
          : 'around 2 to 4 weeks';
      items.push(
        lang === 'hi'
          ? `मुँह का छाला जो ${durText} बना हुआ है`
          : lang === 'mr'
          ? `तोंडातील फोड जो ${durText} टिकून आहे`
          : `the oral ulcer present for ${durText}`
      );
    }
  } else if (profile.hasLesionOrUlcer && profile.durationOverTwoWeeks === false) {
    if (lower.includes('din') || lower.includes('divas') || lower.includes('day') || lower.includes('recent') || lower.includes('few')) {
      items.push(
        lang === 'hi'
          ? 'हाल ही का छाला (कुछ ही दिनों से)'
          : lang === 'mr'
          ? 'नुकताच झालेला फोड (काहीच दिवसांपासून)'
          : 'the recent mouth sore'
      );
    }
  } else if (profile.colorChanges === 'white' && (lower.includes('white') || lower.includes('safed') || lower.includes('pandhra'))) {
    items.push(
      lang === 'hi'
        ? 'सफ़ेद रंग का पैच (white patch)'
        : lang === 'mr'
        ? 'पांढऱ्या रंगाचा डाग (white patch)'
        : 'the white mucosal patch'
    );
  } else if (
    (profile.colorChanges === 'red' || profile.colorChanges === 'mixed') &&
    (lower.includes('red') || lower.includes('lal') || lower.includes('laal'))
  ) {
    items.push(
      lang === 'hi'
        ? 'लाल या मिश्रित रंग का पैच'
        : lang === 'mr'
        ? 'लाल किंवा मिश्र रंगाचा डाग'
        : 'the red or mixed patch'
    );
  }

  // Location
  if (
    profile.primarySymptomLocation &&
    (lower.includes('tongue') ||
      lower.includes('cheek') ||
      lower.includes('jeebh') ||
      lower.includes('jibh') ||
      lower.includes('gaal') ||
      lower.includes('gum') ||
      lower.includes('lip') ||
      lower.includes('palate') ||
      lower.includes('floor') ||
      lower.includes('side'))
  ) {
    items.push(
      lang === 'hi'
        ? `${profile.primarySymptomLocation} पर स्थिति`
        : lang === 'mr'
        ? `${profile.primarySymptomLocation} येथील जागा`
        : `its location on the ${profile.primarySymptomLocation}`
    );
  }

  // Habits
  if (profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none' && (lower.includes('gutka') || lower.includes('khaini') || lower.includes('tambaku') || lower.includes('tambakhoo'))) {
    items.push(
      lang === 'hi'
        ? `${profile.tobaccoSmokeless} (गुटखा/तंबाकू) का उपयोग`
        : lang === 'mr'
        ? `${profile.tobaccoSmokeless} (गुटखा/तंबाखू) चा वापर`
        : `your use of ${profile.tobaccoSmokeless}`
    );
  }
  if (profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none' && (lower.includes('smoke') || lower.includes('cigarette') || lower.includes('bidi'))) {
    items.push(
      lang === 'hi'
        ? `${profile.tobaccoSmoked} पीना`
        : lang === 'mr'
        ? `${profile.tobaccoSmoked} ओढणे`
        : `smoking ${profile.tobaccoSmoked}`
    );
  }
  if (profile.tobaccoSmoked === 'none' && profile.tobaccoSmokeless === 'none' && (lower.includes('no tobacco') || lower.includes('koi tambaku nahi') || lower.includes('kahihi nahi') || lower.includes('never used'))) {
    items.push(
      lang === 'hi'
        ? 'तंबाकू का सेवन न करना'
        : lang === 'mr'
        ? 'तंबाखूचा वापर न करणे'
        : 'that you do not use tobacco'
    );
  }
  if (profile.alcoholIntake === 'none' && (lower.includes('alcohol') || lower.includes('sharab') || lower.includes('daru') || lower.includes('drink'))) {
    items.push(
      lang === 'hi'
        ? 'शराब का सेवन न करना'
        : lang === 'mr'
        ? 'मद्यपान न करणे'
        : 'zero alcohol intake'
    );
  } else if (profile.alcoholIntake && profile.alcoholIntake !== 'none' && (lower.includes('alcohol') || lower.includes('sharab') || lower.includes('daru') || lower.includes('drink'))) {
    items.push(
      lang === 'hi'
        ? `शराब का ${profile.alcoholIntake === 'moderate' ? 'कभी-कभार' : 'नियमित'} सेवन`
        : lang === 'mr'
        ? `मद्यपानाचा ${profile.alcoholIntake === 'moderate' ? 'कधीतरी' : 'नियमित'} वापर`
        : `${profile.alcoholIntake} alcohol consumption`
    );
  }

  // Red Flags
  if (profile.reducedMouthOpening && (lower.includes('khol') || lower.includes('ughad') || lower.includes('open') || lower.includes('trismus'))) {
    items.push(
      lang === 'hi'
        ? 'मुँह पूरा खोलने में कठिनाई'
        : lang === 'mr'
        ? 'तोंड पूर्ण उघडण्यास त्रास'
        : 'difficulty opening your mouth fully'
    );
  }
  if (profile.unexplainedBleeding && (lower.includes('bleed') || lower.includes('khoon') || lower.includes('rakta'))) {
    items.push(
      lang === 'hi'
        ? 'अकारण खून आना'
        : lang === 'mr'
        ? 'रक्तस्राव होणे'
        : 'bleeding from the lesion'
    );
  }

  if (items.length === 0) {
    return '';
  }

  if (lang === 'hi') {
    return `धन्यवाद। आपने ${items.join(' और ')} के बारे में स्पष्ट किया है, जिसे मैंने नोट कर लिया है। `;
  }
  if (lang === 'mr') {
    return `धन्यवाद. आपण ${items.join(' आणि ')} बद्दल स्पष्ट माहिती दिली आहे, ती मी नोंदवून घेतली आहे. `;
  }
  return `Thank you. I have noted ${items.join(', and ')}. `;
}

/**
 * Main adaptive dialogue generator.
 * Produces contextually rich, conversational responses and natural suggestion chips.
 */
export function generateAdaptiveDialogueTurn(
  userText: string,
  profile: PatientProfile,
  _conversationHistory: ChatMessage[],
  _exchangesCount: number
): ConversationalTurnResult {
  const lower = userText.toLowerCase();

  // Strict language determination
  const lang: AppLanguage =
    profile.detectedLanguage === 'hi'
      ? 'hi'
      : profile.detectedLanguage === 'mr'
      ? 'mr'
      : profile.detectedLanguage === 'en'
      ? 'en'
      : /[\u0900-\u097F]/.test(userText)
      ? 'hi'
      : 'en';

  const isHindi = lang === 'hi';
  const isMarathi = lang === 'mr';

  const evalState = getScreeningQuestionsStatus(profile);

  // 1. Explicit User Request to View Results
  const isRequestingResults =
    lower.includes('view') ||
    lower.includes('result') ||
    lower.includes('check result') ||
    lower.includes('result dikhao') ||
    lower.includes(' निकाल') ||
    lower.includes('assessment') ||
    lower.includes('परिणाम') ||
    lower.includes('रिपोर्ट') ||
    lower.includes('अहवाल');

  if (isRequestingResults && evalState.isReadyForEvaluation) {
    return {
      replyText: isHindi
        ? 'जी बिल्कुल! आपके द्वारा बताए गए विवरण के आधार पर आपकी प्रारंभिक स्क्रीनिंग रिपोर्ट और डॉक्टर समरी तैयार है। नीचे दिए गए बटन पर टैप करके अपनी रिपोर्ट देखें।'
        : isMarathi
        ? 'नक्कीच! आपण दिलेल्या सर्व माहितीच्या आधारे आपला प्राथमिक तपासणी अहवाल आणि डॉक्टर सारांश तयार आहे. खालील बटनावर टॅप करून अहवाल पहा.'
        : 'Certainly! Based on all the details you shared, your preliminary screening evaluation and doctor summary are ready. Please tap below to review your results.',
      suggestedQuickReplies: isHindi
        ? ['मेरी स्क्रीनिंग रिपोर्ट देखें']
        : isMarathi
        ? ['माझा तपासणी अहवाल पहा']
        : ['View My Screening Results'],
      isReadyForEvaluation: true,
    };
  }

  // 2. Safety First: Emergency Red Flags
  if (profile.emergencyFlagTriggered) {
    return {
      replyText: isHindi
        ? '⚠️ आवश्यक स्वास्थ्य सुरक्षा चेतावनी: आपने सांस लेने में कठिनाई या गले/गर्दन में अचानक गंभीर सूजन की सूचना दी है। यह लक्षण तत्काल व्यक्तिगत चिकित्सकीय ध्यान की मांग करते हैं। कृपया इस ऑनलाइन स्क्रीनिंग के बजाय तुरंत नजदीकी अस्पताल या इमरजेंसी क्लिनिक में डॉक्टर से संपर्क करें।'
        : isMarathi
        ? '⚠️ महत्त्वाची वैद्यकीय सुरक्षा चेतावणी: आपण श्वास घेण्यास अडथळा किंवा मान/घशात तीव्र सूज आल्याची माहिती दिली आहे. या लक्षणांसाठी तातडीने प्रत्यक्ष डॉक्टरांची मदत आवश्यक आहे. कृपया त्वरित जवळच्या रुग्णालयात किंवा आपत्कालीन विभागात संपर्क साधा.'
        : '⚠️ Important Medical Safety Notice: You mentioned symptoms involving breathing difficulty or acute swelling in the neck or throat. These require immediate in-person clinical care. Please seek urgent care at a hospital emergency room or clinic rather than continuing this screening.',
      suggestedQuickReplies: isHindi
        ? ['मेरी स्क्रीनिंग रिपोर्ट देखें', 'नजदीकी अस्पताल खोजें']
        : isMarathi
        ? ['माझा तपासणी अहवाल पहा', 'जवळचे रुग्णालय शोधा']
        : ['View My Screening Results', 'Find Hospital / Clinic'],
      isEmergencyAlert: true,
      isReadyForEvaluation: true,
    };
  }

  // 3. Unrelated Medical Inquiries
  if (
    lower.includes('fever') ||
    lower.includes('bukhar') ||
    lower.includes('taap') ||
    lower.includes('बुखार') ||
    lower.includes('ताप') ||
    lower.includes('stomach') ||
    lower.includes('pet dard') ||
    lower.includes('potdukhi') ||
    lower.includes('पेट दर्द') ||
    lower.includes('पोटदुखी') ||
    lower.includes('diabetes') ||
    lower.includes('sugar') ||
    lower.includes('dengue')
  ) {
    return {
      replyText: isHindi
        ? 'OralGuard AI विशेष रूप से मुँह के स्वास्थ्य (oral mucosal health) और प्रारंभिक ओरल कैंसर जोखिम स्क्रीनिंग के लिए है। बुखार या पेट से संबंधित समस्याओं के लिए कृपया अपने चिकित्सक से संपर्क करें। क्या आपको मुँह में कोई छाला, सफ़ेद या लाल पैच, अथवा तंबाकू/गुटखा से जुड़ी कोई चिंता है?'
        : isMarathi
        ? 'OralGuard AI प्रामुख्याने तोंडाच्या आरोग्याची (oral mucosal health) प्राथमिक तपासणी करण्यासाठी आहे. ताप किंवा पोटाच्या तक्रारींसाठी कृपया आपल्या डॉक्टरांचा सल्ला घ्या. आपल्या तोंडात काही फोड, पांढरा/लाल डाग किंवा तंबाखूबाबत समस्या आहे का?'
        : 'OralGuard AI is focused specifically on oral mucosal health and preliminary oral cancer risk screening. For general medical concerns like fever or stomach pain, please consult a physician. Do you have any oral symptoms such as a sore, patch, or tobacco-related concern?',
      suggestedQuickReplies: isHindi
        ? ['मुँह में छाला है', 'सफ़ेद या लाल पैच है', 'तंबाकू / गुटखा से जुड़ी चिंता', 'कोई मुँह का लक्षण नहीं']
        : isMarathi
        ? ['तोंडात फोड आहे', 'पांढरा किंवा लाल डाग आहे', 'तंबाखू / गुटखा संबंधित चिंता', 'काही लक्षण नाही, रूटीन तपासणी']
        : ['Mouth sore / ulcer', 'White or red patch', 'Tobacco / Gutka concern', 'No oral symptoms'],
    };
  }

  // 4. Build Natural Conversational Prefixes
  const emotionalPrefix = buildEmotionalEmpathyPreamble(lower, lang);
  const factAck = buildNaturalFactAcknowledgment(profile, lower, lang);
  const combinedPreamble = `${emotionalPrefix}${factAck}`.trim();
  const prefix = combinedPreamble ? `${combinedPreamble} ` : '';

  // 5. ALL REQUIRED CLINICAL FIELDS COMPLETE
  if (evalState.allRequiredAnswered) {
    return {
      replyText: isHindi
        ? `${prefix}धन्यवाद! हमने आपकी स्थिति से जुड़े सभी मुख्य बिंदु — लक्षण, समय, चेतावनी संकेत और आदतें — पूरी तरह समझ लिए हैं। आपकी प्रारंभिक स्क्रीनिंग रिपोर्ट और डॉक्टर समरी तैयार है।\n\nनीचे दिए गए बटन पर टैप करके अपनी रिपोर्ट देखें।`
        : isMarathi
        ? `${prefix}धन्यवाद! आपण लक्षणे, कालावधी, धोक्याची लक्षणे आणि सवयी या सर्व मुख्य मुद्द्यांची माहिती पूर्ण केली आहे. आपला प्राथमिक तपासणी अहवाल आणि डॉक्टर सारांश तयार आहे.\n\nखालील बटनावर टॅप करून अहवाल पहा.`
        : `${prefix}Thank you! We have covered all the key clinical areas — symptoms, duration, warning signs, and habits. Your preliminary screening evaluation and doctor summary are ready.\n\nPlease tap below to review your results.`,
      suggestedQuickReplies: isHindi
        ? ['मेरी स्क्रीनिंग रिपोर्ट देखें']
        : isMarathi
        ? ['माझा तपासणी अहवाल पहा']
        : ['View My Screening Results'],
      isReadyForEvaluation: true,
    };
  }

  // 6. ADAPTIVE QUESTIONING: STRICTLY ASK THE NEXT UNANSWERED CLINICAL INDICATOR
  // Question 1: Symptoms Presence
  if (evalState.nextUnansweredQuestionId === 'symptoms') {
    return {
      replyText: isHindi
        ? `${prefix}क्या आप अपने शब्दों में बता सकते हैं कि मुँह में क्या बदलाव या तकलीफ़ महसूस हो रही है — जैसे कोई छाला (ulcer), सफ़ेद या लाल पैच, मुँह खोलने में खिंचाव, या कोई अन्य समस्या?`
        : isMarathi
        ? `${prefix}आपण आपल्या शब्दांत सांगू शकता का की तोंडात काय बदल किंवा त्रास जाणवत आहे — जसे की फोड (ulcer), पांढरा किंवा लाल डाग, तोंड उघडण्यास त्रास, किंवा इतर काही?`
        : `${prefix}Could you describe in your own words what you have noticed in your mouth — such as a sore or ulcer, a white or red patch, difficulty opening your mouth, or any other change?`,
      suggestedQuickReplies: isHindi
        ? ['मुँह में छाला (ulcer) है', 'सफ़ेद या लाल पैच है', 'मुँह कम खुलता है', 'कोई लक्षण नहीं, बस रूटीन चेकअप']
        : isMarathi
        ? ['तोंडात फोड (ulcer) आहे', 'पांढरा किंवा लाल डाग आहे', 'तोंड कमी उघडते', 'कोणतेही लक्षण नाही, रूटीन चेकअप']
        : ['Mouth sore or ulcer', 'White or red patch', 'Difficulty opening mouth', 'No symptoms, routine check'],
    };
  }

  // Question 2: Anatomical Location
  if (evalState.nextUnansweredQuestionId === 'mouthLocation') {
    return {
      replyText: isHindi
        ? `${prefix}यह छाला या तकलीफ़ मुँह के किस हिस्से में है — जैसे जीभ के किनारे (side of tongue), गाल के अंदर (inner cheek), मसूड़ों पर, या मुँह के निचले हिस्से (floor of mouth) में? (आप ऊपर Mouth Map पर भी चुन सकते हैं)।`
        : isMarathi
        ? `${prefix}हा फोड किंवा त्रास तोंडाच्या कोणत्या भागात आहे — जसे की जिभेची बाजू, गालाचा आतील भाग, हिरड्यांवर, किंवा जिभेच्या खाली? (आपण वरील Mouth Map वरही निवडू शकता).`
        : `${prefix}Where in your mouth is this sore located — for example, on the side of your tongue, inside of your cheek, on your gums, or under your tongue? (You can also tap the Mouth Map above).`,
      suggestedQuickReplies: isHindi
        ? ['गाल के अंदर (Inner Cheek)', 'जीभ पर (Side of Tongue)', 'मसूड़े (Gums)', 'मुँह का निचला हिस्सा (Floor of mouth)']
        : isMarathi
        ? ['गालाच्या आत (Inner Cheek)', 'जिभेवर (Side of Tongue)', 'हिरड्या (Gums)', 'जिभेच्या खाली (Floor of mouth)']
        : ['Inside cheek', 'Side of tongue', 'Gums / Ridge', 'Under tongue / Floor of mouth'],
    };
  }

  // Question 3: Duration / Chronicity (Never re-ask if duration is already patient-provided)
  if (evalState.nextUnansweredQuestionId === 'duration') {
    const alreadyHasDuration = Boolean(
      profile.duration || profile.durationCategory || profile.durationOverTwoWeeks !== undefined
    );
    if (alreadyHasDuration) {
      evalState.nextUnansweredQuestionId = 'redFlags';
    } else {
      return {
        replyText: isHindi
          ? `${prefix}ओरल हेल्थ में समय (duration) बहुत महत्वपूर्ण होता है क्योंकि 2 सप्ताह से अधिक बने रहने वाले छालों की चिकित्सकीय जाँच आवश्यक होती है। यह समस्या लगभग कितने समय से बनी हुई है — कुछ दिनों से, 2 से 4 सप्ताह, या 1 महीने से अधिक?`
          : isMarathi
          ? `${prefix}तोंडाच्या आरोग्यामध्ये कालावधी अत्यंत महत्त्वाचा आहे, कारण २ आठवड्यांपेक्षा जास्त काळ टिकणारे फोड डॉक्टरांना दाखवणे गरजेचे असते. हा त्रास साधारण किती दिवसांपासून आहे — काही दिवस, २ ते ४ आठवडे, की १ महिन्यापेक्षा जास्त?`
          : `${prefix}Symptom duration is an important clinical factor, as sores lasting over two weeks warrant closer evaluation. Approximately how long has this been present — just a few days, 2 to 4 weeks, or more than a month?`,
        suggestedQuickReplies: isHindi
          ? ['कुछ ही दिन (< 2 हफ्ते)', 'लगभग 2 से 4 हफ्ते', '1 महीने से अधिक', 'ठीक से याद नहीं']
          : isMarathi
          ? ['काहीच दिवस (< २ आठवडे)', 'सुमारे २ ते ४ आठवडे', '१ महिन्यापेक्षा जास्त', 'नक्की आठवत नाही']
          : ['Just a few days (< 2 weeks)', 'About 2 to 4 weeks', 'More than a month', "Not sure / Can't recall"],
      };
    }
  }

  // Question 4: Warning Signs / Red Flags
  if (evalState.nextUnansweredQuestionId === 'redFlags') {
    const isPreambleCoveringWarningSigns =
      prefix.includes('warning signs') ||
      prefix.includes('चेतावनी संकेत') ||
      prefix.includes('चेतावणी');

    const questionText = isPreambleCoveringWarningSigns
      ? isHindi
        ? 'क्या आपने उस जगह से खून आना, सुन्नपन, या मुँह खोलने में कठिनाई महसूस की है?'
        : isMarathi
        ? 'आपण त्या जागेतून रक्त येणे, बधीरपणा किंवा तोंड उघडण्यास त्रास जाणवला आहे का?'
        : 'Have you noticed bleeding, numbness, or difficulty opening your mouth?'
      : isHindi
      ? 'क्या आपने इसके साथ कोई अन्य चेतावनी संकेत महसूस किए हैं — जैसे उस जगह से अकारण खून बहना, मुँह या होंठ में सुन्नपन, या मुँह पूरा खोलने में कठिनाई?'
      : isMarathi
      ? 'आपण यासोबत काही धोक्याची लक्षणे पाहिली आहेत का — जसे की अकारण रक्त येणे, ओठ किंवा तोंड बधीर होणे, अथवा तोंड पूर्ण उघडण्यास त्रास?'
      : 'Have you noticed any associated warning signs — such as unexplained bleeding from the area, numbness in your lips or mouth, or difficulty opening your mouth fully?';

    return {
      replyText: `${prefix}${questionText}`,
      suggestedQuickReplies: isHindi
        ? ['नहीं, इनमें से कोई लक्षण नहीं', 'मुँह खोलने में परेशानी होती है', 'खून आना या सुन्नपन महसूस होना']
        : isMarathi
        ? ['नाही, यांपैकी कोणतेही लक्षण नाही', 'तोंड उघडण्यास त्रास होतो', 'रक्त येणे किंवा बधीरपणा जाणवणे']
        : ['No, none of these symptoms', 'Difficulty opening mouth', 'Bleeding or numbness noticed'],
    };
  }

  // Question 5: Tobacco & Areca Nut Habits
  if (evalState.nextUnansweredQuestionId === 'gutka' || evalState.nextUnansweredQuestionId === 'smoking') {
    return {
      replyText: isHindi
        ? `${prefix}जीवनशैली और आदतों की जानकारी ओरल स्क्रीनिंग का महत्वपूर्ण हिस्सा है। क्या आप गुटखा, खैनी, जर्दा, सुपारी, पान, बीड़ी या सिगरेट का उपयोग करते हैं या पहले कभी किया है?`
        : isMarathi
        ? `${prefix}सवयींची माहिती तोंडाच्या तपासणीचा महत्त्वाचा भाग आहे. आपण गुटखा, खैनी, जर्दा, सुपारी, पान, बिडी किंवा सिगारेटचा वापर करता किंवा पूर्वी कधी केला आहे का?`
        : `${prefix}Lifestyle habits are an essential part of oral mucosal screening. Do you currently or previously use gutka, khaini, paan, supari, bidi, or cigarettes?`,
      suggestedQuickReplies: isHindi
        ? ['कभी किसी तंबाकू का उपयोग नहीं किया', 'रोज़ गुटखा / खैनी का सेवन', 'बीड़ी या सिगरेट पीता हूँ', 'कभी-कभार पान / सुपारी']
        : isMarathi
        ? ['कधीही तंबाखूचा वापर केला नाही', 'रोज गुटखा / खैनी खातो', 'बिडी किंवा सिगारेट ओढतो', 'कधीतरी पान / सुपारी']
        : ['Never used any tobacco or areca', 'Daily gutka / smokeless tobacco', 'Smoke bidi or cigarettes', 'Occasional paan / supari'],
    };
  }

  // Question 6: Alcohol Intake
  if (evalState.nextUnansweredQuestionId === 'alcohol') {
    return {
      replyText: isHindi
        ? `${prefix}क्या आप शराब (alcohol) का भी सेवन करते हैं? यदि हाँ, तो कभी-कभार (occasional) या नियमित (regular)?`
        : isMarathi
        ? `${prefix}आपण मद्यपान (alcohol) करता का? असल्यास, कधीतरी (occasional) की नियमित (regular)?`
        : `${prefix}Do you also consume alcohol, and if so, is it occasional or regular?`,
      suggestedQuickReplies: isHindi
        ? ['शराब का सेवन बिल्कुल नहीं करता', 'कभी-कभार (Occasional)', 'नियमित / अक्सर (Regular)']
        : isMarathi
        ? ['मद्यपान अजिबात करत नाही', 'कधीतरी (Occasional)', 'नियमित / वारंवार (Regular)']
        : ['Never drink alcohol', 'Occasionally / Socially', 'Regular / Frequent'],
    };
  }

  // Fallback
  return {
    replyText: isHindi
      ? `${prefix}धन्यवाद। सभी आवश्यक जानकारी दर्ज कर ली गई है। आप अपनी स्क्रीनिंग रिपोर्ट देख सकते हैं।`
      : isMarathi
      ? `${prefix}धन्यवाद. सर्व आवश्यक माहिती नोंदवली गेली आहे. आपण आपला तपासणी अहवाल पाहू शकता.`
      : `${prefix}Thank you. All necessary screening details have been recorded. You can now review your screening results.`,
    suggestedQuickReplies: isHindi
      ? ['मेरी स्क्रीनिंग रिपोर्ट देखें']
      : isMarathi
      ? ['माझा तपासणी अहवाल पहा']
      : ['View My Screening Results'],
    isReadyForEvaluation: true,
  };
}
