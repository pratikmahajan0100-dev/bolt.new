import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT, API_CHATBOT_PROMPT, API_CHATBOT_PROMPT_EXP2,  INJECTED_PROMPT_1 ,INJECTED_PROMPT_1_EXP2, INJECTED_PROMPT_2 } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getAPIKey } from '~/lib/.server/llm/api-key';
import { getAnthropicModel } from '~/lib/.server/llm/model';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{ messages: Messages }>();
  const stream = new SwitchableStream();

  try {
    // Check if we've already transitioned to the original agent
    const hasTransitioned = checkIfAlreadyTransitioned(messages);
    
    if (!hasTransitioned) {
      // Use your agent first
      console.log('Using your agent...');
      
      // Create options with proper stream closing and transition detection
      const yourAgentOptions: StreamingOptions = {
        onFinish: async ({ text: content, finishReason }: { text: string; finishReason: string }) => {
          console.log('Your agent finished with reason:', finishReason);
          
          // Check if we should transition to original agent
          if (checkIfShouldTransition(content)) {
            console.log('Transition detected! Immediately injecting first prompt...');
            
            // Add the assistant's response to messages
            const updatedMessages: Messages = [...messages, { role: 'assistant' as const, content }];
            
            // Inject the first prompt immediately
            const injectedMessages = injectSinglePrompt(updatedMessages, 1);
            
            // Continue with original agent using injected prompt
            const originalAgentOptions: StreamingOptions = {
              toolChoice: 'none',
              onFinish: async ({ text: responseContent, finishReason: responseFinishReason }: { text: string; finishReason: string }) => {
                if (responseFinishReason !== 'length') {
                  // After first prompt response, inject second prompt immediately
                  console.log('First prompt response complete, injecting second prompt...');
                  
                  const messagesWithFirstResponse: Messages = [...injectedMessages, { role: 'assistant' as const, content: responseContent }];
                  const secondInjectedMessages = injectSinglePrompt(messagesWithFirstResponse, 2);
                  
                  // Continue with second prompt
                  const secondPromptOptions: StreamingOptions = {
                    toolChoice: 'none',
                    onFinish: async ({ text: finalContent, finishReason: finalFinishReason }: { text: string; finishReason: string }) => {
                      if (finalFinishReason !== 'length') {
                        return stream.close();
                      }
                      // Handle continuation for second prompt if needed
                      if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
                        throw Error('Cannot continue message: Maximum segments reached');
                      }
                      secondInjectedMessages.push({ role: 'assistant' as const, content: finalContent });
                      secondInjectedMessages.push({ role: 'user' as const, content: CONTINUE_PROMPT });
                      const result = await streamText(secondInjectedMessages, context.cloudflare.env, secondPromptOptions);
                      return stream.switchSource(result.toAIStream());
                    },
                  };
                  
                  const secondResult = await streamText(secondInjectedMessages, context.cloudflare.env, secondPromptOptions);
                  return stream.switchSource(secondResult.toAIStream());
                }
                
                // Handle continuation for first prompt if needed
                if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
                  throw Error('Cannot continue message: Maximum segments reached');
                }
                injectedMessages.push({ role: 'assistant' as const, content: responseContent });
                injectedMessages.push({ role: 'user' as const, content: CONTINUE_PROMPT });
                const result = await streamText(injectedMessages, context.cloudflare.env, originalAgentOptions);
                return stream.switchSource(result.toAIStream());
              },
            };
            
            const originalResult = await streamText(injectedMessages, context.cloudflare.env, originalAgentOptions);
            return stream.switchSource(originalResult.toAIStream());
          }
          
          // No transition - close normally
          if (finishReason !== 'length') {
            console.log('Closing stream - your agent finished without transition');
            return stream.close();
          }
          
          // Handle continuation for your agent
          if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
            throw Error('Cannot continue message: Maximum segments reached');
          }
          const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
          console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
          messages.push({ role: 'assistant' as const, content });
          messages.push({ role: 'user' as const, content: CONTINUE_PROMPT });
          const result = await streamTextWithYourAgent(messages, context.cloudflare.env, yourAgentOptions);
          return stream.switchSource(result.toAIStream());
        },
      };
      
      const result = await streamTextWithYourAgent(messages, context.cloudflare.env, yourAgentOptions);
      stream.switchSource(result.toAIStream());
      
    } else {
      // We've already transitioned - normal original agent flow
      console.log('Using original agent (already transitioned)...');
      const options: StreamingOptions = {
        toolChoice: 'none',
        onFinish: async ({ text: content, finishReason }: { text: string; finishReason: string }) => {
          if (finishReason !== 'length') {
            return stream.close();
          }
          if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
            throw Error('Cannot continue message: Maximum segments reached');
          }
          const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
          console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
          messages.push({ role: 'assistant' as const, content });
          messages.push({ role: 'user' as const, content: CONTINUE_PROMPT });
          const result = await streamText(messages, context.cloudflare.env, options);
          return stream.switchSource(result.toAIStream());
        },
      };
      
      const result = await streamText(messages, context.cloudflare.env, options);
      stream.switchSource(result.toAIStream());
    }

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

