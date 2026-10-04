import { env } from '@/lib/env';
import { OpenAIProvider } from './openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

/**
 * Contrato de provedor de IA. Para adicionar outro provedor (Azure OpenAI, Anthropic, Gemini...),
 * implemente esta interface e registre-o em `getAiProvider`.
 */
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
  /** Opcional: provedores sem embeddings usam busca por palavras-chave no RAG. */
  embed?(texts: string[]): Promise<number[][]>;
}

let override: AiProvider | null | undefined;

/** Somente para testes. */
export function setAiProviderForTests(p: AiProvider | null | undefined) {
  override = p;
}

export function getAiProvider(): AiProvider | null {
  if (override !== undefined) return override;
  switch (env.aiProvider()) {
    case 'openai': {
      const key = env.openaiKey();
      return key ? new OpenAIProvider(key, env.openaiModel(), env.openaiEmbeddingModel(), env.openaiBaseUrl()) : null;
    }
    default:
      return null;
  }
}

export function isAiConfigured() {
  return getAiProvider() !== null;
}
