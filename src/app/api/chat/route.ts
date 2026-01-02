import { chatPromptSchema } from '@/types/api';
import { createAIClient, queryAI } from '@/services/openai';
import { analyzeResponses } from '@/services/analyzer';
import prisma from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('[Chat API] Request received');

  try {
    const body = await request.json();
    console.log('[Chat API] Request body:', { 
      prompt: body.prompt?.substring(0, 50) + '...', 
      brands: body.brands,
      sessionId: body.sessionId,
      previousPromptsCount: body.previousPrompts?.length || 0
    });

    // Validate request
    const validation = chatPromptSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Chat API] Validation error:', validation.error.errors);
      return new Response(
        JSON.stringify({ error: validation.error.errors[0]?.message || 'Invalid request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, brands, previousPrompts = [], apiKey, sessionId } = validation.data;

    // Create AI client
    let client;
    try {
      client = createAIClient(apiKey ?? undefined);
    } catch (error) {
      console.error('[Chat API] AI client initialization failed:', error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Failed to initialize AI client',
          hint: 'Either provide an OpenAI API key, or start Ollama with: docker compose up -d ollama'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Query AI
    console.log('[Chat API] Querying AI...');
    let response: string;
    try {
      response = await queryAI(client, prompt);
      console.log('[Chat API] AI response received');
    } catch (error) {
      console.error('[Chat API] AI query failed:', error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'AI query failed',
          hint: 'Make sure Ollama is running (docker compose up -d ollama) or provide an OpenAI API key'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build complete prompt history for analysis
    const allPrompts = [
      ...previousPrompts,
      { prompt, response }
    ];

    // Analyze all responses to get cumulative metrics
    const analysis = analyzeResponses('custom', brands, allPrompts);

    // Get metrics for the current prompt
    const currentPromptResult = analysis.prompts[analysis.prompts.length - 1];

    // Save to database if sessionId provided
    if (sessionId) {
      try {
        // Save the prompt run
        await prisma.promptRun.create({
          data: {
            analysisId: sessionId,
            prompt,
            response,
            brandsMentioned: currentPromptResult?.brandsMentioned || [],
            firstMention: currentPromptResult?.firstMention,
          },
        });

        // Update brand metrics
        for (const brandResult of analysis.brands) {
          await prisma.brand.updateMany({
            where: {
              analysisId: sessionId,
              name: brandResult.name,
            },
            data: {
              // Core metrics
              promptCoverage: brandResult.promptCoverage,
              mentionShare: brandResult.mentionShare,
              mentionsPerPrompt: brandResult.mentionsPerPrompt,
              firstMentionRate: brandResult.firstMentionRate,
              missedPrompts: brandResult.missedPrompts,
              promptsWithBrand: brandResult.promptsWithBrand,
              // Raw counts
              mentions: brandResult.mentions,
              firstMentions: brandResult.firstMentions,
              // Legacy aliases
              visibility: brandResult.visibility,
              citationShare: brandResult.citationShare,
            },
          });
        }

        // Update citations
        for (const citation of analysis.citations) {
          await prisma.citation.upsert({
            where: {
              id: `${sessionId}-${citation.url}`,
            },
            create: {
              id: `${sessionId}-${citation.url}`,
              analysisId: sessionId,
              url: citation.url,
              domain: citation.domain,
              count: citation.count,
            },
            update: {
              count: citation.count,
            },
          });
        }

        console.log('[Chat API] Results saved to database');
      } catch (dbError) {
        console.error('[Chat API] Database save error:', dbError);
        // Continue without failing - results still returned to client
      }
    }

    const responseData = {
      response,
      metrics: {
        brandsMentioned: currentPromptResult?.brandsMentioned || [],
        brandContexts: currentPromptResult?.brandContexts || {},
        firstMention: currentPromptResult?.firstMention || null,
        urls: currentPromptResult?.urls || [],
        updatedBrands: analysis.brands,
        citations: analysis.citations,
        totalMentions: analysis.totalMentions,
        totalPrompts: analysis.totalPrompts,
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Chat API] Error:', error);
    
    // Handle JSON parsing errors specifically
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      errorMessage = 'AI service returned an invalid response. The model may still be loading - please wait a moment and try again.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
