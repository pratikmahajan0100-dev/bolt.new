import { env } from 'node:process';

export function getMistralAPIKey(cloudflareEnv: Env) {
  /**
   * The `cloudflareEnv` is only used when deployed or when previewing locally.
   * In development the environment variables are available through `env`.
   */
  return env.MISTRAL_API_KEY || cloudflareEnv.MISTRAL_API_KEY;
}

export function getGroqAPIKey(cloudflareEnv: Env) {
  /**
   * The `cloudflareEnv` is only used when deployed or when previewing locally.
   * In development the environment variables are available through `env`.
   */
  return env.GROQ_API_KEY || cloudflareEnv.GROQ_API_KEY;
}

// Legacy function to maintain compatibility - returns the available API key
export function getAPIKey(cloudflareEnv: Env) {
  const mistralKey = getMistralAPIKey(cloudflareEnv);
  if (mistralKey) return mistralKey;
  
  const groqKey = getGroqAPIKey(cloudflareEnv);
  if (groqKey) return groqKey;
  
  throw new Error('No API key found. Please set MISTRAL_API_KEY or GROQ_API_KEY environment variable.');
}
