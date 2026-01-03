# OpenRouter API Skill - Dumpling Cafe Implementation Guide

## Core API Configuration

### Endpoint & Authentication
```typescript
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

const headers = {
  'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': window.location.origin,  // For leaderboard ranking
  'X-Title': 'Dumpling Cafe',              // App name
};
```

### OpenAI SDK Configuration (Current Implementation)
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Dumpling Cafe',
  },
});
```

---

## Text Chat Generation

### Basic Chat Request
```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',  // Use CHAT_MODELS
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  max_tokens: 4000,
});

const content = response.choices[0]?.message?.content || '';
```

### Streaming Chat
```typescript
const stream = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content || '';
  // Append delta to UI
}
```

---

## Image Generation

### Request Format (CRITICAL)
```typescript
const response = await client.chat.completions.create({
  model: 'google/gemini-2.5-flash-image',  // Use IMAGE_MODELS
  messages: [
    { role: 'user', content: 'A cozy dumpling cafe with warm lighting' }
  ],
  // REQUIRED for image generation
  modalities: ['image', 'text'],

  // For Gemini models - image configuration
  extra_body: {
    image_config: {
      aspect_ratio: '16:9',  // 1:1, 16:9, 9:16, 4:3, 3:4, 2:3, 3:2, 4:5, 5:4, 21:9
      image_size: '1K',      // 1K (default), 2K, 4K
    }
  }
});
```

### Response Handling
```typescript
// Image data is in the response - check for images array OR content
const message = response.choices[0]?.message;

// Method 1: Check images array (newer format)
if (message?.images?.length) {
  const imageUrl = message.images[0].image_url.url;  // data:image/png;base64,...
}

// Method 2: Check content (some models return base64 in content)
if (message?.content) {
  const imageData = message.content;

  if (imageData.startsWith('http')) {
    return imageData;  // Direct URL
  }
  if (imageData.startsWith('data:image')) {
    return imageData;  // Already has prefix
  }
  // Raw base64
  return `data:image/png;base64,${imageData}`;
}
```

### Supported Aspect Ratios (Gemini)
| Ratio | Resolution |
|-------|------------|
| 1:1 | 1024x1024 (default) |
| 16:9 | 1344x768 |
| 9:16 | 768x1344 |
| 4:3, 3:4, 2:3, 3:2, 4:5, 5:4, 21:9 | Various |

---

## Vision / Image Input

### Sending Images to Models
```typescript
const response = await client.chat.completions.create({
  model: 'google/gemini-3-pro',  // Vision-capable model
  messages: [
    {
      role: 'user',
      content: [
        // Text first (recommended order)
        { type: 'text', text: 'Describe this image' },
        // Then image
        {
          type: 'image_url',
          image_url: {
            url: 'data:image/png;base64,{base64_string}'  // OR direct URL
          }
        }
      ]
    }
  ]
});
```

### Supported Image Formats
- image/png
- image/jpeg
- image/webp
- image/gif

---

## Web Search

### Method 1: Model Suffix (Simple)
```typescript
const response = await client.chat.completions.create({
  model: 'openai/gpt-4o:online',  // Append :online to any model
  messages: [
    { role: 'user', content: 'What happened in tech news today?' }
  ]
});
```

### Method 2: Plugin Configuration (Advanced)
```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [...],
  extra_body: {
    plugins: [
      {
        id: 'web',
        engine: 'native',      // 'native', 'exa', or undefined
        max_results: 5,        // Default: 5
        search_prompt: 'Find recent articles about...'
      }
    ],
    web_search_options: {
      search_context_size: 'medium'  // 'low', 'medium', 'high'
    }
  }
});

// Response includes annotations
const annotations = response.choices[0]?.message?.annotations;
// [{
//   type: 'url_citation',
//   url_citation: { url, title, content, start_index, end_index }
// }]
```

### Web Search Pricing
- **Exa engine**: $4 per 1000 results (~$0.02 per request at 5 results)
- **Native engine**: Provider pass-through pricing

---

## Reasoning Tokens (Extended Thinking)

### Enable Reasoning
```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [...],
  extra_body: {
    reasoning: {
      // OpenAI-style effort levels
      effort: 'high',  // 'xhigh', 'high', 'medium', 'low', 'minimal', 'none'

      // OR Anthropic/Gemini style - explicit token budget
      max_tokens: 16000,  // 1024 to 32000 for Anthropic

      // Optional: Hide reasoning from response
      exclude: false,
    }
  }
});

