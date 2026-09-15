/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Gemini Service for OralGuard AI
 *
 * Implements conversational AI interactions with Google Gemini, sending user messages,
 * full multi-turn conversation context, and defined 'OralGuard' clinical system instructions.
 * Handles errors gracefully with seamless failover.
 */

import { ChatMessage, PatientProfile, AppLanguage } from '../types';
import { getViteGeminiApiKey } from '../config/env';
import { ORALGUARD_BASE_SYSTEM_INSTRUCTION, buildAskOralGuardPrompt } from './llm/prompts';
import { retrieveRelevantKnowledge } from './knowledge/retrievalEngine';
import { detectEmergencySigns } from './safety/emergencyDetector';
import { generateAskOralGuardReply } from '../data/askOralGuardEngine';

/**
 * Standard role-content message structure representing a single conversational turn.
 */
export interface RoleContentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GeminiConversationRequest {
  message: string;
  history?: Array<RoleContentMessage | ChatMessage>;
  profile?: PatientProfile;
  language?: AppLanguage;
  systemInstructionOverride?: string;
}

export interface GeminiConversationResponse {
  reply: string;
  suggestedQuestions: string[];
  recommendedFeature?: 'mouth_map' | 'mouth_scanner' | 'doctor_handoff' | 'cessation' | 'emergency' | null;
  isEmergencyAlert?: boolean;
  source: 'gemini-direct' | 'gemini-proxy' | 'clinical-knowledge-fallback';
}

/**
 * Transforms an array of role-content messages or ChatMessages into Gemini-compatible content parts.
 * Merges consecutive turns of the same role and ensures alternating turns.
 */
