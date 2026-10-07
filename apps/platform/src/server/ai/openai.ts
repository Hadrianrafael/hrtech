import { logger } from '@/lib/logger';
import type { AiProvider, ChatMessage, ChatOptions, ChatResult } from './provider';

/**
 * Provedor OpenAI via API REST (Chat Completions + Embeddings).
 * Compatível com endpoints OpenAI-compatíveis via OPENAI_BASE_URL (ex.: Azure OpenAI com proxy).
 */
export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';
  constructor(
    private apiKey: string,
    readonly model: string,
    private embeddingModel: string,
    private baseUrl: string,
  ) {}

  private async request<T>(path: string, body: unknown, attempt = 0): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      const wait = 500 * 2 ** attempt + Math.random() * 250;
      logger.warn('ai.openai_retry', { status: res.status, attempt });
      await new Promise((r) => setTimeout(r, wait));
      return this.request<T>(path, body, attempt + 1);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI respondeu ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const json = await this.request<{
      choices: { message: { content: string | null } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
      model: string;
    }>('/chat/completions', {
      model: this.model,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 700,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    });
    return {
      text: json.choices[0]?.message.content ?? '',
      tokensIn: json.usage?.prompt_tokens ?? 0,
      tokensOut: json.usage?.completion_tokens ?? 0,
      model: json.model ?? this.model,
    };
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += 64) {
      const batch = texts.slice(i, i + 64);
      const json = await this.request<{ data: { embedding: number[]; index: number }[] }>('/embeddings', { model: this.embeddingModel, input: batch });
      for (const d of json.data.sort((a, b) => a.index - b.index)) out.push(d.embedding);
    }
    return out;
  }
}