// Reasoning appears in response
const reasoning = response.choices[0]?.message?.reasoning;
const reasoningDetails = response.choices[0]?.message?.reasoning_details;
```

### Effort Level Token Allocation
| Level | % of max_tokens |
|-------|-----------------|
| xhigh | ~95% |
| high | ~80% |
| medium | ~50% |
| low | ~20% |
| minimal | ~10% |
| none | 0 (disabled) |

### Thinking Model Variant (Shortcut)
```typescript
// Append :thinking to model ID
{ model: 'deepseek/deepseek-r1:thinking' }
```

---

## Tool Calling / Function Calling

### Define Tools
```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name, e.g. "San Francisco, CA"'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit']
          }
        },
        required: ['location']
      }
    }
  }
];
```

### Request with Tools
```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  tools: tools,
  tool_choice: 'auto',  // 'auto', 'none', or { type: 'function', function: { name: '...' } }
  parallel_tool_calls: true,  // Allow multiple simultaneous calls
});

// Check if model wants to call tools
if (response.choices[0].finish_reason === 'tool_calls') {
  const toolCalls = response.choices[0].message.tool_calls;

  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;
    const parsedArgs = JSON.parse(args);

    // Execute tool locally
    const result = await executeLocalFunction(name, parsedArgs);

    // Send result back
    messages.push(response.choices[0].message);
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(result)
    });
  }

  // Get final response
  const finalResponse = await client.chat.completions.create({
    model: 'anthropic/claude-sonnet-4.5',
    messages: messages,
    tools: tools,
  });
}
```

---

## Structured Outputs (JSON Schema)

### Request Format
```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'Extract info from: John Doe, 30 years old' }],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'person_info',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name' },
          age: { type: 'number', description: 'Age in years' }
        },
        required: ['name', 'age'],
        additionalProperties: false
      }
    }
  },
  // Optional: Auto-fix malformed JSON
  extra_body: {
    plugins: [{ id: 'response-healing' }]
  }
});

const parsed = JSON.parse(response.choices[0].message.content);
```

---

## Provider Selection & Routing

### Specify Provider Order
```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [...],
  extra_body: {
    provider: {
      order: ['anthropic', 'aws-bedrock'],  // Priority sequence
      allow_fallbacks: true,  // Fallback to others if all fail

      // Filtering
      only: ['anthropic', 'google'],  // Allowlist
      ignore: ['azure'],               // Blocklist

      // Sorting (disables load balancing)
      sort: 'price',  // 'price', 'throughput', 'latency'

      // Privacy
      data_collection: 'deny',  // Only privacy-compliant providers
      zdr: true,                // Zero Data Retention only

      // Parameter compatibility
      require_parameters: true  // Only providers supporting all params
    }
  }
});
```

### Provider Shortcuts
```typescript
// Throughput priority
{ model: 'anthropic/claude-sonnet-4.5:nitro' }

// Price priority
{ model: 'anthropic/claude-sonnet-4.5:floor' }
```

---

## Model Fallbacks

### Multiple Models
```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',  // Primary
  messages: [...],
  extra_body: {
    models: [
      'anthropic/claude-sonnet-4.5',
      'google/gemini-3-pro',
      'openai/gpt-5.2'
    ]  // Fallback sequence
  }
});

// Check which model was used
const usedModel = response.model;
```

---

## Auto Router (Automatic Model Selection)

```typescript
const response = await client.chat.completions.create({
  model: 'openrouter/auto',  // Let OpenRouter choose
  messages: [...],
});

// Response includes which model was selected
const selectedModel = response.model;
```

---

## Prompt Caching

### Anthropic Manual Caching
```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: 'You are an expert on this 50,000 word document: ...',
          cache_control: {
            type: 'ephemeral',
            ttl: '1h'  // Optional: '5m' (default) or '1h'
          }
        }
      ]
    },
    { role: 'user', content: 'Summarize section 3' }
  ]
});
```

### Automatic Caching (No Config Needed)
- OpenAI (1024+ tokens)
- Grok, Moonshot AI, Groq, DeepSeek
- Google Gemini 2.5+

---

## PDF / Audio / Video Input

### PDF Handling
```typescript
const response = await client.chat.completions.create({
  model: 'google/gemini-3-pro',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Summarize this document' },
        {
          type: 'file',
          file: {
            filename: 'document.pdf',
            file_data: 'data:application/pdf;base64,{base64_string}'  // OR URL
          }
        }
      ]
    }
  ],
  extra_body: {
    plugins: [
      { id: 'pdf', engine: 'mistral-ocr' }  // 'mistral-ocr', 'pdf-text', 'native'
    ]
  }
});
```

### Audio Input (Base64 Required)
```typescript
{
  type: 'input_audio',
  input_audio: {
    data: '{base64_audio_string}',
    format: 'mp3'  // wav, mp3, aiff, aac, ogg, flac, m4a, pcm16, pcm24
  }
}
```

### Video Input
```typescript
{
  type: 'video_url',
  video_url: {
    url: 'https://example.com/video.mp4'  // OR data:video/mp4;base64,...
  }
}
// Supported: video/mp4, video/mpeg, video/mov, video/webm
```

---

## Presets (Saved Configurations)

### Create Preset in Dashboard
1. Go to openrouter.ai/settings/presets
2. Configure model, system prompt, temperature, etc.
3. Save as "email-writer"

### Use Preset in Code
```typescript
// Method 1: Direct reference
{ model: '@preset/email-writer' }