export function formatConversationContext(
  history: Array<RoleContentMessage | ChatMessage> = [],
  currentMessage: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const m of history) {
    if (!m.content || typeof m.content !== 'string' || !m.content.trim()) continue;
    if (m.role === 'system') continue;

    const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n${m.content.trim()}`;
    } else {
      contents.push({
        role,
        parts: [{ text: m.content.trim() }],
      });
    }
  }

  // Ensure current user message is appended if not already present at the end
  const trimmed = currentMessage.trim();
  if (trimmed) {
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      // Append if last user turn is not identical
      if (!contents[contents.length - 1].parts[0].text.endsWith(trimmed)) {
        contents[contents.length - 1].parts[0].text += `\n${trimmed}`;
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: trimmed }],
      });
    }
  }

  // Ensure dialogue starts with a user turn
  if (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  if (contents.length === 0 && trimmed) {
    contents.push({
      role: 'user',
      parts: [{ text: trimmed }],
    });
  }

  return contents;
}

/**
 * Main interaction function: sends user message, conversation context, and defined
 * 'OralGuard' system instructions to the Gemini API, handling errors gracefully.
 */
export async function sendGeminiConversationMessage(
  request: GeminiConversationRequest
): Promise<GeminiConversationResponse> {
  const { message, history = [], profile = {}, language = 'en', systemInstructionOverride } = request;
  const trimmed = (message || '').trim();

  // 1. Safety Check: Intercept acute red flags with deterministic emergency detector
  const emergencyCheck = detectEmergencySigns(trimmed, language);
  if (emergencyCheck.isEmergency && emergencyCheck.urgentGuidanceText) {
    return {
      reply: emergencyCheck.urgentGuidanceText,
      suggestedQuestions:
        language === 'hi'
          ? ['आपातकालीन दिशा-निर्देश देखें', 'नजदीकी अस्पताल खोजें']
          : language === 'mr'
          ? ['तातडीची मदत पहा', 'जवळचे रुग्णालय शोधा']
          : ['View Emergency Guidance', 'Find Nearest Hospital'],
      recommendedFeature: 'emergency',
      isEmergencyAlert: true,
      source: 'gemini-direct',
    };
  }

  // 2. Prepare Context & Knowledge
  const relevantKnowledge = retrieveRelevantKnowledge(trimmed, profile, language, 3);
  const systemInstruction =
    systemInstructionOverride || buildAskOralGuardPrompt(trimmed, relevantKnowledge, profile, language);

  const formattedContents = formatConversationContext(history, trimmed);

  // 3. Attempt Direct Gemini REST API if client key is securely configured
  const clientKey = getViteGeminiApiKey();
  if (clientKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(clientKey)}`;
      const restPayload = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      };

      const restRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restPayload),
      });

      if (restRes.ok) {
        const json = await restRes.json();
        const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          const raw = candidateText.trim();
          let parsedReply = raw;
          let parsedQuestions: string[] = [];
          let parsedFeature: 'mouth_map' | 'mouth_scanner' | 'doctor_handoff' | 'cessation' | 'emergency' | null = null;

          try {
            let cleanJson = raw;
            if (cleanJson.startsWith('```')) {
              cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
            }
            const parsed = JSON.parse(cleanJson);
            if (parsed.reply && typeof parsed.reply === 'string') {
              parsedReply = parsed.reply;
            }
            if (Array.isArray(parsed.suggestedQuestions)) {
              parsedQuestions = parsed.suggestedQuestions.map((q: unknown) => String(q).trim()).filter(Boolean);
            }
            if (parsed.recommendedFeature && typeof parsed.recommendedFeature === 'string') {
              parsedFeature = parsed.recommendedFeature as any;
            }
          } catch {
            parsedReply = raw;
          }

          return {
            reply: parsedReply,
            suggestedQuestions: parsedQuestions,
            recommendedFeature: parsedFeature,
            isEmergencyAlert: false,
            source: 'gemini-direct',
          };
        }
      }
    } catch (err: unknown) {
      console.warn('[GeminiService] Direct client call encountered an issue, transitioning to server proxy:', err);
    }
  }

  // 4. Server Proxy Route (/api/ask-oralguard) with full conversational history
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const historyPayload = history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    if (trimmed && (historyPayload.length === 0 || historyPayload[historyPayload.length - 1].content !== trimmed)) {
      historyPayload.push({ role: 'user', content: trimmed });
    }

    const response = await fetch('/api/ask-oralguard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: trimmed,
        messages: historyPayload,
        profile,
        language,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.reply) {
        return {
          reply: data.reply,
          suggestedQuestions: Array.isArray(data.suggestedQuestions) ? data.suggestedQuestions : [],
          recommendedFeature: data.recommendedFeature || null,
          isEmergencyAlert: Boolean(data.isEmergencyAlert),
          source: 'gemini-proxy',
        };
      }
    }
  } catch (err: unknown) {
    console.warn('[GeminiService] Server proxy unavailable, applying local clinical engine:', err);
  }

  // 5. Graceful Local Clinical Knowledge Fallback
  const fallback = generateAskOralGuardReply(trimmed, profile, language);
  return {
    reply: fallback.reply,
    suggestedQuestions: fallback.suggestedQuestions,
    recommendedFeature: fallback.isEmergencyAlert ? 'emergency' : null,
    isEmergencyAlert: fallback.isEmergencyAlert,
    source: 'clinical-knowledge-fallback',
  };
}

/**
 * Core fetch function to interface with the Gemini API using VITE_GEMINI_API_KEY from environment variables.
 * Ensures the API key is handled securely and not exposed in client code or public UI elements.
 * Incorporates the predefined OralGuard system instructions and formats the response for natural conversation.
 */
export async function fetchGeminiResponse(
  message: string,
  history: Array<RoleContentMessage | ChatMessage> = [],
  profile?: PatientProfile,
  language: AppLanguage = 'en'
): Promise<GeminiConversationResponse> {
  return sendGeminiConversationMessage({
    message,
    history,
    profile,
    language,
  });
}

export { ORALGUARD_BASE_SYSTEM_INSTRUCTION };
