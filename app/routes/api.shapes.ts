import { type ActionFunctionArgs } from '@remix-run/cloudflare';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    throw new Response('Method not allowed', { status: 405 });
  }

  try {
    const { model, message } = await request.json<{ 
      model: string; 
      message: string; 
    }>();

    console.log('=== SHAPES API PROXY ===');
    console.log('Model:', model);
    console.log('Message:', message);

    // Make the request to Shapes API using OpenAI-compatible format
    const response = await fetch('https://api.shapes.inc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer UCNGEYUAP6Q0NEYTYGEIH9WN819AHNFHUZJVVWL8QLI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `shapesinc/${model}`,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shapes API error:', response.status, errorText);
      throw new Response(`Shapes API error: ${response.status}`, { status: response.status });
    }

    const data = await response.json() as any;
    console.log('Shapes API response:', data);

    // Extract the message from the OpenAI-compatible response
    const shapeMessage = data.choices?.[0]?.message?.content || 'No response from shape';

    return Response.json({ 
      success: true, 
      message: shapeMessage,
      shape: model 
    });

  } catch (error) {
    console.error('Shapes API proxy error:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    throw new Response('Internal server error', { status: 500 });
  }
} 