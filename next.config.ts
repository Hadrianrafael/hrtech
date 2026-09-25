import type { NextConfig } from 'next';

/**
 * Exportação 100% estática (pasta `out/`) para publicação no GitHub Pages
 * com domínio próprio (ver CNAME). `NEXT_PUBLIC_BASE_PATH` só é necessário
 * se o site for servido em um subdiretório (ex.: usuario.github.io/repo).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
