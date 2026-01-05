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
        { prompt: 'Best chat app?', response: 'I recommend Slack for collaboration. Slack is great.' },
      ]);

      expect(result.totalMentions).toBe(2); // Slack appears twice
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
    it('should match CamelCase brands with spaces', () => {
      const result = analyzeResponses('ai', ['OpenAI'], [
        { prompt: 'Q', response: 'OpenAI and Open AI are both mentioned.' },
      ]);

      const brand = result.brands.find(b => b.name === 'OpenAI');
      expect(brand?.mentions).toBeGreaterThanOrEqual(1);
    });

    it('should not double-count the same occurrence', () => {
      const result = analyzeResponses('ai', ['OpenAI'], [
        { prompt: 'Q', response: 'OpenAI is great' },
      ]);

      const brand = result.brands.find(b => b.name === 'OpenAI');
      expect(brand?.mentions).toBe(1); // Should be 1, not 2
    });

    it('should match brand with exact case and word boundaries', () => {
      const result = analyzeResponses('test', ['AI'], [
        { prompt: 'Q', response: 'AI is here, but AIR is not AI.' },
      ]);

      const brand = result.brands.find(b => b.name === 'AI');
      expect(brand?.mentions).toBe(2); // Only "AI" twice, not "AIR"
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

    it('should handle boundary cases correctly', () => {
      const result4 = analyzeResponses('test', ['A'], Array(4).fill({ prompt: 'Q', response: 'A' }));
      const result5 = analyzeResponses('test', ['A'], Array(5).fill({ prompt: 'Q', response: 'A' }));
      const result29 = analyzeResponses('test', ['A'], Array(29).fill({ prompt: 'Q', response: 'A' }));
      const result30 = analyzeResponses('test', ['A'], Array(30).fill({ prompt: 'Q', response: 'A' }));

      expect(result4.confidenceLevel).toBe('low');
      expect(result5.confidenceLevel).toBe('directional');
      expect(result29.confidenceLevel).toBe('directional');
      expect(result30.confidenceLevel).toBe('high');
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

    it('should extract URLs from markdown links', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response: 'Check [this link](https://example.com) out.' },
      ]);

      expect(result.citations.map(c => c.url)).toContain('https://example.com');
    });

    it('should not double-count markdown URLs', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response: 'See [link](https://example.com) at https://example.com' },
      ]);

      const citation = result.citations.find(c => c.url === 'https://example.com');
      expect(citation?.count).toBe(1); // Should only count once
    });

    it('should handle complex URLs with query params', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response: 'Visit https://example.com/path?param=value&other=123' },
      ]);

      expect(result.citations[0].url).toBe('https://example.com/path?param=value&other=123');
    });

    it('should limit citations to top 20', () => {
      const urls = Array.from({ length: 25 }, (_, i) => `https://example${i}.com`);
      const response = urls.map(url => `Visit ${url}`).join(' and ');
      
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response },
      ]);

      expect(result.citations.length).toBe(20);
    });
  });

  describe('prompt results', () => {
    it('should track brands mentioned per prompt', () => {
      const result = analyzeResponses('test', ['A', 'B', 'C'], [
        { prompt: 'Q', response: 'A and B are good, but not C' },
      ]);

      expect(result.prompts[0].brandsMentioned).toContain('A');
      expect(result.prompts[0].brandsMentioned).toContain('B');
      expect(result.prompts[0].brandsMentioned).toContain('C');
    });

    it('should identify first mention per prompt', () => {
      const result = analyzeResponses('test', ['Second', 'First'], [
        { prompt: 'Q', response: 'First comes before Second' },
      ]);

      expect(result.prompts[0].firstMention).toBe('First');
    });

    it('should store URLs per prompt', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response: 'Check https://example.com and https://test.org' },
      ]);

      expect(result.prompts[0].urls).toHaveLength(2);
      expect(result.prompts[0].urls).toContain('https://example.com');
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

    it('should handle zero appearances', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response: 'Nothing here' },
      ]);

      const brand = result.brands.find(b => b.name === 'A');
      expect(brand?.mentionsPerPrompt).toBe(0);
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

    it('should handle ties deterministically with alphabetical order', () => {
      const result = analyzeResponses('test', ['Zebra', 'Apple'], [
        { prompt: 'Q', response: 'Apple and Zebra' }, // Both at same position (word boundary)
      ]);

      // With deterministic tie-breaking, Apple should win (alphabetically first)
      expect(result.prompts[0].firstMention).toBe('Apple');
      
      const apple = result.brands.find(b => b.name === 'Apple');
      const zebra = result.brands.find(b => b.name === 'Zebra');
      
      expect(apple?.firstMentions).toBe(1);
      expect(zebra?.firstMentions).toBe(0);
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

    it('should clean markdown from contexts', () => {
      const result = analyzeResponses('test', ['Brand'], [
        { prompt: 'Q', response: '**Brand** is *great* and amazing.' },
      ]);

      const context = result.prompts[0].brandContexts['Brand'];
      expect(context).not.toContain('**');
      expect(context).not.toContain('*');
      expect(context).toContain('Brand');
    });

    it('should add ellipsis for truncated contexts', () => {
      const longText = 'Start sentence here. '.repeat(10) + 
                       'Brand mention in middle. ' + 
                       'End sentence here. '.repeat(10);
      
      const result = analyzeResponses('test', ['Brand'], [
        { prompt: 'Q', response: longText },
      ]);

      const context = result.prompts[0].brandContexts['Brand'];
      expect(context).toMatch(/^\.\.\./); // Should start with ellipsis
      expect(context).toMatch(/\.\.\.$/); // Should end with ellipsis
    });

    it('should limit contexts to 5 per brand across all prompts', () => {
      const prompts = Array.from({ length: 10 }, (_, i) => ({
        prompt: `Q${i}`,
        response: `Brand appears here in prompt ${i}.`,
      }));
      
      const result = analyzeResponses('test', ['Brand'], prompts);
      const brand = result.brands.find(b => b.name === 'Brand');
      
      expect(brand?.contexts.length).toBeLessThanOrEqual(5);
    });

    it('should avoid duplicate contexts', () => {
      const result = analyzeResponses('test', ['Brand'], [
        { prompt: 'Q1', response: 'Brand is great.' },
        { prompt: 'Q2', response: 'Brand is great.' }, // Same text
      ]);

      const brand = result.brands.find(b => b.name === 'Brand');
      const uniqueContexts = new Set(brand?.contexts);
      
      expect(uniqueContexts.size).toBe(brand?.contexts.length);
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

      expect(cppBrand?.mentions).toBe(1);
      expect(csharpBrand?.mentions).toBe(1);
    });

    it('should handle very long responses efficiently', () => {
      const longResponse = 'BrandX '.repeat(1000);
      const result = analyzeResponses('test', ['BrandX'], [
        { prompt: 'Q', response: longResponse },
      ]);

      expect(result.brands[0].mentions).toBe(1000);
    });

    it('should handle brands with dots and hyphens', () => {
      const result = analyzeResponses('test', ['GPT-4', 'Node.js'], [
        { prompt: 'Q', response: 'GPT-4 and Node.js are both great.' },
      ]);

      const gpt = result.brands.find(b => b.name === 'GPT-4');
      const node = result.brands.find(b => b.name === 'Node.js');
      
      expect(gpt?.mentions).toBe(1);
      expect(node?.mentions).toBe(1);
    });

    it('should handle empty responses', () => {
      const result = analyzeResponses('test', ['Brand'], [
        { prompt: 'Q', response: '' },
      ]);

      const brand = result.brands.find(b => b.name === 'Brand');
      expect(brand?.mentions).toBe(0);
      expect(brand?.promptCoverage).toBe(0);
    });

    it('should handle multiple spaces in responses', () => {
      const result = analyzeResponses('test', ['Brand'], [
        { prompt: 'Q', response: 'Brand    is    great' },
      ]);

      const brand = result.brands.find(b => b.name === 'Brand');
      expect(brand?.mentions).toBe(1);
    });
  });

  describe('legacy compatibility', () => {
    it('should provide visibility alias for promptCoverage', () => {
      const result = analyzeResponses('test', ['A'], [
        { prompt: 'Q', response: 'A is here' },
      ]);

      const brand = result.brands[0];
      expect(brand.visibility).toBe(brand.promptCoverage);
      expect(brand.visibility).toBe(100);
    });

    it('should provide citationShare alias for mentionShare', () => {
      const result = analyzeResponses('test', ['A', 'B'], [
        { prompt: 'Q', response: 'A A A B' },
      ]);

      const brandA = result.brands.find(b => b.name === 'A');
      expect(brandA?.citationShare).toBe(brandA?.mentionShare);
      expect(brandA?.citationShare).toBe(75);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex multi-brand analysis', () => {
      const result = analyzeResponses(
        'AI Tools',
        ['ChatGPT', 'Claude', 'Gemini'],
        [
          { prompt: 'Best AI?', response: 'ChatGPT is popular. Claude is great too.' },
          { prompt: 'Most accurate?', response: 'Claude and Gemini are both accurate.' },
          { prompt: 'Fastest?', response: 'ChatGPT responds quickly.' },
          { prompt: 'Best for coding?', response: 'Claude excels at coding tasks.' },
        ]
      );

      expect(result.totalPrompts).toBe(4);
      expect(result.brands).toHaveLength(3);
      
      const claude = result.brands.find(b => b.name === 'Claude');
      expect(claude?.promptCoverage).toBe(75); // 3 out of 4 prompts
      expect(claude?.mentions).toBe(3);
    });

    it('should handle real-world citation patterns', () => {
      const result = analyzeResponses('test', ['A'], [
        { 
          prompt: 'Q', 
          response: 'According to [this study](https://example.com/study), A is effective. See https://test.org for more.' 
        },
      ]);

      expect(result.citations).toHaveLength(2);
      expect(result.prompts[0].urls).toHaveLength(2);
    });
  });
});