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

describe('openai service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('createAIClient', () => {
    it('creates OpenAI client with provided key', () => {
      const client = createAIClient('sk-test');
      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'sk-test' })
      );
      expect(client).toBeDefined();
    });

    // Ollama support removed

    // Ollama support removed
  });

  describe('queryAI', () => {
    it('returns response content', async () => {
      const mockResponse = { choices: [{ message: { content: 'hello' } }] };
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const content = await queryAI(instance, 'prompt');
      expect(content).toBe('hello');
    });

    it('throws when content empty', async () => {
      const mockResponse = { choices: [{ message: { content: null } }] };
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await expect(queryAI(instance, 'prompt')).rejects.toThrow('AI returned an empty response');
    });

    // Ollama support removed
  });

  describe('getAIProviderInfo', () => {
    // Ollama support removed

    it('returns OpenAI info', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_MODEL = 'gpt-4o';

      const info = getAIProviderInfo();
      expect(info.provider).toBe('OpenAI');
      expect(info.model).toBe('gpt-4o');
    });
  });
});