// Simplified helper functions since we're handling injection inline now
function streamTextWithYourAgent(messages: Messages, env: Env, options?: StreamingOptions) {
  return _streamText({
    model: getAnthropicModel(getAPIKey(env)),
    system: getYourAgentSystemPrompt(),
    maxTokens: MAX_TOKENS,
    headers: {
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    },
    messages: convertToCoreMessages(messages),
    ...options,
  });
}

function getYourAgentSystemPrompt(): string {
  // return API_CHATBOT_PROMPT;
  return API_CHATBOT_PROMPT;
}

function checkIfAlreadyTransitioned(messages: Messages): boolean {
  // Check if any assistant message contains [final] AND we have injected prompts after it
  const hasTransitionMarker = messages.some(msg => 
    msg.role === 'assistant' && msg.content.includes('[final]')
  );
  
  // If no transition marker, definitely not transitioned
  if (!hasTransitionMarker) {
    return false;
  }
  
  // Check if we have injected prompts (meaning we're in post-transition phase)
  const hasInjectedPrompts = messages.some(msg => 
    msg.role === 'user' && (
      msg.content.includes('[INJECTED_PROMPT_1]') || 
      msg.content.includes('[INJECTED_PROMPT_2]')
    )
  );
  
  return hasInjectedPrompts;
}

function checkIfShouldTransition(responseText: string): boolean {
  return responseText.includes('[final]');
}

function injectSinglePrompt(messages: Messages, promptNumber: 1 | 2): Messages {
  const injectedMessages = [...messages];
  console.log(`Injecting prompt ${promptNumber} into messages`);
  
  if (promptNumber === 1) {
    injectedMessages.push({ 
      role: 'user' as const, 
      // content:  INJECTED_PROMPT_1 //'[INJECTED_PROMPT_1] Please review the API spec and be absolutely sure that you are calling those functions with the appropriate data formats, for example ensuring that you are sending object_name values, encapsulating input correctly in json, and using the exact function endpoints as they were defined.' 
      content:  INJECTED_PROMPT_1 //
    });
  } else {
    injectedMessages.push({ 
      role: 'user' as const, 
      content: INJECTED_PROMPT_2 
    });
  }
  
  return injectedMessages;
}


//////////////////////////
// async function chatAction({ context, request }: ActionFunctionArgs) {
//   const { messages } = await request.json<{ messages: Messages }>();
//   const stream = new SwitchableStream();

//   try {
//     // Check if we've already transitioned to the original agent
//     const hasTransitioned = checkIfAlreadyTransitioned(messages);
    
//     if (!hasTransitioned) {
//       // Use your agent first
//       console.log('Using your agent...');
      
//       // Create options with proper stream closing
//       const yourAgentOptions: StreamingOptions = {
//         onFinish: async ({ text: content, finishReason }: { text: string; finishReason: string }) => {
//           console.log('Your agent finished with reason:', finishReason);
//           console.log('Response content:', content.substring(0, 100) + '...');
          
//           // Check if we should transition to original agent
//           if (checkIfShouldTransition(content)) {
//             console.log('Transition detected - will switch on next message');
//           }
          
