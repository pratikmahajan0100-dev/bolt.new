import fs from 'fs';
import path from 'path';
import type { Messages } from '~/lib/.server/llm/stream-text';

// define types for our metadata
interface Library {
  name: string;
  keywords: string[];
  docSource: string;
  docFile: string;
  lastUpdated: string;
}

interface DocsConfig {
  libraries: Library[];
}

// path to the docs directory
const DOCS_DIR = path.join(process.cwd(), 'app', 'lib', 'common', 'llms-txt');

// load the metadata configuration
function loadDocsConfig(): DocsConfig {
  const configPath = path.join(DOCS_DIR, 'docs.json');
  const configData = fs.readFileSync(configPath, 'utf8');

  return JSON.parse(configData) as DocsConfig;
}

// get the documentation content for a library
function getLibraryDocs(library: Library): string | null {
  try {
    const docPath = path.join(DOCS_DIR, library.docFile);

    if (fs.existsSync(docPath)) {
      return fs.readFileSync(docPath, 'utf8');
    }
  } catch (error) {
    console.error(`Error loading documentation for ${library.name}:`, error);
  }
  return null;
}

// check if a library is mentioned in the prompt
function isLibraryMentioned(prompt: string, library: Library): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return library.keywords.some((keyword) => lowerPrompt.includes(keyword.toLowerCase()));
}

// detect libraries mentioned in chat history
export function detectLibrariesFromChatHistory(messages: Messages): Library[] {
  const config = loadDocsConfig();
  const detectedLibraries = new Set<Library>();

  // check each message for library mentions
  for (const message of messages) {
    for (const library of config.libraries) {
      if (isLibraryMentioned(message.content, library)) {
        detectedLibraries.add(library);
      }
    }
  }

  return Array.from(detectedLibraries);
}

// enhance a prompt with library documentation
export function enhancePromptWithLibraryDocumentation(prompt: string, libraries: Library[]): string {
  try {
    let enhancedPrompt = prompt;

    // add documentation for each detected library
    for (const library of libraries) {
      const docs = getLibraryDocs(library);

      if (docs) {
        // add the documentation in a standardized format
        enhancedPrompt += `\n\n## ${library.name} Documentation\n${docs}\n`;
      }
    }

    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt with docs:', error);
    return prompt; // return the original prompt if there's an error
  }
}
