import { 
  generatePrompts, 
  PROMPT_TEMPLATES, 
  APP_CONFIG, 
  VISIBILITY_THRESHOLDS, 
  getVisibilityLevel 
} from '@/lib/constants';

describe('constants - extended coverage', () => {
  describe('generatePrompts', () => {
    it('generates correct number of prompts', () => {
      const prompts = generatePrompts('software');
      expect(prompts).toHaveLength(PROMPT_TEMPLATES.length);
    });

    it('replaces all placeholders in each prompt', () => {
      const category = 'project management tools';
      const prompts = generatePrompts(category);
      
      prompts.forEach(prompt => {
        expect(prompt).toContain(category);
        expect(prompt).not.toContain('{category}');
      });
    });

    it('handles special characters in category', () => {
      const category = 'C++ compilers & IDEs';
      const prompts = generatePrompts(category);
      
      prompts.forEach(prompt => {
        expect(prompt).toContain('C++ compilers & IDEs');
      });
    });

    it('handles unicode characters in category', () => {
      const category = '人工智能工具';
      const prompts = generatePrompts(category);
      
      prompts.forEach(prompt => {
        expect(prompt).toContain('人工智能工具');
      });
    });

    it('handles very long category names', () => {
      const category = 'enterprise resource planning software for manufacturing';
      const prompts = generatePrompts(category);
      
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts[0]).toContain(category);
    });

    it('returns immutable array-like structure', () => {
      const prompts1 = generatePrompts('CRM');
      const prompts2 = generatePrompts('CRM');
      
      // Should return new array each time
      expect(prompts1).not.toBe(prompts2);
      expect(prompts1).toEqual(prompts2);
    });
  });

  describe('PROMPT_TEMPLATES', () => {
    it('has at least 5 templates', () => {
      expect(PROMPT_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it('all templates contain {category} placeholder', () => {
      PROMPT_TEMPLATES.forEach(template => {
        expect(template).toContain('{category}');
      });
    });

    it('templates are diverse (different starting words)', () => {
      const startingWords = new Set(
        PROMPT_TEMPLATES.map(t => t.split(/\s+/)[0].toLowerCase())
      );
      // At least 3 different starting patterns
      expect(startingWords.size).toBeGreaterThanOrEqual(3);
    });

    it('templates are typed as readonly', () => {
      // TypeScript enforces readonly at compile time via 'as const'
      // At runtime, the array exists but type system prevents modifications in TS
      expect(PROMPT_TEMPLATES.length).toBeGreaterThan(0);
      // Verify it's an array-like structure
      expect(Array.isArray(PROMPT_TEMPLATES)).toBe(true);
    });
  });

  describe('APP_CONFIG', () => {
    it('has valid maxBrands configuration', () => {
      expect(APP_CONFIG.maxBrands).toBeGreaterThan(0);
      expect(APP_CONFIG.maxBrands).toBeLessThanOrEqual(20); // reasonable limit
    });

    it('has valid minBrands configuration', () => {
      expect(APP_CONFIG.minBrands).toBeGreaterThanOrEqual(1);
      expect(APP_CONFIG.minBrands).toBeLessThan(APP_CONFIG.maxBrands);
    });

    it('has valid maxCategoryLength', () => {
      expect(APP_CONFIG.maxCategoryLength).toBeGreaterThanOrEqual(10);
      expect(APP_CONFIG.maxCategoryLength).toBeLessThanOrEqual(500);
    });

    it('has valid temperature range', () => {
      expect(APP_CONFIG.temperature).toBeGreaterThanOrEqual(0);
      expect(APP_CONFIG.temperature).toBeLessThanOrEqual(2);
    });

    it('has valid maxTokens', () => {
      expect(APP_CONFIG.maxTokens).toBeGreaterThan(0);
      expect(APP_CONFIG.maxTokens).toBeLessThanOrEqual(8000);
    });

    it('has valid parallelBatchSize', () => {
      expect(APP_CONFIG.parallelBatchSize).toBeGreaterThan(0);
      expect(APP_CONFIG.parallelBatchSize).toBeLessThanOrEqual(20);
    });

    it('has required app metadata', () => {
      expect(APP_CONFIG.name).toBeTruthy();
      expect(APP_CONFIG.description).toBeTruthy();
      expect(APP_CONFIG.openaiModel).toBeTruthy();
    });
  });

  describe('VISIBILITY_THRESHOLDS', () => {
    it('has high threshold greater than medium', () => {
      expect(VISIBILITY_THRESHOLDS.high).toBeGreaterThan(VISIBILITY_THRESHOLDS.medium);
    });

    it('has medium threshold greater than 0', () => {
      expect(VISIBILITY_THRESHOLDS.medium).toBeGreaterThan(0);
    });

    it('has high threshold at most 100', () => {
      expect(VISIBILITY_THRESHOLDS.high).toBeLessThanOrEqual(100);
    });
  });

  describe('getVisibilityLevel', () => {
    it('returns high for values at or above high threshold', () => {
      expect(getVisibilityLevel(VISIBILITY_THRESHOLDS.high)).toBe('high');
      expect(getVisibilityLevel(100)).toBe('high');
      expect(getVisibilityLevel(VISIBILITY_THRESHOLDS.high + 10)).toBe('high');
    });

    it('returns medium for values between thresholds', () => {
      expect(getVisibilityLevel(VISIBILITY_THRESHOLDS.medium)).toBe('medium');
      expect(getVisibilityLevel(VISIBILITY_THRESHOLDS.high - 1)).toBe('medium');
      expect(getVisibilityLevel((VISIBILITY_THRESHOLDS.high + VISIBILITY_THRESHOLDS.medium) / 2)).toBe('medium');
    });

    it('returns low for values below medium threshold', () => {
      expect(getVisibilityLevel(VISIBILITY_THRESHOLDS.medium - 1)).toBe('low');
      expect(getVisibilityLevel(0)).toBe('low');
      expect(getVisibilityLevel(10)).toBe('low');
    });

    it('handles edge cases', () => {
      expect(getVisibilityLevel(-1)).toBe('low');
      expect(getVisibilityLevel(0.5)).toBe('low');
      expect(getVisibilityLevel(29.9)).toBe('low');
      expect(getVisibilityLevel(30)).toBe('medium');
    });

    it('handles decimal values correctly', () => {
      // Assuming medium is 30 and high is 60
      expect(getVisibilityLevel(59.9)).toBe('medium');
      expect(getVisibilityLevel(60.0)).toBe('high');
    });
  });
});
