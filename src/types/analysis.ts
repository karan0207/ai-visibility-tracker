// Brand analysis result
export interface BrandResult {
  name: string;
  // Core metrics (from the metric framework)
  promptCoverage: number; // % of prompts where brand mentioned (PRIMARY)
  mentionShare: number; // % of total mentions across all brands
  mentionsPerPrompt: number; // Avg mentions within prompts where it appears
  firstMentionRate: number; // % of prompts where mentioned first
  missedPrompts: number; // Count of prompts where NOT mentioned
  // Raw counts
  mentions: number; // Total mention count
  promptsWithBrand: number; // Number of prompts where brand appeared
  firstMentions: number; // Number of times mentioned first
  // Legacy (keep for compatibility)
  visibility: number; // Alias for promptCoverage
  citationShare: number; // Alias for mentionShare
  contexts: string[]; // Snippets showing where brand was mentioned
}

// Single prompt execution result
export interface PromptResult {
  prompt: string;
  response: string;
  brandsMentioned: string[];
  brandContexts: Record<string, string>; // brand name -> context snippet
  urls: string[];
  firstMention: string | null;
}

// Citation/URL result
export interface CitationResult {
  url: string;
  domain: string;
  count: number;
}

// Confidence level based on sample size
export type ConfidenceLevel = 'low' | 'directional' | 'high';

// Complete analysis result
export interface AnalysisResult {
  id?: string;
  category: string;
  brands: BrandResult[];
  prompts: PromptResult[];
  citations: CitationResult[];
  totalMentions: number;
  totalPrompts: number;
  confidenceLevel: ConfidenceLevel;
  createdAt?: Date;
}

// Progress state for UI
export interface AnalysisProgress {
  currentPrompt: number;
  totalPrompts: number;
  currentPromptText: string;
  status: 'idle' | 'analyzing' | 'complete' | 'error';
}

// Custom metric definition
export interface CustomMetric {
  id: string;
  name: string;
  type: 'brand' | 'keyword' | 'sentiment';
}

// Chat message for interactive interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metrics?: {
    brandsMentioned: string[];
    firstMention: string | null;
  };
}

// Session state for the chat-based analysis
export interface AnalysisSession {
  id: string;
  brands: string[];
  category: string;
  messages: ChatMessage[];
  cumulativeResults: {
    brands: BrandResult[];
    totalMentions: number;
    totalPrompts: number;
  };
  isActive: boolean;
  createdAt: Date;
}
