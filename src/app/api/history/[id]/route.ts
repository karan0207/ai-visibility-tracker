import { NextResponse } from 'next/server';
import { getAnalysisById } from '@/db/queries';

type BrandData = {
  name: string;
  mentions: number;
  visibility: number;
  citationShare: number;
  firstMentions: number;
};

type PromptData = {
  prompt: string;
  response: string;
  brandsMentioned: string[];
  firstMention: string | null;
};

type CitationData = {
  url: string;
  domain: string;
  count: number;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analysis = await getAnalysisById(id);

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis not found',
        },
        { status: 404 }
      );
    }

    // Transform to match AnalysisResult type
    const result = {
      id: analysis.id,
      category: analysis.category,
      createdAt: analysis.createdAt,
      brands: analysis.brands.map((b: BrandData) => ({
        name: b.name,
        mentions: b.mentions,
        visibility: b.visibility,
        citationShare: b.citationShare,
        firstMentions: b.firstMentions,
      })),
      prompts: analysis.prompts.map((p: PromptData) => ({
        prompt: p.prompt,
        response: p.response,
        brandsMentioned: p.brandsMentioned,
        urls: [], // URLs not stored separately in DB
        firstMention: p.firstMention,
      })),
      citations: analysis.citations.map((c: CitationData) => ({
        url: c.url,
        domain: c.domain,
        count: c.count,
      })),
      totalMentions: analysis.brands.reduce((sum: number, b: BrandData) => sum + b.mentions, 0),
      totalPrompts: analysis.prompts.length,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Analysis fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analysis',
      },
      { status: 500 }
    );
  }
}
