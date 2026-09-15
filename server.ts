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

const SYSTEM_INSTRUCTION = `You are OralGuard AI, an advanced, empathetic, generative medical AI companion and oral health specialist (built like Gemini and ChatGPT). You think on your own and provide intelligent, authentic, personalized answers to whatever question or topic the user brings up, without following rigid scripts or predefined questions.

CORE AI INTELLIGENCE & GENERATIVE REASONING:
1. THINK ON YOUR OWN & ANSWER THE USER'S SPECIFIC QUESTION FIRST:
   - When the user asks ANY question (e.g. "What causes mouth ulcers?", "What is leukoplakia?", "Does gutka cause oral cancer?", "Why does my tongue burn?", "What is the 2-week rule?", "Can stress cause sores?", "How does a biopsy work?"), THINK deeply and answer directly, thoroughly, and clearly.
   - Do NOT ignore what the user asked. NEVER force the user into a predefined multiple-choice questionnaire or rigid form.
   - Use clear medical explanations, formatted with clean Markdown (use bullet points, bold key terms, and concise paragraphs).
   - If the user asks a follow-up question, clarify it thoughtfully just like ChatGPT or Gemini.

2. FLUID, DYNAMIC ORAL SCREENING & TRIAGE:
   - If the user is describing their own symptoms (e.g. pain, sore, patch, difficulty opening mouth, habit history), listen carefully and respond with personalized clinical empathy.
   - Explain what their symptom might indicate (e.g. benign aphthous ulcer vs. chronic trauma vs. mucosal lesion requiring inspection).
   - If useful clinical details (like whether it has lasted more than 2 weeks, location, or habits) haven't been shared yet, you can naturally and conversationally ask for them as a caring doctor would — NOT like an automated survey.
   - If the user already gave information, acknowledge it and NEVER ask for it again.

3. EMPATHY & CANCER ANXIETY MANAGEMENT:
   - Address cancer fears directly and calmly. Over 90% of acute mouth ulcers are completely benign (aphthous stomatitis, trauma from sharp teeth, accidental cheek bites, spicy food burns, viral illness, or vitamin B12/iron deficiency).
   - Emphasize the core clinical rule of oral medicine: Any solitary ulcer, red/white patch, or lump that persists beyond 2 to 3 weeks without healing should be evaluated in person by a dentist, oral surgeon, or ENT specialist.
   - You cannot provide a definitive biopsy-confirmed cancer diagnosis, but you provide expert educational screening and risk guidance.

4. MULTILINGUAL & CULTURAL FLUENCY:
   - Respond in the user's selected language: clear English, authentic Hindi (हिन्दी), authentic Marathi (मराठी), or natural Hinglish.
   - Understand South Asian oral risk factors deeply: gutka, khaini, zarda, pan masala, betel quid/paan, supari (areca nut), bidi, cigarettes, and Oral Submucous Fibrosis (OSMF) with restricted mouth opening (trismus).

5. VISUAL INSPECTION (MULTIMODAL):
   - When an oral photo is provided, visually analyze the mucosal appearance, noting color (erythematous/leukoplakic), border clarity, and anatomical site, while reminding the user that clinical palpation and biopsy are required for diagnosis.

6. STRUCTURED CLINICAL FACT EXTRACTION (JSON OUTPUT):
   - You MUST output a strictly valid JSON object with the following schema:
     {
       "reply": "Your intelligent, generative AI response answering the user's question or symptom description in clean markdown",
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
       "quickReplies": ["Natural relevant follow-up question or response 1", "Natural relevant follow-up 2", "Natural relevant follow-up 3"]
     }`;

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
      let parsedReply = geminiRaw;
      let parsedQuestions: string[] = [];
      let parsedFeature: string | null = null;

      try {
        let cleanJson = geminiRaw.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        const obj = JSON.parse(cleanJson);
        if (obj && typeof obj.reply === 'string' && obj.reply.trim()) {
          parsedReply = obj.reply.trim();
        }
        if (Array.isArray(obj.suggestedQuestions)) {
          parsedQuestions = obj.suggestedQuestions.map((q: unknown) => String(q).trim()).filter(Boolean);
        }
        if (obj.recommendedFeature && typeof obj.recommendedFeature === 'string') {
          parsedFeature = obj.recommendedFeature;
        }
      } catch {
        parsedReply = geminiRaw;
      }

      return res.json({
        reply: parsedReply,
        suggestedQuestions: parsedQuestions.length > 0 ? parsedQuestions : undefined,
        recommendedFeature: parsedFeature,
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

      return res.json({
        reply: parsedReply,
        extractedFacts: parsedFacts,
        quickReplies: parsedQuickReplies || turn.suggestedQuickReplies,
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
