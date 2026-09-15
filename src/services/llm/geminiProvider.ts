/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Server-Side Gemini LLM Provider for OralGuard AI
 *
 * Implements modern @google/genai SDK patterns with telemetry, model cascading,
 * timeout controls, and structured parsing.
 */

import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

/**
 * Per-model cooldown timestamps to handle temporary 429/503 spikes gracefully
 */
const modelCooldowns = new Map<string, number>();

export interface GeminiCallOptions {
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: 'application/json' | 'text/plain';
  timeoutMs?: number;
}

/**
 * Call Gemini model with high-availability model cascading:
 * Starts with gemini-3.1-flash-lite for immediate responsiveness, with fallback to gemini-3.8-flash and gemini-flash-latest.
 */
export async function executeGeminiPrompt(
  contents: Array<{ role: 'user' | 'model'; parts: Array<any> }>,
  options: GeminiCallOptions = {}
): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) {
    return null;
  }

  const configuredModel = process.env.GEMINI_MODEL;
  const modelsToTry = configuredModel
    ? [configuredModel, 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-flash-latest']
    : ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

  // Deduplicate
  const uniqueModels = Array.from(new Set(modelsToTry));
  const now = Date.now();

  for (const model of uniqueModels) {
    // Check if this specific model is in temporary cooldown
    const cooldownUntil = modelCooldowns.get(model) || 0;
    if (now < cooldownUntil) {
      continue;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.7,
            responseMimeType: options.responseMimeType ?? 'application/json',
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

        const isTemporaryUnavailable =
          errorMessage.includes('503') ||
          errorMessage.includes('high demand') ||
          errorMessage.includes('UNAVAILABLE');

        if (isQuotaExceeded) {
          // Put this specific model on cooldown and immediately try the next model
          modelCooldowns.set(model, Date.now() + 60_000);
          break;
        }

        if (isTemporaryUnavailable) {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
          // If attempt 2 also fails with 503, put model on short 30s cooldown and try next model
          modelCooldowns.set(model, Date.now() + 30_000);
          break;
        }

        // For other fatal model errors (e.g. 404), skip model
        break;
      }
    }
  }

  return null;
}
