/**
 * Playbooks do CEO: planos determinísticos para os comandos mais comuns. Funcionam sem nenhum provedor de IA
 * (usando apenas as ferramentas e os dados reais) e servem de sugestão de plano quando há IA configurada.
 */
import { formatMoney } from '@/lib/utils';
import type { AgentKey } from './constants';
import type { PlaybookStep } from './tasks';

export type PlaybookKey = 'prospeccao' | 'meta_vendas' | 'followups' | 'pipeline' | 'prioridades' | 'analise_empresa' | 'geral';

export const PLAYBOOK_LABELS: Record<PlaybookKey, string> = {
  prospeccao: 'Prospecção',
  meta_vendas: 'Meta de vendas',
  followups: 'Follow-ups',
  pipeline: 'Análise do funil',
  prioridades: 'Prioridades',
  analise_empresa: 'Análise da empresa',
  geral: 'Visão geral',
};

export interface DetectedPlaybook {
  key: PlaybookKey;
  params: Record<string, string | number | null>;
}

const NUMBER_WORDS: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, vinte: 20, trinta: 30, cinquenta: 50, cem: 100 };

function toNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (Number.isFinite(n)) return n;
  return NUMBER_WORDS[raw.toLowerCase()] ?? null;
}

const NUM = '(\\d{1,4}|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|vinte|trinta|cinquenta|cem)';

/** Identifica o playbook a partir do comando em português (heurística; a IA, quando configurada, refina o plano). */
export function detectPlaybook(command: string): DetectedPlaybook {
  const text = command.trim().replace(/\s+/g, ' ');
  const lower = text.toLowerCase();

  const prospect = new RegExp(`prospect\\w*\\s+(?:de\\s+)?${NUM}?\\s*([a-zà-ú][a-zà-ú\\s-]{2,60}?)(?:\\s+(?:em|no|na|de|da|do)\\s+([a-zà-ú][a-zà-ú\\s.'-]{1,60}?))?(?:[,./]\\s*([a-z]{2}))?\\s*[.!?]?$`, 'i').exec(text);
  if (prospect || /\bprospec/.test(lower)) {
    const quantity = Math.min(Math.max(toNumber(prospect?.[1]) ?? 20, 1), 100);
    const segment = (prospect?.[2] ?? '').trim() || 'pousadas e hotéis';
    return { key: 'prospeccao', params: { quantity, segment, city: prospect?.[3]?.trim() ?? null, state: prospect?.[4]?.toUpperCase() ?? null } };
  }

  const goal = new RegExp(`${NUM}\\s+(?:novos?\\s+)?(clientes?|vendas?|contratos?)`, 'i').exec(text);
  if (goal && /(m[eê]s|semana|trimestre|ano|quero|meta|preciso|fechar|conquistar)/i.test(lower)) {
    const target = Math.min(Math.max(toNumber(goal[1]) ?? 1, 1), 1000);
    const period = /semana/.test(lower) ? 'semana' : /trimestre/.test(lower) ? 'trimestre' : 'mês';
    return { key: 'meta_vendas', params: { target, period } };
  }
  if (/follow[- ]?ups?|retorno|sem resposta|precisam? de contato|esquecid|parad[oa]s? sem/i.test(lower)) return { key: 'followups', params: {} };
  if (/pipeline|funil|oportunidades/i.test(lower)) return { key: 'pipeline', params: {} };
  if (/prioridad|priorizar|organiz/i.test(lower)) return { key: 'prioridades', params: {} };
  if (/analis|an[aá]lise|como est[aá]|resumo|vis[aã]o geral|diagn[oó]stico|minha empresa|hoje/i.test(lower)) return { key: 'analise_empresa', params: {} };
  return { key: 'geral', params: {} };
}

