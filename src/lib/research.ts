import { generateText } from './api';

// Use FREE models for speed and cost
const MODELS = {
  planner: 'deepseek/deepseek-v3.2',      // Fast, cheap, good at structured output
  researcher: 'deepseek/deepseek-v3.2:online',  // With web search!
  writer: 'deepseek/deepseek-v3.2',       // Fast writer
  critic: 'deepseek/deepseek-v3.2',       // Fast critic
};

// Pricing constants (per 1M tokens)
const PRICING: Record<string, { input: number; output: number }> = {
  'deepseek/deepseek-v3.2': { input: 0.28, output: 0.48 },
  'deepseek/deepseek-v3.2:online': { input: 0.28, output: 0.48 },
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
  if (!price) return 0;
  return (usage.prompt_tokens * price.input + usage.completion_tokens * price.output) / 1_000_000;
}

export async function runPlannerAgent(topic: string): Promise<AgentResult> {
  const model = MODELS.planner;
  const prompt = `Break down "${topic}" into exactly 3 research sections.

Return ONLY a JSON array of 3 strings. Example:
["Section 1 Title", "Section 2 Title", "Section 3 Title"]

No other text.`;

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.2,
    500  // Limit tokens
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

export async function runResearcherAgent(subtopic: string): Promise<AgentResult> {
  const model = MODELS.researcher;  // Has :online for web search
  const prompt = `Research "${subtopic}" and provide key facts and findings.

Be concise - 3-5 bullet points with specific facts, dates, or numbers.
Include sources if available.`;

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.5,
    1000  // Limit tokens
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

export async function runWriterAgent(section: string, notes: string, feedback?: string): Promise<AgentResult> {
  const model = MODELS.writer;
  let prompt = `Write a brief section about "${section}" using these notes:

${notes}

Keep it under 300 words. Use markdown formatting.`;

  if (feedback) {
    prompt += `\n\nRevise based on: ${feedback}`;
  }

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.7,
    1500  // Limit tokens
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

export async function runCriticAgent(draft: string): Promise<AgentResult & { score: number; passed: boolean }> {
  const model = MODELS.critic;
  const prompt = `Rate this draft 1-10 and say PASSED (8+) or FAILED.

Draft:
${draft.slice(0, 1500)}

Reply in exactly this format:
SCORE: [number]
VERDICT: PASSED or FAILED
FEEDBACK: [one sentence]`;

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.3,
    200  // Very short response needed
  );

  const content = result.content;
  const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
  const verdictMatch = content.match(/VERDICT:\s*(PASSED|FAILED)/i);

  // Default to passed to avoid infinite loops
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 8;
  const passed = verdictMatch ? verdictMatch[1].toUpperCase() === 'PASSED' : true;

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage,
    score,
    passed
  };
}

// Simple single-call research for fast results
export async function runQuickResearch(topic: string): Promise<AgentResult> {
  const model = 'deepseek/deepseek-v3.2:online';
  const prompt = `Research "${topic}" comprehensively.

Provide:
1. Overview (2-3 sentences)
2. Key Facts (5 bullet points)
3. Recent Developments (if any)
4. Sources

Be factual and concise.`;

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.5,
    2000
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}
