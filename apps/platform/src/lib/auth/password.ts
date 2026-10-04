import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(128, 'Senha muito longa.')
  .regex(/[A-Za-z]/, 'A senha deve conter letras.')
  .regex(/\d/, 'A senha deve conter números.');

const ROUNDS = process.env.VITEST ? 4 : 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return bcrypt.compare(password, '$2b$04$invalidinvalidinvalidinOq7cS1Jc5VxC9N0f3bK1t3XGq3m8yG'); // tempo constante
  return bcrypt.compare(password, hash);
}
