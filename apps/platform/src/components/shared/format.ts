import { formatDistanceToNowStrict, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function timeAgo(date: Date | string | null | undefined) {
  if (!date) return '—';
  return formatDistanceToNowStrict(new Date(date), { locale: ptBR, addSuffix: true });
}

export function fmtDate(date: Date | string | null | undefined, pattern = "dd/MM/yyyy") {
  if (!date) return '—';
  return format(new Date(date), pattern, { locale: ptBR });
}

export function fmtDateTime(date: Date | string | null | undefined) {
  return fmtDate(date, "dd/MM/yyyy 'às' HH:mm");
}

export function pct(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : `${(v * 100).toFixed(1).replace('.', ',')}%`;
}

export function duration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1).replace('.', ',')} h`;
  return `${(seconds / 86400).toFixed(1).replace('.', ',')} dias`;
}
