interface ProcessEnv {
  MISTRAL_API_KEY?: string;
  GROQ_API_KEY?: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ProcessEnv {}
  }
}
