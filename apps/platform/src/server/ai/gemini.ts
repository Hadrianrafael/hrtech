import { logger } from '@/lib/logger';
import { AiProviderError, type AiProvider, type ChatMessage, type ChatOptions, type ChatResult } from './provider';

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
  modelVersion?: string;
}

/** Provedor Google Gemini via API REST (generateContent). */
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  constructor(
    private apiKey: string,
    readonly model: string,
    private baseUrl: string,
  ) {}

  private async request(body: unknown, attempt = 0): Promise<GeminiResponse> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': this.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(50_000),
      });
    } catch {
      throw new AiProviderError('Falha de conexão com o Gemini.', 'network', true);
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      logger.warn('ai.gemini_retry', { status: res.status, attempt });
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt + Math.random() * 250));
      return this.request(body, attempt + 1);
    }
    if (res.status === 401 || res.status === 403) throw new AiProviderError('Chave do Gemini inválida (GEMINI_API_KEY).', 'auth');
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new AiProviderError(`Gemini respondeu ${res.status}: ${text.slice(0, 200)}`, res.status === 429 ? 'rate_limit' : 'provider', res.status === 429 || res.status >= 500);
    }
    return (await res.json()) as GeminiResponse;
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    if (!contents.length) contents.push({ role: 'user', parts: [{ text: '(início da conversa)' }] });
    const json = await this.request({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        // Os modelos 2.5 "pensam" antes de responder e esse raciocínio consome a cota de saída.
        maxOutputTokens: Math.max(opts.maxTokens ?? 0, 8192),
        ...(opts.json ? { responseMimeType: 'application/json' } : {}),
      },
    });
    if (json.promptFeedback?.blockReason) throw new AiProviderError(`O Gemini bloqueou a solicitação (${json.promptFeedback.blockReason}).`, 'refusal');
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const text = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');
    const u = json.usageMetadata ?? {};
    return {
      text,
      tokensIn: u.promptTokenCount ?? 0,
      tokensOut: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
      model: json.modelVersion ?? this.model,
    };
  }
}
