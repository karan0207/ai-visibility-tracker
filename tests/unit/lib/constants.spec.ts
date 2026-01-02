import { generatePrompts, PROMPT_TEMPLATES, APP_CONFIG, VISIBILITY_THRESHOLDS, getVisibilityLevel } from '@/lib/constants';

describe('constants', () => {
  it('replaces category placeholder', () => {
    const prompts = generatePrompts('CRM software');
    expect(prompts.length).toBe(PROMPT_TEMPLATES.length);
    prompts.forEach(prompt => {
      expect(prompt).toContain('CRM software');
      expect(prompt).not.toContain('{category}');
    });
  });

  it('handles empty category', () => {
    const prompts = generatePrompts('');
    prompts.forEach(prompt => expect(prompt).not.toContain('{category}'));
  });

  it('has sensible app config defaults', () => {
    expect(APP_CONFIG.maxBrands).toBeGreaterThan(0);
    expect(APP_CONFIG.minBrands).toBeLessThan(APP_CONFIG.maxBrands);
    expect(APP_CONFIG.maxCategoryLength).toBeGreaterThan(10);
    expect(APP_CONFIG.temperature).toBeGreaterThanOrEqual(0);
    expect(APP_CONFIG.temperature).toBeLessThanOrEqual(2);
  });

  it('computes visibility levels', () => {
    expect(getVisibilityLevel(VISIBILITY_THRESHOLDS.high)).toBe('high');
    expect(getVisibilityLevel(VISIBILITY_THRESHOLDS.medium)).toBe('medium');
    expect(getVisibilityLevel(VISIBILITY_THRESHOLDS.medium - 1)).toBe('low');
  });
});
