import prisma from '@/db/client';
import type { BrandResult, PromptResult, CitationResult } from '@/types/analysis';

/**
 * Save a complete analysis to the database
 */
export async function saveAnalysis(
  category: string,
  brands: BrandResult[],
  prompts: PromptResult[],
  citations: CitationResult[]
): Promise<string> {
  const analysis = await prisma.analysis.create({
    data: {
      category,
      brands: {
        create: brands.map((brand) => ({
          name: brand.name,
          // Core metrics
          promptCoverage: brand.promptCoverage,
          mentionShare: brand.mentionShare,
          mentionsPerPrompt: brand.mentionsPerPrompt,
          firstMentionRate: brand.firstMentionRate,
          missedPrompts: brand.missedPrompts,
          promptsWithBrand: brand.promptsWithBrand,
          // Raw counts
          mentions: brand.mentions,
          firstMentions: brand.firstMentions,
          // Legacy
          visibility: brand.visibility,
          citationShare: brand.citationShare,
        })),
      },
      prompts: {
        create: prompts.map((prompt) => ({
          prompt: prompt.prompt,
          response: prompt.response,
          brandsMentioned: prompt.brandsMentioned,
          firstMention: prompt.firstMention,
        })),
      },
      citations: {
        create: citations.map((citation) => ({
          url: citation.url,
          domain: citation.domain,
          count: citation.count,
        })),
      },
    },
  });

  return analysis.id;
}

/**
 * Get analysis by ID with all relations
 */
export async function getAnalysisById(id: string) {
  return prisma.analysis.findUnique({
    where: { id },
    include: {
      brands: {
        orderBy: { mentions: 'desc' },
      },
      prompts: {
        orderBy: { createdAt: 'asc' },
      },
      citations: {
        orderBy: { count: 'desc' },
      },
    },
  });
}

/**
 * Get recent analyses (for history)
 */
export async function getRecentAnalyses(limit: number = 10) {
  return prisma.analysis.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      brands: {
        orderBy: { mentions: 'desc' },
        take: 3, // Top 3 brands preview
      },
      _count: {
        select: {
          prompts: true,
          brands: true,
        },
      },
    },
  });
}

/**
 * Delete an analysis
 */
export async function deleteAnalysis(id: string) {
  return prisma.analysis.delete({
    where: { id },
  });
}
