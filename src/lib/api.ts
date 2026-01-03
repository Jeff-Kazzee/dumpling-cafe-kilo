import OpenAI from 'openai';
import { AppSettings, storage } from './storage';

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

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      // For Gemini models, add image_config
      ...(model.includes('gemini') && {
        extra_body: {
          image_config: {
            aspect_ratio: aspectRatio,
          }
        }
      })
    });

    // Response includes base64 image in content
    const imageData = response.choices[0].message.content;
    
    if (!imageData) {
      throw new Error('No image data received');
    }

    // Parse and extract image if it's not raw base64 (some models might wrap it)
    // But per spec, we assume it's the content.
    // If it's a URL, we return it. If it's base64, we might need to prefix it if missing.
    // The spec says "Response includes base64 image in content".
    // Let's assume it's ready to use or needs data:image/png;base64 prefix if not present.
    
    // Check if it's a URL
    if (imageData.startsWith('http')) {
      return imageData;
    }
    
    // Check if it already has the prefix
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    
    // Assume base64 png
    return `data:image/png;base64,${imageData}`;

  } catch (error) {
    console.error('Generation error:', error);
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
