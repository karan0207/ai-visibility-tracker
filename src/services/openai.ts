import OpenAI from 'openai';

// AI Provider configuration
type AIProvider = 'openai' | 'xai' | 'google' | 'anthropic';

interface AIConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
}

interface QueryOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  retries?: number;
  timeout?: number;
}

interface StreamOptions extends QueryOptions {
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'google') as AIProvider;

  if (provider === 'anthropic') {
    return {
      provider: 'anthropic',
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      maxTokens: 4000,
      temperature: 0.5,
    };
  }

  if (provider === 'xai') {
    return {
      provider: 'xai',
      model: process.env.XAI_MODEL || 'grok-2-latest',
      maxTokens: 4000,
      temperature: 0.4,
      baseURL: 'https://api.x.ai/v1',
    };
  }

  if (provider === 'google') {
    return {
      provider: 'google',
      model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp',
      maxTokens: 4000,
      temperature: 0.5,
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
 * Validate API keys for all providers
 */
function validateAPIKeys(config: AIConfig): void {
  const keyMap: Record<AIProvider, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    xai: process.env.XAI_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };

  const key = keyMap[config.provider];
  
  if (!key || key.startsWith('sk-your-')) {
    const envVar = `${config.provider.toUpperCase()}_API_KEY`;
    throw new Error(
      `${envVar} is required when using AI_PROVIDER=${config.provider}. ` +
      `Please set it in your .env file.`
    );
  }
}

/**
 * Create an AI client instance with proper error handling
 * Supports OpenAI, xAI (Grok), Google (Gemini), and Anthropic (Claude)
 */
export function createAIClient(apiKey?: string): OpenAI {
  const config = getAIConfig();

  // Explicit API key override (for OpenAI)
  if (apiKey && !apiKey.startsWith('sk-your-')) {
    return new OpenAI({ 
      apiKey,
      timeout: 60000, // 60 second timeout
      maxRetries: 2,
    });
  }

  // Validate keys before creating client
  validateAPIKeys(config);

  const clientConfig: Record<string, unknown> = {
    timeout: 60000,
    maxRetries: 2,
  };

  if (config.provider === 'anthropic') {
    // Anthropic uses OpenAI-compatible API
    return new OpenAI({
      ...clientConfig,
      baseURL: 'https://api.anthropic.com/v1',
      apiKey: process.env.ANTHROPIC_API_KEY!,
      defaultHeaders: {
        'anthropic-version': '2023-06-01',
      },
    });
  }

  if (config.provider === 'xai') {
    return new OpenAI({
      ...clientConfig,
      baseURL: config.baseURL,
      apiKey: process.env.XAI_API_KEY!,
    });
  }

  if (config.provider === 'google') {
    return new OpenAI({
      ...clientConfig,
      baseURL: config.baseURL,
      apiKey: process.env.GOOGLE_API_KEY!,
    });
  }

  // OpenAI
  return new OpenAI({ 
    ...clientConfig,
    apiKey: process.env.OPENAI_API_KEY!,
  });
}

/**
 * System prompt optimized for citation generation
 * This encourages the AI to include relevant URLs and sources
 */
const DEFAULT_SYSTEM_PROMPT = `
You are a knowledgeable product expert who provides well-researched recommendations.

When answering questions about products, tools, or services:

1. **Mention relevant brands naturally** in your explanation
   - Explain why certain options are good fits
   - Compare features and use cases when helpful
   - Be conversational, not list-like

2. **ALWAYS include authoritative sources** to back up your recommendations:
   - Link to official product websites (e.g., https://www.salesforce.com)
   - Reference reputable review sites (e.g., G2, Capterra, TechCrunch)
   - Cite comparison articles or industry reports when relevant
   - Include 3-5 different sources per response when possible

3. **Format sources naturally**:
   - Inline: "According to G2 (https://www.g2.com/categories/crm), Salesforce leads..."
   - End of paragraph: "Learn more at https://www.hubspot.com"
   - Markdown links: "Check out [Salesforce](https://www.salesforce.com) for enterprise needs"

4. **Writing style**:
   - Clear and conversational, not robotic
   - Use structure (paragraphs, lists) only when it improves clarity
   - Avoid repetitive phrasing and marketing speak
   - Write like you're explaining to a colleague

5. **Source quality matters**:
   - Prefer official websites, established review platforms, and industry publications
   - Avoid obscure blogs or unreliable sources
   - Use actual URLs, not placeholders

Example response style:
"For CRM software, Salesforce (https://www.salesforce.com) is the industry leader with comprehensive features. HubSpot (https://www.hubspot.com) offers a great free tier for startups. According to G2's 2024 rankings (https://www.g2.com/categories/crm), both consistently score high for ease of use..."

Remember: Include real, working URLs in every response to support your recommendations.
`.trim();

/**
 * Alternative prompt for more citation-heavy responses
 */
const CITATION_FOCUSED_PROMPT = `
You are a research-focused product advisor who always backs up recommendations with sources.

Core principles:
- Provide 3-5 relevant product recommendations per query
- Include at least one authoritative URL for EACH brand mentioned
- Reference comparison sites, reviews, and official documentation
- Use actual working URLs (official sites, G2, Capterra, TechCrunch, etc.)

Citation requirements:
✓ Official product websites (https://product.com)
✓ Review platforms (G2, Capterra, TrustRadius)
✓ Industry publications (TechCrunch, Forbes, VentureBeat)
✓ Comparison articles and buying guides
✗ No generic search engines or Wikipedia

Format examples:
- "Salesforce (https://www.salesforce.com) is ideal for..."
- "According to G2 (https://g2.com/products/salesforce), it ranks #1 in..."
- "Learn more at [HubSpot](https://www.hubspot.com)"

Your responses should read naturally but be rich with verifiable sources. Aim for 4-6 URLs per response.
`.trim();

/**
 * Enhanced error handling with retries
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on auth errors or invalid models
      if (error instanceof OpenAI.APIError) {
        if ([401, 403, 404].includes(error.status || 0)) {
          throw error;
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Format error messages for better UX
 */
function formatAIError(error: unknown, config: AIConfig): Error {
  if (error instanceof OpenAI.APIError) {
    switch (error.status) {
      case 401:
      case 403:
        return new Error(
          `Authentication failed for ${config.provider}. Please check your API key.`
        );
      case 404:
        return new Error(
          `Model "${config.model}" not found. Please check your configuration.`
        );
      case 429:
        return new Error(
          `Rate limit exceeded for ${config.provider}. Please wait and try again.`
        );
      case 500:
      case 502:
      case 503:
        return new Error(
          `${config.provider} service is temporarily unavailable. Please try again later.`
        );
      default:
        return new Error(
          `AI service error (${error.status}): ${error.message}`
        );
    }
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      return new Error(
        `Cannot connect to ${config.provider}. Please check your internet connection.`
      );
    }
    
    // JSON parsing errors
    if (error.message.includes('JSON') || error instanceof SyntaxError) {
      return new Error(
        `Invalid response from ${config.provider}. The service may be experiencing issues.`
      );
    }
  }

  return error instanceof Error ? error : new Error('Unknown error occurred');
}

