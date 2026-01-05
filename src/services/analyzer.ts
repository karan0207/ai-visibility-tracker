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
  
  // Extract markdown links [text](url) first to avoid double-counting
  const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi;
  let markdownMatch;
  while ((markdownMatch = markdownRegex.exec(text)) !== null) {
    const url = markdownMatch[2].replace(/[.,;:!?]+$/, '');
    if (url) urls.add(url);
  }
  
  // Remove markdown links from text to avoid extracting them twice
  const textWithoutMarkdown = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi, '');
  
  // Extract direct URLs (http:// or https://)
  const urlRegex = /https?:\/\/[^\s\)\]\>\"\']+/gi;
  const directMatches = textWithoutMarkdown.match(urlRegex) || [];
  directMatches.forEach(url => {
    const cleaned = url.replace(/[.,;:!?]+$/, '');
    if (cleaned) urls.add(cleaned);
  });
  
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
function createFlexiblePattern(brand: string): RegExp {
  // Escape regex special characters
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const escapedBrand = escape(brand);

  // Determine appropriate boundary based on brand content
  // If brand ends with non-word character (like C++, C#), use lookahead instead of \b
  const endsWithNonWord = /[^\w]$/.test(brand);

  const startBoundary = '(?<!\\w)';
  const endBoundary = endsWithNonWord ? '(?!\\w)' : '(?!\\w)';
  
  // If brand contains CamelCase, also match with spaces between words
  const camelWords = brand.split(/(?=[A-Z])/).filter(w => w.length > 0);
  
  if (camelWords.length > 1) {
    // Create pattern that matches either exact brand OR spaced version
    const spacedPattern = camelWords.map(escape).join('\\s+');
    return new RegExp(`${startBoundary}(?:${escapedBrand}|${spacedPattern})${endBoundary}`, 'gi');
  }
  
  // For non-CamelCase brands, just match exact with appropriate boundaries
  return new RegExp(`${startBoundary}${escapedBrand}${endBoundary}`, 'gi');
}

// Cache for regex patterns to avoid recreating them
const patternCache = new Map<string, RegExp>();

function getPattern(brand: string): RegExp {
  if (!patternCache.has(brand)) {
    patternCache.set(brand, createFlexiblePattern(brand));
  }
  return patternCache.get(brand)!;
}

/**
 * Find all match positions for a brand in text (avoids double-counting overlaps)
 */
function findAllMatches(text: string, brand: string): { index: number; length: number }[] {
  const pattern = getPattern(brand);
  const matches: { index: number; length: number }[] = [];
  
  // Reset regex state
  pattern.lastIndex = 0;
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({ index: match.index, length: match[0].length });
  }
  
  return matches;
}

/**
 * Count brand mentions in text (case-insensitive, flexible match, no double-counting)
 */
function countMentions(text: string, brand: string): number {
  const matches = findAllMatches(text, brand);
  return matches.length;
}

/**
 * Find the position of first mention of brand in text
 */
function findFirstMentionPosition(text: string, brand: string): number {
  const matches = findAllMatches(text, brand);
  return matches.length > 0 ? matches[0].index : -1;
}

/**
 * Extract context around brand mention (surrounding sentences)
 */
function extractContext(text: string, brand: string, contextLength: number = 100): string | null {
  const matches = findAllMatches(text, brand);
  if (matches.length === 0) return null;
  
  const firstMatch = matches[0];
  const position = firstMatch.index;
  const matchLength = firstMatch.length;
  
  // Find sentence boundaries
  const beforeText = text.slice(0, position);
  const afterText = text.slice(position + matchLength);
  
  // Look for sentence start (period, newline, or start of text)
  const sentenceStartMatch = beforeText.match(/[.!?\n][^.!?\n]*$/);
  const start = sentenceStartMatch 
    ? position - sentenceStartMatch[0].length + 1 
    : Math.max(0, position - contextLength);
  
  // Look for sentence end
  const sentenceEndMatch = afterText.match(/^[^.!?\n]*[.!?\n]/);
  const end = sentenceEndMatch
    ? position + matchLength + sentenceEndMatch[0].length
    : Math.min(text.length, position + matchLength + contextLength);
  
  let context = text.slice(start, end).trim();
  
  // Clean up markdown formatting for display
  context = context.replace(/\*\*/g, '').replace(/\*/g, '');
  
  // Add ellipsis if truncated
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  return context;
}

/**
 * Extract multiple contexts (diverse sample across prompts)
 */
function extractAllContexts(
  text: string, 
  brand: string, 
  existingContexts: string[],
  maxContexts: number = 5
): string[] {
  if (existingContexts.length >= maxContexts) {
    return existingContexts;
  }
  
  const context = extractContext(text, brand);
  if (!context) return existingContexts;
  
  // Avoid duplicate contexts
  if (existingContexts.includes(context)) {
    return existingContexts;
  }
  
  return [...existingContexts, context];
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
  
  // Clear pattern cache for new analysis
  patternCache.clear();
  
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
        
        const data = brandData.get(brandName);
        if (!data) return; // Safety check
        
        data.mentions += mentions;
        data.promptsAppeared.add(index);
        
        // Extract context for this mention
        const context = extractContext(response, brandName);
        if (context) {
          brandContexts[brandName] = context;
          // Store diverse contexts across prompts (limit per brand)
          data.contexts = extractAllContexts(response, brandName, data.contexts, 5);
        }
        
        // Check if this brand is mentioned first
        const position = findFirstMentionPosition(response, brandName);
        if (position !== -1 && position < firstMentionPosition) {
          firstMentionPosition = position;
          firstMention = brandName;
        }
      }
    });

    // Handle tie in first mention (both at position 0) - use alphabetical order for consistency
    if (firstMention && firstMentionPosition < Infinity) {
      const brandsAtSamePosition = brandNames.filter(brand => {
        const pos = findFirstMentionPosition(response, brand);
        return pos === firstMentionPosition;
      });
      
      if (brandsAtSamePosition.length > 1) {
        // Deterministic tie-breaking: alphabetical order
        firstMention = brandsAtSamePosition.sort()[0];
      }
    }

    // Record first mention for the winning brand
    if (firstMention) {
      const data = brandData.get(firstMention);
      if (data) data.firstMentions++;
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
    const data = brandData.get(name);
    if (!data) {
      // Safety fallback for missing data
      return {
        name,
        promptCoverage: 0,
        mentionShare: 0,
        mentionsPerPrompt: 0,
        firstMentionRate: 0,
        missedPrompts: totalPrompts,
        mentions: 0,
        promptsWithBrand: 0,
        firstMentions: 0,
        visibility: 0,
        citationShare: 0,
        contexts: [],
      };
    }
    
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