//           // Always close the stream when your agent finishes
//           // (unless we need continuation due to length)
//           if (finishReason !== 'length') {
//             console.log('Closing stream - your agent finished');
//             return stream.close();
//           }
          
//           // Handle continuation for length
//           if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
//             throw Error('Cannot continue message: Maximum segments reached');
//           }
//           const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
//           console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
//           messages.push({ role: 'assistant', content });
//           messages.push({ role: 'user', content: CONTINUE_PROMPT });
//           const result = await streamTextWithYourAgent(messages, context.cloudflare.env, yourAgentOptions);
//           return stream.switchSource(result.toAIStream());
//         },
//       };
      
//       const result = await streamTextWithYourAgent(messages, context.cloudflare.env, yourAgentOptions);
//       stream.switchSource(result.toAIStream());
      
//     } else {
//       // We've transitioned - check if we need to inject prompts
//       const injectionStatus = checkIfNeedsPromptInjection(messages);
      
//       if (injectionStatus.needsInjection) {
//         console.log(`Injecting prompt ${injectionStatus.whichPrompt} before using original agent...`);
        
//         // Inject the single prompt
//         const injectedMessages = injectSinglePrompt(messages, injectionStatus.whichPrompt!);
        
//         // Run through original agent with injected prompt
//         const options: StreamingOptions = {
//           toolChoice: 'none',
//           onFinish: async ({ text: content, finishReason }: { text: string; finishReason: string }) => {
//             if (finishReason !== 'length') {
//               return stream.close();
//             }
//             if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
//               throw Error('Cannot continue message: Maximum segments reached');
//             }
//             const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
//             console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
//             injectedMessages.push({ role: 'assistant', content });
//             injectedMessages.push({ role: 'user', content: CONTINUE_PROMPT });
//             const result = await streamText(injectedMessages, context.cloudflare.env, options);
//             return stream.switchSource(result.toAIStream());
//           },
//         };
        
//         const result = await streamText(injectedMessages, context.cloudflare.env, options);
//         stream.switchSource(result.toAIStream());
        
//       } else {
//         // Normal original agent flow
//         console.log('Using original agent...');
//         const options: StreamingOptions = {
//           toolChoice: 'none',
//           onFinish: async ({ text: content, finishReason }: { text: string; finishReason: string }) => {
//             if (finishReason !== 'length') {
//               return stream.close();
//             }
//             if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
//               throw Error('Cannot continue message: Maximum segments reached');
//             }
//             const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
//             console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
//             messages.push({ role: 'assistant', content });
//             messages.push({ role: 'user', content: CONTINUE_PROMPT });
//             const result = await streamText(messages, context.cloudflare.env, options);
//             return stream.switchSource(result.toAIStream());
//           },
//         };
        
//         const result = await streamText(messages, context.cloudflare.env, options);
//         stream.switchSource(result.toAIStream());
//       }
//     }

//     return new Response(stream.readable, {
//       status: 200,
//       headers: {
//         contentType: 'text/plain; charset=utf-8',
//       },
//     });
    
//   } catch (error) {
//     console.log(error);
//     throw new Response(null, {
//       status: 500,
//       statusText: 'Internal Server Error',
//     });
//   }
// }



// // Updated helper function
// function streamTextWithYourAgent(messages: Messages, env: Env, options?: StreamingOptions) {
//   return _streamText({
//     model: getAnthropicModel(getAPIKey(env)),
//     system: getYourAgentSystemPrompt(),
//     maxTokens: MAX_TOKENS,
//     headers: {
//       'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
//     },
//     messages: convertToCoreMessages(messages),
//     ...options, // This will include the onFinish callback we pass in
//   });
// }


// function getYourAgentSystemPrompt(): string {
//   // Return your custom system prompt
//   // Include instruction to end with [final] when ready to transition
//   return API_CHATBOT_PROMPT;;
// }

// function checkIfAlreadyTransitioned(messages: Messages): boolean {
//   // Check if any assistant message contains [final]
//   return messages.some(msg => 
//     msg.role === 'assistant' && msg.content.includes('[final]')
//   );
// }

// function checkIfShouldTransition(responseText: string): boolean {
//   return responseText.includes('[final]');
// }

