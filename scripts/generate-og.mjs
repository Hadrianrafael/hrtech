#!/usr/bin/env node
/**
 * Gera as imagens de compartilhamento (Open Graph, 1200×630) dos idiomas em inglês e espanhol,
 * seguindo o layout da `public/og.png` em português (que não é alterada).
 *
 * Uso: `node scripts/generate-og.mjs` — grava `public/og-en-us.png` e `public/og-es-es.png`.
 * A fonte vem do sistema (Inter, quando instalada); revise as imagens após regenerar.
 */
import sharp from 'sharp';

const variants = {
  'og-en-us': {
    line1: 'Software that',
    line2: 'moves your business.',
    sub: 'Websites · Custom software · SaaS · AI chatbots · Automation',
  },
  'og-es-es': {
    line1: 'Tecnología que',
    line2: 'impulsa tu negocio.',
    sub: 'Webs · Software a medida · SaaS · Chatbots con IA · Automatización',
  },
};

const font = "Inter, 'Helvetica Neue', Arial, sans-serif";

const svg = ({ line1, line2, sub }) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="80%" cy="0%" r="75%">
      <stop offset="0" stop-color="#F97316" stop-opacity="0.55"/>
      <stop offset="0.55" stop-color="#C2410C" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#060910" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#060910"/><stop offset="1" stop-color="#120d09"/></linearGradient>
    <linearGradient id="mark" x1="8" y1="2" x2="50" y2="38" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FDBA74"/><stop offset="0.55" stop-color="#F97316"/><stop offset="1" stop-color="#C2410C"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="8" x2="10" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#F87171"/><stop offset="1" stop-color="#DC2626"/></linearGradient>
    <linearGradient id="headline" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE9D2"/><stop offset="1" stop-color="#FDBA74"/></linearGradient>
    <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M120 0H0V120" fill="none" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(116 76) scale(1.95)">
    <g stroke="url(#accent)" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="8" x2="10" y2="8"/><line x1="1" y1="20" x2="10" y2="20"/><line x1="4" y1="32" x2="10" y2="32"/></g>
    <g fill="url(#accent)"><circle cx="2" cy="8" r="1.5"/><circle cx="1.5" cy="20" r="1.5"/><circle cx="4" cy="32" r="1.5"/></g>
    <g fill="url(#mark)"><rect x="10" y="4" width="6" height="32" rx="2"/><rect x="26" y="4" width="6" height="32" rx="2"/><rect x="10" y="17" width="22" height="6" rx="2"/><rect x="32" y="4" width="15" height="16" rx="8"/></g>
    <path d="M34 20 47 36" stroke="url(#mark)" stroke-width="6" stroke-linecap="round"/>
  </g>
  <text x="116" y="352" font-family="${font}" font-size="90" font-weight="700" letter-spacing="-4" fill="#FFFFFF">${line1}</text>
  <text x="116" y="440" font-family="${font}" font-size="90" font-weight="700" letter-spacing="-4" fill="url(#headline)">${line2}</text>
  <text x="118" y="500" font-family="${font}" font-size="29" fill="#9DA9BC">${sub}</text>
  <text x="118" y="572" font-family="${font}" font-size="24" font-weight="700" letter-spacing="1.5" fill="#EEF2F8">HR TECH SISTEMAS</text>
</svg>`;

for (const [name, text] of Object.entries(variants)) {
  await sharp(Buffer.from(svg(text))).png({ compressionLevel: 9 }).toFile(`public/${name}.png`);
  console.log(`public/${name}.png`);
}
