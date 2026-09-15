import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { generateAdaptiveDialogueTurn } from './src/data/conversationalEngine';
import {
  validateExtractedFacts,
  extractStructuredFactsLocally,
} from './src/data/clinicalKnowledge';
import { generateAskOralGuardReply } from './src/data/askOralGuardEngine';
import { retrieveRelevantKnowledge } from './src/services/knowledge/retrievalEngine';
import { detectEmergencySigns } from './src/services/safety/emergencyDetector';
import { buildAskOralGuardPrompt } from './src/services/llm/prompts';
import { getGeminiClient, executeGeminiPrompt } from './src/services/llm/geminiProvider';
import { ChatMessage, PatientProfile, ExtractedClinicalFacts, AppLanguage } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const SYSTEM_INSTRUCTION = `You are OralGuard AI — Conversational Oral Health Screening, Risk-Triage & Care Assistant. You are an advanced, empathetic, conversational oral health clinical AI companion (built with generative reasoning like Gemini). You evaluate OVERALL ORAL HEALTH (gum bleeding, toothaches, cold sensitivity, dental decay, oral malodor, ulcers/sores, mucosal white/red patches, swelling, jaw pain) while keeping oral-cancer-related red flags as an essential safety and triage category.

CORE AI INTELLIGENCE & CLINICAL REASONING:
1. THINK ON YOUR OWN & ANSWER THE USER'S SPECIFIC CONCERNS FIRST:
   - When the user shares symptoms (e.g. "My gums bleed when I brush and I have cold tooth sensitivity", "I have a sore on my tongue for 3 weeks", "My jaw clicks and hurts"), address ALL stated symptoms with personalized clinical empathy and clarity.
   - Do NOT force the user into a rigid single-disease questionnaire. Listen and adapt dynamically to what they share.
   - Use clear medical explanations formatted in clean Markdown (bullet points, bold key terms, concise paragraphs).

2. FLUID, DYNAMIC MULTI-CONCERN ORAL SCREENING & CARE TRIAGE:
   - Identify and track multiple oral health concerns in a single conversation.
   - Inquire about relevant clinical details (e.g., duration, triggers, severity, swelling, bleeding) naturally without repeating information already confirmed.
   - Direct the user to the appropriate level of care:
     * Routine Dental Prophylaxis / Scaling (e.g., for mild gingivitis, plaque)
     * General Dental Evaluation (e.g., for toothache, cavity, dental caries, dentine sensitivity)
     * Periodontist / Specialist Evaluation (e.g., for chronic bleeding gums, deep pockets)
     * Oral Medicine / Oral & Maxillofacial / ENT Evaluation (e.g., for persistent ulcer >2-3 weeks, white/red leukoplakic patch, mucosal thickening, restricted mouth opening / OSMF)
     * Immediate Hospital Emergency Evaluation (e.g., for acute airway obstruction, rapidly spreading facial/neck swelling, inability to swallow saliva, uncontrolled bleeding)

3. MEDICAL SAFETY & NON-DIAGNOSTIC GUIDANCE:
   - You provide non-diagnostic preliminary screening, risk stratification, and patient education.
   - You MUST NOT definitively diagnose diseases (e.g. do NOT say "You have stage 2 oral cancer" or "You have irreversible pulpitis"). Instead use clinically prudent phrasing like "Your symptoms are consistent with dentine hypersensitivity", "This sore warrants an in-person clinical examination by a dentist or oral specialist to determine the exact cause."
   - Never prescribe prescription medications (like antibiotics or narcotics). Suggest evidence-based supportive home hygiene (warm salt water rinses, soft brushing, desensitizing toothpaste) alongside professional consultation.

4. MULTILINGUAL & CULTURAL FLUENCY:
   - Respond in the user's selected language: clear English, authentic Hindi (हिन्दी), authentic Marathi (मराठी), or natural Hinglish.
   - Deeply understand South Asian oral habits: gutka, khaini, zarda, pan masala, betel quid/paan, supari (areca nut), bidi, cigarettes, and Oral Submucous Fibrosis (OSMF) with restricted mouth opening (trismus).

5. STRUCTURED CLINICAL FACT EXTRACTION (JSON OUTPUT):
   - You MUST output a strictly valid JSON object with the following schema:
     {
       "reply": "Your empathetic, generative AI response in clean markdown",
       "extractedFacts": {
         "hasLesionOrUlcer": "yes" | "no" | "unknown" | "not_mentioned",
         "ulcerDetails": "description if mentioned",
         "gumBleeding": "yes" | "no" | "unknown" | "not_mentioned",
         "toothPain": "yes" | "no" | "unknown" | "not_mentioned",
         "toothSensitivity": "yes" | "no" | "unknown" | "not_mentioned",
         "toothDecay": "yes" | "no" | "unknown" | "not_mentioned",
         "badBreath": "yes" | "no" | "unknown" | "not_mentioned",
         "oralSwelling": "yes" | "no" | "unknown" | "not_mentioned",
         "jawPain": "yes" | "no" | "unknown" | "not_mentioned",
         "dryMouth": "yes" | "no" | "unknown" | "not_mentioned",
         "multipleConcerns": ["bleeding gums", "tooth sensitivity", "tongue ulcer"],
         "primarySymptomLocation": "anatomical location",
         "multipleLocations": ["lower gums", "upper left molar"],
         "durationCategory": "less_than_2_weeks" | "two_to_four_weeks" | "more_than_one_month" | "unknown" | "not_mentioned",
         "durationText": "e.g. 3 weeks, 4 days",
         "pain": "yes" | "no" | "unknown" | "not_mentioned",
         "symptomTrigger": "e.g. brushing, cold water, chewing",
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
       "quickReplies": ["Natural relevant follow-up 1", "Natural relevant follow-up 2", "Natural relevant follow-up 3"]
     }`;

