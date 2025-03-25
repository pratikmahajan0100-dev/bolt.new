import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import { detectLibrariesFromChatHistory, enhancePromptWithLibraryDocumentation } from '~/lib/common/llms-txt';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{ messages: Messages }>();

  console.log('[DEBUG] api.chat - Original messages:', JSON.stringify(messages));

  // detect libraries mentioned in the chat history
  const detectedLibraries = detectLibrariesFromChatHistory(messages);
  console.log('[DEBUG] api.chat - Detected libraries from history:', detectedLibraries);

  // if libraries are detected, enhance the latest user message with library documentation
  if (detectedLibraries.length > 0 && messages.length > 0) {
    const lastUserMessageIndex = messages.findIndex((msg, idx) => msg.role === 'user' && idx === messages.length - 1);
    console.log('[DEBUG] api.chat - Last user message index:', lastUserMessageIndex);

    if (lastUserMessageIndex !== -1) {
      // enhance the user's last message with library documentation
      const lastUserMessage = messages[lastUserMessageIndex];
      console.log('[DEBUG] api.chat - Last user message before enhancement:', lastUserMessage.content);

      const enhancedContent = enhancePromptWithLibraryDocumentation(lastUserMessage.content, detectedLibraries);
      console.log(
        '[DEBUG] api.chat - Enhanced content includes Fireproof?',
        enhancedContent.includes('Fireproof'),
        enhancedContent.includes('<library name="Fireproof">'),
      );

      // replace the content with enhanced content
      messages[lastUserMessageIndex] = {
        ...lastUserMessage,
        content: enhancedContent,
      };

      console.log('[DEBUG] api.chat - Message after enhancement:', JSON.stringify(messages[lastUserMessageIndex]));
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

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

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
    console.log(error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