/**
 * Query the AI model with a single prompt
 */
export async function queryAI(
  client: OpenAI,
  prompt: string,
  options: QueryOptions = {}
): Promise<string> {
  const config = getAIConfig();
  const {
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    temperature = config.temperature,
    maxTokens = config.maxTokens,
    retries = 2,
  } = options;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[AI] Provider: ${config.provider}, Model: ${config.model}`);
  }

  try {
    return await executeWithRetry(async () => {
      const completion = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI returned an empty response.');
      }

      return content.trim();
    }, retries);
  } catch (error) {
    throw formatAIError(error, config);
  }
}

/**
 * Query AI specifically for citation-rich responses
 * Uses the citation-focused system prompt
 */
export async function queryAIWithCitations(
  client: OpenAI,
  prompt: string,
  options: Omit<QueryOptions, 'systemPrompt'> = {}
): Promise<string> {
  return queryAI(client, prompt, {
    ...options,
    systemPrompt: CITATION_FOCUSED_PROMPT,
  });
}

/**
 * Query AI with streaming response
 */
export async function queryAIStream(
  client: OpenAI,
  prompt: string,
  options: StreamOptions = {}
): Promise<string> {
  const config = getAIConfig();
  const {
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    temperature = config.temperature,
    maxTokens = config.maxTokens,
    onChunk,
    signal,
  } = options;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[AI] Streaming from ${config.provider}`);
  }

  try {
    const stream = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      // Check for cancellation
      if (signal?.aborted) {
        throw new Error('Request cancelled');
      }

      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk?.(content);
      }
    }

    return fullResponse.trim();
  } catch (error) {
    if (error instanceof Error && error.message === 'Request cancelled') {
      throw error;
    }
    throw formatAIError(error, config);
  }
}

