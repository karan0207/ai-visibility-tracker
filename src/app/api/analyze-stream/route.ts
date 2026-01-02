import { analyzeRequestSchema } from '@/types/api';
import { generatePrompts } from '@/lib/constants';
import { createAIClient, queryAI } from '@/services/openai';
import { analyzeResponses } from '@/services/analyzer';
import { saveAnalysis } from '@/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('[SSE] Stream request received');

  try {
    const body = await request.json();
    console.log('[SSE] Request body:', { category: body.category, brands: body.brands });

    // Validate request
    const validation = analyzeRequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.errors[0]?.message || 'Invalid request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { category, brands, apiKey } = validation.data;

    // Create AI client
    let client;
    try {
      client = createAIClient(apiKey);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to initialize AI client' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompts = generatePrompts(category);

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        // Send initial info
        send('start', { 
          totalPrompts: prompts.length, 
          category, 
          brands 
        });

        const promptResults: { prompt: string; response: string }[] = [];

        // Process each prompt and stream results
        for (let i = 0; i < prompts.length; i++) {
          const prompt = prompts[i];
          
          // Send progress update
          send('progress', { 
            currentPrompt: i + 1, 
            totalPrompts: prompts.length, 
            promptText: prompt 
          });

          try {
            console.log(`[SSE] Running prompt ${i + 1}/${prompts.length}`);
            const response = await queryAI(client, prompt);
            console.log(`[SSE] Prompt ${i + 1} completed`);
            
            promptResults.push({ prompt, response });

            // Calculate current metrics
            const currentAnalysis = analyzeResponses(category, brands, promptResults);

            // Send prompt result with updated metrics
            send('prompt_complete', {
              promptIndex: i,
              prompt,
              response,
              brandsMentioned: currentAnalysis.prompts[i]?.brandsMentioned || [],
              firstMention: currentAnalysis.prompts[i]?.firstMention || null,
              currentMetrics: {
                brands: currentAnalysis.brands,
                totalMentions: currentAnalysis.totalMentions,
                promptsCompleted: i + 1,
              },
            });

          } catch (error) {
            console.error(`[SSE] Prompt ${i + 1} failed:`, error);
            send('error', { 
              promptIndex: i,
              error: error instanceof Error ? error.message : 'Failed to query AI' 
            });
            // Continue with next prompt instead of failing completely
          }
        }

        // Final analysis
        const finalAnalysis = analyzeResponses(category, brands, promptResults);

        // Save to database
        try {
          const analysisId = await saveAnalysis(
            category,
            finalAnalysis.brands,
            finalAnalysis.prompts,
            finalAnalysis.citations
          );
          finalAnalysis.id = analysisId;
          finalAnalysis.createdAt = new Date();
        } catch (dbError) {
          console.error('Failed to save to database:', dbError);
        }

        // Send final results
        send('complete', finalAnalysis);
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[SSE] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
