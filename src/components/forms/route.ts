import { NextResponse } from 'next/server';
import { z } from 'zod';
import { APP_CONFIG } from '@/lib/constants';
import { createAIClient, queryAI } from '@/services/openai';
import { analyzeResponses } from '@/services/analyzer';
import { saveAnalysis } from '@/db/queries';

// Validation schema for multi-prompt request
const multiPromptSchema = z.object({
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category must be less than 100 characters'),
  brands: z
    .array(z.string().min(1).max(50))
    .min(2, 'Please provide at least 2 brands')
    .max(10, 'Maximum 10 brands allowed'),
  prompts: z
    .array(z.string().min(1).max(500))
    .min(1, 'Please provide at least 1 prompt')
    .max(20, 'Maximum 20 prompts allowed'),
  apiKey: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  console.log('[API] Multi-prompt analyze request received');
  
  try {
    // Parse request body
    const body = await request.json();
    console.log('[API] Multi-prompt request:', { 
      category: body.category, 
      brands: body.brands?.length,
      prompts: body.prompts?.length 
    });

    // Validate request
    const validation = multiPromptSchema.safeParse(body);
    if (!validation.success) {
      console.log('[API] Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid request',
        },
        { status: 400 }
      );
    }

    const { category, brands, prompts, apiKey, sessionId } = validation.data;

    // Create AI client
    let client;
    try {
      client = createAIClient(apiKey);
      console.log('[API] AI client created');
    } catch (error) {
      console.error('[API] Failed to create AI client:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to initialize AI client',
        },
        { status: 400 }
      );
    }

    // Run prompts in parallel batches
    const BATCH_SIZE = APP_CONFIG.parallelBatchSize;
    const promptResults: { prompt: string; response: string }[] = [];
    const totalBatches = Math.ceil(prompts.length / BATCH_SIZE);

    console.log(`[API] Processing ${prompts.length} custom prompts in ${totalBatches} batches of ${BATCH_SIZE}`);

    for (let batchStart = 0; batchStart < prompts.length; batchStart += BATCH_SIZE) {
      const batch = prompts.slice(batchStart, batchStart + BATCH_SIZE);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
      
      console.log(`[API] Running batch ${batchNum}/${totalBatches} (${batch.length} prompts in parallel)`);

      try {
        // Run all prompts in the batch simultaneously
        const batchResults = await Promise.allSettled(
          batch.map(async (prompt, idx) => {
            const promptNum = batchStart + idx + 1;
            console.log(`[API] Starting prompt ${promptNum}/${prompts.length}: ${prompt.substring(0, 50)}...`);
            const response = await queryAI(client, prompt);
            console.log(`[API] Prompt ${promptNum} completed, response length: ${response.length}`);
            return { prompt, response };
          })
        );

        // Process batch results
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            promptResults.push(result.value);
          } else {
            console.error(`[API] Prompt failed in batch ${batchNum}:`, result.reason);
            return NextResponse.json(
              {
                success: false,
                error: result.reason instanceof Error ? result.reason.message : 'Failed to query AI',
              },
              { status: 500 }
            );
          }
        }

        console.log(`[API] Batch ${batchNum} completed successfully`);
      } catch (error) {
        console.error(`[API] Batch ${batchNum} failed:`, error);
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to query AI',
          },
          { status: 500 }
        );
      }
    }

    console.log(`[API] All ${prompts.length} prompts completed. Analyzing results...`);

    // Analyze responses
    const analysisResult = analyzeResponses(category, brands, promptResults);

    // Save to database
    try {
      const analysisId = await saveAnalysis(
        category,
        analysisResult.brands,
        analysisResult.prompts,
        analysisResult.citations
      );
      analysisResult.id = analysisId;
      analysisResult.createdAt = new Date();
    } catch (dbError) {
      console.error('Failed to save analysis to database:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    console.error('Multi-prompt analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