function extractCleanReply(rawText: string): {
  reply: string;
  extractedFacts?: any;
  quickReplies?: string[];
  suggestedQuestions?: string[];
  recommendedFeature?: string | null;
} {
  let clean = rawText.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  try {
    const obj = JSON.parse(clean);
    if (obj && typeof obj === 'object') {
      const reply = typeof obj.reply === 'string' && obj.reply.trim() ? obj.reply.trim() : clean;
      return {
        reply,
        extractedFacts: obj.extractedFacts,
        quickReplies: Array.isArray(obj.quickReplies)
          ? obj.quickReplies.map((q: unknown) => String(q).trim()).filter(Boolean)
          : undefined,
        suggestedQuestions: Array.isArray(obj.suggestedQuestions)
          ? obj.suggestedQuestions.map((q: unknown) => String(q).trim()).filter(Boolean)
          : undefined,
        recommendedFeature: typeof obj.recommendedFeature === 'string' ? obj.recommendedFeature : null,
      };
    }
  } catch {
    // If strict JSON.parse fails, attempt regex extraction for "reply": "..."
    const match = clean.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    if (match && match[1]) {
      try {
        const decoded = JSON.parse(`"${match[1]}"`);
        return { reply: decoded };
      } catch {
        return { reply: match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') };
      }
    }
  }
  return { reply: clean };
}

// Ask OralGuard Educational & Interactive Conversational AI API
app.post('/api/ask-oralguard', async (req, res) => {
  try {
    const { message, messages, profile, language = 'en' } = req.body;
    const currentLang: AppLanguage = (language === 'hi' || language === 'mr' ? language : 'en') as AppLanguage;
    const userQuery = (message || (messages && messages[messages.length - 1]?.content) || '').trim();

    if (!userQuery) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // 1. Deterministic Emergency Intercept
    const emergencyCheck = detectEmergencySigns(userQuery, currentLang);
    if (emergencyCheck.isEmergency && emergencyCheck.urgentGuidanceText) {
      return res.json({
        reply: emergencyCheck.urgentGuidanceText,
        suggestedQuestions:
          currentLang === 'hi'
            ? ['आपातकालीन दिशा-निर्देश देखें', 'नजदीकी अस्पताल खोजें']
            : currentLang === 'mr'
            ? ['तातडीची मदत पहा', 'जवळचे रुग्णालय शोधा']
            : ['View Emergency Guidance', 'Find Nearest Hospital'],
        recommendedFeature: 'emergency',
        isEmergencyAlert: true,
        source: 'gemini',
      });
    }

    // 2. Retrieve Relevant Knowledge
    const relevantKnowledge = retrieveRelevantKnowledge(userQuery, profile, currentLang, 3);

    // 3. Construct System Instruction
    const systemInstruction = buildAskOralGuardPrompt(userQuery, relevantKnowledge, profile, currentLang);

    // 4. Format Conversation History for Gemini
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];
    const rawHistory = Array.isArray(messages) ? messages : [{ role: 'user', content: userQuery }];

    for (const m of rawHistory as Array<{ role: string; content: string }>) {
      if (!m.content || typeof m.content !== 'string' || !m.content.trim()) continue;
      const role: 'user' | 'model' = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';

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
      formattedContents.push({ role: 'user', parts: [{ text: userQuery }] });
    }

    // 5. Call Gemini
    const geminiRaw = await executeGeminiPrompt(formattedContents, {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: 'application/json',
    });

    if (geminiRaw) {
      const extracted = extractCleanReply(geminiRaw);
      return res.json({
        reply: extracted.reply,
        suggestedQuestions: extracted.suggestedQuestions && extracted.suggestedQuestions.length > 0 ? extracted.suggestedQuestions : undefined,
        recommendedFeature: extracted.recommendedFeature,
        isEmergencyAlert: false,
        source: 'gemini',
      });
    }

    // 6. Resilient Fallback to Knowledge Engine if offline / quota
    const fallback = generateAskOralGuardReply(userQuery, profile || {}, currentLang);
    return res.json({
      reply: fallback.reply,
      suggestedQuestions: fallback.suggestedQuestions,
      recommendedFeature: fallback.isEmergencyAlert ? 'emergency' : null,
      isEmergencyAlert: fallback.isEmergencyAlert,
      source: 'clinical-engine',
    });
  } catch (error: unknown) {
    console.warn('[OralGuard AI] Ask-OralGuard fell back to clinical knowledge engine.');

    const currentLang = (req.body?.language || 'en') as AppLanguage;
    const fallback = generateAskOralGuardReply(req.body?.message || '', req.body?.profile || {}, currentLang);
    return res.json({
      reply: fallback.reply,
      suggestedQuestions: fallback.suggestedQuestions,
      recommendedFeature: null,
      isEmergencyAlert: false,
      source: 'clinical-engine',
    });
  }
});

