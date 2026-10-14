#!/usr/bin/env node
/**
 * Verificação do site estático gerado (`out/`), sem dependências.
 *
 * Confere, em cada página dos três idiomas:
 *   - `<html lang>` correto para o idioma do caminho;
 *   - título e descrição presentes e únicos;
 *   - canonical autorreferente;
 *   - hreflang completo, com a própria página e RECÍPROCO (se A aponta para B, B aponta para A);
 *   - um único <h1>;
 *   - JSON-LD válido (e perguntas do FAQPage presentes no texto visível);
 *   - imagens com `alt`;
 *   - links internos e âncoras (#) que realmente existem;
 *   - sitemap, robots.txt e llms.txt coerentes com as páginas.
 *
 * Uso: `node scripts/verify-build.mjs [pasta]` (padrão: out). Sai com código 1 se houver erro.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.argv[2] ?? 'out';
const SITE = 'https://hrtechsistemas.com.br';
const LOCALES = { 'pt-BR': '', 'en-US': 'en-us', 'es-ES': 'es-es' };
const NOINDEX_SEGMENTS = new Set(['privacidade', 'termos', 'privacy-policy', 'terms-of-use', 'politica-de-privacidad', 'terminos-de-uso']);

const errors = [];
const warnings = [];
const fail = (page, message) => errors.push(`${page}: ${message}`);
const warn = (page, message) => warnings.push(`${page}: ${message}`);

if (!existsSync(root)) {
  console.error(`Pasta "${root}" não encontrada. Rode "pnpm build" primeiro.`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? (name === '_next' ? [] : walk(path)) : [path];
  });
}

const files = walk(root);
const htmlFiles = files.filter((file) => file.endsWith('index.html'));
const urlPathOf = (file) => {
  const rel = relative(root, file).split(sep).join('/').replace(/index\.html$/, '');
  return `/${rel}`;
};
const localeOfPath = (path) => {
  if (path.startsWith('/en-us/') || path === '/en-us/') return 'en-US';
  if (path.startsWith('/es-es/') || path === '/es-es/') return 'es-ES';
  return 'pt-BR';
};

const pages = new Map(); // urlPath -> { html, locale, file }
for (const file of htmlFiles) {
  const path = urlPathOf(file);
  if (path === '/404/') continue; // artefato da página de erro
  pages.set(path, { html: readFileSync(file, 'utf8'), locale: localeOfPath(path), file });
}

// Atributos HTML não diferenciam maiúsculas (o Next emite `hrefLang`, por exemplo).
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];
const decode = (text) => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const stripTags = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));

const info = new Map();
for (const [path, { html, locale }] of pages) {
  const tags = (name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((match) => match[0]);
  const links = tags('link');
  const metas = tags('meta');
  const noindex = metas.some((tag) => attr(tag, 'name') === 'robots' && /noindex/.test(attr(tag, 'content') ?? ''));
  info.set(path, {
    title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''),
    description: decode(metas.map((tag) => (attr(tag, 'name') === 'description' ? attr(tag, 'content') : undefined)).find(Boolean) ?? ''),
    canonical: links.map((tag) => (attr(tag, 'rel') === 'canonical' ? attr(tag, 'href') : undefined)).find(Boolean),
    alternates: Object.fromEntries(links.filter((tag) => attr(tag, 'rel') === 'alternate' && attr(tag, 'hreflang')).map((tag) => [attr(tag, 'hreflang'), attr(tag, 'href')])),
    noindex,
    locale,
  });
}

// ── por página ────────────────────────────────────────────────────────────────────────────────
const seenTitles = new Map();
const seenDescriptions = new Map();
for (const [path, { html, locale }] of pages) {
  const data = info.get(path);
  const url = `${SITE}${path}`;

  const lang = html.match(/<html[^>]*\slang="([^"]*)"/)?.[1];
  if (lang !== locale) fail(path, `<html lang="${lang}"> deveria ser "${locale}"`);

  if (!data.title) fail(path, 'sem <title>');
  else {
    if (data.title.length > 90) fail(path, `título longo demais (${data.title.length} caracteres)`);
    else if (data.title.length > 75) warn(path, `título com ${data.title.length} caracteres (pode ser truncado)`);
    if (seenTitles.has(data.title)) fail(path, `título repetido em ${seenTitles.get(data.title)}`);
    seenTitles.set(data.title, path);
  }
  if (!data.description) fail(path, 'sem meta description');
  else {
    if (data.description.length > 330) warn(path, `meta description com ${data.description.length} caracteres`);
    if (seenDescriptions.has(data.description)) fail(path, `meta description repetida em ${seenDescriptions.get(data.description)}`);
    seenDescriptions.set(data.description, path);
  }

  if (data.canonical !== url) fail(path, `canonical "${data.canonical}" deveria ser "${url}"`);

  const lastSegment = path.split('/').filter(Boolean).pop() ?? '';
  const shouldBeNoindex = NOINDEX_SEGMENTS.has(lastSegment);
  if (data.noindex !== shouldBeNoindex) fail(path, shouldBeNoindex ? 'deveria ser noindex' : 'está noindex, mas deveria ser indexável');

  if (!data.noindex) {
    const alt = data.alternates;
    for (const code of ['pt-BR', 'pt', 'en-US', 'en', 'es-ES', 'es', 'x-default']) if (!alt[code]) fail(path, `hreflang "${code}" ausente`);
    if (!Object.values(alt).includes(url)) fail(path, 'hreflang não lista a própria página');
    for (const [code, href] of Object.entries(alt)) {
      const targetPath = href?.replace(SITE, '');
      const target = targetPath && info.get(targetPath);
      if (!target) fail(path, `hreflang "${code}" aponta para página inexistente (${href})`);
      else if (!Object.values(target.alternates).includes(url)) fail(path, `hreflang "${code}" → ${targetPath} não é recíproco`);
      else if (code !== 'x-default' && localeOfPath(targetPath) !== (code.startsWith('pt') ? 'pt-BR' : code.startsWith('en') ? 'en-US' : 'es-ES')) {
        fail(path, `hreflang "${code}" aponta para uma página de outro idioma (${targetPath})`);
      }
    }
  }

  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1Count !== 1) fail(path, `${h1Count} elementos <h1> (esperado: 1)`);

  const visibleText = stripTags(html);
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const schemas = [];
  for (const block of ldBlocks) {
    try {
      schemas.push(JSON.parse(block));
    } catch {
      fail(path, 'JSON-LD inválido');
    }
  }
  const flat = schemas.flatMap((schema) => schema['@graph'] ?? [schema]);
  if (!flat.some((node) => [].concat(node['@type']).includes('ProfessionalService'))) fail(path, 'sem Organization/ProfessionalService');
  if (path !== '/' && path !== '/en-us/' && path !== '/es-es/' && !flat.some((node) => node['@type'] === 'BreadcrumbList')) fail(path, 'sem BreadcrumbList');
  for (const node of flat.filter((item) => item['@type'] === 'FAQPage')) {
    for (const question of node.mainEntity ?? []) {
      if (!visibleText.includes(question.name)) fail(path, `FAQPage cita pergunta que não está visível: "${question.name}"`);
      if (!visibleText.includes(question.acceptedAnswer.text)) fail(path, `FAQPage cita resposta que não está visível: "${question.name}"`);
    }
  }
  for (const node of flat) {
    if (['Review', 'AggregateRating'].includes(node['@type']) || node.aggregateRating || node.review) fail(path, 'dados estruturados de avaliação (não temos avaliações reais)');
  }

  for (const img of html.match(/<img\b[^>]*>/g) ?? []) if (attr(img, 'alt') === undefined) fail(path, `<img> sem alt: ${img.slice(0, 80)}`);

  const og = [...html.matchAll(/<meta property="(og:[^"]+)" content="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]);
  const ogImage = og.find(([key]) => key === 'og:image')?.[1];
  if (!ogImage) fail(path, 'sem og:image');
  else if (!existsSync(join(root, ogImage.replace(SITE, '')))) fail(path, `og:image não existe em out/: ${ogImage}`);
  const ogLocale = og.find(([key]) => key === 'og:locale')?.[1];
  if (ogLocale !== locale.replace('-', '_')) fail(path, `og:locale "${ogLocale}" não corresponde a ${locale}`);

  // links internos e âncoras
  for (const [, href] of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)) {
    const target = decode(href);
    if (/^(mailto:|tel:|https?:|\/\/)/.test(target) || target.startsWith('/_next/')) continue;
    const [rawPath, hash] = target.split('#');
    const targetPath = rawPath === '' ? path : rawPath.split('?')[0];
    const key = targetPath.endsWith('/') ? targetPath : `${targetPath}/`;
    const page = pages.get(key);
    const isFile = existsSync(join(root, targetPath)) && statSync(join(root, targetPath)).isFile();
    if (!page && !isFile) {
      fail(path, `link interno quebrado: ${target}`);
      continue;
    }
    if (hash && page && !new RegExp(`\\sid="${hash}"`).test(page.html)) fail(path, `âncora inexistente: ${target}`);
    if (page && localeOfPath(key) !== locale && !/hreflang=/i.test(html.match(new RegExp(`<a\\b[^>]*href="${href}"[^>]*>`))?.[0] ?? '')) {
      fail(path, `link interno para outro idioma sem hreflang: ${target}`);
    }
  }
}

// ── sitemap, robots, llms.txt ─────────────────────────────────────────────────────────────────
const sitemap = existsSync(join(root, 'sitemap.xml')) ? readFileSync(join(root, 'sitemap.xml'), 'utf8') : '';
if (!sitemap) fail('sitemap.xml', 'ausente');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const indexable = [...pages.keys()].filter((path) => !info.get(path).noindex);
for (const path of indexable) if (!sitemapUrls.includes(`${SITE}${path}`)) fail('sitemap.xml', `não lista ${path}`);
for (const url of sitemapUrls) {
  const path = url.replace(SITE, '');
  if (!pages.has(path)) fail('sitemap.xml', `lista página inexistente: ${url}`);
  else if (info.get(path).noindex) fail('sitemap.xml', `lista página noindex: ${url}`);
}
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap.xml', 'URLs duplicadas');
if (/<lastmod>/.test(sitemap)) warn('sitemap.xml', 'contém <lastmod>; confira se as datas são reais');

const robots = existsSync(join(root, 'robots.txt')) ? readFileSync(join(root, 'robots.txt'), 'utf8') : '';
if (!/^Sitemap: https:\/\/hrtechsistemas\.com\.br\/sitemap\.xml$/m.test(robots)) fail('robots.txt', 'sem a linha Sitemap');
if (/^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'bloqueia o site inteiro');
for (const agent of ['Googlebot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'PerplexityBot']) {
  if (!new RegExp(`User-Agent: ${agent}\\nAllow: /`, 'i').test(robots)) fail('robots.txt', `sem regra explícita para ${agent}`);
}

if (existsSync(join(root, 'llms.txt'))) {
  const llms = readFileSync(join(root, 'llms.txt'), 'utf8');
  for (const url of [...llms.matchAll(/\((https:\/\/hrtechsistemas\.com\.br[^)]*)\)/g)].map((match) => match[1])) {
    const target = url.replace(SITE, '');
    if (!pages.has(target) && !existsSync(join(root, target))) fail('llms.txt', `link para página inexistente: ${url}`);
  }
}
if (!existsSync(join(root, '404.html'))) fail('404.html', 'ausente');

// ── resultado ─────────────────────────────────────────────────────────────────────────────────
const perLocale = Object.fromEntries(Object.keys(LOCALES).map((locale) => [locale, [...pages.values()].filter((page) => page.locale === locale).length]));
console.log(`Páginas verificadas: ${pages.size} (${Object.entries(perLocale).map(([locale, count]) => `${locale}: ${count}`).join(', ')})`);
console.log(`URLs no sitemap: ${sitemapUrls.length}`);
for (const message of warnings) console.warn(`AVISO  ${message}`);
for (const message of errors) console.error(`ERRO   ${message}`);
console.log(errors.length ? `\n${errors.length} erro(s).` : '\nVerificação concluída sem erros.');
process.exit(errors.length ? 1 : 0);
