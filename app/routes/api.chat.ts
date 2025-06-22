import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  console.log('=== CHAT API DEBUG ===');
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  let messages: Messages;
  try {
    const body = await request.json<{ messages: Messages }>();
    console.log('Request body:', body);
    messages = body.messages;
  } catch (jsonError) {
    console.error('JSON parsing error:', jsonError);
    throw new Response('Invalid JSON', { status: 400 });
  }

  const stream = new SwitchableStream();

  try {
    console.log('Creating streaming options...');
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

    console.log('Calling streamText with env:', !!context.cloudflare.env);
    console.log('Environment check - ANTHROPIC_API_KEY exists:', !!(process.env.ANTHROPIC_API_KEY || context.cloudflare.env?.ANTHROPIC_API_KEY));
    const result = await streamText(messages, context.cloudflare.env, options);
    console.log('streamText call successful, setting up stream...');

    stream.switchSource(result.toAIStream());
    console.log('Stream setup complete, returning response...');

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('=== CHAT API ERROR ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