// function checkIfNeedsPromptInjection(messages: Messages): { needsInjection: boolean; whichPrompt: 1 | 2 | null } {
//   const transitionIndex = messages.findIndex(msg => 
//     msg.role === 'assistant' && msg.content.includes('[final]')
//   );
  
//   if (transitionIndex === -1) {
//     console.log('No transition found, no injection needed');
//     return { needsInjection: false, whichPrompt: null };
//   }
  
//   console.log('Transition found at index:', transitionIndex);
  
//   // Check what we've already injected after transition
//   const messagesAfterTransition = messages.slice(transitionIndex + 1);
//   console.log('Messages after transition:', messagesAfterTransition.length);
  
//   const prompt1Messages = messagesAfterTransition.filter(msg => 
//     msg.role === 'user' && msg.content.includes('[INJECTED_PROMPT_1]')
//   );
//   const prompt2Messages = messagesAfterTransition.filter(msg => 
//     msg.role === 'user' && msg.content.includes('[INJECTED_PROMPT_2]')
//   );
  
//   console.log('Found prompt 1 messages:', prompt1Messages.length);
//   console.log('Found prompt 2 messages:', prompt2Messages.length);
  
//   if (prompt1Messages.length === 0) {
//     console.log('Need to inject prompt 1');
//     return { needsInjection: true, whichPrompt: 1 };
//   } else if (prompt1Messages.length > 0 && prompt2Messages.length === 0) {
//     // Check if we got a response to prompt 1
//     const prompt1Index = messagesAfterTransition.findIndex(msg => 
//       msg.role === 'user' && msg.content.includes('[INJECTED_PROMPT_1]')
//     );
//     const hasResponseToPrompt1 = messagesAfterTransition.slice(prompt1Index + 1).some(msg => 
//       msg.role === 'assistant'
//     );
    
//     console.log('Has response to prompt 1:', hasResponseToPrompt1);
    
//     if (hasResponseToPrompt1) {
//       console.log('Need to inject prompt 2');
//       return { needsInjection: true, whichPrompt: 2 };
//     } else {
//       console.log('Waiting for response to prompt 1');
//       return { needsInjection: false, whichPrompt: null };
//     }
//   }
  
//   console.log('All prompts already injected');
//   return { needsInjection: false, whichPrompt: null };
// }

// function injectSinglePrompt(messages: Messages, promptNumber: 1 | 2): Messages {
//   const injectedMessages = [...messages];
//   console.log('injecting a single prompt into messages:', messages);
  
//   if (promptNumber === 1) {
//     injectedMessages.push({ 
//       role: 'user', 
//       content: '[INJECTED_PROMPT_1] Please review the API spec and be absolutely sure that you are calling those functions with the appropriate data formats, for example ensuring that you are sending object_name values, encapsulating input correctly in json, and using the exact function endpoints as they were defined.' 
//     });
//   } else {
//     injectedMessages.push({ 
//       role: 'user', 
//       content: `[INJECTED_PROMPT_2] Rewrite the code using the Modernize Next-js Free design system:
// • Framework - Next.js 14 App Router + TypeScript
// • UI library - Material UI v5; style only with the sx prop and MUI components
// • Theme palette - primary #5D87FF, success #13DEB9, danger #FA896B, warning #FFAE1F
// • Layout - persistent 260 px left drawer + top AppBar + scrollable main; keep shadow-1 cards and 12-col responsive grid
// • Typography - Public Sans, 14 px base, 20 px h6, 32 px h4
// • File structure - components in /package/src/components/, pages in /package/src/app/ with PascalCase files
// • Write all components as arrow functions, export default, and type props explicitly`
 
//     });
//   }
  
//   return injectedMessages;
// }













// async function chatAction({ context, request }: ActionFunctionArgs) {
//   const { messages } = await request.json<{ messages: Messages }>();
//   const stream = new SwitchableStream();

//   try {
//     // Check if we've already transitioned to the original agent
//     const hasTransitioned = checkIfAlreadyTransitioned(messages);
    
//     if (!hasTransitioned) {
//       // Use your agent first
//       console.log('Using your agent...');
//       const result = await streamTextWithYourAgent(messages, context.cloudflare.env);
      
