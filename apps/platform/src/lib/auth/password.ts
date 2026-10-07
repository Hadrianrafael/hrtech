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

let dummyHash: string | null = null;

/** Compara a senha; sem hash (usuário inexistente) compara com um hash de mesmo custo para não revelar a existência pelo tempo. */
export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) {
    dummyHash ??= await bcrypt.hash('hrtech-dummy-password-for-constant-time', ROUNDS);
    await bcrypt.compare(password, dummyHash);
    return false;
  }
  return bcrypt.compare(password, hash);
}
