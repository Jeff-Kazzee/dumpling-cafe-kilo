export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  pricing: string;
  context: string;
  description: string;
  capabilities: string[];
  tier: 'free' | 'budget' | 'mid' | 'premium' | 'frontier';
}

export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  pricing: string;
  description: string;
  tier: 'budget' | 'mid' | 'premium';
}

export const CHAT_MODELS: ChatModel[] = [
  // === FREE TIER (Great for testing & budget users) ===
  {
    id: 'xiaomi/mimo-v2-flash:free',
    name: 'MiMo-V2-Flash',
    provider: 'Xiaomi',
    pricing: 'FREE',
    context: '256K',
    description: '#1 open-source on SWE-bench. Sonnet 4.5 performance at 3.5% cost.',
    capabilities: ['coding', 'reasoning', 'agentic'],
    tier: 'free',
  },
  {
    id: 'mistralai/devstral-2512:free',
    name: 'Devstral 2',
    provider: 'Mistral',
    pricing: 'FREE',
    context: '256K',
    description: '123B agentic coding specialist. Multi-file editing, bug fixing.',
    capabilities: ['coding', 'agentic', 'tool-use'],
    tier: 'free',
  },
  {
    id: 'allenai/olmo-3.1-32b-think:free',
    name: 'OLMo 3.1 32B Think',
    provider: 'Allen AI',
    pricing: 'FREE',
    context: '32K',
    description: 'Open research model with chain-of-thought reasoning.',
    capabilities: ['reasoning', 'research'],
    tier: 'free',
  },
  {
    id: 'allenai/olmo-3-32b-think:free',
    name: 'OLMo 3 32B Think',
    provider: 'Allen AI',
    pricing: 'FREE',
    context: '32K',
    description: 'Fully open reasoning model from Allen Institute.',
    capabilities: ['reasoning', 'research'],
    tier: 'free',
  },
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'Nemotron 3 Nano',
    provider: 'NVIDIA',
    pricing: 'FREE',
    context: '262K',
    description: '30B MoE (3B active). 4x faster than Nemotron 2, agentic optimized.',
    capabilities: ['coding', 'agentic', 'efficient'],
    tier: 'free',
  },
  {
    id: 'kwaipilot/kat-coder-pro:free',
    name: 'KAT Coder Pro',
    provider: 'Kuaishou',
    pricing: 'FREE',
    context: '32K',
    description: 'Code-focused model optimized for programming tasks.',
    capabilities: ['coding'],
    tier: 'free',
  },

  // === BUDGET TIER ($0.20-0.50/M tokens) ===
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    pricing: '$0.28 in / $0.48 out',
    context: '131K',
    description: 'GPT-5 class reasoning. IMO/IOI gold medals. Sparse attention.',
    capabilities: ['reasoning', 'coding', 'math', 'agentic'],
    tier: 'budget',
  },
  {
    id: 'deepseek/deepseek-v3.2-speciale',
    name: 'DeepSeek V3.2 Speciale',
    provider: 'DeepSeek',
    pricing: '$0.28 in / $0.48 out',
    context: '131K',
    description: 'Extended thinking variant for harder reasoning problems.',
    capabilities: ['reasoning', 'math', 'coding'],
    tier: 'budget',
  },
  {
    id: 'x-ai/grok-4.1-fast',
    name: 'Grok 4.1 Fast',
    provider: 'xAI',
    pricing: '$0.20 in / $0.50 out',
    context: '2M',
    description: 'Best agentic tool-calling. 2M context. Web + X search built-in.',
    capabilities: ['agentic', 'tool-use', 'search', 'reasoning'],
    tier: 'budget',
  },
  {
    id: 'minimax/minimax-m2.1',
    name: 'MiniMax M2.1',
    provider: 'MiniMax',
    pricing: '$0.30 in / $1.20 out',
    context: '200K',
    description: '10B active MoE. 74% SWE-bench. Fast, clean outputs.',
    capabilities: ['coding', 'agentic', 'multilingual'],
    tier: 'budget',
  },
  {
    id: 'bytedance-seed/seed-1.6',
    name: 'Seed 1.6 Flash',
    provider: 'ByteDance',
    pricing: '$0.20 in / $0.80 out',
    context: '256K',
    description: 'Ultra-fast multimodal thinking. Text + vision understanding.',
    capabilities: ['reasoning', 'vision', 'fast'],
    tier: 'budget',
  },
  {
    id: 'z-ai/glm-4.7',
    name: 'GLM-4.7',
    provider: 'Zhipu AI',
    pricing: '$0.30 in / $1.20 out',
    context: '128K',
    description: 'Strong math reasoning. Agent-optimized architecture.',
    capabilities: ['reasoning', 'math', 'agentic'],
    tier: 'budget',
  },

  // === MID TIER ($0.50-3/M tokens) ===
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    pricing: '$0.50 in / $3.00 out',
    context: '1M',
    description: 'Near-Pro reasoning at Flash speed. 78% SWE-bench. Default in Gemini app.',
    capabilities: ['reasoning', 'coding', 'multimodal', 'agentic'],
    tier: 'mid',
  },
  {
    id: 'moonshotai/kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'Moonshot AI',
    pricing: '$0.40 in / $2.00 out',
    context: '256K',
    description: '1T MoE (32B active). Deep interleaved reasoning. 200+ tool calls.',
    capabilities: ['reasoning', 'agentic', 'tool-use', 'coding'],
    tier: 'mid',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    pricing: '$1.00 in / $5.00 out',
    context: '200K',
    description: 'Fastest Claude. Matches Sonnet 4 at 1/3 cost. 73% SWE-bench.',
    capabilities: ['coding', 'reasoning', 'agentic', 'fast'],
    tier: 'mid',
  },
  {
    id: 'mistralai/ministral-14b-2512',
    name: 'Ministral 14B',
    provider: 'Mistral',
    pricing: '$0.10 in / $0.30 out',
    context: '128K',
    description: 'Compact, fast general-purpose model for everyday tasks.',
    capabilities: ['general', 'fast'],
    tier: 'mid',
  },
  {
    id: 'mistralai/mistral-small-creative',
    name: 'Mistral Small Creative',
    provider: 'Mistral',
    pricing: '$0.20 in / $0.60 out',
    context: '32K',
    description: 'Tuned for creative writing and storytelling.',
    capabilities: ['creative', 'writing'],
    tier: 'mid',
  },
  {
    id: 'mistralai/mistral-large-2512',
    name: 'Mistral Large',
    provider: 'Mistral',
    pricing: '$2.00 in / $6.00 out',
    context: '128K',
    description: 'Flagship Mistral. Strong reasoning and multilingual.',
    capabilities: ['reasoning', 'multilingual', 'coding'],
    tier: 'mid',
  },

  // === PREMIUM TIER ($3-15/M tokens) ===
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    pricing: '$3.00 in / $15.00 out',
    context: '1M',
    description: 'Best-in-class for agents & coding. 77% SWE-bench. Extended autonomy.',
    capabilities: ['coding', 'agentic', 'reasoning', 'tool-use'],
    tier: 'premium',
  },
  {
    id: 'google/gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    pricing: '$2.00 in / $12.00 out',
    context: '1M',
    description: 'Google flagship. Top LMArena. Multimodal mastery.',
    capabilities: ['reasoning', 'multimodal', 'coding', 'vision'],
    tier: 'premium',
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    pricing: '$5.00 in / $15.00 out',
    context: '128K',
    description: 'Latest GPT. 100% AIME 2025. Strong abstract reasoning.',
    capabilities: ['reasoning', 'math', 'coding', 'knowledge'],
    tier: 'premium',
  },

  // === FRONTIER TIER ($5-25/M tokens) ===
  {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    pricing: '$5.00 in / $25.00 out',
    context: '200K',
    description: 'Frontier reasoning. 81% SWE-bench. Multi-agent orchestration.',
    capabilities: ['reasoning', 'coding', 'agentic', 'research'],
    tier: 'frontier',
  },
];

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Nano Banana (Gemini 2.5 Flash)',
    provider: 'Google',
    pricing: '$0.30/M input, $2.50/M output',
    description: 'Fast, affordable, great for iteration',
    tier: 'budget',
  },
  {
    id: 'bytedance-seed/seedream-4.5',
    name: 'Seedream 4.5',
    provider: 'ByteDance',
    pricing: '$0.04/image flat',
    description: 'Excellent portraits and text rendering',
    tier: 'budget',
  },
  {
    id: 'black-forest-labs/flux.2-max',
    name: 'FLUX.2 Max',
    provider: 'Black Forest Labs',
    pricing: '~$0.07/image',
    description: 'Highest quality, best for final output',
    tier: 'premium',
  },
  {
    id: 'black-forest-labs/flux.2-flex',
    name: 'FLUX.2 Flex',
    provider: 'Black Forest Labs',
    pricing: '$0.06/MP',
    description: 'Best text rendering and typography. Great for edits.',
    tier: 'mid',
  },
  {
    id: 'sourceful/riverflow-v2-max-preview',
    name: 'Riverflow V2 Max',
    provider: 'Sourceful',
    pricing: '$0.075/image flat',
    description: 'Strong image-to-image editing',
    tier: 'mid',
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Nano Banana Pro (Gemini 3 Pro)',
    provider: 'Google',
    pricing: '$2/M input, $12/M output',
    description: 'Most advanced, 4K output, identity preservation',
    tier: 'premium',
  },
  {
    id: 'openai/gpt-5-image-mini',
    name: 'GPT-5 Image Mini',
    provider: 'OpenAI',
    pricing: '$2.50/M input, $2/M output',
    description: 'Great instruction following',
    tier: 'mid',
  },
];