//       // Collect the streamed response to check for [final] token
//       let fullResponse = '';
//       const responseStream = result.toAIStream();
      
//       // We need to capture the response as it streams
//       // This is a bit tricky with streaming - we might need to modify this approach
//       const transformStream = new TransformStream({
//         transform(chunk, controller) {
//           const text = new TextDecoder().decode(chunk);
//           fullResponse += text;
//           controller.enqueue(chunk);
//         },
//         flush() {
//           // After streaming is complete, check if we should transition
//           if (checkIfShouldTransition(fullResponse)) {
//             // We need to handle transition after this stream completes
//             // This might require a different approach - see note below
//           }
//         }
//       });
      
//       // For now, let's return the stream and handle transition on next message
//       stream.switchSource(responseStream);
      
//     } else {
//       // We've transitioned - check if we need to inject prompts
//       const injectionStatus = checkIfNeedsPromptInjection(messages);
      
//       if (injectionStatus.needsInjection) {
//         console.log(`Injecting prompt ${injectionStatus.whichPrompt} before using original agent...`);
        
//         // Inject the single prompt
//         const injectedMessages = injectSinglePrompt(messages, injectionStatus.whichPrompt!);
        
//         // Run through original agent with injected prompt
//         const options: StreamingOptions = {
//           toolChoice: 'none',
//           onFinish: async ({ text: content, finishReason }: { text: string; finishReason: string }) => {
//             if (finishReason !== 'length') {
//               return stream.close();
//             }
//             // Handle continuation logic (same as original)
//             if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
//               throw Error('Cannot continue message: Maximum segments reached');
//             }
//             const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
//             console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
//             injectedMessages.push({ role: 'assistant', content });
//             injectedMessages.push({ role: 'user', content: CONTINUE_PROMPT });
//             const result = await streamText(injectedMessages, context.cloudflare.env, options);
//             return stream.switchSource(result.toAIStream());
//           },
//         };
        
//         const result = await streamText(injectedMessages, context.cloudflare.env, options);
//         stream.switchSource(result.toAIStream());
        
//       } else {
//         // Normal original agent flow
//         console.log('Using original agent...');
//         const options: StreamingOptions = {
//           toolChoice: 'none',
//           onFinish: async ({ text: content, finishReason }: { text: string; finishReason: string }) => {
//             if (finishReason !== 'length') {
//               return stream.close();
//             }
//             if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
//               throw Error('Cannot continue message: Maximum segments reached');
//             }
//             const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
//             console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
//             messages.push({ role: 'assistant', content });
//             messages.push({ role: 'user', content: CONTINUE_PROMPT });
//             const result = await streamText(messages, context.cloudflare.env, options);
//             return stream.switchSource(result.toAIStream());
//           },
//         };
        
//         const result = await streamText(messages, context.cloudflare.env, options);
//         stream.switchSource(result.toAIStream());
//       }
//     }

//     return new Response(stream.readable, {
//       status: 200,
//       headers: {
//         contentType: 'text/plain; charset=utf-8',
//       },
//     });
    
//   } catch (error) {
//     console.log(error);
//     throw new Response(null, {
//       status: 500,
//       statusText: 'Internal Server Error',
//     });
//   }
// }

// // Helper functions

// function streamTextWithYourAgent(messages: Messages, env: Env, options?: StreamingOptions) {
//   // For now, copy of the original streamText - you can modify later
//   return _streamText({
//     model: getAnthropicModel(getAPIKey(env)),
//     system: getYourAgentSystemPrompt(), // You'll need to create this
//     maxTokens: MAX_TOKENS,
//     headers: {
//       'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
//     },
//     messages: convertToCoreMessages(messages),
//     ...options,
//   });
// }

// function getYourAgentSystemPrompt(): string {
//   // Return your custom system prompt
//   // Include instruction to end with [final] when ready to transition
//   return API_CHATBOT_PROMPT;
// }

// function checkIfAlreadyTransitioned(messages: Messages): boolean {
//   // Check if any assistant message contains [final]
//   return messages.some(msg => 
//     msg.role === 'assistant' && msg.content.includes('[final]')
//   );
// }

// function checkIfShouldTransition(responseText: string): boolean {
//   return responseText.includes('[final]');
// }

