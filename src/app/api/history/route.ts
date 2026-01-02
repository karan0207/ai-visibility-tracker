import { NextResponse } from 'next/server';
import { getRecentAnalyses } from '@/db/queries';

export async function GET() {
  try {
    const analyses = await getRecentAnalyses(20);

    const historyItems = analyses.map((analysis) => ({
      id: analysis.id,
      category: analysis.category,
      createdAt: analysis.createdAt,
      topBrands: analysis.brands.map((b) => ({
        name: b.name,
        mentions: b.mentions,
      })),
      promptCount: analysis._count.prompts,
      brandCount: analysis._count.brands,
    }));

    return NextResponse.json({
      success: true,
      data: historyItems,
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analysis history',
      },
      { status: 500 }
    );
  }
}
