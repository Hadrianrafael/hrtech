import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { AiProviderError, type AiProvider, type ChatMessage, type ChatOptions, type ChatResult } from './provider';

/** Modelos com `output_config.effort` (Haiku 4.5 e modelos 4.5 antigos rejeitam o parâmetro). */
function supportsEffort(model: string) {
  return /^claude-(fable|mythos|opus-5|opus-4-[678]|sonnet-5|sonnet-4-6)/.test(model);
}

/** Modelos que aceitam o fallback de recusa no servidor na forma `fallbacks: "default"`. */
function supportsDefaultFallback(model: string) {
  return /^claude-(fable-5-1|opus-5-5|opus-5$|sonnet-5-5)/.test(model);
}

/**
 * Provedor Anthropic (Claude) usando o SDK oficial `@anthropic-ai/sdk`.
 *
 *  - Padrão `claude-opus-5-5`; o modelo é configurável por agente.
 *  - Esforço explícito (`output_config.effort`): o padrão do Opus 5.5 é `medium`, e respostas de chat usam `low`.
 *  - Sem `temperature`: os modelos atuais rejeitam parâmetros de amostragem.
 *  - Fallback de recusa no servidor (`fallbacks: "default"`) habilitado por padrão nos modelos que o suportam;
 *    uma recusa que persiste vira erro tratável (a tarefa falha com mensagem clara, sem texto parcial).
 *  - Sem embeddings: o RAG usa busca por palavras-chave quando a Anthropic é o provedor padrão.
 */
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private client: Anthropic;

  constructor(
    apiKey: string,
    readonly model: string,
    baseUrl?: string,
  ) {
    this.client = new Anthropic({ apiKey, baseURL: baseUrl, maxRetries: 2, timeout: 120_000 });
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const turns: Anthropic.Beta.BetaMessageParam[] = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    // A API exige que a conversa comece pelo usuário e não aceita "prefill" (última mensagem do assistente).
    if (!turns.length || turns[0]!.role !== 'user') turns.unshift({ role: 'user', content: '(início da conversa)' });
    if (turns.at(-1)!.role !== 'user') turns.push({ role: 'user', content: 'Continue.' });
    if (opts.json) {
      turns.push({ role: 'user', content: 'Responda somente com um objeto JSON válido, sem texto antes ou depois.' });
    }

    const fallback = supportsDefaultFallback(this.model);
    try {
      const response = await this.client.beta.messages.create({
        model: this.model,
        // Teto de saída (não é meta de tamanho): o raciocínio interno também consome tokens de saída.
        max_tokens: Math.max(opts.maxTokens ?? 0, 16_000),
        ...(system ? { system } : {}),
        messages: turns,
        ...(supportsEffort(this.model) ? { output_config: { effort: opts.effort ?? 'medium' } } : {}),
        ...(fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      });
      if (response.stop_reason === 'refusal') {
        throw new AiProviderError('O modelo recusou a solicitação (política de uso). Reformule a tarefa ou use outro modelo.', 'refusal');
      }
      const text = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      const u = response.usage;
      return {
        text,
        tokensIn: (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0),
        tokensOut: u.output_tokens ?? 0,
        model: response.model ?? this.model,
      };
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      if (err instanceof Anthropic.AuthenticationError) throw new AiProviderError('Chave da Anthropic inválida (ANTHROPIC_API_KEY).', 'auth');
      if (err instanceof Anthropic.RateLimitError) throw new AiProviderError('Limite de uso da Anthropic atingido; nova tentativa mais tarde.', 'rate_limit', true);
      if (err instanceof Anthropic.BadRequestError) throw new AiProviderError(`Requisição recusada pela Anthropic: ${err.message.slice(0, 200)}`, 'bad_request');
      if (err instanceof Anthropic.APIConnectionError) throw new AiProviderError('Falha de conexão com a Anthropic.', 'network', true);
      if (err instanceof Anthropic.APIError) {
        logger.warn('ai.anthropic_error', { status: err.status });
        throw new AiProviderError(`Anthropic respondeu ${err.status ?? 'erro'}.`, 'provider', (err.status ?? 500) >= 500);
      }
      throw err;
    }
  }
}
