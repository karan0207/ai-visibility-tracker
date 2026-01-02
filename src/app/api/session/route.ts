import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/client';

/**
 * POST /api/session - Create a new session
 */
export async function POST(request: NextRequest) {
  try {
    const { category, brands } = await request.json();

    if (!category || !brands || brands.length === 0) {
      return NextResponse.json(
        { error: 'Category and brands are required' },
        { status: 400 }
      );
    }

    console.log('[Session API] Creating session for category:', category, 'brands:', brands);

    // Create new analysis session
    const analysis = await prisma.analysis.create({
      data: {
        category,
        brands: {
          create: brands.map((name: string) => ({
            name,
            // Core metrics initialized to 0
            promptCoverage: 0,
            mentionShare: 0,
            mentionsPerPrompt: 0,
            firstMentionRate: 0,
            missedPrompts: 0,
            promptsWithBrand: 0,
            // Raw counts
            mentions: 0,
            firstMentions: 0,
            // Legacy
            visibility: 0,
            citationShare: 0,
          })),
        },
      },
      include: {
        brands: true,
      },
    });

    console.log('[Session API] Session created with ID:', analysis.id);

    return NextResponse.json({
      sessionId: analysis.id,
      category: analysis.category,
      brands: analysis.brands.map(b => b.name),
    });
  } catch (error) {
    console.error('[Session API] Session creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/session?id=xxx - Get session data
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: sessionId },
      include: {
        brands: {
          orderBy: { promptCoverage: 'desc' },
        },
        prompts: {
          orderBy: { createdAt: 'asc' },
        },
        citations: {
          orderBy: { count: 'desc' },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: analysis.id,
      category: analysis.category,
      brands: analysis.brands,
      prompts: analysis.prompts,
      citations: analysis.citations,
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
