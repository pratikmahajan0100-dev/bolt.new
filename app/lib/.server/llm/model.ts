import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export function getModel(provider: 'openai' | 'anthropic', apiKey: string) {
  if (provider === 'openai') {
    const openai = createOpenAI({ apiKey });
    return openai('gpt-4o'); // e.g., 'gpt-4o'
  } else if (provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey });
    return anthropic('claude-3-5-sonnet-20240620'); // e.g., 'claude-3-opus-20240229'
  }
  throw new Error('Unsupported provider');
}