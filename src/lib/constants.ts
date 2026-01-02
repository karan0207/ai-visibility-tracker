/**
 * Prompt templates for AI visibility analysis
 * These templates are designed to mimic real user queries about product categories
 */

export const PROMPT_TEMPLATES = [
  'What is the best {category}? Please provide specific product recommendations with their official website URLs.',
  'Top 5 {category} for startups - include the direct URLs to each product\'s homepage.',
  'Which {category} is most affordable? List options with links to their official websites and pricing pages.',
  'Compare the top {category} options by providing URLs to each product\'s main website.',
  'Recommend the best {category} for a small business - include direct links to the products.',
  'Best {category} for small businesses in 2025 - provide URLs to the official websites.',
  'What are the most popular {category} right now? Include links to their websites.',
  '{category} with the best features - provide URLs to the official product pages.',
  'Which {category} is easiest to use? Include URLs to try or learn more about each option.',
  'Best {category} for enterprise teams - provide direct URLs to product pages and documentation.',
] as const;

/**
 * Generate prompts by replacing {category} placeholder
 */
export function generatePrompts(category: string): string[] {
  return PROMPT_TEMPLATES.map((template) =>
    template.replace('{category}', category)
  );
}

/**
 * App-wide constants
 */
export const APP_CONFIG = {
  name: 'AI Visibility Tracker',
  description: 'Discover how often your brand appears in AI responses',
  maxBrands: 10,
  minBrands: 2,
  maxCategoryLength: 100,
  openaiModel: 'gpt-4o',
  maxTokens: 4000,
  temperature: 0.3,
  parallelBatchSize: 10, // Increased from 5 - Gemini handles higher parallelism well
} as const;

/**
 * Visibility level thresholds
 */
export const VISIBILITY_THRESHOLDS = {
  high: 60, // >= 60% visibility
  medium: 30, // >= 30% visibility
  // Below 30% is low
} as const;

/**
 * Get visibility level label
 */
export function getVisibilityLevel(visibility: number): 'high' | 'medium' | 'low' {
  if (visibility >= VISIBILITY_THRESHOLDS.high) return 'high';
  if (visibility >= VISIBILITY_THRESHOLDS.medium) return 'medium';
  return 'low';
}
