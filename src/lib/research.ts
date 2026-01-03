import { generateText } from './api';

// Pricing constants (per 1M tokens)
const PRICING = {
  'anthropic/claude-sonnet-4.5': { input: 3.00, output: 15.00 },
  'x-ai/grok-4.1-fast': { input: 0.20, output: 0.50 },
  'deepseek/deepseek-v3.2': { input: 0.28, output: 0.48 },
};

export interface AgentResult {
  content: string;
  cost: number;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

function calculateCost(model: string, usage?: { prompt_tokens: number; completion_tokens: number }): number {
  if (!usage) return 0;
  const price = PRICING[model as keyof typeof PRICING];
  if (!price) return 0;
  return (usage.prompt_tokens * price.input + usage.completion_tokens * price.output) / 1_000_000;
}

export async function runPlannerAgent(topic: string): Promise<AgentResult> {
  const model = 'anthropic/claude-sonnet-4.5';
  const prompt = `You are a Research Planner. Your goal is to break down the research topic "${topic}" into 3-5 distinct, logical sub-topics or sections for a comprehensive report.
  
  Return ONLY a JSON array of strings, where each string is a sub-topic. Do not include any other text.
  Example: ["Market Overview", "Key Competitors", "Future Trends"]`;

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.2
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

export async function runResearcherAgent(subtopic: string): Promise<AgentResult> {
  const model = 'x-ai/grok-4.1-fast';
  const prompt = `You are a Research Agent with access to real-time information. Research the following sub-topic in depth: "${subtopic}".
  
  Provide a detailed set of notes, facts, and key findings. Include specific data points, dates, and names where possible.
  If you find specific sources, list them at the end.
  
  Format your response as bullet points and short paragraphs.`;

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.5
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

export async function runWriterAgent(section: string, notes: string, feedback?: string): Promise<AgentResult> {
  const model = 'anthropic/claude-sonnet-4.5';
  let prompt = `You are a Technical Writer. Write a comprehensive section for the topic: "${section}".
  
  Use the following research notes as your primary source material:
  ${notes}
  
  Write in a professional, engaging tone. Use Markdown formatting (headers, bold, lists).`;

  if (feedback) {
    prompt += `\n\nIMPORTANT: Previous draft received this feedback. Please revise accordingly:\n${feedback}`;
  }

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.7
  );

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage
  };
}

export async function runCriticAgent(draft: string): Promise<AgentResult & { score: number; passed: boolean }> {
  const model = 'deepseek/deepseek-v3.2';
  const prompt = `You are a Critical Editor. Review the following draft section for clarity, accuracy, flow, and completeness.
  
  Draft:
  ${draft}
  
  Evaluate it on a scale of 1-10.
  If the score is 8 or higher, return "PASSED".
  If the score is below 8, provide specific, actionable feedback for improvement.
  
  Format your response exactly as:
  SCORE: [number]
  VERDICT: [PASSED/FAILED]
  FEEDBACK: [Your feedback here]`;

  const result = await generateText(
    [{ role: 'user', content: prompt }],
    model,
    0.3
  );

  const content = result.content;
  const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
  const verdictMatch = content.match(/VERDICT:\s*(PASSED|FAILED)/i);
  
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  const passed = verdictMatch ? verdictMatch[1].toUpperCase() === 'PASSED' : false;

  return {
    content: result.content,
    cost: calculateCost(model, result.usage),
    usage: result.usage,
    score,
    passed
  };
}
