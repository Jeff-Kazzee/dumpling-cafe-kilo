import { generateText } from './api';
import { CHAT_MODELS } from './models';
import { getResearchPrompt } from './prompts';

// Research model configuration - user can override these
export interface ResearchModels {
  planner: string;
  researcher: string;
  writer: string;
}

// Get research-capable models from CHAT_MODELS
export function getResearchModels() {
  return CHAT_MODELS.filter(m =>
    m.capabilities.includes('reasoning') ||
    m.capabilities.includes('coding') ||
    m.capabilities.includes('agentic')
  );
}

// Default presets for quick selection
export const RESEARCH_PRESETS: Record<string, { name: string; description: string; models: ResearchModels }> = {
  fast: {
    name: 'Fast & Cheap',
    description: 'DeepSeek V3.2 - quick results, minimal cost (~$0.001/research)',
    models: {
      planner: 'deepseek/deepseek-v3.2',
      researcher: 'deepseek/deepseek-v3.2',
      writer: 'deepseek/deepseek-v3.2',
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Mix of speed and quality (~$0.01/research)',
    models: {
      planner: 'anthropic/claude-haiku-4.5',
      researcher: 'x-ai/grok-4.1-fast',
      writer: 'anthropic/claude-haiku-4.5',
    }
  },
  quality: {
    name: 'High Quality',
    description: 'Claude Sonnet - best results, slower (~$0.10/research)',
    models: {
      planner: 'anthropic/claude-sonnet-4.5',
      researcher: 'anthropic/claude-sonnet-4.5',
      writer: 'anthropic/claude-sonnet-4.5',
    }
  },
  custom: {
    name: 'Custom',
    description: 'Choose your own models',
    models: {
      planner: 'deepseek/deepseek-v3.2',
      researcher: 'deepseek/deepseek-v3.2',
      writer: 'deepseek/deepseek-v3.2',
    }
  }
};

// Pricing constants (per 1M tokens) - for cost estimation
const PRICING: Record<string, { input: number; output: number }> = {
  'deepseek/deepseek-v3.2': { input: 0.28, output: 0.48 },
  'x-ai/grok-4.1-fast': { input: 0.20, output: 0.50 },
  'anthropic/claude-haiku-4.5': { input: 1.00, output: 5.00 },
  'anthropic/claude-sonnet-4.5': { input: 3.00, output: 15.00 },
  'google/gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'openai/gpt-5.2': { input: 5.00, output: 15.00 },
};

export interface AgentResult {
  content: string;
  cost: number;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

function calculateCost(model: string, usage?: { prompt_tokens: number; completion_tokens: number }): number {
  if (!usage) return 0;
  const baseModel = model.replace(':online', '');
  const price = PRICING[baseModel];
  if (!price) return 0.001; // Default small cost if unknown
  return (usage.prompt_tokens * price.input + usage.completion_tokens * price.output) / 1_000_000;
}

// All agent functions now accept model as parameter
export async function runPlannerAgent(topic: string, model: string): Promise<AgentResult> {
  const systemPrompt = getResearchPrompt('planner');
  const userPrompt = `Research topic: "${topic}"

Break this down into 3 focused subtopics that together provide comprehensive coverage.

Return ONLY a JSON array of 3 strings. Example:
["Section 1 Title", "Section 2 Title", "Section 3 Title"]`;

  const result = await generateText(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model,
    0.2,
    500
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

export async function runResearcherAgent(subtopic: string, model: string, useWebSearch: boolean = true): Promise<AgentResult> {
  // Add :online suffix for web search if requested
  const actualModel = useWebSearch && !model.includes(':online') ? `${model}:online` : model;

  const systemPrompt = getResearchPrompt('researcher');
  const userPrompt = `Research subtopic: "${subtopic}"

Gather comprehensive information and key facts. Include:
- Specific facts, data, and statistics
- Important dates and timeline
- Key concepts and definitions
- Sources where available

Be thorough but concise.`;

  const result = await generateText(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    actualModel,
    0.5,
    1000
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

export async function runWriterAgent(section: string, notes: string, model: string, feedback?: string): Promise<AgentResult> {
  const systemPrompt = getResearchPrompt('writer');
  let userPrompt = `Section title: "${section}"

Research notes:
${notes}

Write a polished, well-structured section based on these notes.
- Keep it under 300 words
- Use markdown formatting
- Make complex topics accessible
- Ensure smooth flow and readability`;

  if (feedback) {
    userPrompt += `\n\nRevision feedback: ${feedback}`;
  }

  const result = await generateText(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model,
    0.7,
    1500
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

// Quick research - single call with web search
export async function runQuickResearch(topic: string, model: string): Promise<AgentResult> {
  // Add :online suffix for web search
  const actualModel = !model.includes(':online') ? `${model}:online` : model;

  const systemPrompt = getResearchPrompt('quick');
  const userPrompt = `Research query: "${topic}"

Provide a comprehensive quick research response including:
1. **Overview**: Brief summary (2-3 sentences)
2. **Key Facts**: Most important points (5 bullet points)
3. **Recent Developments**: Latest news or changes (if relevant)
4. **Sources**: List of references

Be factual, accurate, and cite your sources.`;

  const result = await generateText(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    actualModel,
    0.5,
    2000
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}
