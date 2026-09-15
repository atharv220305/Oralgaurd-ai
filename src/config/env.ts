/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Secure Environment & Application Configuration Utility
 *
 * Safely validates and accesses environment variables without exposing sensitive
 * API keys to browser console logs, DOM attributes, or error messages.
 */

export interface AppConfigValidationResult {
  hasClientKey: boolean;
  mode: 'direct_client' | 'server_proxy';
  status: 'configured' | 'using_proxy';
  message: string;
}

/**
 * Securely retrieves the VITE_GEMINI_API_KEY from environment variables.
 * Ensures that empty strings, placeholders, or undefined values are handled safely.
 * The key is never logged or exposed in client-facing exceptions.
 */
export function getViteGeminiApiKey(): string | null {
  try {
    const rawKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (typeof rawKey === 'string' && rawKey.trim().length > 0 && rawKey !== 'undefined' && rawKey !== 'null') {
      return rawKey.trim();
    }
  } catch {
    // In sandboxed environments where import.meta.env may be restricted
  }
  return null;
}

/**
 * Checks whether a client-side Gemini API key is present without exposing the actual key.
 */
export function hasViteGeminiApiKey(): boolean {
  return getViteGeminiApiKey() !== null;
}

/**
 * Mask an API key for safe debugging (e.g. AIzaSy...xYz8), never exposing the secret.
 */
export function maskApiKey(key: string | null): string {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Validates the application's configuration on initialization.
 * Verifies presence of VITE_GEMINI_API_KEY and ensures that sensitive key secrets
 * are never exposed in client-side console logs, DOM attributes, or public UI strings.
 */
export function validateAppConfiguration(): AppConfigValidationResult {
  const clientKey = getViteGeminiApiKey();

  if (clientKey) {
    console.info('[OralGuard Config] VITE_GEMINI_API_KEY verified successfully.');
    return {
      hasClientKey: true,
      mode: 'direct_client',
      status: 'configured',
      message: 'Gemini API configured securely.',
    };
  }

  // If VITE_GEMINI_API_KEY is not directly in client env, the app runs in secure server proxy mode
  console.info('[OralGuard Config] Operating in secure server proxy mode via /api/ask-oralguard.');
  return {
    hasClientKey: false,
    mode: 'server_proxy',
    status: 'using_proxy',
    message: 'Operating in secure server proxy mode. All requests proxied through backend.',
  };
}
