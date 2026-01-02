import OpenAI from 'openai';

// AI Provider configuration
type AIProvider = 'openai' | 'ollama' | 'xai' | 'google';

interface AIConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
}

function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'ollama') as AIProvider;

  if (provider === 'ollama') {
    return {
      provider: 'ollama',
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      maxTokens: 4000,
      temperature: 0.4,
      baseURL: `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/v1`,
    };
  }

  if (provider === 'xai') {
    return {
      provider: 'xai',
      model: process.env.XAI_MODEL || 'grok-4-latest',
      maxTokens: 4000,
      temperature: 0.4,
      baseURL: 'https://api.x.ai/v1',
    };
  }

  if (provider === 'google') {
    return {
      provider: 'google',
      model: process.env.GOOGLE_MODEL || 'gemini-2.5-flash',
      maxTokens: 4000,
      temperature: 0.5, // IMPORTANT: Gemini sounds robotic below this
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    };
  }

  return {
    provider: 'openai',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    maxTokens: 4000,
    temperature: 0.4,
  };
}

/**
 * Create an AI client instance
 * Supports OpenAI, xAI (Grok), Google (Gemini), and Ollama (local)
 */
export function createAIClient(apiKey?: string): OpenAI {
  const config = getAIConfig();

  // Explicit OpenAI key overrides provider config
  if (apiKey && apiKey !== 'sk-your-openai-api-key-here') {
    return new OpenAI({ apiKey });
  }

  if (config.provider === 'ollama') {
    return new OpenAI({
      baseURL: config.baseURL,
      apiKey: 'ollama',
    });
  }

  if (config.provider === 'xai') {
    const key = process.env.XAI_API_KEY;
    if (!key) {
      throw new Error('XAI_API_KEY is required when using AI_PROVIDER=xai');
    }
    return new OpenAI({
      baseURL: config.baseURL,
      apiKey: key,
    });
  }

  if (config.provider === 'google') {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error('GOOGLE_API_KEY is required when using AI_PROVIDER=google');
    }
    return new OpenAI({
      baseURL: config.baseURL,
      apiKey: key,
    });
  }

  // OpenAI
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'sk-your-openai-api-key-here') {
    throw new Error(
      'OpenAI API key is required. Set AI_PROVIDER=ollama to use local models, or provide an OpenAI API key.'
    );
  }

  return new OpenAI({ apiKey: key });
}

/**
 * Query the AI model with a single prompt
 */
export async function queryAI(
  client: OpenAI,
  prompt: string
): Promise<string> {
  const config = getAIConfig();

  console.log(`[AI] Provider: ${config.provider}, Model: ${config.model}`);

  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `
You are a knowledgeable, neutral, human-sounding product expert.

Your goal is to answer questions the way ChatGPT would:
- Clear, natural, and conversational
- Confident but not salesy
- Helpful without sounding like a report

When users ask for recommendations or comparisons:
- Mention relevant brands naturally, not as a forced list
- Explain *why* certain options are better in plain language
- Use structure only when it improves clarity
- Avoid repeating the same phrasing across brands
- Avoid marketing copy and analyst-style reports

Important constraints:
- Do NOT force a fixed number of recommendations
- Do NOT always use pros/cons sections
- Do NOT mention pricing unless it is widely known or directly relevant
- Prefer short paragraphs over long lists
- Write like a human explaining things to another human

If the question is vague, make reasonable assumptions and briefly explain them.
If the question is specific, stay focused and concise.

The response should feel trustworthy, readable, and natural — not AI-generated.
          `.trim(),
        },
        {
          role: 'user',
          content: `
Answer naturally, like ChatGPT would.

Question:
${prompt}
          `.trim(),
        },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI returned an empty response.');
    }

    return content;
  } catch (error: unknown) {
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw new Error(
        'AI service returned an invalid response. The model may still be loading — please retry.'
      );
    }

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error('Invalid API key.');
      }
      if (error.status === 404) {
        throw new Error(`Model "${config.model}" not found.`);
      }
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please retry shortly.');
      }
      if (error.status === 500) {
        throw new Error('AI service error. Please try again later.');
      }
    }

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      throw new Error(
        'Cannot connect to Ollama. Make sure it is running.'
      );
    }

    throw error;
  }
}

/**
 * Get current AI provider info for display
 */
export function getAIProviderInfo(): { provider: string; model: string } {
  const config = getAIConfig();
  const providerNames: Record<AIProvider, string> = {
    ollama: 'Ollama (Local)',
    openai: 'OpenAI',
    xai: 'xAI (Grok)',
    google: 'Google (Gemini)',
  };

  return {
    provider: providerNames[config.provider],
    model: config.model,
  };
}
