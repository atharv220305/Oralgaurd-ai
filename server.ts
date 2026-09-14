import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { generateAdaptiveDialogueTurn } from './src/data/conversationalEngine';
import {
  validateExtractedFacts,
  extractStructuredFactsLocally,
} from './src/data/clinicalKnowledge';
import { ChatMessage, PatientProfile, ExtractedClinicalFacts } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily if key is available
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

const SYSTEM_INSTRUCTION = `You are OralGuard AI, an empathetic, conversational oral-health screening and awareness companion focused on early oral cancer risk evaluation.

CRITICAL CLINICAL & CONVERSATIONAL MANDATES:
1. NEVER SOUND LIKE A QUESTIONNAIRE OR FORM:
   - Speak like a caring, knowledgeable doctor having a natural 1-on-1 consultation.
   - If the patient shares multiple details in one message (e.g. sore + location + duration + habits), acknowledge ALL of them naturally in your response. NEVER ask for details the patient already provided.
   - If the patient corrects something (e.g. "Actually it's on my cheek, not tongue" or "It's closer to 3 weeks"), smoothly acknowledge the correction without getting confused.
   - If the patient is uncertain or says "not sure / don't know", reassure them that it's okay and proceed naturally.
2. EMPATHY & EMOTIONAL REASSURANCE:
   - If the user expresses anxiety, fear of cancer ("Is it cancer?", "I'm terrified", "dar lag raha hai"), or severe pain, offer immediate calm reassurance before continuing.
   - Zero shaming: Maintain complete respect and zero judgment regarding tobacco, gutka, khaini, bidi, cigarettes, or alcohol habits.
3. CANNOT DIAGNOSE CANCER:
   - Only a qualified healthcare professional can diagnose or rule out cancer. Never say "You have cancer" or "You do not have cancer".
4. STRUCTURED CLINICAL FACT EXTRACTION:
   - Along with your conversational reply, you MUST extract all clinical facts present in the patient's message into "extractedFacts".
   - Follow these strict clinical extraction rules:
     a. NEGATION: If patient denies a symptom or habit (e.g., "I don't smoke", "no bleeding", "dard nahi hai", "no sores"), set that fact to "no" or "none". NEVER ignore negations!
     b. UNCERTAINTY: If patient is unsure (e.g., "I'm not sure how long", "don't know", "pata nahi"), set that field to "unknown". NEVER guess or assume!
     c. NOT MENTIONED: If a topic was not addressed in the user message, set it to "not_mentioned" or omit it. Do not guess facts.
     d. MULTIPLE CONCERNS: If user mentions multiple symptoms (e.g., "sore on tongue and bleeding gums"), extract both into "multipleConcerns", and set "hasLesionOrUlcer": "yes" and "unexplainedBleeding": "yes".
     e. MULTIPLE LOCATIONS: If user mentions multiple oral sites (e.g., "tongue and cheek"), list all in "multipleLocations".
     f. CORRECTIONS: If patient corrects previous information (e.g., "Actually it's been 3 weeks, not 2"), set "isCorrection": true, and set the new corrected value.
5. OUTPUT FORMAT:
   - You MUST output a strictly valid JSON object with the following schema:
     {
       "reply": "Your conversational, empathetic response text",
       "extractedFacts": {
         "hasLesionOrUlcer": "yes" | "no" | "unknown" | "not_mentioned",
         "ulcerDetails": "description if mentioned",
         "multipleConcerns": ["sore on tongue", "bleeding gums"],
         "primarySymptomLocation": "anatomical location",
         "multipleLocations": ["location 1", "location 2"],
         "durationCategory": "less_than_2_weeks" | "two_to_four_weeks" | "more_than_one_month" | "unknown" | "not_mentioned",
         "durationText": "e.g. 3 weeks, 10 days",
         "pain": "yes" | "no" | "unknown" | "not_mentioned",
         "symptomTrigger": "e.g. spicy food, chewing",
         "colorChanges": "none" | "white" | "red" | "mixed" | "unknown" | "not_mentioned",
         "thickeningOrLump": "yes" | "no" | "unknown" | "not_mentioned",
         "unexplainedBleeding": "yes" | "no" | "unknown" | "not_mentioned",
         "reducedMouthOpening": "yes" | "no" | "unknown" | "not_mentioned",
         "numbnessInMouth": "yes" | "no" | "unknown" | "not_mentioned",
         "difficultySwallowing": "yes" | "no" | "unknown" | "not_mentioned",
         "neckLumpOrSwelling": "yes" | "no" | "unknown" | "not_mentioned",
         "smokingStatus": "yes" | "no" | "unknown" | "not_mentioned",
         "tobaccoSmoked": "none" | "bidi" | "cigarettes" | "both" | "unknown" | "not_mentioned",
         "tobaccoSmokelessStatus": "yes" | "no" | "unknown" | "not_mentioned",
         "tobaccoSmokeless": "none" | "gutka" | "khaini" | "zarda" | "tobacco_paan" | "unknown" | "not_mentioned",
         "arecaOrBetelNut": "none" | "supari" | "betel_quid" | "pan_masala" | "unknown" | "not_mentioned",
         "alcoholStatus": "yes" | "no" | "unknown" | "not_mentioned",
         "alcoholIntake": "none" | "rare" | "moderate" | "heavy" | "unknown" | "not_mentioned",
         "chronicIrritation": "yes" | "no" | "unknown" | "not_mentioned",
         "isCorrection": true | false,
         "correctionDetails": "what was corrected",
         "emergencyFlag": true | false
       },
       "quickReplies": ["Natural suggestion 1", "Natural suggestion 2", "Natural suggestion 3"]
     }`;