// Conversational Screening & Triage Chat API with zero-downtime fallback
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      currentProfile,
      language,
      previouslyAnsweredIndicators,
      forbiddenTopics: clientForbiddenTopics,
      unansweredIndicators,
      imageAttachment,
    } = req.body;

    // Prepare clean alternating contents for Gemini
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    for (const m of (messages || []) as Array<{ role: string; content: string }>) {
      if (!m.content || typeof m.content !== 'string' || !m.content.trim()) continue;
      const role: 'user' | 'model' = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
      if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
        formattedContents[formattedContents.length - 1].parts[0].text += `\n${m.content.trim()}`;
      } else {
        formattedContents.push({
          role,
          parts: [{ text: m.content.trim() }],
        });
      }
    }

    // Attach image if provided by user in latest turn
    if (imageAttachment && imageAttachment.data && formattedContents.length > 0) {
      const lastItem = formattedContents[formattedContents.length - 1];
      if (lastItem.role === 'user') {
        lastItem.parts.push({
          inlineData: {
            mimeType: imageAttachment.mimeType || 'image/jpeg',
            data: imageAttachment.data,
          },
        });
      }
    }

    // Ensure contents starts with a user turn
    if (formattedContents.length > 0 && formattedContents[0].role === 'model') {
      formattedContents.shift();
    }
    if (formattedContents.length === 0) {
      formattedContents.push({ role: 'user', parts: [{ text: 'Hello, please introduce yourself and tell me how you can help.' }] });
    }

    const lastUserMsg = (messages?.[messages.length - 1]?.content || '') as string;
    const patientProfile: PatientProfile = (currentProfile || {}) as PatientProfile;
    const currentLang: AppLanguage = (language === 'hi' || language === 'mr' ? language : 'en') as AppLanguage;

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
      }
      if (currentProfile.colorChanges) {
        const desc = `Color changes: ${currentProfile.colorChanges}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.primarySymptomLocation) {
        const desc = `Location: ${currentProfile.primarySymptomLocation}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.duration || currentProfile.durationCategory || currentProfile.durationOverTwoWeeks !== undefined) {
        const desc = `Duration: ${currentProfile.durationText || currentProfile.duration || (currentProfile.durationOverTwoWeeks ? '> 2 weeks' : '< 2 weeks')}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.pain !== undefined || currentProfile.mouthPainOrBurning !== undefined) {
        const desc = `Pain / Burning: ${currentProfile.pain || currentProfile.mouthPainOrBurning ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.unexplainedBleeding !== undefined) {
        const desc = `Bleeding: ${currentProfile.unexplainedBleeding ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.reducedMouthOpening !== undefined) {
        const desc = `Mouth Opening (Trismus): ${currentProfile.reducedMouthOpening ? 'Restricted' : 'Normal'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.numbnessInMouth !== undefined) {
        const desc = `Numbness: ${currentProfile.numbnessInMouth ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.difficultySwallowing !== undefined) {
        const desc = `Swallowing difficulty: ${currentProfile.difficultySwallowing ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.tobaccoSmokeless !== undefined || currentProfile.tobaccoSmoked !== undefined || currentProfile.arecaOrBetelNut !== undefined) {
        const desc = `Tobacco/Areca habits: Smokeless=${currentProfile.tobaccoSmokeless || 'none'}, Smoked=${currentProfile.tobaccoSmoked || 'none'}, Areca=${currentProfile.arecaOrBetelNut || 'none'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.alcoholIntake !== undefined || currentProfile.alcoholUse !== undefined) {
        const desc = `Alcohol intake: ${currentProfile.alcoholIntake || currentProfile.alcoholUse}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
      if (currentProfile.chronicIrritation !== undefined) {
        const desc = `Sharp tooth / denture irritation: ${currentProfile.chronicIrritation ? 'Yes' : 'No'}`;
        if (!knownFields.includes(desc)) knownFields.push(desc);
      }
    }

    const isHindi = currentLang === 'hi';
    const isMarathi = currentLang === 'mr';
    const isEnglish = currentLang === 'en';

    const languageDirective = isEnglish
      ? 'CRITICAL MANDATE: Respond EXCLUSIVELY in simple, natural English. DO NOT use any Hindi words.'
      : isHindi
      ? 'CRITICAL MANDATE: Respond EXCLUSIVELY in clear, authentic Devanagari Hindi (हिन्दी). Anatomical or clinical terms may remain in English where appropriate.'
      : isMarathi
      ? 'CRITICAL MANDATE: Respond EXCLUSIVELY in clear, authentic Devanagari Marathi (मराठी). Anatomical or clinical terms may remain in English where appropriate.'
      : 'CRITICAL MANDATE: Respond in natural conversational English.';

    const retrievedKnowledge = retrieveRelevantKnowledge(lastUserMsg, patientProfile, currentLang, 2);

    const dynamicSystemInstruction = `${SYSTEM_INSTRUCTION}

${languageDirective}

TRUSTED ORALGUARD CLINICAL REFERENCE:
${retrievedKnowledge}

PATIENT CLINICAL DOSSIER (CONFIRMED SO FAR):
${knownFields.length > 0 ? knownFields.map(f => `• ${f}`).join('\n') : 'Initial interaction - no clinical facts established yet.'}

PENDING SCREENING ITEMS (ONLY INQUIRE IF USER IS ACTIVELY SEEKING A SCREENING):
${Array.isArray(unansweredIndicators) && unansweredIndicators.length > 0 ? unansweredIndicators.join(', ') : 'None'}

CONVERSATIONAL INTELLIGENCE DIRECTIVE:
1. THINK DEEPLY & ON YOUR OWN: You are a genuine generative AI medical companion. Give rich, accurate, and empathetic answers to whatever the patient asks.
2. If the user asks a question (medical, physiological, habit-related, symptom-related, or general health), answer their question comprehensively first using Markdown.
3. If the user describes their own mouth symptom, evaluate it conversationally and gently follow up with any relevant clinical question only if not already answered above.
4. Extract all stated facts into the 'extractedFacts' JSON object.
5. Return strictly valid JSON containing "reply", "extractedFacts", and "quickReplies".`;

    const rawMessages: ChatMessage[] = (messages || []).map((m: { id?: string; role?: string; content?: string }, idx: number) => ({
      id: m.id || `msg-${idx}`,
      role: (m.role as 'user' | 'assistant' | 'system') || 'user',
      content: m.content || '',
      timestamp: 'Just now',
    }));
    const turn = generateAdaptiveDialogueTurn(
      lastUserMsg,
      patientProfile,
      rawMessages,
      rawMessages.length
    );

    const localFacts = extractStructuredFactsLocally(lastUserMsg, patientProfile);

    const geminiReply = await executeGeminiPrompt(formattedContents, {
      systemInstruction: dynamicSystemInstruction,
      temperature: 0.7,
      responseMimeType: 'application/json',
    });

    if (geminiReply) {
      const extracted = extractCleanReply(geminiReply);
      let parsedFacts: ExtractedClinicalFacts = { ...localFacts };

      if (extracted.extractedFacts && typeof extracted.extractedFacts === 'object') {
        const validatedGeminiFacts = validateExtractedFacts(extracted.extractedFacts);
        parsedFacts = { ...localFacts, ...validatedGeminiFacts };
      }

      return res.json({
        reply: extracted.reply,
        extractedFacts: parsedFacts,
        quickReplies: extracted.quickReplies || turn.suggestedQuickReplies,
        source: 'gemini',
      });
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