// function checkIfNeedsPromptInjection(messages: Messages): { needsInjection: boolean; whichPrompt: 1 | 2 | null } {
//   const transitionIndex = messages.findIndex(msg => 
//     msg.role === 'assistant' && msg.content.includes('[final]')
//   );
  
//   if (transitionIndex === -1) return { needsInjection: false, whichPrompt: null };
  
//   // Check what we've already injected after transition
//   const messagesAfterTransition = messages.slice(transitionIndex + 1);
//   const hasPrompt1 = messagesAfterTransition.some(msg => 
//     msg.role === 'user' && msg.content.includes('[INJECTED_PROMPT_1]')
//   );
//   const hasPrompt2 = messagesAfterTransition.some(msg => 
//     msg.role === 'user' && msg.content.includes('[INJECTED_PROMPT_2]')
//   );
  
//   if (!hasPrompt1) {
//     return { needsInjection: true, whichPrompt: 1 };
//   } else if (hasPrompt1 && !hasPrompt2) {
//     // Check if we got a response to prompt 1
//     const prompt1Index = messagesAfterTransition.findIndex(msg => 
//       msg.role === 'user' && msg.content.includes('[INJECTED_PROMPT_1]')
//     );
//     const hasResponseToPrompt1 = messagesAfterTransition.slice(prompt1Index + 1).some(msg => 
//       msg.role === 'assistant'
//     );
    
//     if (hasResponseToPrompt1) {
//       return { needsInjection: true, whichPrompt: 2 };
//     }
//   }
  
//   return { needsInjection: false, whichPrompt: null };
// }

// function injectSinglePrompt(messages: Messages, promptNumber: 1 | 2): Messages {
//   const injectedMessages = [...messages];
  
//   if (promptNumber === 1) {
//     injectedMessages.push({ 
//       role: 'user', 
//       content: '[INJECTED_PROMPT_1] Please review the API spec and be absolutely sure that you are calling those functions with the appropriate data formats, for example ensuring that you are sending object_name values, encapsulating input correctly in json, and using the exact function endpoints as they were defined.' 
//     });
//   } else {
//     injectedMessages.push({ 
//       role: 'user', 
//       content: `[INJECTED_PROMPT_2] Rewrite the code using the Modernize Next-js Free design system:
// • Framework - Next.js 14 App Router + TypeScript
// • UI library - Material UI v5; style only with the sx prop and MUI components
// • Theme palette - primary #5D87FF, success #13DEB9, danger #FA896B, warning #FFAE1F
// • Layout - persistent 260 px left drawer + top AppBar + scrollable main; keep shadow-1 cards and 12-col responsive grid
// • Typography - Public Sans, 14 px base, 20 px h6, 32 px h4
// • File structure - components in /package/src/components/, pages in /package/src/app/ with PascalCase files
// • Write all components as arrow functions, export default, and type props explicitly`
 
//     });
//   }
  
//   return injectedMessages;
// }



// async function chatAction({ context, request }: ActionFunctionArgs) {
//   const { messages } = await request.json<{ messages: Messages }>();

//   const stream = new SwitchableStream();

//   try {
//     const options: StreamingOptions = {
//       toolChoice: 'none',
//       onFinish: async ({ text: content, finishReason }) => {
//         if (finishReason !== 'length') {
//           return stream.close();
//         }

//         if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
//           throw Error('Cannot continue message: Maximum segments reached');
//         }

//         const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

//         console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

//         messages.push({ role: 'assistant', content });
//         messages.push({ role: 'user', content: CONTINUE_PROMPT });

//         const result = await streamText(messages, context.cloudflare.env, options);

//         return stream.switchSource(result.toAIStream());
//       },
//     };

//     const result = await streamText(messages, context.cloudflare.env, options);

//     stream.switchSource(result.toAIStream());

//     return new Response(stream.readable, {
//       status: 200,
//       headers: {
//         contentType: 'text/plain; charset=utf-8',
//       },
//     });
//   } catch (error) {
//     console.log(error);

//     throw new Response(null, {
//       status: 500,
//       statusText: 'Internal Server Error',
//     });
//   }
// }
