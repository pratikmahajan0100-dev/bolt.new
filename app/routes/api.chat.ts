import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import { detectLibrariesFromChatHistory, enhancePromptWithLibraryDocumentation } from '~/lib/common/llms-txt';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{ messages: Messages }>();

  // detect libraries mentioned in the chat history
  const detectedLibraries = detectLibrariesFromChatHistory(messages);

  // if libraries are detected, enhance the latest user message with library documentation
  if (detectedLibraries.length > 0 && messages.length > 0) {
    const lastUserMessageIndex = messages.findIndex((msg, idx) => msg.role === 'user' && idx === messages.length - 1);

    if (lastUserMessageIndex !== -1) {
      // enhance the user's last message with library documentation
      const lastUserMessage = messages[lastUserMessageIndex];
      const enhancedContent = enhancePromptWithLibraryDocumentation(lastUserMessage.content, detectedLibraries);

      // replace the content with enhanced content
      messages[lastUserMessageIndex] = {
        ...lastUserMessage,
        content: enhancedContent,
      };
    }
  }

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText(messages, context.cloudflare.env, options);

        return stream.switchSource(result.toAIStream());
      },
    };

    const result = await streamText(messages, context.cloudflare.env, options);

    stream.switchSource(result.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