/** Passos de leitura executados pelo próprio CEO para embasar o plano. */
export function ceoReadSteps(key: PlaybookKey): PlaybookStep[] {
  switch (key) {
    case 'analise_empresa':
      return [
        { tool: 'company.overview', args: {} },
        { tool: 'pipeline.summary', args: {} },
        { tool: 'leads.needing_followup', args: { days: 3, limit: 10 } },
        { tool: 'conversations.waiting', args: { limit: 8 } },
        { tool: 'tasks.list', args: { scope: 'overdue', limit: 10 } },
        { tool: 'calendar.upcoming', args: { days: 7 } },
        { tool: 'approvals.pending', args: {} },
        { tool: 'finance.overview', args: {} },
      ];
    case 'followups':
      return [{ tool: 'leads.needing_followup', args: { days: 3, limit: 20 } }];
    case 'pipeline':
      return [
        { tool: 'pipeline.summary', args: { staleDays: 14 } },
        { tool: 'analytics.conversion', args: {} },
      ];
    case 'prioridades':
      return [
        { tool: 'tasks.list', args: { scope: 'overdue', limit: 15 } },
        { tool: 'tasks.list', args: { scope: 'today', limit: 15 } },
        { tool: 'conversations.waiting', args: { limit: 10 } },
        { tool: 'pipeline.summary', args: { staleDays: 14 } },
        { tool: 'approvals.pending', args: {} },
      ];
    case 'meta_vendas':
      return [
        { tool: 'analytics.conversion', args: {} },
        { tool: 'pipeline.summary', args: { staleDays: 14 } },
      ];
    case 'prospeccao':
      return [{ tool: 'memory.search', args: { query: 'perfil de cliente ideal prospecção segmento', limit: 6 } }];
    case 'geral':
      return [
        { tool: 'company.overview', args: {} },
        { tool: 'team.status', args: {} },
      ];
  }
}

export interface Delegation {
  agentKey: Exclude<AgentKey, 'ceo'>;
  title: string;
  instructions: string;
  priority: number;
  afterPrevious?: boolean;
  steps: PlaybookStep[];
}

type Data = Record<string, unknown>;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const pct = (v: unknown) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : '—');

function prospectMessage(segment: string) {
  return `Olá! Tudo bem? Aqui é da equipe comercial. Trabalhamos com ${segment} e ajudamos a centralizar o atendimento (WhatsApp, Instagram, e-mail e site) com CRM e IA, para não perder nenhuma reserva ou oportunidade. Posso te mostrar em 15 minutos como funcionaria para vocês?`;
}

