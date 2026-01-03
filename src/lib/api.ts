import OpenAI from 'openai';
import { AppSettings, storage } from './storage';
import { getSystemPrompt } from './prompts';

async function getClient() {
  const settings = await storage.get<AppSettings>('settings', 'settings');
  const apiKey = settings?.openRouterApiKey;

  if (!apiKey) {
    throw new Error('API Key missing');
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://dumpling.cafe',
      'X-Title': 'Dumpling Cafe',
    },
  });
}

export async function generateImage(prompt: string, model: string, aspectRatio: string): Promise<string> {
  const client = await getClient();

  console.log('[API] generateImage called:', { prompt, model, aspectRatio });

  try {
    const requestBody: Record<string, unknown> = {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      modalities: ['image', 'text'], // REQUIRED!
    };

    // Add image_config for Gemini models
    if (model.includes('gemini')) {
      requestBody.extra_body = {
        image_config: {
          aspect_ratio: aspectRatio,
          image_size: '1K',
        }
      };
    }

    console.log('[API] Request body:', requestBody);

    const response = await client.chat.completions.create(
      requestBody as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
    );

    console.log('[API] Response:', response);

    // Check for images array first (newer format)
    const message = response.choices[0]?.message;
    type OpenRouterImage = { image_url: { url: string } };
    const images = (message as unknown as { images?: OpenRouterImage[] } | undefined)?.images;
    const imageUrl = images?.[0]?.image_url?.url;
    if (imageUrl) {
      console.log('[API] Found image in images array');
      return imageUrl;
    }

    // Fallback to content
    const imageData = message?.content;
    if (!imageData) {
      throw new Error('No image data received');
    }

    console.log('[API] Processing content as image data');

    if (imageData.startsWith('http')) return imageData;
    if (imageData.startsWith('data:image')) return imageData;
    return `data:image/png;base64,${imageData}`;

  } catch (error) {
    console.error('[API] Image generation error:', error);
    throw error;
  }
}

export async function editImage(
  originalImageBase64: string,
  maskBase64: string | null,
  editPrompt: string,
  model: string
): Promise<string> {
  const client = await getClient();

  // Ensure base64 strings are clean (remove prefix if present for sending, or keep if API expects it)
  // OpenAI API usually expects data URLs for image_url type.
  // The spec says: image_url: { url: `data:image/png;base64,${originalImageBase64}` }
  // So we expect the input to be raw base64 or we strip the prefix if it's there to avoid double prefixing.
  
  const cleanOriginal = originalImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
  const cleanMask = maskBase64 ? maskBase64.replace(/^data:image\/[a-z]+;base64,/, '') : null;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${cleanOriginal}` }
        },
        ...(cleanMask ? [{
          type: 'image_url' as const,
          image_url: { url: `data:image/png;base64,${cleanMask}` }
        }] : []),
        {
          type: 'text',
          text: editPrompt
        }
      ]
    }
  ];

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
    });

    const imageData = response.choices[0].message.content;
    
    if (!imageData) {
      throw new Error('No image data received');
    }

    if (imageData.startsWith('http')) {
      return imageData;
    }
    
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    
    return `data:image/png;base64,${imageData}`;
    
  } catch (error) {
    console.error('Edit error:', error);
    throw error;
  }
}

export async function generateText(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  model: string,
  temperature: number = 0.7,
  maxTokens: number = 4000
): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const client = await getClient();

  // Prepend system prompt if not already present
  const hasSystemPrompt = messages.some(m => m.role === 'system');
  const messagesWithSystem = hasSystemPrompt
    ? messages
    : [{ role: 'system' as const, content: getSystemPrompt('chat') }, ...messages];

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: messagesWithSystem,
      temperature: temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new Error('No completion choice returned');
    }
    const content = choice.message.content || '';
    const usage = response.usage;

    return { content, usage };
  } catch (error) {
    console.error('Text generation error:', error);
    throw error;
  }
}

// Web search enabled chat - uses :online suffix for web search
export async function generateTextWithSearch(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  model: string
): Promise<{ content: string; citations?: unknown[] }> {
  const client = await getClient();

  console.log('[API] generateTextWithSearch called:', { model, messagesCount: messages.length });

  // Prepend web search system prompt
  const hasSystemPrompt = messages.some(m => m.role === 'system');
  const messagesWithSystem = hasSystemPrompt
    ? messages
    : [{ role: 'system' as const, content: getSystemPrompt('webSearch') }, ...messages];

  try {
    // Use :online suffix for web search
    const response = await client.chat.completions.create({
      model: `${model}:online`,  // Appends web search capability
      messages: messagesWithSystem,
      temperature: 0.7,
      max_tokens: 4000,
    });

    console.log('[API] Web search response received');

    const choice = response.choices[0];
    const content = choice?.message?.content || '';
    const citations = ((choice?.message as unknown as { annotations?: unknown[] })?.annotations) ?? [];

    return { content, citations };
  } catch (error) {
    console.error('[API] Web search error:', error);
    throw error;
  }
}

// Reasoning mode enabled chat - uses extended thinking
export async function generateTextWithReasoning(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  model: string,
  effort: 'high' | 'medium' | 'low' = 'medium'
): Promise<{ content: string; reasoning?: string }> {
  const client = await getClient();

  console.log('[API] generateTextWithReasoning called:', { model, effort, messagesCount: messages.length });

  // Prepend reasoning system prompt
  const hasSystemPrompt = messages.some(m => m.role === 'system');
  const messagesWithSystem = hasSystemPrompt
    ? messages
    : [{ role: 'system' as const, content: getSystemPrompt('reasoning') }, ...messages];

  const requestBody: Record<string, unknown> = {
    model: model,
    messages: messagesWithSystem,
    extra_body: {
      reasoning: {
        effort: effort,
        exclude: false, // Include reasoning in response
      },
    },
  };

  const response = await client.chat.completions.create(
    requestBody as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
  );

  console.log('[API] Reasoning response:', response);

  const choice = response.choices[0];
  const content = choice?.message?.content || '';
  const reasoning = ((choice?.message as unknown as { reasoning?: string })?.reasoning) ?? '';

  return { content, reasoning };
}
