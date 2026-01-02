import { analyzeRequestSchema, chatPromptSchema } from '@/types/api';

describe('analyzeRequestSchema', () => {
  it('validates minimal payload', () => {
    const result = analyzeRequestSchema.safeParse({ category: 'CRM', brands: ['A', 'B'] });
    expect(result.success).toBe(true);
  });

  it('rejects short category', () => {
    const result = analyzeRequestSchema.safeParse({ category: 'a', brands: ['A', 'B'] });
    expect(result.success).toBe(false);
  });

  it('rejects too many brands', () => {
    const result = analyzeRequestSchema.safeParse({ category: 'CRM', brands: Array.from({ length: 11 }, (_, i) => `Brand${i}`) });
    expect(result.success).toBe(false);
  });
});

describe('chatPromptSchema', () => {
  it('validates prompt and brand', () => {
    const result = chatPromptSchema.safeParse({ prompt: 'Best tools?', brands: ['Tool'] });
    expect(result.success).toBe(true);
  });

  it('rejects empty prompt', () => {
    const result = chatPromptSchema.safeParse({ prompt: '', brands: ['Tool'] });
    expect(result.success).toBe(false);
  });

  it('transforms null response to empty string', () => {
    const result = chatPromptSchema.safeParse({ prompt: 'Next', brands: ['Tool'], previousPrompts: [{ prompt: 'Prev', response: null }] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.previousPrompts?.[0].response).toBe('');
    }
  });

  it('accepts null sessionId', () => {
    const result = chatPromptSchema.safeParse({ prompt: 'Next', brands: ['Tool'], sessionId: null });
    expect(result.success).toBe(true);
  });
});