// Method 2: Model + preset
{ model: 'openai/gpt-4o', preset: 'email-writer' }

// Method 3: Combined
{ model: 'openai/gpt-4o@preset/email-writer' }
```

---

## Response Healing Plugin

```typescript
const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [...],
  response_format: { type: 'json_object' },
  extra_body: {
    plugins: [{ id: 'response-healing' }]
  }
});
// Automatically fixes: missing brackets, markdown wrapping, trailing commas, unquoted keys
```

---

## Complete API Request Example

```typescript
interface OpenRouterRequest {
  // Required
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | Array<ContentPart>;
    name?: string;
    tool_call_id?: string;
  }>;

  // Generation params
  temperature?: number;       // 0-2, default varies by model
  max_tokens?: number;        // Max output tokens
  top_p?: number;             // Nucleus sampling
  top_k?: number;             // Top-k sampling
  frequency_penalty?: number; // -2 to 2
  presence_penalty?: number;  // -2 to 2
  repetition_penalty?: number;
  stop?: string | string[];   // Stop sequences
  seed?: number;              // For reproducibility

  // Streaming
  stream?: boolean;

  // Tools
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | { type: 'function', function: { name: string } };
  parallel_tool_calls?: boolean;

  // Output format
  response_format?: {
    type: 'json_object' | 'json_schema' | 'text';
    json_schema?: { name: string; strict: boolean; schema: object };
  };

  // Multimodal (image generation)
  modalities?: ('text' | 'image')[];

  // OpenRouter-specific (via extra_body)
  models?: string[];           // Fallback models
  provider?: ProviderConfig;   // Provider selection
  plugins?: Plugin[];          // Web search, response-healing, pdf
  reasoning?: ReasoningConfig; // Extended thinking
  image_config?: ImageConfig;  // For Gemini image gen
  preset?: string;             // Saved configuration
}
```

---

## Dumpling Cafe Implementation Checklist

### Bug #1: Chat vs Image Mode
- [x] Add mode toggle state: `'chat' | 'image'`
- [x] Import both `CHAT_MODELS` and `IMAGE_MODELS`
- [x] Show correct model selector based on mode
- [x] For chat mode: Use `generateText()` without `modalities`
- [x] For image mode: Use `generateImage()` with `modalities: ['image', 'text']`

### Bug #2: Image Generation Not Working
- [x] Verify `modalities: ['image', 'text']` is included
- [x] Add `image_config` for Gemini models
- [x] Handle both `images` array and `content` response formats
- [x] Add console.log debugging at each step

### Bug #3: White Background on Images
- [x] Use `bg-transparent` or CSS variable backgrounds
- [x] Check canvas `clearRect` before drawing
- [x] Verify image load completes before display

### Web Search Integration
- [ ] Add `:online` suffix option to chat models
- [ ] OR implement web plugin configuration
- [ ] Display citation annotations in UI

### Reasoning Mode
- [ ] Add reasoning toggle for supported models
- [ ] Configure effort level selector
- [ ] Display reasoning in expandable section

### Error Handling
- [ ] Check `response.choices[0]` exists
- [ ] Handle rate limits with retry logic
- [ ] Display user-friendly error messages
- [ ] Log errors for debugging

---

## Model Capabilities Reference

### Chat Models with Web Search
Append `:online` to any model for web search.

### Chat Models with Reasoning
- `anthropic/claude-sonnet-4.5` (effort or max_tokens)
- `deepseek/deepseek-r1:thinking` (variant)
- `openai/gpt-5.2` (effort levels)
- `google/gemini-3-pro` (max_tokens)

### Image Generation Models
Must include `modalities: ['image', 'text']`:
- `google/gemini-2.5-flash-image` (supports image_config)
- `google/gemini-3-pro-image-preview` (supports image_config)
- `black-forest-labs/flux.2-max`
- `black-forest-labs/flux.2-flex`
- `bytedance-seed/seedream-4.5`

### Vision Models (Image Input)
- `google/gemini-3-pro`
- `anthropic/claude-sonnet-4.5`
- `openai/gpt-5.2`
- Most models with `vision` in capabilities

---

## Debugging Checklist

```typescript
// Add to api.ts for debugging
console.log('Request:', {
  model,
  messagesCount: messages.length,
  hasModalities: !!request.modalities,
  hasImageConfig: !!request.extra_body?.image_config
});

console.log('Response:', {
  hasChoices: response.choices?.length > 0,
  finishReason: response.choices?.[0]?.finish_reason,
  hasContent: !!response.choices?.[0]?.message?.content,
  hasImages: !!response.choices?.[0]?.message?.images,
  model: response.model
});
```
