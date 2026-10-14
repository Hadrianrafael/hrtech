import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { absoluteUrl } from '@/lib/paths';

export const dynamic = 'force-static';

/**
 * Política de rastreamento: todo o site é público e liberado.
 *
 * Os grupos nomeados abaixo apenas documentam a intenção para rastreadores de busca e de
 * assistentes de IA com user-agent documentado pelos próprios fornecedores:
 *   - Google: Googlebot (também alimenta os AI Overviews);
 *   - Bing: Bingbot (usado por assistentes que se apoiam no Bing);
 *   - OpenAI: OAI-SearchBot (busca do ChatGPT) e ChatGPT-User (acesso pedido pelo usuário);
 *   - Anthropic: Claude-SearchBot e Claude-User;
 *   - Perplexity: PerplexityBot e Perplexity-User.
 *
 * Rastreadores de *treinamento* de modelos (GPTBot, ClaudeBot, Google-Extended, CCBot…) ficam
 * sob a regra `*` (permitidos). Para bloqueá-los, acrescente grupos `disallow: '/'` aqui —
 * isso não afeta a busca nem a presença nas respostas dos assistentes.
 */
const searchAndAssistantCrawlers = [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...searchAndAssistantCrawlers.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: absoluteUrl(siteConfig.url, '/sitemap.xml'),
  };
}
