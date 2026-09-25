import {
  siAnthropic,
  siDocker,
  siFastapi,
  siGit,
  siGithub,
  siGithubactions,
  siGoogleanalytics,
  siInstagram,
  siJavascript,
  siMongodb,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPrisma,
  siPython,
  siReact,
  siRedis,
  siResend,
  siShopify,
  siStripe,
  siTailwindcss,
  siTypescript,
  siVite,
  siVitest,
  siWhatsapp,
} from 'simple-icons';

/**
 * Logos oficiais via Simple Icons (licença CC0). Marcas cujo uso de logo não
 * é liberado no pacote (ex.: Microsoft Azure, AWS, OpenAI) são exibidas com
 * um monograma neutro no componente TechBadge.
 */
export const techIcons = {
  anthropic: siAnthropic,
  docker: siDocker,
  fastapi: siFastapi,
  git: siGit,
  github: siGithub,
  githubactions: siGithubactions,
  googleanalytics: siGoogleanalytics,
  instagram: siInstagram,
  javascript: siJavascript,
  mongodb: siMongodb,
  nestjs: siNestjs,
  nextjs: siNextdotjs,
  node: siNodedotjs,
  postgresql: siPostgresql,
  prisma: siPrisma,
  python: siPython,
  react: siReact,
  redis: siRedis,
  resend: siResend,
  shopify: siShopify,
  stripe: siStripe,
  tailwind: siTailwindcss,
  typescript: siTypescript,
  vite: siVite,
  vitest: siVitest,
  whatsapp: siWhatsapp,
} as const;

export type TechIconKey = keyof typeof techIcons;
