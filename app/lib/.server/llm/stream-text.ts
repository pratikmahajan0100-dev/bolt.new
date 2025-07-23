import { streamText as _streamText, type CoreMessage } from 'ai';
import { getMistralAPIKey, getGroqAPIKey } from '~/lib/.server/llm/api-key';
import { getDefaultModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
  state: 'result';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model' | 'messages'>;

function convertToCoreMessages(messages: Messages): CoreMessage[] {
  return messages.map(message => ({
    role: message.role,
    content: message.content,
  }));
}

export function streamText(messages: Messages, options?: StreamingOptions) {
  const mistralApiKey = getMistralAPIKey();
  const groqApiKey = getGroqAPIKey();
  
  return _streamText({
    model: getDefaultModel(mistralApiKey, groqApiKey),
    system: getSystemPrompt(),
    maxTokens: MAX_TOKENS,
    messages: convertToCoreMessages(messages),
    ...options,
  } as any); // Type assertion to handle version compatibility
}
