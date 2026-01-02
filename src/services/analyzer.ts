import type { BrandResult, PromptResult, CitationResult, AnalysisResult, ConfidenceLevel } from '@/types/analysis';

/**
 * Determine confidence level based on sample size
 * < 5 prompts = low (exploratory)
 * 5-29 prompts = directional
 * >= 30 prompts = high (comparable)
 */
function getConfidenceLevel(totalPrompts: number): ConfidenceLevel {
  if (totalPrompts < 5) return 'low';
  if (totalPrompts < 30) return 'directional';
  return 'high';
}

/**
 * Extract URLs from text
 */
function extractUrls(text: string): string[] {
  const urls: Set<string> = new Set();
  
  // Extract direct URLs (http:// or https://)
  const urlRegex = /https?:\/\/[^\s\)\]\>\"\']+/gi;
  const directMatches = text.match(urlRegex) || [];
  directMatches.forEach(url => {
    const cleaned = url.replace(/[.,;:!?]+$/, '');
    if (cleaned) urls.add(cleaned);
  });
  
  // Extract markdown links [text](url)
  const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi;
  let markdownMatch;
  while ((markdownMatch = markdownRegex.exec(text)) !== null) {
    const url = markdownMatch[2];
    if (url) urls.add(url);
  }
  
  return Array.from(urls);
}

/**
 * Extract domain from URL
 */
function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Create a flexible regex pattern for brand matching
 * Handles variations like "OpenAI" vs "Open AI", "GPT-4" vs "GPT4" vs "GPT 4"
 */
