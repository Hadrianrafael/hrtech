'use client';

import { fmtDate, fmtDateTime, timeAgo } from './format';

/** Data formatada no fuso do navegador, sem alerta de hidratação (servidor e cliente podem diferir). */
export function Time({ date, mode = 'ago', pattern }: { date: string | Date | null | undefined; mode?: 'ago' | 'datetime' | 'date'; pattern?: string }) {
  if (!date) return <span>—</span>;
  const text = mode === 'ago' ? timeAgo(date) : mode === 'datetime' ? fmtDateTime(date) : fmtDate(date, pattern);
  return (
    <time dateTime={new Date(date).toISOString()} suppressHydrationWarning>
      {text}
    </time>
  );
}
