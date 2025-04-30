// Import the OpenAI SDK
import { createOpenAI } from '@ai-sdk/openai'; // Replace with the actual OpenAI SDK import

export function getOpenAIModel(apiKey: string) {
  const openai = createOpenAI({
    apiKey,
  });

  return openai('gpt-4o'); // Adjust the model identifier as needed
}