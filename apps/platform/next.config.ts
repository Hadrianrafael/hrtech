import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Projeto independente dentro do monorepo do site: evita que o Next use o lockfile da raiz.
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  serverExternalPackages: ['@prisma/client', 'nodemailer', 'imapflow', 'mailparser', 'bcryptjs'],
  async headers() {
    return [
      // O widget e as APIs públicas são consumidos por sites de clientes (CORS tratado nas rotas).
      { source: '/((?!widget.js|api/public).*)', headers: securityHeaders },
    ];
  },
};

export default nextConfig;
