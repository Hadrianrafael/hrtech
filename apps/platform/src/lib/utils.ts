import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Normaliza telefone para apenas dígitos com DDI (padrão Brasil quando ausente). */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, '');
  if (!digits) return null;
  // "+" ou "00" na frente = número já no formato internacional (ex.: wa_id do WhatsApp): não supõe Brasil.
  const international = input.trim().startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!international && (digits.length === 10 || digits.length === 11)) digits = `55${digits}`;
  // Celular brasileiro no formato antigo (sem o 9º dígito), comum no wa_id do WhatsApp: 55 + DDD + 8 dígitos
  // iniciando em 6–9 → insere o 9, para casar com o número digitado em formulários. Fixos (2–5) não mudam.
  const old = digits.match(/^55([1-9]{2})([6-9]\d{7})$/);
  if (old) digits = `55${old[1]}9${old[2]}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function formatPhone(digits: string | null | undefined): string {
  if (!digits) return '';
  const m = digits.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : `+${digits}`;
}

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/** Fuso IANA aceito pelo runtime (um valor inválido derrubaria Intl.DateTimeFormat com RangeError). */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 60) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(...candidates: unknown[]): string {
  return (candidates.find(isValidTimeZone) as string | undefined) ?? DEFAULT_TIMEZONE;
}

export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  return v.includes('@') ? v : null;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase() || '?';
}

/**
 * Converte valores monetários digitados ou extraídos (pt-BR e formatos comuns) em número.
 * "1.500,50" → 1500.5 · "1500,5" → 1500.5 · "1500.50" → 1500.5 · "2,500.00" → 2500 · "1.500" → 1500 · "R$ 300" → 300
 */
export function parseMoney(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  let v = input.replace(/R\$|\s/gi, '').trim();
  if (!v) return null;
  if (!/^-?[\d.,]+$/.test(v)) return null;
  const lastComma = v.lastIndexOf(',');
  const lastDot = v.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // O separador que aparece por último é o decimal.
    v = lastComma > lastDot ? v.replace(/\./g, '').replace(',', '.') : v.replace(/,/g, '');
  } else if (lastComma >= 0) {
    v = v.replace(/,/g, (m, i) => (i === lastComma ? '.' : ''));
  } else if (lastDot >= 0 && !/^-?\d+\.\d{1,2}$/.test(v)) {
    v = v.replace(/\./g, ''); // "1.500" / "1.500.000": pontos de milhar
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Formata número para campo de edição em pt-BR, sem separador de milhar (ex.: 1500.5 → "1500,50"). */
export function moneyInputValue(n: number | null | undefined): string {
  return n === null || n === undefined ? '' : n.toFixed(2).replace('.', ',');
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatMoney(value: number | string | { toString(): string } | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value.toString());
  return Number.isFinite(n) ? brl.format(n) : '—';
}

export function truncate(value: string, max = 80): string {
  return value.length > max ? value.slice(0, max - 1) + '…' : value;
}

export function currentPeriod(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(typeof v === 'object' ? String(v) : v);
  return Number.isFinite(n) ? n : 0;
}
