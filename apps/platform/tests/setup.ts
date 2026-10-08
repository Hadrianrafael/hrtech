/**
 * Configuração dos testes. Testes de integração usam TEST_DATABASE_URL (banco dedicado, migrado com
 * `prisma migrate deploy`). Sem banco disponível, apenas os testes unitários são executados.
 */
import { existsSync, readFileSync } from 'node:fs';

function loadDotEnv() {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, '');
  }
}

loadDotEnv();
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.AUTH_SECRET ||= 'test-secret-test-secret-test-secret-123';
process.env.ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString('base64');
process.env.META_APP_SECRET ||= 'test-meta-secret';
process.env.APP_URL ||= 'http://localhost:3000';
// Garante que nenhum teste chame provedores externos reais.
delete process.env.OPENAI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;
delete process.env.AI_PROVIDER;
delete process.env.N8N_BASE_URL;
delete process.env.N8N_WEBHOOK_SECRET;
delete process.env.SMTP_HOST;
