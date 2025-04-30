import { env } from 'node:process';

export function getAPIKey(cloudflareEnv: Env) {
  return env.OPENAI_API_KEY || cloudflareEnv.OPENAI_API_KEY; // Update to use OpenAI API key
}
