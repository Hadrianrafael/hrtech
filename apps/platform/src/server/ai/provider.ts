import { env } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  /** Profundidade de raciocínio (usado pelos provedores que suportam; ignorado pelos demais). */
  effort?: 'low' | 'medium' | 'high';
}

export interface ChatResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

/**
 * Contrato de provedor de IA. Provedores disponíveis: OpenAI, Anthropic (Claude) e Google Gemini.
 * Para adicionar outro, implemente esta interface e registre-o em `createProvider`.
 */
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
  /** Opcional: provedores sem embeddings usam busca por palavras-chave no RAG. */
  embed?(texts: string[]): Promise<number[][]>;
}

/** Erro de provedor de IA com classificação (retryable = vale tentar de novo mais tarde). */
export class AiProviderError extends AppError {
  constructor(
    message: string,
    public kind: 'auth' | 'rate_limit' | 'network' | 'refusal' | 'bad_request' | 'provider',
    public retryable = false,
  ) {
    super(message, 'AI_PROVIDER_ERROR', 502);
  }
}

export const PROVIDERS = {
  openai: { label: 'OpenAI', envKey: 'OPENAI_API_KEY', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'] },
  anthropic: { label: 'Anthropic (Claude)', envKey: 'ANTHROPIC_API_KEY', models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5', 'claude-fable-5-1'] },
  gemini: { label: 'Google Gemini', envKey: 'GEMINI_API_KEY', models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'] },
} as const;

export type ProviderName = keyof typeof PROVIDERS;

export function isProviderName(v: unknown): v is ProviderName {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(PROVIDERS, v);
}

export function defaultModel(name: ProviderName): string {
  switch (name) {
    case 'openai':
      return env.openaiModel();
    case 'anthropic':
      return env.anthropicModel();
    case 'gemini':
      return env.geminiModel();
  }
}

export function isProviderConfigured(name: ProviderName): boolean {
  switch (name) {
    case 'openai':
      return !!env.openaiKey();
    case 'anthropic':
      return !!env.anthropicKey();
    case 'gemini':
      return !!env.geminiKey();
  }
}

/** Situação de cada provedor (para a tela de configuração: configurado ou PENDENTE DE CREDENCIAL). */
export function providerStatus() {
  return (Object.keys(PROVIDERS) as ProviderName[]).map((name) => ({
    name,
    label: PROVIDERS[name].label,
    envKey: PROVIDERS[name].envKey,
    configured: isProviderConfigured(name),
    defaultModel: defaultModel(name),
    models: PROVIDERS[name].models as readonly string[],
  }));
}

function createProvider(name: ProviderName, model?: string | null): AiProvider | null {
  switch (name) {
    case 'openai': {
      const key = env.openaiKey();
      return key ? new OpenAIProvider(key, model || env.openaiModel(), env.openaiEmbeddingModel(), env.openaiBaseUrl()) : null;
    }
    case 'anthropic': {
      const key = env.anthropicKey();
      return key ? new AnthropicProvider(key, model || env.anthropicModel(), env.anthropicBaseUrl()) : null;
    }
    case 'gemini': {
      const key = env.geminiKey();
      return key ? new GeminiProvider(key, model || env.geminiModel(), env.geminiBaseUrl()) : null;
    }
  }
}

let override: AiProvider | null | undefined;

/** Somente para testes: substitui todos os provedores. */
export function setAiProviderForTests(p: AiProvider | null | undefined) {
  override = p;
}

/** Provedor padrão do ambiente (AI_PROVIDER), usado pelo chatbot e quando o agente está em "auto". */
export function getAiProvider(): AiProvider | null {
  if (override !== undefined) return override;
  const name = env.aiProvider();
  return isProviderName(name) ? createProvider(name) : null;
}

/** Provedor de um agente (um modelo por agente). "auto" usa o padrão do ambiente. */
export function getProviderFor(name: string | null | undefined, model?: string | null): AiProvider | null {
  if (override !== undefined) return override;
  if (!name || name === 'auto') {
    const def = env.aiProvider();
    return isProviderName(def) ? createProvider(def, model) : null;
  }
  return isProviderName(name) ? createProvider(name, model) : null;
}

export function isAiConfigured() {
  return getAiProvider() !== null;
}