/** Delegações do playbook (algumas dependem dos dados lidos pelo CEO). */
export function buildDelegations(p: DetectedPlaybook, data: Record<string, Data>): { delegations: Delegation[]; planNotes: string[] } {
  const notes: string[] = [];
  switch (p.key) {
    case 'prospeccao': {
      const quantity = num(p.params.quantity) || 20;
      const segment = String(p.params.segment ?? 'pousadas e hotéis');
      const where = [p.params.city, p.params.state].filter(Boolean).join('/');
      notes.push(`Buscar ${quantity} ${segment}${where ? ` em ${where}` : ''} (fontes oficiais via n8n), importar como leads sem duplicar e preparar a abordagem.`);
      return {
        planNotes: notes,
        delegations: [
          {
            agentKey: 'prospeccao',
            title: `Prospectar ${quantity} ${segment}${where ? ` em ${where}` : ''}`,
            instructions: `Buscar ${quantity} empresas do segmento "${segment}"${where ? ` em ${where}` : ''} e importá-las como leads (etiqueta "Prospecção IA").`,
            priority: 7,
            steps: [
              { tool: 'n8n.prospect_search', args: { segment, quantity, ...(p.params.city ? { city: p.params.city } : {}), ...(p.params.state ? { state: p.params.state } : {}) } },
              { tool: 'leads.import_prospects', args: { dispatchId: '$step0.dispatchId', max: quantity } },
            ],
          },
          {
            agentKey: 'sdr',
            title: `Preparar abordagem dos novos prospects (${segment})`,
            instructions: 'Preparar a mensagem de primeira abordagem e criar a tarefa de contato para a equipe.',
            priority: 6,
            afterPrevious: true,
            steps: [
              { tool: 'drafts.write', args: { kind: 'mensagem', title: `Primeira abordagem — ${segment}`, body: prospectMessage(segment) } },
              { tool: 'tasks.create', args: { title: `Abordar os novos prospects (${segment})`, description: 'Revise o rascunho de abordagem preparado pela Equipe IA e faça o primeiro contato com os leads da etiqueta "Prospecção IA".', type: 'FOLLOW_UP', priority: 'HIGH', dueInHours: 24 } },
            ],
          },
        ],
      };
    }
    case 'meta_vendas': {
      const target = num(p.params.target) || 1;
      const conv = data['analytics.conversion'] ?? {};
      const pipe = data['pipeline.summary'] ?? {};
      const wonSoFar = num((conv.mesAtual as Data | undefined)?.vendas);
      const remaining = Math.max(target - wonSoFar, 0);
      const winRate = typeof conv.taxaDeGanho === 'number' && conv.taxaDeGanho > 0 ? conv.taxaDeGanho : 0.2;
      const leadToSale = typeof conv.conversaoLeadParaVenda === 'number' && conv.conversaoLeadParaVenda > 0 ? conv.conversaoLeadParaVenda : 0.05;
      const openOpps = num((pipe.totalAberto as Data | undefined)?.quantidade);
      const expectedFromPipeline = Math.floor(openOpps * winRate);
      const gap = Math.max(remaining - expectedFromPipeline, 0);
      const leadsNeeded = gap ? Math.min(Math.ceil(gap / leadToSale), 100) : 0;
      notes.push(
        `Meta: ${target} cliente(s) no ${p.params.period ?? 'mês'}; já fechados: ${wonSoFar}; faltam ${remaining}.`,
        `Funil atual: ${openOpps} oportunidade(s) abertas × taxa de ganho ${pct(winRate)} ≈ ${expectedFromPipeline} venda(s) esperada(s).`,
        gap ? `Lacuna de ${gap} venda(s): com conversão lead→venda de ${pct(leadToSale)}, são necessários ~${leadsNeeded} novos leads.` : 'O funil atual cobre a meta se as oportunidades forem trabalhadas: foco total em follow-up.',
      );
      const delegations: Delegation[] = [
        {
          agentKey: 'sdr',
          title: 'Acelerar oportunidades abertas',
          instructions: 'Criar follow-ups para todos os leads e oportunidades sem contato recente, priorizando os de maior valor.',
          priority: 8,
          steps: [{ tool: 'followups.schedule', args: { days: 3, max: 20, dueInHours: 24 } }],
        },
      ];
      if (leadsNeeded > 0) {
        delegations.push({
          agentKey: 'prospeccao',
          title: `Gerar ~${leadsNeeded} novos leads`,
          instructions: `Buscar ${leadsNeeded} empresas do perfil ideal e importar como leads para cobrir a lacuna da meta.`,
          priority: 7,
          steps: [
            { tool: 'n8n.prospect_search', args: { segment: 'pousadas e hotéis', quantity: leadsNeeded } },
            { tool: 'leads.import_prospects', args: { dispatchId: '$step0.dispatchId', max: leadsNeeded } },
          ],
        });
        delegations.push({
          agentKey: 'marketing',
          title: 'Campanha de apoio à meta do mês',
          instructions: 'Rascunhar uma campanha curta para gerar demanda no segmento-alvo.',
          priority: 5,
          steps: [
            {
              tool: 'drafts.write',
              args: {
                kind: 'campanha',
                title: `Campanha — meta de ${target} cliente(s)`,
                body: `Objetivo: gerar ${leadsNeeded} leads qualificados no período.\nCanais sugeridos: Instagram (3 posts + stories com depoimento), WhatsApp (lista de transmissão para leads frios) e e-mail para a base.\nMensagem central: "Atendimento centralizado e com IA para não perder nenhuma reserva."\nChamada: agendar demonstração de 15 minutos.\nRevisar e aprovar antes de publicar.`,
              },
            },
          ],
        });
      }
      return { delegations, planNotes: notes };
    }
    case 'followups':
      notes.push('O agente Comercial criará follow-ups para os leads sem contato recente que ainda não têm retorno agendado.');
      return {
        planNotes: notes,
        delegations: [
          {
            agentKey: 'sdr',
            title: 'Agendar follow-ups pendentes',
            instructions: 'Criar tarefas de follow-up para os leads sem interação há 3 dias ou mais.',
            priority: 7,
            steps: [{ tool: 'followups.schedule', args: { days: 3, max: 15, dueInHours: 24 } }],
          },
        ],
      };
    case 'pipeline': {
      const stale = ((data['pipeline.summary'] ?? {}).paradas as unknown[] | undefined)?.length ?? 0;
      if (!stale) return { delegations: [], planNotes: ['Nenhuma oportunidade parada há mais de 14 dias.'] };
      notes.push(`${stale} oportunidade(s) parada(s): o agente Comercial criará follow-ups para destravá-las.`);
      return {
        planNotes: notes,
        delegations: [
          {
            agentKey: 'sdr',
            title: 'Destravar oportunidades paradas',
            instructions: 'Criar follow-ups para leads com oportunidades sem movimentação há mais de 14 dias.',
            priority: 6,
            steps: [{ tool: 'followups.schedule', args: { days: 14, max: 10, dueInHours: 48 } }],
          },
        ],
      };
    }
    default:
      return { delegations: [], planNotes: notes };
  }
}

