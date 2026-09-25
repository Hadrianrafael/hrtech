const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** Prefixa caminhos de arquivos de `public/` com o basePath (quando houver). */
export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}

/** URL absoluta dentro do domínio oficial (SEO, Open Graph, sitemap). */
export function absoluteUrl(siteUrl: string, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl.replace(/\/$/, '')}${clean}`;
}
