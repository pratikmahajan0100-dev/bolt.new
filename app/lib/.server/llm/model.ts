import { createGroq } from 'groq';

export function createGroqInstance(apiKey: string) {
  return createGroq({
    apiKey,
  });
}

export function getGroqModel(apiKey: string) {
  const groq = createGroqInstance(apiKey);

  return groq('groq-model');
}

export function getGroqLlamaModel(apiKey: string) {
  const groq = createGroqInstance(apiKey);

  return groq('llama3.3-70b');
}
