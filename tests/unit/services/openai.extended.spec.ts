import { createAIClient, queryAI, getAIProviderInfo } from '@/services/openai';
import OpenAI from 'openai';

jest.mock('openai', () => {
  const create = jest.fn();
  const MockOpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create,
      },
    },
  }));

  // Mock APIError class
  /* eslint-disable @typescript-eslint/no-explicit-any */
  (MockOpenAI as any).APIError = class APIError extends Error {
    constructor(public status: number, public error: unknown, message: string, public headers: Headers) {
      super(message);
      this.name = 'APIError';
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return MockOpenAI;
});

describe('openai service - extended coverage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('createAIClient - additional providers', () => {
    it('creates xAI client when provider is xai', () => {
      process.env.AI_PROVIDER = 'xai';
      process.env.XAI_API_KEY = 'xai-test-key';
      createAIClient();
      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.x.ai/v1',
          apiKey: 'xai-test-key',
        })
      );
    });

    it('throws when xAI key missing', () => {
      process.env.AI_PROVIDER = 'xai';
      delete process.env.XAI_API_KEY;
      expect(() => createAIClient()).toThrow('XAI_API_KEY is required');
    });

    it('creates Google client when provider is google', () => {
      process.env.AI_PROVIDER = 'google';
      process.env.GOOGLE_API_KEY = 'google-test-key';
      createAIClient();
      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          apiKey: 'google-test-key',
        })
      );
    });

    it('uses custom Google model from env', () => {
      process.env.AI_PROVIDER = 'google';
      process.env.GOOGLE_MODEL = 'gemini-pro';
      const info = getAIProviderInfo();
      expect(info.model).toBe('gemini-pro');
    });

    it('uses custom xAI model from env', () => {
      process.env.AI_PROVIDER = 'xai';
      process.env.XAI_MODEL = 'grok-2';
      const info = getAIProviderInfo();
      expect(info.model).toBe('grok-2');
    });

    it('uses custom OpenAI model from env', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_MODEL = 'gpt-4-turbo';
      process.env.OPENAI_API_KEY = 'sk-test';
      const info = getAIProviderInfo();
      expect(info.model).toBe('gpt-4-turbo');
    });
  });

  describe('queryAI - additional error handling', () => {
    // Removed Ollama support and fixed misplaced await

    it('handles 404 model not found error', async () => {
      const apiError = new OpenAI.APIError(404, { message: 'model not found' }, 'Not Found', new Headers());
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockRejectedValue(apiError);
      await expect(queryAI(instance, 'prompt', { retries: 0 })).rejects.toThrow('not found');
    });

    it('handles 429 rate limit error', async () => {
      const apiError = new OpenAI.APIError(429, { message: 'rate limit' }, 'Too Many Requests', new Headers());
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockRejectedValue(apiError);
      await expect(queryAI(instance, 'prompt', { retries: 0 })).rejects.toThrow('Rate limit exceeded');
    });

    it('handles 500 server error', async () => {
      const apiError = new OpenAI.APIError(500, { message: 'internal error' }, 'Server Error', new Headers());
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockRejectedValue(apiError);

      await expect(queryAI(instance, 'prompt', { retries: 0 })).rejects.toThrow('service is temporarily unavailable');
    });

    it('handles JSON parsing errors', async () => {
      const jsonError = new SyntaxError('Unexpected token in JSON');
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockRejectedValue(jsonError);

      await expect(queryAI(instance, 'prompt', { retries: 0 })).rejects.toThrow('Invalid response from');
    });

    it('passes through unknown errors', async () => {
      const unknownError = new Error('Unknown error occurred');
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockRejectedValue(unknownError);

      await expect(queryAI(instance, 'prompt', { retries: 0 })).rejects.toThrow('Unknown error occurred');
    });

    it('handles empty choices array', async () => {
      const mockResponse = { choices: [] };
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await expect(queryAI(instance, 'prompt', { retries: 0 })).rejects.toThrow('AI returned an empty response');
    });

    it('handles undefined message', async () => {
      const mockResponse = { choices: [{ message: undefined }] };
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await expect(queryAI(instance, 'prompt', { retries: 0 })).rejects.toThrow('AI returned an empty response');
    });
  });

  describe('getAIProviderInfo - all providers', () => {
    it('returns xAI info', () => {
      process.env.AI_PROVIDER = 'xai';
      process.env.XAI_MODEL = 'grok-4-latest';
      const info = getAIProviderInfo();
      expect(info.provider).toBe('xAI (Grok)');
      expect(info.model).toBe('grok-4-latest');
    });

    it('returns Google info', () => {
      process.env.AI_PROVIDER = 'google';
      process.env.GOOGLE_MODEL = 'gemini-2.5-flash';
      const info = getAIProviderInfo();
      expect(info.provider).toBe('Google (Gemini)');
      expect(info.model).toBe('gemini-2.5-flash');
    });

    it('returns OpenAI info', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_MODEL = 'gpt-4o';
      process.env.OPENAI_API_KEY = 'sk-test';
      const info = getAIProviderInfo();
      expect(info.provider).toBe('OpenAI');
      expect(info.model).toBe('gpt-4o');
    });

    it('defaults to Google when no provider set', () => {
      delete process.env.AI_PROVIDER;
      const info = getAIProviderInfo();
      expect(info.provider).toBe('Google (Gemini)');
      expect(info.model).toBe('gemini-2.5-flash');
    });
  });
});
