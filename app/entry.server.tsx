import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  try {
    const stream = await renderToReadableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        signal: request.signal,
        onError(error: unknown) {
          console.error('Render error:', error);
          responseStatusCode = 500;
        },
      },
    );

    const htmlStream = new ReadableStream({
      async start(controller) {
        try {
          const head = renderHeadToString({ request, remixContext, Head });

          controller.enqueue(
            encodeString(
              `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`
            )
          );

          const reader = stream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }

          controller.enqueue(encodeString(`</div></body></html>`));
          controller.close();
        } catch (err) {
          controller.error(err);
          stream.cancel();
        }
      },

      cancel() {
        stream.cancel();
      },
    });

  
    if (isbot(request.headers.get('user-agent') || '')) {
      await stream.allReady;
    }

    responseHeaders.set('Content-Type', 'text/html');
    responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
    responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

    return new Response(htmlStream, {
      status: responseStatusCode,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Unhandled rendering error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

function encodeString(content: string): Uint8Array {
  return new TextEncoder().encode(content);
}
