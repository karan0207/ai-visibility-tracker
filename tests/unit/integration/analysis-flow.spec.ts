/**
 * Integration tests for the analyze API functionality
 * Tests the data flow and business logic without mocking everything
 */

import { analyzeResponses } from '@/services/analyzer';
import { generatePrompts, APP_CONFIG } from '@/lib/constants';
import { analyzeRequestSchema } from '@/types/api';

describe('Analysis Flow Integration', () => {
  describe('request validation to analysis pipeline', () => {
    it('processes valid request through entire pipeline', () => {
      // Validate request
      const request = {
        category: 'CRM Software',
        brands: ['Salesforce', 'HubSpot', 'Pipedrive'],
      };
      const validation = analyzeRequestSchema.safeParse(request);
      expect(validation.success).toBe(true);

      // Generate prompts
      const prompts = generatePrompts(request.category);
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts[0]).toContain('CRM Software');

      // Simulate AI responses
      const mockResponses = prompts.map((prompt, i) => ({
        prompt,
        response: i % 2 === 0 
          ? 'Salesforce is great for enterprise. HubSpot offers free tier.'
          : 'For small teams, Pipedrive works well. Salesforce is comprehensive.',
      }));

      // Analyze responses
      const result = analyzeResponses(request.category, request.brands, mockResponses);

      // Verify result structure
      expect(result.category).toBe('CRM Software');
      expect(result.brands.length).toBe(3);
      expect(result.totalPrompts).toBe(prompts.length);
      expect(result.confidenceLevel).toBe('directional'); // 10 prompts
    });

    it('handles brand not mentioned in any response', () => {
      const request = {
        category: 'Email Marketing',
        brands: ['Mailchimp', 'ConvertKit', 'NeverMentioned'],
      };

      const prompts = generatePrompts(request.category);
      const mockResponses = prompts.map(prompt => ({
        prompt,
        response: 'Mailchimp and ConvertKit are popular choices.',
      }));

      const result = analyzeResponses(request.category, request.brands, mockResponses);

      const neverMentioned = result.brands.find(b => b.name === 'NeverMentioned');
      expect(neverMentioned?.mentions).toBe(0);
      expect(neverMentioned?.promptCoverage).toBe(0);
      expect(neverMentioned?.missedPrompts).toBe(prompts.length);
    });

    it('calculates correct visibility rankings', () => {
      const brands = ['Alpha', 'Beta', 'Gamma'];
      const responses = [
        { prompt: 'Q1', response: 'Alpha Alpha Alpha' },
        { prompt: 'Q2', response: 'Alpha Beta' },
        { prompt: 'Q3', response: 'Alpha Beta Gamma' },
        { prompt: 'Q4', response: 'Beta Gamma' },
        { prompt: 'Q5', response: 'Gamma' },
      ];

      const result = analyzeResponses('test', brands, responses);

      // Alpha: 5 mentions, 3 prompts = 60% coverage
      // Beta: 3 mentions, 3 prompts = 60% coverage  
      // Gamma: 3 mentions, 3 prompts = 60% coverage
      // Sorted by coverage, then mentions, then alphabetically
      expect(result.brands[0].name).toBe('Alpha'); // Most mentions among tied coverage
    });
  });

  describe('prompt generation coverage', () => {
    it('generates diverse prompt types', () => {
      const prompts = generatePrompts('Project Management Tools');
      
      // Check for different question types
      const hasBestQuestion = prompts.some(p => p.toLowerCase().includes('best'));
      const hasTopQuestion = prompts.some(p => p.toLowerCase().includes('top'));
      const hasRecommendQuestion = prompts.some(p => p.toLowerCase().includes('recommend'));
      const hasCompareQuestion = prompts.some(p => p.toLowerCase().includes('compare'));

      expect(hasBestQuestion || hasTopQuestion || hasRecommendQuestion || hasCompareQuestion).toBe(true);
    });

    it('maintains category context in all prompts', () => {
      const category = 'Video Conferencing Software';
      const prompts = generatePrompts(category);

      prompts.forEach(prompt => {
        expect(prompt).toContain(category);
      });
    });
  });

  describe('metrics calculation accuracy', () => {
    it('calculates mention share accurately', () => {
      // Set up known distribution: A=60%, B=30%, C=10%
      const responses = [
        { prompt: 'Q', response: 'A A A A A A B B B C' }, // A:6, B:3, C:1 = 10 total
      ];

      const result = analyzeResponses('test', ['A', 'B', 'C'], responses);

      expect(result.brands.find(b => b.name === 'A')?.mentionShare).toBe(60);
      expect(result.brands.find(b => b.name === 'B')?.mentionShare).toBe(30);
      expect(result.brands.find(b => b.name === 'C')?.mentionShare).toBe(10);
    });

    it('calculates first mention rate accurately', () => {
      const responses = [
        { prompt: 'Q1', response: 'A comes first, then B' },
        { prompt: 'Q2', response: 'A again first' },
        { prompt: 'Q3', response: 'B is first here, A second' },
        { prompt: 'Q4', response: 'A leads again' },
      ];

      const result = analyzeResponses('test', ['A', 'B'], responses);

      const brandA = result.brands.find(b => b.name === 'A');
      // A was first in Q1, Q2, Q4 = 3 times, appeared in 4 prompts = 75%
      expect(brandA?.firstMentionRate).toBe(75);
    });

    it('tracks missed prompts correctly', () => {
      const responses = [
        { prompt: 'Q1', response: 'Only A here' },
        { prompt: 'Q2', response: 'Only A again' },
        { prompt: 'Q3', response: 'A and B together' },
        { prompt: 'Q4', response: 'Neither mentioned' },
        { prompt: 'Q5', response: 'Just A once more' },
      ];

      const result = analyzeResponses('test', ['A', 'B'], responses);

      // A appeared in Q1, Q2, Q3, Q5 (4/5), missed Q4
      expect(result.brands.find(b => b.name === 'A')?.missedPrompts).toBe(1);
      // B only appeared in Q3 (1/5), missed Q1, Q2, Q4, Q5
      expect(result.brands.find(b => b.name === 'B')?.missedPrompts).toBe(4);
    });
  });

  describe('confidence level determination', () => {
    it('returns low confidence for small sample', () => {
      const responses = Array.from({ length: 4 }, (_, i) => ({
        prompt: `Q${i}`,
        response: 'Brand mentioned',
      }));

      const result = analyzeResponses('test', ['Brand'], responses);
      expect(result.confidenceLevel).toBe('low');
    });

    it('returns directional confidence for medium sample', () => {
      const responses = Array.from({ length: 15 }, (_, i) => ({
        prompt: `Q${i}`,
        response: 'Brand mentioned',
      }));

      const result = analyzeResponses('test', ['Brand'], responses);
      expect(result.confidenceLevel).toBe('directional');
    });

    it('returns high confidence for large sample', () => {
      const responses = Array.from({ length: 35 }, (_, i) => ({
        prompt: `Q${i}`,
        response: 'Brand mentioned',
      }));

      const result = analyzeResponses('test', ['Brand'], responses);
      expect(result.confidenceLevel).toBe('high');
    });
  });

  describe('APP_CONFIG constraints', () => {
    it('prompt templates match parallelBatchSize expectations', () => {
      const prompts = generatePrompts('test');
      // Should have enough prompts to utilize batching
      expect(prompts.length).toBeGreaterThanOrEqual(APP_CONFIG.parallelBatchSize);
    });

    it('brand limits are respected in validation', () => {
      const tooManyBrands = Array.from({ length: APP_CONFIG.maxBrands + 1 }, (_, i) => `Brand${i}`);
      const result = analyzeRequestSchema.safeParse({
        category: 'Test',
        brands: tooManyBrands,
      });
      expect(result.success).toBe(false);
    });

    it('minimum brands are enforced', () => {
      const result = analyzeRequestSchema.safeParse({
        category: 'Test',
        brands: ['OnlyOne'],
      });
      expect(result.success).toBe(false);
    });
  });
});
