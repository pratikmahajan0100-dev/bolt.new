import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';

export function getMistralModel(apiKey: string) {
  const mistral = createMistral({
    apiKey,
  });

  return mistral('mistral-large-latest');
}

export function getGroqModel(apiKey: string) {
  const groq = createGroq({
    apiKey,
  });

  return groq('llama3-8b-8192');
}

// Default provider is Mistral, fallback to Groq
export function getDefaultModel(mistralApiKey?: string, groqApiKey?: string) {
  if (mistralApiKey) {
    return getMistralModel(mistralApiKey);
  }
  
  if (groqApiKey) {
    return getGroqModel(groqApiKey);
  }
  
  throw new Error('No API key provided for Mistral or Groq. Please set MISTRAL_API_KEY or GROQ_API_KEY environment variable.');
}
