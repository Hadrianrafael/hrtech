import { describe, expect, it } from 'vitest';
import { decrypt, decryptJson, encrypt, encryptJson, hmacSha256Hex, safeEqual, sha256 } from '@/lib/crypto';

describe('crypto', () => {
  it('cifra e decifra (AES-256-GCM) com IV aleatório', () => {
    const a = encrypt('token-secreto');
    const b = encrypt('token-secreto');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe('token-secreto');
    expect(decryptJson<{ x: number }>(encryptJson({ x: 1 }))).toEqual({ x: 1 });
  });

  it('rejeita conteúdo adulterado', () => {
    const parts = encrypt('valor').split('.');
    parts[3] = Buffer.from('adulterado').toString('base64url');
    expect(() => decrypt(parts.join('.'))).toThrow();
  });

  it('hash e comparação em tempo constante', () => {
    expect(sha256('a')).toHaveLength(64);
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(hmacSha256Hex('k', 'm')).toMatch(/^[a-f0-9]{64}$/);
  });
});
