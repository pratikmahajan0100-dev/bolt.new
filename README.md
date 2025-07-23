[![Imoogle Build: AI-Powered Full-Stack Web Development in the Browser](./public/social_preview_index.jpg)](https://imoogle-build.com)

# Imoogle Build: AI-Powered Full-Stack Web Development in the Browser

Imoogle Build is an AI-powered web development agent that allows you to prompt, run, edit, and deploy full-stack applications directly from your browser—no local setup required. Built with Mistral and Groq AI models for enhanced performance and capabilities.

## What Makes Imoogle Build Different

Traditional AI assistants are incredible, but you can't install packages, run backends or edit code. That's where Imoogle Build stands out:

- **Full-Stack in the Browser**: Imoogle Build integrates cutting-edge AI models (Mistral and Groq) with an in-browser development environment powered by **StackBlitz's WebContainers**. This allows you to:
  - Install and run npm tools and libraries (like Vite, Next.js, and more)
  - Run Node.js servers
  - Interact with third-party APIs
  - Deploy to production from chat
  - Share your work via a URL

- **AI with Environment Control**: Unlike traditional dev environments where the AI can only assist in code generation, Imoogle Build gives AI models **complete control** over the entire environment including the filesystem, node server, package manager, terminal, and browser console. This empowers AI agents to handle the entire app lifecycle—from creation to deployment.

Whether you're an experienced developer, a PM or designer, Imoogle Build allows you to build production-grade full-stack applications with ease.

## Supported AI Providers

Imoogle Build uses the following AI providers by default:
- **Mistral AI**: Primary provider for enhanced reasoning and code generation
- **Groq**: Fallback provider for fast inference and reliability

## Tips and Tricks

Here are some tips to get the most out of Imoogle Build:

- **Be specific about your stack**: If you want to use specific frameworks or libraries (like Astro, Tailwind, ShadCN, or any other popular JavaScript framework), mention them in your initial prompt to ensure Imoogle Build scaffolds the project accordingly.

- **Use the enhance prompt icon**: Before sending your prompt, try clicking the 'enhance' icon to have the AI model help you refine your prompt, then edit the results before submitting.

- **Scaffold the basics first, then add features**: Make sure the basic structure of your application is in place before diving into more advanced functionality. This helps Imoogle Build understand the foundation of your project and ensure everything is wired up right before building out more advanced functionality.

- **Batch simple instructions**: Save time by combining simple instructions into one message. For example, you can ask Imoogle Build to change the color scheme, add mobile responsiveness, and restart the dev server, all in one go saving you time and reducing API credit consumption significantly.

## Setup

To run Imoogle Build locally, you'll need API keys for either Mistral or Groq (or both):

1. Get a Mistral API key from [Mistral AI Console](https://console.mistral.ai/)
2. Get a Groq API key from [Groq Console](https://console.groq.com/)

Create a `.env.local` file in the root directory and add your API keys:

```bash
MISTRAL_API_KEY=your_mistral_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

## FAQs

**What frameworks/libraries currently work on Imoogle Build?**  
Imoogle Build supports most popular JavaScript frameworks and libraries. If it runs on StackBlitz, it will run on Imoogle Build as well.

**Which AI models does Imoogle Build use?**  
Imoogle Build primarily uses Mistral's latest models with Groq as a fallback provider for enhanced performance and reliability.

**How can I report issues?**  
Check out the [Issues section](https://github.com/your-repo/imoogle-build/issues) to report an issue or request a new feature. Please use the search feature to check if someone else has already submitted the same issue/request.