/**
 * Circuit breaker state for Gemini API quota limits (429 / RESOURCE_EXHAUSTED).
 * When active, requests bypass remote Gemini calls and immediately use the
 * built-in clinical dialogue engine to avoid latency and unnecessary errors.
 */
let geminiQuotaCooldownUntil = 0;

/**
 * Call Gemini with automatic model cascade, quota circuit breaker, and retry for high demand (503).
 */
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  systemInstruction: string
): Promise<string | null> {
  // If in quota cooldown period, immediately fallback to clinical dialogue engine
  if (Date.now() < geminiQuotaCooldownUntil) {
    return null;
  }

  // Model cascade: If primary model experiences temporary high demand,
  // gracefully try secondary models.
  const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.65,
            responseMimeType: 'application/json',
          },
        });

        if (response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const isQuotaExceeded =
          errorMessage.includes('429') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          errorMessage.includes('exceeded your current quota');

        if (isQuotaExceeded) {
          // Trip circuit breaker for 60 seconds: do not retry or spam the exhausted API
          geminiQuotaCooldownUntil = Date.now() + 60_000;
          console.log('[OralGuard AI] Gemini quota reached. Activating zero-latency clinical engine fallback.');
          return null;
        }

        const isTemporaryHighDemand =
          errorMessage.includes('503') ||
          errorMessage.includes('high demand') ||
          errorMessage.includes('UNAVAILABLE');

        console.log(`[OralGuard AI] Model ${model} turn ${attempt + 1}: temporary unavailability.`);

        if (attempt === 0 && isTemporaryHighDemand) {
          // Brief pause before single retry for transient 503
          await new Promise((resolve) => setTimeout(resolve, 350));
          continue;
        }

        // Advance to next model in cascade
        break;
      }
    }
  }

  return null;
}

