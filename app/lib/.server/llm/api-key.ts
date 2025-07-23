import { env } from 'node:process';

export function getMistralAPIKey(): string | undefined {
  return env.MISTRAL_API_KEY;
}

export function getGroqAPIKey(): string | undefined {
  return env.GROQ_API_KEY;
}

// Legacy function to maintain compatibility - returns the available API key
export function getAPIKey(): string {
  const mistralKey = getMistralAPIKey();
  if (mistralKey) return mistralKey;
  
  const groqKey = getGroqAPIKey();
  if (groqKey) return groqKey;
  
  throw new Error('No API key found. Please set MISTRAL_API_KEY or GROQ_API_KEY environment variable.');
}
