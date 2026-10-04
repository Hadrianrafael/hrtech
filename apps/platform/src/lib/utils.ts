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
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function formatPhone(digits: string | null | undefined): string {
  if (!digits) return '';
  const m = digits.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : `+${digits}`;
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
