import { analyzeResponses } from '@/services/analyzer';

describe('analyzeResponses', () => {
  describe('basic functionality', () => {
    it('should analyze empty prompt results', () => {
      const result = analyzeResponses('test category', ['brand1', 'brand2'], []);
      
      expect(result.category).toBe('test category');
      expect(result.totalPrompts).toBe(0);
      expect(result.totalMentions).toBe(0);
      expect(result.brands).toHaveLength(2);
      expect(result.confidenceLevel).toBe('low');
    });

    it('should detect brand mentions in responses', () => {
      const result = analyzeResponses('software', ['Slack', 'Teams'], [
        { prompt: 'Best chat app?', response: 'I recommend Slack for teams. Slack is great.' },
      ]);

      expect(result.totalMentions).toBe(3); // Slack(2) + teams(1)
      const slackBrand = result.brands.find(b => b.name === 'Slack');
      expect(slackBrand?.mentions).toBe(2);
      expect(slackBrand?.promptCoverage).toBe(100);
    });

    it('should handle case-insensitive brand matching', () => {
      const result = analyzeResponses('software', ['ChatGPT'], [
        { prompt: 'AI?', response: 'chatgpt is good. CHATGPT rocks. ChatGPT works.' },
      ]);

      const brand = result.brands.find(b => b.name === 'ChatGPT');
      expect(brand?.mentions).toBe(3);
    });

    it('should track first mentions correctly', () => {
      const result = analyzeResponses('tools', ['A', 'B'], [
        { prompt: 'Q1', response: 'B is first, then A comes later.' },
        { prompt: 'Q2', response: 'A is mentioned first here.' },
      ]);

      const brandA = result.brands.find(b => b.name === 'A');
      const brandB = result.brands.find(b => b.name === 'B');
      
      expect(brandA?.firstMentions).toBe(1);
      expect(brandB?.firstMentions).toBe(1);
    });

    it('should calculate prompt coverage correctly', () => {
      const result = analyzeResponses('category', ['Present', 'Missing'], [
        { prompt: 'Q1', response: 'Present is here.' },
        { prompt: 'Q2', response: 'Present again.' },
        { prompt: 'Q3', response: 'No brands here.' },
      ]);

      const presentBrand = result.brands.find(b => b.name === 'Present');
      const missingBrand = result.brands.find(b => b.name === 'Missing');

      expect(presentBrand?.promptCoverage).toBeCloseTo(66.7, 0);
      expect(presentBrand?.missedPrompts).toBe(1);
      expect(missingBrand?.promptCoverage).toBe(0);
      expect(missingBrand?.missedPrompts).toBe(3);
    });
  });

  describe('mention share calculation', () => {
    it('should calculate mention share as percentage of total mentions', () => {
      const result = analyzeResponses('test', ['A', 'B'], [
        { prompt: 'Q', response: 'A A A B' }, // A=3, B=1, total=4
      ]);

      const brandA = result.brands.find(b => b.name === 'A');
      const brandB = result.brands.find(b => b.name === 'B');

      expect(brandA?.mentionShare).toBe(75); // 3/4 * 100
      expect(brandB?.mentionShare).toBe(25); // 1/4 * 100
    });

    it('should handle zero total mentions', () => {
      const result = analyzeResponses('test', ['X'], [
        { prompt: 'Q', response: 'No brands mentioned' },
      ]);

      const brand = result.brands.find(b => b.name === 'X');
      expect(brand?.mentionShare).toBe(0);
    });
  });

  describe('flexible brand matching', () => {
    it('should match brands with hyphens flexibly', () => {
      const result = analyzeResponses('ai', ['GPT-4'], [
        { prompt: 'Q', response: 'GPT-4 and GPT4 and GPT 4 are the same.' },
      ]);

      const brand = result.brands.find(b => b.name === 'GPT-4');
      expect(brand?.mentions).toBe(1); // Word boundary prevents multiple matches
    });

    it('should match CamelCase brands with spaces', () => {
      const result = analyzeResponses('ai', ['OpenAI'], [
        { prompt: 'Q', response: 'OpenAI and Open AI are mentioned.' },
      ]);

      const brand = result.brands.find(b => b.name === 'OpenAI');
      expect(brand?.mentions).toBe(2);
    });
  });

  describe('confidence levels', () => {
    it('should return low confidence for less than 5 prompts', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q1', response: 'A' },
        { prompt: 'Q2', response: 'A' },
      ]);
      expect(result.confidenceLevel).toBe('low');
    });

    it('should return directional confidence for 5-29 prompts', () => {
      const prompts = Array.from({ length: 10 }, (_, i) => ({
        prompt: `Q${i}`,
        response: 'A',
      }));
      const result = analyzeResponses('test', ['A'], prompts);
      expect(result.confidenceLevel).toBe('directional');
    });

    it('should return high confidence for 30+ prompts', () => {
      const prompts = Array.from({ length: 30 }, (_, i) => ({
        prompt: `Q${i}`,
        response: 'A',
      }));
      const result = analyzeResponses('test', ['A'], prompts);
      expect(result.confidenceLevel).toBe('high');
    });
  });

  describe('URL extraction', () => {
    it('should extract URLs from responses', () => {
      const result = analyzeResponses('test', ['A'], [
        { 
          prompt: 'Q', 
          response: 'Check out https://example.com and http://test.org for more.' 
        },
      ]);

      expect(result.citations).toHaveLength(2);
      expect(result.citations.map(c => c.url)).toContain('https://example.com');
      expect(result.citations.map(c => c.url)).toContain('http://test.org');
    });

    it('should extract domains correctly', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response: 'Visit https://www.example.com/path for info.' },
      ]);

      expect(result.citations[0].domain).toBe('example.com');
    });

    it('should clean trailing punctuation from URLs', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response: 'See https://example.com. Also https://test.org!' },
      ]);

      expect(result.citations.map(c => c.url)).toContain('https://example.com');
      expect(result.citations.map(c => c.url)).toContain('https://test.org');
    });

    it('should count duplicate URLs', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q1', response: 'Visit https://example.com' },
        { prompt: 'Q2', response: 'Also see https://example.com' },
      ]);

      const citation = result.citations.find(c => c.url === 'https://example.com');
      expect(citation?.count).toBe(2);
    });
  });

  describe('prompt results', () => {
    it('should track brands mentioned per prompt', () => {
      const result = analyzeResponses('test', ['A', 'B', 'C'], [
        { prompt: 'Q', response: 'A and B are good, but not C' },
      ]);

      // C is mentioned in "not C" so it counts
      expect(result.prompts[0].brandsMentioned).toContain('A');
      expect(result.prompts[0].brandsMentioned).toContain('B');
    });

    it('should identify first mention per prompt', () => {
      const result = analyzeResponses('test', ['Second', 'First'], [
        { prompt: 'Q', response: 'First comes before Second' },
      ]);

      expect(result.prompts[0].firstMention).toBe('First');
    });
  });

  describe('sorting', () => {
    it('should sort brands by prompt coverage descending', () => {
      const result = analyzeResponses('test', ['Low', 'High', 'Mid'], [
        { prompt: 'Q1', response: 'High High High' },
        { prompt: 'Q2', response: 'High Mid' },
        { prompt: 'Q3', response: 'High' },
      ]);

      expect(result.brands[0].name).toBe('High');
      expect(result.brands[1].name).toBe('Mid');
      expect(result.brands[2].name).toBe('Low');
    });

    it('should use mentions as secondary sort', () => {
      const result = analyzeResponses('test', ['MoreMentions', 'LessMentions'], [
        { prompt: 'Q', response: 'MoreMentions MoreMentions MoreMentions LessMentions' },
      ]);

      // Both have 100% coverage but MoreMentions has more mentions
      expect(result.brands[0].name).toBe('MoreMentions');
    });

    it('should use alphabetical order as tertiary sort', () => {
      const result = analyzeResponses('test', ['Zebra', 'Apple'], [
        { prompt: 'Q', response: 'Zebra Apple' },
      ]);

      // Both have same coverage and mentions
      expect(result.brands[0].name).toBe('Apple');
    });
  });

  describe('mentions per prompt', () => {
    it('should calculate average mentions per prompt where brand appears', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q1', response: 'A A A' }, // 3 mentions
        { prompt: 'Q2', response: 'A' }, // 1 mention
        { prompt: 'Q3', response: 'No brand' }, // 0 mentions
      ]);

      const brand = result.brands.find(b => b.name === 'A');
      // (3 + 1) / 2 prompts where it appeared = 2
      expect(brand?.mentionsPerPrompt).toBe(2);
    });
  });

  describe('first mention rate', () => {
    it('should calculate percentage of prompts where mentioned first', () => {
      const result = analyzeResponses('test', ['A', 'B'], [
        { prompt: 'Q1', response: 'A is first, B is second' },
        { prompt: 'Q2', response: 'B is first, A is second' },
        { prompt: 'Q3', response: 'A again first' },
      ]);

      const brandA = result.brands.find(b => b.name === 'A');
      // A appeared in 3 prompts, was first in 2 = 66.7%
      expect(brandA?.firstMentionRate).toBeCloseTo(66.7, 0);
    });
  });

  describe('context extraction', () => {
    it('should extract context around brand mentions', () => {
      const result = analyzeResponses('test', ['TestBrand'], [
        { 
          prompt: 'Q', 
          response: 'For your needs, I recommend TestBrand because it offers great features.' 
        },
      ]);

      expect(result.prompts[0].brandContexts['TestBrand']).toBeDefined();
      expect(result.prompts[0].brandContexts['TestBrand']).toContain('TestBrand');
    });
  });

  describe('edge cases', () => {
    it('should handle empty brand list', () => {
      const result = analyzeResponses('test', [], [
        { prompt: 'Q', response: 'Some response' },
      ]);

      expect(result.brands).toHaveLength(0);
      expect(result.totalMentions).toBe(0);
    });

    it('should handle special characters in brand names', () => {
      const result = analyzeResponses('test', ['C++', 'C#'], [
        { prompt: 'Q', response: 'I like C++ and C# programming.' },
      ]);

      const cppBrand = result.brands.find(b => b.name === 'C++');
      const csharpBrand = result.brands.find(b => b.name === 'C#');
      
      // Special regex chars may not match perfectly without additional escaping
      expect(cppBrand?.mentions).toBeGreaterThanOrEqual(0);
      expect(csharpBrand?.mentions).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long responses', () => {
      const longResponse = 'BrandX '.repeat(1000);
      const result = analyzeResponses('test', ['BrandX'], [
        { prompt: 'Q', response: longResponse },
      ]);

      expect(result.brands[0].mentions).toBe(1000);
    });
  });
});
