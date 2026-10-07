import { z } from 'zod';
import { isValidTimeZone, parseMoney } from './utils';

/** Helpers de validação para formulários (strings vazias viram undefined/null). */
export const optionalString = (max = 500) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v === undefined || v === null || v.trim() === '' ? null : v.trim()));

export const requiredString = (label: string, max = 200) =>
  z.string({ required_error: `${label} é obrigatório.` }).trim().min(1, `${label} é obrigatório.`).max(max);

export const optionalEmail = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v.trim().toLowerCase() : null))
  .refine((v) => v === null || z.string().email().safeParse(v).success, 'E-mail inválido.');

export const optionalId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() !== '' ? v : null));

export const optionalMoney = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === '') return null;
    const n = parseMoney(v);
    if (n === null || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor inválido.' });
      return z.NEVER;
    }
    return n;
  });

export const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data inválida.' });
      return z.NEVER;
    }
    return d;
  });

export const checkbox = z
  .union([z.literal('on'), z.literal('true'), z.literal('false'), z.boolean()])
  .optional()
  .transform((v) => v === 'on' || v === 'true' || v === true);

export const stringArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : v === '' ? [] : [v]));

export const timeZoneSchema = z.string().trim().max(60).refine(isValidTimeZone, 'Fuso horário inválido.');
