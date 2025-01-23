import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getAPIKey } from '~/lib/.server/llm/api-key';
import { getAnthropicModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';

import { createAnthropic } from '@ai-sdk/anthropic';
import { createAzure } from '@ai-sdk/azure';

import { env } from 'node:process';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

// export function streamText(messages: Messages, env: Env, options?: StreamingOptions) {
//   return _streamText({
//     model: getAnthropicModel(getAPIKey(env)),
//     system: getSystemPrompt(),
//     maxTokens: MAX_TOKENS,
//     headers: {
//       'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
//     },
//     messages: convertToCoreMessages(messages),
//     ...options,
//   });
// }

export function streamText(messages: Messages, env: Env, options?: StreamingOptions) {
  const anthropic = createAnthropic({
    apiKey: getAPIKey(env),
  });

  const azure = createAzure({
    apiKey: '',
    resourceName: '',
  });

  return _streamText({
    model: azure('gpt-4o'),
    system: getSystemPrompt(),
    messages: convertToCoreMessages(messages),
    maxTokens: 4096,
    ...options,
  });

  // return _streamText({
  //   model: anthropic('claude-3-5-sonnet-20240620'),
  //   system: getSystemPrompt(),
  //   maxTokens: MAX_TOKENS,
  //   headers: {
  //     'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
  //   },
  //   messages: convertToCoreMessages(messages),
  //   ...options,
  // });
}
