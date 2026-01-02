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
  (MockOpenAI as any).APIError = class APIError extends Error {
    constructor(public status: number, public error: any, message: string, public headers: Headers) {
      super(message);
      this.name = 'APIError';
    }
  };
  
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
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'sk-test' });
      expect(client).toBeDefined();
    });

    it('creates Ollama client when provider is ollama', () => {
      process.env.AI_PROVIDER = 'ollama';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';

      createAIClient();
      expect(OpenAI).toHaveBeenCalledWith({ baseURL: 'http://localhost:11434/v1', apiKey: 'ollama' });
    });

    it('throws when OpenAI key missing', () => {
      process.env.AI_PROVIDER = 'openai';
      delete process.env.OPENAI_API_KEY;

      expect(() => createAIClient()).toThrow('OpenAI API key is required');
    });

    it('prefers user key even if provider is ollama', () => {
      process.env.AI_PROVIDER = 'ollama';

      createAIClient('sk-user');
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'sk-user' });
    });
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

    it('maps API errors', async () => {
      const apiError = new OpenAI.APIError(401, { message: 'bad key' }, 'Unauthorized', new Headers());
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockRejectedValue(apiError);

      await expect(queryAI(instance, 'prompt')).rejects.toThrow('Invalid API key');
    });

    it('handles connection refused for Ollama', async () => {
      const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)({ apiKey: 'test' });
      (instance.chat.completions.create as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(queryAI(instance, 'prompt')).rejects.toThrow('Cannot connect to Ollama');
    });
  });

  describe('getAIProviderInfo', () => {
    it('returns Ollama info', () => {
      process.env.AI_PROVIDER = 'ollama';
      process.env.OLLAMA_MODEL = 'llama3.2';

      const info = getAIProviderInfo();
      expect(info.provider).toBe('Ollama (Local)');
      expect(info.model).toBe('llama3.2');
    });

    it('returns OpenAI info', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_MODEL = 'gpt-4o';

      const info = getAIProviderInfo();
      expect(info.provider).toBe('OpenAI');
      expect(info.model).toBe('gpt-4o');
    });
  });
});
