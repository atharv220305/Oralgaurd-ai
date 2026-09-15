/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * OralGuard AI Service Client Layer
 *
 * Provides a clean abstraction between React UI components and the OralGuard backend.
 * Handles conversation memory formatting, timeout controls, error states, and local fallback.
 */

import { ChatMessage, PatientProfile, AppLanguage } from '../types';
import { sendGeminiConversationMessage } from './geminiService';

export interface AskOralGuardRequest {
  message: string;
  history: ChatMessage[];
  profile?: PatientProfile;
  language: AppLanguage;
}

export interface AskOralGuardResponse {
  reply: string;
  suggestedQuestions: string[];
  recommendedFeature?: 'mouth_map' | 'mouth_scanner' | 'doctor_handoff' | 'cessation' | 'emergency' | null;
  isEmergencyAlert?: boolean;
  source: 'gemini-direct' | 'gemini-proxy' | 'clinical-knowledge-fallback';
}

/**
 * Sends a natural conversation message to the Ask OralGuard AI service
 */
export async function sendAskOralGuardMessage(
  params: AskOralGuardRequest
): Promise<AskOralGuardResponse> {
  const { message, history, profile, language } = params;
  return sendGeminiConversationMessage({
    message,
    history,
    profile,
    language,
  });
}