function createFlexiblePattern(brand: string): RegExp[] {
  // Split brand into words, escape each, and create regex for each word
  return brand
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const pattern = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${pattern}\\b`, 'gi');
    });
}

/**
 * Count brand mentions in text (case-insensitive, flexible match)
 */
function countMentions(text: string, brand: string): number {
  const patterns = createFlexiblePattern(brand);
  let total = 0;
  for (const regex of patterns) {
    const matches = text.match(regex);
    if (matches) total += matches.length;
  }
  return total;
}

/**
 * Find the position of first mention of brand in text
 */
function findFirstMentionPosition(text: string, brand: string): number {
  const patterns = createFlexiblePattern(brand);
  let minIndex = -1;
  for (const regex of patterns) {
    regex.lastIndex = 0;
    const match = regex.exec(text);
    if (match) {
      if (minIndex === -1 || match.index < minIndex) {
        minIndex = match.index;
      }
    }
  }
  return minIndex;
}

/**
 * Extract context around brand mention (surrounding sentences)
 */
function extractContext(text: string, brand: string, contextLength: number = 120): string | null {
  const patterns = createFlexiblePattern(brand);
  let bestMatch: { index: number; matchedText: string } | null = null;
  for (const regex of patterns) {
    regex.lastIndex = 0;
    const match = regex.exec(text);
    if (match) {
      if (!bestMatch || match.index < bestMatch.index) {
        bestMatch = { index: match.index, matchedText: match[0] };
      }
    }
  }
  if (!bestMatch) return null;
  const position = bestMatch.index;
  const matchedText = bestMatch.matchedText;
  // Find sentence boundaries
  const beforeText = text.slice(0, position);
  const afterText = text.slice(position + matchedText.length);
  // Look for sentence start (period, newline, or start of text)
  const sentenceStartMatch = beforeText.match(/[.!?\n][^.!?\n]*$/);
  const start = sentenceStartMatch 
    ? position - sentenceStartMatch[0].length + 1 
    : Math.max(0, position - contextLength);
  // Look for sentence end
  const sentenceEndMatch = afterText.match(/^[^.!?\n]*[.!?\n]/);
  const end = sentenceEndMatch
    ? position + matchedText.length + sentenceEndMatch[0].length
    : Math.min(text.length, position + matchedText.length + contextLength);
  let context = text.slice(start, end).trim();
  // Clean up markdown formatting for display
  context = context.replace(/\*\*/g, '').replace(/\*/g, '');
  if (start > 0 && !context.startsWith('...')) context = '...' + context;
  if (end < text.length && !context.endsWith('...')) context = context + '...';
  return context;
}

/**
 * Extract multiple contexts (all mentions) for a brand
 */
function extractAllContexts(text: string, brand: string, maxContexts: number = 3): string[] {
  const regex = createFlexiblePattern(brand);
  const contexts: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null && contexts.length < maxContexts) {
    const position = match.index;
    const matchedText = match[0];
    
    const start = Math.max(0, position - 80);
    const end = Math.min(text.length, position + matchedText.length + 80);
    
    let context = text.slice(start, end).trim();
    context = context.replace(/\*\*/g, '').replace(/\*/g, '');
    
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    contexts.push(context);
  }
  
  return contexts;
}

/**
 * Analyze AI responses and calculate metrics
 */
export function analyzeResponses(
  category: string,
  brandNames: string[],
  promptResults: { prompt: string; response: string }[]
): AnalysisResult {
  const totalPrompts = promptResults.length;
  
  // Initialize brand tracking
  const brandData: Map<string, {
    mentions: number;
    promptsAppeared: Set<number>;
    firstMentions: number;
    contexts: string[];
  }> = new Map();
  
  brandNames.forEach((name) => {
    brandData.set(name, {
      mentions: 0,
      promptsAppeared: new Set(),
      firstMentions: 0,
      contexts: [],
    });
  });

  // URL tracking
  const urlCounts: Map<string, number> = new Map();

  // Process each prompt result
  const prompts: PromptResult[] = promptResults.map(({ prompt, response }, index) => {
    const brandsMentioned: string[] = [];
    const brandContexts: Record<string, string> = {};
    let firstMention: string | null = null;
    let firstMentionPosition = Infinity;

    // Check each brand
    brandNames.forEach((brandName) => {
      const mentions = countMentions(response, brandName);
      
      if (mentions > 0) {
        brandsMentioned.push(brandName);
        
        const data = brandData.get(brandName)!;
        data.mentions += mentions;
        data.promptsAppeared.add(index);
        
        // Extract context for this mention
        const context = extractContext(response, brandName);
        if (context) {
          brandContexts[brandName] = context;
          // Store up to 5 contexts per brand across all prompts
          if (data.contexts.length < 5) {
            data.contexts.push(context);
          }
        }
        
        // Check if this brand is mentioned first
        const position = findFirstMentionPosition(response, brandName);
        if (position !== -1 && position < firstMentionPosition) {
          firstMentionPosition = position;
          firstMention = brandName;
        }
      }
    });

    // Record first mention for the winning brand
    if (firstMention) {
      brandData.get(firstMention)!.firstMentions++;
    }

    // Extract URLs
    const urls = extractUrls(response);
    urls.forEach((url) => {
      urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
    });

    return {
      prompt,
      response,
      brandsMentioned,
      brandContexts,
      urls,
      firstMention,
    };
  });

  // Calculate total mentions across all brands
  let totalMentions = 0;
  brandData.forEach((data) => {
    totalMentions += data.mentions;
  });

  // Determine confidence level based on sample size
  const confidenceLevel = getConfidenceLevel(totalPrompts);

  // Build brand results with calculated metrics
  const brands: BrandResult[] = brandNames.map((name) => {
    const data = brandData.get(name)!;
    const promptsWithBrand = data.promptsAppeared.size;
    const missedPrompts = totalPrompts - promptsWithBrand;
    
    // Metric 1: Prompt Coverage (PRIMARY) - % of prompts where brand was mentioned
    const promptCoverage = totalPrompts > 0 
      ? (promptsWithBrand / totalPrompts) * 100 
      : 0;
    
    // Metric 2: Mention Share - % of total mentions across all brands
    const mentionShare = totalMentions > 0 
      ? (data.mentions / totalMentions) * 100 
      : 0;

    // Metric 3: Mentions per Prompt - avg mentions within prompts where it appears
    const mentionsPerPrompt = promptsWithBrand > 0
      ? data.mentions / promptsWithBrand
      : 0;

    // Metric 4: First-Mention Rate - % of prompts where mentioned first
    const firstMentionRate = promptsWithBrand > 0
      ? (data.firstMentions / promptsWithBrand) * 100
      : 0;

    return {
      name,
      // Core metrics
      promptCoverage: Math.round(promptCoverage * 10) / 10,
      mentionShare: Math.round(mentionShare * 10) / 10,
      mentionsPerPrompt: Math.round(mentionsPerPrompt * 100) / 100,
      firstMentionRate: Math.round(firstMentionRate * 10) / 10,
      missedPrompts,
      // Raw counts
      mentions: data.mentions,
      promptsWithBrand,
      firstMentions: data.firstMentions,
      // Legacy aliases for compatibility
      visibility: Math.round(promptCoverage * 10) / 10,
      citationShare: Math.round(mentionShare * 10) / 10,
      contexts: data.contexts,
    };
  });

  // Sort brands by: promptCoverage (desc), mentions (desc), then alphabetically
  brands.sort((a, b) => {
    if (b.promptCoverage !== a.promptCoverage) return b.promptCoverage - a.promptCoverage;
    if (b.mentions !== a.mentions) return b.mentions - a.mentions;
    return a.name.localeCompare(b.name);
  });

  // Build citations list
  const citations: CitationResult[] = Array.from(urlCounts.entries())
    .map(([url, count]) => ({
      url,
      domain: getDomain(url),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 citations

  return {
    category,
    brands,
    prompts,
    citations,
    totalMentions,
    totalPrompts,
    confidenceLevel,
  };
}
