import { createAnthropic } from '@ai-sdk/anthropic';

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-sonnet-4-20250514');
  // return anthropic('claude-3-7-sonnet-20250219');
  // return anthropic('claude-3-5-sonnet-20240620');
}
