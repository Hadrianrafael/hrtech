import type { Metadata } from 'next';
import type { ChatbotForm } from '@/app/actions/ai';
import { ChatbotConfig } from '@/components/ai/chatbot-config';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { env } from '@/lib/env';
import { isAiConfigured } from '@/server/ai/provider';
import type { BusinessHours, HandoffRules } from '@/server/ai/agent';

export const metadata: Metadata = { title: 'Chatbot e IA' };

export default async function ChatbotPage() {
  const ctx = await requirePageContext('chatbot.manage');
  const bot = await ctx.db.chatbot.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!bot) return null;
  const hours = (bot.businessHours ?? {}) as BusinessHours;
  const rules = (bot.handoffRules ?? {}) as HandoffRules;
  const initial: ChatbotForm = {
    name: bot.name,
    enabled: bot.enabled,
    mode: bot.mode,
    greeting: bot.greeting,
    tone: bot.tone,
    instructions: bot.instructions,
    collectFields: bot.collectFields,
    channels: bot.channels,
    handoffKeywords: (rules.keywords ?? []).join(', '),
    maxAiTurns: rules.maxAiTurns ?? 0,
    handoffMessage: rules.message ?? '',
    hoursEnabled: !!hours.enabled,
    timezone: hours.timezone ?? ctx.org.timezone,
    days: Object.fromEntries((['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((d) => [d, hours.days?.[d] ?? null])) as ChatbotForm['days'],
    outOfHoursMessage: hours.outOfHoursMessage ?? '',
    faq: Array.isArray(bot.faq) ? (bot.faq as { q: string; a: string }[]) : [],
    allowedOrigins: bot.allowedOrigins,
    widgetColor: bot.widgetColor,
    widgetPosition: bot.widgetPosition === 'left' ? 'left' : 'right',
  };
  return (
    <div>
      <PageHeader title="Chatbot e IA" description="Configure o assistente virtual que atende no site, WhatsApp e Instagram." />
      <ChatbotConfig initial={initial} publicKey={bot.publicKey} appUrl={env.appUrl()} aiConfigured={isAiConfigured()} />
    </div>
  );
}