function list(items: string[], empty: string) {
  return items.length ? items.map((i) => `- ${i}`).join('\n') : `- ${empty}`;
}

/** Relatório do CEO (modo determinístico) a partir dos dados lidos. */
export function composeReport(p: DetectedPlaybook, data: Record<string, Data>, planNotes: string[], delegations: Delegation[]): string {
  const sections: string[] = [];
  const overview = data['company.overview'];
  const pipe = data['pipeline.summary'];
  const follow = data['leads.needing_followup'];
  const waiting = data['conversations.waiting'] as unknown as Data[] | undefined;
  const conv = data['analytics.conversion'];
  const approvals = data['approvals.pending'] as unknown as Data[] | undefined;
  const fin = data['finance.overview'];

  if (overview) {
    const opp = (overview.oportunidadesAbertas ?? {}) as Data;
    const won = (overview.vendasGanhas ?? {}) as Data;
    sections.push(
      `## Resumo (últimos 30 dias)\n` +
        list(
          [
            `${num(overview.novosLeads)} novos leads; ${num(overview.leadsEmAndamento)} em andamento`,
            `${num(opp.count)} oportunidade(s) abertas (${formatMoney(num(opp.value))})`,
            `${num(won.count)} venda(s) ganha(s) (${formatMoney(num(won.value))}); taxa de ganho ${pct(overview.taxaDeGanho)}`,
            `${num(overview.conversasAguardandoResposta)} conversa(s) aguardando resposta; ${num(overview.tarefasAtrasadas)} tarefa(s) atrasada(s)`,
            `${num(overview.compromissosProximos7Dias)} compromisso(s) nos próximos 7 dias`,
          ],
          '',
        ),
    );
  }
  if (pipe) {
    const stages = (pipe.etapas as Data[] | undefined) ?? [];
    const stale = (pipe.paradas as Data[] | undefined) ?? [];
    sections.push(
      `## Funil\n` +
        list(stages.map((s) => `${s.etapa}: ${num(s.quantidade)} (${formatMoney(num(s.valor))})`), 'Sem oportunidades abertas.') +
        `\n\nTaxa de ganho (90 dias): ${pct(pipe.taxaDeGanho90d)}.` +
        (stale.length ? `\n\n**Paradas há mais de 14 dias:**\n${list(stale.slice(0, 8).map((o) => `${o.titulo} — ${o.contato} (${o.etapa}, ${num(o.diasNaEtapa)} dias, ${formatMoney(num(o.valor))})`), '')}` : ''),
    );
  }
  if (conv) {
    sections.push(
      `## Conversão (90 dias)\n` +
        list(
          [
            `${num(conv.leadsGerados)} leads gerados; ${num(conv.vendasGanhas)} venda(s), ${num(conv.vendasPerdidas)} perdida(s)`,
            `Conversão lead→venda ${pct(conv.conversaoLeadParaVenda)}; ticket médio ${conv.ticketMedio === null ? '—' : formatMoney(num(conv.ticketMedio))}`,
            `Ciclo médio: ${conv.cicloMedioDias ?? '—'} dia(s); mês atual: ${num((conv.mesAtual as Data | undefined)?.vendas)} venda(s)`,
          ],
          '',
        ),
    );
  }
  if (follow) {
    const leads = (follow.leads as Data[] | undefined) ?? [];
    sections.push(
      `## Leads que precisam de follow-up\n` +
        list(leads.slice(0, 12).map((l) => `${l.nome} — ${l.status}, ${num(l.diasSemContato)} dia(s) sem contato${(l.oportunidade as Data | null)?.titulo ? ` (oportunidade: ${(l.oportunidade as Data).titulo})` : ''}`), 'Nenhum lead parado.') +
        `\n\n${num(follow.followupsAtrasados)} follow-up(s) atrasado(s).`,
    );
  }
  if (waiting && Array.isArray(waiting)) {
    sections.push(`## Conversas aguardando resposta\n${list(waiting.slice(0, 8).map((c) => `${c.contato} (${c.canal}) — aguardando há ${c.horasAguardando ?? '?'} h`), 'Nenhuma conversa aguardando.')}`);
  }
  if (p.key === 'prioridades') {
    const overdue = (data['tasks.list#overdue'] as unknown as Data[] | undefined) ?? [];
    const today = (data['tasks.list#today'] as unknown as Data[] | undefined) ?? [];
    const prios: string[] = [];
    if (approvals?.length) prios.push(`Decidir ${approvals.length} aprovação(ões) pendente(s) da Equipe IA`);
    if (waiting?.length) prios.push(`Responder ${waiting.length} cliente(s) aguardando (mais antigo: ${waiting[0]?.contato})`);
    if (overdue.length) prios.push(`Resolver ${overdue.length} tarefa(s) atrasada(s): ${overdue.slice(0, 3).map((t) => t.titulo).join('; ')}`);
    const stale = ((pipe?.paradas as Data[] | undefined) ?? []).slice(0, 3);
    if (stale.length) prios.push(`Destravar oportunidades paradas: ${stale.map((o) => o.titulo).join('; ')}`);
    if (today.length) prios.push(`Executar ${today.length} tarefa(s) de hoje`);
    sections.unshift(`## Prioridades sugeridas (em ordem)\n${prios.length ? prios.map((x, i) => `${i + 1}. ${x}`).join('\n') : '1. Sem pendências críticas: foco em prospecção e relacionamento.'}`);
  }
  if (fin) {
    const r = (fin.receitaGanhaNoMes ?? {}) as Data;
    sections.push(`## Financeiro\n${list([`Receita ganha no mês: ${formatMoney(num(r.valor))} (${num(r.vendas)} venda(s))`, `Custo estimado da Equipe IA no mês: US$ ${num(fin.custoEquipeIaNoMesUsd).toFixed(2)}`], '')}`);
  }
  if (approvals && Array.isArray(approvals) && approvals.length && p.key !== 'prioridades') {
    sections.push(`## Aprovações pendentes\n${list(approvals.slice(0, 5).map((a) => String(a.resumo)), '')}`);
  }
  if (planNotes.length || delegations.length) {
    sections.push(
      `## Plano\n${list(planNotes, '')}` +
        (delegations.length ? `\n\n**Delegado para a equipe:**\n${list(delegations.map((d) => `${d.agentKey}: ${d.title}${d.afterPrevious ? ' (após a etapa anterior)' : ''}`), '')}` : ''),
    );
  }
  if (p.key === 'geral') {
    sections.push(`## Comandos que posso executar\n${list(['Analise minha empresa hoje', 'Quais leads precisam follow-up?', 'Quero prospectar 30 pousadas em Gramado', 'Quero 5 clientes este mês', 'Organize prioridades', 'Analise meu pipeline'], '')}`);
  }
  return sections.join('\n\n') || 'Sem dados suficientes para o relatório.';
}
