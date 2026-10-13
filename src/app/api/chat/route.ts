import { NextRequest, NextResponse } from 'next/server';
import { getJarvisModel, jarvisTools, executeTool } from '../../../lib/gemini/client';

export const runtime = 'nodejs';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];

    if (messages.length === 0) {
      return NextResponse.json({ error: 'Empty message history' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          const model = getJarvisModel();
          
          // Formulate contents history for Gemini
          // We map simple client messages to Gemini Part format
          const contents: any[] = [];
          
          for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i];
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            });
          }

          // The last message is the new user prompt
          const latestUserMsg = messages[messages.length - 1];
          contents.push({
            role: 'user',
            parts: [{ text: latestUserMsg.content }]
          });

          // Multi-step reasoning tool loop
          let loopCount = 0;
          const maxLoops = 5;
          let currentContents = [...contents];
          let executedToolsList: { name: string; status: 'success' | 'error'; label: string }[] = [];

          while (loopCount < maxLoops) {
            console.log(`Gemini conversation turn ${loopCount + 1}...`);
            
            // Call Gemini with the registered tools configuration
            const response = await model.generateContent({
              contents: currentContents,
              tools: jarvisTools,
            });

            const candidate = response.response.candidates?.[0];
            const functionCalls = candidate?.content?.parts?.filter(part => part.functionCall);

            if (candidate && candidate.content && functionCalls && functionCalls.length > 0) {
              console.log(`Gemini requested ${functionCalls.length} tool executions`);
              
              // Add the model's tool request part to currentContents history
              currentContents.push(candidate.content);

              const toolResponseParts = [];

              for (const fc of functionCalls) {
                const call = fc.functionCall!;
                const toolName = call.name;
                const toolArgs = call.args;

                // Stream progress info of tool execution back to frontend
                const readableToolName = toolName.replace(/_/g, ' ');
                controller.enqueue(
                  encoder.encode(
                    `JARVIS_STATUS:Executing ${readableToolName}...\n`
                  )
                );

                // Run actual API wrapper
                const result = await executeTool(toolName, toolArgs);
                
                // Track tool call status for frontend logs
                executedToolsList.push({
                  name: toolName,
                  status: result?.error ? 'error' : 'success',
                  label: readableToolName,
                });

                toolResponseParts.push({
                  functionResponse: {
                    name: toolName,
                    response: { result },
                  }
                });
              }

              // Push user/system role containing the tool output results back to Gemini
              currentContents.push({
                role: 'user',
                parts: toolResponseParts,
              });

              loopCount++;
            } else {
              // No function calls - we have reached the final text output response
              // Send the tool logs to frontend
              if (executedToolsList.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    `JARVIS_TOOLS:${JSON.stringify(executedToolsList)}\n`
                  )
                );
              }

              // Now we stream the text content
              // Since generateContent already completed, we have the full text content in one go
              const textResult = response.response.text();
              controller.enqueue(encoder.encode(textResult));
              break;
            }
          }

          if (loopCount >= maxLoops) {
            controller.enqueue(
              encoder.encode(
                "\n\n*Error: JARVIS tool execution loop exceeded safety limits. Please simplify your command.*"
              )
            );
          }
        } catch (error: any) {
          console.error('Error during streaming chat endpoint:', error);
          controller.enqueue(
            encoder.encode(
              `\n\n*System warning: Gemini connection interrupted. Details: ${
                error.message || 'Unknown network error'
              }. Falls back to local database operations.*`
            )
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error starting chat stream:', error);
    return NextResponse.json({ error: 'Chat stream failed to initialize' }, { status: 500 });
  }
}