// Conversational Chat API with zero-downtime fallback
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      currentProfile,
      language,
      previouslyAnsweredIndicators,
      forbiddenTopics: clientForbiddenTopics,
      unansweredIndicators,
    } = req.body;
    const ai = getGenAI();

    // Prepare clean alternating contents for Gemini
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const m of (messages || []) as Array<{ role: string; content: string }>) {
      if (!m.content || typeof m.content !== 'string' || !m.content.trim()) continue;
      const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';
      if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
        formattedContents[formattedContents.length - 1].parts[0].text += `\n${m.content.trim()}`;
      } else {
        formattedContents.push({
          role,
          parts: [{ text: m.content.trim() }],
        });
      }
    }

    // Ensure contents starts with a user turn
    if (formattedContents.length > 0 && formattedContents[0].role === 'model') {
      formattedContents.shift();
    }
    if (formattedContents.length === 0) {
      formattedContents.push({ role: 'user', parts: [{ text: 'Namaste, please begin oral health screening.' }] });
    }

    const knownFields: string[] = [];
    const forbiddenTopics: string[] = [];

    // Incorporate previously answered indicators from client's persistent screeningSession
    if (Array.isArray(previouslyAnsweredIndicators)) {
      for (const item of previouslyAnsweredIndicators) {
        if (typeof item === 'string' && item.trim() && !knownFields.includes(item.trim())) {
          knownFields.push(item.trim());
        }
      }
    }

    if (Array.isArray(clientForbiddenTopics)) {
      for (const topic of clientForbiddenTopics) {
        if (typeof topic === 'string' && topic.trim() && !forbiddenTopics.includes(topic.trim())) {
          forbiddenTopics.push(topic.trim());
        }
      }
    }

    if (currentProfile) {
      if (currentProfile.hasLesionOrUlcer !== undefined) {
        const desc = `Oral Sore/Ulcer: ${currentProfile.hasLesionOrUlcer ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('whether user has a mouth sore or ulcer');
      }
      if (currentProfile.colorChanges) {
        const desc = `Color changes: ${currentProfile.colorChanges}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('color of lesion (white/red)');
      }
      if (currentProfile.primarySymptomLocation) {
        const desc = `Location: ${currentProfile.primarySymptomLocation}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('location of the sore or ulcer in the mouth');
      }
      if (currentProfile.duration || currentProfile.durationCategory || currentProfile.durationOverTwoWeeks !== undefined) {
        const desc = `Duration: ${currentProfile.durationText || currentProfile.duration || (currentProfile.durationOverTwoWeeks ? '> 2 weeks' : '< 2 weeks')}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('duration of sore/symptom (how long they had it)');
        forbiddenTopics.push('how long has this been present');
        forbiddenTopics.push('approximately how long has this been present');
        forbiddenTopics.push('how long it has been there');
      }
      if (currentProfile.pain !== undefined || currentProfile.mouthPainOrBurning !== undefined) {
        const desc = `Pain / Burning: ${currentProfile.pain || currentProfile.mouthPainOrBurning ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('whether it hurts or is painful');
      }
      if (currentProfile.unexplainedBleeding !== undefined) {
        const desc = `Bleeding: ${currentProfile.unexplainedBleeding ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('bleeding from sore or mouth');
      }
      if (currentProfile.reducedMouthOpening !== undefined) {
        const desc = `Mouth Opening (Trismus): ${currentProfile.reducedMouthOpening ? 'Restricted' : 'Normal'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('difficulty opening mouth');
      }
      if (currentProfile.numbnessInMouth !== undefined) {
        const desc = `Numbness: ${currentProfile.numbnessInMouth ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('numbness in lips, tongue, or mouth');
      }
      if (currentProfile.difficultySwallowing !== undefined) {
        const desc = `Swallowing difficulty: ${currentProfile.difficultySwallowing ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('difficulty swallowing food or liquids');
      }
      if (currentProfile.tobaccoSmokeless !== undefined || currentProfile.tobaccoSmoked !== undefined || currentProfile.arecaOrBetelNut !== undefined) {
        const desc = `Tobacco/Areca habits: Smokeless=${currentProfile.tobaccoSmokeless || 'none'}, Smoked=${currentProfile.tobaccoSmoked || 'none'}, Areca=${currentProfile.arecaOrBetelNut || 'none'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('tobacco habits (gutka, khaini, bidi, cigarettes, supari, paan)');
      }
      if (currentProfile.alcoholIntake !== undefined || currentProfile.alcoholUse !== undefined) {
        const desc = `Alcohol intake: ${currentProfile.alcoholIntake || currentProfile.alcoholUse}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('alcohol consumption');
      }
      if (currentProfile.chronicIrritation !== undefined) {
        const desc = `Sharp tooth / denture irritation: ${currentProfile.chronicIrritation ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
        forbiddenTopics.push('sharp tooth or denture irritation');
      }
    }

    // Filter out previous questions from model context window turns if they touch forbidden topics
    for (const item of formattedContents) {
      if (item.role === 'model') {
        const text = item.parts[0].text.toLowerCase();
        const askedForbidden = forbiddenTopics.some((topic) =>
          text.includes(topic.toLowerCase().slice(0, 14))
        );
        if (askedForbidden) {
          item.parts[0].text = 'Understood and noted your oral symptoms in your clinical screening record.';
        }
      }
    }

    // Determine the single next required clinical question strictly aligned with getScreeningQuestionsStatus
    let nextTopicDirective = '';
    const hasLesion = Boolean(
      currentProfile?.hasLesionOrUlcer ||
      currentProfile?.colorChanges ||
      currentProfile?.thickeningOrLump
    );
    const hasLocation = Boolean(
      (currentProfile?.affectedRegions && currentProfile.affectedRegions.length > 0) ||
      currentProfile?.primarySymptomLocation
    );

    const hasDuration = Boolean(
      currentProfile?.duration ||
      currentProfile?.durationCategory ||
      currentProfile?.durationOverTwoWeeks !== undefined
    );

    if (hasLesion && !hasLocation) {
      nextTopicDirective = 'Acknowledge the sore or discomfort with empathy. Then conversationally ask where in the mouth this sore or discomfort is located (e.g. inside cheek, side of tongue, gums, or floor of mouth). Mention they can also tap the interactive Mouth Map above to mark it.';
    } else if (hasLesion && !hasDuration) {
      nextTopicDirective = 'Acknowledge the location warmly. Ask conversationally how long it has been present (e.g. just a few days, 2-4 weeks, or more than a month). Explain gently that duration helps doctors evaluate whether a sore needs closer inspection.';
    } else if (currentProfile?.unexplainedBleeding === undefined && currentProfile?.numbnessInMouth === undefined && currentProfile?.reducedMouthOpening === undefined) {
      nextTopicDirective = 'Acknowledge the sore, location, and duration warmly and empathetically in a single natural sentence. Ask conversationally if they have noticed any associated warning signs, such as difficulty opening their mouth fully (trismus), bleeding from the area, or numbness in their lips, tongue, or mouth. DO NOT ask about how long the sore has been present or where it is located, because that information was already provided.';
    } else if (currentProfile?.tobaccoSmokeless === undefined && currentProfile?.tobaccoSmoked === undefined && currentProfile?.arecaOrBetelNut === undefined) {
      nextTopicDirective = 'Acknowledge their response about warning signs. Transition smoothly and non-judgmentally to lifestyle habits: ask whether they currently or previously use any tobacco or areca nut products (gutka, khaini, zarda, bidi, cigarettes, supari, or paan). Emphasize that our chat is completely confidential and non-judgmental.';
    } else if (currentProfile?.alcoholIntake === undefined && currentProfile?.alcoholUse === undefined) {
      nextTopicDirective = 'Acknowledge their tobacco status respectfully. Ask conversationally whether they also consume alcohol (occasional, regular, or never). DO NOT state results are ready yet because alcohol intake is still unanswered.';
    } else {
      nextTopicDirective = 'All required screening questions are answered. Warmly thank the patient for sharing their details so openly. Reassure them, and let them know that their preliminary screening evaluation and doctor summary are ready to review.';
    }

    const isHindi = language === 'hi';
    const isEnglish = language === 'en';

    const languageDirective = isEnglish
      ? 'CRITICAL MANDATE: Respond EXCLUSIVELY in simple, natural English. DO NOT use any Hindi or Hinglish words. Anatomical terms like "Left Inner Cheek (Buccal Mucosa)" may remain in English where clinically appropriate.'
      : isHindi
      ? 'CRITICAL MANDATE: Respond EXCLUSIVELY in clear, authentic Devanagari Hindi (हिन्दी). Anatomical terms like "Left Inner Cheek (Buccal Mucosa)" may remain in English where clinically appropriate, but the surrounding sentence MUST strictly follow Hindi. DO NOT switch or reset to English or Hinglish.'
      : 'CRITICAL MANDATE: Respond in natural conversational Indian Hinglish in Latin script (e.g., "Samajh gaya. Ye problem aapko lagbhag kitne samay se hai?"). Anatomical terms like "Left Inner Cheek (Buccal Mucosa)" may remain in English where clinically appropriate.';

    const dynamicSystemInstruction = `${SYSTEM_INSTRUCTION}

${languageDirective}

CLINICAL CONTEXT FILTER (STRICTLY EXCLUDED & PREVIOUSLY ANSWERED):
The following clinical indicators have already been fully answered by the patient and are permanently filtered out of your inquiry window:
${knownFields.length > 0 ? knownFields.map(f => `• ${f}`).join('\n') : 'Initial turn - no indicators confirmed yet'}

FORBIDDEN TOPICS (NEVER ASK ABOUT ANY OF THESE):
${forbiddenTopics.length > 0 ? forbiddenTopics.map(t => `• ${t}`).join('\n') : 'None yet'}

TARGET CLINICAL INQUIRY:
${nextTopicDirective}

STRICT CONVERSATION MEMORY RULES:
1. NEVER REPEAT QUESTIONS: You are strictly forbidden from asking about any of the forbidden topics above.
2. If the user answered a question, do not re-ask it even with different wording.
3. Always acknowledge what the user just stated in a warm, natural conversational sentence.
4. Ask ONLY ONE single question at a time focusing on the TARGET CLINICAL INQUIRY.
5. Never diagnose cancer or say "You have cancer" or "You are cancer-free".
6. Return JSON format with "reply" and "quickReplies" properties.`;

    const rawMessages: ChatMessage[] = (messages || []).map((m: { id?: string; role?: string; content?: string }, idx: number) => ({
      id: m.id || `msg-${idx}`,
      role: (m.role as 'user' | 'assistant' | 'system') || 'user',
      content: m.content || '',
      timestamp: 'Just now',
    }));
    const lastUserMsg = (messages?.[messages.length - 1]?.content || '') as string;
    const patientProfile: PatientProfile = (currentProfile || {}) as PatientProfile;
    const turn = generateAdaptiveDialogueTurn(
      lastUserMsg,
      patientProfile,
      rawMessages,
      rawMessages.length
    );

    const localFacts = extractStructuredFactsLocally(lastUserMsg, patientProfile);

    if (ai) {
      const geminiReply = await callGeminiWithFallback(ai, formattedContents, dynamicSystemInstruction);
      if (geminiReply) {
        let parsedReply = geminiReply;
        let parsedQuickReplies: string[] | undefined = undefined;
        let parsedFacts: ExtractedClinicalFacts = { ...localFacts };

        try {
          let cleanJson = geminiReply.trim();
          if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
          }
          const obj = JSON.parse(cleanJson);
          if (obj && typeof obj.reply === 'string' && obj.reply.trim()) {
            parsedReply = obj.reply.trim();
          }
          if (Array.isArray(obj.quickReplies) && obj.quickReplies.length > 0) {
            parsedQuickReplies = obj.quickReplies.map((q: unknown) => String(q).trim()).filter(Boolean);
          }
          if (obj && obj.extractedFacts && typeof obj.extractedFacts === 'object') {
            const validatedGeminiFacts = validateExtractedFacts(obj.extractedFacts);
            parsedFacts = { ...localFacts, ...validatedGeminiFacts };
          }
        } catch {
          parsedReply = geminiReply;
        }

        // Quality guard: never allow Gemini to re-ask duration or location if already answered
        const asksDuration = /how long|kitne samay|kitne time|how many weeks|how many days|duration|approximately how long|कितने समय/i.test(parsedReply);
        if (hasDuration && asksDuration) {
          parsedReply = turn.replyText;
        }

        const asksLocation = /where in your mouth|which part of (?:your|the) mouth|muh ke kis hisse|मुँह के किस हिस्से/i.test(parsedReply);
        if (hasLocation && asksLocation) {
          parsedReply = turn.replyText;
        }

        return res.json({
          reply: parsedReply,
          extractedFacts: parsedFacts,
          quickReplies: parsedQuickReplies || turn.suggestedQuickReplies,
          source: 'gemini',
        });
      }
    }

    // Seamless fallback to clinical dialogue engine (guarantees 100% uptime even during Gemini 503 spikes)
    return res.json({
      reply: turn.replyText,
      extractedFacts: localFacts,
      quickReplies: turn.suggestedQuickReplies,
      source: 'clinical-engine',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.log('[OralGuard AI] Handled chat request gracefully:', errMessage.slice(0, 100));

    // Return friendly, supportive fallback rather than 500
    const fallbackReply =
      "Aapki baat samajh gaya. Kya aap bata sakte hain ki ye takleef lagbhag kitne samay se hai (2 hafton se kam, ya 2 hafton se zyada)?";

    const lastUserMsg = (req.body?.messages?.[req.body?.messages?.length - 1]?.content || '') as string;
    const fallbackProfile = (req.body?.currentProfile || {}) as PatientProfile;
    const fallbackFacts = extractStructuredFactsLocally(lastUserMsg, fallbackProfile);

    return res.json({
      reply: fallbackReply,
      extractedFacts: fallbackFacts,
      source: 'emergency-fallback',
      quickReplies: ['2 hafton se kam (< 2 weeks)', '2 se 4 hafte (2-4 weeks)', '1 mahine se zyada (> 1 month)'],
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', app: 'OralGuard AI', version: '2.0.0' });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OralGuard AI V2 server running on http://0.0.0.0:${PORT}`);
  });
}

start();