/**
 * Batch query multiple prompts with progress tracking
 * Uses citation-focused prompts by default for visibility tracking
 */
export async function queryAIBatch(
  client: OpenAI,
  prompts: string[],
  options: QueryOptions & {
    onProgress?: (completed: number, total: number) => void;
    concurrency?: number;
    useCitationPrompt?: boolean;
  } = {}
): Promise<Array<{ prompt: string; response: string; error?: string }>> {
  const { 
    onProgress, 
    concurrency = 3, 
    useCitationPrompt = true, 
    ...queryOptions 
  } = options;
  
  // Use citation-focused prompt for batch operations (visibility tracking)
  const finalOptions = {
    ...queryOptions,
    systemPrompt: useCitationPrompt ? CITATION_FOCUSED_PROMPT : queryOptions.systemPrompt,
  };
  
  const results: Array<{ prompt: string; response: string; error?: string }> = [];
  
  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < prompts.length; i += concurrency) {
    const batch = prompts.slice(i, i + concurrency);
    
    const batchResults = await Promise.allSettled(
      batch.map(prompt => queryAI(client, prompt, finalOptions))
    );

    batchResults.forEach((result, index) => {
      const prompt = batch[index];
      if (result.status === 'fulfilled') {
        results.push({ prompt, response: result.value });
      } else {
        results.push({ 
          prompt, 
          response: '', 
          error: result.reason?.message || 'Unknown error' 
        });
      }
    });

    onProgress?.(Math.min(i + concurrency, prompts.length), prompts.length);
    
    // Rate limiting: wait between batches
    if (i + concurrency < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Get current AI provider info for display
 */
export function getAIProviderInfo(): { 
  provider: string; 
  model: string; 
  isConfigured: boolean;
  error?: string;
} {
  const config = getAIConfig();
  const providerNames: Record<AIProvider, string> = {
    openai: 'OpenAI',
    xai: 'xAI (Grok)',
    google: 'Google (Gemini)',
    anthropic: 'Anthropic (Claude)',
  };

  try {
    validateAPIKeys(config);
    return {
      provider: providerNames[config.provider],
      model: config.model,
      isConfigured: true,
    };
  } catch (error) {
    return {
      provider: providerNames[config.provider],
      model: config.model,
      isConfigured: false,
      error: error instanceof Error ? error.message : 'Configuration error',
    };
  }
}

/**
 * Test AI connection
 */
export async function testAIConnection(client: OpenAI): Promise<{
  success: boolean;
  message: string;
  latency?: number;
}> {
  const startTime = Date.now();
  
  try {
    await queryAI(client, 'Say "ok" if you can hear me.', {
      maxTokens: 10,
      retries: 0,
    });
    
    const latency = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Connection successful',
      latency,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Export system prompts for customization
 */
export { DEFAULT_SYSTEM_PROMPT, CITATION_FOCUSED_PROMPT };