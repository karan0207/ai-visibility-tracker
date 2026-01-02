import { z } from 'zod';
import type { AnalysisResult, BrandResult, CitationResult } from '@/types/analysis';

// Request body for /api/analyze
export interface AnalyzeRequest {
  category: string;
  brands: string[];
  apiKey?: string; // Optional, falls back to server env
}

// Response from /api/analyze
export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

// Zod schemas for validation
export const analyzeRequestSchema = z.object({
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category must be less than 100 characters'),
  brands: z
    .array(z.string().min(1).max(50))
    .min(2, 'Please provide at least 2 brands')
    .max(10, 'Maximum 10 brands allowed'),
  apiKey: z.string().optional(),
});

export type ValidatedAnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

// Chat prompt request
export interface ChatPromptRequest {
  prompt: string;
  brands: string[];
  previousPrompts?: { prompt: string; response: string }[];
  apiKey?: string;
  sessionId?: string;
}

// Chat prompt response
export interface ChatPromptResponse {
  response: string;
  metrics: {
    brandsMentioned: string[];
    firstMention: string | null;
    updatedBrands: BrandResult[];
    totalMentions: number;
    totalPrompts: number;
    citations?: CitationResult[];
    brandContexts?: Record<string, string[]>;
    urls?: string[];
  };
}

// Schema for chat prompt validation
export const chatPromptSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(1000, 'Prompt must be less than 1000 characters'),
  brands: z
    .array(z.string().min(1).max(50))
    .min(1, 'Please provide at least 1 brand to track')
    .max(10, 'Maximum 10 brands allowed'),
  previousPrompts: z.array(z.object({
    prompt: z.string(),
    response: z.string(),
  })).optional(),
  apiKey: z.string().optional(),
  sessionId: z.string().optional(),
});

export type ValidatedChatPromptRequest = z.infer<typeof chatPromptSchema>;
