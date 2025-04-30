import { env } from 'node:process';

import type { Provider } from './constants';


export function getAPIKey(cloudflareEnv: Env, provider: Provider) {
  if (provider === 'openai') {
    return env.OPENAI_API_KEY || cloudflareEnv.OPENAI_API_KEY;
  } else if (provider === 'anthropic') {
    return env.ANTHROPIC_API_KEY || cloudflareEnv.ANTHROPIC_API_KEY;
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
}
